import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 scaffold: schema.prisma's datasource block has no inline `url`
// (that's handled by prisma.config.ts for the CLI). At runtime, though, the
// generated client doesn't read DATABASE_URL on its own — it needs an
// explicit driver adapter. This is the pg adapter, pointed at the same
// DATABASE_URL used by migrations.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Single shared PrismaClient instance for the whole app.
// Express (and Jest, in watch mode) can end up creating multiple instances
// if this is instantiated inline in services/controllers — each one opens
// its own connection pool against Postgres. Import `prisma` from here
// everywhere instead of `new PrismaClient()`.

const shouldLogQueries = process.env.DEBUG_PRISMA_QUERIES === 'true';

const prisma = new PrismaClient({
    adapter,
    log: shouldLogQueries ? ['query', 'error', 'warn'] : ['error'],
});

export default prisma;