import urllib.request
import re
import json

test_urls = [
    "https://www.amosmannfurniture.co.uk/madrid-sliding-door-wardrobe-120cm-gloss-white---2461-2461-p.asp",
    "https://www.amosmannfurniture.co.uk/valentina-white-220cm-sliding-wardrobe-with-mirror---11008286-3009-p.asp",
    "https://www.amosmannfurniture.co.uk/costa-tv-unit-white-gloss-p9rxls63---2579-2579-p.asp",
    "https://www.amosmannfurniture.co.uk/zuldy-large-30-pairs-white-shoe-cupboard---2505-2505-p.asp",
    "https://www.amosmannfurniture.co.uk/toris-sideboard-white-with-oak-effect---2607-2607-p.asp",
    "https://www.amosmannfurniture.co.uk/kuba-artic-white-desk-with-drawers---2489-2489-p.asp"
]

results = []
for url in test_urls:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            json_lds = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.S | re.I)
            prod = None
            cat = []
            for j in json_lds:
                try:
                    d = json.loads(j)
                    if d.get("@type") == "Product":
                        prod = d
                    elif d.get("@type") == "BreadcrumbList":
                        for it in d.get("itemListElement", []):
                            n = it.get("item", {}).get("name")
                            if n and n != "Home":
                                cat.append(n)
                except Exception:
                    pass

            if prod:
                imgs = re.findall(r'https://files\.ekmcdn\.com/amosmann1/images/[^\s"\'><]+', html)
                clean_imgs = list(dict.fromkeys([img.split("?")[0] for img in imgs if img.split("?")[0].endswith(('.jpg', '.jpeg', '.png', '.webp'))]))
                
                results.append({
                    "title": prod.get("name"),
                    "sku": prod.get("sku"),
                    "price": prod.get("offers", {}).get("price"),
                    "category": " > ".join(cat),
                    "images": clean_imgs[:5],
                    "desc_snippet": prod.get("description", "")[:120] + "..."
                })
    except Exception as e:
        print(f"Error on {url}: {e}")

for idx, r in enumerate(results):
    print(f"\n[{idx+1}] {r['title']}")
    print(f"    Price on live site: GBP {r['price']}")
    print(f"    Category: {r['category']}")
    print(f"    Images ({len(r['images'])}): {r['images'][0] if r['images'] else 'None'}")
    print(f"    Snippet: {r['desc_snippet']}")
