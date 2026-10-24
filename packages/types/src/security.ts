import { z } from "zod";

/**
 * IP Lockout reason enum
 */
export const LockoutReasonEnum = z.enum([
  "failed_admin_login",
  "failed_customer_login",
  "carding_attack_velocity",
  "search_scraping_velocity",
  "manual_admin_ban",
  "turnstile_bot_signature"
]);
export type LockoutReason = z.infer<typeof LockoutReasonEnum>;

/**
 * Security IP Jail Record Schema
 */
export const SecurityIpJailSchema = z.object({
  id: z.string().uuid(),
  ip_address: z.string().ip(),
  failed_attempts: z.number().int().nonnegative().default(1),
  locked_until: z.string().datetime().nullable(),
  reason: LockoutReasonEnum,
  is_permanent: z.boolean().default(false),
  user_agent: z.string().optional(),
  country_code: z.string().length(2).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
});
export type SecurityIpJail = z.infer<typeof SecurityIpJailSchema>;

/**
 * Rate Limiter Rule Configuration
 */
export const RateLimitRuleSchema = z.object({
  route_prefix: z.string(),
  max_requests: z.number().int().positive(),
  window_seconds: z.number().int().positive(),
  action_on_breach: z.enum(["throttle", "block_temp", "jail_escalate"])
});
export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;

/**
 * Standard Application Security Rules
 */
export const DEFAULT_SECURITY_RATE_LIMITS: Record<string, z.infer<typeof RateLimitRuleSchema>> = {
  auth_login: {
    route_prefix: "/api/auth/login",
    max_requests: 5,
    window_seconds: 900, // 15 minutes
    action_on_breach: "jail_escalate"
  },
  checkout_pay: {
    route_prefix: "/api/checkout/pay",
    max_requests: 3,
    window_seconds: 600, // 10 minutes
    action_on_breach: "block_temp"
  },
  instant_search: {
    route_prefix: "/api/search",
    max_requests: 60,
    window_seconds: 60, // 1 minute
    action_on_breach: "throttle"
  }
};

/**
 * Customer Registration Schema
 * Mobile / telephone number is strictly required for delivery scheduling and account verification.
 */
export const CustomerRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  username: z.string().trim().optional(),
  email: z.string().trim().email("Valid email address is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  phone: z.string().trim().min(10, "Mobile or telephone number is required (min 10 digits)"),
  addressLine1: z.string().trim().optional(),
  city: z.string().trim().optional(),
  postcode: z.string().trim().optional()
});
export type CustomerRegistration = z.infer<typeof CustomerRegistrationSchema>;
