import "../database/mysql-config.mjs";
import mysql from 'mysql2/promise';

async function setupWishlist() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'san_furniture'
  });

  console.log('Creating customer_wishlist table in MySQL...');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS customer_wishlist (
      id VARCHAR(64) PRIMARY KEY,
      customer_id VARCHAR(64) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      product_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_customer_product (customer_id, product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // Seed with active real products from products table
  const [prods] = await conn.query('SELECT id, title FROM products LIMIT 3');
  console.log('Found catalog products for initial wishlist:', prods);

  if (prods.length > 0) {
    for (let i = 0; i < prods.length; i++) {
      const p = prods[i];
      await conn.query(
        `INSERT IGNORE INTO customer_wishlist (id, customer_id, customer_email, product_id) VALUES (?, ?, ?, ?)`,
        [`wish_0${i + 1}`, 'cust_01', 'eleanor.vance@gmail.com', p.id]
      );
    }
  }

  const [rows] = await conn.query('SELECT * FROM customer_wishlist');
  console.log('Active customer_wishlist rows:', rows);

  await conn.end();
}

setupWishlist().catch(console.error);
