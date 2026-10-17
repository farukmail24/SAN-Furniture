import type { Metadata } from "next";
import { getLiveProducts } from "@/lib/catalog";
import { HomePageClient } from "@/components/home/HomePageClient";

export const metadata: Metadata = {
  title: "SAN Furniture | Luxury Furniture Crafted for British Living",
  description:
    "Discover handcrafted sofas, solid oak dining sets, and bespoke bouclé accent chairs. Enjoy free 2-man white glove delivery across the UK and Klarna interest-free financing.",
  alternates: {
    canonical: "https://sanfurniture.com",
  },
};

export default async function HomePage() {
  const liveProducts = await getLiveProducts();
  return <HomePageClient initialProducts={liveProducts} />;
}
