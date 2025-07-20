// src/models/customer.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    phone: number;
    role: string;
    savedOrders: any[];
}

const customerSchema = new Schema<ICustomer>({
    name: { type: String, required: true },
    phone: { type: Number, required: true, unique: true },
    role: { type: String, required: true },
    savedOrders: [{ type: Schema.Types.Mixed }]
}, { timestamps: true });

// Make sure you're exporting the model, not just the schema
export default mongoose.model<ICustomer>('Customer', customerSchema);