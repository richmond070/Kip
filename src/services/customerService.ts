import Customer from '../models/customer.model';
import { CreateCustomerDTO, UpdateCustomerDTO } from '../dtos/customerDTO';
import { CustomerTransformer } from '../utils/customerTransformer';

export class CustomerService {
    // 1. Create a new user
    async createCustomer(dto: CreateCustomerDTO) {
        const userData = CustomerTransformer.toDocument(dto);
        const user = new Customer(userData);
        return await user.save();
    }

    // 2. Delete a user by ID
    async deleteCustomerById(userId: string) {
        const result = await Customer.findByIdAndDelete(userId);
        if (!result) throw new Error('User not found');
        return result;
    }

    // 3. Find a user by phone OR name
    async findCustomerByPhoneOrName(value: string) {
        const query = isNaN(Number(value))
            ? { name: new RegExp(value, 'i') } // case-insensitive name search
            : { phone: Number(value) };

        const user = await Customer.findOne(query);
        if (!user) throw new Error('User not found');
        return user;
    }

    // 4. Update user phone by ID
    async updateCustomerPhone(userId: string, newPhone: string) {
        const updatedUser = await Customer.findByIdAndUpdate(
            userId,
            { phone: Number(newPhone) },
            { new: true }
        );
        if (!updatedUser) throw new Error('User not found or update failed');
        return updatedUser;
    }
}
