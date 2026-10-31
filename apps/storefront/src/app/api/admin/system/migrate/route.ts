import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { getAdminFromRequest } from "@/lib/auth-token";
import { ensureVoucherSchema } from "@/lib/ensure-voucher-schema";

export const dynamic = "force-dynamic";

function getCleanSql(): string {
  const candidates = [
    path.resolve(process.cwd(), "san_furniture.sql"),
    path.resolve(process.cwd(), "database/san_furniture.sql"),
    path.resolve(__dirname, "../../../../../../../san_furniture.sql"),
    path.resolve(__dirname, "../../../../../../../database/san_furniture.sql"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const content = fs.readFileSync(c, "utf8");
        if (content.includes("CREATE TABLE") && content.includes("products")) {
          return content;
        }
      } catch {}
    }
  }

  return "";
}

async function runMigration(forceWipe = false) {
  const rawHost = process.env.DB_HOST || "127.0.0.1";
  const host = rawHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawHost;

  const connection = await mysql.createConnection({
    host,
    port: Number.parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USERNAME || process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
    multipleStatements: true,
  });

  try {
    // Safety check against dropping live data
    if (!forceWipe) {
      const [orderRows]: any = await connection.query("SELECT COUNT(*) as c FROM orders").catch(() => [[{ c: 0 }]]);
      const [custRows]: any = await connection.query("SELECT COUNT(*) as c FROM customers").catch(() => [[{ c: 0 }]]);
      const orderCount = Number(orderRows?.[0]?.c ?? 0);
      const custCount = Number(custRows?.[0]?.c ?? 0);

      if (orderCount > 0 || custCount > 0) {
        throw new Error(
          `Migration Aborted: Database contains ${orderCount} live orders and ${custCount} customer accounts. Overwriting requires { forceWipeData: true }.`
        );
      }
    }

    const sql = getCleanSql();
    if (!sql) {
      throw new Error("san_furniture.sql file could not be located on the server filesystem.");
    }

    // Execute the complete schema and seed data
    await connection.query(sql);

    // Verify imported counts
    const [prodRows]: any = await connection.query("SELECT COUNT(*) as c FROM products");
    const [orderRows]: any = await connection.query("SELECT COUNT(*) as c FROM orders");
    const [catRows]: any = await connection.query("SELECT COUNT(*) as c FROM categories");
    const [tableRows]: any = await connection.query("SHOW TABLES");

    return {
      success: true,
      message: "Database successfully migrated and seeded with pure UTF-8 data!",
      totalTables: tableRows.length,
      productsCount: prodRows?.[0]?.c ?? 0,
      ordersCount: orderRows?.[0]?.c ?? 0,
      categoriesCount: catRows?.[0]?.c ?? 0,
      database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
    };
  } finally {
    await connection.end();
  }
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required" },
        { status: 401 }
      );
    }

    await ensureVoucherSchema();
    const rawHost = process.env.DB_HOST || "127.0.0.1";
    const host = rawHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawHost;

    const connection = await mysql.createConnection({
      host,
      port: Number.parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USERNAME || process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
    });

    try {
      const [tableRows]: any = await connection.query("SHOW TABLES").catch(() => [[]]);
      const [prodRows]: any = await connection.query("SELECT COUNT(*) as c FROM products").catch(() => [[{ c: 0 }]]);
      const [orderRows]: any = await connection.query("SELECT COUNT(*) as c FROM orders").catch(() => [[{ c: 0 }]]);
      const [catRows]: any = await connection.query("SELECT COUNT(*) as c FROM categories").catch(() => [[{ c: 0 }]]);

      const pCount = prodRows?.[0]?.c ?? 0;
      const oCount = orderRows?.[0]?.c ?? 0;

      return NextResponse.json({
        success: true,
        status: pCount === 0 ? "needs_seed" : "healthy",
        totalTables: Array.isArray(tableRows) ? tableRows.length : 0,
        productsCount: pCount,
        ordersCount: oCount,
        categoriesCount: catRows?.[0]?.c ?? 0,
        database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
      });
    } finally {
      try {
        await connection.end();
      } catch {}
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Database status inspection failed",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admin authorization required to run database migrations" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const forceWipe = Boolean(body.forceWipeData && admin.role === "super_admin");

    const result = await runMigration(forceWipe);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
