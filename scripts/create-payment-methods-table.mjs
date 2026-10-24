import mysql from 'mysql2/promise';

async function main() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'san_furniture'
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS customer_payment_methods (
      id VARCHAR(64) PRIMARY KEY,
      customer_id VARCHAR(64) NULL,
      customer_email VARCHAR(255) NOT NULL,
      brand VARCHAR(32) DEFAULT 'Visa',
      last4 VARCHAR(4) NOT NULL,
      exp_month INT NOT NULL,
      exp_year INT NOT NULL,
      cardholder_name VARCHAR(255) NULL,
      stripe_payment_method_id VARCHAR(100) NULL,
      stripe_customer_id VARCHAR(100) NULL,
      is_saved_for_future TINYINT(1) DEFAULT 0,
      is_default TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cpm_email (customer_email),
      INDEX idx_cpm_customer_id (customer_id),
      INDEX idx_cpm_saved (customer_email, is_saved_for_future)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('customer_payment_methods table created successfully!');
  const [cols] = await conn.query('DESCRIBE customer_payment_methods');
  console.log('Columns:', cols.map(c => c.Field));
  await conn.end();
}

main().catch(console.error);
