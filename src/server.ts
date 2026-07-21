import config from './configs/config';
import prisma from './lib/prisma';
import Logging from './utils/logging';
import app from './app';
import { ensureJwtSecretExists } from './utils/rotateJwtKeys';
import { scheduleKeyRotation } from './scheduler/rotateScheduler';

const startServer = async () => {
    try {
        await prisma.$connect();
        Logging.info(`Connected to PostgreSQL`);

        await ensureJwtSecretExists();
        scheduleKeyRotation();

        app.listen(config.port, () => {
            Logging.info(`Server running on port ${config.port}`);
        });
    } catch (err) {
        Logging.error(`Failed to start server: ${err}`);
        process.exit(1);
    }
};

startServer();