import mongoose, { Document, Schema } from 'mongoose';

export interface IUser {
    name: string;
    phone: number;
    role: 'customer' | 'vendor';
    // businessId: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    phone: { type: Number, required: true },
    role: { type: String, enum: ['customer', 'vendor'] },
    // businessId: { type: Schema.Types.ObjectId, ref: 'Business', required: true }
}, { timestamps: true });

export default mongoose.model<IUser>('User', userSchema);
