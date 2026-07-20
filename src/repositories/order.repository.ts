import prisma from '../lib/prisma';
import { PrismaClient, Prisma, order } from '../generated/prisma/client';

type Client = PrismaClient | Prisma.TransactionClient;

export class OrderRepository {
    constructor(private readonly client: Client = prisma) { }

    async findById(id: string): Promise<order | null> {
        return this.client.order.findUnique({ where: { id } });
    }

    async findManyByBusiness(businessId: string): Promise<order[]> {
        return this.client.order.findMany({
            where: { businessId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(data: Prisma.orderCreateInput): Promise<order> {
        return this.client.order.create({ data });
    }
}

export default new OrderRepository();