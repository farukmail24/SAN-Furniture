import mysql from 'mysql2/promise';

async function checkDb() {
  const conn = await mysql.createConnection('mysql://root:@127.0.0.1:3306/san_furniture');
  const [rows] = await conn.query('SELECT category_id, count(*) as count FROM products GROUP BY category_id');
  console.log('Products per category in DB:');
  console.table(rows);
  const [armchairProducts] = await conn.query("SELECT id, title, category_id FROM products WHERE category_id = 'cat_armchairs'");
  console.log('Armchairs products count:', armchairProducts.length);
  armchairProducts.forEach(p => console.log(' - ', p.id, p.title));
  await conn.end();
}

checkDb().catch(console.error);
