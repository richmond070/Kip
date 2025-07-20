import { errorHandler } from './middlewares/errorHandler';
import express from 'express';
// import { user } from './routes/customerRouter';
import { orderTransactions } from './routes/orderTransactionRouter'

const app = express();

app.use(express.json());

// Routes
// app.use('/api/v1', user);
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