import mongoose, { Schema } from 'mongoose';

export interface IOrder {
    productName: string;
    description?: string;
    category?: string;
    price: number;
    quantity: number;
    date: date;
    userId: mongoose.Types.ObjectId;
}

const orderSchema = new Schema<IOrder>({
    productName: { type: String, required: true },
    description: String,
    category: String,
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', orderSchema);