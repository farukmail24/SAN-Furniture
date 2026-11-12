import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";
import { LEGAL_TERMS_DEFAULT_CONTENT, type LegalPageCmsContent } from "@/lib/legal-defaults";
import { DynamicLegalDocumentView, resolveLegalContent } from "@/components/legal/DynamicLegalContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Terms and Conditions | SAN Furniture Limited",
  description:
    "Terms and Conditions of SAN Furniture Limited (Company No. 11733475) governing orders, delivery, cancellations, conformity, privacy, and UK consumer rights.",
  alternates: {
    canonical: "https://sanfurniture.com/terms",
  },
};

export default async function TermsPage() {
  const sections = await getLiveSections("legal", { fresh: true });
  const raw = (sections?.legal_terms?.content ||
    DEFAULT_STOREFRONT_SECTIONS.legal_terms?.content ||
    LEGAL_TERMS_DEFAULT_CONTENT) as Partial<LegalPageCmsContent>;

  const content = resolveLegalContent(raw, LEGAL_TERMS_DEFAULT_CONTENT);

  return (
    <DynamicLegalDocumentView
      breadcrumbLabel="Terms and Conditions"
      badgeIcon={<Scale className="w-3.5 h-3.5 text-brass-600" />}
      content={content}
    />
  );
}
