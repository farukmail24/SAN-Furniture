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
    description: "Bespoke handcrafted sofas, deep-seated corner groups, luxury chaises, and modular sectionals upholstered in durable bouclé, linen, and velvet.",
    heroImage: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=85"
  },
  {
    id: "cat_armchairs",
    name: "Accent Armchairs & Stools",
    handle: "armchairs",
    description: "Sculptural statement armchairs, luxury bouclé fireside reading chairs, and ergonomic occasional seating handcrafted for modern British homes.",
    heroImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=85"
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
  armchairs: "armchairs",
  "accent-armchairs": "armchairs",
  "accent-chairs": "armchairs",
  "arm-chairs": "armchairs",
  "home-office": "home-office",
  office: "home-office",
  desks: "home-office",
};

export function normalizeCategoryHandle(handle: string): string {
  const clean = handle.trim().toLowerCase();
  return CATEGORY_HANDLE_ALIASES[clean] || clean;
}
export const PRODUCT_HANDLE_ALIASES: Record<string, string> = {
  // Oslo Scandinavian desk
  "oslo-scandinavian-minimalist-writing-desk": "oslo-scandinavian-minimalist-writing-desk-with-3-drawers",
  "oslo-scandinavian-desk": "oslo-scandinavian-minimalist-writing-desk-with-3-drawers",
  "oslo-minimalist-writing-desk": "oslo-scandinavian-minimalist-writing-desk-with-3-drawers",

  // Sandringham sofa
  "sandringham-large-sofa": "sandringham-large-boucl-3-seater-sofa",
  "sandringham-large-boucle-sofa": "sandringham-large-boucl-3-seater-sofa",
  "sandringham-large-boucle-3-seater-sofa": "sandringham-large-boucl-3-seater-sofa",

  // Zing Bookcases
  "zing-white-gloss-bookcase-2439": "zing-white-gloss-bookcase",
  "zing-short-white-gloss-bookcase-2507": "zing-short-white-gloss-bookcase",
  "zing-oak-effect-bookcase-2605": "zing-oak-effect-bookcase",

  // Madrid series
  "madrid-white-gloss-tall-chest-of-drawers-2429": "madrid-white-gloss-tall-chest-of-drawers",
  "madrid-sliding-door-wardrobe-120cm-gloss-white-2461": "madrid-sliding-door-wardrobe-120cm-gloss-white",
  "madrid-wardrobe-internal-drawers-2428": "madrid-wardrobe-internal-drawers",

  // Modena dining
  "modena-extending-dining-table-high-gloss": "modena-high-gloss-extending-6-8-seater-dining-table",
  "modena-high-gloss-extending-dining-table": "modena-high-gloss-extending-6-8-seater-dining-table",

  // Paris wardrobe
  "paris-3-door-mirrored-wardrobe-matt-white": "paris-3-door-2-drawer-classic-mirrored-wardrobe-in-matt-white",
  "paris-3-door-mirrored-wardrobe": "paris-3-door-2-drawer-classic-mirrored-wardrobe-in-matt-white",
  "paris-2-door-1-drawer-wardrobe": "paris-2-door-1-drawer-wardrobe-romantic-white",

  // Copenhagen chest
  "copenhagen-4-drawer-deep-chest-danish-oak": "copenhagen-4-drawer-deep-chest-in-solid-danish-oak",
  "copenhagen-4-drawer-deep-chest": "copenhagen-4-drawer-deep-chest-in-solid-danish-oak",

  // Bedside tables
  "venice-alpine-white-bedside-2394": "venice-alpine-white-bedside",
  "louise-white-gloss-bedside-table-2413": "louise-white-gloss-bedside-table",

  // Chelsea Living Collection
  "chelsea-living-1-drawer-2-door-sideboard-in-white-with-a-truffle-oak-trim": "chelsea-living-1-drawer-2-door-sideboard-in-white-gloss-with-an-oak-trim",
  "chelsea-living-wide-tv-unit-in-white-gloss-with-an-oak-trim": "chelsea-living-wide-tv-unit-in-white-with-a-truffle-oak-trim",

  // Lyon Extending Dining Tables
  "lyon-small-extending-dining-table-in-riviera-oak-white-high-gloss-90-180cm": "lyon-small-extending-dining-table-90-180cm-in-riviera-oak-white-high-gloss",
  "lyon-medium-extending-dining-table-in-riviera-oak-white-high-gloss-140-180cm": "lyon-medium-extending-dining-table-140-180-cm-in-riviera-oak-white-high-gloss",
};

