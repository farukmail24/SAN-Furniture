import mysql from 'mysql2/promise';

function cleanHtmlDescription(raw) {
  if (!raw || typeof raw !== "string") return "";

  let text = raw;
  text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
  text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");
  text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");

  text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, (_, content) => {
    const cleanItem = content.replace(/<[^>]+>/g, "").trim();
    return cleanItem ? `\n• ${cleanItem}` : "";
  });

  text = text.replace(/<\/(p|div|h[1-6])>/gi, "\n\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");

  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'san_furniture'
  });

  console.log("--- 1. UPDATING SKUs (Removing FTG-) ---");
  const [skuRes] = await pool.query(
    "UPDATE products SET sku = REPLACE(sku, 'SAN-FTG-', 'SAN-'), updated_at = NOW() WHERE sku LIKE 'SAN-FTG-%'"
  );
  console.log(`SKU Update result: ${skuRes.affectedRows} products updated.`);

  console.log("\n--- 2. CLEANING HTML DESCRIPTIONS ---");
  const [descRows] = await pool.query(
    "SELECT id, sku, description FROM products WHERE description LIKE '%<%'"
  );
  console.log(`Found ${descRows.length} products with HTML tags in description.`);

  for (const row of descRows) {
    const cleaned = cleanHtmlDescription(row.description);
    await pool.query(
      "UPDATE products SET description = ?, updated_at = NOW() WHERE id = ?",
      [cleaned, row.id]
    );
    console.log(`Cleaned product [${row.id}] (SKU: ${row.sku})`);
  }

  console.log("\n--- 3. VERIFICATION OF UPDATED PRODUCTS ---");
  const [updatedProducts] = await pool.query(
    "SELECT id, sku, title, LEFT(description, 120) as desc_preview FROM products WHERE id LIKE 'prod_ftg_%'"
  );
  for (const p of updatedProducts) {
    console.log(`ID: ${p.id} | SKU: ${p.sku} | Title: ${p.title}`);
    console.log(`Desc: ${p.desc_preview}...`);
  }

  await pool.end();
  console.log("\nAll SKU & Description migrations applied successfully!");
}

main().catch(console.error);
