import {
  type FurnitureSpecs,
  type DeliveryTier,
  type UpholsteryMaterial,
  type FrameMaterial,
  calculateNetAndVat,
  formatGBP
} from "@san-furniture/types";

export interface CatalogProduct {
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
  images: string[];
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
}

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
  description: string;
  heroImage: string;
}

export const CATALOG_CATEGORIES: ProductCategory[] = [
  {
    id: "cat_sofas",
    name: "Sofas & Corner Lounges",
    handle: "sofas",
    description: "Bespoke handcrafted sofas, deep-seated corner groups, and luxury chaises upholstered in durable bouclé and velvet.",
    heroImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_armchairs",
    name: "Accent Armchairs & Stools",
    handle: "armchairs",
    description: "Sculptural statement armchairs, reading chairs, and ergonomic occasional seating crafted for British comfort.",
    heroImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_dining",
    name: "Dining Tables & Chairs",
    handle: "dining",
    description: "Solid European oak, American walnut, and Italian marble dining collections engineered for intimate family gatherings.",
    heroImage: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_beds",
    name: "Luxury Beds & Wardrobes",
    handle: "beds",
    description: "Ottoman storage beds, upholstered headboards, and solid hardwood wardrobes for serene bedroom sanctuaries.",
    heroImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_living",
    name: "Coffee & Occasional Tables",
    handle: "living-tables",
    description: "Fluted wood, brushed brass, and architectural stone coffee, side, and console tables.",
    heroImage: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85"
  }
];

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod_sofa_001",
    title: "The Kensington 3-Seater Sofa in Oat Bouclé",
    handle: "kensington-3-seater-sofa-oat-boucle",
    subtitle: "Architectural profile with solid oak plinth and textured bouclé",
    description: "The Kensington pairs deep proportions with sculptural contours. Features high-resilience foam wrapped in feather-down pocketing, delivering an exquisite lounging experience designed for modern British architecture.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 129900, // £1,299.00
    compareAtPricePennies: 149900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456001",
    thumbnailUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85"
    ],
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
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1: 1979",
        certificate_ref: "BS-LON-2026-001",
        label_attached: true
      },
      lead_time_days: 7
    }
  },
  {
    id: "prod_sofa_002",
    title: "The Belgravia Left-Hand Corner Group in Forest Velvet",
    handle: "belgravia-left-hand-corner-group-forest-velvet",
    subtitle: "Generous corner chaise wrapped in stain-resistant British velvet",
    description: "Designed for expansive living rooms, the Belgravia corner group offers modular seating with plush padded bolsters and heavy-gauge serpentine springs.",
    categoryId: "cat_sofas",
    status: "published",
    pricePennies: 219900,
    compareAtPricePennies: 249900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456002",
    thumbnailUrl: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85"
    ],
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
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1: 1979",
        certificate_ref: "BS-LON-2026-002",
        label_attached: true
      },
      lead_time_days: 10
    }
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
    images: [
      "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1200&q=85"
    ],
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
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1: 1979",
        certificate_ref: "BS-LON-2026-003",
        label_attached: true
      },
      lead_time_days: 5
    }
  },
  {
    id: "prod_armchair_001",
    title: "The Regent 360° Swivel Armchair in Cream Bouclé",
    handle: "regent-360-swivel-armchair-cream-boucle",
    subtitle: "Cocooning circular silhouette on concealed ball-bearing swivel base",
    description: "Sculptural curved armchair offering 360-degree silent rotation. Upholstered in dense wool-blend bouclé, creating a focal point in any reading nook or living room.",
    categoryId: "cat_armchairs",
    status: "published",
    pricePennies: 54900,
    compareAtPricePennies: 62000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456011",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85"
    ],
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
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1: 1979",
        certificate_ref: "BS-LON-2026-011",
        label_attached: true
      },
      lead_time_days: 4
    }
  },
  {
    id: "prod_armchair_002",
    title: "The Fitzrovia Mid-Century Lounge Chair in Saddle Leather",
    handle: "fitzrovia-mid-century-lounge-chair-saddle-leather",
    subtitle: "Sculpted American walnut timber frame with aniline leather sling",
    description: "Honouring Danish modernist architecture, the Fitzrovia features exposed mortise-and-tenon walnut joinery and hand-stitched leather cushions.",
    categoryId: "cat_armchairs",
    status: "published",
    pricePennies: 74900,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456012",
    thumbnailUrl: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1200&q=85"
    ],
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
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1: 1979",
        certificate_ref: "BS-LON-2026-012",
        label_attached: true
      },
      lead_time_days: 5
    }
  },
  {
    id: "prod_dining_001",
    title: "The Henley Extendable Solid Oak Dining Table (180–240cm)",
    handle: "henley-extendable-solid-oak-dining-table",
    subtitle: "Solid European white oak with seamless butterfly extension mechanism",
    description: "Comfortably seats 6 to 10 guests. Crafted from sustainably harvested European oak with invisible matte protective lacquer that resists heat and red wine spills.",
    categoryId: "cat_dining",
    status: "published",
    pricePennies: 124900,
    compareAtPricePennies: 145000,
    vatRatePercent: 20.0,
    gtinBarcode: "5060123456021",
    thumbnailUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85",
    images: [
      "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1200&q=85"
    ],
    specs: {
      width_cm: 180.0,
      height_cm: 76.0,
      depth_cm: 95.0,
      weight_kg: 84.0,
      material: "none",
      frame_material: "solid_oak",
      color: "Natural White Oak",
      assembly_required: true,
      assembly_time_mins: 20,
      delivery_tier: "pallet",
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Exempt (Solid Wood)",
        certificate_ref: "WOOD-EXEMPT-001",
        label_attached: false
      },
      lead_time_days: 5
    }
  },
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
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85"
    ],
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
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Part 1: 1979",
        certificate_ref: "BS-LON-2026-031",
        label_attached: true
      },
      lead_time_days: 7
    }
  },
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
    images: [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=85"
    ],
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
      fire_safety: {
        compliant: true,
        standard: "BS 5852: Exempt (Wood)",
        certificate_ref: "WOOD-EXEMPT-004",
        label_attached: false
      },
      lead_time_days: 3
    }
  }
];

export function getProductByHandle(handle: string): CatalogProduct | undefined {
  return CATALOG_PRODUCTS.find((p) => p.handle === handle);
}

export function getCategoryByHandle(handle: string): ProductCategory | undefined {
  return CATALOG_CATEGORIES.find((c) => c.handle === handle);
}

export function getProductsByCategory(categoryId: string): CatalogProduct[] {
  return CATALOG_PRODUCTS.filter((p) => p.categoryId === categoryId);
}
