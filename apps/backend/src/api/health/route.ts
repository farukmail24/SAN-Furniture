import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  res.status(200).json({
    status: "healthy",
    service: "san-furniture-commerce-engine",
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
};
