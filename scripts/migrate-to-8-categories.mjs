import mysql from "mysql2/promise";

const CATEGORIES = [
  {
    id: "cat_living",
    name: "Living Room",
    handle: "living-room",
    description: "Architectural coffee tables, high-gloss media consoles, statement bookcases, sideboards, and shoe storage cabinets.",
    hero_image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "cat_sofas",
    name: "Sofas",
    handle: "sofas",
    description: "Bespoke handcrafted sofas, deep-seated corner groups, luxury chaises, and modular sectionals upholstered in durable bouclé, linen, and velvet.",
    hero_image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "cat_dining",
    name: "Dining",
    handle: "dining",
    description: "Solid European oak extending dining tables, upholstered velvet chairs, and contemporary breakfast bar stools.",
    hero_image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "cat_beds",
    name: "Bedroom",
    handle: "bedroom",
    description: "Luxury ottoman storage beds, bespoke mirrored wardrobes, handcrafted bedside tables, and deep chests of drawers.",
    hero_image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "cat_kids",
    name: "Kids",
    handle: "kids",
    description: "Playful, safe, and durable children's beds, cabin beds, compact wardrobes, and study desks.",
    hero_image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "cat_office",
    name: "Office",
    handle: "office",
    description: "Ergonomic Scandinavian writing desks, executive workstations, and home office bookcases engineered for modern British living.",
    hero_image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1600&auto=format&fit=crop",
  },
  {
    id: "cat_bathroom",
    name: "Bathroom",
    handle: "bathroom",
    description: "Moisture-resistant bathroom vanity units, tall storage cupboards, and minimalist wall cabinets.",
    hero_image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=85",
  },
  {
    id: "cat_armchairs",
    name: "Accent Armchairs & Stools",
    handle: "armchairs",
    description: "Sculptural statement armchairs, luxury bouclé fireside reading chairs, and ergonomic occasional seating handcrafted for modern British homes.",
    hero_image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85",
  },
];

const BATHROOM_PRODUCT_IDS = [
  "prod_live_am_2480rz",
  "prod_live_am_2483rz",
  "prod_live_am_2608rz",
  "prod_live_am_2609rz",
];

async function run() {
  const pool = await mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "san_furniture",
    waitForConnections: true,
    connectionLimit: 5,
  });

  console.log("Migrating categories in MySQL...");
  for (const cat of CATEGORIES) {
    await pool.query(
      `INSERT INTO categories (id, name, handle, description, hero_image)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         handle = VALUES(handle),
         description = VALUES(description),
         hero_image = VALUES(hero_image)`,
      [cat.id, cat.name, cat.handle, cat.description, cat.hero_image]
    );
    console.log(`✓ Category synced: [${cat.id}] ${cat.name} (/${cat.handle})`);
  }

  console.log("\nReassigning bathroom products to cat_bathroom...");
  for (const prodId of BATHROOM_PRODUCT_IDS) {
    const [result] = await pool.query(
      "UPDATE products SET category_id = 'cat_bathroom' WHERE id = ?",
      [prodId]
    );
    console.log(`✓ Product [${prodId}] moved to cat_bathroom: affected ${result.affectedRows}`);
  }

  // Also check if any other product has bathroom in title
  const [extraBath] = await pool.query(
    "UPDATE products SET category_id = 'cat_bathroom' WHERE (title LIKE '%bathroom%' OR title LIKE '%vanity sink%') AND category_id != 'cat_bathroom'"
  );
  if (extraBath.affectedRows > 0) {
    console.log(`✓ Extra ${extraBath.affectedRows} bathroom products moved to cat_bathroom`);
  }

  console.log("\n=== POST-MIGRATION CATEGORY COUNTS ===");
  const [counts] = await pool.query(`
    SELECT c.id, c.name, c.handle, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id AND p.status = 'published'
    GROUP BY c.id, c.name, c.handle
    ORDER BY c.id ASC
  `);
  console.table(counts);

  await pool.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
