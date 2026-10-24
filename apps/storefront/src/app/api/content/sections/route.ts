import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { DEFAULT_STOREFRONT_SECTIONS } from "@/lib/cms-defaults";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageFilter = searchParams.get("page");

    const pool = getDbPool();
    let q = "SELECT * FROM site_page_sections";
    const params: any[] = [];

    if (pageFilter && pageFilter !== "all") {
      q += " WHERE page_key = ?";
      params.push(pageFilter);
    }
    q += " ORDER BY sort_order ASC, updated_at ASC";

    const [rows]: any = await pool.query(q, params);
    const sectionsMap: Record<string, any> = {};
    const list: any[] = [];

    if (Array.isArray(rows) && rows.length > 0) {
      for (const row of rows) {
        let parsedContent = {};
        try {
          parsedContent = typeof row.content_json === "string"
            ? JSON.parse(row.content_json)
            : (row.content_json || {});
        } catch {
          parsedContent = {};
        }

        const secObj = {
          id: row.id,
          pageKey: row.page_key,
          sectionKey: row.section_key,
          sectionName: row.section_name,
          isEnabled: Boolean(row.is_enabled),
          sortOrder: row.sort_order,
          content: parsedContent,
          updatedAt: row.updated_at,
        };

        sectionsMap[row.section_key] = secObj;
        list.push(secObj);
      }
    } else {
      // Fallback to cms defaults if database table is empty
      for (const [key, defaultSec] of Object.entries(DEFAULT_STOREFRONT_SECTIONS)) {
        if (!pageFilter || pageFilter === "all" || (defaultSec as any).pageKey === pageFilter) {
          sectionsMap[key] = defaultSec;
          list.push(defaultSec);
        }
      }
    }

    return NextResponse.json(
      {
        sections: sectionsMap,
        sectionsList: list,
        total: list.length,
        cached: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=15, stale-while-revalidate=60",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err: any) {
    console.warn("[Content Sections Fallback]:", err?.message);
    // Graceful fallback to default sections so storefront never breaks even if DB is momentarily unreachable
    const sectionsMap: Record<string, any> = {};
    const list: any[] = [];
    for (const [key, defaultSec] of Object.entries(DEFAULT_STOREFRONT_SECTIONS)) {
      sectionsMap[key] = defaultSec;
      list.push(defaultSec);
    }

    return NextResponse.json(
      {
        sections: sectionsMap,
        sectionsList: list,
        total: list.length,
        cached: true,
      },
      { status: 200 }
    );
  }
}
