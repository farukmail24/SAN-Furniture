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
};

import React from "react";
import { StorefrontShell } from "@/components/layout/StorefrontShell";
import { getLiveSections } from "@/lib/cms-server";
import { getLiveProducts } from "@/lib/catalog";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [initialSections, initialProducts] = await Promise.all([
    getLiveSections("all", { fresh: true }),
    getLiveProducts(),
  ]);

  return (
    <html lang="en-GB" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-sand-50 font-sans text-navy-950" suppressHydrationWarning>
        <StorefrontShell initialSections={initialSections} initialProducts={initialProducts}>{children}</StorefrontShell>
      </body>
    </html>
  );
}
