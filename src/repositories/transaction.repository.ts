import prisma from '../lib/prisma';
import { PrismaClient, Prisma, transaction } from '../generated/prisma/client';

export class TransactionRepository {
    constructor(private readonly client: PrismaClient = prisma) { }

    async findById(id: string): Promise<transaction | null> {
        return this.client.transaction.findUnique({ where: { id } });
    }

    async findByOrderId(orderId: string): Promise<transaction | null> {
        return this.client.transaction.findUnique({ where: { orderId } });
    }

    async findManyByBusiness(businessId: string): Promise<transaction[]> {
        return this.client.transaction.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: Prisma.transactionCreateInput): Promise<transaction> {
        return this.client.transaction.create({ data });
    }
}

export default new TransactionRepository();