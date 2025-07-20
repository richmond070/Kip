import { Document, Types } from 'mongoose';
import { IOrder } from '../models/order.model';
import { ITransaction } from '../models/transaction.model';

export type OrderDocument = Document<unknown, {}, IOrder> &
    IOrder & {
        _id: Types.ObjectId
    };

export type TransactionDocument = Document<unknown, {}, ITransaction> &
    ITransaction & {
        _id: Types.ObjectId
    };