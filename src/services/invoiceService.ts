import { CreateInvoiceDTO, UpdateInvoiceDTO } from "../dtos/invoiceDTO";
import Transaction from '../models/transaction.model';
import Order from '../models/order.model';
import Invoice from '../models/invoice.model';
import User from '../models/user.model';

export class InoviceService {
    // CREATE AN INVOICE
    async createInvoice(dto: CreateInvoiceDTO) {
        const invoice = new Invoice({
            invoiceNumber: dto.invoiceNumber,
            transactionId: dto.transactionId,
            userId: dto.userId,
            dueDate: dto.dueDate
        });

        return await invoice.save();
    }

    // FIND INVOICE PER USER 
    async findInvoicePerUser(query: { phone?: string, name?: string }) {
        const user = await User.findOne(query)
        if (!user) return [];

        return Invoice.find({ userId: user._id })
    }

    // DELETE AN INVOICE
    async deleteInvoice(invoiceId: string) {
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) throw new Error("Invoice number not found.");

        const transactionId = invoice.transactionId;

        // check if associated transaction exist 
        if (transactionId) throw new Error("Cannot delete transaction: corresponding order still exists.")

        await Invoice.findByIdAndDelete(invoiceId);
        return "Invoice deleted because associated order does not exist.";
    }

    // FIND INVOICE PER BUSINESS 
}