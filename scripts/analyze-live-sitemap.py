import urllib.request
import xml.etree.ElementTree as ET

sitemap_url = "https://www.amosmannfurniture.co.uk/sitemap.xml"
req = urllib.request.Request(sitemap_url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=10) as resp:
    root = ET.fromstring(resp.read())

urls = [elem.text for elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
product_urls = [u for u in urls if "-p.asp" in u]

keywords = ["wardrobe", "sliding", "table", "tv", "chest", "sideboard", "desk", "shoe"]
counts = {k: 0 for k in keywords}
sample_by_key = {k: [] for k in keywords}

for u in product_urls:
    slug = u.split("/")[-1].lower()
    for k in keywords:
        if k in slug:
            counts[k] += 1
            if len(sample_by_key[k]) < 3:
                sample_by_key[k].append(u)

print(f"Total Live Products: {len(product_urls)}\nBreakdown by Furniture Type:")
for k, count in counts.items():
    print(f"  - {k.capitalize()}: {count} live products")
    for s in sample_by_key[k]:
        print(f"      {s.split('/')[-1]}")
