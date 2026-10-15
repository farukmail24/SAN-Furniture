import mysql from "mysql2/promise";
import crypto from "node:crypto";

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function run() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "san_furniture",
    multipleStatements: true,
  });

  console.log("Verifying separate tables for admin_users and customers...");

  // 1. Ensure separate admin_users table exists
  await connection.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      full_name VARCHAR(150) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'super_admin',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      last_login_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Ensure separate customers table exists
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(50) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Customer addresses table linked to customers
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_addresses (
      id VARCHAR(36) PRIMARY KEY,
      customer_id VARCHAR(36) NOT NULL,
      address_line1 VARCHAR(255) NOT NULL,
      address_line2 VARCHAR(255) NULL,
      city VARCHAR(100) NOT NULL,
      postcode VARCHAR(20) NOT NULL,
      county VARCHAR(100) NULL,
      is_default_delivery BOOLEAN DEFAULT TRUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_customer_id (customer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 4. Ensure demo customer exists with address
  const emails = ["eleanor.vance@mayfair.co.uk", "eleanor.vance@gmail.com"];
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const customerId = `cust_${Date.now()}_${i}`;
    const [custRows] = await connection.query("SELECT id FROM customers WHERE email = ?", [email]);
    if (custRows.length === 0) {
      await connection.query(
        `INSERT INTO customers (id, email, password_hash, first_name, last_name, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [customerId, email, hashPassword("CustomerPass123!"), "Eleanor", "Vance", "+44 7700 900123"]
      );
    }
    const [addrRows] = await connection.query("SELECT id FROM customer_addresses WHERE customer_id = ?", [customerId]);
    if (addrRows.length === 0) {
      await connection.query(
        `INSERT INTO customer_addresses (id, customer_id, address_line1, address_line2, city, postcode, county, is_default_delivery)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [`addr_${customerId}`, customerId, "14 Kensington Palace Gardens", "Apt 4B", "London", "SW1A 1AA", "Greater London"]
      );
    }
  }
  console.log("✅ Seeded customer: eleanor.vance@mayfair.co.uk and gmail");

  console.log("🎉 Customer schema and separate tables confirmed!");
  await connection.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
