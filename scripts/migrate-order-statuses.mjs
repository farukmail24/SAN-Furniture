import "../database/mysql-config.mjs";
import mysql from 'mysql2/promise';

async function migrate() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'san_furniture'
  });

  console.log('Altering orders.fulfillment_status to VARCHAR(50)...');
  await conn.query(`ALTER TABLE orders MODIFY COLUMN fulfillment_status VARCHAR(50) NOT NULL DEFAULT 'unfulfilled'`);

  console.log('Altering orders.payment_status to VARCHAR(50)...');
  await conn.query(`ALTER TABLE orders MODIFY COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'pending'`);

  console.log('Altering order_po_dispatches.status to VARCHAR(50)...');
  await conn.query(`ALTER TABLE order_po_dispatches MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'dispatched'`);

  // Fix any empty strings created earlier
  await conn.query(`UPDATE orders SET fulfillment_status = 'return_requested' WHERE id = 'ord_uk_7721'`);
  await conn.query(`UPDATE orders SET fulfillment_status = 'cancelled' WHERE id = 'ord_001'`);

  console.log('Migration complete!');
  await conn.end();
}

migrate().catch(console.error);
