import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCategoryByHandle } from "@/lib/catalog";

interface CategoryRedirectPageProps {
  params: Promise<{
    handle: string;
  }>;
  searchParams?: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CategoryRedirectPageProps): Promise<Metadata> {
  const { handle } = await params;
  const category = getCategoryByHandle(handle);

  if (!category) {
    return { title: "Category Not Found | SAN Furniture" };
  }

  return {
    title: `${category.name} | SAN Furniture UK`,
    description: category.description,
    alternates: {
      canonical: `https://sanfurniture.com/${category.handle}`,
    },
  };
}

/**
 * 308 Permanent Redirect for all legacy /categories/:handle URLs to root /:handle
 * Preserves all search parameters (?type=2-seater, ?material=..., etc.)
 */
export default async function CategoryRedirectPage({
  params,
  searchParams,
}: CategoryRedirectPageProps) {
  const { handle } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const category = getCategoryByHandle(handle);

  if (!category) {
    notFound();
  }

  const searchEntries = Object.entries(resolvedSearchParams).flatMap(([k, v]) =>
    Array.isArray(v) ? v.map((item) => [k, item]) : typeof v === "string" ? [[k, v]] : []
  );
  const qs = new URLSearchParams(searchEntries).toString();

  // Permanent 308 SEO redirect to root category URL
  redirect(`/${category.handle}${qs ? `?${qs}` : ""}`);
}
