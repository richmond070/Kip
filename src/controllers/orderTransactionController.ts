import { Request, Response } from 'express';
import orderService from '../services/orderService';
import transactionService from '../services/transactionService';
import { CreateOrderSchema, UpdateOrderSchema } from '../dtos/orderDTO';

export class OrderTransactionController {
    async createOrderWithTransaction(req: Request, res: Response) {
        const parse = CreateOrderSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            // Order + its ledger Transaction are created atomically inside
            // orderService.createSale — no separate second call needed here.
            const { order, transaction } = await orderService.createSale(parse.data);
            res.status(201).json({ order, transaction });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    async updateOrderWithTransaction(req: Request, res: Response) {
        const parse = UpdateOrderSchema.safeParse(req.body);
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const { orderId } = req.params;
            const { order, transaction } = await orderService.updateOrder(orderId, parse.data);
            res.status(200).json({ order, transaction });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    async deleteOrderWithTransaction(req: Request, res: Response) {
        try {
            const { orderId } = req.params;
            const { deletedOrder } = await orderService.deleteOrder(orderId);
            res.status(200).json({ deletedOrder });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    // Independent operations
    async getOrder(req: Request, res: Response) {
        try {
            const order = await orderService.getOrderById(req.params.id);
            res.status(200).json(order);
        } catch (error) {
            const err = error as Error;
            res.status(404).json({ error: err.message });
        }
    }

    async getTransaction(req: Request, res: Response) {
        try {
            const transaction = await transactionService.getTransactionById(req.params.id);
            res.status(200).json(transaction);
        } catch (error) {
            const err = error as Error;
            res.status(404).json({ error: err.message });
        }
    }
}
