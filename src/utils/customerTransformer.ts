import { CreateCustomerDTO } from '../dtos/customerDTO';
import { ICustomer } from '../models/customer.model';

export class CustomerTransformer {
    static toDocument(dto: CreateCustomerDTO): Partial<ICustomer> {
        return {
            name: dto.name,
            phone: Number(dto.phone),
            role: dto.role,
            savedOrders: []
        };
    }
}