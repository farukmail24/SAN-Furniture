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
    value: number;
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    order_id?: string;
    num_items?: number;
}
export interface MetaConversionEvent {
    event_name: "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
    event_time: number;
    event_id: string;
    event_source_url: string;
    action_source: "website";
    user_data: {
        em?: string[];
        ph?: string[];
        ct?: string[];
        zp?: string[];
        country?: string[];
        client_ip_address?: string;
        client_user_agent?: string;
    };
    custom_data?: MetaCustomData;
}
export declare class MetaConversionsApiService {
    private pixelId?;
    private accessToken?;
    constructor(pixelId?: string, accessToken?: string);
    /**
     * Normalize and SHA-256 hash PII string according to Meta specifications
     */
    hashPii(value: string): string;
    /**
     * Build compliant Meta Conversion Event payload
     */
    buildEventPayload(eventName: MetaConversionEvent["event_name"], sourceUrl: string, eventId: string, userData: MetaUserData, customData?: MetaCustomData): MetaConversionEvent;
    /**
     * Send event payload to Meta Graph API
     */
    sendEvent(event: MetaConversionEvent): Promise<{
        success: boolean;
        eventId: string;
        response?: any;
    }>;
}
