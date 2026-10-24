import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";
import { invalidateServerSectionsCache } from "@/lib/cms-server";

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

async function ensureSectionsTable(pool: any) {
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
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  try {
    const resolvedParams = params ? await params : ({} as any);
    const sectionKey = resolvedParams.sectionKey;
    if (!sectionKey) {
      return NextResponse.json({ success: false, error: "Missing sectionKey parameter" }, { status: 400 });
    }

    const pool = getDbPool();
    await ensureSectionsTable(pool);

    const [rows]: any = await pool.query(
      "SELECT * FROM site_page_sections WHERE section_key = ? LIMIT 1",
      [sectionKey]
    ).catch(() => [[]]);

    if (!rows || rows.length === 0) {
      const defaultSec = DEFAULT_STOREFRONT_SECTIONS[sectionKey];
      if (defaultSec) {
        return NextResponse.json({
          success: true,
          section: {
            id: `sec_${sectionKey}`,
            pageKey: getPageKeyForSection(sectionKey),
            sectionKey,
            sectionName: defaultSec.sectionName,
            isEnabled: defaultSec.isEnabled,
            sortOrder: 0,
            content: defaultSec.content,
          },
        });
      }
      return NextResponse.json({ success: false, error: `Section "${sectionKey}" not found` }, { status: 404 });
    }

    const r = rows[0];
    let content = {};
    try {
      content =
        typeof r.content_json === "string"
          ? JSON.parse(r.content_json || "{}")
          : r.content_json || {};
    } catch {
      content = {};
    }

    return NextResponse.json({
      success: true,
      section: {
        id: r.id,
        pageKey: r.page_key,
        sectionKey: r.section_key,
        sectionName: r.section_name,
        isEnabled: Boolean(r.is_enabled),
        sortOrder: r.sort_order,
        content,
        updatedAt: r.updated_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch section", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  return handleUpdate(request, params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sectionKey: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: Request,
  paramsPromise: Promise<{ sectionKey: string }> | undefined
) {
  try {
    const resolvedParams = paramsPromise ? await paramsPromise : ({} as any);
    const sectionKey = resolvedParams.sectionKey;
    if (!sectionKey) {
      return NextResponse.json({ success: false, error: "Missing sectionKey parameter" }, { status: 400 });
    }

    const pool = getDbPool();
    await ensureSectionsTable(pool);

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { isEnabled, content, sectionName, sortOrder } = body;

    const [existing]: any = await pool.query(
      "SELECT id, content_json, page_key, section_name, sort_order FROM site_page_sections WHERE section_key = ?",
      [sectionKey]
    ).catch(() => [[]]);

    let currentParsed = {};
    const defaultSec = DEFAULT_STOREFRONT_SECTIONS[sectionKey];

    if (existing && existing.length > 0) {
      try {
        currentParsed =
          typeof existing[0].content_json === "string"
            ? JSON.parse(existing[0].content_json)
            : existing[0].content_json || {};
      } catch {
        currentParsed = defaultSec?.content || {};
      }
    } else {
      currentParsed = defaultSec?.content || {};
    }

    const updatedContent =
      content !== undefined ? { ...currentParsed, ...content } : currentParsed;
    const contentJsonStr = JSON.stringify(updatedContent);
    const isEnabledVal = isEnabled !== undefined ? (isEnabled ? 1 : 0) : 1;

    if (existing && existing.length > 0) {
      await pool.query(
        "UPDATE site_page_sections SET is_enabled = ?, content_json = ?, section_name = COALESCE(?, section_name), sort_order = COALESCE(?, sort_order), updated_at = NOW() WHERE section_key = ?",
        [isEnabledVal, contentJsonStr, sectionName || null, sortOrder !== undefined ? sortOrder : null, sectionKey]
      );
    } else {
      const pageKey = getPageKeyForSection(sectionKey);
      const secName = sectionName || defaultSec?.sectionName || sectionKey;
      const sortVal = sortOrder !== undefined ? sortOrder : 0;
      const id = `sec_${sectionKey}`;

      await pool.query(
        `INSERT INTO site_page_sections (id, page_key, section_key, section_name, is_enabled, sort_order, content_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE 
           is_enabled = VALUES(is_enabled),
           content_json = VALUES(content_json),
           section_name = VALUES(section_name),
           sort_order = VALUES(sort_order),
           updated_at = NOW()`,
        [id, pageKey, sectionKey, secName, isEnabledVal, sortVal, contentJsonStr]
      );
    }

    invalidateServerSectionsCache();

    return NextResponse.json({
      success: true,
      message: `Section "${sectionKey}" updated successfully.`,
      section: {
        sectionKey,
        isEnabled: Boolean(isEnabledVal),
        content: updatedContent,
      },
    });
  } catch (err: any) {
    console.error(`Failed to update section:`, err);
    return NextResponse.json(
      { error: "Failed to update section", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
