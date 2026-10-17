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
  metadataBase: new URL("https://sanfurniture.com"),
  openGraph: {
    title: "SAN Furniture | Luxury Furniture Crafted for British Living",
    description: "Premium UK furniture dropshipping with 2-man white glove delivery.",
    url: "https://sanfurniture.com",
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
import Script from "next/script";
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
          id="extension-hydration-shield"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                var origError = window.console.error;
                window.console.error = function() {
                  var str = '';
                  for (var i = 0; i < arguments.length; i++) {
                    var a = arguments[i];
                    if (typeof a === 'string') str += ' ' + a;
                    else if (a && a.message) str += ' ' + a.message;
                    else if (a && a.stack) str += ' ' + a.stack;
                  }
                  var lower = str.toLowerCase();
                  if (
                    lower.indexOf('bis_skin_checked') !== -1 ||
                    lower.indexOf('cz-shortcut-listen') !== -1 ||
                    lower.indexOf('fdprocessedid') !== -1 ||
                    lower.indexOf('__next_route_announcer__') !== -1 ||
                    (lower.indexOf('hydrat') !== -1 && (lower.indexOf('extension') !== -1 || lower.indexOf('match') !== -1 || lower.indexOf('attribute') !== -1 || lower.indexOf('server rendered') !== -1))
                  ) {
                    return;
                  }
                  return origError.apply(window.console, arguments);
                };
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-sand-50 font-sans text-navy-950" suppressHydrationWarning>
        <Script src="/extension-shield.js" strategy="beforeInteractive" />
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <ExtensionErrorGuard />
        <StorefrontShell>{children}</StorefrontShell>
      </body>
    </html>
  );
}
