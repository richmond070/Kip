import prisma from '../lib/prisma';
import { PrismaClient, Prisma, business } from '../generated/prisma/client';

type Client = PrismaClient | Prisma.TransactionClient;

export class BusinessRepository {
    constructor(private readonly client: Client = prisma) { }

    async findByPhone(phone: string): Promise<business | null> {
        return this.client.business.findUnique({ where: { phone } });
    }

    async create(data: Prisma.businessCreateInput): Promise<business> {
        return this.client.business.create({ data });
    }

    async update(phone: string, data: Prisma.businessUpdateInput): Promise<business> {
        return this.client.business.update({ where: { phone }, data });
    }

    async exists(phone: string): Promise<boolean> {
        const count = await this.client.business.count({ where: { phone } });
        return count > 0;
    }

    async delete(phone: string): Promise<business> {
        return this.client.business.delete({ where: { phone } });
    }
}

// Ready-to-use instance backed by the shared Prisma singleton.
// Tests / alternate setups can `new BusinessRepository(customClient)` instead.
export default new BusinessRepository();