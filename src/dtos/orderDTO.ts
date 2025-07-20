import { z } from 'zod';

export const CreateOrderSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().nonnegative('Price must be non-negative'),
    quantity: z.number().nonnegative('Quantity must be non-negative'),
    category: z.string().optional(),
    customerPhone: z.string().min(10, 'Phone number is too short').max(15, 'Phone number is too long'),
    customerId: z.string().min(1, 'Customer ID is required')
});

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

// Partial for updates
export const UpdateOrderSchema = CreateOrderSchema.partial();
export type UpdateOrderDTO = z.infer<typeof UpdateOrderSchema>;