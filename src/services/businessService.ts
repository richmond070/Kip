import Business from '../models/business.model';
import { CreateBusinessDTO, UpdateBusinessDTO } from '../dtos/businessDTO';


export class BusinessService {
    // CREATE BUSINESS
    async createBusiness(dto: CreateBusinessDTO) {
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
    async updateBusinessName(businessId: string, updates: UpdateBusinessDTO) {
        const updatedName = await Business.findByIdAndUpdate(
            businessId,
            { ...updates },
            { new: true, runValidators: true }
        )
        if (!updatedName) throw new Error('User not found or update failed');
        return updatedName;
    }

    //GET BUSINESS BY ID
    async getBusinessById(businessId: string) {
        const business = Business.findById(businessId)
        return business
    }

    // LOGIN BUSINESS BY PHONE NUMBER AND VALIDATE THE PHONE NUMBER BY PASSING A CODE 
    async loginBusinessByPhone(phone: string) {
        const phoneNumber = await Business.findOne({ phone })
        if (!phoneNumber) throw new Error('Account not found with this phone number');
        // Here you would typically send a verification code to the phone number
        return phoneNumber;
    }
}