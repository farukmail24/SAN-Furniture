export interface TurnstileVerificationResult {
    success: boolean;
    challengeTs?: string;
    hostname?: string;
    errorCodes?: string[];
    isMockPass?: boolean;
}
export declare class CloudflareTurnstileService {
    private secretKey?;
    static readonly DUMMY_PASS_TOKEN = "1x0000000000000000000000000000000AA";
    static readonly DUMMY_FAIL_TOKEN = "2x0000000000000000000000000000000AA";
    constructor(secretKey?: string);
    /**
     * Verify Turnstile token received from client
     */
    verifyToken(token: string, remoteIp?: string): Promise<TurnstileVerificationResult>;
}
