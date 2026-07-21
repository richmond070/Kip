import { errorHandler } from './middlewares/errorHandler';
import express from 'express';
import { orderTransactions } from './routes/orderTransaction.router'
import { businessRouter } from './routes/business.router'
import { productRouter } from './routes/product.router'

const app = express();

app.use(express.json());

// Routes
app.use('/api/v1/business', businessRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1', orderTransactions);
app.get("/", async (req: express.Request, res: express.Response) => {
    try {
        res.send(
            "Welcome to unit testing guide for nodejs, typescript and express!"
        );
    } catch (err) {
        console.log(err);
    }
});

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;