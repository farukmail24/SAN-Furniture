import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getLiveSections } from "@/lib/cms-server";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";
import { LEGAL_PRIVACY_DEFAULT_CONTENT, type LegalPageCmsContent } from "@/lib/legal-defaults";
import { DynamicLegalDocumentView, resolveLegalContent } from "@/components/legal/DynamicLegalContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Privacy Policy & Cookies Schedule | SAN Furniture Limited",
  description:
    "Privacy Policy and Cookies Schedule of SAN Furniture Limited (Company No. 11733475) in accordance with UK GDPR, Data Protection Laws, and UK and EU Cookie Law.",
  alternates: {
    canonical: "https://sanfurniture.com/privacy",
  },
};

export default async function PrivacyPage() {
  const sections = await getLiveSections("legal", { fresh: true });
  const raw = (sections?.legal_privacy?.content ||
    DEFAULT_STOREFRONT_SECTIONS.legal_privacy?.content ||
    LEGAL_PRIVACY_DEFAULT_CONTENT) as Partial<LegalPageCmsContent>;

  const content = resolveLegalContent(raw, LEGAL_PRIVACY_DEFAULT_CONTENT);

  return (
    <DynamicLegalDocumentView
      breadcrumbLabel="Privacy Policy"
      badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-brass-600" />}
      content={content}
    />
  );
}
