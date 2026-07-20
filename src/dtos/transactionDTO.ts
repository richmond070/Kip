import { z } from 'zod';

// Transaction = a ledger entry. Sales generate one automatically from an
// Order; purchases/expenses are recorded directly with no Order at all
// (see kip_bookkeeping_flow.png) — hence productId/orderId are optional.
export const CreateTransactionSchema = z.object({
    businessId: z.string().min(1, 'businessId is required'),
    type: z.enum(['sale', 'purchase', 'expense'], {
        required_error: 'type is required',
        invalid_type_error: 'type must be one of: sale, purchase, expense',
    }),
    direction: z.enum(['in', 'out'], {
        required_error: 'direction is required',
        invalid_type_error: 'direction must be either in or out',
    }),
    amount: z.number().nonnegative('Amount must be non-negative'),
    productId: z.string().optional(),
    orderId: z.string().optional(),
    description: z.string().optional(),
});

export type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;

// Partial for updates
export const UpdateTransactionSchema = CreateTransactionSchema.partial();
export type UpdateTransactionDTO = z.infer<typeof UpdateTransactionSchema>;

// A purchase restocks a Product, so it needs a quantity — Transaction
// itself has no quantity field, only `amount` (the cost). This is the
// input shape for transactionService.recordPurchase, distinct from the
// generic ledger schema above.
export const RecordPurchaseSchema = z.object({
    businessId: z.string().min(1, 'businessId is required'),
    productId: z.string().min(1, 'productId is required'),
    quantity: z.number().positive('Quantity must be greater than zero'),
    amount: z.number().nonnegative('Amount must be non-negative'),
    description: z.string().optional(),
});

export type RecordPurchaseDTO = z.infer<typeof RecordPurchaseSchema>;

// A plain expense (rent, a delivery fee) touches neither stock nor a
// Product — see kip_bookkeeping_flow.png's "Stock increases — only for
// purchases."
export const RecordExpenseSchema = z.object({
    businessId: z.string().min(1, 'businessId is required'),
    amount: z.number().nonnegative('Amount must be non-negative'),
    productId: z.string().optional(),
    description: z.string().optional(),
});

export type RecordExpenseDTO = z.infer<typeof RecordExpenseSchema>;
