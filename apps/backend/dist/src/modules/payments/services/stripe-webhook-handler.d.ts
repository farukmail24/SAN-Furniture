export interface StripeWebhookEvent {
    id: string;
    type: string;
    created: number;
    data: {
        object: {
            id: string;
            amount: number;
            currency: string;
            status: string;
            customer_email?: string;
            metadata?: Record<string, string>;
            receipt_email?: string;
        };
    };
}
export interface WebhookProcessingResult {
    success: boolean;
    duplicate: boolean;
    eventId: string;
    actionTaken?: string;
    poNumber?: string;
    error?: string;
}
export declare class StripeWebhookHandler {
    private processedEvents;
    private webhookSecret;
    private orderDispatcher;
    private vatGenerator;
    constructor(webhookSecret?: string);
    /**
     * Verify signature of Stripe webhook payload
     */
    verifySignature(payload: string, signatureHeader: string): boolean;
    /**
     * Process incoming Stripe event with strict idempotency verification
     */
    handleEvent(event: StripeWebhookEvent): Promise<WebhookProcessingResult>;
}
