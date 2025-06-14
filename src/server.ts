import app from './app';
import config from './configs/config';
import mongoose from 'mongoose';
import Logging from './utils/logging';
import { errorHandler } from './middlewares/errorHandler';

const startServer = async () => {
    try {
        await mongoose.connect(config.mongoDBUri);
        Logging.info(`Connected to MongoDB`);
        app.listen(config.port, () => {
            Logging.info(`Server running on port ${config.port}`);
        });
    } catch (err) {
        Logging.error(`Failed to start server: ${err}`);
        process.exit(1);
    }
};

startServer();
