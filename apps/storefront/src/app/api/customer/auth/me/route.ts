import { NextResponse } from "next/server";
import { getCustomerFromRequest, hashPassword, verifyPassword } from "@/lib/auth-token";
import { getDbPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session or expired token" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        email: customer.email,
        username: customer.email.split("@")[0],
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
    });
  } catch (err: any) {
    console.error("[Customer Auth Me Route Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to verify session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const customer = await getCustomerFromRequest(request);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Unauthorized session or expired token" },
        { status: 401 }
      );
    }

    const pool = getDbPool();
    const body = await request.json().catch(() => ({}));
    const { firstName, lastName, phone, username, currentPassword, newPassword } = body;

    // Handle password update if requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Please enter your current password to authorize this change." },
          { status: 400 }
        );
      }
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 8 characters long." },
          { status: 400 }
        );
      }

      const [custRows]: any = await pool.query(
        "SELECT password_hash FROM customers WHERE id = ? LIMIT 1",
        [customer.id]
      );

      if (!custRows || custRows.length === 0) {
        return NextResponse.json({ success: false, error: "Customer account not found" }, { status: 404 });
      }

      const storedHash = custRows[0].password_hash;
      const isCurrentValid = verifyPassword(currentPassword, storedHash);

      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: "The current password you entered is incorrect." },
          { status: 400 }
        );
      }

      const newHash = hashPassword(newPassword);
      await pool.query(
        "UPDATE customers SET password_hash = ? WHERE id = ?",
        [newHash, customer.id]
      );
    }

    // Handle profile details update
    const updates: string[] = [];
    const params: any[] = [];

    if (firstName !== undefined && typeof firstName === "string") {
      updates.push("first_name = ?");
      params.push(firstName.trim());
    }
    if (lastName !== undefined && typeof lastName === "string") {
      updates.push("last_name = ?");
      params.push(lastName.trim());
    }
    if (phone !== undefined && typeof phone === "string") {
      updates.push("phone = ?");
      params.push(phone.trim());
    }
    if (username !== undefined && typeof username === "string") {
      updates.push("username = ?");
      params.push(username.trim());
    }

    if (updates.length > 0) {
      params.push(customer.id);
      await pool.query(
        `UPDATE customers SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }

    // Retrieve updated customer profile
    const [updatedRows]: any = await pool.query(
      "SELECT id, email, username, first_name, last_name, phone FROM customers WHERE id = ? LIMIT 1",
      [customer.id]
    );

    const updated = updatedRows?.[0] || customer;

    return NextResponse.json({
      success: true,
      message: "Customer profile updated successfully",
      customer: {
        id: updated.id,
        email: updated.email,
        username: updated.username || updated.email.split("@")[0],
        firstName: updated.first_name || updated.firstName,
        lastName: updated.last_name || updated.lastName,
        phone: updated.phone,
      },
    });
  } catch (err: any) {
    console.error("[Customer Auth Me PATCH Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
