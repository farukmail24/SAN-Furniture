async function run() {
  const res = await fetch("https://sanfurniture.com/");
  const html = await res.text();

  // Find all tab labels in mega menu
  const matches = [...html.matchAll(/<span class="whitespace-nowrap select-none">([^<]+)<\/span>/g)];
  console.log("Mega Menu tab buttons found in live HTML:");
  matches.forEach((m, i) => console.log(`  ${i + 1}. "${m[1]}"`));

  // Also check if sec_header_mega_menu content is in HTML (RSC payload)
  const rscMatches = [...html.matchAll(/"label":"([^"]+)"/g)];
  console.log("RSC tab labels found:");
  const uniqueLabels = [...new Set(rscMatches.map(m => m[1]))];
  console.log(uniqueLabels.filter(l => ["Living Room", "Sofas", "Dining", "Bedroom", "Kids", "Office", "Bathroom", "Sale"].includes(l)));
}

run().catch(console.error);
