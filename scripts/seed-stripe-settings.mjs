import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 5,
});

async function main() {
  console.log("Seeding Stripe UK Gateway Credentials into `system_settings`...");

  const stripeSettings = [
    { key: "stripe_enabled", val: "true", cat: "payment", desc: "Enable Stripe UK Gateway" },
    { key: "stripe_mode", val: "test", cat: "payment", desc: "Stripe Environment Mode (test or live)" },
    { key: "stripe_publishable_key", val: "pk_test_51SANFurnitureUK0000000DemoKey", cat: "payment", desc: "Stripe UK Publishable API Key" },
    { key: "stripe_secret_key", val: "sk_test_51SANFurnitureUK0000000SecretDemoKey", cat: "payment", desc: "Stripe UK Secret API Key" },
    { key: "stripe_webhook_secret", val: "whsec_san_furniture_webhook_demo_001", cat: "payment", desc: "Stripe Webhook Signing Secret" },
    { key: "stripe_currency", val: "GBP", cat: "payment", desc: "Payment Currency (Always GBP for UK)" },
    { key: "stripe_statement_descriptor", val: "SAN FURNITURE UK", cat: "payment", desc: "Card Statement Descriptor" },
  ];

  for (const s of stripeSettings) {
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, category, description)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         category = VALUES(category),
         description = VALUES(description)`,
      [s.key, s.val, s.cat, s.desc]
    );
    console.log(`✓ Upserted ${s.key}`);
  }

  // Also remove or set klarna inactive
  await pool.query(
    "UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'klarna_enabled'"
  );

  console.log("Stripe credentials seed complete!");
  await pool.end();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
