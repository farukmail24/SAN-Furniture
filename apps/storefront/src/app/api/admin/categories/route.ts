import { NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();

    // 1. Ensure all 8 canonical categories exist with correct names and handles (INSERT IGNORE preserves user-customized images/descriptions)
    await pool.query(`
      INSERT IGNORE INTO \`categories\` (id, name, handle, description, hero_image)
      VALUES 
        ('cat_living', 'Living Room', 'living-room', 'Architectural coffee tables, high-gloss media consoles, statement bookcases, sideboards, and occasional seating.', 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85'),
        ('cat_sofas', 'Sofas', 'sofas', 'Bespoke handcrafted sofas, deep-seated corner groups, luxury chaises, and modular sectionals.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85'),
        ('cat_dining', 'Dining', 'dining', 'Solid European oak extending dining tables, upholstered velvet chairs, and contemporary breakfast bar stools.', 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85'),
        ('cat_beds', 'Bedroom', 'bedroom', 'Luxury ottoman storage beds, bespoke mirrored wardrobes, handcrafted bedside tables, and deep chests of drawers.', 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85'),
        ('cat_kids', 'Kids', 'kids', 'Playful, safe, and durable children\\'s beds, cabin beds, compact wardrobes, and study desks.', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1600&q=85'),
        ('cat_office', 'Office', 'office', 'Ergonomic Scandinavian writing desks, executive workstations, and home office bookcases engineered for modern British living.', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1600&auto=format&fit=crop'),
        ('cat_bathroom', 'Bathroom', 'bathroom', 'Moisture-resistant bathroom vanity units, tall storage cupboards, and minimalist wall cabinets.', 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=85'),
        ('cat_sale', 'Sale', 'sale', 'Curated British luxury furniture pieces on seasonal sale and clearance with up to 40% off.', 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1600&q=85')
    `).catch(() => {});

    // 2. Synchronize legacy category names if still matching old names
    await pool.query("UPDATE `categories` SET `name` = 'Dining', `handle` = 'dining' WHERE `id` = 'cat_dining' AND `name` = 'Dining Room'").catch(() => {});
    await pool.query("UPDATE `categories` SET `name` = 'Office', `handle` = 'office' WHERE `id` = 'cat_office' AND `name` = 'Home Office'").catch(() => {});
    await pool.query("UPDATE `categories` SET `name` = 'Sofas', `handle` = 'sofas' WHERE `id` = 'cat_sofas' AND `name` = 'Sofas & Seating'").catch(() => {});
    await pool.query("UPDATE `categories` SET `hero_image` = 'https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?auto=format&fit=crop&w=1600&q=85' WHERE `id` = 'cat_sale' AND `hero_image` = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85'").catch(() => {});

    // 3. Merge legacy cat_armchairs into cat_living and remove standalone cat_armchairs category
    await pool.query("UPDATE `products` SET `category_id` = 'cat_living' WHERE `category_id` = 'cat_armchairs'").catch(() => {});
    await pool.query("DELETE FROM `categories` WHERE `id` = 'cat_armchairs'").catch(() => {});

    // 4. Ensure isolation: reassign bathroom and kids products
    await pool.query("UPDATE `products` SET `category_id` = 'cat_bathroom' WHERE (`title` LIKE '%bathroom%' OR `title` LIKE '%vanity sink%' OR `title` LIKE '%undersink%') AND `category_id` != 'cat_bathroom'").catch(() => {});
    await pool.query("UPDATE `products` SET `category_id` = 'cat_kids' WHERE (`title` LIKE '%kids%' OR `title` LIKE '%bunk bed%' OR `title` LIKE '%cabin bed%') AND `category_id` != 'cat_kids'").catch(() => {});

    // 5. Query all 8 categories ordered exactly like the storefront header
    const [cats]: any = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.handle,
        c.description,
        c.hero_image,
        c.created_at,
        CASE 
          WHEN c.id = 'cat_sale' THEN (
            SELECT COUNT(*) FROM products 
            WHERE compare_at_price_pennies > price_pennies 
            AND status IN ('published', 'active')
          )
          ELSE COUNT(p.id)
        END AS products_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status IN ('published', 'active')
      GROUP BY c.id
      ORDER BY FIELD(c.id, 'cat_living', 'cat_sofas', 'cat_dining', 'cat_beds', 'cat_kids', 'cat_office', 'cat_bathroom', 'cat_sale'), c.id ASC
    `);

    return NextResponse.json({
      success: true,
      categories: Array.isArray(cats) ? cats : [],
    });
  } catch (err: any) {
    console.error("Failed to fetch admin categories:", err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();
    const body = await request.json();
    const { name, handle, description, heroImage } = body;

    if (!name) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const catHandle =
      handle ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const catId = `cat_${catHandle.replace(/-/g, "_")}`;

    await pool.query(
      "INSERT INTO categories (id, name, handle, description, hero_image) VALUES (?, ?, ?, ?, ?)",
      [
        catId,
        name,
        catHandle,
        description || "",
        heroImage ||
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        category: { id: catId, name, handle: catHandle },
        message: "Category created successfully",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to create category", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
