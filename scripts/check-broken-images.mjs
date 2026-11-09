import mysql from 'mysql2/promise';

async function checkAllImages() {
  const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'root', database: 'san_furniture' });
  const [products] = await conn.query('SELECT id, title, handle, thumbnail_url, images_json FROM products');
  console.log(`Checking ${products.length} products for broken images...`);

  const broken = [];
  for (const p of products) {
    if (!p.thumbnail_url) {
      broken.push({ id: p.id, title: p.title, url: 'NO_URL' });
      continue;
    }
    try {
      const res = await fetch(p.thumbnail_url, { method: 'HEAD' });
      if (!res.ok) {
        console.log(`❌ Broken (${res.status}): ${p.title} -> ${p.thumbnail_url}`);
        broken.push({ id: p.id, title: p.title, url: p.thumbnail_url, status: res.status });
      }
    } catch (err) {
      console.log(`❌ Error: ${p.title} -> ${p.thumbnail_url} (${err.message})`);
      broken.push({ id: p.id, title: p.title, url: p.thumbnail_url, error: err.message });
    }
  }

  console.log(`\nTotal broken: ${broken.length}`);
  await conn.end();
}

checkAllImages().catch(console.error);
