import express from 'express';
import { BusinessController } from '../controllers/business.controller';
import { authenticate } from '../middlewares/auth';

export const businessRouter = express.Router();
const controller = new BusinessController();

// Public
businessRouter.post('/register', controller.register);
businessRouter.post('/login', controller.login);

// Authenticated (token identifies the business — phone is never taken
// from the URL/body for these three, only from the verified token)
businessRouter.get('/me', authenticate, controller.getProfile);
businessRouter.put('/me', authenticate, controller.updateProfile);
businessRouter.delete('/me', authenticate, controller.deleteProfile);