/**
 * Notification adapter interface.
 * Each channel (WhatsApp, SMS, Viber) implements this interface.
 * Strategy pattern — services call send() without knowing the channel.
 */
export interface NotificationAdapter {
    readonly channel: string;
    send(to: string, message: string): Promise<NotificationResult>;
}

export interface NotificationResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Factory to get the correct adapter for a channel.
 */
import { WhatsAppAdapter } from './whatsapp';
import { SmsAdapter } from './sms';
import { ViberAdapter } from './viber';

export function getAdapter(channel: string, apiKey: string): NotificationAdapter {
    switch (channel) {
        case 'WHATSAPP': return new WhatsAppAdapter(apiKey);
        case 'SMS': return new SmsAdapter(apiKey);
        case 'VIBER': return new ViberAdapter(apiKey);
        default:
            throw new Error(`Unsupported notification channel: ${channel}`);
    }
}
