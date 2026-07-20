import { z } from 'zod';

// Order = a sale: a Product sold in some quantity, at a point-in-time unit
// price (which may differ from Product.sellingPrice if there's a discount).
export const CreateOrderSchema = z.object({
    businessId: z.string().min(1, 'businessId is required'),
    productId: z.string().min(1, 'productId is required'),
    quantity: z.number().positive('Quantity must be greater than zero'),
    unitPrice: z.number().nonnegative('Unit price must be non-negative'),
    buyerNote: z.string().optional(),
});

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

// Partial for updates
export const UpdateOrderSchema = CreateOrderSchema.partial();
export type UpdateOrderDTO = z.infer<typeof UpdateOrderSchema>;
