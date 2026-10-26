import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";

const execAsync = promisify(exec);

// Deployment secret key - configurable via .env, defaults to standard SAN master secret
const DEPLOY_SECRET =
  process.env.DEPLOY_SECRET ||
  process.env.GITHUB_WEBHOOK_SECRET ||
  process.env.SAN_AUTH_SECRET ||
  "san_furniture_auto_deploy_master_secret_2026";

export const dynamic = "force-dynamic";

/**
 * Verify GitHub HMAC SHA-256 signature
 */
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) {
    return false;
  }
  const expectedSig = crypto
    .createHmac("sha256", DEPLOY_SECRET)
    .update(rawBody)
    .digest("hex");
  const providedSig = signatureHeader.substring(7);

  const expBuf = Buffer.from(expectedSig);
  const provBuf = Buffer.from(providedSig);

  if (expBuf.length !== provBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(expBuf, provBuf);
}

/**
 * GET: Webhook endpoint status & quick health check
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get("secret") || searchParams.get("token");

  return NextResponse.json({
    status: "online",
    service: "SAN Furniture GitHub Auto-Deploy Webhook",
    supportedEvents: ["push", "ping"],
    monitoredBranches: ["refs/heads/master", "refs/heads/main"],
    authenticated: querySecret === DEPLOY_SECRET,
    instructions: {
      githubPayloadUrl: "/api/webhooks/deploy",
      contentType: "application/json",
      recommendedEvents: "Just the push event",
      sslVerification: "Enable SSL verification",
    },
    timestamp: new Date().toISOString(),
  });
}

/**
 * POST: Receive GitHub push & ping webhooks and trigger auto-deploy
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const githubEvent = request.headers.get("x-github-event") || "push";
    const deliveryId = request.headers.get("x-github-delivery");

    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret") || searchParams.get("token");
    const headerSecret = request.headers.get("x-deploy-secret");

    // Authenticate via HMAC signature OR query token
    const isSignatureValid = verifySignature(rawBody, signature);
    const isTokenValid = querySecret === DEPLOY_SECRET || headerSecret === DEPLOY_SECRET;

    if (!isSignatureValid && !isTokenValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Invalid or missing GitHub Webhook signature / secret",
        },
        { status: 401 }
      );
    }

    // Parse JSON payload (Supports both application/json and application/x-www-form-urlencoded)
    let payload: any = {};
    try {
      if (rawBody.startsWith("payload=")) {
        const decoded = decodeURIComponent(rawBody.substring(8).replace(/\+/g, " "));
        payload = JSON.parse(decoded);
      } else {
        payload = rawBody ? JSON.parse(rawBody) : {};
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // 1. Handle GitHub Ping Event (Initial webhook connection test)
    if (githubEvent === "ping") {
      return NextResponse.json({
        success: true,
        event: "ping",
        message: "GitHub Webhook Ping received successfully! SAN Furniture auto-deploy endpoint is active.",
        zen: payload.zen || "Responsive dropshipping e-commerce.",
        hookId: payload.hook_id,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Handle GitHub Push Event
    if (githubEvent === "push") {
      const ref = payload.ref || "";
      const branch = ref.replace("refs/heads/", "");
      const isTargetBranch = branch === "master" || branch === "main";

      if (!isTargetBranch) {
        return NextResponse.json({
          success: true,
          action: "ignored",
          message: `Ignored push to branch '${branch}'. Auto-deploy only triggers for 'master' or 'main'.`,
        });
      }

      const commitSha = payload.after || payload.head_commit?.id || "latest";
      const commitMessage = payload.head_commit?.message || "No commit message";
      const pusherName = payload.pusher?.name || payload.sender?.login || "Unknown";

      // Execute deployment - resolve actual Git repository root
      const candidateRoots = [
        process.cwd(),
        path.resolve(process.cwd(), ".."),
        path.resolve(process.cwd(), "../.."),
        path.resolve(__dirname, "../../.."),
        "/home/sansoft/sanfurniture.com",
      ];
      let projectRoot = candidateRoots.find((dir) => fs.existsSync(path.join(dir, ".git"))) || process.cwd();
      const executionLogs: string[] = [];

      try {
        // Step A: Git pull or fetch & reset
        const gitCmd = `git fetch origin ${branch} && git reset --hard origin/${branch}`;
        const { stdout: gitOut, stderr: gitErr } = await execAsync(gitCmd, {
          cwd: projectRoot,
          timeout: 60000,
        }).catch(async () => {
          // Fallback to simple git pull
          return await execAsync(`git pull origin ${branch}`, {
            cwd: projectRoot,
            timeout: 60000,
          });
        });

        if (gitOut) executionLogs.push(gitOut.trim());
        if (gitErr) executionLogs.push(gitErr.trim());

        // Step B: Touch Phusion Passenger restart file on cPanel
        const restartPaths = [
          path.join(projectRoot, "tmp", "restart.txt"),
          path.join(process.cwd(), "tmp", "restart.txt"),
          path.join(process.cwd(), "..", "tmp", "restart.txt"),
          "/home/sansoft/sanfurniture.com/tmp/restart.txt",
        ];

        for (const rPath of restartPaths) {
          try {
            const dir = path.dirname(rPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(rPath, `Restarted at ${new Date().toISOString()}\n`);
          } catch {}
        }

        // Step C: Write to deploy.log
        const logEntry = `[${new Date().toISOString()}] Branch: ${branch} | Commit: ${commitSha.substring(
          0,
          7
        )} | By: ${pusherName} | Msg: ${commitMessage}\n`;
        const logPath = path.join(projectRoot, "deploy.log");
        try {
          fs.appendFileSync(logPath, logEntry);
        } catch {}

        return NextResponse.json({
          success: true,
          message: `SAN Furniture auto-deployed successfully from branch '${branch}'`,
          branch,
          commitSha: commitSha.substring(0, 7),
          commitMessage,
          pusher: pusherName,
          deliveryId,
          passengerRestartTriggered: true,
          logs: executionLogs.slice(0, 5),
          timestamp: new Date().toISOString(),
        });
      } catch (deployErr: any) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to execute git deployment commands",
            details: deployErr?.message || String(deployErr),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Event '${githubEvent}' received, no deployment action required.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error during webhook execution",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
