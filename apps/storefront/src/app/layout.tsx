import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart-context";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen flex flex-col bg-sand-50 font-sans text-navy-950">
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
