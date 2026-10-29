import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest, getAdminFromRequest } from "@/lib/auth-token";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryEmail = (searchParams.get("email") || "").trim().toLowerCase();

    const authCust = await getCustomerFromRequest(request);
    const authAdmin = !authCust ? await getAdminFromRequest(request) : null;

    if (!authCust && !authAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sign in required to view wishlist", wishlist: [] },
        { status: 401 }
      );
    }

    const targetEmail = authCust ? authCust.email.toLowerCase() : queryEmail;

    if (!targetEmail) {
      return NextResponse.json({ success: true, wishlist: [] });
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT w.id, w.product_id, w.created_at, p.title, p.handle, p.price_pennies, p.thumbnail_url, p.status
       FROM customer_wishlist w
       LEFT JOIN products p ON w.product_id = p.id
       WHERE LOWER(w.customer_email) = ?
       ORDER BY w.created_at DESC`,
      [targetEmail]
    );

    const wishlist = (Array.isArray(rows) ? rows : []).map((r: any) => ({
      id: r.id,
      productId: r.product_id,
      title: r.title || "Curated Furniture Item",
      handle: r.handle || r.product_id,
      pricePennies: Number(r.price_pennies) || 0,
      thumbnailUrl: r.thumbnail_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80",
      status: r.status || "published",
      createdAt: String(r.created_at),
    }));

    return NextResponse.json({
      success: true,
      wishlist,
      total: wishlist.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch wishlist", details: err?.message || String(err), wishlist: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const productId = body.productId || body.id;
    const email = (body.customerEmail || body.email || "").trim().toLowerCase();

    const authCust = await getCustomerFromRequest(request);
    const authAdmin = !authCust ? await getAdminFromRequest(request) : null;

    if (!authCust && !authAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sign in required to save items to wishlist" },
        { status: 401 }
      );
    }

    const targetEmail = authCust ? authCust.email.toLowerCase() : email;

    if (!productId || !targetEmail) {
      return NextResponse.json(
        { success: false, error: "Product reference and customer email are required" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const [custRows]: any = await pool.query(
      "SELECT id FROM customers WHERE LOWER(email) = ? LIMIT 1",
      [targetEmail]
    );

    const customerId = custRows?.[0]?.id || `cust_${crypto.createHash("md5").update(targetEmail).digest("hex").slice(0, 12)}`;
    const wishId = `wish_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    await pool.query(
      `INSERT INTO customer_wishlist (id, customer_id, customer_email, product_id, created_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE created_at = NOW()`,
      [wishId, customerId, targetEmail, productId]
    );

    return NextResponse.json({
      success: true,
      message: "Item saved to luxury wishlist",
      wishlistId: wishId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to add to wishlist", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const queryEmail = (searchParams.get("email") || "").trim().toLowerCase();

    const authCust = await getCustomerFromRequest(request);
    const authAdmin = !authCust ? await getAdminFromRequest(request) : null;

    if (!authCust && !authAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Sign in required to modify wishlist" },
        { status: 401 }
      );
    }

    const targetEmail = authCust ? authCust.email.toLowerCase() : queryEmail;

    if (!id || !targetEmail) {
      return NextResponse.json(
        { success: false, error: "Missing item identifier or authenticated customer email" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    await pool.query(
      "DELETE FROM customer_wishlist WHERE (id = ? OR product_id = ?) AND LOWER(customer_email) = ?",
      [id, id, targetEmail]
    );

    return NextResponse.json({
      success: true,
      message: "Item removed from wishlist",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to delete item from wishlist", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
