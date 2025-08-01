// import { Router } from 'express';
// import { CustomerController } from '../controllers/customerController';
// import { UserService } from '../services/customerService';
// import { asyncHandler } from '../middlewares/asyncHandler';

// export const user = Router();
// // const userService = new UserService();
// const userController = new CustomerController();

// user.post('/', userController.createUser);
// user.delete('/:id', userController.deleteUser);
// user.get('/find/:query', userController.findUser);
// user.patch('/:id/phone', userController.updatePhone);

// user.post('/', asyncHandler(userController.createUser.bind(userController)));
// user.delete('/:id', asyncHandler(userController.deleteUser.bind(userController)));
// user.get('/find/:query', asyncHandler(userController.findUser.bind(userController)));
// user.patch('/:id/phone', asyncHandler(userController.updatePhone.bind(userController)));