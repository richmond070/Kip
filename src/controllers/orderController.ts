// controllers/OrderController.ts

import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { CreateOrderSchema, UpdateOrderSchema } from '../dtos/orderDTO';

const orderService = new OrderService();

export class OrderController {
    async createOrder(req: Request, res: Response) {
        try {
            const parsed = CreateOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const order = await orderService.createOrder(parsed.data);
            return res.status(201).json({ success: true, data: order });
        } catch (err) {
            console.error('Error creating order:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async updateOrder(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const parsed = UpdateOrderSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, errors: parsed.error.flatten() });
            }

            const updated = await orderService.updateOrder(id, parsed.data);
            if (!updated) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            return res.status(200).json({ success: true, data: updated });
        } catch (err) {
            console.error('Error updating order:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async deleteOrder(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deleted = await orderService.deleteOrder(id);

            if (!deleted) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            return res.status(200).json({ success: true, message: 'Order deleted' });
        } catch (err) {
            console.error('Error deleting order:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getOrdersByUser(req: Request, res: Response) {
        try {
            const { phone, name } = req.query;

            if (!phone && !name) {
                return res.status(400).json({ success: false, message: 'Phone or name required' });
            }

            const orders = await orderService.getOrdersByUser({
                phone: phone as string,
                name: name as string,
            });

            return res.status(200).json({ success: true, data: orders });
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async getOrdersByDate(req: Request, res: Response) {
        try {
            const { date } = req.query;
            if (!date) {
                return res.status(400).json({ success: false, message: 'Date is required' });
            }

            const dateObj = new Date(date as string);
            if (isNaN(dateObj.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date format' });
            }

            const orders = await orderService.getOrdersByDate(dateObj);
            return res.status(200).json({ success: true, data: orders });
        } catch (err) {
            console.error('Error fetching orders:', err);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}
