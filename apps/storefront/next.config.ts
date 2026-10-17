import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  outputFileTracingRoot: path.resolve(process.cwd(), "../../"),
  transpilePackages: ["@san-furniture/types", "@san-furniture/config"],
  experimental: {
    staleTimes: {
      dynamic: 180,
      static: 300,
    },
    scrollRestoration: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "assets.sanfurniture.com"
      }
    ]
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
  // Hardened response security headers
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: isProd ? "DENY" : "SAMEORIGIN"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin"
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  },
  async rewrites() {
    const backendOrigin = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "http://localhost:9000";
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  }
};

export default nextConfig;
