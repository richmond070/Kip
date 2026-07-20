import prisma from '../lib/prisma';
import { OrderRepository } from '../repositories/order.repository';
import { Prisma } from '../generated/prisma/client';
import { ProductRepository } from '../repositories/product.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import orderRepository from '../repositories/order.repository';
import productRepository from '../repositories/product.repository';
import { CreateOrderDTO, UpdateOrderDTO } from '../dtos/orderDTO';

export class OrderService {
    // CREATE SALE — an Order plus its generated Transaction, created
    // atomically along with the stock decrement. If any step fails, the
    // whole thing rolls back: no orphaned Order, no orphaned stock change.
    async createSale(dto: CreateOrderDTO) {
        const product = await productRepository.findById(dto.productId);
        if (!product) throw new Error('Product not found.');
        if (product.businessId !== dto.businessId) {
            throw new Error('Product does not belong to this business.');
        }
        if (product.quantity < dto.quantity) {
            throw new Error(`Insufficient stock: only ${product.quantity} ${product.unit} available.`);
        }

        const totalAmount = dto.quantity * dto.unitPrice;

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const orderRepo = new OrderRepository(tx);
            const productRepo = new ProductRepository(tx);
            const transactionRepo = new TransactionRepository(tx);

            const order = await orderRepo.create({
                business: { connect: { phone: dto.businessId } },
                product: { connect: { id: dto.productId } },
                quantity: dto.quantity,
                unitPrice: dto.unitPrice,
                totalAmount,
                buyerNote: dto.buyerNote,
            });

            await productRepo.decrementStock(dto.productId, dto.quantity);

            const transaction = await transactionRepo.create({
                business: { connect: { phone: dto.businessId } },
                type: 'sale',
                direction: 'in',
                amount: totalAmount,
                product: { connect: { id: dto.productId } },
                order: { connect: { id: order.id } },
                description: dto.buyerNote,
            });

            return { order, transaction };
        });
    }

    async getOrderById(id: string) {
        const order = await orderRepository.findById(id);
        if (!order) throw new Error('Order not found.');
        return order;
    }

    async getOrdersByBusiness(businessId: string) {
        return orderRepository.findManyByBusiness(businessId);
    }

    // UPDATE — quantity/unitPrice changes ripple into stock and the linked
    // Transaction's amount, so this stays atomic too. Simplification: this
    // does not currently support switching an order to a different product.
    async updateOrder(id: string, updates: UpdateOrderDTO) {
        const existing = await orderRepository.findById(id);
        if (!existing) throw new Error('Order not found.');

        const newQuantity = updates.quantity ?? existing.quantity;
        const newUnitPrice = updates.unitPrice ?? Number(existing.unitPrice);
        const quantityDelta = newQuantity - existing.quantity;
        const newTotalAmount = newQuantity * newUnitPrice;

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const orderRepo = new OrderRepository(tx);
            const productRepo = new ProductRepository(tx);
            const transactionRepo = new TransactionRepository(tx);

            if (quantityDelta !== 0) {
                if (quantityDelta > 0) {
                    const product = await productRepo.findById(existing.productId);
                    if (!product || product.quantity < quantityDelta) {
                        throw new Error('Insufficient stock to increase order quantity.');
                    }
                    await productRepo.decrementStock(existing.productId, quantityDelta);
                } else {
                    await productRepo.incrementStock(existing.productId, Math.abs(quantityDelta));
                }
            }

            const order = await tx.order.update({
                where: { id },
                data: {
                    quantity: newQuantity,
                    unitPrice: newUnitPrice,
                    totalAmount: newTotalAmount,
                    buyerNote: updates.buyerNote,
                },
            });

            const existingTransaction = await transactionRepo.findByOrderId(id);
            const transaction = existingTransaction
                ? await tx.transaction.update({
                    where: { id: existingTransaction.id },
                    data: { amount: newTotalAmount },
                })
                : null;

            return { order, transaction };
        });
    }

    // DELETE — restores stock and removes the linked Transaction (a sale
    // being deleted means it never happened, ledger-wise) before removing
    // the Order itself.
    async deleteOrder(id: string) {
        const existing = await orderRepository.findById(id);
        if (!existing) throw new Error('Order not found.');

        return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const productRepo = new ProductRepository(tx);
            const transactionRepo = new TransactionRepository(tx);

            await productRepo.incrementStock(existing.productId, existing.quantity);

            const linkedTransaction = await transactionRepo.findByOrderId(id);
            if (linkedTransaction) {
                await tx.transaction.delete({ where: { id: linkedTransaction.id } });
            }

            const deletedOrder = await tx.order.delete({ where: { id } });
            return { deletedOrder };
        });
    }
}

export default new OrderService();
