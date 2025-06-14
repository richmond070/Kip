import express from 'express';
import { OrderController } from '../controllers/orderController';
import { asyncHandler } from '../middlewares/asyncHandler';


const router = express.Router();
const orderController = new OrderController();

router.post('/', asyncHandler(orderController.createOrder.bind(orderController)));
router.put('/:id', asyncHandler(orderController.updateOrder.bind(orderController)));
router.delete('/:id', asyncHandler(orderController.deleteOrder.bind(orderController)));
router.get('/by-user', asyncHandler(orderController.getOrdersByUser.bind(orderController)));
router.get('/by-date', asyncHandler(orderController.getOrdersByDate.bind(orderController)));

export default router;



