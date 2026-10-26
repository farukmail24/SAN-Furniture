"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: "40px 20px", fontFamily: "system-ui, -apple-system, sans-serif", background: "#f8f6f0", textAlign: "center" }}>
        <div style={{ maxWidth: "440px", margin: "60px auto", background: "#fff", padding: "36px 28px", borderRadius: "16px", border: "1px solid #e2ddd3", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", fontSize: "24px" }}>
            !
          </div>
          <h2 style={{ color: "#00072d", fontSize: "20px", margin: "0 0 8px 0" }}>Application Updated</h2>
          <p style={{ color: "#555", fontSize: "13px", lineHeight: 1.6, margin: "0 0 20px 0" }}>
            A newer release of SAN Furniture has been published. Please reload to refresh your browser session.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "10px 24px", background: "#00072d", color: "#f8f6f0", border: "none", borderRadius: "10px", fontWeight: "bold", fontSize: "13px", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
