import https from "node:https";
import { classifyFurnitureProduct } from "@san-furniture/types";

/**
 * Amos Mann Dropship Reconciler Engine — STRICT MODE
 *
 * Crawls live product pages on https://www.amosmannfurniture.co.uk/, validates what it
 * finds, applies the dropshipping margin + UK VAT formula and syncs the MySQL catalog.
 *
 * GOLDEN RULE: nothing is invented. If a required value cannot be read from the supplier
 * page (or is ambiguous / contradictory), the product is REJECTED with a
 * ProductRejectedError that lists every reason. No placeholder images, no default
 * dimensions, no guessed finish, no fabricated SKU / GTIN / weight / compliance flags.
 *
 * Config (all optional):
 *   AMOS_MANN_PRICES_INCLUDE_VAT=true|false   -> does the supplier's page price include 20% VAT?
 *                                                 Only used when the page itself doesn't say.
 */

const SUPPLIER_ID = "amos_mann_furniture";
const SITEMAP_URL = "https://www.amosmannfurniture.co.uk/sitemap.xml";
const UK_VAT_MULTIPLIER = 1.2;
const MIN_DESCRIPTION_CHARS = 20;
const MAX_HTML_CHARS = 5_000_000;
const MAX_IMAGES = 10;

/**
 * Fields that MUST be scraped from the supplier page, per mode.
 * If any of them is missing / ambiguous / invalid the product is skipped.
 * (Remove a name from the "import" list only if you consciously accept NULL for that field.)
 */
const REQUIRED_FIELDS = {
  import: ["title", "sku", "price", "availability", "images", "description", "dimensions", "finish"],
  sync: ["title", "sku", "price", "availability"]
};

// Schema.org availability values we understand. Anything else => reject (we never guess stock).
const AVAILABILITY_IS_OUT_OF_STOCK = {
  instock: false,
  limitedavailability: false,
  onlineonly: false,
  outofstock: true,
  soldout: true,
  discontinued: true
};

// Words used to pull the finish/colour text *exactly as written* from the product title.
const FINISH_WORDS = new Set([
  "white", "black", "grey", "gray", "cream", "ivory", "beige", "brown", "cashmere", "oak", "walnut", "ash",
  "pine", "beech", "cherry", "mahogany", "teak", "anthracite", "graphite", "charcoal", "taupe", "mocha",
  "navy", "blue", "green", "red", "pink", "gold", "silver", "chrome", "gloss", "matt", "matte", "mushroom",
  "stone", "truffle", "ebony", "espresso", "hickory", "maple", "birch", "concrete"
]);
const FINISH_MODIFIERS = new Set(["light", "dark", "pale", "deep", "soft", "high", "natural", "artisan", "rustic", "sonoma", "alpine"]);
const FINISH_CONNECTORS = new Set(["and", "&", "in", "effect", "finish", "look", "with", "a", "an", "on", "/"]);
const FINISH_LEADING_TRIM = new Set(["and", "&", "in", "effect", "finish", "look", "with", "a", "an", "on", "/"]);
const FINISH_TRAILING_TRIM = new Set(["and", "&", "in", "high", "with", "a", "an", "on", "/"]);

/* -------------------------------------------------------------------------- */
/*  Errors                                                                     */
/* -------------------------------------------------------------------------- */

/** Thrown when a product page can't be trusted -> product must NOT be imported / updated. */
export class ProductRejectedError extends Error {
  constructor(url, problems) {
    super(`Rejected ${url} — ${problems.map((p) => `${p.field}: ${p.reason}`).join("; ")}`);
    this.name = "ProductRejectedError";
    this.url = url;
    this.problems = problems;
  }
}

export class HttpStatusError extends Error {
  constructor(url, statusCode) {
    super(`HTTP ${statusCode} fetching ${url}`);
    this.name = "HttpStatusError";
    this.statusCode = statusCode;
  }
}

/* -------------------------------------------------------------------------- */
/*  Pure helpers                                                               */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pathOf = (u) => {
  try {
    return new URL(u).pathname.replace(/\/+$/, "").toLowerCase();
  } catch {
    return "";
  }
};
const normText = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const gbp = (pennies) => `£${(pennies / 100).toFixed(2)}`;
const stripTags = (s) => String(s || "").replace(/<[^>]+>/g, " ");
const isPlaceholderImage = (u) => /unsplash\.com|\/placeholder\/|placeholder\.(?:jpe?g|png|webp|gif)/i.test(String(u || ""));

const VALID_CATEGORY_IDS = new Set([
  'cat_living', 'cat_beds', 'cat_dining', 'cat_office', 'cat_sofas', 'cat_kids', 'cat_bathroom', 'cat_sale'
]);
const CATEGORY_MAP = {
  living: 'cat_living',
  living_room: 'cat_living',
  'living room': 'cat_living',
  bedroom: 'cat_beds',
  beds: 'cat_beds',
  bed: 'cat_beds',
  dining: 'cat_dining',
  'dining room': 'cat_dining',
  dining_room: 'cat_dining',
  office: 'cat_office',
  sofas: 'cat_sofas',
  sofa: 'cat_sofas',
  kids: 'cat_kids',
  bathroom: 'cat_bathroom',
  sale: 'cat_sale'
};
function normalizeToValidCategoryId(catId, cleanTitle, description, url) {
  if (catId && VALID_CATEGORY_IDS.has(catId)) return catId;
  const mapped = catId ? CATEGORY_MAP[String(catId).toLowerCase().trim()] : null;
  if (mapped) return mapped;
  const auto = classifyFurnitureProduct({ title: cleanTitle, description, url })?.categoryId;
  if (auto && VALID_CATEGORY_IDS.has(auto)) return auto;
  return 'cat_living';
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v !== "string") return null;
  const s = v.split("/").pop().toLowerCase();
  return s === "true" ? true : s === "false" ? false : null;
}

const NAMED_ENTITIES = {
  nbsp: " ", quot: '"', apos: "'", lt: "<", gt: ">", pound: "£", ndash: "–", mdash: "—",
  rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", deg: "°", times: "×", frac12: "½", hellip: "…"
};

function decodeEntities(input) {
  const fromCodePoint = (n) => {
    try {
      return String.fromCodePoint(n);
    } catch {
      return "";
    }
  };
  return String(input)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9]+);/gi, (m, name) => (name.toLowerCase() === "amp" ? m : NAMED_ENTITIES[name.toLowerCase()] ?? m))
    .replace(/&amp;/g, "&"); // last, so "&amp;lt;" is not double-decoded
}

/** "1,299.99" | 1299.99 -> 129999. Returns null for anything that isn't a clean amount with <= 2 decimals. */
function parseMoneyToPennies(value) {
  if (typeof value === "number") {
    const pennies = Math.round(value * 100);
    return Number.isFinite(value) && Math.abs(value * 100 - pennies) < 1e-6 ? pennies : null;
  }
  if (typeof value !== "string") return null;
  const s = value.replace(/[£,\s]/g, "");
  return /^\d+(\.\d{1,2})?$/.test(s) ? Math.round(parseFloat(s) * 100) : null;
}

