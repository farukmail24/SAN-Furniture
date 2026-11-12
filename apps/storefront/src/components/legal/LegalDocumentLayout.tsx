import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface LegalNavItem {
  id: string;
  label: string;
}

interface LegalDocumentLayoutProps {
  breadcrumbLabel: string;
  badgeIcon: React.ReactNode;
  badgeText: string;
  title: string;
  subtitle: string;
  noticeTitle?: string;
  noticeBody: React.ReactNode;
  navItems: LegalNavItem[];
  children: React.ReactNode;
}

/**
 * Shared legal document layout providing breadcrumb navigation, editorial header,
 * prominent statutory notice box, sticky quick-jump section index, and prose cards.
 */
export function LegalDocumentLayout({
  breadcrumbLabel,
  badgeIcon,
  badgeText,
  title,
  subtitle,
  noticeTitle,
  noticeBody,
  navItems,
  children,
}: LegalDocumentLayoutProps) {
  return (
    <div className="bg-sand-50 min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="border-b border-sand-200 bg-sand-100/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-3 flex items-center text-xs text-navy-600 gap-1.5">
          <Link href="/" className="hover:text-navy-950 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-sand-400" />
          <span className="font-semibold text-navy-950">{breadcrumbLabel}</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-sand-200 bg-sand-100/40 py-10 sm:py-14">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sand-200/80 text-navy-800 text-[11px] font-semibold tracking-wider uppercase">
              {badgeIcon}
              {badgeText}
            </span>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-navy-950">
              {title}
            </h1>
            <p className="text-sm text-navy-700 leading-relaxed">{subtitle}</p>
          </div>
        </div>
      </section>

      {/* Document Body + Quick-Jump Sidebar */}
      <section className="py-10 sm:py-14 max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Quick-Jump Index */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 bg-white rounded-2xl border border-sand-200 p-5 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-navy-500">
              Sections
            </p>
            <nav aria-label="Document sections" className="max-h-[65vh] overflow-y-auto pr-1">
              <ol className="space-y-1 text-xs">
                {navItems.map((item, idx) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-start gap-2 py-1 px-2 rounded-lg text-navy-700 hover:text-navy-950 hover:bg-sand-100/70 transition-colors"
                    >
                      <span className="text-[11px] font-mono text-brass-600 shrink-0 mt-0.5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="leading-snug">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          {/* Main Legal Clauses */}
          <div className="lg:col-span-9 space-y-6 text-xs sm:text-sm text-navy-800 leading-relaxed">
            <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 sm:p-6 space-y-2 text-navy-900">
              {noticeTitle && (
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {noticeTitle}
                </p>
              )}
              <div className="text-xs sm:text-sm leading-relaxed">{noticeBody}</div>
            </div>

            {children}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Standard anchored section card for legal clauses.
 */
export function LegalSectionCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article
      id={id}
      className="scroll-mt-24 bg-white p-6 sm:p-8 rounded-2xl border border-sand-200 space-y-4"
    >
      <h2 className="font-display text-lg sm:text-xl font-bold text-navy-950 border-b border-sand-100 pb-3">
        {title}
      </h2>
      <div className="space-y-3 text-navy-700">{children}</div>
    </article>
  );
}

/**
 * Renders a numbered or lettered legal clause with clean hanging alignment.
 */
export function LegalClause({
  num,
  children,
  indent = false,
}: {
  num: string;
  children: React.ReactNode;
  indent?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 ${indent ? "pl-5 sm:pl-7" : ""}`}>
      <span className="font-semibold text-navy-950 shrink-0 min-w-[1.75rem] tabular-nums">
        {num}
      </span>
      <div className="flex-1 space-y-2.5">{children}</div>
    </div>
  );
}

/**
 * Responsive two-column legal reference table (definitions, cookie schedules).
 */
export function LegalTable({
  headers,
  rows,
  narrowFirstColumn = true,
}: {
  headers: [string, string];
  rows: ReadonlyArray<readonly [string, string]>;
  narrowFirstColumn?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sand-200">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead className="bg-sand-100/80 text-navy-950 border-b border-sand-200">
          <tr>
            <th
              scope="col"
              className={`py-3 px-4 font-semibold ${
                narrowFirstColumn ? "w-1/3 sm:w-56" : "w-3/4"
              }`}
            >
              {headers[0]}
            </th>
            <th scope="col" className="py-3 px-4 font-semibold">
              {headers[1]}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-200 bg-white">
          {rows.map(([col1, col2]) => (
            <tr key={col1} className="align-top">
              <td
                className={`py-3 px-4 ${
                  narrowFirstColumn ? "font-semibold text-navy-950" : "text-navy-700"
                }`}
              >
                {col1}
              </td>
              <td className="py-3 px-4 text-navy-700">{col2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
