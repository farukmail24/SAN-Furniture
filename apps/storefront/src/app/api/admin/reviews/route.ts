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
    const status = searchParams.get("status");

    const pool = getDbPool();
    let q = "SELECT * FROM customer_reviews";
    const params: any[] = [];
    if (status) {
      q += " WHERE status = ?";
      params.push(status);
    }
    q += " ORDER BY created_at DESC";

    const [reviews]: any = await pool.query(q, params);
    return NextResponse.json({
      success: true,
      reviews: Array.isArray(reviews) ? reviews : [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch reviews", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
