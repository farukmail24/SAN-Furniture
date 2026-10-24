const path = require("node:path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  reactStrictMode: true,
  devIndicators: {
    position: "bottom-right",
  },
  transpilePackages: ["@san-furniture/types"],
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
      },
      {
        protocol: "https",
        hostname: "files.ekmcdn.com"
      },
      {
        protocol: "https",
        hostname: "amosmannfurniture.co.uk"
      },
      {
        protocol: "https",
        hostname: "www.amosmannfurniture.co.uk"
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
    let backendOrigin = process.env.BACKEND_INTERNAL_URL || process.env.BACKEND_URL;
    if (!backendOrigin) {
      return {
        beforeFiles: [],
        afterFiles: [],
        fallback: [],
      };
    }
    backendOrigin = backendOrigin.replace("localhost", "127.0.0.1").replace(/\/+$/, "");
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${backendOrigin}/api/:path*`,
        },
      ],
    };
  }
};

module.exports = nextConfig;
