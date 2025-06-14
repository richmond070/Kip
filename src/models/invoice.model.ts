import mongoose, { Schema } from 'mongoose';

export interface IInvoice {
    invoiceNumber: string;
    dueDate: Date;
    userId: mongoose.Types.ObjectId;
    transactionId: mongoose.Types.ObjectId;
}

const invoiceSchema = new Schema<IInvoice>({
    invoiceNumber: { type: String, required: true, unique: true },
    dueDate: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
}, { timestamps: true });

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);