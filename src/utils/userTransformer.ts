import { CreateUserDTO } from '../dtos/userDTO';
import { IUser } from '../models/user.model';

export class UserTransformer {
    static toDocument(dto: CreateUserDTO): IUser {
        return {
            name: dto.name,
            phone: Number(dto.phone),
            role: dto.role
        };
    }
}