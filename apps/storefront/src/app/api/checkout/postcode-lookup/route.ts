import { NextResponse } from "next/server";
import { resolveUKPostcodeInfo, classifyUKPostcode, formatGBP } from "@san-furniture/types";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPostcode = (searchParams.get("postcode") || "").trim().toUpperCase();
    const clean = rawPostcode.replace(/\s+/g, "");

    const ukPostcodeRegex = /^([A-Z]{1,2}[0-9][A-Z0-9]?)\s*([0-9][A-Z]{2})$/i;
    const isFormatValid = ukPostcodeRegex.test(clean) || clean.length >= 3;

    if (!isFormatValid) {
      return NextResponse.json(
        { valid: false, error: "Please enter a valid UK postcode (e.g. SW1A 1AA, M1 1AE, B1 1BB, CV7 9EU)" },
        { status: 400 }
      );
    }

    const info = resolveUKPostcodeInfo(clean);
    const zone = classifyUKPostcode(clean);

    let isDeliverable = true;
    let surchargePennies = 0;
    let leadTimeExtraDays = 0;

    if (zone === "zone_1_mainland") {
      isDeliverable = true;
      surchargePennies = 0;
      leadTimeExtraDays = 0;
    } else if (zone === "zone_2_scottish_highlands") {
      isDeliverable = true;
      surchargePennies = 4900; // £49 Highlands surcharge
      leadTimeExtraDays = 3;
    } else {
      isDeliverable = false;
    }

    const city = info.city || "London";
    const county = info.county || "Greater London";
    const sampleAddress = clean === "SW1A1AA" ? "Buckingham Palace, The Mall" : `12 High Street, ${city}`;

    const deliveryOptions = isDeliverable
      ? [
          {
            id: "free_delivery",
            name: "Free UK Mainland Delivery",
            description: "Dedicated doorstep furniture delivery across Mainland UK with dispatch notification.",
            baseFeePennies: surchargePennies,
            totalFeePennies: surchargePennies,
            formattedTotal: surchargePennies > 0 ? formatGBP(surchargePennies) : "FREE",
            timeframe: `${5 + leadTimeExtraDays} - ${10 + leadTimeExtraDays} business days`,
            badge: surchargePennies > 0 ? "Regional Surcharge" : "FREE",
            isActive: true,
          },
          {
            id: "white_glove_assembly",
            name: "White Glove Room-of-Choice & Packaging Removal",
            description: "2-man delivery team places furniture in your room of choice, unpacks, and removes packaging.",
            baseFeePennies: 2900 + surchargePennies,
            totalFeePennies: 2900 + surchargePennies,
            formattedTotal: formatGBP(2900 + surchargePennies),
            timeframe: `${5 + leadTimeExtraDays} - ${12 + leadTimeExtraDays} business days`,
            badge: "POPULAR",
            isActive: true,
          },
        ]
      : [];

    const defaultOpt = deliveryOptions[0];

    return NextResponse.json({
      valid: true,
      deliverable: isDeliverable,
      postcode: info.postcode || rawPostcode,
      cleanPostcode: clean,
      areaPrefix: info.areaPrefix,
      zone,
      zoneName: zone === "zone_1_mainland" ? "Mainland UK" : "Scottish Highlands / Regional UK",
      regionName: info.regionName,
      regionKey: info.regionKey,
      city,
      county,
      sampleAddress,
      deliveryTier: isDeliverable ? (defaultOpt?.id || "free_delivery") : "none",
      deliveryLabel: isDeliverable ? (defaultOpt ? defaultOpt.name : "Free Delivery") : "Delivery Unavailable Outside Mainland UK",
      surchargePennies,
      surchargeFormatted: formatGBP(surchargePennies),
      leadTimeExtraDays,
      deliveryOptions,
      estimatedDays: isDeliverable ? (defaultOpt?.timeframe || "5 - 10 business days") : "Unavailable",
      message: isDeliverable
        ? `Verified UK Delivery Address: ${city}, ${county} (${info.regionName}). ${surchargePennies === 0 ? "Eligible for Free Delivery." : `Regional Surcharge: ${formatGBP(surchargePennies)}`}`
        : "We currently deliver exclusively to UK Mainland addresses. Regional offshore shipping is not available.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: "Postcode lookup error", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
