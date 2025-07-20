import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { TransactionService } from '../services/transactionService';
import { OrderDocument, TransactionDocument } from '../types/mongoose.types';


export class OrderTransactionController {
    private orderService: OrderService;
    private transactionService: TransactionService;

    constructor() {
        this.orderService = new OrderService();
        this.transactionService = new TransactionService();
    }

    async createOrderWithTransaction(req: Request, res: Response) {
        try {
            // 1. Create order
            const { order, transactionData } = await this.orderService.createOrder(req.body);

            // 2. Create transaction
            const transaction = await this.transactionService.createTransactionForOrder(
                (transactionData.orderId as string | number | { toString(): string }).toString(),
                transactionData.amount,
            );

            res.status(201).json({ order, transaction });
        } catch (error) {
            const err = error as Error; // Type assertion
            res.status(400).json({ error: err.message });
        }
    }

    async updateOrderWithTransaction(req: Request, res: Response) {
        try {
            const { orderId } = req.params;
            const { order, requiresTransactionUpdate, newAmount } =
                await this.orderService.updateOrder(orderId, req.body);

            let transaction;
            if (requiresTransactionUpdate) {
                transaction = await this.transactionService.updateTransactionForOrder(
                    (order._id as { toString(): string }).toString(), // ACTUALLY CALL toString()
                    newAmount ?? 0
                );
            }

            res.status(200).json({
                order: this.toOrderResponse(order as any),
                transaction: transaction ? this.toTransactionResponse(transaction as TransactionDocument) : null
            });

            res.status(200).json({ order, transaction });
        } catch (error) {
            const err = error as Error; // Type assertion
            res.status(400).json({ error: err.message });
        }
    }

    async deleteOrderWithTransaction(req: Request, res: Response) {
        try {
            const { orderId } = req.params;
            const { deletedOrder, requiresTransactionDeletion } =
                await this.orderService.deleteOrder(orderId);

            let transactionResult;
            if (requiresTransactionDeletion) {
                transactionResult = await this.transactionService.deleteTransactionForOrder(
                    (deletedOrder._id as { toString(): string }).toString() // Type assertion to fix 'unknown'
                );
            }

            res.status(200).json({
                deletedOrder: this.toOrderResponse(deletedOrder as OrderDocument),
                transactionResult
            });
        } catch (error) {
            const err = error as Error; // Type assertion
            res.status(400).json({ error: err.message });
        }
    }

    // Independent operations
    async getOrder(req: Request, res: Response) {
        try {
            const order = await this.orderService.getOrdersByUser(req.body);
            res.status(200).json(order);
        } catch (error) {
            const err = error as Error; // Type assertion
            res.status(400).json({ error: err.message });
        }
    }

    async getTransaction(req: Request, res: Response) {
        try {
            // Change from req.params.id to proper query structure
            const transaction = await this.transactionService.findTransaction({
                transactionId: req.params.id
            });
            res.status(200).json(transaction);
        } catch (error) {
            const err = error as Error; // Type assertion
            res.status(400).json({ error: err.message });
        }
    }


    // Helper methods for consistent response formatting
    private toOrderResponse(order: OrderDocument) {
        return {
            ...order.toObject(),
            _id: order._id.toString(),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt?.toISOString()
        };
    }

    private toTransactionResponse(transaction: TransactionDocument) {
        return {
            ...transaction.toObject(),
            _id: transaction._id.toString(),
            orderId: transaction.orderId ? transaction.orderId.toString() : undefined,
            date: transaction.date.toISOString()
        };
    }
}