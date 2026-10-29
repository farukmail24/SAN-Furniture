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
    name: "Sofas & Seating",
    handle: "sofas",
    description: "Bespoke handcrafted sofas, deep-seated corner groups, luxury chaises, and sculptural accent armchairs upholstered in durable bouclé and velvet.",
    heroImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_living",
    name: "Living Room",
    handle: "living-room",
    description: "Architectural coffee tables, high-gloss media consoles, statement bookcases, sideboards, and shoe storage cabinets.",
    heroImage: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_dining",
    name: "Dining Room",
    handle: "dining",
    description: "Solid European oak extending dining tables, upholstered velvet chairs, and contemporary breakfast bar stools.",
    heroImage: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_beds",
    name: "Bedroom",
    handle: "bedroom",
    description: "Luxury ottoman storage beds, bespoke mirrored wardrobes, handcrafted bedside tables, and deep chests of drawers.",
    heroImage: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_office",
    name: "Home Office",
    handle: "home-office",
    description: "Ergonomic Scandinavian writing desks, executive workstations, and home office bookcases engineered for modern British living.",
    heroImage: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?q=80&w=1600&auto=format&fit=crop"
  }
];

export const CATEGORY_HANDLE_ALIASES: Record<string, string> = {
  beds: "bedroom",
  bedroom: "bedroom",
  "bedroom-furniture": "bedroom",
  "living-tables": "living-room",
  "living-room": "living-room",
  "living-room-furniture": "living-room",
  "dining-room": "dining",
  dining: "dining",
  "dining-room-furniture": "dining",
  "sofas-seating": "sofas",
  sofas: "sofas",
  armchairs: "sofas",
  "accent-armchairs": "sofas",
  "home-office": "home-office",
  office: "home-office",
  desks: "home-office",
};

export function normalizeCategoryHandle(handle: string): string {
  const clean = handle.trim().toLowerCase();
  return CATEGORY_HANDLE_ALIASES[clean] || clean;
}

export function getCategoryByHandle(handle: string): ProductCategory | undefined {
  const normalized = normalizeCategoryHandle(handle);
  return CATALOG_CATEGORIES.find((c) => c.handle === normalized);
}

export interface FurnitureSubType {
  id: string;
  label: string;
  categoryId: string;
  aliases: string[];
  matches: (product: { title: string; handle: string; description?: string }) => boolean;
}

