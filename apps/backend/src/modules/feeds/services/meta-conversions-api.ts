import crypto from "crypto";

export interface MetaUserData {
  email?: string;
  phone?: string;
  city?: string;
  postcode?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
}

export interface MetaCustomData {
  currency: string;
  value: number; // In pounds or currency units
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  order_id?: string;
  num_items?: number;
}

export interface MetaConversionEvent {
  event_name: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
  event_time: number;
  event_id: string; // for deduplication with browser pixel
  event_source_url: string;
  action_source: "website";
  user_data: {
    em?: string[]; // SHA-256 hashed lowercase
    ph?: string[]; // SHA-256 hashed digits
    ct?: string[]; // SHA-256 hashed lowercase city
    zp?: string[]; // SHA-256 hashed lowercase postcode
    country?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data?: MetaCustomData;
}

export class MetaConversionsApiService {
  private pixelId?: string;
  private accessToken?: string;

  constructor(pixelId?: string, accessToken?: string) {
    this.pixelId = pixelId ?? process.env.META_PIXEL_ID;
    this.accessToken = accessToken ?? process.env.META_ACCESS_TOKEN;
  }

  /**
   * Normalize and SHA-256 hash PII string according to Meta specifications
   */
  public hashPii(value: string): string {
    const normalized = value.trim().toLowerCase();
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Build compliant Meta Conversion Event payload
   */
  public buildEventPayload(
    eventName: MetaConversionEvent["event_name"],
    sourceUrl: string,
    eventId: string,
    userData: MetaUserData,
    customData?: MetaCustomData
  ): MetaConversionEvent {
    const hashedUserData: MetaConversionEvent["user_data"] = {
      country: [this.hashPii("gb")],
      client_ip_address: userData.clientIpAddress,
      client_user_agent: userData.clientUserAgent,
    };

    if (userData.email) {
      hashedUserData.em = [this.hashPii(userData.email)];
    }
    if (userData.phone) {
      // Remove all non-numeric characters before hashing
      const digitsOnly = userData.phone.replace(/[^0-9]/g, "");
      hashedUserData.ph = [this.hashPii(digitsOnly)];
    }
    if (userData.city) {
      hashedUserData.ct = [this.hashPii(userData.city)];
    }
    if (userData.postcode) {
      const cleanPostcode = userData.postcode.replace(/\s+/g, "").toLowerCase();
      hashedUserData.zp = [this.hashPii(cleanPostcode)];
    }

    return {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sourceUrl,
      action_source: "website",
      user_data: hashedUserData,
      custom_data: customData,
    };
  }

  /**
   * Send event payload to Meta Graph API
   */
  public async sendEvent(event: MetaConversionEvent): Promise<{ success: boolean; eventId: string; response?: any }> {
    if (!this.pixelId || !this.accessToken) {
      // Offline / Test mock mode
      return {
        success: true,
        eventId: event.event_id,
        response: { message: "Mock CAPI event recorded (credentials not configured in dev)" },
      };
    }

    const endpoint = `https://graph.facebook.com/v19.0/${this.pixelId}/events?access_token=${this.accessToken}`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
      });

      const json = await res.json();
      return {
        success: res.ok,
        eventId: event.event_id,
        response: json,
      };
    } catch (err: any) {
      return {
        success: false,
        eventId: event.event_id,
        response: { error: err.message },
      };
    }
  }
}
