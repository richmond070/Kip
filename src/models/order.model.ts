import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrder extends Document {
    name: string;
    description?: string;
    category?: string;
    price: number;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    customerId: mongoose.Types.ObjectId;
}

const orderSchema = new Schema<IOrder>({
    name: { type: String, required: true },
    description: String,
    category: String,
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', orderSchema);