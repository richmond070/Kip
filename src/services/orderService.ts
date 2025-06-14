// services/OrderService.ts

import Order from '../models/order.model';
import User from '../models/user.model';
import Transaction from '../models/transaction.model';
import { CreateOrderDTO } from '../dtos/orderDTO';
import { ObjectId } from 'mongodb';

export class OrderService {
    async createOrder(dto: CreateOrderDTO) {
        let user = await User.findOne({ phone: dto.customerPhone });

        if (!user) {
            user = new User({ phone: dto.customerPhone });
            await user.save();
        }

        const order = new Order({
            name: dto.name,
            description: dto.description,
            price: dto.price,
            quantity: dto.quantity,
            category: dto.category,
            customerId: user._id,
            createdAt: new Date(),
        });

        const savedOrder = await order.save();

        await Transaction.create({
            amount: dto.price * dto.quantity,
            date: new Date(),
            orderId: savedOrder._id,
        });

        return savedOrder;
    }

    // UPDATE AN ORDER
    async updateOrder(id: string, updates: Partial<CreateOrderDTO>) {
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (updatedOrder) {
            const transaction = await Transaction.findOne({ orderId: updatedOrder._id });
            if (transaction) {
                transaction.amount = updatedOrder.price * updatedOrder.quantity;
                transaction.date = new Date();
                await transaction.save();
            }
        }

        return updatedOrder;
    }

    //DELETE AN ORDER
    async deleteOrder(id: string) {
        await Transaction.deleteOne({ orderId: id });
        return Order.findByIdAndDelete(id);
    }

    // GET ORDERS BY USER
    async getOrdersByUser(query: { phone?: string; name?: string }) {
        const user = await User.findOne(query);
        if (!user) return [];

        return Order.find({ customerId: user._id });
    }

    // GET ORDERS BY DATE
    async getOrdersByDate(date: Date) {
        const start = new Date(date.setHours(0, 0, 0, 0));
        const end = new Date(date.setHours(23, 59, 59, 999));
        return Order.find({ createdAt: { $gte: start, $lte: end } });
    }
}
