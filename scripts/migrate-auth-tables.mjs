import mysql from "mysql2/promise";
import crypto from "node:crypto";

// Secure PBKDF2 hashing helper for zero external native dependency failures
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(originalHash), Buffer.from(testHash));
}

async function run() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "san_furniture",
    multipleStatements: true,
  });

  console.log("Connected to MySQL database 'san_furniture'...");

  // 1. Create admin_users table
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

  // 2. Create customers table
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

  // 3. Seed Default Super Admin
  const adminEmail = "admin@sanfurniture.com";
  const [existing] = await connection.query("SELECT id FROM admin_users WHERE email = ?", [adminEmail]);

  const defaultPassword = "AdminPassword2026!";
  const passwordHash = hashPassword(defaultPassword);

  if (existing.length === 0) {
    await connection.query(
      `INSERT INTO admin_users (id, email, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["admin_usr_01", adminEmail, passwordHash, "SAN Operations Lead", "super_admin", 1]
    );
    console.log(`✅ Seeded Super Admin: ${adminEmail} (Password: ${defaultPassword})`);
  } else {
    // Update hash to ensure default password works
    await connection.query(
      `UPDATE admin_users SET password_hash = ? WHERE email = ?`,
      [passwordHash, adminEmail]
    );
    console.log(`✅ Updated Super Admin password: ${adminEmail}`);
  }

  // 4. Seed a Demo Customer
  const customerEmail = "eleanor.vance@gmail.com";
  const [existingCustomer] = await connection.query("SELECT id FROM customers WHERE email = ?", [customerEmail]);
  if (existingCustomer.length === 0) {
    await connection.query(
      `INSERT INTO customers (id, email, password_hash, first_name, last_name, phone)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ["cust_01", customerEmail, hashPassword("CustomerPass123!"), "Eleanor", "Vance", "+44 7700 900123"]
    );
    console.log(`✅ Seeded Demo Customer: ${customerEmail}`);
  }

  console.log("🎉 Database auth migration completed successfully!");
  await connection.end();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
