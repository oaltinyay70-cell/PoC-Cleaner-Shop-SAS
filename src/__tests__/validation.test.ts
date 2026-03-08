import { describe, it, expect } from 'vitest';
import {
    emailSchema, passwordSchema, phoneSchema, uuidSchema,
    paginationSchema, channelSchema, jobStatusSchema,
    validate, ValidationError,
} from '../utils/validation';

describe('Validation Schemas', () => {
    describe('emailSchema', () => {
        it('should accept valid emails', () => {
            expect(emailSchema.parse('user@example.com')).toBe('user@example.com');
            expect(emailSchema.parse('a.b+c@domain.co.uk')).toBe('a.b+c@domain.co.uk');
        });

        it('should reject invalid emails', () => {
            expect(() => emailSchema.parse('not-an-email')).toThrow();
            expect(() => emailSchema.parse('')).toThrow();
            expect(() => emailSchema.parse('@domain.com')).toThrow();
        });
    });

    describe('passwordSchema', () => {
        it('should accept passwords >= 8 chars', () => {
            expect(passwordSchema.parse('12345678')).toBe('12345678');
            expect(passwordSchema.parse('a-very-long-password-here')).toBe('a-very-long-password-here');
        });

        it('should reject passwords < 8 chars', () => {
            expect(() => passwordSchema.parse('1234567')).toThrow();
            expect(() => passwordSchema.parse('')).toThrow();
        });
    });

    describe('phoneSchema', () => {
        it('should accept valid phone numbers', () => {
            expect(phoneSchema.parse('+1234567890')).toBe('+1234567890');
            expect(phoneSchema.parse('(555) 123-4567')).toBe('(555) 123-4567');
            expect(phoneSchema.parse('+90 532 123 45 67')).toBe('+90 532 123 45 67');
        });

        it('should reject invalid phone numbers', () => {
            expect(() => phoneSchema.parse('abc')).toThrow();
            expect(() => phoneSchema.parse('12')).toThrow(); // too short
        });
    });

    describe('paginationSchema', () => {
        it('should parse valid pagination', () => {
            const result = paginationSchema.parse({ page: '2', limit: '50' });
            expect(result.page).toBe(2);
            expect(result.limit).toBe(50);
        });

        it('should use defaults when not provided', () => {
            const result = paginationSchema.parse({});
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });

        it('should cap limit at 100', () => {
            expect(() => paginationSchema.parse({ limit: '200' })).toThrow();
        });
    });

    describe('channelSchema', () => {
        it('should accept valid channels', () => {
            expect(channelSchema.parse('WHATSAPP')).toBe('WHATSAPP');
            expect(channelSchema.parse('SMS')).toBe('SMS');
            expect(channelSchema.parse('VIBER')).toBe('VIBER');
            expect(channelSchema.parse('NONE')).toBe('NONE');
        });

        it('should reject invalid channels', () => {
            expect(() => channelSchema.parse('email')).toThrow();
            expect(() => channelSchema.parse('TELEGRAM')).toThrow();
        });
    });

    describe('validate helper', () => {
        it('should return parsed data on success', () => {
            const result = validate(emailSchema, 'test@example.com');
            expect(result).toBe('test@example.com');
        });

        it('should throw ValidationError on failure', () => {
            expect(() => validate(emailSchema, 'invalid')).toThrow(ValidationError);
        });

        it('ValidationError should contain error details', () => {
            try {
                validate(emailSchema, 'invalid');
            } catch (err) {
                expect(err).toBeInstanceOf(ValidationError);
                expect((err as ValidationError).errors.length).toBeGreaterThan(0);
            }
        });
    });
});
