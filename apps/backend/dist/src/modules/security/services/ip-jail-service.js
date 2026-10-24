export class IpJailService {
    failedAttempts = new Map(); // ip -> count of failed attempts
    historicalStrikes = new Map(); // ip -> lifetime strike count
    jailRegistry = new Map();
    static FAILURE_THRESHOLD = 5;
    /**
     * Record a failed login or payment attempt. Auto-locks IP when threshold is crossed.
     */
    recordFailure(ip, reason = "Failed credential authentication") {
        const currentFailures = (this.failedAttempts.get(ip) || 0) + 1;
        this.failedAttempts.set(ip, currentFailures);
        if (currentFailures >= IpJailService.FAILURE_THRESHOLD) {
            // Escalate lifetime strike count
            const strikeCount = (this.historicalStrikes.get(ip) || 0) + 1;
            this.historicalStrikes.set(ip, strikeCount);
            let lockoutDurationMs = 15 * 60 * 1000; // Strike 1: 15 mins
            let isPermanent = false;
            if (strikeCount === 2) {
                lockoutDurationMs = 60 * 60 * 1000; // Strike 2: 1 hour
            }
            else if (strikeCount === 3) {
                lockoutDurationMs = 24 * 60 * 60 * 1000; // Strike 3: 24 hours
            }
            else if (strikeCount >= 4) {
                isPermanent = true;
                lockoutDurationMs = 0; // Strike 4+: Permanent
            }
            const lockedUntil = isPermanent ? 0 : Date.now() + lockoutDurationMs;
            const existing = this.jailRegistry.get(ip);
            const record = {
                ip,
                strikeCount,
                reason: `${reason} (${currentFailures} failed attempts)`,
                lockedUntil,
                isPermanent,
                createdAt: existing?.createdAt || Date.now(),
                lastFailedAt: Date.now(),
            };
            this.jailRegistry.set(ip, record);
            // Reset the current failure counter until next lockout period
            this.failedAttempts.set(ip, 0);
            return record;
        }
        return null;
    }
    /**
     * Check if an IP address is currently locked out in jail
     */
    isIpJailed(ip) {
        const record = this.jailRegistry.get(ip);
        if (!record) {
            return { jailed: false, remainingSeconds: 0, strikeCount: this.historicalStrikes.get(ip) || 0 };
        }
        if (record.isPermanent) {
            return {
                jailed: true,
                remainingSeconds: -1, // Permanent
                reason: record.reason,
                strikeCount: record.strikeCount,
            };
        }
        const now = Date.now();
        if (now < record.lockedUntil) {
            const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
            return {
                jailed: true,
                remainingSeconds,
                reason: record.reason,
                strikeCount: record.strikeCount,
            };
        }
        // Lockout has expired
        return { jailed: false, remainingSeconds: 0, strikeCount: record.strikeCount };
    }
    /**
     * 1-Click unblock an IP address (Admin override). Retains historical strike count unless resetStrikes=true.
     */
    releaseIp(ip, resetStrikes = false) {
        const removedJail = this.jailRegistry.delete(ip);
        this.failedAttempts.delete(ip);
        if (resetStrikes) {
            this.historicalStrikes.delete(ip);
        }
        return removedJail;
    }
    /**
     * Get all active and permanent jailed records for Admin UI
     */
    listActiveJailRecords() {
        const now = Date.now();
        return Array.from(this.jailRegistry.values()).filter((r) => r.isPermanent || r.lockedUntil > now);
    }
}
