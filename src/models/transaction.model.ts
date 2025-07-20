import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITransaction extends Document {
    type: 'income' | 'expense';
    amount: number;
    date: Date;
    orderId: mongoose.Types.ObjectId;
    // businessId: mongoose.Types.ObjectId;
}

const transactionSchema = new Schema<ITransaction>({
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    // businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
