export interface IpJailRecord {
    ip: string;
    strikeCount: number;
    reason: string;
    lockedUntil: number;
    isPermanent: boolean;
    createdAt: number;
    lastFailedAt: number;
}
export declare class IpJailService {
    private failedAttempts;
    private historicalStrikes;
    private jailRegistry;
    static readonly FAILURE_THRESHOLD = 5;
    /**
     * Record a failed login or payment attempt. Auto-locks IP when threshold is crossed.
     */
    recordFailure(ip: string, reason?: string): IpJailRecord | null;
    /**
     * Check if an IP address is currently locked out in jail
     */
    isIpJailed(ip: string): {
        jailed: boolean;
        remainingSeconds: number;
        reason?: string;
        strikeCount: number;
    };
    /**
     * 1-Click unblock an IP address (Admin override). Retains historical strike count unless resetStrikes=true.
     */
    releaseIp(ip: string, resetStrikes?: boolean): boolean;
    /**
     * Get all active and permanent jailed records for Admin UI
     */
    listActiveJailRecords(): IpJailRecord[];
}
