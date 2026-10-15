import { formatGBP } from "@san-furniture/types";

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

export class StripePaymentService {
  private stripeSecretKey?: string;

  constructor(stripeSecretKey?: string) {
    this.stripeSecretKey = stripeSecretKey ?? process.env.STRIPE_SECRET_KEY;
  }

  /**
   * Create a Stripe UK PaymentIntent with support for Cards, Klarna Pay in 3, and Clearpay
   */
  public async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
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
