import User from '../models/user.model';
import { CreateUserDTO, UpdateUserDTO } from '../dtos/userDTO';
import { UserTransformer } from '../utils/userTransformer';

export class UserService {
    // 1. Create a new user
    async createUser(dto: CreateUserDTO) {
        const userData = UserTransformer.toDocument(dto);
        const user = new User(userData);
        return await user.save();
    }

    // 2. Delete a user by ID
    async deleteUserById(userId: string) {
        const result = await User.findByIdAndDelete(userId);
        if (!result) throw new Error('User not found');
        return result;
    }

    // 3. Find a user by phone OR name
    async findUserByPhoneOrName(value: string) {
        const query = isNaN(Number(value))
            ? { name: new RegExp(value, 'i') } // case-insensitive name search
            : { phone: Number(value) };

        const user = await User.findOne(query);
        if (!user) throw new Error('User not found');
        return user;
    }

    // 4. Update user phone by ID
    async updateUserPhone(userId: string, newPhone: string) {
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { phone: Number(newPhone) },
            { new: true }
        );
        if (!updatedUser) throw new Error('User not found or update failed');
        return updatedUser;
    }
}
