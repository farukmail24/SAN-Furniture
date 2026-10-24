import type { Metadata } from "next";
import { getLiveProducts } from "@/lib/catalog";
import { HomePageClient } from "@/components/home/HomePageClient";
import { getLiveReviews } from "@/lib/cms-server";

export const metadata: Metadata = {
  title: "SAN Furniture | Luxury Furniture Crafted for British Living",
  description:
    "Discover premium wardrobes, dining sets, chest of drawers, and living room collections. Reliable tracked delivery across the UK Mainland.",
  alternates: {
    canonical: "https://sanfurniture.com",
  },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [liveProducts, liveReviews] = await Promise.all([
    getLiveProducts(),
    getLiveReviews(),
  ]);

  return (
    <HomePageClient
      initialProducts={liveProducts}
      initialReviews={liveReviews}
    />
  );
}
