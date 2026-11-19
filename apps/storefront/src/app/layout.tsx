import React from "react";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { StorefrontAnalytics } from "@/components/analytics/StorefrontAnalytics";
import { getLiveSections } from "@/lib/cms-server";
import { getLiveProducts } from "@/lib/catalog";
import { getStorefrontTrackingSettings } from "@/lib/tracking-server";

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

export async function generateMetadata(): Promise<Metadata> {
  const tracking = await getStorefrontTrackingSettings();

  return {
    title: "SAN Furniture | Luxury Furniture Crafted for British Living",
    description:
      "Discover premium wardrobes, dining sets, chest of drawers, and living room collections. Reliable tracked delivery across the UK Mainland.",
    metadataBase: new URL("https://sanfurniture.com"),
    openGraph: {
      title: "SAN Furniture | Luxury Furniture Crafted for British Living",
      description: "Premium UK furniture collection with dedicated British home delivery.",
      url: "https://sanfurniture.com",
      siteName: "SAN Furniture",
      locale: "en_GB",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
    },
    verification: tracking.google_site_verification
      ? { google: tracking.google_site_verification }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [initialSections, initialProducts, tracking] = await Promise.all([
    getLiveSections("all", { fresh: true }),
    getLiveProducts(),
    getStorefrontTrackingSettings(),
  ]);

  return (
    <html lang="en-GB" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        {tracking.google_site_verification && (
          <meta name="google-site-verification" content={tracking.google_site_verification} />
        )}
      </head>
      <body className="min-h-screen flex flex-col bg-sand-50 font-sans text-navy-950" suppressHydrationWarning>
        <StorefrontAnalytics tracking={tracking} />
        <StorefrontShell initialSections={initialSections} initialProducts={initialProducts}>{children}</StorefrontShell>
      </body>
    </html>
  );
}
