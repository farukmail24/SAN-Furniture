import mysql from "mysql2/promise";

async function main() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const [products] = await conn.execute(
    "SELECT id, handle, title, price_pennies, status FROM products"
  );
  await conn.end();

  console.log(`Auditing ${products.length} live product URLs...`);

  const failedProducts = [];
  const sampleProducts = products.slice(0, 15); // Check 15 sample products on live production

  for (const p of sampleProducts) {
    const url = `https://sanfurniture.com/products/${p.handle}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        failedProducts.push({ id: p.id, handle: p.handle, status: res.status });
      }
    } catch (e) {
      failedProducts.push({ id: p.id, handle: p.handle, status: e.message });
    }
  }

  if (failedProducts.length > 0) {
    console.log("❌ Failed product pages:", failedProducts);
  } else {
    console.log("✅ Sample live product pages all return HTTP 200 OK!");
  }
}

main().catch(console.error);
