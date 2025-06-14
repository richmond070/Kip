import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { asyncHandler } from '../middlewares/asyncHandler';

export const user = Router();
// const userService = new UserService();
const userController = new UserController();

user.post('/', userController.createUser);
user.delete('/:id', userController.deleteUser);
user.get('/find/:query', userController.findUser);
user.patch('/:id/phone', userController.updatePhone);

user.post('/', asyncHandler(userController.createUser.bind(userController)));
user.delete('/:id', asyncHandler(userController.deleteUser.bind(userController)));
user.get('/find/:query', asyncHandler(userController.findUser.bind(userController)));
user.patch('/:id/phone', asyncHandler(userController.updatePhone.bind(userController)));