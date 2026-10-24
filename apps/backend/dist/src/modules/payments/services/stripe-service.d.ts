export interface CreatePaymentIntentParams {
    amountPennies: number;
    customerEmail: string;
    orderId: string;
    shippingPostcode: string;
    deliveryTier: string;
    metadata?: Record<string, string>;
}
export interface PaymentIntentResult {
    clientSecret: string;
    paymentIntentId: string;
    amountPennies: number;
    currency: "gbp";
    formattedAmount: string;
    supportedPaymentMethods: string[];
}
export declare class StripePaymentService {
    private stripeSecretKey?;
    constructor(stripeSecretKey?: string);
    /**
     * Create a Stripe UK PaymentIntent with support for Cards, Klarna Pay in 3, and Clearpay
     */
    createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
}
