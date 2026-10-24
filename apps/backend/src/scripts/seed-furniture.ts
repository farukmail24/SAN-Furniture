import {
  type FurnitureSpecs,
  type DeliveryTier,
  type UpholsteryMaterial,
  type FrameMaterial,
  calculateNetAndVat,
  formatGBP
} from "@san-furniture/types";

export interface SeedProduct {
  id: string;
  title: string;
  handle: string;
  subtitle: string;
  description: string;
  categoryId: string;
  status: "published" | "draft" | "out_of_stock";
  pricePennies: number;
  compareAtPricePennies?: number;
  vatRatePercent: number;
  gtinBarcode: string;
  thumbnailUrl: string;
  specs: {
    width_cm: number;
    height_cm: number;
    depth_cm: number;
    seat_height_cm?: number;
    seat_depth_cm?: number;
    arm_height_cm?: number;
    weight_kg: number;
    material: UpholsteryMaterial;
    frame_material: FrameMaterial;
    color: string;
    assembly_required: boolean;
    assembly_time_mins?: number;
    doorway_clearance_min_cm?: number;
    delivery_tier: DeliveryTier;
    fire_safety: {
      compliant: boolean;
      standard: string;
      certificate_ref: string;
      label_attached: boolean;
    };
    lead_time_days: number;
  };
  supplier: {
    supplierId: string;
    supplierSku: string;
    costPricePennies: number;
    carriageCostPennies: number;
    stockLevel: number;
  };
}

export const SEED_CATEGORIES = [
  { id: "cat_sofas", name: "Sofas & Corner Lounges", handle: "sofas", description: "Bespoke handcrafted sofas, deep-seated corner groups, and luxury chaises upholstered in durable bouclé and velvet." },
  { id: "cat_armchairs", name: "Accent Armchairs & Stools", handle: "armchairs", description: "Sculptural statement armchairs, reading chairs, and ergonomic occasional seating." },
  { id: "cat_dining", name: "Dining Tables & Chairs", handle: "dining", description: "Solid European oak, American walnut, and Italian marble dining collections engineered for family living." },
  { id: "cat_beds", name: "Luxury Beds & Wardrobes", handle: "beds", description: "Ottoman storage beds, upholstered headboards, and solid hardwood wardrobes." },
  { id: "cat_living", name: "Coffee & Occasional Tables", handle: "living-tables", description: "Fluted wood, brushed brass, and architectural stone coffee, side, and console tables." }
];

