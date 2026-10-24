import "../../../../database/mysql-config.mjs";
import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "san_furniture",
};

const DEFAULT_SECTIONS = [
  // 1. Header & Top Bar
  {
    id: "sec_header_top_bar",
    page_key: "header",
    section_key: "header_top_bar",
    section_name: "Top Announcement & Value Strip",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      delivery_claim: "UK Mainland Delivery Direct to Your Door",
      quality_claim: "UK Quality Checked • Free Mainland Delivery Within 15 Days",
      payment_claim: "Secure Card Payments",
      tax_claim: "Zero Hidden Fees",
      support_phone: "+44 20 7946 0192",
      show_support_phone: true,
      banner_link: "/delivery",
    }),
  },

  // 2. Home Hero Section
  {
    id: "sec_home_hero",
    page_key: "home",
    section_key: "home_hero",
    section_name: "Hero Showcase & Main Headline",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      rating_score: "4.9/5 from 2,800+ UK Homeowners",
      trustpilot_badge: "Trustpilot Rated Excellent",
      headline_line1: "Bespoke Living,",
      headline_line2: "Handcrafted for Britain.",
      description: "Discover tactile textured bouclés, solid European white oak tables, and luxury gas-lift ottoman beds. Enjoy direct UK mainland delivery and premium craftsmanship straight to your home.",
      primary_cta_text: "Explore All Products",
      primary_cta_link: "/catalog",
      secondary_cta_text: "Shop By Room",
      secondary_cta_link: "#collection-grid",
      trust_items: [
        { icon: "Truck", label: "UK Mainland Delivery" },
        { icon: "ShieldCheck", label: "UK Quality Checked & Tested" },
        { icon: "CreditCard", label: "Secure Card Checkout" },
      ],
      featured_badge: "Featured Masterpiece",
      hero_product_1_id: "",
      hero_product_2_id: "",
      hero_product_3_id: "",
      background_image_url: "",
      background_image_opacity: 15,
      background_color: "#f5f1e9",
      background_color_opacity: 75,
    }),
  },

  // 3. Home Trust & USP Strip
  {
    id: "sec_home_trust_strip",
    page_key: "home",
    section_key: "home_trust_strip",
    section_name: "Trust & Assurance Cards",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      cards: [
        {
          title: "Direct-to-Door UK Delivery",
          description: "Specialist room-of-choice and pallet dispatch across Mainland UK.",
          badge: "Mainland UK",
        },
        {
          title: "Rigorous UK Quality Standards",
          description: "Engineered for British living rooms with certified durability.",
          badge: "100% Tested",
        },
        {
          title: "Free Mainland Delivery",
          description: "Complimentary direct delivery within 15 days across Mainland UK.",
          badge: "Free Delivery",
        },
        {
          title: "Safe & Encrypted Checkout",
          description: "256-Bit SSL protected with Visa, Mastercard, American Express & Maestro.",
          badge: "SSL Encrypted",
        },
      ],
    }),
  },

  // 4. Home Catalog Filter Heading
  {
    id: "sec_home_catalog_filter",
    page_key: "home",
    section_key: "home_catalog_filter",
    section_name: "Room Filter & Product Grid Header",
    is_enabled: 1,
    sort_order: 3,
    content_json: JSON.stringify({
      eyebrow: "Live Catalog Filter",
      heading: "Shop Handcrafted British Furniture",
      subheading_prefix: "Showing",
      subheading_suffix: "pieces ready for UK dispatch",
      products_per_page: 16,
      product_sort_order: "desc",
      show_view_more: true,
      view_more_text: "View More",
    }),
  },

  // 5. Curated Belgravia Reception Suite (Shop the Look)
  {
    id: "sec_home_curated_suite",
    page_key: "home",
    section_key: "home_curated_suite",
    section_name: "Curated Room Suite (Shop The Look)",
    is_enabled: 1,
    sort_order: 4,
    content_json: JSON.stringify({
      eyebrow: "Room Inspiration",
      title: "Shop The Belgravia Reception Suite",
      description: "A curated harmony of tactile boucle, forest green velvet, and honed Roman travertine designed to elevate modern British entertaining.",
      image_url: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1400&q=85",
      badge_text: "Curated 3-Piece Living Suite",
      list_title: "Pieces in this setting:",
    }),
  },

  // 6. Limited Stock Savings & Promotions Banner
  {
    id: "sec_home_promotions",
    page_key: "home",
    section_key: "home_promotions",
    section_name: "Special Savings & Promotional Showcase",
    is_enabled: 1,
    sort_order: 5,
    content_json: JSON.stringify({
      eyebrow: "Limited Stock Promotions",
      heading: "Special Savings on Signature Pieces",
      cta_text: "View all promotional offers",
      cta_link: "/catalog",
      badge_text: "Low UK stock",
    }),
  },

  // 7. New Arrivals Spotlight Banner
  {
    id: "sec_home_new_arrivals",
    page_key: "home",
    section_key: "home_new_arrivals",
    section_name: "New Arrivals Spotlight Banner",
    is_enabled: 1,
    sort_order: 6,
    content_json: JSON.stringify({
      eyebrow: "Just Arrived in Showroom",
      heading: "New Bedroom & Occasional Additions",
      badge_text: "NEW 2026",
      cta_text: "Explore all new arrivals",
      cta_link: "/catalog",
    }),
  },

  // 8. Real Customer Reviews Section
  {
    id: "sec_home_reviews",
    page_key: "home",
    section_key: "home_reviews",
    section_name: "Homeowners Reviews Heading",
    is_enabled: 1,
    sort_order: 7,
    content_json: JSON.stringify({
      eyebrow: "Real Homes & Experiences",
      heading: "What British Homeowners Say",
      rating_score: "4.9 / 5.0",
      source_label: "Trustpilot & Google Customer Feedback",
    }),
  },

  // 9. Footer Assurance Pillars
  {
    id: "sec_footer_assurance",
    page_key: "footer",
    section_key: "footer_assurance",
    section_name: "4 Pillars of UK Customer Confidence",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      pillars: [
        {
          icon: "Truck",
          title: "UK Mainland Delivery",
          description: "Direct to your door across the UK Mainland.",
        },
        {
          icon: "RotateCcw",
          title: "Free Mainland Delivery",
          description: "Enjoy complimentary delivery across Mainland UK within 15 days.",
        },
        {
          icon: "Shield",
          title: "UK Quality Assured",
          description: "High-grade materials and rigorous structural quality testing for long-lasting home durability.",
        },
        {
          icon: "Sparkles",
          title: "Secure Card Payments",
          description: "Protected 256-bit SSL encrypted checkout accepting Visa, Mastercard, American Express and Maestro.",
        },
      ],
    }),
  },

  // 10. Footer Brand Bio & Contact Information
  {
    id: "sec_footer_brand_info",
    page_key: "footer",
    section_key: "footer_brand_info",
    section_name: "Brand Story & UK Customer Care Hours",
    is_enabled: 1,
    sort_order: 2,
    content_json: JSON.stringify({
      brand_bio: "Delivering bespoke craftsmanship, architectural aesthetics, and white-glove customer care straight to British homes.",
      support_title: "Customer Support (UK)",
      support_hours: "Monday – Friday: 09:00 – 18:00 GMT",
      support_email: "support@sanfurniture.com",
      support_phone: "+44 20 7946 0192",
      legal_note: "SAN Furniture Ltd • Registered in England & Wales • Timeless British Luxury & White-Glove Mainland Delivery",
    }),
  },

  // 11. Catalog & Category Header
  {
    id: "sec_catalog_header",
    page_key: "catalog",
    section_key: "catalog_header",
    section_name: "Catalog Page Banner & Hero Text",
    is_enabled: 1,
    sort_order: 1,
    content_json: JSON.stringify({
      eyebrow: "Architectural Curations",
      title: "The SAN Furniture UK Collection",
      subtitle: "Handcrafted living, dining, and bedroom pieces designed for timeless comfort and lasting British homes.",
      vat_badge: "All items include 20% UK VAT with direct delivery tracking",
    }),
  },
];

