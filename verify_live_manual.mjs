import https from "node:https";
import crypto from "node:crypto";

const AUTH_SECRET = "san_furniture_uk_master_jwt_secret_998124_prod";

function signAuthToken(type, id) {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(8).toString("hex");
  const payloadStr = JSON.stringify({ type, id, ts: timestamp, nonce });
  const payloadB64 = Buffer.from(payloadStr).toString("base64url");
  const signature = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("hex");
  return `san_${type}.${payloadB64}.${signature}`;
}

const adminToken = signAuthToken("adm", "admin_usr_com");

function postJson(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = https.request({
      hostname: "sanfurniture.com",
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "Cookie": `san_admin_token=${adminToken}`,
        "Authorization": `Bearer ${adminToken}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerificationScript"
      },
      timeout: 30000
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "sanfurniture.com",
      path,
      method: "GET",
      headers: {
        "Cookie": `san_admin_token=${adminToken}`,
        "Authorization": `Bearer ${adminToken}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VerificationScript"
      },
      timeout: 30000
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  console.log("=== Step 1: Preview on Chelsea Sideboard ===");
  const previewRes = await postJson("/api/admin/dropship/furniture-to-go/preview", {
    urls: ["https://furniture-to-go.co.uk/chelsea-living-1-drawer-2-door-sideboard-in-white-gloss-with-an-oak-trim.html"],
    markupPercent: 40
  });
  console.log("Preview status:", previewRes.status);
  const item = previewRes.body?.items?.[0];
  console.log("Item title:", item?.title);
  console.log("Item SKU:", item?.sku);
  console.log("Assembly Instructions URL:", item?.assemblyInstructionsUrl);

  console.log("\n=== Step 2: Sync Existing Product prod_ftg_4023544 to Download Manual ===");
  const syncRes = await postJson("/api/admin/products/prod_ftg_4023544/sync", {});
  console.log("Sync status:", syncRes.status);
  console.log("Sync result:", JSON.stringify(syncRes.body, null, 2));

  console.log("\n=== Step 3: Fetch Product prod_ftg_4023544 Details ===");
  const prodRes = await getJson("/api/admin/products/prod_ftg_4023544");
  console.log("Product fetch status:", prodRes.status);
  console.log("Product assembly_instructions_url:", prodRes.body?.product?.assembly_instructions_url);
}

run().catch(console.error);
