import prisma from '../lib/prisma';
import { PrismaClient, Prisma, jwtSecret } from '../generated/prisma/client';

type Client = PrismaClient | Prisma.TransactionClient;

export class JwtSecretRepository {
    constructor(private readonly client: Client = prisma) { }

    // Current signing key = highest version.
    async findLatest(): Promise<jwtSecret | null> {
        return this.client.jwtSecret.findFirst({ orderBy: { version: 'desc' } });
    }

    // Current + previous key, for verifyToken's grace-period check.
    async findLatestTwo(): Promise<jwtSecret[]> {
        return this.client.jwtSecret.findMany({
            orderBy: { version: 'desc' },
            take: 2,
        });
    }

    async create(data: { key: string; version: number }): Promise<jwtSecret> {
        return this.client.jwtSecret.create({ data });
    }
}

export default new JwtSecretRepository();
