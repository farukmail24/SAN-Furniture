export interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
}
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    currentCount: number;
    resetSeconds: number;
}
export declare const RATE_LIMIT_TIERS: Record<string, RateLimitConfig>;
export declare class SlidingWindowRateLimiter {
    private storage;
    /**
     * Check if request from IP within tier is permitted under sliding window
     */
    checkLimit(tier: keyof typeof RATE_LIMIT_TIERS | string, ip: string): RateLimitResult;
    /**
     * Clear rate limit history for a specific IP (e.g. on successful auth or admin override)
     */
    resetLimit(tier: string, ip: string): void;
}
