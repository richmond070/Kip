import { z } from 'zod';

export const CreateInvoiceSchema = z.object({
    invoiceNumber: z.string().min(1, 'Invoice number is required'),
    userId: z.string().min(1, 'userId is required'),
    transactionId: z.string().min(1, 'Name is required'),
    dueDate: z.date(),
});

export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

// Partial for updates
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();
export type UpdateInvoiceDTO = z.infer<typeof UpdateInvoiceSchema>;