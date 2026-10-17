import https from "node:https";

const url = "https://www.amosmannfurniture.co.uk/madrid-sliding-door-wardrobe-120cm-gloss-white---2461-2461-p.asp";

https.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" } }, (res) => {
  let data = "";
  res.on("data", c => data += c);
  res.on("end", () => {
    const jsonLdMatch = data.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis) || [];
    for (const b of jsonLdMatch) {
      const raw = b.replace(/<\/?script[^>]*>/gi, "");
      try {
        const p = JSON.parse(raw);
        if (p["@type"] === "Product") {
          console.log("Product JSON-LD offers:", JSON.stringify(p.offers, null, 2));
        }
      } catch {}
    }

    // Check where "out of stock" appears in data
    const matches = [...data.matchAll(/(.{0,50}(?:out of stock|sold out).{0,50})/gi)];
    console.log(`\nFound ${matches.length} occurrences of 'out of stock' / 'sold out' in page HTML:`);
    matches.slice(0, 5).forEach((m, i) => console.log(`  [${i+1}] ...${m[0].replace(/\s+/g, ' ')}...`));
  });
});
