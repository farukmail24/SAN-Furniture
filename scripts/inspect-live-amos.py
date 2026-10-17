import urllib.request
import re

url = "https://www.amosmannfurniture.co.uk/madrid-sliding-door-wardrobe-120cm-gloss-white---2461-2461-p.asp"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode("utf-8", errors="ignore")

# Search for ekmcdn images
imgs = re.findall(r'https://files\.ekmcdn\.com/amosmann1/images/[^\s"\'><]+', html)
clean_imgs = set()
for img in imgs:
    # strip query params or clean url
    base = img.split("?")[0]
    clean_imgs.add(base)

print(f"Total unique images on product page: {len(clean_imgs)}")
for im in sorted(clean_imgs):
    print(" ", im)
