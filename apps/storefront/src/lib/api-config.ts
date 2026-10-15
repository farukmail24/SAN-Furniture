/**
 * SAN Furniture - Universal API Base URL Resolver
 * Supports Localhost, Docker, VPS, and cPanel Production Deployments.
 *
 * Precedence:
 * 1. NEXT_PUBLIC_API_URL environment variable
 * 2. In browser: dynamic current hostname (e.g., https://yourdomain.com:9000 or /api)
 * 3. Fallback: http://localhost:9000
 */

export function getApiBaseUrl(): string {
  // 1. Explicitly configured public env variable (Production, cPanel, Vercel, Docker)
  if (process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== "") {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  // 2. Client-side browser execution:
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    // If running in development on localhost:3000 -> backend is localhost:9000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:9000";
    }
    // In production (cPanel / VPS domain), if NEXT_PUBLIC_API_URL is not set,
    // return empty string so /api/* is called as a relative path through Next.js rewrite / reverse proxy
    return "";
  }

  // 3. Server-side rendering (SSR) fallback
  if (process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL.replace(/\/+$/, "");
  }

  return "http://localhost:9000";
}

/**
 * Constructs a fully qualified API endpoint URL.
 * Example: apiUrl("/api/admin/products") -> "https://yourdomain.com:9000/api/admin/products"
 */
export function apiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${cleanPath}`;
}
