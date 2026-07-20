import businessRepository from '../repositories/business.repository';
import { hashPassword, comparePassword } from '../utils/hash';
import { CreateBusinessDTO, UpdateBusinessDTO, LoginBusinessDTO } from '../dtos/businessDTO';

export class BusinessService {
    // REGISTER — phone is the natural PK, so this doubles as "does this
    // phone already have a business" check.
    async createBusiness(dto: CreateBusinessDTO) {
        const alreadyExists = await businessRepository.exists(dto.phone);
        if (alreadyExists) throw new Error('A business is already registered with this phone number.');

        const pinHash = await hashPassword(dto.pin);

        return businessRepository.create({
            phone: dto.phone,
            name: dto.name,
            currency: dto.currency,
            pinHash,
        });
    }

    // LOGIN — verify phone + PIN, return the business record on success.
    // Actual session/token issuance (JWT) stays in the auth middleware/route
    // layer, not here.
    async loginWithPhoneAndPin(dto: LoginBusinessDTO) {
        const business = await businessRepository.findByPhone(dto.phone);
        if (!business) throw new Error('No business found with this phone number.');

        const pinMatches = await comparePassword(dto.pin, business.pinHash);
        if (!pinMatches) throw new Error('Incorrect PIN.');

        return business;
    }

    async getBusinessByPhone(phone: string) {
        const business = await businessRepository.findByPhone(phone);
        if (!business) throw new Error('Business not found.');
        return business;
    }

    async updateBusiness(phone: string, updates: UpdateBusinessDTO) {
        const exists = await businessRepository.exists(phone);
        if (!exists) throw new Error('Business not found.');
        return businessRepository.update(phone, updates);
    }

    async deleteBusiness(phone: string) {
        const exists = await businessRepository.exists(phone);
        if (!exists) throw new Error('Business not found.');
        return businessRepository.delete(phone);
    }
}

export default new BusinessService();