async function setupPageSections() {
  const conn = await mysql.createConnection(DB_CONFIG);
  console.log("Connected to MySQL. Creating site_page_sections table...");

  await conn.query(`
    CREATE TABLE IF NOT EXISTS site_page_sections (
      id VARCHAR(64) PRIMARY KEY,
      page_key VARCHAR(64) NOT NULL,
      section_key VARCHAR(64) UNIQUE NOT NULL,
      section_name VARCHAR(128) NOT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      content_json LONGTEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_page_key (page_key),
      INDEX idx_sort_order (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("✓ Table 'site_page_sections' created or exists.");

  for (const sec of DEFAULT_SECTIONS) {
    const [existing] = await conn.query("SELECT id FROM site_page_sections WHERE section_key = ?", [sec.section_key]);
    if (existing.length === 0) {
      await conn.query(
        "INSERT INTO site_page_sections (id, page_key, section_key, section_name, is_enabled, sort_order, content_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [sec.id, sec.page_key, sec.section_key, sec.section_name, sec.is_enabled, sec.sort_order, sec.content_json]
      );
      console.log(`✓ Seeded section: [${sec.page_key}] ${sec.section_key} (${sec.section_name})`);
    } else {
      console.log(`- Section exists: [${sec.page_key}] ${sec.section_key}`);
    }
  }

  console.log("All default page sections verified and active in database!");
  await conn.end();
}

setupPageSections().catch((err) => {
  console.error("Setup page sections failed:", err);
  process.exit(1);
});
