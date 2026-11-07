import { classifyFurnitureProduct } from "./test-classifier.mjs";

const sampleItems = [
  // FTG items
  { title: "Paris 2 Door 1 Drawer Wardrobe in White", url: "https://www.furniture-to-go.co.uk/paris-2-door-1-drawer-wardrobe-in-white.html" },
  { title: "Modena High Gloss Extending Dining Table", url: "https://www.furniture-to-go.co.uk/modena-high-gloss-extending-dining-table.html" },
  { title: "Oslo Scandinavian Desk with 3 Drawers", url: "https://www.furniture-to-go.co.uk/oslo-scandinavian-desk-3-drawers.html" },
  { title: "Bergen Nordic Coffee Table in Sonoma Oak", url: "https://www.furniture-to-go.co.uk/bergen-nordic-coffee-table.html" },
  { title: "Monaco Industrial TV Entertainment Unit", url: "https://www.furniture-to-go.co.uk/monaco-industrial-tv-entertainment-unit.html" },
  { title: "Richmond 2+4 Deep Drawer Bedroom Chest", url: "https://www.furniture-to-go.co.uk/richmond-2-plus-4-drawer-chest.html" },
  { title: "Chelsea Bedroom 2 Drawer Bedside", url: "https://www.furniture-to-go.co.uk/chelsea-bedroom-2-drawer-bedside.html" },
  { title: "Chelsea Living 1 Drawer 2 Door Sideboard", url: "https://www.furniture-to-go.co.uk/chelsea-living-1-drawer-2-door-sideboard.html" },
  // Amos Mann items
  { title: "Cadillac Oak Effect And White Gloss 2 Door Wardrobe With LED Lights - 3175", url: "https://www.amosmannfurniture.co.uk/cadillac-oak-effect-and-white-gloss-2-door-wardrobe-with-led-lights-3175.html" },
  { title: "Athens Grey And White Gloss 2 Door Wardrobe With LED Lights - 3167", url: "https://www.amosmannfurniture.co.uk/athens-grey-and-white-gloss-2-door-wardrobe-with-led-lights-3167.html" },
  { title: "Louise White Gloss Bedside Table - 2413", url: "https://www.amosmannfurniture.co.uk/louise-white-gloss-bedside-table-2413.html" },
  { title: "Madrid Sliding Door Wardrobe 120cm Gloss White - 2461", url: "https://www.amosmannfurniture.co.uk/madrid-sliding-door-wardrobe-120cm-gloss-white-2461.html" },
  { title: "Zing White Gloss Bookcase - 2439", url: "https://www.amosmannfurniture.co.uk/zing-white-gloss-bookcase-2439.html" },
  { title: "Carin Corner Flexi Desk Oak Effect - 2561", url: "https://www.amosmannfurniture.co.uk/carin-corner-flexi-desk-oak-effect-2561.html" },
  { title: "Amur Artic White Computer Office Desk Table - 2614", url: "https://www.amosmannfurniture.co.uk/amur-artic-white-computer-office-desk-table-2614.html" },
  { title: "Luiz Extending Dining Table Oak Effect - 2480", url: "https://www.amosmannfurniture.co.uk/luiz-extending-dining-table-oak-effect-2480.html" },
  { title: "Pietra Large TV Cabinet Grey and White Gloss - 2470", url: "https://www.amosmannfurniture.co.uk/pietra-large-tv-cabinet-grey-and-white-gloss-2470.html" },
  { title: "Pietra 117cm Sideboard Grey and White Gloss 2 door 4 drw - 2471", url: "https://www.amosmannfurniture.co.uk/pietra-117cm-sideboard-grey-and-white-gloss-2-door-4-drw-2471.html" },
  { title: "Zuldy Large 30 Pairs White Shoe Cupboard - 2505", url: "https://www.amosmannfurniture.co.uk/zuldy-large-30-pairs-white-shoe-cupboard-2505.html" },
];

console.log("Testing Classification on Sample Items:");
for (const it of sampleItems) {
  const res = classifyFurnitureProduct({ title: it.title, url: it.url });
  console.log(`${res.categoryId.padEnd(14)} [${(res.subTypeId || "none").padEnd(16)}] : ${it.title}`);
}
