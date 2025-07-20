import { CreateTransactionDTO, UpdateTransactionDTO } from "../dtos/transactionDTO";
import Transaction from '../models/transaction.model';
import Order from '../models/order.model';
import mongoose, { ClientSession } from 'mongoose';

export class TransactionService {
    // CREATE TRANSACTION (explicit call)
    async createTransactionForOrder(
        orderId: string,
        amount: number,
        type: string = 'income',
        session?: any
    ): Promise<any> {
        const sessionToUse = session || await mongoose.startSession();
        if (!session) sessionToUse.startTransaction();

        try {
            // const order = await Order.exists({ _id: orderId }).session(sessionToUse);
            const order = await Order.exists({ _id: orderId, session: sessionToUse });

            if (!order) throw new Error('Order not found');

            const existing = await Transaction.findOne({ orderId, session:sessionToUse });
            if (existing) throw new Error('Transaction already exists')

            // const existing = await Transaction.findOne({ orderId }).session(sessionToUse);
            // if (existing) throw new Error('Transaction already exists');

            const transaction = await Transaction.create([{
                type,
                orderId,
                amount,
                date: new Date()
            }], { session: sessionToUse });

            if (!session) await sessionToUse.commitTransaction();
            return transaction[0];
        } catch (error) {
            if (!session) await sessionToUse.abortTransaction();
            throw error;
        } finally {
            if (!session) sessionToUse.endSession();
        }
    }

    // UPDATE TRANSACTION AMOUNT (explicit call)
    async updateTransactionForOrder(
        orderId: string,
        newAmount: number,
        session?: any
    ) {
        const sessionToUse = session || await mongoose.startSession();
        if (!session) sessionToUse.startTransaction();

        try {
            const updated = await Transaction.findOneAndUpdate(
                { orderId },
                {
                    amount: newAmount,
                    date: new Date()
                },
                { new: true, session: sessionToUse }
            );

            if (!updated) {
                throw new Error('No transaction found for this order');
            }

            if (!session) await sessionToUse.commitTransaction();
            return updated;
        } catch (error) {
            if (!session) await sessionToUse.abortTransaction();
            throw error;
        } finally {
            if (!session) sessionToUse.endSession();
        }
    }

    async findTransaction(query: { transactionId?: string, orderId?: string }) {
        if (query.transactionId) {
            return Transaction.findById(query.transactionId);
        }
        if (query.orderId) {
            return Transaction.findOne({ orderId: query.orderId });
        }
        return null;
    }

    // async findTransactionByBusiness(query: { transactionId?: string, orderId?: string }) {
    //     if (query.transactionId) {
    //         return Transaction.findById(query.transactionId);
    //     }
    //     if (query.orderId) {
    //         return Transaction.findOne({ orderId: query.orderId });
    //     }
    //     return null;
    // }

    async deleteTransactionForOrder(orderId: string, session?: any) {
        const sessionToUse = session || await mongoose.startSession();
        if (!session) sessionToUse.startTransaction();

        try {
            const result = await Transaction.deleteOne({ orderId }, { session: sessionToUse });

            if (result.deletedCount === 0) {
                throw new Error('No transaction found for this order');
            }

            if (!session) await sessionToUse.commitTransaction();
            return { success: true, orderId };
        } catch (error) {
            if (!session) await sessionToUse.abortTransaction();
            throw error;
        } finally {
            if (!session) sessionToUse.endSession();
        }
    }

    // Keep the existing deleteTransaction by ID method
    async deleteTransaction(transactionId: string) {
        const transaction = await Transaction.findByIdAndDelete(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return { success: true, transactionId };
    }
}