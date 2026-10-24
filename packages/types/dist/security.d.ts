import { z } from "zod";
/**
 * IP Lockout reason enum
 */
export declare const LockoutReasonEnum: z.ZodEnum<["failed_admin_login", "failed_customer_login", "carding_attack_velocity", "search_scraping_velocity", "manual_admin_ban", "turnstile_bot_signature"]>;
export type LockoutReason = z.infer<typeof LockoutReasonEnum>;
/**
 * Security IP Jail Record Schema
 */
export declare const SecurityIpJailSchema: z.ZodObject<{
    id: z.ZodString;
    ip_address: z.ZodString;
    failed_attempts: z.ZodDefault<z.ZodNumber>;
    locked_until: z.ZodNullable<z.ZodString>;
    reason: z.ZodEnum<["failed_admin_login", "failed_customer_login", "carding_attack_velocity", "search_scraping_velocity", "manual_admin_ban", "turnstile_bot_signature"]>;
    is_permanent: z.ZodDefault<z.ZodBoolean>;
    user_agent: z.ZodOptional<z.ZodString>;
    country_code: z.ZodOptional<z.ZodString>;
    created_at: z.ZodString;
    updated_at: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    ip_address: string;
    failed_attempts: number;
    locked_until: string | null;
    reason: "failed_admin_login" | "failed_customer_login" | "carding_attack_velocity" | "search_scraping_velocity" | "manual_admin_ban" | "turnstile_bot_signature";
    is_permanent: boolean;
    created_at: string;
    updated_at: string;
    country_code?: string | undefined;
    user_agent?: string | undefined;
}, {
    id: string;
    ip_address: string;
    locked_until: string | null;
    reason: "failed_admin_login" | "failed_customer_login" | "carding_attack_velocity" | "search_scraping_velocity" | "manual_admin_ban" | "turnstile_bot_signature";
    created_at: string;
    updated_at: string;
    country_code?: string | undefined;
    failed_attempts?: number | undefined;
    is_permanent?: boolean | undefined;
    user_agent?: string | undefined;
}>;
export type SecurityIpJail = z.infer<typeof SecurityIpJailSchema>;
/**
 * Rate Limiter Rule Configuration
 */
export declare const RateLimitRuleSchema: z.ZodObject<{
    route_prefix: z.ZodString;
    max_requests: z.ZodNumber;
    window_seconds: z.ZodNumber;
    action_on_breach: z.ZodEnum<["throttle", "block_temp", "jail_escalate"]>;
}, "strip", z.ZodTypeAny, {
    route_prefix: string;
    max_requests: number;
    window_seconds: number;
    action_on_breach: "throttle" | "block_temp" | "jail_escalate";
}, {
    route_prefix: string;
    max_requests: number;
    window_seconds: number;
    action_on_breach: "throttle" | "block_temp" | "jail_escalate";
}>;
export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;
/**
 * Standard Application Security Rules
 */
export declare const DEFAULT_SECURITY_RATE_LIMITS: Record<string, z.infer<typeof RateLimitRuleSchema>>;
/**
 * Customer Registration Schema
 * Mobile / telephone number is strictly required for delivery scheduling and account verification.
 */
export declare const CustomerRegistrationSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    username: z.ZodOptional<z.ZodString>;
    email: z.ZodString;
    password: z.ZodString;
    phone: z.ZodString;
    addressLine1: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    postcode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    city?: string | undefined;
    postcode?: string | undefined;
    username?: string | undefined;
    addressLine1?: string | undefined;
}, {
    phone: string;
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    city?: string | undefined;
    postcode?: string | undefined;
    username?: string | undefined;
    addressLine1?: string | undefined;
}>;
export type CustomerRegistration = z.infer<typeof CustomerRegistrationSchema>;
//# sourceMappingURL=security.d.ts.map