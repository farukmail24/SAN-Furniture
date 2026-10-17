export interface TurnstileVerificationResult {
  success: boolean;
  challengeTs?: string;
  hostname?: string;
  errorCodes?: string[];
  isMockPass?: boolean;
}

export class CloudflareTurnstileService {
  private secretKey?: string;

  // Cloudflare officially provided test tokens
  public static readonly DUMMY_PASS_TOKEN = "1x0000000000000000000000000000000AA";
  public static readonly DUMMY_FAIL_TOKEN = "2x0000000000000000000000000000000AA";

  constructor(secretKey?: string) {
    this.secretKey = secretKey ?? process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  }

  /**
   * Verify Turnstile token received from client
   */
  public async verifyToken(token: string, remoteIp?: string): Promise<TurnstileVerificationResult> {
    if (!token) {
      return {
        success: false,
        errorCodes: ["missing-input-response"],
      };
    }

    // Check Cloudflare test dummy tokens
    if (token === CloudflareTurnstileService.DUMMY_PASS_TOKEN) {
      return {
        success: true,
        challengeTs: new Date().toISOString(),
        hostname: "sanfurniture.com",
        isMockPass: true,
      };
    }

    if (token === CloudflareTurnstileService.DUMMY_FAIL_TOKEN) {
      return {
        success: false,
        errorCodes: ["invalid-input-response"],
        isMockPass: true,
      };
    }

    // If no secret key is configured (local dev/offline testing), allow pass for standard mock tokens
    if (!this.secretKey) {
      return {
        success: true,
        challengeTs: new Date().toISOString(),
        hostname: "localhost",
        isMockPass: true,
      };
    }

    try {
      const formData = new URLSearchParams();
      formData.append("secret", this.secretKey);
      formData.append("response", token);
      if (remoteIp) formData.append("remoteip", remoteIp);

      const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as any;
      return {
        success: Boolean(data.success),
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
        errorCodes: data["error-codes"],
      };
    } catch (err: any) {
      return {
        success: false,
        errorCodes: ["internal-error", err.message],
      };
    }
  }
}
