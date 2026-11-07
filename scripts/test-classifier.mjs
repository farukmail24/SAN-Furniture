export function classifyFurnitureProduct(input) {
  const title = (input.title || "").toLowerCase();
  const desc = (input.description || "").toLowerCase();
  const range = (input.range_name || "").toLowerCase();
  const text = `${title} ${range} ${desc}`;

  // 1. HOME OFFICE (cat_office)
  // Desks, computer desks, writing tables, office storage
  if (
    title.includes("desk") ||
    title.includes("workstation") ||
    title.includes("computer table") ||
    title.includes("office desk") ||
    (title.includes("writing") && title.includes("table"))
  ) {
    return {
      categoryId: "cat_office",
      categoryName: "Home Office",
      subTypeId: "desks",
      confidence: "high",
      reason: "Matched office desk/workstation keyword in title"
    };
  }

  // 2. SOFAS & SEATING (cat_sofas)
  // Sofas, sectionals, sofa beds, corner groups
  if (
    title.includes("sofa") ||
    title.includes("couch") ||
    title.includes("loveseat") ||
    title.includes("corner group") ||
    title.includes("chaise") ||
    (title.includes("chesterfield") && !title.includes("chair"))
  ) {
    let sub = "3-seater";
    if (title.includes("corner") || title.includes("l-shape")) sub = "corner-sofas";
    else if (title.includes("sofa bed") || title.includes("sofa-bed") || title.includes("chesterfield sofa bed")) sub = "sofa-beds";
    else if (title.includes("2-seater") || title.includes("2 seater") || title.includes("loveseat")) sub = "2-seater";
    else if (title.includes("modular") || title.includes("sectional")) sub = "modular";

    return {
      categoryId: "cat_sofas",
      categoryName: "Sofas & Seating",
      subTypeId: sub,
      confidence: "high",
      reason: "Matched sofa/couch/seating keyword in title"
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
    (title.includes("ottoman stool") || title.includes("footstool") || title.includes("pouf") || title.includes("pouffe"))
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
      reason: "Matched accent armchair/occasional chair keyword in title"
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
      reason: "Matched dining room furniture keyword in title"
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
      reason: "Matched bedroom furniture keyword in title"
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
      reason: "Matched living room furniture keyword in title"
    };
  }

  // Fallback heuristic: check description / URL slug / range
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

  // Conservative default: Living Room
  return {
    categoryId: "cat_living",
    categoryName: "Living Room",
    subTypeId: "storage-cabinets",
    confidence: "low",
    reason: "Default fallback to Living Room"
  };
}
