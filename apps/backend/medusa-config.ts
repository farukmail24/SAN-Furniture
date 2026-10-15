import { defineConfig } from "@medusajs/framework/utils";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/san_furniture_dev",
    redisUrl: process.env.REDIS_URL || "redis://:redis_local_secure@localhost:6379",
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:9000,http://localhost:7001",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:9000",
      jwtSecret: process.env.JWT_SECRET || "super_secret_jwt_key_san_furniture_uk_development_2026",
      cookieSecret: process.env.COOKIE_SECRET || "super_secret_cookie_key_san_furniture_uk_development_2026",
    },
    databaseLogging: !isProduction,
  },
  modules: [
    {
      resolve: "./src/modules/furniture",
    },
  ],
});
