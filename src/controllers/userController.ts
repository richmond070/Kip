import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { CreateUserSchema, UpdateUserSchema } from '../dtos/userDTO';

export class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    createUser = async (req: Request, res: Response) => {
        const parse = CreateUserSchema.safeParse(req.body);
        if (!parse.success) {
            return res.status(400).json({ error: parse.error.flatten() });
        }

        try {
            const newUser = await this.userService.createUser(parse.data);
            return res.status(201).json(newUser);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    };

    deleteUser = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deletedUser = await this.userService.deleteUserById(id);
            return res.status(200).json(deletedUser);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    };

    findUser = async (req: Request, res: Response) => {
        try {
            const { query } = req.params;
            const user = await this.userService.findUserByPhoneOrName(query);
            return res.status(200).json(user);
        } catch (error: any) {
            return res.status(404).json({ error: error.message });
        }
    };

    updatePhone = async (req: Request, res: Response) => {
        const parse = UpdateUserSchema.safeParse(req.body);
        if (!parse.success || !parse.data.phone) {
            return res.status(400).json({ error: 'New phone number is required.' });
        }

        try {
            const { id } = req.params;
            const updatedUser = await this.userService.updateUserPhone(id, parse.data.phone);
            return res.status(200).json(updatedUser);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    };
}
