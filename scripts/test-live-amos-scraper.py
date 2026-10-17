import urllib.request
import xml.etree.ElementTree as ET
import re
import json
import time

def get_product_data(url):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

    # 1. JSON-LD Block
    json_lds = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.S | re.I)
    prod_data = None
    category_trail = []
    
    for j in json_lds:
        try:
            d = json.loads(j)
            if d.get("@type") == "Product":
                prod_data = d
            elif d.get("@type") == "BreadcrumbList":
                for item in d.get("itemListElement", []):
                    name = item.get("item", {}).get("name")
                    if name and name != "Home":
                        category_trail.append(name)
        except Exception:
            pass

    if not prod_data:
        return None

    # 2. Extract Images from HTML
    ekm_imgs = re.findall(r'https://files\.ekmcdn\.com/amosmann1/images/[^\s"\'><]+', html)
    unique_images = []
    seen = set()
    for img in ekm_imgs:
        clean = img.split("?")[0]
        if clean not in seen and clean.endswith(('.jpg', '.jpeg', '.png', '.webp')):
            seen.add(clean)
            unique_images.append(clean)

    # 3. Parse Dimensions from Description
    desc = prod_data.get("description", "")
    dims = {"width_cm": None, "height_cm": None, "depth_cm": None}
    dim_match = re.search(r'Size\s*W([0-9.]+)\s*cm,\s*H([0-9.]+)\s*cm,\s*D([0-9.]+)\s*cm', desc, re.I)
    if dim_match:
        dims["width_cm"] = float(dim_match.group(1))
        dims["height_cm"] = float(dim_match.group(2))
        dims["depth_cm"] = float(dim_match.group(3))

    offers = prod_data.get("offers", {})
    price_str = offers.get("price")
    price_val = float(price_str) if price_str else None

    return {
        "url": url,
        "title": prod_data.get("name"),
        "sku": prod_data.get("sku"),
        "price_gbp": price_val,
        "is_in_stock": "InStock" in offers.get("availability", ""),
        "category": " > ".join(category_trail) if category_trail else "Furniture",
        "description": desc.strip(),
        "dimensions": dims,
        "images": unique_images if unique_images else ([prod_data.get("image")] if prod_data.get("image") else [])
    }

# Fetch sitemap and test on first 5 product URLs
sitemap_url = "https://www.amosmannfurniture.co.uk/sitemap.xml"
req = urllib.request.Request(sitemap_url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=10) as resp:
    root = ET.fromstring(resp.read())

urls = [elem.text for elem in root.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
product_urls = [u for u in urls if "-p.asp" in u]

print(f"Found {len(product_urls)} total product URLs in live sitemap.")
print("Extracting live data from first 5 products as verification test...\n")

sample_products = []
for idx, u in enumerate(product_urls[:5]):
    print(f"[{idx+1}/5] Scraping: {u}")
    data = get_product_data(u)
    if data:
        sample_products.append(data)
        print(f"  * Title: {data['title']}")
        print(f"  * Price: GBP {data['price_gbp']}")
        print(f"  * Category: {data['category']}")
        print(f"  * Dimensions: {data['dimensions']}")
        print(f"  * Images count: {len(data['images'])}")
    time.sleep(0.5)

print("\n" + "="*60)
print(f"Successfully extracted {len(sample_products)} live products with full data!")
if sample_products:
    print("Sample Product JSON:")
    print(json.dumps(sample_products[0], indent=2))
