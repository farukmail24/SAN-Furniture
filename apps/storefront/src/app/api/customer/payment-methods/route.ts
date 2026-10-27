import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getCustomerFromRequest, getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Strict authentication: customer token or admin token required
    const authCustomer = await getCustomerFromRequest(request);
    const authAdmin = !authCustomer ? await getAdminFromRequest(request) : null;

    if (!authCustomer && !authAdmin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Customer or admin authorization required", paymentMethods: [] },
        { status: 401 }
      );
    }

    const email = authCustomer ? authCustomer.email.toLowerCase() : searchParams.get("email")?.trim().toLowerCase();
    const customerId = authCustomer ? authCustomer.id : searchParams.get("customerId")?.trim() || "";

    if (!email && !customerId) {
      return NextResponse.json({ success: true, paymentMethods: [] });
    }

    const pool = getDbPool();
    const [rows]: any = await pool.query(
      `SELECT id, customer_id, customer_email, brand, last4, exp_month, exp_year, cardholder_name, is_saved_for_future, is_default, created_at 
       FROM customer_payment_methods 
       WHERE (customer_email = ? OR (? != '' AND customer_id = ?)) AND is_saved_for_future = 1 
       ORDER BY is_default DESC, created_at DESC`,
      [email || "", customerId, customerId]
    );

    // Strict Enforcement: Exactly ONE default card per customer
    let foundDefault = false;
    const sanitizedMethods = (Array.isArray(rows) ? rows : []).map((pm: any) => {
      if (Boolean(pm.is_default) && !foundDefault) {
        foundDefault = true;
        return { ...pm, is_default: 1 };
      }
      return { ...pm, is_default: 0 };
    });

    if (!foundDefault && sanitizedMethods.length > 0) {
      sanitizedMethods[0].is_default = 1;
    }

    return NextResponse.json({
      success: true,
      paymentMethods: sanitizedMethods,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve payment methods", details: err?.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { id, action } = body;

    const authCustomer = await getCustomerFromRequest(request);
    const authAdmin = !authCustomer ? await getAdminFromRequest(request) : null;

    if (!authCustomer && !authAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = authCustomer ? authCustomer.email.toLowerCase() : body.email?.trim().toLowerCase();
    const customerId = authCustomer ? authCustomer.id : body.customerId?.trim() || "";

    if (!id || (!email && !customerId)) {
      return NextResponse.json(
        { success: false, error: "Payment method ID and customer identifier are required" },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    if (action === "set_default" || !action) {
      // Atomic transition: reset all to non-default, then assign specified card as default
      await pool.query(
        "UPDATE customer_payment_methods SET is_default = 0 WHERE (customer_email = ? OR (? != '' AND customer_id = ?))",
        [email || "", customerId, customerId]
      );

      const [res]: any = await pool.query(
        "UPDATE customer_payment_methods SET is_default = 1 WHERE id = ? AND (customer_email = ? OR (? != '' AND customer_id = ?))",
        [id, email || "", customerId, customerId]
      );

      if (res.affectedRows === 0) {
        return NextResponse.json(
          { success: false, error: "Payment instrument not found or does not belong to this customer." },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Default payment method updated successfully.",
        defaultId: id,
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to update default payment method", details: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const authCustomer = await getCustomerFromRequest(request);
    const authAdmin = !authCustomer ? await getAdminFromRequest(request) : null;

    if (!authCustomer && !authAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = authCustomer ? authCustomer.email.toLowerCase() : searchParams.get("email")?.trim().toLowerCase();
    const customerId = authCustomer ? authCustomer.id : searchParams.get("customerId")?.trim() || "";

    if (!id || (!email && !customerId)) {
      return NextResponse.json(
        { success: false, error: "Payment method identifier and customer email or ID are required" },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    // Do not purge hard row from database, set is_saved_for_future = 0 so profile hides it but DB retains audit trail
    await pool.query(
      "UPDATE customer_payment_methods SET is_saved_for_future = 0, is_default = 0 WHERE id = ? AND (customer_email = ? OR (? != '' AND customer_id = ?))",
      [id, email || "", customerId, customerId]
    );

    // If the deleted card was default, designate the next remaining active card as default
    const [remaining]: any = await pool.query(
      "SELECT id FROM customer_payment_methods WHERE (customer_email = ? OR (? != '' AND customer_id = ?)) AND is_saved_for_future = 1 ORDER BY created_at DESC LIMIT 1",
      [email || "", customerId, customerId]
    );
    if (Array.isArray(remaining) && remaining.length > 0) {
      await pool.query(
        "UPDATE customer_payment_methods SET is_default = 1 WHERE id = ?",
        [remaining[0].id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment instrument safely removed from your customer profile.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to remove payment method", details: err?.message },
      { status: 500 }
    );
  }
}
