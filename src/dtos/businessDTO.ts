import { z } from 'zod';

// Business = phone-authenticated tenant (natural key: phone). Matches the
// real Business model (phone, pinHash, name, currency) — the old DTO here
// referenced address/industry/email, none of which exist on the schema.
export const CreateBusinessSchema = z.object({
    phone: z.string()
        .min(10, 'Phone number is too short')
        .max(15, 'Phone number is too long')
        .regex(/^\d+$/, 'Phone number must contain only digits'),
    pin: z.string()
        .min(4, 'PIN must be at least 4 digits')
        .max(8, 'PIN must be at most 8 digits')
        .regex(/^\d+$/, 'PIN must contain only digits'),
    name: z.string().min(1, 'Name is required'),
    currency: z.string().min(1, 'Currency is required'),
});

export type CreateBusinessDTO = z.infer<typeof CreateBusinessSchema>;

// Partial for updates. `pin` is intentionally omitted here — changing a PIN
// should go through a dedicated flow, not a generic partial update.
export const UpdateBusinessSchema = CreateBusinessSchema.omit({ pin: true }).partial();
export type UpdateBusinessDTO = z.infer<typeof UpdateBusinessSchema>;

export const LoginBusinessSchema = z.object({
    phone: z.string().min(10).max(15),
    pin: z.string().min(4).max(8),
});

export type LoginBusinessDTO = z.infer<typeof LoginBusinessSchema>;
