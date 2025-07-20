import mongoose, { ClientSession } from 'mongoose';
import Order from '../models/order.model';
import Customer from '../models/customer.model';
import { CreateOrderDTO } from '../dtos/orderDTO';

export class OrderService {
    // CREATE ORDER (no transaction coupling)
    async createOrder(dto: CreateOrderDTO, session?: ClientSession) {
        // Fix 1: Use mongoose.startSession() instead of Order.startSession()
        const sessionToUse = session || await mongoose.startSession();
        if (!session) sessionToUse.startTransaction();

        try {
            // Fix 2: Pass session as option, not chained method
            let customer = await Customer.findOne(
                { phone: dto.customerPhone },
                null,
                { session: sessionToUse }
            );

            if (!customer) {
                customer = new Customer({ phone: dto.customerPhone });
                await customer.save({ session: sessionToUse });
            }

            const order = new Order({
                ...dto,
                customerId: customer._id
            });

            const savedOrder = await order.save({ session: sessionToUse });

            if (!session) {
                await sessionToUse.commitTransaction();
                await sessionToUse.endSession();
            }

            return {
                order: savedOrder,
                transactionData: {
                    amount: dto.price * dto.quantity,
                    orderId: savedOrder._id
                }
            };
        } catch (error) {
            if (!session) {
                await sessionToUse.abortTransaction();
                await sessionToUse.endSession();
            }
            throw error;
        }
    }

    // UPDATE ORDER (no transaction coupling)
    async updateOrder(id: string, updates: Partial<CreateOrderDTO>, session?: ClientSession) {
        // Fix 1: Use mongoose.startSession() instead of Order.startSession()
        const sessionToUse = session || await mongoose.startSession();
        if (!session) sessionToUse.startTransaction();

        try {
            const updatedOrder = await Order.findByIdAndUpdate(
                id,
                { ...updates, updatedAt: new Date() },
                {
                    new: true,
                    runValidators: true,
                    session: sessionToUse  // Fix 2: Pass session as option
                }
            );

            if (!updatedOrder) {
                throw new Error('Order not found');
            }

            if (!session) {
                await sessionToUse.commitTransaction();
                await sessionToUse.endSession();
            }

            const requiresTransactionUpdate = updates.price !== undefined || updates.quantity !== undefined;
            const newAmount = requiresTransactionUpdate ?
                (updates.price || updatedOrder.price) * (updates.quantity || updatedOrder.quantity) :
                undefined;

            return {
                order: updatedOrder,
                requiresTransactionUpdate,
                newAmount
            };
        } catch (error) {
            if (!session) {
                await sessionToUse.abortTransaction();
                await sessionToUse.endSession();
            }
            throw error;
        }
    }

    async getOrdersByUser(customerInfo: { phone?: string; customerId?: string }) {
        let customer;

        if (customerInfo.customerId) {
            // If we have customerId, we can skip customer lookup
            return await Order.find({ customerId: customerInfo.customerId });
        }

        if (customerInfo.phone) {
            customer = await Customer.findOne({ phone: customerInfo.phone });
            if (!customer) return [];
            return await Order.find({ customerId: customer._id });
        }

        return [];
    }

    async getOrdersByDate(date: Date) {
        const startDate = new Date(date.setHours(0, 0, 0, 0));
        const endDate = new Date(date.setHours(23, 59, 59, 999));

        return await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        });
    }

    async deleteOrder(id: string, session?: ClientSession) {
        // Fix 1: Use mongoose.startSession() instead of Order.startSession()
        const sessionToUse = session || await mongoose.startSession();
        if (!session) sessionToUse.startTransaction();

        try {
            const deletedOrder = await Order.findByIdAndDelete(id, {
                session: sessionToUse  // Fix 2: Pass session as option
            });

            if (!deletedOrder) {
                throw new Error('Order not found');
            }

            if (!session) {
                await sessionToUse.commitTransaction();
                await sessionToUse.endSession();
            }

            return {
                deletedOrder,
                requiresTransactionDeletion: true,
                orderId: deletedOrder._id
            };
        } catch (error) {
            if (!session) {
                await sessionToUse.abortTransaction();
                await sessionToUse.endSession();
            }
            throw error;
        }
    }
}