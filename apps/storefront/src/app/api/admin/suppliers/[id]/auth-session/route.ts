import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import {
  getSupplierAuthState,
  saveSupplierCookies,
  saveSupplierCredentials,
  disconnectSupplierAuth,
  testSupplierSession,
  getSupplierAuthCookies,
} from "@/lib/supplier-auth";

export const dynamic = "force-dynamic";

export async function GET(
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
    const state = await getSupplierAuthState(pool, id);

    if (!state) {
      return NextResponse.json({ success: false, error: `Supplier '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, auth: state });
  } catch (err: any) {
    console.error("[SupplierAuth GET] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(
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
    const body = await request.json().catch(() => ({}));
    const action = body.action || "save_cookies";

    if (action === "save_cookies") {
      const cookies = body.cookies || "";
      if (!cookies || typeof cookies !== "string" || !cookies.trim()) {
        return NextResponse.json({ success: false, error: "Please paste your trade session cookies" }, { status: 400 });
      }

      const result = await saveSupplierCookies(pool, id, cookies);
      const updatedState = await getSupplierAuthState(pool, id);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        testResult: result.testResult,
        auth: updatedState,
      });
    }

    if (action === "save_credentials") {
      const username = body.username ? String(body.username).trim() : "";
      const password = body.password ? String(body.password).trim() : undefined;

      if (!username) {
        return NextResponse.json({ success: false, error: "Trade username or email is required" }, { status: 400 });
      }

      const result = await saveSupplierCredentials(pool, id, username, password);
      const updatedState = await getSupplierAuthState(pool, id);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        auth: updatedState,
      });
    }

    if (action === "test_connection") {
      const existingCookies = await getSupplierAuthCookies(pool, id);
      const testCookies = body.cookies ? String(body.cookies) : existingCookies;
      const state = await getSupplierAuthState(pool, id);

      if (!testCookies && state?.authUsername && state?.authPassword && (id.includes("furniture_to_go") || id === "sup_furniture_to_go")) {
        const { authenticateFtgToken } = await import("@/lib/supplier-auth");
        const authRes = await authenticateFtgToken(state.authUsername, state.authPassword);
        if (authRes.success) {
          const identity = authRes.customer?.company || authRes.customer?.name || state.authUsername;
          return NextResponse.json({
            success: true,
            message: `FTG Trade Account Verified & Connected as: ${identity} (${state.authUsername})`,
            testResult: { valid: true, statusCode: 200, message: `FTG Trade Login Successful (${identity})` }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: authRes.error || "Failed to authenticate FTG login credentials",
          }, { status: 400 });
        }
      }

      if (!testCookies) {
        return NextResponse.json({
          success: false,
          error: "No active session cookies or trade credentials found to test. Please save your login credentials or session first.",
        }, { status: 400 });
      }

      const testRes = await testSupplierSession(id, testCookies);
      return NextResponse.json({
        success: testRes.valid,
        message: testRes.message,
        testResult: testRes,
      });
    }

    if (action === "disconnect") {
      const result = await disconnectSupplierAuth(pool, id);
      const updatedState = await getSupplierAuthState(pool, id);

      return NextResponse.json({
        success: true,
        message: result.message,
        auth: updatedState,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("[SupplierAuth POST] Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal server error" }, { status: 500 });
  }
}
