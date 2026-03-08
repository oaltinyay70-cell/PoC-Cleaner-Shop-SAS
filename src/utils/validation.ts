import { z } from 'zod';

/**
 * Shared validation schemas used across routes.
 * Centralized to avoid duplication (DRY principle).
 */

export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const uuidSchema = z.string().uuid('Invalid ID format');

export const phoneSchema = z.string()
    .min(5, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number format');

export const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
});

export const channelSchema = z.enum(['WHATSAPP', 'VIBER', 'SMS', 'NONE']);
export const jobStatusSchema = z.enum(['RECEIVED', 'PROCESSING', 'COMPLETED', 'DELIVERED']);
export const expenseCategorySchema = z.enum(['SUPPLIES', 'FUEL', 'RENT', 'UTILITIES', 'MARKETING', 'OTHER']);

/**
 * Validate and return parsed data, or throw a structured error.
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        throw new ValidationError(errors);
    }
    return result.data;
}

export class ValidationError extends Error {
    constructor(public readonly errors: string[]) {
        super(`Validation failed: ${errors.join(', ')}`);
        this.name = 'ValidationError';
    }
}
