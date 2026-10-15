import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Strict Content Security Policy (CSP)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://challenges.cloudflare.com https://api.stripe.com;
    frame-src 'self' https://challenges.cloudflare.com https://js.stripe.com;
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  // 2. Strict Transport Security (HSTS) - 2 Years with preload
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // 3. Clickjacking Prevention
  response.headers.set("X-Frame-Options", "DENY");

  // 4. MIME-Type Sniffing Protection
  response.headers.set("X-Content-Type-Options", "nosniff");

  // 5. Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 6. Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );

  // 7. Cross-Origin Protection
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, robots, sitemap
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
