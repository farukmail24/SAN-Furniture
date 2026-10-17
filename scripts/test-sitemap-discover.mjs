import https from "node:https";

function fetchSitemap() {
  return new Promise((resolve, reject) => {
    https.get("https://www.amosmannfurniture.co.uk/sitemap.xml", {
      headers: { "User-Agent": "Mozilla/5.0" }
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const matches = [...data.matchAll(/<loc>(https:\/\/[^<]+-p\.asp)<\/loc>/g)].map(m => m[1]);
        resolve(matches);
      });
    }).on("error", reject);
  });
}

const urls = await fetchSitemap();
console.log(`Found ${urls.length} live product URLs in Amos Mann sitemap!`);
console.log("Sample 5 URLs:");
urls.slice(0, 5).forEach((u, i) => console.log(` [${i+1}] ${u}`));
