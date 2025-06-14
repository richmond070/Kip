import Business from '../models/business.model';
import { CreateUserDTO, UpdateUserDTO } from '../dtos/userDTO';


export class BusinessService {
    // CREATE BUSINESS
    async createBusiness(dto: CreateUserDTO) {
        const business = new Business(dto);
        return await business.save();
    }
    //DELETE BUSINESS BY ID
    async deleteBusiness(businessId: string) {
        const result = await Business.findByIdAndDelete(businessId);
        if (!result) throw new Error('User not found');
        return result;
    }

    //UPDATE BUSINESS
    async updateBusinessName(businessId: string, newName: string) {
        const updatedName = await Business.findByIdAndUpdate(
            businessId,
            { name: String(newName) },
            { new: true }
        )
        if (!updatedName) throw new Error('User not found or update failed');
        return updatedName;
    }

    //GET BUSINESS BY ID
    async getBusinessById(businessId: string) {
        const business = Business.findById(businessId)
        return business
    }
}