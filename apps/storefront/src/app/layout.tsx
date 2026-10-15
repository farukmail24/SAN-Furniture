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
        <script src="/extension-shield.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;
                function isIgnored(val) {
                  if (!val) return false;
                  var str = '';
                  try {
                    if (typeof val === 'string') str = val;
                    else if (val instanceof Error) str = (val.message || '') + ' ' + (val.stack || '');
                    else if (typeof val === 'object') {
                      str = (val.message || '') + ' ' + (val.filename || '') + ' ' + (val.source || '') + ' ' +
                            (val.reason && (val.reason.message || val.reason.stack || '')) + ' ' +
                            (val.error && (val.error.message || val.error.stack || '')) + ' ' + JSON.stringify(val);
                    }
                  } catch (_) { str = String(val); }
                  var lower = str.toLowerCase();
                  return lower.indexOf('chrome-extension://') !== -1 ||
                         lower.indexOf('moz-extension://') !== -1 ||
                         lower.indexOf('safari-extension://') !== -1 ||
                         lower.indexOf('eppicocmhmnlblhjplcgkofcliegomcon') !== -1 ||
                         lower.indexOf('m_id') !== -1 ||
                         lower.indexOf('200.js') !== -1;
                }
                var origAdd = window.addEventListener;
                window.addEventListener = function(t, l, o) {
                  if ((t === 'error' || t === 'unhandledrejection') && typeof l === 'function') {
                    return origAdd.call(this, t, function(e) {
                      if (isIgnored(e)) {
                        if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
                        if (e && e.preventDefault) e.preventDefault();
                        return;
                      }
                      return l.apply(this, arguments);
                    }, o);
                  }
                  return origAdd.apply(this, arguments);
                };
                origAdd.call(window, 'error', function(e) {
                  if (isIgnored(e)) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.preventDefault) e.preventDefault();
                  }
                }, true);
                origAdd.call(window, 'unhandledrejection', function(e) {
                  if (isIgnored(e)) {
                    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
                    if (e.preventDefault) e.preventDefault();
                  }
                }, true);
                var origErr = window.console.error;
                window.console.error = function() {
                  for (var i = 0; i < arguments.length; i++) {
                    if (isIgnored(arguments[i])) return;
                  }
                  return origErr.apply(window.console, arguments);
                };
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
