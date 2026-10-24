import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest } from "@/lib/auth-token";
import { formatGBP } from "@san-furniture/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryEmail = (searchParams.get("email") || "").trim().toLowerCase();

    // Authenticate via token or verified session email
    const authCust = await getCustomerFromRequest(request);
    const targetEmail = authCust?.email || queryEmail;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view order history", orders: [] },
        { status: 401 }
      );
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT o.*, d.carrier, d.tracking_number, d.po_number, d.status as dispatch_status
       FROM orders o
       LEFT JOIN order_po_dispatches d ON o.id = d.order_id
       WHERE LOWER(o.customer_email) = ?
       ORDER BY o.created_at DESC`,
      [targetEmail]
    );

    // Pre-load product thumbnails to ensure 100% of order items have images
    const allProductIds = new Set<string>();
    for (const r of rows) {
      try {
        const parsed = typeof r.items_json === "string" ? JSON.parse(r.items_json) : (r.items_json || []);
        if (Array.isArray(parsed)) {
          parsed.forEach((it: any) => {
            const pid = it.productId || it.id;
            if (pid) allProductIds.add(pid);
          });
        }
      } catch {}
    }

    const productThumbnailMap = new Map<string, string>();
    if (allProductIds.size > 0) {
      const [prodRows]: any = await pool.query(
        "SELECT id, thumbnail_url FROM products WHERE id IN (?)",
        [Array.from(allProductIds)]
      );
      if (Array.isArray(prodRows)) {
        prodRows.forEach((p: any) => {
          if (p.id && p.thumbnail_url) productThumbnailMap.set(p.id, p.thumbnail_url);
        });
      }
    }

    const orders = (Array.isArray(rows) ? rows : []).map((o: any) => {
      let items: any[] = [];
      try {
        items = typeof o.items_json === "string" ? JSON.parse(o.items_json) : (o.items_json || []);
      } catch {
        items = [];
      }

      const totalPennies = Number(o.total_pennies) || 0;
      const isDelivered = o.fulfillment_status === "delivered";
      const isInTransit = o.fulfillment_status === "in_transit" || o.fulfillment_status === "in_transit_two_man";
      const isDispatched =
        o.fulfillment_status === "dispatched" ||
        isInTransit ||
        isDelivered ||
        (o.dispatch_status === "dispatched" && o.fulfillment_status !== "unfulfilled" && o.fulfillment_status !== "paid");
      const isProcessing =
        isDispatched ||
        o.fulfillment_status === "po_dispatched" ||
        o.fulfillment_status === "processing";
      const isReturnRequested = o.fulfillment_status === "return_requested" || o.fulfillment_status === "returned";
      const isCancelled = o.fulfillment_status === "cancelled";

      const carrierName = o.carrier && !o.carrier.includes("Awaiting") ? o.carrier : "Dedicated Delivery Fleet";

      let deliveryTimeline: Array<{ step: string; done: boolean; time: string; note: string }> = [];
      if (isCancelled) {
        deliveryTimeline = [
          { step: "Order Confirmed", done: true, time: "Day 1", note: "Order placed & verified" },
          { step: "Order Cancelled", done: true, time: "Confirmed", note: "Cancelled upon customer request" },
          { step: "Refund Processed", done: true, time: "Completed", note: "Refund issued to original payment" },
        ];
      } else if (isReturnRequested) {
        deliveryTimeline = [
          { step: "Order Delivered", done: true, time: "Completed", note: "Delivered to property" },
          { step: "Return Requested", done: true, time: "Logged", note: "Under review by customer care" },
          { step: "Collection Scheduled", done: false, time: "Pending", note: "Courier collection assigned" },
          { step: "Refund Completed", done: false, time: "Scheduled", note: "Processed upon item inspection" },
        ];
      } else {
        deliveryTimeline = [
          {
            step: "Order Confirmed",
            done: true,
            time: "Day 1",
            note: "Payment received & order verified",
          },
          {
            step: "Processing",
            done: isProcessing,
            time: "Day 1-2",
            note: isProcessing
              ? (isDispatched ? "Packing complete & handed to carrier" : "Preparing item at fulfillment hub")
              : "Order queued for warehouse preparation",
          },
          {
            step: "Dispatched",
            done: isDispatched,
            time: "Day 2-3",
            note: isDispatched
              ? `In transit with ${carrierName}`
              : "Awaiting dispatch from warehouse",
          },
          {
            step: "Delivered",
            done: isDelivered,
            time: "Day 3-5",
            note: isDelivered ? "Delivered to delivery address" : "Estimated within 3-5 working days",
          },
        ];
      }

      const vatPennies = Math.round((totalPennies * 0.2) / 1.2);
      const subtotalPennies = totalPennies - vatPennies;

      return {
        id: o.id,
        orderNumber: o.order_number || o.id,
        order_number: o.order_number || o.id,
        totalPennies,
        total_pennies: totalPennies,
        vat_pennies: vatPennies,
        subtotal_pennies: subtotalPennies,
        totalGbpFormatted: formatGBP(totalPennies),
        created_at: o.created_at,
        createdAt: o.created_at,
        fulfillmentStatus: o.fulfillment_status || "unfulfilled",
        fulfillment_status: o.fulfillment_status || "unfulfilled",
        cancellationReason: o.cancellation_reason || null,
        cancellation_reason: o.cancellation_reason || null,
        cancelledBy: o.cancelled_by || null,
        cancelled_by: o.cancelled_by || null,
        cancelledAt: o.cancelled_at || null,
        cancelled_at: o.cancelled_at || null,
        paymentStatus: o.payment_status || "paid",
        payment_status: o.payment_status || "paid",
        deliveryTier: o.delivery_tier || "standard_delivery",
        delivery_tier: o.delivery_tier || "standard_delivery",
        shippingAddress: o.shipping_address,
        shipping_address: o.shipping_address,
        shippingPostcode: o.shipping_postcode,
        shipping_postcode: o.shipping_postcode,
        carrier: o.carrier || "SAN Dedicated Delivery Fleet",
        trackingNumber: o.tracking_number || "Awaiting allocation",
        tracking_number: o.tracking_number || "Awaiting allocation",
        poNumber: o.po_number || `PO-${o.id}`,
        po_number: o.po_number || `PO-${o.id}`,
        items: items.map((it: any) => {
          const pid = it.productId || it.id;
          const thumb = it.thumbnailUrl || it.thumbnail_url || it.image || productThumbnailMap.get(pid) || "";
          return {
            productId: pid,
            title: it.title || it.name || "Bespoke Furniture",
            quantity: it.quantity || 1,
            pricePennies: it.pricePennies || it.price_pennies || 0,
            thumbnailUrl: thumb,
            finish: it.finish || "Standard White Glove Finish",
          };
        }),
        deliveryTimeline,
        invoiceHtmlUrl: `/api/orders/${o.id}/invoice`,
      };
    });

    return NextResponse.json({
      success: true,
      orders,
      total: orders.length,
    });
  } catch (err: any) {
    console.error("[Customer Orders Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customer orders", details: err?.message || String(err), orders: [] },
      { status: 500 }
    );
  }
}
