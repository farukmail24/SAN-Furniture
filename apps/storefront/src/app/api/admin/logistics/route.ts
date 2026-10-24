import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();

    const [optionsRows]: any = await pool
      .query(
        "SELECT * FROM delivery_options ORDER BY sort_order ASC, created_at ASC"
      )
      .catch(() => [[]]);

    const deliveryOptions = (Array.isArray(optionsRows) ? optionsRows : []).map(
      (opt: any) => {
        let regions: string[] = ["all_mainland"];
        try {
          if (typeof opt.regions_json === "string") {
            regions = JSON.parse(opt.regions_json || "[]");
          } else if (Array.isArray(opt.regions_json)) {
            regions = opt.regions_json;
          }
        } catch {
          regions = ["all_mainland"];
        }

        return {
          id: opt.id,
          name: opt.name,
          badge: opt.badge,
          pricePennies: opt.price_pennies ?? 0,
          description: opt.description,
          timeframe: opt.timeframe,
          serviceScope: opt.service_scope || "all_mainland",
          regions,
          allowedPrefixes: opt.allowed_prefixes || "",
          excludedPrefixes: opt.excluded_prefixes || "",
          minOrderPennies: opt.min_order_pennies ?? 0,
          isActive: Boolean(opt.is_active),
          sortOrder: opt.sort_order ?? 0,
        };
      }
    );

    const [policyRows]: any = await pool
      .query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('delivery_policy_scope', 'delivery_policy_restricted', 'delivery_policy_notice')"
      )
      .catch(() => [[]]);

    const policyMap: Record<string, string> = {};
    if (Array.isArray(policyRows)) {
      for (const r of policyRows) {
        policyMap[r.setting_key] = r.setting_value;
      }
    }

    const deliveryPolicy = {
      scope: policyMap["delivery_policy_scope"] || "mainland_only",
      restrictedPrefixes:
        policyMap["delivery_policy_restricted"] ||
        "IV, KW, PH, AB, PA, BT, HS, ZE, GY, JE, IM",
      nonServiceableNotice:
        policyMap["delivery_policy_notice"] ||
        "We currently deliver exclusively to Mainland UK addresses. We are unable to fulfill orders to Northern Ireland, Scottish Highlands & Islands, or Channel Islands at this time. Please enter a valid Mainland UK delivery postcode.",
    };

    const [postcodeZones]: any = await pool
      .query(
        "SELECT id, zone_code, zone_name, prefix_list, surcharge_pennies, is_active FROM postcode_zones ORDER BY id ASC"
      )
      .catch(() => [[]]);

    return NextResponse.json({
      success: true,
      deliveryOptions,
      deliveryPolicy,
      postcodeZones: Array.isArray(postcodeZones) ? postcodeZones : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
