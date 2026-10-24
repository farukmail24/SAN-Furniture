import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

// Check multiple potential locations for .env across monorepo deployments
const potentialEnvPaths = [
  path.resolve(currentDirectory, "..", ".env"),
  path.resolve(currentDirectory, "../apps/storefront/.env"),
  path.resolve(currentDirectory, "../apps/backend/.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "apps/storefront/.env"),
];

for (const envPath of potentialEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

if (!process.env.DB_USER && process.env.DB_USERNAME) {
  process.env.DB_USER = process.env.DB_USERNAME;
}
if (!process.env.DB_NAME && process.env.DB_DATABASE) {
  process.env.DB_NAME = process.env.DB_DATABASE;
}

// Convert "localhost" to "127.0.0.1" on Linux/cPanel to avoid Unix domain socket (/tmp/mysql.sock) ENOENT errors
const rawHost = process.env.DB_HOST || "127.0.0.1";
const normalizedHost = rawHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawHost;

export const mysqlConnectionOptions = {
  host: normalizedHost,
  port: Number.parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USERNAME || process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || process.env.DB_NAME || "san_furniture",
};
