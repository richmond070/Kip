import { CreateTransactionDTO, UpdateTransactionDTO } from "../dtos/transactionDTO";
import Transaction from '../models/transaction.model';
import Order from '../models/order.model';


export class TransactionService {

    // CREATE A NEW TRANSACTION
    async createTransaction(dto: CreateTransactionDTO) {
        let orderId = dto.orderId;

        //match the orderId against the order 
        const order = await Order.findById(orderId);
        if (!order) throw new Error('OrderId not found');

        // checking for duplicates in the records 
        const potentialDuplicate = await Transaction.findOne({ order });
        if (potentialDuplicate) throw new Error('Potential duplicate transaction detected. A similar transaction exists in the records.');

        // Validate date
        const transactionDate = new Date(dto.date);
        if (isNaN(transactionDate.getTime())) throw new Error('Not a valid data format');

        // Calculate amount directly
        const amount = order.price * order.quantity;
        if (amount <= 0) throw new Error('Calculated transaction amount must be greater than 0')

        const transactionData = new Transaction({
            type: dto.type,
            orderId,
            amount,
            date: transactionDate
        });

        const savedTransaction = await transactionData.save();

        return savedTransaction;
    }

    // FIND A TRANSACTION BY TRANSACTION ID OR ORDER ID
    async findTransaction(query: { transactionId?: string, orderId?: string }) {
        const transaction = await Transaction.findById(query)
        if (!transaction) return [];

        return transaction;
    }

    // DELETE A TRANSACTION BY ID
    async deleteTransaction(transactionId: string) {
        const transaction = await Transaction.findById(transactionId)

        if (!transaction) {
            throw new Error("Transaction not found.")
        }

        const orderId = transaction.orderId;

        // Check if the associated order exist
        const orderExists = await Order.exists({ _id: orderId });

        if (orderExists) {
            throw new Error("Cannot delete transaction: corresponding order still exists.");
        }

        await Transaction.findByIdAndDelete(transactionId);
        return "Transaction deleted because associated order does not exist.";
    }

    // async updateTransaction(transactionId: string) {

    // }
}