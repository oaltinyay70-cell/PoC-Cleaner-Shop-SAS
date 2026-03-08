import { NotificationAdapter, NotificationResult } from './adapter';

/**
 * SMS notification adapter.
 * In production: integrates with Twilio or similar.
 * MVP: logs the message and returns success.
 */
export class SmsAdapter implements NotificationAdapter {
    readonly channel = 'SMS';

    constructor(private apiKey: string) {
        if (!apiKey) {
            console.warn('[SMS] No API key configured — messages will be logged only');
        }
    }

    async send(to: string, message: string): Promise<NotificationResult> {
        try {
            // TODO: Replace with Twilio API call
            // client.messages.create({ body: message, from: twilioNumber, to })

            console.log(`[SMS] → ${to}: ${message.substring(0, 50)}...`);

            return {
                success: true,
                messageId: `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            };
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown SMS API error';
            console.error(`[SMS] Failed to send to ${to}: ${error}`);
            return { success: false, error };
        }
    }
}
