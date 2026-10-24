import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { formatGBP } from "@san-furniture/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = getDbPool();
    const [rows]: any = await pool
      .query(
        "SELECT * FROM delivery_options WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC"
      )
      .catch((err: any) => {
        console.warn("[Shipping Options API] DB error:", err?.message);
        return [[]];
      });

    let options: any[] = [];
    if (Array.isArray(rows) && rows.length > 0) {
      options = rows.map((r: any) => {
        const baseFee = Number(r.price_pennies) || 0;
        return {
          id: r.id,
          name: r.name,
          description: r.description || "",
          baseFeePennies: baseFee,
          totalFeePennies: baseFee,
          formattedTotal: baseFee === 0 ? "FREE" : formatGBP(baseFee),
          timeframe: r.timeframe || "3 - 7 business days",
          badge: r.badge || (baseFee === 0 ? "FREE DELIVERY" : undefined),
          isActive: true,
          sortOrder: Number(r.sort_order) || 0,
        };
      });
    }

    // Default safe fallback if database table is empty
    if (options.length === 0) {
      options = [
        {
          id: "del_opt_001",
          name: "Free UK Mainland Delivery",
          description: "Complimentary room of choice delivery across mainland UK. Direct from SAN Central Distribution Hub with a 2-hour pre-delivery booking call.",
          baseFeePennies: 0,
          totalFeePennies: 0,
          formattedTotal: "FREE",
          timeframe: "3 - 7 business days",
          badge: "FREE DELIVERY",
          isActive: true,
          sortOrder: 1,
        },
      ];
    }

    return NextResponse.json({
      success: true,
      options,
      deliveryOptions: options,
      total: options.length,
    });
  } catch (err: any) {
    console.error("[Shipping Options API Exception]:", err);
    const fallbackOptions = [
      {
        id: "del_opt_001",
        name: "Free UK Mainland Delivery",
        description: "Complimentary room of choice delivery across mainland UK.",
        baseFeePennies: 0,
        totalFeePennies: 0,
        formattedTotal: "FREE",
        timeframe: "3 - 7 business days",
        badge: "FREE DELIVERY",
        isActive: true,
        sortOrder: 1,
      },
    ];
    return NextResponse.json({
      success: true,
      options: fallbackOptions,
      deliveryOptions: fallbackOptions,
      total: fallbackOptions.length,
    });
  }
}
