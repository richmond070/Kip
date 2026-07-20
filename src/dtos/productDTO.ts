import { z } from 'zod';

export const CreateProductSchema = z.object({
    businessId: z.string().min(1, 'businessId is required'),
    name: z.string().min(1, 'Name is required'),
    costPrice: z.number().nonnegative('Cost price must be non-negative'),
    sellingPrice: z.number().nonnegative('Selling price must be non-negative'),
    quantity: z.number().nonnegative('Quantity must be non-negative').default(0),
    unit: z.string().min(1, 'Unit is required'),
});

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;

// Partial for updates. businessId is excluded — a product shouldn't change
// which business owns it via a generic update.
export const UpdateProductSchema = CreateProductSchema.omit({ businessId: true }).partial();
export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;
