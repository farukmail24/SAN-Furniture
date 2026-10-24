export const RATE_LIMIT_TIERS = {
    auth: { maxRequests: 5, windowSeconds: 900 }, // 5 requests / 15 minutes
    checkout: { maxRequests: 3, windowSeconds: 600 }, // 3 attempts / 10 minutes (Card testing defense)
    search: { maxRequests: 60, windowSeconds: 60 }, // 60 requests / 1 minute
    default: { maxRequests: 100, windowSeconds: 60 },
};
export class SlidingWindowRateLimiter {
    // Key: "tier:ip" -> Array of epoch millisecond timestamps
    storage = new Map();
    /**
     * Check if request from IP within tier is permitted under sliding window
     */
    checkLimit(tier, ip) {
        const config = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.default;
        const now = Date.now();
        const windowMs = config.windowSeconds * 1000;
        const key = `${tier}:${ip}`;
        const timestamps = this.storage.get(key) || [];
        // Filter out timestamps older than the sliding window
        const validTimestamps = timestamps.filter((t) => now - t < windowMs);
        if (validTimestamps.length >= config.maxRequests) {
            const oldestValid = validTimestamps[0] || now;
            const resetSeconds = Math.ceil((oldestValid + windowMs - now) / 1000);
            this.storage.set(key, validTimestamps);
            return {
                allowed: false,
                remaining: 0,
                currentCount: validTimestamps.length,
                resetSeconds: Math.max(1, resetSeconds),
            };
        }
        // Record current attempt
        validTimestamps.push(now);
        this.storage.set(key, validTimestamps);
        const remaining = config.maxRequests - validTimestamps.length;
        const resetSeconds = config.windowSeconds;
        return {
            allowed: true,
            remaining,
            currentCount: validTimestamps.length,
            resetSeconds,
        };
    }
    /**
     * Clear rate limit history for a specific IP (e.g. on successful auth or admin override)
     */
    resetLimit(tier, ip) {
        this.storage.delete(`${tier}:${ip}`);
    }
}
