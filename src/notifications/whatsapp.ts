import { NotificationAdapter, NotificationResult } from './adapter';

/**
 * WhatsApp notification adapter.
 * In production: integrates with WhatsApp Business API.
 * MVP: logs the message and returns success.
 */
export class WhatsAppAdapter implements NotificationAdapter {
    readonly channel = 'WHATSAPP';

    constructor(private apiKey: string) {
        if (!apiKey) {
            console.warn('[WhatsApp] No API key configured — messages will be logged only');
        }
    }

    async send(to: string, message: string): Promise<NotificationResult> {
        try {
            // TODO: Replace with actual WhatsApp Business API call
            // POST https://graph.facebook.com/v18.0/{phone_id}/messages
            // Headers: Authorization: Bearer {apiKey}
            // Body: { messaging_product: "whatsapp", to, type: "text", text: { body: message } }

            console.log(`[WhatsApp] → ${to}: ${message.substring(0, 50)}...`);

            return {
                success: true,
                messageId: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            };
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown WhatsApp API error';
            console.error(`[WhatsApp] Failed to send to ${to}: ${error}`);
            return { success: false, error };
        }
    }
}
