import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "../dist/src/api/health/route.js";

test("Backend Health Check Route: Returns healthy JSON status", async () => {
  let statusCode = 0;
  let responseBody = null;

  const mockReq = {};
  const mockRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  await GET(mockReq, mockRes);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.status, "healthy");
  assert.equal(responseBody.service, "san-furniture-commerce-engine");
  assert.ok(responseBody.timestamp);
  assert.ok(typeof responseBody.uptime_seconds === "number");
});
