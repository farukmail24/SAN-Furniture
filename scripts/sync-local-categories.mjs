import mysql from 'mysql2/promise';

async function syncLocalDb() {
  const conn = await mysql.createConnection('mysql://root:@127.0.0.1:3306/san_furniture');

  // 1. Ensure 8 categories in local MySQL
  await conn.query(`
    INSERT INTO categories (id, name, handle, description, hero_image)
    VALUES 
      ('cat_living', 'Living Room', 'living-room', 'Architectural coffee tables, high-gloss media consoles, statement bookcases, sideboards, and occasional seating.', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85'),
      ('cat_sofas', 'Sofas', 'sofas', 'Bespoke handcrafted sofas, deep-seated corner groups, luxury chaises, and modular sectionals.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85'),
      ('cat_dining', 'Dining', 'dining', 'Solid European oak extending dining tables, upholstered velvet chairs, and contemporary breakfast bar stools.', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85'),
      ('cat_beds', 'Bedroom', 'bedroom', 'Luxury ottoman storage beds, bespoke mirrored wardrobes, handcrafted bedside tables, and deep chests of drawers.', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85'),
      ('cat_kids', 'Kids', 'kids', 'Playful, safe, and durable children\\'s beds, cabin beds, compact wardrobes, and study desks.', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1600&q=85'),
      ('cat_office', 'Office', 'office', 'Ergonomic Scandinavian writing desks, executive workstations, and home office bookcases engineered for modern British living.', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1600&auto=format&fit=crop'),
      ('cat_bathroom', 'Bathroom', 'bathroom', 'Moisture-resistant bathroom vanity units, tall storage cupboards, and minimalist wall cabinets.', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=85'),
      ('cat_sale', 'Sale', 'sale', 'Curated British luxury furniture pieces on seasonal sale and clearance with up to 40% off.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85')
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      handle = VALUES(handle),
      description = VALUES(description),
      hero_image = VALUES(hero_image)
  `);

  await conn.query("UPDATE categories SET name = 'Dining', handle = 'dining' WHERE id = 'cat_dining'");
  await conn.query("UPDATE categories SET name = 'Office', handle = 'office' WHERE id = 'cat_office'");
  await conn.query("UPDATE categories SET name = 'Sofas', handle = 'sofas' WHERE id = 'cat_sofas'");
  await conn.query("UPDATE categories SET name = 'Bedroom', handle = 'bedroom' WHERE id = 'cat_beds'");
  await conn.query("UPDATE categories SET name = 'Living Room', handle = 'living-room' WHERE id = 'cat_living'");

  await conn.query("UPDATE products SET category_id = 'cat_living' WHERE category_id = 'cat_armchairs'");
  await conn.query("DELETE FROM categories WHERE id = 'cat_armchairs'");

  console.log("Local DB successfully updated to 8 categories!");
  await conn.end();
}

syncLocalDb().catch(console.error);
