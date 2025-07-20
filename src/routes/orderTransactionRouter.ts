import express from 'express';
import { OrderTransactionController } from '../controllers/orderTransactionController';

export const orderTransactions = express.Router();
const controller = new OrderTransactionController();

// Combined operations
orderTransactions.post('/orders-with-transaction', controller.createOrderWithTransaction);
orderTransactions.put('/orders-with-transaction/:orderId', controller.updateOrderWithTransaction);
orderTransactions.delete('/orders-with-transaction/:orderId', controller.deleteOrderWithTransaction);

// Independent operations
orderTransactions.get('/orders/:id', controller.getOrder);
orderTransactions.get('/transactions/:id', controller.getTransaction);

