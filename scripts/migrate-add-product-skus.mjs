import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

function extractAmosNumber(title, supplierSku, prodId) {
  // Try supplierSku e.g. "2696RZ" -> "2696", "2394" -> "2394"
  if (supplierSku) {
    const skuDigits = supplierSku.match(/^(\d{3,5})/);
    if (skuDigits) return skuDigits[1];
  }
  // Try prodId e.g. "prod_live_am_2696rz" -> "2696"
  if (prodId) {
    const idDigits = prodId.match(/prod_live_am_(\d+)/);
    if (idDigits) return idDigits[1];
  }
  // Matches trailing " - 2696" or "--- 2696"
  const match = title.match(/[-–—]\s*(\d+[a-zA-Z]*)\s*$/);
  if (match) {
    return match[1].replace(/[^0-9]/g, "");
  }
  return null;
}

function cleanAmosTitle(title) {
  // Remove " - 2696" or "--- 2696" or " - 11008286" from end of title
  return title.replace(/\s*[-–—]+\s*\d+[a-zA-Z]*\s*$/, "").trim();
}

async function run() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    database: "san_furniture",
    multipleStatements: true,
  });

  console.log("Checking products table schema for 'sku' column...");
  const [cols] = await conn.query("SHOW COLUMNS FROM products LIKE 'sku'");
  if (cols.length === 0) {
    console.log("Adding 'sku' column to products table...");
    await conn.query("ALTER TABLE products ADD COLUMN sku varchar(64) DEFAULT NULL AFTER handle");
    await conn.query("ALTER TABLE products ADD KEY idx_products_sku (sku)");
    console.log("Column 'sku' added successfully with index.");
  } else {
    console.log("'sku' column already exists.");
  }

  const [products] = await conn.query(`
    SELECT p.id, p.title, p.handle, sup.supplier_id, sup.supplier_sku
    FROM products p
    LEFT JOIN supplier_feed_items sup ON p.id = sup.product_id
  `);

  console.log(`Processing ${products.length} products to populate SKU and clean titles...`);

  let updatedCount = 0;
  for (const p of products) {
    let cleanTitle = p.title;
    let sku = "";

    if (p.supplier_id === "amos_mann_furniture" || p.id.startsWith("prod_live_am_")) {
      const num = extractAmosNumber(p.title, p.supplier_sku, p.id);
      cleanTitle = cleanAmosTitle(p.title);
      sku = num ? `SAN-${num}` : `SAN-AM-${p.supplier_sku || p.id.replace("prod_live_am_", "")}`;
    } else if (p.supplier_id === "furniture_to_go" || p.id.startsWith("prod_ftg_")) {
      const rawSku = (p.supplier_sku || p.id.replace("prod_ftg_", "")).replace(/^FTG-/, "");
      sku = `SAN-FTG-${rawSku}`;
    } else {
      sku = `SAN-${p.id.replace("prod_", "").toUpperCase()}`;
    }

    // Clean handle to match clean title if it has numbers at the end
    const newHandle = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    await conn.query(
      "UPDATE products SET sku = ?, title = ?, handle = ?, updated_at = NOW() WHERE id = ?",
      [sku, cleanTitle, newHandle, p.id]
    );

    console.log(`Updated [${p.id}] -> SKU: ${sku} | Title: "${cleanTitle}"`);
    updatedCount++;
  }

  console.log(`\nSuccessfully updated ${updatedCount} products in MySQL database.`);
  await conn.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
