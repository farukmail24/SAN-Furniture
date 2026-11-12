import React from "react";
import Link from "next/link";
import { LegalClause, LegalDocumentLayout, LegalSectionCard, LegalTable } from "@/components/legal/LegalDocumentLayout";
import { CookiePreferencesButton } from "@/components/legal/CookiePreferencesButton";
import type { LegalPageCmsContent, LegalSectionItem } from "@/lib/legal-defaults";

const INLINE_TOKEN_REGEX =
  /(\[\[COOKIE_PREFERENCES_BUTTON\]\]|\*\*[^*]+\*\*|https:\/\/www\.sanfurniture\.com\/terms|https:\/\/www\.sanfurniture\.com\/privacy|https:\/\/ico\.org\.uk\/|www\.sanfurniture\.com|www\.getsafeonline\.org|aboutcookies\.org|privacy@sanfurniture\.com|\+4420 3150 3472)/g;

/**
 * Normalizes dynamic CMS legal content against statutory defaults.
 */
export function resolveLegalContent(
  rawContent: Partial<LegalPageCmsContent> | undefined,
  defaults: LegalPageCmsContent
): LegalPageCmsContent {
  const validSections =
    Array.isArray(rawContent?.sections) && rawContent.sections.length > 0
      ? rawContent.sections
          .filter((s): s is LegalSectionItem => Boolean(s && typeof s.title === "string" && s.title.trim()))
          .map((s, idx) => ({
            id: (s.id || `section-${idx + 1}`).trim(),
            title: s.title.trim(),
            body: typeof s.body === "string" ? s.body : "",
          }))
      : defaults.sections;

  return {
    page_badge: rawContent?.page_badge?.trim() || defaults.page_badge,
    page_title: rawContent?.page_title?.trim() || defaults.page_title,
    page_subtitle: rawContent?.page_subtitle?.trim() || defaults.page_subtitle,
    notice_title: rawContent?.notice_title?.trim() || defaults.notice_title,
    notice_body: rawContent?.notice_body?.trim() || defaults.notice_body,
    sections: validSections.length > 0 ? validSections : defaults.sections,
  };
}

/**
 * Renders inline formatting (**bold**, links, email, phone, cookie settings button).
 */
export function renderLegalInline(text: string): React.ReactNode {
  const parts = text.split(INLINE_TOKEN_REGEX);
  return parts.map((part, idx) => {
    if (!part) return null;

    if (part === "[[COOKIE_PREFERENCES_BUTTON]]") {
      return (
        <span key={idx} className="inline-block align-middle ml-1">
          <CookiePreferencesButton label="Cookie Preferences" />
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part === "https://www.sanfurniture.com/terms") {
      return (
        <Link key={idx} href="/terms" className="font-semibold text-brass-700 underline hover:text-brass-900">
          {part}
        </Link>
      );
    }
    if (part === "https://www.sanfurniture.com/privacy") {
      return (
        <Link key={idx} href="/privacy" className="text-brass-700 underline hover:text-brass-900">
          {part}
        </Link>
      );
    }
    if (part === "www.sanfurniture.com") {
      return (
        <Link key={idx} href="/" className="text-brass-700 underline hover:text-brass-900">
          {part}
        </Link>
      );
    }
    if (part === "https://ico.org.uk/") {
      return (
        <a
          key={idx}
          href="https://ico.org.uk/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brass-700 underline hover:text-brass-900"
        >
          {part}
        </a>
      );
    }
    if (part === "www.getsafeonline.org" || part === "aboutcookies.org") {
      return (
        <a
          key={idx}
          href={`https://${part}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brass-700 underline hover:text-brass-900"
        >
          {part}
        </a>
      );
    }
    if (part === "privacy@sanfurniture.com") {
      return (
        <a key={idx} href="mailto:privacy@sanfurniture.com" className="text-brass-700 underline hover:text-brass-900">
          {part}
        </a>
      );
    }
    if (part === "+4420 3150 3472") {
      return (
        <a key={idx} href="tel:+442031503472" className="font-semibold text-brass-700 underline hover:text-brass-900">
          {part}
        </a>
      );
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function parsePipeRow(line: string): [string, string] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const cells = trimmed
    .slice(1, -1)
    .split("|")
    .map((c) => c.trim());
  if (cells.length < 2) return null;
  return [cells[0], cells.slice(1).join(" | ")];
}

/**
 * Renders structured legal section text into numbered/indented clauses,
 * subheadings, and responsive two-column tables.
 */
export function DynamicLegalSectionBody({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i++;
      continue;
    }

    // Collect contiguous markdown pipe table lines
    if (line.startsWith("|") && line.endsWith("|")) {
      const parsedRows: [string, string][] = [];
      while (i < lines.length) {
        const row = parsePipeRow(lines[i]);
        if (!row) break;
        parsedRows.push(row);
        i++;
      }
      if (parsedRows.length >= 2) {
        const headers = parsedRows[0];
        const dataRows = parsedRows.slice(1);
        nodes.push(
          <div key={`tbl-${i}`} className="pt-1 pb-2">
            <LegalTable
              headers={headers}
              rows={dataRows}
              narrowFirstColumn={headers[0].toLowerCase() !== "description"}
            />
          </div>
        );
        continue;
      }
    }

    // Subheading (e.g. ### Strictly necessary)
    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={`h3-${i}`} className="font-display text-base font-bold text-navy-950 pt-3">
          {line.slice(4).trim()}
        </h3>
      );
      i++;
      continue;
    }

    // Top-level numbered clause (e.g. "1. ..." or "19. ...")
    const topMatch = line.match(/^(\d+\.)\s+(.*)$/);
    if (topMatch) {
      nodes.push(
        <LegalClause key={`c-${i}`} num={topMatch[1]}>
          <p>{renderLegalInline(topMatch[2])}</p>
        </LegalClause>
      );
      i++;
      continue;
    }

    // Indented sub-clause ("2.1 ..." or "a. ...")
    const subMatch = line.match(/^(\d+\.\d+|[a-z]\.)\s+(.*)$/);
    if (subMatch) {
      nodes.push(
        <LegalClause key={`sc-${i}`} num={subMatch[1]} indent>
          <p>{renderLegalInline(subMatch[2])}</p>
        </LegalClause>
      );
      i++;
      continue;
    }

    // Plain paragraph
    nodes.push(<p key={`p-${i}`}>{renderLegalInline(line)}</p>);
    i++;
  }

  return <>{nodes}</>;
}

/**
 * Full CMS-driven legal document page renderer shared by /terms and /privacy.
 */
export function DynamicLegalDocumentView({
  breadcrumbLabel,
  badgeIcon,
  content,
}: {
  breadcrumbLabel: string;
  badgeIcon: React.ReactNode;
  content: LegalPageCmsContent;
}) {
  const navItems = content.sections.map((s) => ({
    id: s.id,
    label: s.title,
  }));

  return (
    <LegalDocumentLayout
      breadcrumbLabel={breadcrumbLabel}
      badgeIcon={badgeIcon}
      badgeText={content.page_badge}
      title={content.page_title}
      subtitle={content.page_subtitle}
      noticeTitle={content.notice_title}
      noticeBody={<p>{renderLegalInline(content.notice_body)}</p>}
      navItems={navItems}
    >
      {content.sections.map((sec) => (
        <LegalSectionCard key={sec.id} id={sec.id} title={sec.title}>
          <DynamicLegalSectionBody body={sec.body} />
        </LegalSectionCard>
      ))}
    </LegalDocumentLayout>
  );
}
