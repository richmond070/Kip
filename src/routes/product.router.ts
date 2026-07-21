import express from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth';

export const productRouter = express.Router();
const controller = new ProductController();

productRouter.use(authenticate);

productRouter.post('/', controller.createProduct);
productRouter.get('/', controller.listProducts);
productRouter.get('/:id', controller.getProduct);
productRouter.put('/:id', controller.updateProduct);
productRouter.delete('/:id', controller.deleteProduct);
productRouter.patch('/:id/stock', controller.adjustStock);