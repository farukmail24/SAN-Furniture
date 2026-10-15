import crypto from "crypto";
import {
  OrderFulfillmentDispatcher,
  type PurchaseOrderRequest,
  type OrderItemDispatch,
} from "../../dropship/services/order-dispatcher.js";
import { VatInvoiceGenerator } from "../../vat/services/vat-invoice-generator.js";

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

export class StripeWebhookHandler {
  private processedEvents = new Set<string>();
  private webhookSecret: string;
  private orderDispatcher: OrderFulfillmentDispatcher;
  private vatGenerator: VatInvoiceGenerator;

  constructor(webhookSecret?: string) {
    this.webhookSecret = webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test_secret";
    this.orderDispatcher = new OrderFulfillmentDispatcher();
    this.vatGenerator = new VatInvoiceGenerator();
  }

  /**
   * Verify signature of Stripe webhook payload
   */
  public verifySignature(payload: string, signatureHeader: string): boolean {
    if (!signatureHeader || !this.webhookSecret) return false;

    // Standard Stripe signature scheme: t=timestamp,v1=signature
    const parts = signatureHeader.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.substring(2);
    const expectedSig = signaturePart.substring(3);

    const signedPayload = `${timestamp}.${payload}`;
    const computedSig = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(expectedSig));
  }

  /**
   * Process incoming Stripe event with strict idempotency verification
   */
  public async handleEvent(event: StripeWebhookEvent): Promise<WebhookProcessingResult> {
    // 1. Idempotency Check: Prevent duplicate payment processing
    if (this.processedEvents.has(event.id)) {
      return {
        success: true,
        duplicate: true,
        eventId: event.id,
        actionTaken: "IGNORED_DUPLICATE",
      };
    }

    // Mark event as seen immediately
    this.processedEvents.add(event.id);

    // 2. Handle successful payment
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const orderId = intent.metadata?.order_id || `ord_${intent.id.replace("pi_", "")}`;
      const customerEmail = intent.customer_email || intent.receipt_email || "customer@example.co.uk";
      const deliveryTier = (intent.metadata?.delivery_tier as any) || "two_man_white_glove";
      const poNumber = `PO-SAN-${Date.now().toString().slice(-6)}`;

      const items: OrderItemDispatch[] = [
        {
          sku: "SAN-PROD-001",
          supplierSku: intent.metadata?.supplier_sku || "SUPP-KENS-OAT",
          title: intent.metadata?.product_title || "The Kensington 3-Seater Sofa",
          quantity: 1,
          costPricePennies: Math.round(intent.amount * 0.55),
        },
      ];

      const poRequest: PurchaseOrderRequest = {
        orderId,
        poNumber,
        supplierId: "uk_craft_sofas",
        customerDeliveryAddress: {
          recipient_name: intent.metadata?.customer_name || "Valued Customer",
          line_1: intent.metadata?.address_line_1 || "10 High Street",
          city: intent.metadata?.address_city || "London",
          postcode: intent.metadata?.shipping_postcode || "SW1A 1AA",
          country_code: "GB",
          phone: intent.metadata?.customer_phone || "+44 7700 900077",
        },
        deliveryTier,
        items,
        createdAt: new Date().toISOString(),
      };

      const poRecord = this.orderDispatcher.generatePurchaseOrder(poRequest);

      return {
        success: true,
        duplicate: false,
        eventId: event.id,
        actionTaken: "PAYMENT_CONFIRMED_ORDER_DISPATCHED",
        poNumber: poRecord.poNumber,
      };
    }

    return {
      success: true,
      duplicate: false,
      eventId: event.id,
      actionTaken: `HANDLED_${event.type.toUpperCase()}`,
    };
  }
}
