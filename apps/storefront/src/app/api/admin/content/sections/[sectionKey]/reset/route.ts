import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";
import { invalidateServerSectionsCache } from "@/lib/cms-server";
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = params ? await params : ({} as any);
    const sectionKey = resolvedParams.sectionKey;
    if (!sectionKey) {
      return NextResponse.json({ success: false, error: "Missing sectionKey parameter" }, { status: 400 });
    }
    const defaultSec = DEFAULT_STOREFRONT_SECTIONS[sectionKey];

    if (!defaultSec) {
      return NextResponse.json(
        { error: `Factory default definition for section "${sectionKey}" not found.` },
        { status: 404 }
      );
    }

    const pool = getDbPool();

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

    const contentJson = JSON.stringify(defaultSec.content || {});
    const isEnabledVal = defaultSec.isEnabled ? 1 : 0;
    const secId = `sec_${sectionKey}`;
    const pageKey = getPageKeyForSection(sectionKey);

    await pool.query(
      `INSERT INTO site_page_sections (id, page_key, section_key, section_name, is_enabled, sort_order, content_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE 
         is_enabled = VALUES(is_enabled),
         content_json = VALUES(content_json),
         section_name = VALUES(section_name),
         sort_order = VALUES(sort_order),
         updated_at = NOW()`,
      [
        secId,
        pageKey,
        sectionKey,
        defaultSec.sectionName,
        isEnabledVal,
        0,
        contentJson,
      ]
    );

    invalidateServerSectionsCache();

    return NextResponse.json({
      success: true,
      message: `Section "${sectionKey}" restored to official factory defaults.`,
      section: {
        id: secId,
        pageKey,
        sectionKey,
        sectionName: defaultSec.sectionName,
        isEnabled: Boolean(defaultSec.isEnabled),
        sortOrder: 0,
        content: defaultSec.content,
      },
    });
  } catch (err: any) {
    console.error(`Failed to reset section:`, err);
    return NextResponse.json(
      { error: "Failed to reset section", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