export function normalizeProductHandle(handle: string): string {
  const clean = handle.trim().toLowerCase();
  return PRODUCT_HANDLE_ALIASES[clean] || clean;
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

export interface ClassificationResult {
  categoryId: string;
  categoryName: string;
  subTypeId: string | null;
  confidence: "high" | "medium" | "low";
  reason: string;
}

/**
 * Deterministic, high-precision furniture taxonomy classifier.
 * Slices product titles, metadata, and breadcrumbs into the 5 core store categories
 * (plus Accent Armchairs) with strict disambiguation rules.
 */
export function classifyFurnitureProduct(input: {
  title: string;
  description?: string;
  url?: string;
  range_name?: string;
  category_hint?: string;
}): ClassificationResult {
  const title = (input.title || "").toLowerCase();
  const desc = (input.description || "").toLowerCase();
  const range = (input.range_name || "").toLowerCase();
  const url = (input.url || "").toLowerCase();
  const hint = (input.category_hint || "").toLowerCase();
  const text = `${title} ${range} ${url} ${hint} ${desc}`;

  // 1. HOME OFFICE (cat_office)
  // Desks, computer desks, writing tables, office workstations, office chairs
  if (
    title.includes("desk") ||
    title.includes("workstation") ||
    title.includes("computer table") ||
    title.includes("office desk") ||
    (title.includes("writing") && (title.includes("table") || title.includes("desk")))
  ) {
    return {
      categoryId: "cat_office",
      categoryName: "Home Office",
      subTypeId: "desks",
      confidence: "high",
      reason: "Matched office desk/workstation keyword in title",
    };
  }

  // 2. SOFAS & SEATING (cat_sofas)
  // 2-Seaters, 3-Seaters, Corner Lounges, Sectionals, Sofa Beds
  if (
    title.includes("sofa") ||
    title.includes("couch") ||
    title.includes("loveseat") ||
    title.includes("corner group") ||
    title.includes("chaise lounge") ||
    title.includes("chaise-lounge") ||
    (title.includes("chesterfield") && !title.includes("chair"))
  ) {
    let sub = "3-seater";
    if (title.includes("corner") || title.includes("l-shape")) sub = "corner-sofas";
    else if (title.includes("sofa bed") || title.includes("sofa-bed") || title.includes("sleeper")) sub = "sofa-beds";
    else if (title.includes("2-seater") || title.includes("2 seater") || title.includes("loveseat")) sub = "2-seater";
    else if (title.includes("modular") || title.includes("sectional")) sub = "modular";

    return {
      categoryId: "cat_sofas",
      categoryName: "Sofas & Seating",
      subTypeId: sub,
      confidence: "high",
      reason: "Matched sofa/couch/seating keyword in title",
    };
  }

  // 3. ACCENT ARMCHAIRS & STOOLS (cat_armchairs)
  if (
    title.includes("armchair") ||
    title.includes("fireside chair") ||
    title.includes("wingback") ||
    title.includes("cocktail chair") ||
    (title.includes("swivel") && title.includes("chair")) ||
    (title.includes("lounge chair") && !title.includes("sofa")) ||
    title.includes("ottoman stool") ||
    title.includes("footstool") ||
    title.includes("pouf") ||
    title.includes("pouffe")
  ) {
    let sub = "armchairs";
    if (title.includes("swivel")) sub = "swivel-chairs";
    else if (title.includes("fireside") || title.includes("wingback")) sub = "fireside-chairs";
    else if (title.includes("lounge chair")) sub = "lounge-chairs";
    else if (title.includes("stool") || title.includes("footstool") || title.includes("pouf") || title.includes("bench")) sub = "stools-poufs";

    return {
      categoryId: "cat_armchairs",
      categoryName: "Accent Armchairs & Stools",
      subTypeId: sub,
      confidence: "high",
      reason: "Matched accent armchair/occasional chair keyword in title",
    };
  }

  // 4. DINING ROOM (cat_dining)
  // Extending dining tables, dining chairs, dining sets, bar stools
  if (
    title.includes("dining") ||
    (title.includes("extending") && title.includes("table")) ||
    (title.includes("bar stool") && !title.includes("armchair"))
  ) {
    let sub = "dining-tables";
    if (title.includes("chair") || title.includes("bench") || title.includes("stool")) sub = "dining-chairs";
    else if (title.includes("set") || title.includes("table and chairs")) sub = "dining-sets";

    return {
      categoryId: "cat_dining",
      categoryName: "Dining Room",
      subTypeId: sub,
      confidence: "high",
      reason: "Matched dining room furniture keyword in title",
    };
  }

  // 5. BEDROOM (cat_beds)
  // Wardrobes, beds, chests of drawers, bedsides, dressing tables
  if (
    title.includes("wardrobe") ||
    title.includes("bedside") ||
    title.includes("nightstand") ||
    title.includes("dressing table") ||
    title.includes("tallboy") ||
    (title.includes("chest") && (title.includes("drawer") || title.includes("drw") || title.includes("deep chest"))) ||
    title.includes("internal drawers") ||
    title.includes("bedstead") ||
    title.includes("ottoman bed") ||
    (title.includes("bed ") && !title.includes("sofa")) ||
    (title.includes("mirror") && (title.includes("bedroom") || title.includes("pine") || title.includes("paris") || title.includes("copenhagen")))
  ) {
    let sub = "wardrobes";
    if (title.includes("wardrobe")) sub = "wardrobes";
    else if (title.includes("bedside") || title.includes("nightstand")) sub = "bedside-tables";
    else if (title.includes("chest") || title.includes("tallboy") || title.includes("internal drawers")) sub = "chest-of-drawers";
    else if (title.includes("dressing table") || title.includes("mirror")) sub = "mirrors";
    else if (title.includes("bed ") || title.includes("bedstead") || title.includes("ottoman bed")) sub = "beds";

    return {
      categoryId: "cat_beds",
      categoryName: "Bedroom",
      subTypeId: sub,
      confidence: "high",
      reason: "Matched bedroom furniture keyword in title",
    };
  }

  // 6. LIVING ROOM (cat_living)
  // Coffee tables, TV units, bookcases, sideboards, shoe cupboards
  if (
    title.includes("coffee table") ||
    title.includes("tv unit") ||
    title.includes("tv cabinet") ||
    title.includes("entertainment unit") ||
    title.includes("wall cabinet") ||
    title.includes("bookcase") ||
    title.includes("sideboard") ||
    title.includes("display cabinet") ||
    title.includes("display unit") ||
    title.includes("shoe cupboard") ||
    title.includes("shoe cabinet") ||
    title.includes("nesting table") ||
    title.includes("console table") ||
    title.includes("storage cupboard") ||
    title.includes("broom cupboard") ||
    title.includes("hallway unit") ||
    title.includes("kitchen trolley") ||
    title.includes("bathroom") ||
    title.includes("vanity sink")
  ) {
    let sub = "storage-cabinets";
    if (title.includes("coffee") || title.includes("nesting") || title.includes("console table")) sub = "coffee-tables";
    else if (title.includes("tv") || title.includes("entertainment") || title.includes("media") || title.includes("wall cabinet")) sub = "tv-units";
    else if (title.includes("bookcase") || title.includes("shelv")) sub = "bookcases";
    else if (title.includes("sideboard")) sub = "sideboards";
    else if (title.includes("shoe") || title.includes("cupboard") || title.includes("storage")) sub = "storage-cabinets";

    return {
      categoryId: "cat_living",
      categoryName: "Living Room",
      subTypeId: sub,
      confidence: "high",
      reason: "Matched living room furniture keyword in title",
    };
  }

  // Contextual text fallback heuristics
  if (text.includes("wardrobe") || text.includes("bedroom") || text.includes("bedside")) {
    return { categoryId: "cat_beds", categoryName: "Bedroom", subTypeId: "wardrobes", confidence: "medium", reason: "Found bedroom hint in text" };
  }
  if (text.includes("dining") || text.includes("extending table")) {
    return { categoryId: "cat_dining", categoryName: "Dining Room", subTypeId: "dining-tables", confidence: "medium", reason: "Found dining hint in text" };
  }
  if (text.includes("desk") || text.includes("workstation") || text.includes("office")) {
    return { categoryId: "cat_office", categoryName: "Home Office", subTypeId: "desks", confidence: "medium", reason: "Found office hint in text" };
  }
  if (text.includes("sofa") || text.includes("seating") || text.includes("lounge")) {
    return { categoryId: "cat_sofas", categoryName: "Sofas & Seating", subTypeId: "3-seater", confidence: "medium", reason: "Found sofa hint in text" };
  }

  // Default fallback: Living Room
  return {
    categoryId: "cat_living",
    categoryName: "Living Room",
    subTypeId: "storage-cabinets",
    confidence: "low",
    reason: "Default fallback to Living Room",
  };
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
    },
  },
  {
    id: "chest-of-drawers",
    label: "Chests of Drawers",
    categoryId: "cat_beds",
    aliases: ["chest-of-drawers", "chest", "drawers", "tallboy", "tall-chest"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      // Must not match "chesterfield" sofa or "desk with drawers"
      if (t.includes("chesterfield") || t.includes("desk") || t.includes("sofa")) return false;
      return (
        (/\bchest\b/.test(t) ||
          t.includes("chest of") ||
          t.includes("tallboy") ||
          (t.includes("drawer") && !t.includes("wardrobe")) ||
          h.includes("internal-drawers")) &&
        !t.includes("bedside") &&
        !h.includes("bedside")
      );
    },
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
    },
  },
  {
    id: "storage-cupboards",
    label: "Storage Cupboards",
    categoryId: "cat_beds",
    aliases: ["storage-cupboards", "cupboards", "cupboard", "storage", "cabinets"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      if (t.includes("wardrobe") || t.includes("shoe") || t.includes("tv")) return false;
      return t.includes("cupboard") || t.includes("storage") || h.includes("cupboard");
    },
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
    },
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
        !t.includes("bedside") &&
        !t.includes("sofa")
      );
    },
  },

  // Living Room Sub-Types (cat_living)
  {
    id: "bookcases",
    label: "Bookcases & Shelves",
    categoryId: "cat_living",
    aliases: ["bookcases", "bookcase", "shelving", "shelves", "display-units"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      if (t.includes("desk")) return false;
      return (
        t.includes("bookcase") ||
        h.includes("bookcase") ||
        t.includes("shelf") ||
        t.includes("shelving") ||
        t.includes("display") ||
        h.includes("display")
      );
    },
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
    },
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
    },
  },
  {
    id: "storage-cabinets",
    label: "Shoe & Storage Cabinets",
    categoryId: "cat_living",
    aliases: ["storage-cabinets", "storage", "cupboard", "cabinets", "shoe", "shoe-cupboards"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      if (t.includes("tv") || t.includes("wardrobe") || t.includes("chesterfield") || t.includes("sofa")) return false;
      return (
        t.includes("cupboard") ||
        h.includes("cupboard") ||
        t.includes("shoe") ||
        t.includes("cabinet") ||
        h.includes("cabinet") ||
        t.includes("trolley") ||
        h.includes("trolley")
      );
    },
  },
  {
    id: "coffee-tables",
    label: "Coffee Tables",
    categoryId: "cat_living",
    aliases: ["coffee-tables", "coffee-table", "tables", "coffee", "nesting", "console"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      if (t.includes("dining") || t.includes("desk") || t.includes("bedside")) return false;
      return t.includes("coffee") || t.includes("console table") || t.includes("nesting") || h.includes("coffee-table");
    },
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
      if (
        t.includes("coffee") ||
        t.includes("bedside") ||
        t.includes("desk") ||
        t.includes("dressing") ||
        t.includes("console") ||
        t.includes("tv")
      ) {
        return false;
      }
      return (t.includes("dining") && (t.includes("table") || h.includes("table"))) || t.includes("extending dining table") || t.includes("extending table");
    },
  },
  {
    id: "dining-chairs",
    label: "Dining Chairs & Benches",
    categoryId: "cat_dining",
    aliases: ["dining-chairs", "dining-chair", "chairs", "chair", "benches", "stools"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      if (
        t.includes("armchair") ||
        t.includes("lounge chair") ||
        t.includes("cocktail chair") ||
        t.includes("fireside") ||
        t.includes("wingback") ||
        t.includes("swivel") ||
        t.includes("office") ||
        t.includes("desk chair") ||
        t.includes("footstool") ||
        t.includes("pouf") ||
        t.includes("pouffe")
      ) {
        return false;
      }
      return t.includes("dining chair") || t.includes("dining bench") || t.includes("bar stool") || t.includes("chair");
    },
  },
  {
    id: "dining-sets",
    label: "Dining Sets",
    categoryId: "cat_dining",
    aliases: ["dining-sets", "dining-set", "sets"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("dining set") || t.includes("table and chairs");
    },
  },

  // Sofas & Seating Sub-Types (cat_sofas)
  {
    id: "corner-sofas",
    label: "Corner & L-Shape",
    categoryId: "cat_sofas",
    aliases: ["corner-sofas", "corner", "l-shape", "chaise-sofa"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      if (t.includes("wardrobe") || t.includes("desk") || t.includes("cupboard")) return false;
      return t.includes("corner") || t.includes("l-shape") || t.includes("chaise");
    },
  },
  {
    id: "3-seater",
    label: "3 & 4-Seater Sofas",
    categoryId: "cat_sofas",
    aliases: ["3-seater", "3-seater-sofas", "large-sofa", "4-seater", "family-sofas"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      if (!t.includes("sofa") && !t.includes("couch") && !t.includes("settee") && !t.includes("chesterfield")) return false;
      return (
        t.includes("3-seater") ||
        t.includes("3 seater") ||
        t.includes("three seater") ||
        t.includes("4-seater") ||
        t.includes("4 seater") ||
        t.includes("four seater") ||
        t.includes("large")
      );
    },
  },
  {
    id: "2-seater",
    label: "2-Seater Sofas",
    categoryId: "cat_sofas",
    aliases: ["2-seater", "2-seater-sofas", "compact-sofa", "loveseat", "snuggler"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("2-seater") || t.includes("2 seater") || t.includes("two seater") || t.includes("loveseat");
    },
  },
  {
    id: "modular",
    label: "Modular Sectionals",
    categoryId: "cat_sofas",
    aliases: ["modular", "modular-sofas", "sectional"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("modular") || t.includes("sectional");
    },
  },
  {
    id: "sofa-beds",
    label: "Luxury Sofa Beds",
    categoryId: "cat_sofas",
    aliases: ["sofa-beds", "sofa-bed", "sleeper"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("sofa bed") || t.includes("sofa-bed") || t.includes("sleeper");
    },
  },
  {
    id: "armchairs",
    label: "Accent Armchairs",
    categoryId: "cat_sofas",
    aliases: ["armchairs", "armchair", "accent-chairs"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("armchair") || t.includes("accent chair") || t.includes("fireside");
    },
  },
  {
    id: "loungers",
    label: "Deep Lounge Sofas",
    categoryId: "cat_sofas",
    aliases: ["loungers", "lounger", "chaise-lounger", "lounge-sofa"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      if (!t.includes("sofa") && !t.includes("couch") && !t.includes("chaise")) return false;
      return t.includes("lounger") || t.includes("lounge") || t.includes("snuggler");
    },
  },
  {
    id: "footstools",
    label: "Footstools & Poufs",
    categoryId: "cat_sofas",
    aliases: ["footstools", "footstool", "pouf", "poufs", "pouffe", "ottoman"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      if (t.includes("ottoman bed")) return false;
      return t.includes("footstool") || t.includes("pouf") || t.includes("pouffe") || (t.includes("stool") && !t.includes("bar"));
    },
  },

  // Accent Armchairs Sub-Types (cat_armchairs)
  {
    id: "armchairs",
    label: "Accent Armchairs",
    categoryId: "cat_armchairs",
    aliases: ["armchairs", "armchair", "accent-chairs", "chairs", "accent-armchairs"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      const h = p.handle.toLowerCase();
      return (
        t.includes("armchair") ||
        h.includes("armchair") ||
        t.includes("lounge chair") ||
        t.includes("cocktail chair") ||
        t.includes("fireside") ||
        t.includes("swivel")
      );
    },
  },
  {
    id: "swivel-chairs",
    label: "Swivel Chairs",
    categoryId: "cat_armchairs",
    aliases: ["swivel-chairs", "swivel", "swivel-armchair"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("swivel");
    },
  },
  {
    id: "lounge-chairs",
    label: "Lounge Chairs",
    categoryId: "cat_armchairs",
    aliases: ["lounge-chairs", "lounge", "leather-chair", "mid-century"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      if (t.includes("sofa") || t.includes("couch") || t.includes("bookcase")) return false;
      return t.includes("lounge") || t.includes("mid-century") || t.includes("leather");
    },
  },
  {
    id: "fireside-chairs",
    label: "Fireside & Wingback",
    categoryId: "cat_armchairs",
    aliases: ["fireside-chairs", "fireside", "wingback"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      return t.includes("fireside") || t.includes("wingback");
    },
  },
  {
    id: "stools-poufs",
    label: "Footstools & Poufs",
    categoryId: "cat_armchairs",
    aliases: ["stools-poufs", "footstools", "pouf", "pouffe", "bench", "ottoman"],
    matches: (p) => {
      const t = p.title.toLowerCase();
      if (t.includes("dining")) return false;
      return t.includes("stool") || t.includes("bench") || t.includes("pouf") || t.includes("pouffe") || t.includes("ottoman");
    },
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
    },
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
    },
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
    },
  },
];

export function getCategorySubTypes(categoryId: string): FurnitureSubType[] {
  return FURNITURE_SUBTYPES.filter((sub) => sub.categoryId === categoryId);
}

export function resolveSubType(categoryId?: string | null, rawType?: string | null): FurnitureSubType | null {
  if (!rawType) return null;
  const clean = rawType.trim().toLowerCase();
  const subTypes = categoryId ? getCategorySubTypes(categoryId) : FURNITURE_SUBTYPES;

  const exact = subTypes.find((s) => s.id.toLowerCase() === clean);
  if (exact) return exact;

  const aliasMatch = subTypes.find((s) => s.aliases.includes(clean));
  if (aliasMatch) return aliasMatch;

  return null;
}

export function productMatchesSubType(
  product: { title: string; handle: string; categoryId?: string; category_id?: string; description?: string },
  subType: FurnitureSubType
): boolean {
  const prodCat = product.categoryId || product.category_id;
  if (prodCat && prodCat !== subType.categoryId) {
    return false;
  }
  return subType.matches(product);
}

export function getSubTypesWithCounts<T extends { title: string; handle: string; categoryId?: string; category_id?: string; description?: string }>(
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
