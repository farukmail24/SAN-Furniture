async function auditRoutes() {
  const routes = [
    "/",
    "/catalog",
    "/sofas",
    "/living-room",
    "/dining",
    "/bedroom",
    "/home-office",
    "/armchairs",
    "/about",
    "/contact",
    "/delivery",
    "/returns",
    "/terms",
    "/privacy",
    "/fire-safety",
    "/vat",
    "/track-order",
    "/swatches",
    "/checkout",
    "/account",
    "/sitemap.xml",
    "/robots.txt",
    // Test query filter combinations
    "/bedroom?type=wardrobes",
    "/living-room?type=storage-cabinets",
    "/sofas?type=2-seater",
    "/categories/sofas?type=2-seater", // Should 308 redirect
  ];

  console.log("=== AUDITING LIVE PRODUCTION ROUTES ON https://sanfurniture.com ===");

  const results = [];
  for (const r of routes) {
    const url = `https://sanfurniture.com${r}`;
    try {
      const res = await fetch(url, { redirect: "manual" });
      const location = res.headers.get("location");
      results.push({
        route: r,
        status: res.status,
        ok: res.ok || res.status === 308,
        location: location || "",
      });
    } catch (e) {
      results.push({
        route: r,
        status: "ERROR",
        ok: false,
        location: e.message,
      });
    }
  }

  console.table(results);
}

auditRoutes().catch(console.error);
