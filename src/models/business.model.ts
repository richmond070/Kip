import mongoose, { Schema } from 'mongoose';

export interface IBusiness {
    name: string;
    industry?: string;
    address?: string;
    phone: string;
    email?: string;
    createdBy: mongoose.Types.ObjectId;
}

const businessSchema = new Schema<IBusiness>({
    name: { type: String, required: true },
    industry: String,
    address: String,
    phone: { type: String, require: true, unique: true },
    email: { type: String, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model<IBusiness>('Business', businessSchema);
