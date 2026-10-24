import crypto from "crypto";
export class MetaConversionsApiService {
    pixelId;
    accessToken;
    constructor(pixelId, accessToken) {
        this.pixelId = pixelId ?? process.env.META_PIXEL_ID;
        this.accessToken = accessToken ?? process.env.META_ACCESS_TOKEN;
    }
    /**
     * Normalize and SHA-256 hash PII string according to Meta specifications
     */
    hashPii(value) {
        const normalized = value.trim().toLowerCase();
        return crypto.createHash("sha256").update(normalized).digest("hex");
    }
    /**
     * Build compliant Meta Conversion Event payload
     */
    buildEventPayload(eventName, sourceUrl, eventId, userData, customData) {
        const hashedUserData = {
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
    async sendEvent(event) {
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
        }
        catch (err) {
            return {
                success: false,
                eventId: event.event_id,
                response: { error: err.message },
            };
        }
    }
}
