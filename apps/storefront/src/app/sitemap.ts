import { MetadataRoute } from "next";
import { CATALOG_CATEGORIES, getLiveProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://sanfurniture.co.uk";
  const now = new Date();
  const liveProducts = await getLiveProducts();

  // Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Category Pages
  const categoryRoutes: MetadataRoute.Sitemap = CATALOG_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categories/${cat.handle}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Programmatic Curated Collections
  const collectionRoutes: MetadataRoute.Sitemap = [
    "boucle-sofas",
    "velvet-accent-armchairs",
    "solid-oak-dining-tables",
  ].map((slug) => ({
    url: `${baseUrl}/collections/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Product Detail Pages
  const productRoutes: MetadataRoute.Sitemap = liveProducts
    .filter((p) => p.status !== "draft")
    .map((product) => ({
      url: `${baseUrl}/products/${product.handle}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticRoutes, ...categoryRoutes, ...collectionRoutes, ...productRoutes];
}
