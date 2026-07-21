import { Request, Response } from 'express';
import orderService from '../services/orderService';
import transactionService from '../services/transactionService';
import { CreateOrderSchema, UpdateOrderSchema } from '../dtos/orderDTO';
import { RecordPurchaseSchema, RecordExpenseSchema } from '../dtos/transactionDTO';

export class OrderTransactionController {
    async createOrderWithTransaction(req: Request, res: Response) {
        const businessId = (req as any).user.businessId as string;
        // businessId always comes from the token, never the request body —
        // overriding whatever (if anything) the client sent for it.
        const parse = CreateOrderSchema.safeParse({ ...req.body, businessId });
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
            const businessId = (req as any).user.businessId as string;
            const { orderId } = req.params;
            const { order, transaction } = await orderService.updateOrder(orderId, businessId, parse.data);
            res.status(200).json({ order, transaction });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    async deleteOrderWithTransaction(req: Request, res: Response) {
        try {
            const businessId = (req as any).user.businessId as string;
            const { orderId } = req.params;
            const { deletedOrder } = await orderService.deleteOrder(orderId, businessId);
            res.status(200).json({ deletedOrder });
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    // Independent operations
    async getOrder(req: Request, res: Response) {
        try {
            const businessId = (req as any).user.businessId as string;
            const order = await orderService.getOrderById(req.params.id, businessId);
            res.status(200).json(order);
        } catch (error) {
            const err = error as Error;
            res.status(404).json({ error: err.message });
        }
    }

    async getTransaction(req: Request, res: Response) {
        try {
            const businessId = (req as any).user.businessId as string;
            const transaction = await transactionService.getTransactionById(req.params.id, businessId);
            res.status(200).json(transaction);
        } catch (error) {
            const err = error as Error;
            res.status(404).json({ error: err.message });
        }
    }

    async listOrders(req: Request, res: Response) {
        const businessId = (req as any).user.businessId as string;
        const orders = await orderService.getOrdersByBusiness(businessId);
        res.status(200).json(orders);
    }

    async listTransactions(req: Request, res: Response) {
        const businessId = (req as any).user.businessId as string;
        const transactions = await transactionService.getTransactionsByBusiness(businessId);
        res.status(200).json(transactions);
    }

    // "Record purchase or expense" — restock (recordPurchase) and the plain
    // expense (recordExpense) branches from kip_bookkeeping_flow.png. These
    // never touch Order, unlike the sale flow above.
    async recordPurchase(req: Request, res: Response) {
        const businessId = (req as any).user.businessId as string;
        const parse = RecordPurchaseSchema.safeParse({ ...req.body, businessId });
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const transaction = await transactionService.recordPurchase(parse.data);
            res.status(201).json(transaction);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }

    async recordExpense(req: Request, res: Response) {
        const businessId = (req as any).user.businessId as string;
        const parse = RecordExpenseSchema.safeParse({ ...req.body, businessId });
        if (!parse.success) {
            res.status(400).json({ error: parse.error.flatten() });
            return;
        }

        try {
            const transaction = await transactionService.recordExpense(parse.data);
            res.status(201).json(transaction);
        } catch (error) {
            const err = error as Error;
            res.status(400).json({ error: err.message });
        }
    }
}