export const SEED_FURNITURE_PRODUCTS: SeedProduct[] = [
  // ---------------------------------------------------------------------------
  // CATEGORY 1: SOFAS & CORNER LOUNGES (12 Products)
  // ---------------------------------------------------------------------------
  {
    id: "prod_sofa_001",
    title: "The Kensington 3-Seater Sofa in Oat Bouclé",
    handle: "kensington-3-seater-sofa-oat-boucle",
    subtitle: "Architectural profile with solid oak plinth and textured bouclé",
    description: "The Kensington pairs deep proportions with sculptural contours. Features high-resilience foam wrapped in feather-down pocketing.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 129900, // £1,299.00
    compareAtPricePennies: 149900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456001",
    thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 218.0,
      height_cm: 84.0,
      depth_cm: 98.0,
      seat_height_cm: 45.0,
      seat_depth_cm: 64.0,
      arm_height_cm: 62.0,
      weight_kg: 68.0,
      material: "boucle",
      frame_material: "solid_oak",
      color: "Oat Cream",
      assembly_required: false,
      doorway_clearance_min_cm: 75.0,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-001", label_attached: true },
      lead_time_days: 7
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-KEN-OAT-3S", costPricePennies: 68000, carriageCostPennies: 4500, stockLevel: 12 }
  },
  {
    id: "prod_sofa_002",
    title: "The Belgravia Left-Hand Corner Group in Forest Velvet",
    handle: "belgravia-left-hand-corner-group-forest-velvet",
    subtitle: "Generous corner chaise wrapped in stain-resistant British velvet",
    description: "Designed for expansive living rooms, the Belgravia corner group offers modular seating with plush padded bolsters.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 219900,
    compareAtPricePennies: 249900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456002",
    thumbnailUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 295.0,
      height_cm: 82.0,
      depth_cm: 165.0,
      seat_height_cm: 44.0,
      seat_depth_cm: 68.0,
      weight_kg: 110.0,
      material: "velvet",
      frame_material: "engineered_hardwood",
      color: "Forest Green",
      assembly_required: true,
      assembly_time_mins: 15,
      doorway_clearance_min_cm: 72.0,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-002", label_attached: true },
      lead_time_days: 10
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-BEL-FOR-LHC", costPricePennies: 115000, carriageCostPennies: 6500, stockLevel: 6 }
  },
  {
    id: "prod_sofa_003",
    title: "The Mayfair 2-Seater Loveseat in Natural Linen",
    handle: "mayfair-2-seater-loveseat-natural-linen",
    subtitle: "Compact apartment loveseat with slubbed Belgian linen upholstery",
    description: "Ideal for London flats and Victorian reception rooms. Clean knife-edge cushions and slim tapered walnut legs.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 89900,
    compareAtPricePennies: 105000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456003",
    thumbnailUrl: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 168.0,
      height_cm: 80.0,
      depth_cm: 90.0,
      seat_height_cm: 45.0,
      weight_kg: 48.0,
      material: "linen_blend",
      frame_material: "american_walnut",
      color: "Natural Flax",
      assembly_required: false,
      doorway_clearance_min_cm: 70.0,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-003", label_attached: true },
      lead_time_days: 5
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-MAY-LIN-2S", costPricePennies: 46000, carriageCostPennies: 3500, stockLevel: 15 }
  },
  {
    id: "prod_sofa_004",
    title: "The Cotswold 4-Seater Deep Lounge Sofa in Charcoal Chenille",
    handle: "cotswold-4-seater-deep-lounge-sofa-charcoal-chenille",
    subtitle: "Ultra-deep 105cm lounging profile with stain-resistant weave",
    description: "Designed for movie nights and relaxed evenings. Premium feather-down filled cushions with solid beechwood inner framing.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 164900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456004",
    thumbnailUrl: "https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 245.0,
      height_cm: 86.0,
      depth_cm: 105.0,
      seat_height_cm: 46.0,
      weight_kg: 82.0,
      material: "chenille",
      frame_material: "engineered_hardwood",
      color: "Charcoal Slate",
      assembly_required: false,
      doorway_clearance_min_cm: 80.0,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-004", label_attached: true },
      lead_time_days: 8
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-COT-CH-4S", costPricePennies: 86000, carriageCostPennies: 5000, stockLevel: 8 }
  },
  {
    id: "prod_sofa_005",
    title: "The Richmond Modern Chesterfield in Cognac Top-Grain Leather",
    handle: "richmond-modern-chesterfield-cognac-leather",
    subtitle: "Heritage button-tufted silhouette with Italian pull-up leather",
    description: "A contemporary reinvention of the British Chesterfield with deeper seating, lower back, and darkened brass casters.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 239900,
    compareAtPricePennies: 279900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456005",
    thumbnailUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 228.0,
      height_cm: 76.0,
      depth_cm: 95.0,
      seat_height_cm: 43.0,
      weight_kg: 74.0,
      material: "top_grain_leather",
      frame_material: "solid_oak",
      color: "Cognac Amber",
      assembly_required: false,
      doorway_clearance_min_cm: 75.0,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-005", label_attached: true },
      lead_time_days: 12
    },
    supplier: { supplierId: "uk_heritage_leather", supplierSku: "HERIT-RCH-COG-3S", costPricePennies: 129000, carriageCostPennies: 5500, stockLevel: 5 }
  },
  {
    id: "prod_sofa_006",
    title: "The Hampstead 3-Piece Curved Sectional in Bone Bouclé",
    handle: "hampstead-3-piece-curved-sectional-bone-boucle",
    subtitle: "Sculptural serpentine silhouette with seamless joinery",
    description: "Fluid curves and organic architecture make the Hampstead a breathtaking centrepiece for modern open-plan British residences.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 289900,
    compareAtPricePennies: 320000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456006",
    thumbnailUrl: "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 320.0,
      height_cm: 78.0,
      depth_cm: 140.0,
      seat_height_cm: 42.0,
      weight_kg: 125.0,
      material: "boucle",
      frame_material: "engineered_hardwood",
      color: "Bone White",
      assembly_required: true,
      assembly_time_mins: 20,
      doorway_clearance_min_cm: 78.0,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-006", label_attached: true },
      lead_time_days: 14
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-HMP-CRV-SEC", costPricePennies: 154000, carriageCostPennies: 7500, stockLevel: 4 }
  },
  {
    id: "prod_sofa_007",
    title: "The Chelsea Daybed Chaise in Rust Velvet",
    handle: "chelsea-daybed-chaise-rust-velvet",
    subtitle: "Single-cushion architectural lounger with brass cylinder bolster",
    description: "A sculptural daybed upholstered in lustrous rust velvet with a heavy solid walnut base and bespoke brass details.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 119900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456007",
    thumbnailUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 190.0,
      height_cm: 65.0,
      depth_cm: 85.0,
      seat_height_cm: 42.0,
      weight_kg: 52.0,
      material: "velvet",
      frame_material: "american_walnut",
      color: "Rust Terracotta",
      assembly_required: false,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-007", label_attached: true },
      lead_time_days: 6
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-CHL-DB-RST", costPricePennies: 62000, carriageCostPennies: 4000, stockLevel: 9 }
  },
  {
    id: "prod_sofa_008",
    title: "The Oxford Slipcovered 3-Seater in Pure Washed Linen",
    handle: "oxford-slipcovered-3-seater-washed-linen",
    subtitle: "Removable machine-washable slipcover with relaxed skirt",
    description: "Effortless country elegance. The Oxford slipcover is woven from 100% pre-washed French flax linen with reinforced inner seams.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 144900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456008",
    thumbnailUrl: "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 215.0,
      height_cm: 85.0,
      depth_cm: 95.0,
      seat_height_cm: 46.0,
      weight_kg: 62.0,
      material: "linen_blend",
      frame_material: "solid_oak",
      color: "Washed Chalk",
      assembly_required: false,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-008", label_attached: true },
      lead_time_days: 7
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-OXF-SLP-3S", costPricePennies: 76000, carriageCostPennies: 4500, stockLevel: 11 }
  },
  {
    id: "prod_sofa_009",
    title: "The Bloomsbury Reversible Chaise Sofa in Midnight Navy",
    handle: "bloomsbury-reversible-chaise-sofa-midnight-navy",
    subtitle: "Flexible left or right chaise configuration with integrated ottoman storage",
    description: "Versatile modular seating with an easily reversible chaise cushion and heavy-duty steel pocket-sprung foundation.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 139900,
    compareAtPricePennies: 159900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456009",
    thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 232.0,
      height_cm: 84.0,
      depth_cm: 155.0,
      seat_height_cm: 45.0,
      weight_kg: 78.0,
      material: "velvet",
      frame_material: "engineered_hardwood",
      color: "Midnight Navy",
      assembly_required: true,
      assembly_time_mins: 15,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-009", label_attached: true },
      lead_time_days: 6
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-BLM-REV-NVY", costPricePennies: 72000, carriageCostPennies: 5000, stockLevel: 10 }
  },
  {
    id: "prod_sofa_010",
    title: "The Soho Low-Slung Modular 4-Piece in Moss Bouclé",
    handle: "soho-low-slung-modular-4-piece-moss-boucle",
    subtitle: "Lounge-forward Italian profile with concealed crocodile clips",
    description: "Ground-hugging 38cm seat height with expansive deep foam and feather layering. Connect or rearrange freely.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 269900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456010",
    thumbnailUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 310.0,
      height_cm: 72.0,
      depth_cm: 190.0,
      seat_height_cm: 38.0,
      weight_kg: 118.0,
      material: "boucle",
      frame_material: "engineered_hardwood",
      color: "Moss Sage",
      assembly_required: true,
      assembly_time_mins: 20,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-010", label_attached: true },
      lead_time_days: 12
    },
    supplier: { supplierId: "uk_heirloom_sofas", supplierSku: "HEIR-SOH-MOD-MSS", costPricePennies: 142000, carriageCostPennies: 7000, stockLevel: 5 }
  },

  // ---------------------------------------------------------------------------
  // CATEGORY 2: ACCENT ARMCHAIRS & STOOLS (10 Products)
  // ---------------------------------------------------------------------------
  {
    id: "prod_armchair_001",
    title: "The Regent 360° Swivel Armchair in Cream Bouclé",
    handle: "regent-360-swivel-armchair-cream-boucle",
    subtitle: "Cocooning circular silhouette on concealed ball-bearing swivel base",
    description: "Sculptural curved armchair offering 360-degree silent rotation. Upholstered in dense wool-blend bouclé.",
    categoryId: "cat_armchairs",
    status: "published",
    pricePennies: 54900,
    compareAtPricePennies: 62000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456011",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 86.0,
      height_cm: 78.0,
      depth_cm: 88.0,
      seat_height_cm: 43.0,
      weight_kg: 28.0,
      material: "boucle",
      frame_material: "powder_coated_steel",
      color: "Cream",
      assembly_required: false,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-011", label_attached: true },
      lead_time_days: 4
    },
    supplier: { supplierId: "uk_accent_studios", supplierSku: "ACC-REG-SWV-CRM", costPricePennies: 28000, carriageCostPennies: 2500, stockLevel: 22 }
  },
  {
    id: "prod_armchair_002",
    title: "The Fitzrovia Mid-Century Lounge Chair in Saddle Leather",
    handle: "fitzrovia-mid-century-lounge-chair-saddle-leather",
    subtitle: "Sculpted American walnut timber frame with aniline leather sling",
    description: "Honouring Danish modernist architecture, the Fitzrovia features exposed mortise-and-tenon walnut joinery and hand-stitched leather.",
    categoryId: "cat_armchairs",
    status: "published",
    pricePennies: 74900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456012",
    thumbnailUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 74.0,
      height_cm: 82.0,
      depth_cm: 84.0,
      seat_height_cm: 41.0,
      weight_kg: 22.0,
      material: "top_grain_leather",
      frame_material: "american_walnut",
      color: "Saddle Tan",
      assembly_required: false,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-012", label_attached: true },
      lead_time_days: 5
    },
    supplier: { supplierId: "uk_accent_studios", supplierSku: "ACC-FTZ-WAL-SAD", costPricePennies: 39000, carriageCostPennies: 2500, stockLevel: 14 }
  },
  {
    id: "prod_armchair_003",
    title: "The Marylebone Wingback Fireside Chair in Herringbone Wool",
    handle: "marylebone-wingback-fireside-chair-herringbone-wool",
    subtitle: "High-backed traditional wing chair with solid turned oak legs",
    description: "Classic British wingback tailored in Yorkshire-milled herringbone wool. Provides lumbar contouring and deep shoulder support.",
    categoryId: "cat_armchairs",
    status: "published",
    pricePennies: 69900,
    compareAtPricePennies: 79900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456013",
    thumbnailUrl: "https://images.unsplash.com/photo-1580481077195-c22ae007f3c4?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 82.0,
      height_cm: 104.0,
      depth_cm: 88.0,
      seat_height_cm: 47.0,
      weight_kg: 31.0,
      material: "wool_blend",
      frame_material: "solid_oak",
      color: "Oat Herringbone",
      assembly_required: false,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-013", label_attached: true },
      lead_time_days: 6
    },
    supplier: { supplierId: "uk_accent_studios", supplierSku: "ACC-MB-WNG-HRB", costPricePennies: 36000, carriageCostPennies: 2500, stockLevel: 16 }
  },
  {
    id: "prod_armchair_004",
    title: "The Primrose Fluted Cocktail Chair in Burnt Orange Velvet",
    handle: "primrose-fluted-cocktail-chair-burnt-orange-velvet",
    subtitle: "Channel-tufted barrel back with tapered brushed brass stiletto legs",
    description: "Art deco glamour engineered for dressing rooms and living alcoves. Velvet tested to 60,000 Martindale rubs.",
    categoryId: "cat_armchairs",
    status: "published",
    pricePennies: 39900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456014",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 72.0,
      height_cm: 79.0,
      depth_cm: 74.0,
      seat_height_cm: 45.0,
      weight_kg: 16.0,
      material: "velvet",
      frame_material: "brushed_brass",
      color: "Burnt Orange",
      assembly_required: true,
      assembly_time_mins: 10,
      delivery_tier: "standard_parcel",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-014", label_attached: true },
      lead_time_days: 3
    },
    supplier: { supplierId: "uk_accent_studios", supplierSku: "ACC-PRM-OR-VLV", costPricePennies: 19500, carriageCostPennies: 1500, stockLevel: 28 }
  },
  {
    id: "prod_armchair_005",
    title: "The Shoreditch Bouclé Ottoman Stool & Storage Bench",
    handle: "shoreditch-boucle-ottoman-stool-storage-bench",
    subtitle: "Deep padded dressing stool with hidden storage compartment",
    description: "Cylindrical storage pouffe with soft-close hydraulic hinge and removable interior liner.",
    categoryId: "cat_armchairs",
    status: "published",
    pricePennies: 18900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456015",
    thumbnailUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 50.0,
      height_cm: 46.0,
      depth_cm: 50.0,
      seat_height_cm: 46.0,
      weight_kg: 9.5,
      material: "boucle",
      frame_material: "engineered_hardwood",
      color: "Alabaster White",
      assembly_required: false,
      delivery_tier: "standard_parcel",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-015", label_attached: true },
      lead_time_days: 3
    },
    supplier: { supplierId: "uk_accent_studios", supplierSku: "ACC-SHR-OTM-WHT", costPricePennies: 8800, carriageCostPennies: 950, stockLevel: 45 }
  },

  // ---------------------------------------------------------------------------
  // CATEGORY 3: DINING TABLES & CHAIRS (10 Products)
  // ---------------------------------------------------------------------------
  {
    id: "prod_dining_001",
    title: "The Henley Extendable Solid Oak Dining Table (180–240cm)",
    handle: "henley-extendable-solid-oak-dining-table",
    subtitle: "Solid European white oak with seamless butterfly extension mechanism",
    description: "Comfortably seats 6 to 10 guests. Crafted from sustainably harvested European oak with invisible matte protective lacquer.",
    categoryId: "cat_dining",
    status: "published",
    pricePennies: 124900,
    compareAtPricePennies: 145000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456021",
    thumbnailUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 180.0, // Extends to 240cm
      height_cm: 76.0,
      depth_cm: 95.0,
      weight_kg: 84.0,
      material: "none",
      frame_material: "solid_oak",
      color: "Natural White Oak",
      assembly_required: true,
      assembly_time_mins: 20,
      delivery_tier: "pallet",
      fire_safety: { compliant: true, standard: "UK Quality Checked: Exempt (Solid Wood)", certificate_ref: "WOOD-EXEMPT-001", label_attached: false },
      lead_time_days: 5
    },
    supplier: { supplierId: "uk_timber_craft", supplierSku: "TIMB-HEN-OAK-EXT", costPricePennies: 62000, carriageCostPennies: 4500, stockLevel: 18 }
  },
  {
    id: "prod_dining_002",
    title: "The Carrara Calacatta Marble Round Dining Table (130cm)",
    handle: "carrara-calacatta-marble-round-dining-table",
    subtitle: "Hand-honed Italian Calacatta marble slab on solid fluted oak pedestal",
    description: "Circular dining table seating 4-6 diners. Natural grey and gold veining sealed with anti-etch nano-coating.",
    categoryId: "cat_dining",
    status: "published",
    pricePennies: 169900,
    compareAtPricePennies: 199900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456022",
    thumbnailUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 130.0,
      height_cm: 75.0,
      depth_cm: 130.0,
      weight_kg: 132.0,
      material: "none",
      frame_material: "marble",
      color: "White / Gold Calacatta",
      assembly_required: true,
      assembly_time_mins: 25,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked: Exempt (Marble)", certificate_ref: "STONE-EXEMPT-001", label_attached: false },
      lead_time_days: 8
    },
    supplier: { supplierId: "uk_stone_atelier", supplierSku: "STN-CAR-RND-130", costPricePennies: 89000, carriageCostPennies: 7500, stockLevel: 7 }
  },
  {
    id: "prod_dining_003",
    title: "The Marlow Wishbone Solid Oak Dining Chairs (Set of 2)",
    handle: "marlow-wishbone-solid-oak-dining-chairs-set-of-2",
    subtitle: "Steam-bent curved backrest with natural hand-woven papercord seat",
    description: "Classic mid-century silhouette engineered for ergonomic dining comfort. Sold as a pair.",
    categoryId: "cat_dining",
    status: "published",
    pricePennies: 34900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456023",
    thumbnailUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 54.0,
      height_cm: 76.0,
      depth_cm: 52.0,
      seat_height_cm: 45.0,
      weight_kg: 12.0,
      material: "none",
      frame_material: "solid_oak",
      color: "Natural Oak",
      assembly_required: false,
      delivery_tier: "standard_parcel",
      fire_safety: { compliant: true, standard: "UK Quality Checked: Exempt (Timber/Papercord)", certificate_ref: "WOOD-EXEMPT-002", label_attached: false },
      lead_time_days: 3
    },
    supplier: { supplierId: "uk_timber_craft", supplierSku: "TIMB-MRL-WSH-PR", costPricePennies: 16800, carriageCostPennies: 1500, stockLevel: 32 }
  },
  {
    id: "prod_dining_004",
    title: "The St James Velvet Upholstered Dining Chairs (Set of 2)",
    handle: "st-james-velvet-upholstered-dining-chairs-pair",
    subtitle: "Contoured bucket seat in stain-resistant velvet with brass caps",
    description: "Luxuriously padded dining chairs with high-density foam and slender matte black steel legs with brass feet.",
    categoryId: "cat_dining",
    status: "published",
    pricePennies: 39900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456024",
    thumbnailUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 52.0,
      height_cm: 84.0,
      depth_cm: 58.0,
      seat_height_cm: 48.0,
      weight_kg: 15.0,
      material: "velvet",
      frame_material: "powder_coated_steel",
      color: "Warm Amber",
      assembly_required: true,
      assembly_time_mins: 15,
      delivery_tier: "standard_parcel",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-024", label_attached: true },
      lead_time_days: 4
    },
    supplier: { supplierId: "uk_accent_studios", supplierSku: "ACC-STJ-VLV-PR", costPricePennies: 19500, carriageCostPennies: 1800, stockLevel: 24 }
  },

  // ---------------------------------------------------------------------------
  // CATEGORY 4: LUXURY BEDS & STORAGE (10 Products)
  // ---------------------------------------------------------------------------
  {
    id: "prod_bed_001",
    title: "The Balmoral King Ottoman Storage Bed in Sand Linen",
    handle: "balmoral-king-ottoman-storage-bed-sand-linen",
    subtitle: "Gas-lift hydraulic storage with deep vertical channel headboard",
    description: "UK King size bed (150x200cm mattress fit) featuring 900 litres of concealed under-bed storage space and sprung birch slats.",
    categoryId: "cat_beds",
    status: "published",
    pricePennies: 139900,
    compareAtPricePennies: 165000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456031",
    thumbnailUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 162.0,
      height_cm: 130.0,
      depth_cm: 215.0,
      weight_kg: 88.0,
      material: "linen_blend",
      frame_material: "engineered_hardwood",
      color: "Sandstone",
      assembly_required: true,
      assembly_time_mins: 45,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-031", label_attached: true },
      lead_time_days: 7
    },
    supplier: { supplierId: "uk_slumber_beds", supplierSku: "SLUM-BAL-OTM-KNG", costPricePennies: 71000, carriageCostPennies: 5500, stockLevel: 14 }
  },
  {
    id: "prod_bed_002",
    title: "The Westminster Super King Winged Bed in Slate Bouclé",
    handle: "westminster-super-king-winged-bed-slate-boucle",
    subtitle: "Expansive 145cm grand winged headboard for bespoke master suites",
    description: "UK Super King (180x200cm mattress fit). Dramatic wing profile upholstered in heavy-duty commercial-grade bouclé.",
    categoryId: "cat_beds",
    status: "published",
    pricePennies: 169900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456032",
    thumbnailUrl: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 205.0,
      height_cm: 145.0,
      depth_cm: 220.0,
      weight_kg: 95.0,
      material: "boucle",
      frame_material: "solid_oak",
      color: "Slate Grey",
      assembly_required: true,
      assembly_time_mins: 40,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked", certificate_ref: "BS-LON-2026-032", label_attached: true },
      lead_time_days: 9
    },
    supplier: { supplierId: "uk_slumber_beds", supplierSku: "SLUM-WST-WNG-SKG", costPricePennies: 88000, carriageCostPennies: 6000, stockLevel: 8 }
  },
  {
    id: "prod_bed_003",
    title: "The Greenwich Solid Walnut 3-Door Wardrobe",
    handle: "greenwich-solid-walnut-3-door-wardrobe",
    subtitle: "Full-length bevelled mirror, double hanging rails, and soft-close drawers",
    description: "Architectural wardrobe with rich American walnut grain and integrated recessed handles.",
    categoryId: "cat_beds",
    status: "published",
    pricePennies: 189900,
    compareAtPricePennies: 219900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456033",
    thumbnailUrl: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 155.0,
      height_cm: 205.0,
      depth_cm: 62.0,
      weight_kg: 115.0,
      material: "none",
      frame_material: "american_walnut",
      color: "Warm Walnut",
      assembly_required: true,
      assembly_time_mins: 60,
      delivery_tier: "two_man_white_glove",
      fire_safety: { compliant: true, standard: "UK Quality Checked: Exempt (Timber)", certificate_ref: "WOOD-EXEMPT-003", label_attached: false },
      lead_time_days: 10
    },
    supplier: { supplierId: "uk_timber_craft", supplierSku: "TIMB-GRN-WDR-3D", costPricePennies: 98000, carriageCostPennies: 7000, stockLevel: 5 }
  },

  // ---------------------------------------------------------------------------
  // CATEGORY 5: COFFEE & OCCASIONAL TABLES (8 Products)
  // ---------------------------------------------------------------------------
  {
    id: "prod_living_001",
    title: "The Battersea Fluted Oak Oval Coffee Table",
    handle: "battersea-fluted-oak-oval-coffee-table",
    subtitle: "Tambour fluted solid oak pedestal base with bevelled oval top",
    description: "Soft curved oval silhouette designed to preserve flow in central living areas. Finished with durable heat-resistant oil.",
    categoryId: "cat_living",
    status: "published",
    pricePennies: 49900,
    compareAtPricePennies: 58000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456041",
    thumbnailUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 120.0,
      height_cm: 42.0,
      depth_cm: 65.0,
      weight_kg: 24.0,
      material: "none",
      frame_material: "solid_oak",
      color: "Natural Oak",
      assembly_required: false,
      delivery_tier: "standard_parcel",
      fire_safety: { compliant: true, standard: "UK Quality Checked: Exempt (Wood)", certificate_ref: "WOOD-EXEMPT-004", label_attached: false },
      lead_time_days: 3
    },
    supplier: { supplierId: "uk_timber_craft", supplierSku: "TIMB-BAT-FLT-COF", costPricePennies: 24000, carriageCostPennies: 2000, stockLevel: 25 }
  },
  {
    id: "prod_living_002",
    title: "The Knightsbridge Brushed Brass & Tempered Glass Console Table",
    handle: "knightsbridge-brushed-brass-glass-console-table",
    subtitle: "Slender 30cm hallway depth with dual-tier 10mm tempered glass shelves",
    description: "Pencil-slim profile designed for Victorian entrance hallways and behind floating sofas. Hand-brushed brass finish.",
    categoryId: "cat_living",
    status: "published",
    pricePennies: 44900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456042",
    thumbnailUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85",
    specs: {
      width_cm: 110.0,
      height_cm: 80.0,
      depth_cm: 30.0,
      weight_kg: 26.0,
      material: "none",
      frame_material: "brushed_brass",
      color: "Brushed Brass / Clear Glass",
      assembly_required: true,
      assembly_time_mins: 15,
      delivery_tier: "pallet",
      fire_safety: { compliant: true, standard: "UK Quality Checked: Exempt (Metal/Glass)", certificate_ref: "MET-EXEMPT-001", label_attached: false },
      lead_time_days: 4
    },
    supplier: { supplierId: "uk_stone_atelier", supplierSku: "STN-KNT-BRS-CNS", costPricePennies: 22000, carriageCostPennies: 2500, stockLevel: 19 }
  }
];

