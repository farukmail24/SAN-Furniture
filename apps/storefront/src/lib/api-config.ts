/**
 * SAN Furniture - Universal API Base URL Resolver
 * Supports Localhost, Docker, VPS, and cPanel Production Deployments.
 *
 * Guaranteed Safe: In browser contexts, returns clean relative paths ("/api/...")
 * ensuring same-origin proxying through Next.js without any CORS, port mismatch,
 * or compiler inlining undefined issues.
 */

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    if (
      publicUrl &&
      typeof publicUrl === "string" &&
      publicUrl.startsWith("https://") &&
      !publicUrl.includes("localhost") &&
      !publicUrl.includes("127.0.0.1")
    ) {
      return publicUrl.replace(/\/+$/, "");
    }
    return "";
  }

  // Server-side rendering (SSR) fallback in Node.js runtime
  const localPort = process.env.PORT || "3000";
  const defaultLocalUrl = `http://127.0.0.1:${localPort}`;

  const serverBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXTAUTH_URL ||
    defaultLocalUrl;

  return typeof serverBase === "string" && serverBase.trim()
    ? serverBase.trim().replace(/\/+$/, "")
    : defaultLocalUrl;
}

/**
 * Constructs a fully qualified or clean relative API endpoint URL.
 * Example in browser: apiUrl("/api/admin/products") -> "/api/admin/products"
 * Example in SSR:     apiUrl("/api/admin/products") -> "http://127.0.0.1:3000/api/admin/products"
 */
export function apiUrl(endpoint: string): string {
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (typeof window !== "undefined") {
    const publicUrl = process.env.NEXT_PUBLIC_API_URL;
    if (
      publicUrl &&
      typeof publicUrl === "string" &&
      publicUrl.startsWith("https://") &&
      !publicUrl.includes("localhost") &&
      !publicUrl.includes("127.0.0.1")
    ) {
      return `${publicUrl.replace(/\/+$/, "")}${cleanPath}`;
    }
    return cleanPath;
  }

  const localPort = process.env.PORT || "3000";
  const defaultLocalUrl = `http://127.0.0.1:${localPort}`;

  const serverBase =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXTAUTH_URL ||
    defaultLocalUrl;

  const safeBase = typeof serverBase === "string" && serverBase.trim()
    ? serverBase.trim().replace(/\/+$/, "")
    : defaultLocalUrl;

  return `${safeBase}${cleanPath}`;
}
