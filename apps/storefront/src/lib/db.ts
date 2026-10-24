import mysql from "mysql2/promise";

const rawHost = process.env.DB_HOST || "127.0.0.1";
const normalizedHost = rawHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawHost;

const dbConfig: mysql.PoolOptions = {
  host: normalizedHost,
  port: Number.parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USERNAME || process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

declare global {
  // eslint-disable-next-line no-var
  var __sanDbPool: mysql.Pool | undefined;
}

export function getDbPool(): mysql.Pool {
  if (!globalThis.__sanDbPool) {
    globalThis.__sanDbPool = mysql.createPool(dbConfig);
  }
  return globalThis.__sanDbPool;
}

export async function queryDb<T = any>(sql: string, params: any[] = []): Promise<T> {
  const pool = getDbPool();
  const [rows] = await pool.query(sql, params);
  return rows as T;
}
