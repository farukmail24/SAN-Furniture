import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAN Furniture | Luxury Furniture Crafted for British Living",
  description:
    "Discover handcrafted sofas, solid oak dining sets, and bespoke bouclé accent chairs. Enjoy free 2-man white glove delivery across the UK and Klarna interest-free financing.",
  metadataBase: new URL("https://sanfurniture.co.uk"),
  openGraph: {
    title: "SAN Furniture | Luxury Furniture Crafted for British Living",
    description: "Premium UK furniture dropshipping with 2-man white glove delivery.",
    url: "https://sanfurniture.co.uk",
    siteName: "SAN Furniture",
    locale: "en_GB",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { Suspense } from "react";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { ExtensionErrorGuard } from "@/components/common/ExtensionErrorGuard";
import { TopProgressBar } from "@/components/common/TopProgressBar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isExtensionError(e) {
                  var file = (e && e.filename) || '';
                  var msg = (e && e.message) || (e && e.reason && e.reason.message) || '';
                  var stack = (e && e.error && e.error.stack) || (e && e.reason && e.reason.stack) || '';
                  return file.indexOf('chrome-extension://') !== -1 ||
                         file.indexOf('moz-extension://') !== -1 ||
                         file.indexOf('safari-extension://') !== -1 ||
                         stack.indexOf('chrome-extension://') !== -1 ||
                         stack.indexOf('moz-extension://') !== -1 ||
                         stack.indexOf('safari-extension://') !== -1 ||
                         msg.indexOf('M_ID') !== -1 ||
                         stack.indexOf('M_ID') !== -1;
                }
                window.addEventListener('error', function(e) {
                  if (isExtensionError(e)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
                window.addEventListener('unhandledrejection', function(e) {
                  if (isExtensionError(e)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                  }
                }, true);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-sand-50 font-sans text-navy-950" suppressHydrationWarning>
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <ExtensionErrorGuard />
        <StorefrontShell>{children}</StorefrontShell>
      </body>
    </html>
  );
}
