import "../database/mysql-config.mjs";
import mysql from "mysql2/promise";

async function run() {
  const conn = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "san_furniture"
  });

  await conn.query(`
    INSERT INTO orders (id, order_number, customer_name, customer_email, customer_phone, shipping_address, shipping_postcode, shipping_zone, delivery_tier, subtotal_pennies, shipping_pennies, vat_pennies, total_pennies, payment_status, fulfillment_status)
    VALUES ('ord_uk_7721', 'SAN-2026-8809', 'Eleanor Vance', 'eleanor.vance@gmail.com', '+44 7700 900123', '14 Kensington Palace Gardens, Apt 4B, London', 'SW1A 1AA', 'zone_1_uk_mainland', 'two_man_white_glove', 129900, 0, 25980, 129900, 'paid', 'in_transit')
    ON DUPLICATE KEY UPDATE customer_email = 'eleanor.vance@gmail.com', fulfillment_status = 'in_transit'
  `);

  await conn.query(`
    INSERT INTO order_po_dispatches (id, po_number, order_id, supplier_id, item_count, delivery_tier, status, tracking_number, carrier)
    VALUES ('po_disp_7721', 'PO-SAN-8809', 'ord_uk_7721', 'uk_craft_sofas', 1, 'two_man_white_glove', 'dispatched', 'BJS-2MAN-88200', 'BJS Home Delivery')
    ON DUPLICATE KEY UPDATE tracking_number = 'BJS-2MAN-88200', carrier = 'BJS Home Delivery'
  `);

  console.log("Customer order seeded successfully for eleanor.vance@gmail.com");
  await conn.end();
}

run().catch(console.error);
