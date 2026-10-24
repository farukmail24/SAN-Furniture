import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();
    const body = await request.json();
    const { name, handle, description, heroImage } = body;

    const fields: string[] = [];
    const paramsList: any[] = [];
    if (name) {
      fields.push("name = ?");
      paramsList.push(name);
    }
    if (handle) {
      fields.push("handle = ?");
      paramsList.push(handle);
    }
    if (description !== undefined) {
      fields.push("description = ?");
      paramsList.push(description);
    }
    if (heroImage) {
      fields.push("hero_image = ?");
      paramsList.push(heroImage);
    }

    if (fields.length > 0) {
      paramsList.push(id);
      await pool.query(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`, paramsList);
    }

    return NextResponse.json({ success: true, message: `Category ${id} updated` });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to update category", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getDbPool();

    await pool.query("DELETE FROM categories WHERE id = ?", [id]);
    return NextResponse.json({ success: true, message: `Category ${id} deleted` });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to delete category", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
