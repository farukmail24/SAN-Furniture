import mysql from "mysql2/promise";

async function run() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "san_furniture",
    multipleStatements: true,
  });

  console.log("Setting up tables for Reviews, Promotions & VAT Invoices...");

  // 1. Customer Reviews table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS customer_reviews (
      id VARCHAR(36) PRIMARY KEY,
      product_id VARCHAR(50) NOT NULL,
      customer_name VARCHAR(150) NOT NULL,
      customer_email VARCHAR(255) NOT NULL,
      rating INT NOT NULL DEFAULT 5,
      title VARCHAR(255) NOT NULL,
      comment TEXT NOT NULL,
      verified_purchase BOOLEAN DEFAULT TRUE,
      room_image_url VARCHAR(500) NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'approved',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_product_status (product_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 2. Promotions & Coupons table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id VARCHAR(36) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255) NOT NULL,
      discount_type VARCHAR(50) NOT NULL, -- 'percentage' or 'fixed_pennies'
      discount_value INT NOT NULL, -- e.g. 20 for 20%, or 5000 for £50.00
      min_order_pennies INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      usage_count INT NOT NULL DEFAULT 0,
      max_uses INT NOT NULL DEFAULT 1000,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  // 3. Seed verified luxury customer reviews
  const reviews = [
    {
      id: "rev_01",
      product_id: "prod_01",
      customer_name: "Eleanor Vance (London SW1A)",
      customer_email: "eleanor.vance@gmail.com",
      rating: 5,
      title: "Exceptional Bouclé & 2-Man White Glove Delivery",
      comment: "The Kensington sofa arrived within 5 business days. The 2-man delivery team placed it in our second-floor drawing room and removed all packaging. The fabric feels luxurious and tactile.",
      status: "approved",
    },
    {
      id: "rev_02",
      product_id: "prod_02",
      customer_name: "James Harrington (Edinburgh EH1)",
      customer_email: "james.h@outlook.com",
      rating: 5,
      title: "Solid Oak Masterpiece",
      comment: "Incredible solid European oak craft. Heavy, sturdy, and seats 8 guests comfortably. Worth every penny.",
      status: "approved",
    },
    {
      id: "rev_03",
      product_id: "prod_03",
      customer_name: "Sophie Montgomery (Cotswolds GL5)",
      customer_email: "sophie.m@cotswolds.co.uk",
      rating: 5,
      title: "Stunning Sculptural Silhouette",
      comment: "The Florence velvet armchair is the statement piece of our salon. The deep terracotta velvet catches the natural light gorgeously.",
      status: "approved",
    },
  ];

  for (const r of reviews) {
    const [exists] = await connection.query("SELECT id FROM customer_reviews WHERE id = ?", [r.id]);
    if (exists.length === 0) {
      await connection.query(
        `INSERT INTO customer_reviews (id, product_id, customer_name, customer_email, rating, title, comment, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.id, r.product_id, r.customer_name, r.customer_email, r.rating, r.title, r.comment, r.status]
      );
    }
  }

  // 4. Seed UK Promotional Codes
  const promoCodes = [
    {
      id: "promo_bankholiday",
      code: "BANKHOLIDAY20",
      description: "Spring Bank Holiday Special: 20% off orders over £500",
      discount_type: "percentage",
      discount_value: 20,
      min_order_pennies: 50000,
    },
    {
      id: "promo_welcome50",
      code: "WELCOME50",
      description: "Welcome to SAN: £50 off your first handcrafted order over £300",
      discount_type: "fixed_pennies",
      discount_value: 5000,
      min_order_pennies: 30000,
    },
    {
      id: "promo_vip100",
      code: "LUXURY100",
      description: "Bespoke VIP Voucher: £100 off orders over £1,000",
      discount_type: "fixed_pennies",
      discount_value: 10000,
      min_order_pennies: 100000,
    },
  ];

  for (const p of promoCodes) {
    const [exists] = await connection.query("SELECT id FROM promotions WHERE code = ?", [p.code]);
    if (exists.length === 0) {
      await connection.query(
        `INSERT INTO promotions (id, code, description, discount_type, discount_value, min_order_pennies)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.id, p.code, p.description, p.discount_type, p.discount_value, p.min_order_pennies]
      );
    }
  }

  console.log("🎉 Customer reviews & promotions tables and seeds successfully created in MySQL!");
  await connection.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
