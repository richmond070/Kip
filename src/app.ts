import express from 'express';
import { user } from './routes/userRouter';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

// Routes
app.use('/api/v1', user);

// Global error handler (should be after routes)
app.use(errorHandler);

export default app;