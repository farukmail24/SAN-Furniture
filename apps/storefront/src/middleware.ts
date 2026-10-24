import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_SECRET =
  process.env.SAN_AUTH_SECRET ||
  process.env.JWT_SECRET ||
  process.env.AUTH_SECRET ||
  "san_furniture_uk_master_jwt_secret_998124_prod";

async function verifyTokenEdge(
  token: string | null | undefined,
  expectedType: "adm" | "cust"
): Promise<boolean> {
  if (!token || typeof token !== "string") return false;
  const parts = token.trim().split(".");
  if (parts.length !== 3) return false;
  const [prefix, payloadB64, signature] = parts;
  if (prefix !== `san_${expectedType}`) return false;

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(AUTH_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (signature.length !== expectedSig.length) return false;

    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (mismatch !== 0) return false;

    const normalizedB64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (normalizedB64.length % 4)) % 4;
    const paddedB64 = normalizedB64 + "=".repeat(padLen);
    const decodedStr = atob(paddedB64);
    const payload = JSON.parse(decodedStr);

    if (payload.type !== expectedType || !payload.id) return false;
    const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.ts > MAX_AGE_MS) return false;

    return true;
  } catch {
    return false;
  }
}

function extractAdminToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return request.cookies.get("san_admin_token")?.value || null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Admin API Route Guard: Protect /api/admin/* and /api/security/*
  const isAdminApi =
    (pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth/login") ||
    pathname.startsWith("/api/security");

  if (isAdminApi) {
    const adminToken = extractAdminToken(request);
    const isValid = await verifyTokenEdge(adminToken, "adm");
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid SAN Admin authorization required" },
        { status: 401 }
      );
    }
  }

  // 2. Admin UI Route Guard: Redirect unauthenticated requests on /admin to /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const adminToken = request.cookies.get("san_admin_token")?.value;
    const isValid = await verifyTokenEdge(adminToken, "adm");
    if (!isValid) {
      const loginUrl = new URL("/admin/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      if (adminToken) {
        response.cookies.delete("san_admin_token");
      }
      return response;
    }
  }

  // In development, skip strict security headers so localhost CSS and HMR are never blocked
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  const connectSources = new Set([
    "'self'",
    "https://challenges.cloudflare.com",
    "https://api.stripe.com",
  ]);
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      connectSources.add(new URL(process.env.NEXT_PUBLIC_API_URL).origin);
    } catch {}
  }

  // Strict Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src ${Array.from(connectSources).join(" ")};
    frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com;
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // Strict Transport Security (HSTS)
  const isHttps =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  if (isHttps) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
