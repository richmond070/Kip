import { z } from 'zod';

export const CreateUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string()
        .min(10, 'Phone number is too short')
        .max(15, 'Phone number is too long')
        .regex(/^\d+$/, 'Phone number must contain only digits'),
    role: z.enum(['customer', 'vendor'], {
        required_error: 'Role is required',
        invalid_type_error: 'Role must be either customer or vendor'
    })
});

export type CreateUserDTO = z.infer<typeof CreateUserSchema>;

// Partial schema for update operations
export const UpdateUserSchema = CreateUserSchema.partial();
export type UpdateUserDTO = z.infer<typeof UpdateUserSchema>;
