import mysql from 'mysql2/promise';

async function migrate() {
  const pool = await mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'san_furniture',
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log('Running migration: create customer_password_resets table...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_password_resets (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36) NOT NULL,
      email VARCHAR(255) NOT NULL,
      token_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cpr_token (token_hash),
      INDEX idx_cpr_email (email),
      INDEX idx_cpr_cust (customer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('Migration successful: customer_password_resets table is ready.');

  const [cols] = await pool.query('DESCRIBE customer_password_resets');
  console.log('Table structure:');
  console.table(cols);

  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
