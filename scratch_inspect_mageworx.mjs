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

async function main() {
  const payload = JSON.stringify({
    urls: ["https://furniture-to-go.co.uk/chelsea-living-1-drawer-2-door-sideboard-in-white-gloss-with-an-oak-trim.html"]
  });

  const req = https.request({
    hostname: "sanfurniture.com",
    path: "/api/admin/dropship/furniture-to-go/preview",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "Cookie": `san_admin_token=${adminToken}`,
      "Authorization": `Bearer ${adminToken}`
    }
  }, (res) => {
    let body = "";
    res.on("data", c => body += c);
    res.on("end", () => {
      console.log("Raw preview:", body.slice(0, 500));
    });
  });
  req.write(payload);
  req.end();
}

main().catch(console.error);
