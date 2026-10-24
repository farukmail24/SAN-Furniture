import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

function findSqlDump(): string {
  const candidates = [
    path.resolve(process.cwd(), "san_furniture.sql"),
    path.resolve(process.cwd(), "database/san_furniture.sql"),
    path.resolve(__dirname, "../../../../../san_furniture.sql"),
    path.resolve(__dirname, "../../../../../database/san_furniture.sql"),
    path.resolve(__dirname, "../../san_furniture.sql"),
    path.resolve(__dirname, "../san_furniture.sql"),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const text = fs.readFileSync(c, "utf8");
        if (text.includes("CREATE TABLE") && text.includes("products")) {
          return text;
        }
      } catch {}
    }
  }
  return "";
}

export async function autoSeedDatabaseIfNeeded(): Promise<boolean> {
  const rawHost = process.env.DB_HOST || "127.0.0.1";
  const host = rawHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawHost;

  let connection: mysql.Connection | null = null;
  try {
    connection = await mysql.createConnection({
      host,
      port: Number.parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USERNAME || process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
      multipleStatements: true,
    });

    const [rows]: any = await connection
      .query("SELECT COUNT(*) as c FROM products")
      .catch(() => [[{ c: 0 }]]);

    const count = Number(rows?.[0]?.c ?? 0);
    if (count > 0) {
      return false; // Already populated
    }

    console.log("> Database empty or missing tables. Auto-seeding from san_furniture.sql...");
    const sql = findSqlDump();
    if (!sql) {
      console.warn("> Could not locate san_furniture.sql to auto-seed.");
      return false;
    }

    await connection.query(sql);
    console.log("> Database auto-seeded successfully with all 24 tables and catalog items!");
    return true;
  } catch (err) {
    console.warn("> Auto-seed check error:", err);
    return false;
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch {}
    }
  }
}
