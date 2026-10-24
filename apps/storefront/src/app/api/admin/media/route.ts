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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");

    const pool = getDbPool();
    let query = "SELECT * FROM media_assets";
    const params: any[] = [];
    const conditions: string[] = [];

    if (category && category !== "all") {
      conditions.push("category = ?");
      params.push(category);
    }
    if (search) {
      conditions.push("(file_name LIKE ? OR alt_text LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY created_at DESC";

    const [media]: any = await pool.query(query, params);
    return NextResponse.json({
      success: true,
      media: Array.isArray(media) ? media : [],
    });
  } catch (err: any) {
    console.error("Failed to fetch media assets:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch media", details: err?.message || String(err) },
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
    const {
      fileName,
      fileUrl,
      altText,
      category = "product",
      mimeType = "image/jpeg",
      widthPx = 1200,
      heightPx = 800,
      fileSizeBytes = 250000,
    } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "File URL is required" }, { status: 400 });
    }

    const mediaId = `media_${Date.now()}`;
    const name = fileName || fileUrl.split("/").pop()?.split("?")[0] || "furniture-image.jpg";

    await pool.query(
      `INSERT INTO media_assets (id, file_name, file_url, file_size_bytes, mime_type, width_px, height_px, alt_text, category)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mediaId, name, fileUrl, fileSizeBytes, mimeType, widthPx, heightPx, altText || name, category]
    );

    return NextResponse.json(
      { success: true, media: { id: mediaId, file_name: name, file_url: fileUrl } },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create media", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
