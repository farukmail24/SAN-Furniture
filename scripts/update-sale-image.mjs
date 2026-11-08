import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    database: 'san_furniture'
  });

  const saleImg = 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1600&q=85';
  await conn.query('UPDATE categories SET hero_image = ? WHERE id = ?', [saleImg, 'cat_sale']);

  const [rows] = await conn.query('SELECT id, name, handle, hero_image FROM categories WHERE id = "cat_sale"');
  console.log('Updated local cat_sale:', rows);

  await conn.end();
}

main().catch(console.error);
