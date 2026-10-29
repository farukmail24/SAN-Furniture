import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

function getPageKeyForSection(sectionKey: string): string {
  if (sectionKey.startsWith("header_")) return "header";
  if (sectionKey.startsWith("footer_")) return "footer";
  if (sectionKey.startsWith("catalog_")) return "catalog";
  if (sectionKey.startsWith("pdp_")) return "product_detail";
  if (sectionKey.startsWith("cart_")) return "cart";
  if (sectionKey.startsWith("checkout_")) return "checkout";
  if (sectionKey.startsWith("about_")) return "about";
  if (sectionKey.startsWith("delivery_") || sectionKey.startsWith("returns_")) return "delivery_returns";
  if (sectionKey.startsWith("contact_") || sectionKey.startsWith("faq_")) return "contact_faq";
  if (sectionKey.startsWith("account_")) return "account";
  return "home";
}

async function ensureAndSeedSectionsTable(pool: any): Promise<any[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_page_sections (
      id VARCHAR(64) PRIMARY KEY,
      page_key VARCHAR(64) NOT NULL,
      section_key VARCHAR(64) UNIQUE NOT NULL,
      section_name VARCHAR(128) NOT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      content_json LONGTEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_page_key (page_key),
      INDEX idx_sort_order (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `).catch(() => {});

  const [rows]: any = await pool.query(
    "SELECT * FROM site_page_sections ORDER BY page_key ASC, sort_order ASC"
  ).catch(() => [[]]);

  if (Array.isArray(rows) && rows.length > 0) {
    return rows;
  }

  // Auto-seed default sections into database table
  try {
    for (const [sectionKey, sec] of Object.entries(DEFAULT_STOREFRONT_SECTIONS)) {
      const secId = `sec_${sectionKey}`;
      const pageKey = getPageKeyForSection(sectionKey);
      await pool.query(
        `INSERT IGNORE INTO site_page_sections (id, page_key, section_key, section_name, is_enabled, sort_order, content_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          secId,
          pageKey,
          sectionKey,
          sec.sectionName,
          sec.isEnabled ? 1 : 0,
          0,
          JSON.stringify(sec.content || {}),
        ]
      ).catch(() => {});
    }

    const [reFetched]: any = await pool.query(
      "SELECT * FROM site_page_sections ORDER BY page_key ASC, sort_order ASC"
    ).catch(() => [[]]);

    if (Array.isArray(reFetched) && reFetched.length > 0) {
      return reFetched;
    }
  } catch (err) {
    console.warn("Auto-seeding site_page_sections failed:", err);
  }

  return [];
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const rows = await ensureAndSeedSectionsTable(pool);

    let sections: any[] = [];
    if (Array.isArray(rows) && rows.length > 0) {
      sections = rows.map((r: any) => {
        let content = {};
        try {
          content =
            typeof r.content_json === "string"
              ? JSON.parse(r.content_json || "{}")
              : r.content_json || {};
        } catch {
          content = {};
        }
        return {
          id: r.id,
          pageKey: r.page_key,
          sectionKey: r.section_key,
          sectionName: r.section_name,
          isEnabled: Boolean(r.is_enabled),
          sortOrder: r.sort_order,
          content,
          updatedAt: r.updated_at,
        };
      });
    } else {
      sections = Object.entries(DEFAULT_STOREFRONT_SECTIONS).map(([sectionKey, sec]) => ({
        id: `sec_${sectionKey}`,
        pageKey: getPageKeyForSection(sectionKey),
        sectionKey,
        sectionName: sec.sectionName,
        isEnabled: sec.isEnabled,
        sortOrder: 0,
        content: sec.content,
      }));
    }

    const pages: Record<string, any[]> = {};
    for (const s of sections) {
      if (!pages[s.pageKey]) pages[s.pageKey] = [];
      pages[s.pageKey].push(s);
    }

    return NextResponse.json({ success: true, sections, pages });
  } catch (err: any) {
    console.warn("[Admin CMS Sections Fallback]:", err?.message);
    const sections = Object.entries(DEFAULT_STOREFRONT_SECTIONS).map(([sectionKey, sec]) => ({
      id: `sec_${sectionKey}`,
      pageKey: getPageKeyForSection(sectionKey),
      sectionKey,
      sectionName: sec.sectionName,
      isEnabled: sec.isEnabled,
      sortOrder: 0,
      content: sec.content,
    }));
    const pages: Record<string, any[]> = {};
    for (const s of sections) {
      if (!pages[s.pageKey]) pages[s.pageKey] = [];
      pages[s.pageKey].push(s);
    }
    return NextResponse.json({ success: true, sections, pages, fallback: true });
  }
}
