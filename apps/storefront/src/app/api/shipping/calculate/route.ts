import { NextResponse } from "next/server";
import { classifyUKPostcode, formatGBP, resolveUKPostcodeInfo } from "@san-furniture/types";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const rawPostcode = (body.postcode || "").trim().toUpperCase();
    const clean = rawPostcode.replace(/\s+/g, "");

    // Query active delivery options from database table delivery_options
    let activeDbOptions: any[] = [];
    try {
      const pool = getDbPool();
      const [rows]: any = await pool
        .query(
          "SELECT * FROM delivery_options WHERE is_active = 1 ORDER BY sort_order ASC, created_at ASC"
        )
        .catch(() => [[]]);
      if (Array.isArray(rows) && rows.length > 0) {
        activeDbOptions = rows;
      }
    } catch (err: any) {
      console.warn("[Shipping Calculate] DB query error:", err?.message);
    }

    // Default safe fallback if database table has no active options
    if (activeDbOptions.length === 0) {
      activeDbOptions = [
        {
          id: "del_opt_001",
          name: "Free UK Mainland Delivery",
          badge: "FREE DELIVERY",
          price_pennies: 0,
          description: "Complimentary room of choice delivery across mainland UK. Direct from SAN Central Distribution Hub with a 2-hour pre-delivery booking call.",
          timeframe: "3 - 7 business days",
        },
      ];
    }

    if (!clean) {
      const defaultOptions = activeDbOptions.map((opt: any) => {
        const baseFee = Number(opt.price_pennies) || 0;
        return {
          id: opt.id,
          name: opt.name,
          description: opt.description || "",
          baseFeePennies: baseFee,
          totalFeePennies: baseFee,
          formattedTotal: baseFee === 0 ? "FREE" : formatGBP(baseFee),
          timeframe: opt.timeframe || "3 - 7 business days",
          badge: opt.badge || (baseFee === 0 ? "FREE DELIVERY" : undefined),
          isActive: true,
        };
      });

      return NextResponse.json({
        success: true,
        isDeliverable: true,
        deliverable: true,
        is_deliverable: true,
        zone: "zone_1_mainland",
        zoneName: "UK Mainland Standard Delivery",
        surchargePennies: 0,
        surchargeFormatted: "FREE",
        extraDays: 0,
        leadTimeExtraDays: 0,
        options: defaultOptions,
        deliveryOptions: defaultOptions,
      });
    }

    const zone = classifyUKPostcode(clean);
    const info = resolveUKPostcodeInfo(clean);

    let isDeliverable = true;
    let surchargePennies = 0;
    let extraDays = 0;

    if (zone === "zone_1_mainland") {
      isDeliverable = true;
      surchargePennies = 0;
      extraDays = 0;
    } else if (zone === "zone_2_scottish_highlands") {
      isDeliverable = true;
      surchargePennies = 4900;
      extraDays = 3;
    } else {
      isDeliverable = false;
    }

    const options = isDeliverable
      ? activeDbOptions.map((opt: any) => {
          const baseFee = Number(opt.price_pennies) || 0;
          const totalFee = baseFee + surchargePennies;
          return {
            id: opt.id,
            name: opt.name,
            description: opt.description || "",
            baseFeePennies: baseFee,
            totalFeePennies: totalFee,
            formattedTotal: totalFee === 0 ? "FREE" : formatGBP(totalFee),
            timeframe:
              extraDays > 0
                ? `${opt.timeframe || "3 - 7 business days"} (+${extraDays} days)`
                : opt.timeframe || "3 - 7 business days",
            badge:
              opt.badge ||
              (surchargePennies > 0
                ? "Regional Surcharge"
                : totalFee === 0
                ? "FREE DELIVERY"
                : undefined),
            isActive: true,
          };
        })
      : [];

    return NextResponse.json({
      success: true,
      isDeliverable,
      deliverable: isDeliverable,
      is_deliverable: isDeliverable,
      zone,
      zoneName:
        zone === "zone_1_mainland"
          ? "UK Mainland Standard Delivery"
          : zone === "zone_2_scottish_highlands"
          ? "Scottish Highlands Delivery"
          : "Outside Service Area",
      postcode: info.postcode || rawPostcode,
      cleanPostcode: clean,
      regionName: info.regionName,
      city: info.city,
      county: info.county,
      surchargePennies,
      surchargeFormatted: surchargePennies > 0 ? formatGBP(surchargePennies) : "FREE",
      extraDays,
      leadTimeExtraDays: extraDays,
      options,
      deliveryOptions: options,
      error: !isDeliverable ? "We currently deliver exclusively to UK Mainland addresses." : null,
    });
  } catch (err: any) {
    console.error("[Shipping Calculate Exception]:", err);
    return NextResponse.json(
      { success: false, error: "Shipping calculation error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
