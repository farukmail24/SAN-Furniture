const ROUTES = [
  { url: "https://sanfurniture.com/", expected: 200 },
  { url: "https://sanfurniture.com/living-room", expected: 200 },
  { url: "https://sanfurniture.com/sofas", expected: 200 },
  { url: "https://sanfurniture.com/dining", expected: 200 },
  { url: "https://sanfurniture.com/bedroom", expected: 200 },
  { url: "https://sanfurniture.com/kids", expected: 200 },
  { url: "https://sanfurniture.com/office", expected: 200 },
  { url: "https://sanfurniture.com/bathroom", expected: 200 },
  { url: "https://sanfurniture.com/sale", expected: 200 },
  { url: "https://sanfurniture.com/home-office", expected: [200, 307, 308] },
  { url: "https://sanfurniture.com/categories/sofas?type=2-seater", expected: [307, 308] },
];

async function checkRoute(r) {
  try {
    const res = await fetch(r.url, { redirect: "manual" });
    const status = res.status;
    const ok = Array.isArray(r.expected) ? r.expected.includes(status) : status === r.expected;
    const location = res.headers.get("location") || "";
    return { url: r.url, status, ok, location };
  } catch (err) {
    return { url: r.url, status: "ERR", ok: false, error: err.message };
  }
}

async function run() {
  console.log("Checking live production routes on https://sanfurniture.com...\n");
  for (const r of ROUTES) {
    const res = await checkRoute(r);
    const mark = res.ok ? "✓" : "✗";
    console.log(`${mark} [${res.status}] ${res.url} ${res.location ? "-> " + res.location : ""}`);
  }

  // Check home page HTML for the 8 mega menu tabs
  console.log("\nInspecting live HTML for 8 Mega Menu tabs...");
  const homeRes = await fetch("https://sanfurniture.com/");
  const html = await homeRes.text();

  const tabsToCheck = ["Living Room", "Sofas", "Dining", "Bedroom", "Kids", "Office", "Bathroom", "Sale"];
  for (const tab of tabsToCheck) {
    const present = html.includes(tab);
    console.log(`${present ? "✓" : "✗"} Tab "${tab}": ${present ? "FOUND in live HTML" : "NOT FOUND"}`);
  }
}

run().catch(console.error);
