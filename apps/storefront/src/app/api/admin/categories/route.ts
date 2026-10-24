import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const [cats]: any = await pool.query(`
      SELECT c.*, COUNT(p.id) AS products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `);

    return NextResponse.json({
      success: true,
      categories: Array.isArray(cats) ? cats : [],
    });
  } catch (err: any) {
    console.error("Failed to fetch admin categories:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();
    const { name, handle, description, heroImage } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const catHandle =
      handle ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const catId = `cat_${catHandle.replace(/-/g, "_")}`;

    await pool.query(
      "INSERT INTO categories (id, name, handle, description, hero_image) VALUES (?, ?, ?, ?, ?)",
      [
        catId,
        name,
        catHandle,
        description || "",
        heroImage ||
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        category: { id: catId, name, handle: catHandle },
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create category", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
