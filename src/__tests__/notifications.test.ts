import { describe, it, expect } from 'vitest';
import { getAdapter } from '../notifications/adapter';
import { WhatsAppAdapter } from '../notifications/whatsapp';
import { SmsAdapter } from '../notifications/sms';
import { ViberAdapter } from '../notifications/viber';

describe('Notification Adapters', () => {
    describe('Factory', () => {
        it('should return WhatsAppAdapter for WHATSAPP', () => {
            const adapter = getAdapter('WHATSAPP', 'test-key');
            expect(adapter).toBeInstanceOf(WhatsAppAdapter);
            expect(adapter.channel).toBe('WHATSAPP');
        });

        it('should return SmsAdapter for SMS', () => {
            const adapter = getAdapter('SMS', 'test-key');
            expect(adapter).toBeInstanceOf(SmsAdapter);
            expect(adapter.channel).toBe('SMS');
        });

        it('should return ViberAdapter for VIBER', () => {
            const adapter = getAdapter('VIBER', 'test-key');
            expect(adapter).toBeInstanceOf(ViberAdapter);
            expect(adapter.channel).toBe('VIBER');
        });

        it('should throw for unsupported channel', () => {
            expect(() => getAdapter('TELEGRAM', 'key')).toThrow('Unsupported notification channel');
            expect(() => getAdapter('EMAIL', 'key')).toThrow('Unsupported notification channel');
        });
    });

    describe('WhatsApp Adapter', () => {
        it('should send and return success with messageId', async () => {
            const adapter = new WhatsAppAdapter('test-key');
            const result = await adapter.send('+1234567890', 'Hello customer');

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(result.messageId!.startsWith('wa_')).toBe(true);
            expect(result.error).toBeUndefined();
        });
    });

    describe('SMS Adapter', () => {
        it('should send and return success with messageId', async () => {
            const adapter = new SmsAdapter('test-key');
            const result = await adapter.send('+1234567890', 'Your order is ready');

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(result.messageId!.startsWith('sms_')).toBe(true);
        });
    });

    describe('Viber Adapter', () => {
        it('should send and return success with messageId', async () => {
            const adapter = new ViberAdapter('test-key');
            const result = await adapter.send('+1234567890', 'Delivery reminder');

            expect(result.success).toBe(true);
            expect(result.messageId).toBeDefined();
            expect(result.messageId!.startsWith('vib_')).toBe(true);
        });
    });
});
