import { z } from 'zod';

export const CreateTransactionSchema = z.object({
    type: z.enum(['income', 'expense'], {
        required_error: 'type is required',
        invalid_type_error: 'type of transaction must be either income or expense'
    }),
    amount: z.number().nonnegative('Amount must be non-negative'),
    date: z.date(),
    orderId: z.string()
});

export type CreateTransactionDTO = z.infer<typeof CreateTransactionSchema>;

// Partial for updates
export const UpdateTransactionSchema = CreateTransactionSchema.partial();
export type UpdateTransactionDTO = z.infer<typeof UpdateTransactionSchema>;