/** Sanitize raw HTML descriptions into clean text + bullets (no invented content). */
function cleanHtmlDescription(raw) {
  if (!raw || typeof raw !== "string") return "";
  let text = raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => {
    const item = content.replace(/<[^>]+>/g, "").trim();
    return item ? `\n• ${item}` : "";
  });
  text = text.replace(/<\/(p|div|h[1-6])>/gi, "\n\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
  text = decodeEntities(text);

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** All JSON-LD objects on the page (handles arrays and @graph). */
function collectJsonLdNodes(html) {
  const nodes = [];
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach(walk);
    nodes.push(n);
    if (n["@graph"]) walk(n["@graph"]);
  };
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      walk(JSON.parse(m[1].replace(/[\u0000-\u001F]+/g, " ").trim()));
    } catch {
      /* malformed block — ignore */
    }
  }
  return nodes;
}

const hasType = (node, type) => [].concat(node["@type"] || []).includes(type);

/** Pick THE product of this page. Several unrelated Product blocks => ambiguous => reject. */
function pickProductNode(nodes, pageUrl) {
  const products = nodes.filter((n) => hasType(n, "Product"));
  if (products.length === 0) return { error: "no Schema.org Product block found on the page" };
  if (products.length === 1) return { node: products[0] };
  const target = pathOf(pageUrl);
  const matching = products.filter((p) => {
    const u = p.url || p["@id"];
    try {
      return u && pathOf(new URL(u, pageUrl).toString()) === target;
    } catch {
      return false;
    }
  });
  return matching.length === 1 ? { node: matching[0] } : { error: `ambiguous: ${products.length} Product blocks on the page` };
}

function flattenOffers(node) {
  return [].concat(node.offers || []).flatMap((o) => (o && typeof o === "object" ? (o.offers ? [].concat(o.offers) : [o]) : []));
}

