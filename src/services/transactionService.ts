import prisma from '../lib/prisma';
import { ProductRepository } from '../repositories/product.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { Prisma } from '../generated/prisma/client';
import transactionRepository from '../repositories/transaction.repository';
import productRepository from '../repositories/product.repository';
import {
    CreateTransactionDTO,
    RecordPurchaseDTO,
    RecordExpenseDTO,
} from '../dtos/transactionDTO';

export class TransactionService {
    // RECORD PURCHASE — restocks a Product and logs the ledger entry
    // atomically. This is the "Record purchase or expense" -> "Stock
    // increases" path in kip_bookkeeping_flow.png; it never touches Order.
    async recordPurchase(dto: RecordPurchaseDTO) {
        const product = await productRepository.findById(dto.productId);
        if (!product) throw new Error('Product not found.');
        if (product.businessId !== dto.businessId) {
            throw new Error('Product does not belong to this business.');
        }

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const productRepo = new ProductRepository(tx);
            const transactionRepo = new TransactionRepository(tx);

            await productRepo.incrementStock(dto.productId, dto.quantity);

            return transactionRepo.create({
                business: { connect: { phone: dto.businessId } },
                type: 'purchase',
                direction: 'out',
                amount: dto.amount,
                product: { connect: { id: dto.productId } },
                description: dto.description,
            });
        });
    }

    // RECORD EXPENSE — a plain ledger entry, no stock impact, no Order.
    // (e.g. rent, a delivery fee.) productId is optional per the flow
    // diagram's "Stock increases — only for purchases."
    async recordExpense(dto: RecordExpenseDTO) {
        return transactionRepository.create({
            business: { connect: { phone: dto.businessId } },
            type: 'expense',
            direction: 'out',
            amount: dto.amount,
            product: dto.productId ? { connect: { id: dto.productId } } : undefined,
            description: dto.description,
        });
    }

    // Generic ledger create — used for anything that doesn't fit the two
    // dedicated flows above (or by tests/admin tooling).
    async createTransaction(dto: CreateTransactionDTO) {
        return transactionRepository.create({
            business: { connect: { phone: dto.businessId } },
            type: dto.type,
            direction: dto.direction,
            amount: dto.amount,
            product: dto.productId ? { connect: { id: dto.productId } } : undefined,
            order: dto.orderId ? { connect: { id: dto.orderId } } : undefined,
            description: dto.description,
        });
    }

    async getTransactionById(id: string, businessId: string) {
        const transaction = await transactionRepository.findById(id);
        if (!transaction || transaction.businessId !== businessId) {
            throw new Error('Transaction not found.');
        }
        return transaction;
    }

    async getTransactionByOrderId(orderId: string) {
        return transactionRepository.findByOrderId(orderId);
    }

    async getTransactionsByBusiness(businessId: string) {
        return transactionRepository.findManyByBusiness(businessId);
    }

    // Deleting an order-linked (sale) transaction directly would leave its
    // Order orphaned — that has to go through orderService.deleteOrder
    // instead, which handles the stock restore + linked delete atomically.
    async deleteTransaction(id: string, businessId: string) {
        const transaction = await transactionRepository.findById(id);
        if (!transaction || transaction.businessId !== businessId) {
            throw new Error('Transaction not found.');
        }
        if (transaction.orderId) {
            throw new Error('This transaction is linked to an order — delete the order instead.');
        }
        return prisma.transaction.delete({ where: { id } });
    }
}

export default new TransactionService();