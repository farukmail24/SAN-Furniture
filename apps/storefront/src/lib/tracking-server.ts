import { getDbPool } from "./db";

export interface StorefrontTrackingSettings {
  gtm_enabled: boolean;
  gtm_container_id: string;
  google_site_verification: string;
  ga4_enabled: boolean;
  ga4_measurement_id: string;
  meta_pixel_enabled: boolean;
  meta_pixel_id: string;
  meta_capi_token?: string;
  google_merchant_brand: string;
  google_merchant_shipping_service: string;
  google_merchant_shipping_cost: string;
  google_merchant_free_shipping_threshold: string;
  google_merchant_feed_enabled: boolean;
  meta_catalog_brand: string;
  meta_catalog_feed_enabled: boolean;
}

const DEFAULT_TRACKING_SETTINGS: StorefrontTrackingSettings = {
  gtm_enabled: false,
  gtm_container_id: "",
  google_site_verification: "",
  ga4_enabled: false,
  ga4_measurement_id: "",
  meta_pixel_enabled: false,
  meta_pixel_id: "",
  meta_capi_token: "",
  google_merchant_brand: "SAN Furniture",
  google_merchant_shipping_service: "UK Room of Choice Delivery",
  google_merchant_shipping_cost: "49.00",
  google_merchant_free_shipping_threshold: "500",
  google_merchant_feed_enabled: true,
  meta_catalog_brand: "SAN Furniture",
  meta_catalog_feed_enabled: true,
};

let cachedSettings: { data: StorefrontTrackingSettings; timestamp: number } | null = null;
const CACHE_TTL_MS = 30000; // 30s cache

export function invalidateTrackingSettingsCache() {
  cachedSettings = null;
}

export async function getStorefrontTrackingSettings(): Promise<StorefrontTrackingSettings> {
  const now = Date.now();
  if (cachedSettings && now - cachedSettings.timestamp < CACHE_TTL_MS) {
    return cachedSettings.data;
  }

  try {
    const pool = getDbPool();
    const trackingKeys = [
      "gtm_enabled",
      "gtm_container_id",
      "google_site_verification",
      "ga4_enabled",
      "ga4_measurement_id",
      "meta_pixel_enabled",
      "meta_pixel_id",
      "meta_capi_token",
      "google_merchant_brand",
      "google_merchant_shipping_service",
      "google_merchant_shipping_cost",
      "google_merchant_free_shipping_threshold",
      "google_merchant_feed_enabled",
      "meta_catalog_brand",
      "meta_catalog_feed_enabled",
    ];

    const [rows]: any = await pool.query(
      "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?)",
      [trackingKeys]
    ).catch(() => [[]]);

    const settingsMap: Record<string, string> = {};
    if (Array.isArray(rows)) {
      for (const row of rows) {
        settingsMap[row.setting_key] = row.setting_value;
      }
    }

    const data: StorefrontTrackingSettings = {
      gtm_enabled: settingsMap.gtm_enabled === "true" || settingsMap.gtm_enabled === "1",
      gtm_container_id: (settingsMap.gtm_container_id || "").trim(),
      google_site_verification: (settingsMap.google_site_verification || "").trim(),
      ga4_enabled: settingsMap.ga4_enabled === "true" || settingsMap.ga4_enabled === "1",
      ga4_measurement_id: (settingsMap.ga4_measurement_id || "").trim(),
      meta_pixel_enabled: settingsMap.meta_pixel_enabled === "true" || settingsMap.meta_pixel_enabled === "1",
      meta_pixel_id: (settingsMap.meta_pixel_id || "").trim(),
      meta_capi_token: (settingsMap.meta_capi_token || "").trim(),
      google_merchant_brand: (settingsMap.google_merchant_brand || "").trim() || DEFAULT_TRACKING_SETTINGS.google_merchant_brand,
      google_merchant_shipping_service: (settingsMap.google_merchant_shipping_service || "").trim() || DEFAULT_TRACKING_SETTINGS.google_merchant_shipping_service,
      google_merchant_shipping_cost: (settingsMap.google_merchant_shipping_cost || "").trim() || DEFAULT_TRACKING_SETTINGS.google_merchant_shipping_cost,
      google_merchant_free_shipping_threshold: (settingsMap.google_merchant_free_shipping_threshold || "").trim() || DEFAULT_TRACKING_SETTINGS.google_merchant_free_shipping_threshold,
      google_merchant_feed_enabled: settingsMap.google_merchant_feed_enabled !== "false" && settingsMap.google_merchant_feed_enabled !== "0",
      meta_catalog_brand: (settingsMap.meta_catalog_brand || "").trim() || DEFAULT_TRACKING_SETTINGS.meta_catalog_brand,
      meta_catalog_feed_enabled: settingsMap.meta_catalog_feed_enabled !== "false" && settingsMap.meta_catalog_feed_enabled !== "0",
    };

    cachedSettings = { data, timestamp: now };
    return data;
  } catch (err) {
    console.warn("[getStorefrontTrackingSettings Error]:", err);
    return DEFAULT_TRACKING_SETTINGS;
  }
}
