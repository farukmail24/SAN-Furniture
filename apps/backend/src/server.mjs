/**
 * SAN Furniture - High Performance Backend Commerce Server
 * Connects to XAMPP MySQL (san_furniture) on port 3306
 * Exposes Commerce API, Feeds, Webhooks, Admin Metrics & Security on port 9000
 */
import http from "node:http";
import mysql from "mysql2/promise";
import { formatGBP, calculateNetAndVat, classifyUKPostcode } from "@san-furniture/types";

const PORT = process.env.PORT || 9000;
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool;
try {
  pool = mysql.createPool(DB_CONFIG);
  console.log(`[SAN Furniture Backend] Connected to MySQL database "${DB_CONFIG.database}" on port ${DB_CONFIG.port}`);
} catch (err) {
  console.error(`[SAN Furniture Backend] MySQL connection error:`, err.message);
}

// CORS & JSON Helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
  });
  res.end(JSON.stringify(data, null, 2));
}

// Read Request Body
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
    });
    return res.end();
  }

  try {
    // 1. Health Route
    if (pathname === "/health" || pathname === "/") {
      const [rows] = await pool.query("SELECT COUNT(*) AS productsCount FROM products");
      return sendJson(res, 200, {
        status: "healthy",
        service: "SAN Furniture Commerce Engine",
        environment: process.env.NODE_ENV || "development",
        database: {
          type: "MySQL / MariaDB (XAMPP)",
          host: DB_CONFIG.host,
          port: DB_CONFIG.port,
          name: DB_CONFIG.database,
          productsCount: rows[0]?.productsCount || 0,
        },
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Categories API
    if (pathname === "/api/categories" && method === "GET") {
      const [categories] = await pool.query("SELECT * FROM categories ORDER BY created_at ASC");
      return sendJson(res, 200, { categories });
    }

    // 3. Products List API
    if (pathname === "/api/products" && method === "GET") {
      const categoryFilter = url.searchParams.get("category");
      let query = `
        SELECT p.*, s.width_cm, s.height_cm, s.depth_cm, s.seat_height_cm, s.weight_kg,
               s.material, s.frame_material, s.color, s.assembly_required, s.doorway_clearance_min_cm,
               s.delivery_tier, s.fire_safety_compliant, s.fire_safety_standard, s.lead_time_days
        FROM products p
        LEFT JOIN furniture_specs s ON p.id = s.product_id
      `;
      const params = [];
      if (categoryFilter) {
        query += " WHERE p.category_id = ?";
        params.push(categoryFilter);
      }
      query += " ORDER BY p.created_at DESC";

      const [products] = await pool.query(query, params);
      const formatted = products.map((row) => ({
        id: row.id,
        title: row.title,
        handle: row.handle,
        subtitle: row.subtitle,
        description: row.description,
        categoryId: row.category_id,
        status: row.status,
        pricePennies: row.price_pennies,
        priceFormatted: formatGBP(row.price_pennies),
        compareAtPricePennies: row.compare_at_price_pennies,
        vatRatePercent: Number(row.vat_rate_percent),
        thumbnailUrl: row.thumbnail_url,
        images: row.images_json ? JSON.parse(row.images_json) : [row.thumbnail_url],
        specs: {
          width_cm: Number(row.width_cm),
          height_cm: Number(row.height_cm),
          depth_cm: Number(row.depth_cm),
          seat_height_cm: row.seat_height_cm ? Number(row.seat_height_cm) : null,
          weight_kg: Number(row.weight_kg),
          material: row.material,
          frame_material: row.frame_material,
          color: row.color,
          assembly_required: Boolean(row.assembly_required),
          doorway_clearance_min_cm: Number(row.doorway_clearance_min_cm),
          delivery_tier: row.delivery_tier,
          fire_safety: {
            compliant: Boolean(row.fire_safety_compliant),
            standard: row.fire_safety_standard,
          },
          lead_time_days: row.lead_time_days,
        },
      }));
      return sendJson(res, 200, { products: formatted });
    }

    // 4. Single Product By Handle
    if (pathname.startsWith("/api/products/") && method === "GET") {
      const handle = pathname.replace("/api/products/", "").trim();
      const [rows] = await pool.query(
        `SELECT p.*, s.* FROM products p LEFT JOIN furniture_specs s ON p.id = s.product_id WHERE p.handle = ? OR p.id = ? LIMIT 1`,
        [handle, handle]
      );
      if (rows.length === 0) {
        return sendJson(res, 404, { error: "Product not found", handle });
      }
      const row = rows[0];
      return sendJson(res, 200, {
        product: {
          id: row.id,
          title: row.title,
          handle: row.handle,
          subtitle: row.subtitle,
          description: row.description,
          categoryId: row.category_id,
          status: row.status,
          pricePennies: row.price_pennies,
          priceFormatted: formatGBP(row.price_pennies),
          thumbnailUrl: row.thumbnail_url,
          images: row.images_json ? JSON.parse(row.images_json) : [row.thumbnail_url],
          specs: {
            width_cm: Number(row.width_cm),
            height_cm: Number(row.height_cm),
            depth_cm: Number(row.depth_cm),
            seat_height_cm: row.seat_height_cm ? Number(row.seat_height_cm) : null,
            weight_kg: Number(row.weight_kg),
            material: row.material,
            frame_material: row.frame_material,
            color: row.color,
            assembly_required: Boolean(row.assembly_required),
            delivery_tier: row.delivery_tier,
            fire_safety_compliant: Boolean(row.fire_safety_compliant),
            lead_time_days: row.lead_time_days,
          },
        },
      });
    }

    // 5. UK Shipping Rate & Surcharge Calculator
    if (pathname === "/api/shipping/calculate" && method === "POST") {
      const body = await readBody(req);
      const postcode = (body.postcode || "").trim().toUpperCase();
      const subtotalPennies = Number(body.subtotalPennies || 0);

      const zone = classifyUKPostcode(postcode || "SW1A 1AA");
      let surchargePennies = 0;
      let zoneName = "UK Mainland Standard Delivery";

      if (zone === "zone_2_scottish_highlands") {
        surchargePennies = 4900; // £49.00
        zoneName = "Scottish Highlands (Highlands Delivery Surcharge)";
      } else if (zone === "zone_3_scottish_islands" || zone === "zone_5_uk_offshore") {
        surchargePennies = 6900; // £69.00
        zoneName = "Offshore Islands";
      } else if (zone === "zone_4_northern_ireland") {
        surchargePennies = 5900; // £59.00
        zoneName = "Northern Ireland";
      }

      // £500+ free shipping threshold on mainland
      const isFreeMainlandEligible = subtotalPennies >= 50000;
      const baseShippingPennies = isFreeMainlandEligible ? 0 : 4900;
      const totalShippingPennies = baseShippingPennies + surchargePennies;

      return sendJson(res, 200, {
        postcode,
        zone,
        zoneName,
        deliveryTier: "two_man_white_glove",
        deliveryTierDescription: "2-Man White Glove Room of Choice with Packaging Removal",
        baseShippingPennies,
        baseShippingFormatted: formatGBP(baseShippingPennies),
        surchargePennies,
        surchargeFormatted: formatGBP(surchargePennies),
        totalShippingPennies,
        totalShippingFormatted: formatGBP(totalShippingPennies),
        isFreeDelivery: isFreeMainlandEligible && surchargePennies === 0,
      });
    }

    // 6. Admin Sales & Gross Margin Metrics
    if (pathname === "/api/admin/metrics" && method === "GET") {
      const [orderRows] = await pool.query(
        "SELECT COUNT(*) AS totalOrders, COALESCE(SUM(total_pennies), 0) AS grossRevenuePennies FROM orders"
      );
      const [productRows] = await pool.query(
        "SELECT COUNT(*) AS totalProducts, COALESCE(AVG(price_pennies), 0) AS avgPricePennies FROM products WHERE status = 'published'"
      );
      const [jailedRows] = await pool.query("SELECT COUNT(*) AS jailedIpsCount FROM security_ip_jail");

      const grossRevenuePennies = Number(orderRows[0].grossRevenuePennies);
      const estimatedCostPennies = Math.round(grossRevenuePennies * 0.58); // Average dropship cost
      const grossMarginPennies = grossRevenuePennies - estimatedCostPennies;
      const marginPercent = grossRevenuePennies > 0 ? ((grossMarginPennies / grossRevenuePennies) * 100).toFixed(1) : "42.0";

      return sendJson(res, 200, {
        overview: {
          totalOrders: orderRows[0].totalOrders,
          grossRevenuePennies,
          grossRevenueFormatted: formatGBP(grossRevenuePennies),
          grossMarginPennies,
          grossMarginFormatted: formatGBP(grossMarginPennies),
          grossMarginPercent: Number(marginPercent),
          totalCatalogProducts: productRows[0].totalProducts,
          averageOrderValueFormatted: formatGBP(Number(productRows[0].avgPricePennies)),
          jailedIpsCount: jailedRows[0].jailedIpsCount,
        },
      });
    }

    // 7. Security IP Jail Management
    if (pathname === "/api/security/ip-jail" && method === "GET") {
      const [jailed] = await pool.query("SELECT * FROM security_ip_jail ORDER BY created_at DESC");
      return sendJson(res, 200, { jailedIps: jailed });
    }

    if (pathname === "/api/security/unblock" && method === "POST") {
      const body = await readBody(req);
      const ip = (body.ip || "").trim();
      if (!ip) {
        return sendJson(res, 400, { error: "Missing IP address" });
      }
      await pool.query("DELETE FROM security_ip_jail WHERE ip_address = ?", [ip]);
      await pool.query(
        "INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)",
        [`log_${Date.now()}`, "admin@sanfurniture.co.uk", "UNBLOCK_IP", "security_ip_jail", JSON.stringify({ ip }), req.socket.remoteAddress]
      );
      return sendJson(res, 200, { success: true, message: `IP ${ip} released from jail.` });
    }

    // 8. Google Merchant XML Feed
    if (pathname === "/api/feeds/google-merchant.xml" && method === "GET") {
      const [products] = await pool.query("SELECT p.*, s.* FROM products p LEFT JOIN furniture_specs s ON p.id = s.product_id");
      const itemsXml = products
        .map(
          (p) => `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.title}]]></g:title>
      <g:description><![CDATA[${p.description}]]></g:description>
      <g:link>http://localhost:3000/products/${p.handle}</g:link>
      <g:image_link>${p.thumbnail_url}</g:image_link>
      <g:availability>in_stock</g:availability>
      <g:price>${(p.price_pennies / 100).toFixed(2)} GBP</g:price>
      <g:brand>SAN Furniture</g:brand>
      <g:gtin>${p.gtin_barcode || ""}</g:gtin>
      <g:google_product_category>Furniture &gt; Benches, Couches &amp; Chairs &gt; Sofas</g:google_product_category>
      <g:condition>new</g:condition>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>2-Man White Glove</g:service>
        <g:price>0.00 GBP</g:price>
      </g:shipping>
    </item>`
        )
        .join("");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>SAN Furniture UK - Google Merchant Feed</title>
    <link>http://localhost:3000</link>
    <description>Ultra-Premium Handcrafted UK Furniture</description>
    ${itemsXml}
  </channel>
</rss>`;

      res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Access-Control-Allow-Origin": "*" });
      return res.end(xml);
    }

    // 404 Catch-All
    sendJson(res, 404, { error: "Endpoint not found", path: pathname });
  } catch (err) {
    console.error(`[Server Error on ${pathname}]:`, err);
    sendJson(res, 500, { error: "Internal Server Error", message: err.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SAN FURNITURE COMMERCE ENGINE ACTIVE`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🗄️ Database: MySQL "san_furniture" on localhost:${DB_CONFIG.port}`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`🛋️ Products: http://localhost:${PORT}/api/products`);
  console.log(`======================================================\n`);
});
