import { z } from 'zod';

export const CreateBusinessSchema = z.object({
    name: z.string().min(1, 'Invoice number is required'),
    address: z.string().min(1, 'userId is required'),
    industry: z.string().min(1, 'Name is required'),
    phone: z.string()
        .min(10, 'Phone number is too short')
        .max(15, 'Phone number is too long')
        .regex(/^\d+$/, 'Phone number must contain only digits'),
    email: z.string()
        .min(1, 'Name is required')
        .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invaild email format')
});

export type CreateBusinessDTO = z.infer<typeof CreateBusinessSchema>;

// Partial for updates
export const UpdateBusinessSchema = CreateBusinessSchema.partial();
export type UpdateBusinessDTO = z.infer<typeof UpdateBusinessSchema>;