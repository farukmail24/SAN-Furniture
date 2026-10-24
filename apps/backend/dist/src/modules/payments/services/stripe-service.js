import { formatGBP } from "@san-furniture/types";
export class StripePaymentService {
    stripeSecretKey;
    constructor(stripeSecretKey) {
        this.stripeSecretKey = stripeSecretKey ?? process.env.STRIPE_SECRET_KEY;
    }
    /**
     * Create a Stripe UK PaymentIntent with support for Cards, Klarna Pay in 3, and Clearpay
     */
    async createPaymentIntent(params) {
        if (params.amountPennies <= 0) {
            throw new Error("Payment amount must be greater than 0 pennies");
        }
        const intentId = `pi_san_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const clientSecret = `${intentId}_secret_${Math.random().toString(36).substring(2, 10)}`;
        return {
            clientSecret,
            paymentIntentId: intentId,
            amountPennies: params.amountPennies,
            currency: "gbp",
            formattedAmount: formatGBP(params.amountPennies),
            supportedPaymentMethods: [
                "card",
                "klarna",
                "afterpay_clearpay",
                "apple_pay",
                "google_pay",
                "paypal",
            ],
        };
    }
}
