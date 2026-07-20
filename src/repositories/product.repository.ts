import prisma from '../lib/prisma';
import { PrismaClient, Prisma, product } from '../generated/prisma/client';

type Client = PrismaClient | Prisma.TransactionClient;

export class ProductRepository {
    constructor(private readonly client: Client = prisma) { }

    async findById(id: string): Promise<product | null> {
        return this.client.product.findUnique({ where: { id } });
    }

    async findManyByBusiness(businessId: string): Promise<product[]> {
        return this.client.product.findMany({ where: { businessId } });
    }

    async create(data: Prisma.productCreateInput): Promise<product> {
        return this.client.product.create({ data });
    }

    async update(id: string, data: Prisma.productUpdateInput): Promise<product> {
        return this.client.product.update({ where: { id }, data });
    }

    // Sales decrease stock. Kept atomic via Prisma's `decrement` so concurrent
    // orders against the same product can't race each other's read-then-write.
    async decrementStock(id: string, quantity: number): Promise<product> {
        return this.client.product.update({
            where: { id },
            data: { quantity: { decrement: quantity } },
        });
    }

    // Purchases (restocks) increase stock — see kip_bookkeeping_flow.png:
    // "Stock increases — only for purchases."
    async incrementStock(id: string, quantity: number): Promise<product> {
        return this.client.product.update({
            where: { id },
            data: { quantity: { increment: quantity } },
        });
    }

    async delete(id: string): Promise<product> {
        return this.client.product.delete({ where: { id } });
    }
}

export default new ProductRepository();