export const FURNITURE_SUBTYPES: FurnitureSubType[] = [
  // Bedroom Sub-Types (cat_beds)
  {
    id: "wardrobes",
    label: "Wardrobes",
    categoryId: "cat_beds",
    aliases: ["wardrobes", "wardrobe", "mirrored-wardrobe", "sliding-wardrobe"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("wardrobe") || h.includes("wardrobe");
    }
  },
  {
    id: "chest-of-drawers",
    label: "Chests of Drawers",
    categoryId: "cat_beds",
    aliases: ["chest-of-drawers", "chest", "drawers", "tallboy", "tall-chest"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (
        (t.includes("chest") ||
          h.includes("chest") ||
          (t.includes("drawer") && !t.includes("wardrobe")) ||
          h.includes("internal-drawers")) &&
        !t.includes("bedside") &&
        !h.includes("bedside")
      );
    }
  },
  {
    id: "bedside-tables",
    label: "Bedside Tables",
    categoryId: "cat_beds",
    aliases: ["bedside-tables", "bedside", "nightstand", "bedside-cabinets"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("bedside") || h.includes("bedside") || t.includes("nightstand");
    }
  },
  {
    id: "storage-cupboards",
    label: "Storage Cupboards",
    categoryId: "cat_beds",
    aliases: ["storage-cupboards", "cupboards", "cupboard", "storage", "cabinets"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (t.includes("cupboard") || t.includes("storage") || h.includes("cupboard")) && !t.includes("wardrobe");
    }
  },
  {
    id: "mirrors",
    label: "Dressing & Mirrors",
    categoryId: "cat_beds",
    aliases: ["mirrors", "mirror", "dressing", "dressing-tables"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (t.includes("mirror") || h.includes("mirror") || t.includes("dressing")) && !t.includes("sliding wardrobe");
    }
  },
  {
    id: "beds",
    label: "Beds & Bedsteads",
    categoryId: "cat_beds",
    aliases: ["beds", "bed", "ottoman", "headboard", "mattress"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return (
        (t.includes("bed ") ||
          t.includes("bedstead") ||
          t.includes("ottoman bed") ||
          t.includes("mattress") ||
          t.includes("headboard")) &&
        !t.includes("bedside")
      );
    }
  },

  // Living Room Sub-Types (cat_living)
  {
    id: "desks",
    label: "Desks & Office",
    categoryId: "cat_living",
    aliases: ["desks", "desk", "writing-desk", "office"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("desk") || h.includes("desk");
    }
  },
  {
    id: "bookcases",
    label: "Bookcases & Shelves",
    categoryId: "cat_living",
    aliases: ["bookcases", "bookcase", "shelving", "shelves", "display-units"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (
        t.includes("bookcase") ||
        h.includes("bookcase") ||
        t.includes("shelf") ||
        t.includes("shelving") ||
        t.includes("display") ||
        h.includes("display")
      );
    }
  },
  {
    id: "tv-units",
    label: "TV Units & Media",
    categoryId: "cat_living",
    aliases: ["tv-units", "tv-unit", "tv", "media", "media-consoles", "tv-cabinet"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (
        t.includes("tv") ||
        h.includes("tv") ||
        t.includes("media") ||
        t.includes("wall cabinet") ||
        t.includes("entertainment") ||
        h.includes("entertainment")
      );
    }
  },
  {
    id: "sideboards",
    label: "Sideboards",
    categoryId: "cat_living",
    aliases: ["sideboards", "sideboard", "credenza"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("sideboard") || h.includes("sideboard");
    }
  },
  {
    id: "storage-cabinets",
    label: "Shoe & Storage Cabinets",
    categoryId: "cat_living",
    aliases: ["storage-cabinets", "storage", "cupboard", "cabinets", "shoe", "shoe-cupboards"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (
        t.includes("cupboard") ||
        h.includes("cupboard") ||
        t.includes("shoe") ||
        t.includes("cabinet") ||
        h.includes("cabinet") ||
        t.includes("trolley") ||
        h.includes("trolley") ||
        t.includes("chest") ||
        h.includes("chest") ||
        t.includes("dressing") ||
        h.includes("dressing")
      ) && !t.includes("tv");
    }
  },
  {
    id: "coffee-tables",
    label: "Coffee Tables",
    categoryId: "cat_living",
    aliases: ["coffee-tables", "coffee-table", "tables", "coffee", "nesting", "console"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("coffee") || t.includes("console table") || t.includes("nesting") || h.includes("coffee-table");
    }
  },

  // Dining Room Sub-Types (cat_dining)
  {
    id: "dining-tables",
    label: "Dining Tables",
    categoryId: "cat_dining",
    aliases: ["dining-tables", "dining-table", "tables", "table", "extending-tables"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (t.includes("table") || h.includes("table")) && !t.includes("coffee") && !t.includes("bedside");
    }
  },
  {
    id: "dining-chairs",
    label: "Dining Chairs & Benches",
    categoryId: "cat_dining",
    aliases: ["dining-chairs", "dining-chair", "chairs", "chair", "benches", "stools"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("chair") || t.includes("bench") || t.includes("stool");
    }
  },
  {
    id: "dining-sets",
    label: "Dining Sets",
    categoryId: "cat_dining",
    aliases: ["dining-sets", "dining-set", "sets"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("dining set") || t.includes("table and chairs");
    }
  },

  // Sofas & Seating Sub-Types (cat_sofas)
  {
    id: "corner-sofas",
    label: "Corner & L-Shape",
    categoryId: "cat_sofas",
    aliases: ["corner-sofas", "corner", "l-shape", "chaise-sofa"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("corner") || t.includes("l-shape") || t.includes("chaise");
    }
  },
  {
    id: "3-seater",
    label: "3-Seater Sofas",
    categoryId: "cat_sofas",
    aliases: ["3-seater", "3-seater-sofas", "large-sofa"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("3-seater") || t.includes("3 seater") || t.includes("three seater");
    }
  },
  {
    id: "2-seater",
    label: "2-Seater Sofas",
    categoryId: "cat_sofas",
    aliases: ["2-seater", "2-seater-sofas", "compact-sofa", "loveseat", "snuggler"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("2-seater") || t.includes("2 seater") || t.includes("two seater") || t.includes("loveseat");
    }
  },
  {
    id: "modular",
    label: "Modular Sectionals",
    categoryId: "cat_sofas",
    aliases: ["modular", "modular-sofas", "sectional"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("modular") || t.includes("sectional");
    }
  },
  {
    id: "sofa-beds",
    label: "Luxury Sofa Beds",
    categoryId: "cat_sofas",
    aliases: ["sofa-beds", "sofa-bed", "sleeper"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("sofa bed") || t.includes("sofa-bed") || t.includes("sleeper");
    }
  },
  {
    id: "armchairs",
    label: "Accent Armchairs",
    categoryId: "cat_sofas",
    aliases: ["armchairs", "armchair", "accent-chairs"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("armchair") || t.includes("accent chair") || t.includes("fireside");
    }
  },
  {
    id: "loungers",
    label: "Bouclé Loungers",
    categoryId: "cat_sofas",
    aliases: ["loungers", "lounger", "chaise-lounger"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("lounger") || t.includes("snuggler");
    }
  },
  {
    id: "footstools",
    label: "Footstools & Poufs",
    categoryId: "cat_sofas",
    aliases: ["footstools", "footstool", "pouf", "poufs", "pouffe", "ottoman"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("footstool") || t.includes("pouf") || t.includes("pouffe") || t.includes("stool");
    }
  },

  // Home Office Sub-Types (cat_office)
  {
    id: "desks",
    label: "Writing Desks & Workstations",
    categoryId: "cat_office",
    aliases: ["desks", "desk", "writing-desk", "computer-desk", "workstations"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("desk") || h.includes("desk");
    }
  },
  {
    id: "office-bookcases",
    label: "Office Bookcases & Shelving",
    categoryId: "cat_office",
    aliases: ["office-bookcases", "bookcases", "shelves", "shelving"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("bookcase") || h.includes("bookcase") || t.includes("shelf");
    }
  },
  {
    id: "office-storage",
    label: "Office Storage Cabinets",
    categoryId: "cat_office",
    aliases: ["office-storage", "cupboard", "cabinets"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return t.includes("cupboard") || h.includes("cupboard") || t.includes("storage");
    }
  }
];

export function getCategorySubTypes(categoryId: string): FurnitureSubType[] {
  return FURNITURE_SUBTYPES.filter((sub) => sub.categoryId === categoryId);
}

export function resolveSubType(categoryId: string, rawType?: string | null): FurnitureSubType | null {
  if (!rawType) return null;
  const clean = rawType.trim().toLowerCase();
  const subTypes = getCategorySubTypes(categoryId);

  const exact = subTypes.find((s) => s.id.toLowerCase() === clean);
  if (exact) return exact;

  const aliasMatch = subTypes.find((s) => s.aliases.includes(clean));
  if (aliasMatch) return aliasMatch;

  return null;
}

export function productMatchesSubType(
  product: { title: string; handle: string; description?: string },
  subType: FurnitureSubType
): boolean {
  return subType.matches(product);
}

export function getSubTypesWithCounts<T extends { title: string; handle: string; description?: string }>(
  categoryId: string,
  products: T[]
): { subType: FurnitureSubType; count: number }[] {
  const subTypes = getCategorySubTypes(categoryId);
  return subTypes
    .map((subType) => {
      const count = products.filter((p) => productMatchesSubType(p, subType)).length;
      return { subType, count };
    })
    .filter((item) => item.count > 0);
}