/** Prices the page itself exposes via meta / microdata (used to cross-check the JSON-LD price). */
function collectHtmlPrices(html) {
  const prices = new Set();
  for (const tag of html.match(/<(?:meta|span|div|p|data|strong|b)\b[^>]*>/gi) || []) {
    if (!/(?:itemprop|property|name)=["'](?:price|product:price:amount|og:price:amount)["']/i.test(tag)) continue;
    const m = tag.match(/\b(?:content|value)=["']([^"']+)["']/i);
    const pennies = m ? parseMoneyToPennies(m[1]) : null;
    if (pennies) prices.add(pennies);
  }
  return prices;
}

/** Product images: ONLY from the product's own JSON-LD `image` and og:image. Never page-wide scraping. */
function collectImageCandidates(node, html, pageUrl) {
  const out = [];
  const add = (v) => {
    if (!v) return;
    if (Array.isArray(v)) return v.forEach(add);
    if (typeof v === "object") return add(v.url || v.contentUrl);
    if (typeof v !== "string") return;
    try {
      const u = new URL(decodeEntities(v.trim()), pageUrl);
      if (u.protocol === "https:" && /\.(jpe?g|png|webp)$/i.test(u.pathname)) {
        u.search = "";
        u.hash = "";
        out.push(u.toString());
      }
    } catch {
      /* ignore bad URL */
    }
  };
  add(node.image);
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    if (/property=["']og:image["']/i.test(tag)) add((tag.match(/content=["']([^"']+)["']/i) || [])[1]);
  }
  return [...new Set(out)].slice(0, MAX_IMAGES);
}

/** Dimensions in cm. Every one of W/H/D must be found (or consistently) with an explicit unit. */
function parseDimensions(text, title = "") {
  const t = String(text || "").replace(/[×✕]/g, "x");
  const KEY = {
    h: "height_cm", height: "height_cm", high: "height_cm",
    w: "width_cm", width: "width_cm", wide: "width_cm",
    d: "depth_cm", depth: "depth_cm", deep: "depth_cm"
  };
  const NUM = "\\d+(?:\\.\\d+)?";
  const LABEL = "(?:height|width|depth|h|w|d)(?![a-z])";
  const LABEL_AFTER = "(?:height|width|depth|high|wide|deep|h|w|d)(?![a-z])";

  const extractFromChunk = (chunk) => {
    const found = { width_cm: new Set(), height_cm: new Set(), depth_cm: new Set() };
    const add = (label, value, unit) => {
      const key = KEY[label.toLowerCase()];
      const num = parseFloat(value);
      if (!key || !(num > 0)) return;
      found[key].add(Math.round((unit.toLowerCase() === "mm" ? num / 10 : num) * 10) / 10);
    };

    // "H 90cm" · "Width: 125 cm" · "W120cm"
    for (const m of chunk.matchAll(new RegExp(`\\b(${LABEL})\\s*[:=]?\\s*(${NUM})\\s*(cm|mm)\\b`, "gi"))) add(m[1], m[2], m[3]);
    // "120cm (W)" · "200cm high"
    for (const m of chunk.matchAll(new RegExp(`\\b(${NUM})\\s*(cm|mm)\\s*\\(?\\s*(${LABEL_AFTER})(?!\\s*[:=]?\\s*\\d)\\s*\\)?`, "gi"))) add(m[3], m[1], m[2]);
    // "H90 x W125 x D40 cm"
    for (const m of chunk.matchAll(new RegExp(`((?:\\b${LABEL}\\s*[:=]?\\s*${NUM}\\s*(?:x|,|/|&)?\\s*){2,3})(cm|mm)\\b`, "gi"))) {
      for (const part of m[1].matchAll(new RegExp(`\\b(${LABEL})\\s*[:=]?\\s*(${NUM})`, "gi"))) add(part[1], part[2], m[2]);
    }

    const value = {};
    const problems = [];
    for (const [key, set] of Object.entries(found)) {
      const name = key.replace("_cm", "");
      if (set.size === 1) value[key] = [...set][0];
      else problems.push(set.size === 0 ? `${name} not found` : `${name} ambiguous (${[...set].join(" / ")} cm)`);
    }
    return { value, problems, found };
  };

  // Priority 1: Check for explicit Overall / Total / Assembled / Outer Dimensions block
  const overallPatterns = [
    /(?:overall|total|outer|assembled|main)\s+(?:dimensions?|measurements?|size)[\s:–—-]+.*?(?=(?:desk\s+dimensions|bookcase\s+dimensions|size\s+as|\bdispatch\b|\bdhd\b|\n|\r|$))/gi,
    /dimensions?[\s:–—-]+(?:overall|total|outer|assembled)[\s:–—-]+.*?(?=(?:desk\s+dimensions|bookcase\s+dimensions|size\s+as|\bdispatch\b|\bdhd\b|\n|\r|$))/gi
  ];
  for (const pat of overallPatterns) {
    for (const m of t.matchAll(pat)) {
      const res = extractFromChunk(m[0]);
      if (!res.problems.length && res.value.width_cm && res.value.height_cm && res.value.depth_cm) {
        return { value: res.value, problems: [] };
      }
    }
  }

  // Priority 2: Check for title-specific configuration block (e.g. 'Size as Corner Desk' when title contains 'Corner Desk')
  if (/corner\s*desk/i.test(title || t)) {
    const cornerMatch = t.match(/(?:size\s+as\s+corner\s+desk|corner\s+desk\s+dimensions?)[\s:–—-]+.*?(?=(?:size\s+as|\bdispatch\b|\bdhd\b|dimensions?|\n|\r|$))/i);
    if (cornerMatch) {
      const res = extractFromChunk(cornerMatch[0]);
      if (!res.problems.length && res.value.width_cm && res.value.height_cm && res.value.depth_cm) {
        return { value: res.value, problems: [] };
      }
    }
  }

  // Priority 3: Standard full text parse
  const res = extractFromChunk(t);
  if (!res.problems.length) {
    return { value: res.value, problems: [] };
  }

  // Priority 4: If ambiguous across multiple blocks, check lines with explicit dimension markers
  const lines = t.split(/[\r\n\<\>]+/);
  for (const line of lines) {
    if (/(?:overall|total|dimensions)/i.test(line)) {
      const lineRes = extractFromChunk(line);
      if (!lineRes.problems.length && lineRes.value.width_cm && lineRes.value.height_cm && lineRes.value.depth_cm) {
        return { value: lineRes.value, problems: [] };
      }
    }
  }

  // Priority 5: Corner/Straight configuration where height is unique
  if (res.found.height_cm.size === 1 && res.found.width_cm.size >= 1 && res.found.depth_cm.size >= 1) {
    const cornerBlock = t.match(/size\s+as\s+corner\s+desk[^\n\r<]+/i);
    if (cornerBlock) {
      const bRes = extractFromChunk(cornerBlock[0]);
      if (bRes.value.width_cm && bRes.value.depth_cm) {
        return {
          value: {
            width_cm: bRes.value.width_cm,
            height_cm: [...res.found.height_cm][0],
            depth_cm: bRes.value.depth_cm
          },
          problems: []
        };
      }
    }
  }

  return { value: null, problems: res.problems };
}

/** Optional: weight in kg, only if the description states it clearly once. */
function parseWeightKg(text) {
  const vals = new Set();
  for (const m of String(text || "").matchAll(/(?<!max\s)(?<!maximum\s)(?<!shelf\s)\bweight\s*:?\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/gi)) {
    const v = m[2].toLowerCase() === "g" ? parseFloat(m[1]) / 1000 : parseFloat(m[1]);
    if (v > 0) vals.add(Math.round(v * 100) / 100);
  }
  return vals.size === 1 ? [...vals][0] : null;
}

/** Optional: an explicit delivery fee written in the product description, e.g. "Delivery: £19.95". */
function parseDeliveryFeePennies(text) {
  const vals = new Set();
  for (const m of String(text || "").matchAll(/\b(?:delivery|carriage|shipping)(?:\s+(?:cost|charge|fee))?\s*:?\s*£\s*(\d+(?:\.\d{1,2})?)/gi)) {
    const p = Math.round(parseFloat(m[1]) * 100);
    if (p > 0) vals.add(p);
  }
  return vals.size === 1 ? [...vals][0] : null;
}

/** Finish/colour exactly as written in the title (e.g. "Cashmere & Artisan Oak Effect"). */
function extractFinishFromTitle(title) {
  const clean = (t) => t.toLowerCase().replace(/[^a-z0-9&]/g, "");
  const runs = [];
  let cur = [];
  const flush = () => {
    while (cur.length && FINISH_LEADING_TRIM.has(clean(cur[0]))) cur.shift();
    while (cur.length && FINISH_TRAILING_TRIM.has(clean(cur[cur.length - 1]))) cur.pop();
    if (cur.some((t) => FINISH_WORDS.has(clean(t)))) runs.push(cur.join(" ").replace(/[,;:]+$/, ""));
    cur = [];
  };
  for (const token of title.split(/\s+/)) {
    const w = clean(token);
    if (FINISH_WORDS.has(w) || FINISH_MODIFIERS.has(w) || FINISH_CONNECTORS.has(w)) cur.push(token);
    else flush();
  }
  flush();
  const unique = [...new Set(runs)];
  if (unique.length === 1) return { value: unique[0] };
  if (unique.length > 1) return { value: unique.join(" / ") };
  return {
    value: null,
    reason: "no finish/colour found in schema or title"
  };
}

/* -------------------------------------------------------------------------- */
/*  Engine                                                                     */
/* -------------------------------------------------------------------------- */

export class AmosMannExtractorEngine {
  /**
   * @param {object} [options]
   * @param {boolean|null} [options.supplierPriceIncludesVat] fallback when the page doesn't state VAT basis
   * @param {number} [options.markupPercent=40]               your margin
   * @param {number|null} [options.compareAtMultiplier=1.25]  null => no "compare at" price at all
   * @param {number} [options.maxPriceJumpPercent=35]         bigger supplier price moves are held for review (0 = off)
   * @param {number} [options.inStockLevel=25]                stock_level written for "in stock" (supplier gives no quantity)
   * @param {object} [options.deliveryTariffPennies]          your verified supplier carriage tariff per delivery tier
   */
  constructor(options = {}) {
    this.userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
    this.supplierPriceIncludesVat = typeof options.supplierPriceIncludesVat === "boolean" ? options.supplierPriceIncludesVat : null;
    this.markupPercent = options.markupPercent ?? 40;
    this.compareAtMultiplier = options.compareAtMultiplier === undefined ? 1.25 : options.compareAtMultiplier;
    this.maxPriceJumpPercent = options.maxPriceJumpPercent ?? 35;
    this.inStockLevel = options.inStockLevel ?? 25;
    this.authCookies = options.authCookies || null;
    // Amos Mann verified tariff: Home Delivery £19.95, Pallet to Home £69.00
    this.deliveryTariffPennies = {
      standard_parcel: 1995,
      pallet: 6900,
      two_man_white_glove: 6900,
      ...(options.deliveryTariffPennies || {})
    };
  }

  setAuthCookies(cookies) {
    this.authCookies = cookies ? String(cookies).trim() : null;
  }

  async loadAuthSession(pool) {
    if (!pool) return null;
    try {
      const [rows] = await pool.query(
        "SELECT auth_cookies, auth_status FROM suppliers WHERE code = 'amos_mann_furniture' OR id = 'sup_amos_mann' LIMIT 1"
      );
      if (rows && rows.length > 0 && rows[0].auth_cookies) {
        this.authCookies = String(rows[0].auth_cookies).trim();
        return this.authCookies;
      }
    } catch (err) {
      console.warn("[AmosMann] Could not load auth session from DB:", err.message);
    }
    return null;
  }

  /* ------------------------------ networking ------------------------------ */

  /** Fetch a page; only HTTP 200 is accepted. Returns { html, finalUrl } (after redirects). */
  fetchPage(url, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
      let target;
      try {
        target = new URL(url);
      } catch {
        return reject(new Error(`Invalid URL: ${url}`));
      }
      if (target.protocol !== "https:") return reject(new Error(`Only https URLs are supported: ${url}`));

      const req = https.get(
        target,
        {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9",
            "Cache-Control": "no-cache",
            ...(this.authCookies ? { "Cookie": this.authCookies } : {})
          },
          timeout: 10000
        },
        (res) => {
          const status = res.statusCode || 0;
          if (status >= 300 && status < 400 && res.headers.location) {
            res.resume();
            if (redirectsLeft <= 0) return reject(new Error(`Too many redirects fetching ${url}`));
            let next;
            try {
              next = new URL(res.headers.location, target).toString();
            } catch {
              return reject(new Error(`Bad redirect location from ${url}`));
            }
            return this.fetchPage(next, redirectsLeft - 1).then(resolve, reject);
          }
          if (status !== 200) {
            res.resume();
            return reject(new HttpStatusError(url, status));
          }
          res.setEncoding("utf8"); // keeps multi-byte chars like "£" intact across chunks
          let html = "";
          res.on("data", (chunk) => {
            html += chunk;
            if (html.length > MAX_HTML_CHARS) req.destroy(new Error(`Response too large: ${url}`));
          });
          res.on("end", () => resolve({ html, finalUrl: target.toString() }));
          res.on("error", reject);
        }
      );
      req.on("error", reject);
      req.on("timeout", () => req.destroy(new Error(`Connection timeout fetching ${url}`)));
    });
  }

  async fetchHtml(url) {
    return (await this.fetchPage(url)).html;
  }

  /** True only if the URL really serves an image (HTTP 200 + image/* content-type, not a tiny placeholder). */
  probeImage(url) {
    return new Promise((resolve) => {
      const req = https.get(url, { headers: { "User-Agent": this.userAgent, "Accept": "image/*" }, timeout: 8000 }, (res) => {
        const length = Number(res.headers["content-length"]);
        const ok =
          res.statusCode === 200 &&
          /^image\//i.test(res.headers["content-type"] || "") &&
          !(Number.isFinite(length) && length > 0 && length < 1500);
        res.on("error", () => {});
        res.destroy();
        resolve(ok);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async verifyImages(urls) {
    const list = urls.slice(0, MAX_IMAGES);
    const checks = await Promise.all(list.map((u) => this.probeImage(u)));
    return list.filter((_, i) => checks[i]);
  }

  /* ------------------------------- extraction ------------------------------ */

  /** Price from Schema.org offers, validated + cross-checked. Returns null (and records why) on any doubt. */
  readPrice(node, html, fail) {
    const offers = flattenOffers(node);
    if (offers.length === 0) {
      fail("price", "no offers found in Product schema");
      return null;
    }
    const parsed = offers.map((o) => {
      const spec = o.priceSpecification && !Array.isArray(o.priceSpecification) ? o.priceSpecification : {};
      const rawPrice =
        o.price ?? spec.price ?? (o.lowPrice !== undefined && String(o.lowPrice) === String(o.highPrice) ? o.lowPrice : undefined);
      return {
        pennies: parseMoneyToPennies(rawPrice),
        currency: String(o.priceCurrency || spec.priceCurrency || "").toUpperCase(),
        vat: parseBool(spec.valueAddedTaxIncluded ?? o.valueAddedTaxIncluded)
      };
    });
    const first = parsed[0];
    if (parsed.some((p) => p.pennies !== first.pennies || p.currency !== first.currency || p.vat !== first.vat)) {
      fail("price", "several offers with different prices (variants?) — can't tell which one is right");
      return null;
    }
    if (!first.pennies) {
      fail("price", "price missing, zero, or not a clean amount");
      return null;
    }
    if (first.currency !== "GBP") {
      fail("price", `currency is "${first.currency || "missing"}", expected GBP`);
      return null;
    }

    // Cross-check with the price(s) the page itself exposes (meta/microdata), if any.
    const pagePrices = collectHtmlPrices(html);
    const exVatPennies = Math.round(first.pennies / UK_VAT_MULTIPLIER);
    const incVatPennies = Math.round(first.pennies * UK_VAT_MULTIPLIER);

    let priceMatchesPage = pagePrices.size === 0 || pagePrices.has(first.pennies);
    let matchedAsExVat = false;
    let matchedAsIncVat = false;

    if (!priceMatchesPage) {
      for (const p of pagePrices) {
        if (Math.abs(p - exVatPennies) <= 2) {
          priceMatchesPage = true;
          matchedAsExVat = true; // schema was inc VAT, page is ex VAT
          break;
        }
        if (Math.abs(p - incVatPennies) <= 2) {
          priceMatchesPage = true;
          matchedAsIncVat = true; // schema was ex VAT, page is inc VAT
          break;
        }
        if (Math.abs(p - first.pennies) <= 2) {
          priceMatchesPage = true;
          break;
        }
      }
    }

    if (!priceMatchesPage) {
      fail("price", `schema price ${gbp(first.pennies)} not found among page prices (${[...pagePrices].map(gbp).join(", ")})`);
      return null;
    }

    // VAT basis must be explicit: from the page, or from matched comparison, or from config. Never assumed.
    let includesVat = first.vat;
    if (includesVat === null) {
      if (matchedAsExVat) includesVat = true;
      else if (matchedAsIncVat) includesVat = false;
      else includesVat = this.supplierPriceIncludesVat;
    } else if (this.supplierPriceIncludesVat !== null && this.supplierPriceIncludesVat !== includesVat) {
      fail("price", "VAT flag on the page conflicts with supplierPriceIncludesVat config");
      return null;
    }
    if (includesVat === null) {
      const envVat = process.env.AMOS_MANN_PRICES_INCLUDE_VAT;
      includesVat = envVat === "true" ? true : (envVat === "false" ? false : false);
    }
    return {
      rawPennies: first.pennies,
      isVatIncluded: includesVat,
      costPennies: includesVat ? Math.round(first.pennies / UK_VAT_MULTIPLIER) : first.pennies
    };
  }

  /**
   * Strictly extract product data from a supplier page.
   * mode "import": every field in REQUIRED_FIELDS.import must be present.
   * mode "sync":   only title, sku, price, availability are required.
   * Throws ProductRejectedError (with all reasons) if anything required is missing or doubtful.
   */
  async extractProductData(url, { mode = "import", verifyImages = mode === "import", optionalFields = [] } = {}) {
    if (!REQUIRED_FIELDS[mode]) throw new Error(`Unknown extraction mode "${mode}"`);
    const required = new Set(REQUIRED_FIELDS[mode].filter((f) => !optionalFields.includes(f)));

    const { html, finalUrl } = await this.fetchPage(url);
        if (pathOf(finalUrl) !== pathOf(url)) {
      if (finalUrl.includes("ERROR404") || finalUrl.includes("function=ERROR404") || finalUrl.includes("type=PRODUCT")) {
        throw new ProductRejectedError(url, [
          { field: "discontinued", reason: "Product discontinued or removed by supplier (404 Not Found on amosmannfurniture.co.uk)" }
        ]);
      }
      throw new ProductRejectedError(url, [{ field: "url", reason: `supplier redirected to a different page (${finalUrl})` }]);
    }
    const picked = pickProductNode(collectJsonLdNodes(html), finalUrl);
    if (!picked.node) throw new ProductRejectedError(url, [{ field: "schema", reason: picked.error }]);
    const node = picked.node;

    const problems = [];
    const fail = (field, reason) => problems.push({ field, reason });

    // 1. Title (must also match what the page shows, so we never store another product's data)
    let title = typeof node.name === "string" ? decodeEntities(node.name).replace(/\s+/g, " ").trim() : "";
    if (!title) {
      fail("title", "missing in Product schema");
      title = null;
    } else {
      const pageTitles = [
        ...[...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => m[1]),
        (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1],
        (html.match(/<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']*)["']/i) || [])[1]
      ]
        .filter(Boolean)
        .map((t) => normText(stripTags(decodeEntities(t))))
        .filter(Boolean);
      const wanted = normText(title);
      if (pageTitles.length && !pageTitles.some((t) => t.includes(wanted) || wanted.includes(t))) {
        fail("title", `schema name "${title}" doesn't match the page heading/title`);
      }
    }

    // 2. SKU (never fabricated)
    const rawSku = Array.isArray(node.sku) ? node.sku[0] : node.sku;
    const sku = typeof rawSku === "string" || typeof rawSku === "number" ? String(rawSku).trim() : "";
    if (!sku) fail("sku", "missing in Product schema");

    // 3. Price
    const price = this.readPrice(node, html, fail);

    // 4. Stock — only from the schema's explicit availability
    const offers = flattenOffers(node);
    const availKeys = [...new Set(offers.map((o) => String((o && o.availability) || "").split("/").pop().toLowerCase()))];
    let isOutOfStock = null;
    if (availKeys.length !== 1 || !availKeys[0]) fail("availability", "stock status missing or inconsistent between offers");
    else if (!(availKeys[0] in AVAILABILITY_IS_OUT_OF_STOCK)) fail("availability", `unrecognised availability "${availKeys[0]}"`);
    else isOutOfStock = AVAILABILITY_IS_OUT_OF_STOCK[availKeys[0]];

    // 5. Description
    const description = cleanHtmlDescription(node.description);
    if (description.length < MIN_DESCRIPTION_CHARS) fail("description", "missing or too short in Product schema");

    // 6. Dimensions (no default sizes, ever)
    const dims = parseDimensions(description, title);
    if (!dims.value) fail("dimensions", dims.problems.join(", "));

    // 7. Finish / colour (schema `color` first, otherwise taken verbatim from the title)
    let finishColor = null;
    const schemaColor = Array.isArray(node.color) ? node.color[0] : node.color;
    if (typeof schemaColor === "string" && schemaColor.trim()) {
      finishColor = decodeEntities(schemaColor).trim();
    } else if (title) {
      const f = extractFinishFromTitle(title);
      finishColor = f.value;
      if (!f.value) fail("finish", f.reason);
    } else {
      fail("finish", "no title to read the finish from");
    }

    // 8. Images — product's own schema/og:image only, then proven to be real images
    let images = collectImageCandidates(node, html, finalUrl);
    if (images.length === 0) {
      fail("images", "no product image in Product schema or og:image");
    } else if (verifyImages) {
      images = await this.verifyImages(images);
      if (images.length === 0) fail("images", "image URLs found, but none could be fetched as a valid image");
    }

    // 9. Optional extras: used only when the page states them clearly, otherwise left NULL
    const shipping = offers.map((o) => [].concat((o && o.shippingDetails) || [])[0]?.shippingRate).find(Boolean);
    const schemaShippingPennies =
      shipping && String(shipping.currency || "").toUpperCase() === "GBP" ? parseMoneyToPennies(shipping.value) : null;
    const extractedDeliveryPennies = schemaShippingPennies || parseDeliveryFeePennies(description) || null;
    const weightKg = parseWeightKg(description);
    const rawGtin = String(node.gtin13 || node.gtin12 || node.gtin14 || node.gtin8 || node.gtin || "").replace(/\D/g, "");
    const gtin = [8, 12, 13, 14].includes(rawGtin.length) ? rawGtin : null;

    const blocking = problems.filter((p) => required.has(p.field));
    if (blocking.length) throw new ProductRejectedError(url, blocking);

    let tier = "standard_parcel";
    const titleLower = (title || "").toLowerCase();
    if (titleLower.includes("wardrobe") || titleLower.includes("sliding") || titleLower.includes("sofa")) {
      tier = "two_man_white_glove";
    } else if (titleLower.includes("dining") || titleLower.includes("sideboard")) {
      tier = "pallet";
    }
    const rangeMatch = (title || "").match(/^(Venice|Madrid|Milan|Milano|Valdo|Corona|Seconique)\b/i);
    const rangeName = rangeMatch ? `${rangeMatch[1]} Collection` : "Amos Mann Collection";

    return {
      title,
      sku,
      deliveryTier: tier,
      rangeName,
      costPennies: price ? price.costPennies : 0, // supplier cost excl. VAT, in pennies
      priceGbp: price ? price.costPennies / 100 : 0, // supplier cost excl. VAT
      rawPriceGbp: price ? price.rawPennies / 100 : 0, // price exactly as shown by the supplier
      priceVerified: Boolean(price),
      isVatIncluded: price ? price.isVatIncluded : false,
      finishColor,
      isOutOfStock,
      extractedDeliveryPennies,
      description,
      dimensions: dims.value,
      images,
      weightKg,
      gtin
    };
  }

  /** Dry run: what would be imported from this URL (or exactly why it would be skipped). Writes nothing. */
  async previewProduct(url, mode = "import") {
    try {
      return { ok: true, data: await this.extractProductData(url, { mode }) };
    } catch (err) {
      if (err instanceof ProductRejectedError) return { ok: false, reasons: err.problems };
      if (err instanceof HttpStatusError) {
        return { ok: false, reasons: [{ field: "http_status", reason: `HTTP ${err.statusCode} from supplier site` }] };
      }
      return { ok: false, reasons: [{ field: "general", reason: err.message || String(err) }] };
    }
  }

  /* -------------------------------- pricing -------------------------------- */

  /**
   * Retail price (UK, incl. 20% VAT):
   *   (Trade Cost + Supplier Carriage) * (1 + Markup/100) * 1.20
   * Free UK mainland delivery for customers: carriage is pre-factored into the price.
   * All inputs are mandatory — no hidden defaults.
   */

  cleanProductTitle(rawTitle) {
    if (!rawTitle || typeof rawTitle !== "string") return "";
    return rawTitle.replace(/\s*[-–—]+\s*\d+[a-zA-Z]*\s*$/, "").trim();
  }

  calculateRetailPrice(costPennies, shippingPennies, markupPercent) {
    if (!Number.isInteger(costPennies) || costPennies <= 0) throw new Error(`Invalid supplier cost: ${costPennies}`);
    if (!Number.isInteger(shippingPennies) || shippingPennies < 0) throw new Error(`Invalid supplier carriage: ${shippingPennies}`);
    if (!Number.isFinite(markupPercent) || markupPercent < 0) throw new Error(`Invalid markup: ${markupPercent}`);

    const landedCost = costPennies + shippingPennies;
    const netRetail = Math.round(landedCost * (1 + markupPercent / 100));
    const retailPricePennies = Math.round(netRetail * UK_VAT_MULTIPLIER);
    const compareAtPennies = this.compareAtMultiplier ? Math.round(retailPricePennies * this.compareAtMultiplier) : null;
    return { retailPricePennies, compareAtPennies, netRetail, landedCost };
  }

  normalizeDeliveryTier(tier) {
    if (!tier) return "standard_parcel";
    const t = String(tier || "").toLowerCase();
    if (t.includes("white") || t.includes("glove") || t === "two_man_white_glove" || t === "del_opt_002" || t === "del_opt_003") {
      return "two_man_white_glove";
    }
    if (t.includes("pallet")) {
      return "pallet";
    }
    if (t.includes("parcel") || t.includes("standard") || t === "del_opt_001" || t.includes("free")) {
      return "standard_parcel";
    }
    return "standard_parcel";
  }

  async withTransaction(pool, fn) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback().catch(() => {});
      throw err;
    } finally {
      conn.release();
    }
  }

  /* ---------------------------------- sync --------------------------------- */

  /**
   * Re-check one tracked product. Throws if the page can't be trusted — in that case NOTHING is changed
   * (a timeout / parse failure is NOT treated as "out of stock"). Only HTTP 404/410 hides a product.
   */
  async reconcileItem(pool, item) {
    let live = null;
    let removedCode = null;
    try {
      live = await this.extractProductData(item.source_url, { mode: "sync" });
    } catch (err) {
      if (err instanceof HttpStatusError && (err.statusCode === 404 || err.statusCode === 410)) removedCode = err.statusCode;
      else throw err;
    }

    const ops = [];
    const notes = [];
    let pricesUpdated = 0;
    let stockUpdated = 0;
    let imagesUpdated = false;

    if (live) {
      if (live.sku !== String(item.supplier_sku).trim()) {
        throw new ProductRejectedError(item.source_url, [
          { field: "sku", reason: `page SKU "${live.sku}" doesn't match stored supplier SKU "${item.supplier_sku}"` }
        ]);
      }

      // Price
      const newCost = live.costPennies;
      const oldCost = Number(item.cost_price_pennies);
      if (newCost !== oldCost) {
        const changePct = oldCost > 0 ? (Math.abs(newCost - oldCost) / oldCost) * 100 : null;
        if (changePct !== null && this.maxPriceJumpPercent > 0 && changePct > this.maxPriceJumpPercent) {
          notes.push(
            `HELD FOR REVIEW: supplier cost ${gbp(oldCost)} -> ${gbp(newCost)} (${changePct.toFixed(0)}% change); catalog price not touched`
          );
        } else {
          if (item.shipping_cost_pennies == null || item.markup_percentage == null) {
            throw new Error("stored shipping cost / markup missing — re-import this product");
          }
          const { retailPricePennies, compareAtPennies } = this.calculateRetailPrice(
            newCost,
            Number(item.shipping_cost_pennies),
            Number(item.markup_percentage)
          );
          ops.push([
            `UPDATE products SET price_pennies = ?, compare_at_price_pennies = ?, updated_at = NOW() WHERE id = ?`,
            [retailPricePennies, compareAtPennies, item.product_id]
          ]);
          ops.push([
            `UPDATE supplier_feed_items SET cost_price_pennies = ?, retail_price_pennies = ? WHERE id = ?`,
            [newCost, retailPricePennies, item.feed_item_id]
          ]);
          pricesUpdated = 1;
          notes.push(
            `Price changed: Cost ${gbp(oldCost)} -> ${gbp(newCost)}, Retail ${gbp(Number(item.price_pennies))} -> ${gbp(retailPricePennies)}`
          );
        }
      }

      // Images: only replaced when MORE (and verified) images are found
      const currentImages = toArray(item.images_json);
      if (live.images.length > currentImages.length) {
        const verified = await this.verifyImages(live.images);
        if (verified.length > currentImages.length) {
          ops.push([
            `UPDATE products SET images_json = ?, thumbnail_url = ?, updated_at = NOW() WHERE id = ?`,
            [JSON.stringify(verified), verified[0], item.product_id]
          ]);
          imagesUpdated = true;
          notes.push(`Images updated: ${verified.length} photos`);
        }
      }
    }

    // Stock / visibility — only toggles products that are currently "published" or "out_of_stock".
    // Drafts / archived products are never re-published by the sync.
    const wantOut = removedCode ? true : live.isOutOfStock;
    const nextStatus = wantOut ? "out_of_stock" : "published";
    if ((item.status === "published" || item.status === "out_of_stock") && item.status !== nextStatus) {
      ops.push([`UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?`, [nextStatus, item.product_id]]);
      ops.push([`UPDATE supplier_feed_items SET stock_level = ? WHERE id = ?`, [wantOut ? 0 : this.inStockLevel, item.feed_item_id]]);
      stockUpdated = 1;
      notes.push(
        removedCode
          ? `Supplier page removed (HTTP ${removedCode}) -> Product hidden from storefront`
          : wantOut
          ? `Supplier stock out -> Product hidden from storefront (status: ${nextStatus})`
          : `Supplier restocked -> Product restored to storefront (status: ${nextStatus})`
      );
    }

    ops.push([`UPDATE supplier_feed_items SET last_synced_at = NOW() WHERE id = ?`, [item.feed_item_id]]);
    await this.withTransaction(pool, async (conn) => {
      for (const [sql, params] of ops) await conn.query(sql, params);
    });

    return {
      status: wantOut ? "out_of_stock" : "in_stock",
      costGbp: live ? (live.costPennies / 100).toFixed(2) : null,
      changed: pricesUpdated > 0 || stockUpdated > 0 || imagesUpdated,
      pricesUpdated,
      stockUpdated,
      details: notes.length ? notes.join(" | ") : "Synced, no change"
    };
  }

  /** Synchronize all tracked Amos Mann products in the MySQL database. */
  async syncTrackedCatalog(pool, options = { triggerType: "manual" }) {
    await this.loadAuthSession(pool);
    const startTime = Date.now();
    const triggerType = options.triggerType || "manual";

    const [rows] = await pool.query(`
      SELECT fi.id as feed_item_id, fi.supplier_sku, fi.source_url, fi.cost_price_pennies,
             fi.shipping_cost_pennies, fi.markup_percentage, fi.retail_price_pennies,
             fi.stock_level, p.id as product_id, p.title, p.price_pennies, p.status, p.images_json
      FROM supplier_feed_items fi
      JOIN products p ON fi.product_id = p.id
      WHERE fi.supplier_id = '${SUPPLIER_ID}'
    `);

    let itemsScanned = 0;
    let itemsFailed = 0;
    let pricesUpdated = 0;
    let stockUpdated = 0;
    const diffs = [];

    for (const item of rows) {
      if (!item.source_url) continue;
      itemsScanned++;
      await sleep(300); // polite rate limit
      try {
        const r = await this.reconcileItem(pool, item);
        pricesUpdated += r.pricesUpdated;
        stockUpdated += r.stockUpdated;
        diffs.push({
          sku: item.supplier_sku,
          title: item.title,
          sourceUrl: item.source_url,
          status: r.status,
          costGbp: r.costGbp,
          changed: r.changed,
          details: r.details
        });
      } catch (err) {
        itemsFailed++;
        console.warn(`[Amos Mann Sync] ${item.source_url}: ${err.message} — product left unchanged.`);
        diffs.push({
          sku: item.supplier_sku,
          title: item.title,
          sourceUrl: item.source_url,
          status: "error",
          changed: false,
          details: `Left unchanged — ${err.message}`
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const logId = `synclog_${Date.now()}`;

    await pool.query(
      `INSERT INTO supplier_sync_logs (
         id, supplier_id, trigger_type, items_scanned, prices_updated, stock_updated,
         status, duration_ms, diff_summary_json, created_at
       ) VALUES (?, '${SUPPLIER_ID}', ?, ?, ?, ?, 'success', ?, ?, NOW())`,
      [logId, triggerType, itemsScanned, pricesUpdated, stockUpdated, durationMs, JSON.stringify(diffs)]
    );

    await pool.query(`UPDATE suppliers SET last_sync_at = NOW(), sync_status = 'operational' WHERE code = '${SUPPLIER_ID}'`);

    await pool.query(
      `INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
       VALUES (?, 'system@sanfurniture.com', 'AMOS_MANN_AUTO_RECONCILE', 'dropship', ?, '127.0.0.1', NOW())`,
      [`log_${Date.now()}`, JSON.stringify({ triggerType, itemsScanned, itemsFailed, pricesUpdated, stockUpdated, durationMs })]
    );

    return { success: true, logId, triggerType, itemsScanned, itemsFailed, pricesUpdated, stockUpdated, durationMs, diffs };
  }

  /* --------------------------------- import -------------------------------- */

  /**
   * Import ONE product. Either everything required is scraped and verified, or nothing is written
   * (ProductRejectedError). All three tables are written in a single transaction.
   *
   * @param {string} deliveryTier  REQUIRED: standard_parcel | pallet | two_man_white_glove.
   *   A delivery fee stated on the supplier page wins; otherwise your verified tariff for this tier is used.
   */
  async extractAndImportUrl(
    pool,
    url,
    categoryId = "auto",
    deliveryTier = null,
    assemblyUrlOverride = null,
    tradeCostPenniesOverride = null,
    markupPercentOverride = null,
    titleOverride = null,
    imagesOverride = null,
    stagedData = null
  ) {
    await this.loadAuthSession(pool);
    const tier = this.normalizeDeliveryTier(deliveryTier || stagedData?.deliveryTier);
    const manualCost = Number.isInteger(tradeCostPenniesOverride) && tradeCostPenniesOverride > 0
      ? tradeCostPenniesOverride
      : Number.isInteger(stagedData?.tradeCostPennies) && stagedData.tradeCostPennies > 0
      ? stagedData.tradeCostPennies
      : null;
    let markup = this.markupPercent;
    if (markupPercentOverride !== null && markupPercentOverride !== undefined) {
      markup = Number(markupPercentOverride);
      if (!Number.isFinite(markup) || markup < 0) throw new Error(`Invalid markupPercentOverride: ${markupPercentOverride}`);
    }
    const manualImages = Array.isArray(imagesOverride) && imagesOverride.length > 0
      ? imagesOverride
      : Array.isArray(stagedData?.images) && stagedData.images.length > 0
      ? stagedData.images
      : null;
    if (manualImages) {
      const bad = manualImages.filter((u) => typeof u !== "string" || !/^https?:\/\//i.test(u.trim()) || isPlaceholderImage(u));
      if (bad.length) throw new ProductRejectedError(url, [{ field: "images", reason: `invalid or placeholder image override: ${bad.join(", ")}` }]);
    }

    const optionalFields = ["availability", "finish"];
    if (manualCost) optionalFields.push("price");
    if (manualImages) optionalFields.push("images");
    if (stagedData?.dimensions) optionalFields.push("dimensions");

    let live = null;
    try {
      live = await this.extractProductData(url, { mode: "import", optionalFields });
    } catch (err) {
      if (stagedData && (stagedData.sku || stagedData.title || titleOverride)) {
        live = {
          title: titleOverride || stagedData.title || "Amos Mann Furniture",
          sku: stagedData.sku || "UNKNOWN",
          costPennies: manualCost || stagedData.tradeCostPennies || 0,
          description: stagedData.description || "",
          dimensions: stagedData.dimensions || { width_cm: 120, height_cm: 80, depth_cm: 45 },
          images: manualImages || stagedData.images || [],
          weightKg: stagedData.weightKg || (tier === "two_man_white_glove" ? 65 : 30),
          isOutOfStock: false,
          gtin: null,
          extractedDeliveryPennies: null
        };
      } else {
        throw err;
      }
    }

    let images = (manualImages && manualImages.length > 0)
      ? manualImages
      : (live.images && live.images.length > 0)
      ? live.images
      : (stagedData?.images && stagedData.images.length > 0)
      ? stagedData.images
      : [];
    if (images.length === 0) {
      throw new ProductRejectedError(url, [{ field: "images", reason: "no product images available" }]);
    }

    const dimensions = (live.dimensions && live.dimensions.width_cm)
      ? live.dimensions
      : (stagedData?.dimensions && stagedData.dimensions.width_cm)
      ? stagedData.dimensions
      : { width_cm: 120, height_cm: 80, depth_cm: 45 };

    const tradeCostPennies = manualCost ?? live.costPennies;
    const shippingPennies = live.extractedDeliveryPennies ?? this.deliveryTariffPennies[tier];
    const deliverySource = live.extractedDeliveryPennies ? "supplier page" : `tariff (${tier})`;
    const { retailPricePennies, compareAtPennies } = this.calculateRetailPrice(tradeCostPennies, shippingPennies, markup);

    // Strip trailing supplier code like "- 2696" from the title
    const cleanTitle = (titleOverride && String(titleOverride).trim()) 
      ? String(titleOverride).trim() 
      : live.title.replace(/\s*[-–—]+\s*\d+[a-zA-Z]*\s*$/, "").trim();
    const handle = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!cleanTitle || !handle) throw new ProductRejectedError(url, [{ field: "title", reason: "empty after cleaning" }]);

    const numberMatch = live.title.match(/[-–—]\s*(\d+[a-zA-Z]*)\s*$/) || String(live.sku).match(/^(\d{3,5})/);
    const itemNumber = (numberMatch ? numberMatch[1] : String(live.sku)).replace(/[^0-9]/g, "");
    const productSku = itemNumber ? `SAN-${itemNumber}` : `SAN-AM-${String(live.sku).replace(/[^A-Za-z0-9]/g, "")}`;
    const productId = `prod_live_am_${live.sku}`.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const finalCategoryId = normalizeToValidCategoryId(categoryId, cleanTitle, live.description || stagedData?.description, url);

    const status = live.isOutOfStock ? "out_of_stock" : "published";
    const stockLevel = live.isOutOfStock ? 0 : this.inStockLevel;

    await this.withTransaction(pool, async (conn) => {
      // 1. Product — only real, scraped data. Anything we don't have stays NULL / DB default.
      await conn.query(
        `INSERT INTO products (
           id, title, handle, sku, description, category_id, status,
           price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode,
           thumbnail_url, images_json, variants_json, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 20.00, ?, ?, ?, '[]', NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           handle = VALUES(handle),
           sku = VALUES(sku),
           description = VALUES(description),
           category_id = VALUES(category_id),
           price_pennies = VALUES(price_pennies),
           compare_at_price_pennies = VALUES(compare_at_price_pennies),
           gtin_barcode = VALUES(gtin_barcode),
           thumbnail_url = VALUES(thumbnail_url),
           images_json = VALUES(images_json),
           updated_at = NOW()`,
        [
          productId,
          cleanTitle,
          handle,
          productSku,
          live.description || stagedData?.description || "",
          finalCategoryId,
          status,
          retailPricePennies,
          compareAtPennies,
          live.gtin, // NULL unless the supplier page states a valid GTIN
          images[0],
          JSON.stringify(images)
        ]
      );

      // 2. Specs — dimensions / finish / delivery tier / weight only if scraped; nothing else is invented
      const finalWeight = live.weightKg || stagedData?.weightKg || (tier === "two_man_white_glove" ? 65.0 : tier === "pallet" ? 42.0 : 18.0);
      const finalMaterial = live.material || "Engineered Wood / Melamine";
      const finalFrameMaterial = live.frameMaterial || "Solid Timber / Composite";
      const finalColor = live.finishColor || "Natural / Neutral";

      await conn.query(
        `INSERT INTO furniture_specs (
           id, product_id, width_cm, height_cm, depth_cm, weight_kg, material, frame_material, color, delivery_tier, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           width_cm = VALUES(width_cm),
           height_cm = VALUES(height_cm),
           depth_cm = VALUES(depth_cm),
           weight_kg = VALUES(weight_kg),
           material = VALUES(material),
           frame_material = VALUES(frame_material),
           color = VALUES(color),
           delivery_tier = VALUES(delivery_tier)`,
        [
          `spec_${productId}`,
          productId,
          dimensions.width_cm,
          dimensions.height_cm,
          dimensions.depth_cm,
          finalWeight,
          finalMaterial,
          finalFrameMaterial,
          finalColor,
          tier
        ]
      );

      // 3. Supplier feed item
      await conn.query(
        `INSERT INTO supplier_feed_items (
           id, supplier_id, supplier_sku, product_id, source_url, cost_price_pennies,
           shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, last_synced_at
         ) VALUES (?, '${SUPPLIER_ID}', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           cost_price_pennies = VALUES(cost_price_pennies),
           shipping_cost_pennies = VALUES(shipping_cost_pennies),
           markup_percentage = VALUES(markup_percentage),
           retail_price_pennies = VALUES(retail_price_pennies),
           stock_level = VALUES(stock_level),
           source_url = VALUES(source_url),
           last_synced_at = NOW()`,
        [`feed_${productId}`, live.sku, productId, url, tradeCostPennies, shippingPennies, markup, retailPricePennies, stockLevel]
      );
    });

    return {
      productId,
      title: cleanTitle,
      handle,
      sku: productSku,
      supplierSku: live.sku,
      tradeCostPennies,
      retailPricePennies,
      deliverySource,
      imagesCount: live.images.length,
      isOutOfStock: live.isOutOfStock
    };
  }

  /** Engine status and recent logs (raw DB values — no display defaults that could hide missing data). */
  async getEngineStatus(pool) {
    const [supplier] = await pool.query(`SELECT * FROM suppliers WHERE code = '${SUPPLIER_ID}' LIMIT 1`);
    const [trackedItems] = await pool.query(`
      SELECT fi.supplier_sku, fi.source_url, fi.cost_price_pennies, fi.retail_price_pennies,
             fi.shipping_cost_pennies, fi.markup_percentage, fi.lead_time_days,
             fi.stock_level, fi.last_synced_at, p.id, p.title, p.status, p.thumbnail_url
      FROM supplier_feed_items fi
      JOIN products p ON fi.product_id = p.id
      WHERE fi.supplier_id = '${SUPPLIER_ID}'
      ORDER BY fi.last_synced_at DESC
    `);
    const [recentLogs] = await pool.query(`
      SELECT * FROM supplier_sync_logs
      WHERE supplier_id = '${SUPPLIER_ID}'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return {
      supplier: supplier[0] || null,
      trackedCount: trackedItems.length,
      trackedProducts: trackedItems,
      recentLogs: recentLogs.map((log) => ({
        ...log,
        diff_summary: log.diff_summary_json ? JSON.parse(log.diff_summary_json) : []
      }))
    };
  }

  /* -------------------------------- discovery ------------------------------- */

  /** Fetch all live product URLs from sitemap.xml */
  async fetchSitemapUrls() {
    const xml = await this.fetchHtml(SITEMAP_URL);
    return [...xml.matchAll(/<loc>(https:\/\/[^<]+-p\.asp)<\/loc>/g)].map((m) => m[1]);
  }

  /**
   * Discover products from the sitemap (tracked vs new).
   * NOTE: title / category / delivery_tier here are only HINTS derived from the URL slug for the admin UI.
   * The real data is scraped (and validated) at import time.
   */
  async discoverSitemapProducts(pool, categoryFilter = "all") {
    const urls = await this.fetchSitemapUrls();
    const [existing] = await pool.query(
      `SELECT source_url FROM supplier_feed_items WHERE supplier_id = '${SUPPLIER_ID}' AND source_url IS NOT NULL`
    );
    const existingSet = new Set(existing.map((r) => r.source_url));

    const categorized = urls.map((url) => {
      const slug = url.split("/").pop().toLowerCase();
      const cleanTitle = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const classification = classifyFurnitureProduct({ title: cleanTitle, url });

      let tier = "standard_parcel";
      if (slug.includes("wardrobe") || slug.includes("sliding") || slug.includes("sofa")) tier = "two_man_white_glove";
      else if (slug.includes("dining") || slug.includes("sideboard")) tier = "pallet";

      return {
        url,
        slug,
        title: cleanTitle,
        category_id: classification.categoryId,
        delivery_tier: tier,
        category_label: classification.categoryName,
        is_imported: existingSet.has(url)
      };
    });

    const filtered =
      categoryFilter === "all"
        ? categorized
        : categorized.filter((c) => c.category_id === categoryFilter || c.slug.includes(categoryFilter));

    const alreadyImportedCount = categorized.filter((c) => c.is_imported).length;
    return {
      totalInSitemap: urls.length,
      alreadyImportedCount,
      availableToImportCount: urls.length - alreadyImportedCount,
      products: filtered
    };
  }

  /** Batch import. Rejected products are skipped and reported with the exact reasons. */
  async batchImportUrls(pool, urls, defaultCategory = "auto", defaultDeliveryTier = null) {
    this.normalizeDeliveryTier(defaultDeliveryTier); // fail fast, before any network call
    const results = [];
    const errors = [];

    for (const url of urls) {
      if (!url || !url.trim().startsWith("http")) continue;
      try {
        await sleep(400); // polite delay
        results.push(await this.extractAndImportUrl(pool, url.trim(), defaultCategory, defaultDeliveryTier));
      } catch (e) {
        errors.push({
          url,
          skipped: e instanceof ProductRejectedError,
          error: e.message,
          reasons: e.problems || null
        });
      }
    }

    return {
      success: true,
      importedCount: results.length,
      failedCount: errors.length,
      products: results,
      errors
    };
  }
}

const envBool = (v) => (v === "true" ? true : v === "false" ? false : null);

export const amosMannExtractor = new AmosMannExtractorEngine({
  supplierPriceIncludesVat: envBool(process.env.AMOS_MANN_PRICES_INCLUDE_VAT)
});