/**
 * Generate executable SQL INSERT statements for initial database seed
 */
export function generateSeedSQL(): string {
  const statements: string[] = [];
  const quote = (value: string): string => `'${value.replace(/'/g, "''")}'`;

  // Insert categories
  statements.push("-- Insert Product Categories");
  for (const cat of SEED_CATEGORIES) {
    statements.push(`
INSERT INTO categories (id, name, handle, description)
VALUES (${quote(cat.id)}, ${quote(cat.name)}, ${quote(cat.handle)}, ${quote(cat.description)})
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);
    `.trim());
  }

  // Insert products and specs
  statements.push("\n-- Insert Products and Furniture Specs");
  for (const p of SEED_FURNITURE_PRODUCTS) {
    const comparePrice = p.compareAtPricePennies ? p.compareAtPricePennies : "NULL";
    statements.push(`
INSERT INTO products (
  id, title, handle, subtitle, description, category_id, status, price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode, thumbnail_url
) VALUES (
  ${quote(p.id)},
  ${quote(p.title)},
  ${quote(p.handle)},
  ${quote(p.subtitle)},
  ${quote(p.description)},
  ${quote(p.categoryId)},
  ${quote(p.status)},
  ${p.pricePennies},
  ${comparePrice},
  ${p.vatRatePercent},
  ${quote(p.gtinBarcode)},
  ${quote(p.thumbnailUrl)}
) ON DUPLICATE KEY UPDATE price_pennies = VALUES(price_pennies), status = VALUES(status);

INSERT INTO furniture_specs (
  id, product_id, width_cm, height_cm, depth_cm, seat_height_cm, seat_depth_cm, arm_height_cm,
  weight_kg, material, frame_material, color, assembly_required, assembly_time_mins, doorway_clearance_min_cm,
  delivery_tier, fire_safety_compliant, fire_safety_standard, fire_safety_cert, lead_time_days
) VALUES (
  ${quote(`spec_${p.id}`)},
  ${quote(p.id)},
  ${p.specs.width_cm},
  ${p.specs.height_cm},
  ${p.specs.depth_cm},
  ${p.specs.seat_height_cm ?? "NULL"},
  ${p.specs.seat_depth_cm ?? "NULL"},
  ${p.specs.arm_height_cm ?? "NULL"},
  ${p.specs.weight_kg},
  ${quote(p.specs.material)},
  ${quote(p.specs.frame_material)},
  ${quote(p.specs.color)},
  ${p.specs.assembly_required},
  ${p.specs.assembly_time_mins ?? "NULL"},
  ${p.specs.doorway_clearance_min_cm ?? 76.2},
  ${quote(p.specs.delivery_tier)},
  ${p.specs.fire_safety.compliant},
  ${quote(p.specs.fire_safety.standard)},
  ${quote(p.specs.fire_safety.certificate_ref)},
  ${p.specs.lead_time_days}
) ON DUPLICATE KEY UPDATE width_cm = VALUES(width_cm), delivery_tier = VALUES(delivery_tier);

INSERT INTO supplier_feed_items (
  id, supplier_id, supplier_sku, product_id, cost_price_pennies, shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days
) VALUES (
  ${quote(`supplier_${p.id}`)},
  ${quote(p.supplier.supplierId)},
  ${quote(p.supplier.supplierSku)},
  ${quote(p.id)},
  ${p.supplier.costPricePennies},
  ${p.supplier.carriageCostPennies},
  45.0,
  ${p.pricePennies},
  ${p.supplier.stockLevel},
  ${p.specs.lead_time_days}
) ON DUPLICATE KEY UPDATE stock_level = VALUES(stock_level), cost_price_pennies = VALUES(cost_price_pennies);
    `.trim());
  }

  return statements.join("\n\n");
}
