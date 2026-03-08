import { NotificationAdapter, NotificationResult } from './adapter';

/**
 * Viber notification adapter.
 * In production: integrates with Viber Bot API.
 * MVP: logs the message and returns success.
 */
export class ViberAdapter implements NotificationAdapter {
    readonly channel = 'VIBER';

    constructor(private apiKey: string) {
        if (!apiKey) {
            console.warn('[Viber] No API key configured — messages will be logged only');
        }
    }

    async send(to: string, message: string): Promise<NotificationResult> {
        try {
            // TODO: Replace with Viber Bot API call
            // POST https://chatapi.viber.com/pa/send_message
            // Headers: X-Viber-Auth-Token: {apiKey}

            console.log(`[Viber] → ${to}: ${message.substring(0, 50)}...`);

            return {
                success: true,
                messageId: `vib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            };
        } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown Viber API error';
            console.error(`[Viber] Failed to send to ${to}: ${error}`);
            return { success: false, error };
        }
    }
}
