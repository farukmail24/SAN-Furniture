import https from "node:https";
import { classifyFurnitureProduct } from "@san-furniture/types";

/**
 * Furniture To Go (FTG) Dropship Reconciler Engine — STRICT MODE
 *
 * Crawls live product pages on https://furniture-to-go.co.uk/, validates what it finds,
 * applies the dropshipping margin + UK VAT formula and syncs the MySQL catalog.
 *
 * GOLDEN RULE: nothing is invented. If a required value cannot be read from the supplier
 * page (or is ambiguous / contradictory), the product is REJECTED with a
 * ProductRejectedError that lists every reason. No built-in catalog, no placeholder
 * (Unsplash) images, no default dimensions / weight / finish / SKU / GTIN / compliance flags.
 *
 * Config (all optional):
 *   FTG_PRICES_INCLUDE_VAT=true|false   -> does the price shown on the FTG page include 20% VAT?
 *                                          Only used when the page itself doesn't say.
 */

const SUPPLIER_ID = "furniture_to_go";
const SUPPLIER_BASE = "https://furniture-to-go.co.uk";
const SITEMAP_URL = `${SUPPLIER_BASE}/media/sitemap/sitemap_ftg.xml`;
const UK_VAT_MULTIPLIER = 1.2;
const MIN_DESCRIPTION_CHARS = 20;
const MAX_HTML_CHARS = 5_000_000;
const MAX_IMAGES = 10;
const CHALLENGE_RE = /anubis_challenge|making sure you(?:'|&#39;|’)re not a bot/i;

/**
 * The old hard-coded "curated" catalog (fake prices / sizes / Unsplash photos) has been removed.
 * Kept as an EMPTY export only so existing `import { FTG_CATALOG_DATABASE }` lines don't break.
 */
export const FTG_CATALOG_DATABASE = [];

/**
 * Fields that MUST be scraped from the supplier page, per mode.
 * If any of them is missing / ambiguous / invalid the product is skipped.
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

// Words used to pull the finish/colour text *exactly as written* from the product title (last resort).
const FINISH_WORDS = new Set([
  "white", "black", "grey", "gray", "cream", "ivory", "beige", "brown", "cashmere", "oak", "walnut", "ash",
  "pine", "beech", "cherry", "mahogany", "teak", "anthracite", "graphite", "charcoal", "taupe", "mocha",
  "navy", "blue", "green", "red", "pink", "gold", "silver", "chrome", "gloss", "matt", "matte", "mushroom",
  "stone", "truffle", "ebony", "espresso", "hickory", "maple", "birch", "concrete", "slate"
]);
const FINISH_MODIFIERS = new Set(["light", "dark", "pale", "deep", "soft", "high", "natural", "artisan", "rustic", "sonoma", "alpine"]);
const FINISH_CONNECTORS = new Set(["and", "&", "in", "effect", "finish", "look"]);
const FINISH_LEADING_TRIM = new Set(["and", "&", "in", "effect", "finish", "look"]);
const FINISH_TRAILING_TRIM = new Set(["and", "&", "in", "high"]);

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

/** The supplier's bot-protection challenge page was returned instead of the product page. */
export class BotChallengeError extends Error {
  constructor(url) {
    super(`Supplier bot-protection challenge page received for ${url} (page content not available)`);
    this.name = "BotChallengeError";
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
const isProvided = (v) => v !== null && v !== undefined && v !== "";
const isPlaceholderImage = (u) => /unsplash\.com|\/placeholder\/|placeholder\.(?:jpe?g|png|webp|gif)/i.test(String(u || ""));

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

/** Visible page text (scripts/styles removed) — used to read spec lines such as "Size in cm: W 50 x H 40 x D 41 cm". */
function visibleText(html) {
  return decodeEntities(
    html.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ");
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

/**
 * White-label title cleaning: strips supplier branding (FTG / Furniture To Go) from the title.
 */
function cleanProductTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== "string") return "";
  return rawTitle
    .trim()
    .replace(/^(?:FTG|Furniture\s+To\s+Go)[\s\-–—:]+/i, "")
    .replace(/[\s\-–—|]+(?:FTG|Furniture\s+To\s+Go)$/i, "")
    .replace(/\bFTG\b\s*/gi, "")
    .replace(/\s+/g, " ")
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

/** Pick THE product of this page (Product, or ItemPage.mainEntity). Several different products => reject. */
function pickProductNode(nodes, pageUrl) {
  const byKey = new Map();
  const consider = (p) => {
    const key = `${p.sku ?? ""}|${p.name ?? ""}|${p.url ?? p["@id"] ?? ""}`;
    if (!byKey.has(key)) byKey.set(key, p);
  };
  for (const n of nodes) {
    if (hasType(n, "Product")) consider(n);
    else if (n.mainEntity && typeof n.mainEntity === "object" && hasType(n.mainEntity, "Product")) consider(n.mainEntity);
  }
  const products = [...byKey.values()];
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
  return matching.length === 1 ? { node: matching[0] } : { error: `ambiguous: ${products.length} different Product blocks on the page` };
}

function flattenOffers(node) {
  return [].concat(node.offers || []).flatMap((o) => (o && typeof o === "object" ? (o.offers ? [].concat(o.offers) : [o]) : []));
}

/** Schema.org price. `missing: true` means "not there" (a fallback may be tried); otherwise it's a real contradiction. */
function readSchemaOffer(node) {
  const offers = flattenOffers(node);
  if (offers.length === 0) return { ok: false, missing: true, reason: "no offers found in Product schema" };
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
    return { ok: false, reason: "several offers with different prices (variants?) — can't tell which one is right" };
  }
  if (!first.pennies) return { ok: false, missing: true, reason: "price missing, zero, or not a clean amount in Product schema" };
  return { ok: true, ...first };
}

/**
 * Magento 2: the price box that belongs to THIS page's product (found via the add-to-cart form's product id),
 * so related/upsell products can never leak in. Returns { pennies } only if exactly one final price is found.
 */
function readMagentoMainPrice(html) {
  const idMatch =
    html.match(/<input[^>]*\bname=["']product["'][^>]*\bvalue=["'](\d+)["']/i) ||
    html.match(/<input[^>]*\bvalue=["'](\d+)["'][^>]*\bname=["']product["']/i);
  if (!idMatch) return null;
  const start = html.search(new RegExp(`data-price-box=["']product-id-${idMatch[1]}["']`, "i"));
  if (start < 0) return null;
  const nextRel = html.slice(start + 1, start + 3000).search(/data-price-box=/i);
  const block = html.slice(start, nextRel >= 0 ? start + 1 + nextRel : start + 3000);
  if (!/£|&pound;|GBP/i.test(block)) return null;
  const amounts = new Set();
  for (const tag of block.match(/<[^>]*data-price-amount=[^>]*>/gi) || []) {
    if (!/data-price-type=["']finalPrice["']/i.test(tag)) continue;
    const m = tag.match(/data-price-amount=["']([0-9.]+)["']/i);
    const pennies = m ? parseMoneyToPennies(m[1]) : null;
    if (pennies) amounts.add(pennies);
  }
  return amounts.size === 1 ? { pennies: [...amounts][0] } : null;
}

/** Prices the page itself exposes (meta / microdata / Magento data-price-amount) — used to cross-check. */
function collectHtmlPrices(html) {
  const prices = new Set();
  for (const tag of html.match(/<(?:meta|span|div|p|data|strong|b)\b[^>]*>/gi) || []) {
    let raw = null;
    if (/(?:itemprop|property|name)=["'](?:price|product:price:amount|og:price:amount)["']/i.test(tag)) {
      raw = (tag.match(/\b(?:content|value)=["']([^"']+)["']/i) || [])[1];
    } else if (/data-price-amount=/i.test(tag)) {
      raw = (tag.match(/data-price-amount=["']([0-9.]+)["']/i) || [])[1];
    }
    const pennies = raw ? parseMoneyToPennies(raw) : null;
    if (pennies) prices.add(pennies);
  }
  return prices;
}

/**
 * Product image candidates — ONLY from this product's own JSON-LD `image`, og:image / twitter:image
 * and its own Magento gallery config. Never a page-wide scan. Placeholders are dropped.
 */
function collectImageCandidates(node, html, pageUrl) {
  const out = [];
  const add = (v) => {
    if (!v) return;
    if (Array.isArray(v)) return v.forEach(add);
    if (typeof v === "object") return add(v.url || v.contentUrl);
    if (typeof v !== "string") return;
    try {
      const u = new URL(decodeEntities(v.trim()), pageUrl);
      if (u.protocol === "https:" && /\.(jpe?g|png|webp)$/i.test(u.pathname) && !isPlaceholderImage(u.toString())) {
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
    if (/(?:property|name)=["'](?:og:image|twitter:image)["']/i.test(tag)) add((tag.match(/content=["']([^"']+)["']/i) || [])[1]);
  }
  // Magento product gallery (belongs to this product only): ..."full":"https:\/\/host\/media\/catalog\/product\/a\/b\/c.jpg"...
  for (const m of html.matchAll(/"full"\s*:\s*"((?:\\.|[^"\\])*)"/g)) {
    try {
      const url = JSON.parse(`"${m[1]}"`);
      if (/\/media\/catalog\/product\//i.test(url)) add(url);
    } catch {
      /* ignore */
    }
  }
  return [...new Set(out)].slice(0, MAX_IMAGES * 2);
}

/** Magento "Additional Information" table: { "colour": Set("White"), ... } */
function readAttributeTable(html) {
  const attrs = {};
  for (const m of html.matchAll(/<th[^>]*class=["'][^"']*\blabel\b[^"']*["'][^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) {
    const label = normText(stripTags(decodeEntities(m[1])));
    const value = stripTags(decodeEntities(m[2])).replace(/\s+/g, " ").trim();
    if (label && value) (attrs[label] ||= new Set()).add(value);
  }
  return attrs;
}

/** First label (in priority order) that exists in the attribute table; must have exactly one distinct value. */
function pickAttribute(attrs, labels) {
  for (const label of labels) {
    const set = attrs[label];
    if (!set) continue;
    return set.size === 1 ? { value: [...set][0] } : { value: null, reason: `ambiguous "${label}" (${[...set].join(" | ")})` };
  }
  return { value: null, reason: null };
}

/**
 * Dimensions: needs a labelled W/H/D triple with ONE explicit unit, e.g.
 *   "Size in cm: W 50 x H 40.5 x D 41.9 cm" · "H 40.5 x W 50 x D 41.9 cm" · "W50cm x H40cm x D41cm"
 * Unlabelled "a x b x c" is never accepted (the order would be a guess). Several different sizes => ambiguous.
 */
function parseDimensions(text) {
  const t = String(text || "").replace(/[×✕]/g, "x");
  const NUM = "\\d+(?:\\.\\d+)?";
  const TOKEN = `\\b(?:height|width|depth|h|w|d)(?![a-z])\\s*[:=]?\\s*${NUM}\\s*(?:cm|mm)?`;
  const RUN = new RegExp(
    `(?:size\\s*(?:in\\s*)?(?:cm|mm)\\s*:?\\s*)?(?:${TOKEN}\\s*(?:x|\\*|,|/)?\\s*){2}${TOKEN}\\s*(?:cm|mm)?`,
    "gi"
  );
  const KEY = { h: "height_cm", height: "height_cm", w: "width_cm", width: "width_cm", d: "depth_cm", depth: "depth_cm" };
  const candidates = new Map();
  const issues = [];

  for (const m of t.matchAll(RUN)) {
    const units = new Set([...m[0].matchAll(/\b(cm|mm)\b/gi)].map((u) => u[1].toLowerCase()));
    if (units.size !== 1) {
      issues.push(`unit missing or mixed in "${m[0].trim()}"`);
      continue;
    }
    const unit = [...units][0];
    const dims = {};
    for (const part of m[0].matchAll(new RegExp(`\\b(height|width|depth|h|w|d)(?![a-z])\\s*[:=]?\\s*(${NUM})`, "gi"))) {
      const key = KEY[part[1].toLowerCase()];
      const num = parseFloat(part[2]);
      dims[key] = Math.round((unit === "mm" ? num / 10 : num) * 10) / 10;
    }
    if (dims.width_cm > 0 && dims.height_cm > 0 && dims.depth_cm > 0 && Object.keys(dims).length === 3) {
      candidates.set(`${dims.width_cm}|${dims.height_cm}|${dims.depth_cm}`, { width_cm: dims.width_cm, height_cm: dims.height_cm, depth_cm: dims.depth_cm });
    } else {
      issues.push(`incomplete size "${m[0].trim()}"`);
    }
  }

  if (candidates.size === 1) return { value: [...candidates.values()][0], problems: [] };
  if (candidates.size === 0) return { value: null, problems: issues.length ? issues : ["no labelled W x H x D size with unit found"] };
  return {
    value: null,
    problems: [`ambiguous sizes found: ${[...candidates.values()].map((d) => `W${d.width_cm} x H${d.height_cm} x D${d.depth_cm}`).join(" | ")}`]
  };
}

/** Optional: weight in kg, only if stated clearly (single distinct value). */
function parseWeightKg(text) {
  const vals = new Set();
  const add = (num, unit) => {
    const v = unit.toLowerCase() === "g" ? parseFloat(num) / 1000 : parseFloat(num);
    if (v > 0) vals.add(Math.round(v * 100) / 100);
  };
  for (const m of String(text || "").matchAll(/assembled\s+weight\s*\(\s*(kg|g)\s*\)\s*:?\s*(\d+(?:\.\d+)?)/gi)) add(m[2], m[1]);
  for (const m of String(text || "").matchAll(/(?<!max\s)(?<!maximum\s)(?<!shelf\s)\b(?:product\s+)?weight\s*:?\s*(\d+(?:\.\d+)?)\s*(kg|g)\b/gi)) add(m[1], m[2]);
  return vals.size === 1 ? [...vals][0] : null;
}

function weightFromSchema(w) {
  if (!w) return null;
  const unit = typeof w === "object" ? String(w.unitCode || w.unitText || "") : "";
  const num = typeof w === "object" ? parseFloat(w.value) : null;
  if (typeof w === "object" && num > 0 && /^(kgm|kg|kilogram)/i.test(unit)) return num;
  if (typeof w === "string") {
    const m = w.trim().match(/^(\d+(?:\.\d+)?)\s*kg$/i);
    if (m && parseFloat(m[1]) > 0) return parseFloat(m[1]);
  }
  return null;
}

/** Optional: the product's own assembly-manual link (FTG "mwdownloads" module). Exactly one distinct link or nothing. */
function parseAssemblyUrl(html) {
  const found = new Set();
  for (const m of html.matchAll(/(?:https?:\/\/[^\s"'<>]+?)?\/mwdownloads\/download\/link\/id\/\d+/gi)) {
    try {
      found.add(new URL(m[0], `${SUPPLIER_BASE}/`).toString());
    } catch {
      /* ignore */
    }
  }
  return found.size === 1 ? [...found][0] : null;
}

/** Finish/colour exactly as written in the title (last resort), e.g. "Cashmere & Artisan Oak Effect". */
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
  return {
    value: null,
    reason: unique.length === 0 ? "no colour/finish found in page attributes, schema or title" : `ambiguous finish in title (${unique.join(" | ")})`
  };
}

/* -------------------------------------------------------------------------- */
/*  Engine                                                                     */
/* -------------------------------------------------------------------------- */

export class FurnitureToGoExtractorEngine {
  /**
   * @param {object} [options]
   * @param {boolean|null} [options.supplierPriceIncludesVat] fallback when the page doesn't state VAT basis
   * @param {number} [options.markupPercent=40]               your margin
   * @param {number|null} [options.compareAtMultiplier=1.25]  null => no "compare at" price at all
   * @param {number} [options.maxPriceJumpPercent=35]         bigger supplier price moves are held for review (0 = off)
   * @param {number} [options.inStockLevel=25]                stock_level written for "in stock" (supplier gives no quantity)
   * @param {number} [options.carriagePennies=0]              FTG B2B policy: "Store and Home Delivery prices include delivery for most mainland areas"
   */
  constructor(options = {}) {
    // Existing crawler identities used to get past the supplier's challenge page (see notes in the hand-over message).
    this.userAgent = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
    this.fallbackUserAgent = "WhatsApp/2.21.12.21 A";
    this.supplierPriceIncludesVat = typeof options.supplierPriceIncludesVat === "boolean" ? options.supplierPriceIncludesVat : null;
    this.markupPercent = options.markupPercent ?? 40;
    this.compareAtMultiplier = options.compareAtMultiplier === undefined ? 1.25 : options.compareAtMultiplier;
    this.maxPriceJumpPercent = options.maxPriceJumpPercent ?? 35;
    this.inStockLevel = options.inStockLevel ?? 25;
    this.carriagePennies = options.carriagePennies ?? 0;
    this._sitemapCache = null;
    this._sitemapCacheTime = 0;
  }

  /* ------------------------------ networking ------------------------------ */

  /** Fetch a page; only HTTP 200 is accepted. Returns { html, finalUrl } (after redirects). */
  fetchPage(url, { userAgent = this.userAgent, redirectsLeft = 5 } = {}) {
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
            "User-Agent": userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9",
            "Cache-Control": "no-cache"
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
            return this.fetchPage(next, { userAgent, redirectsLeft: redirectsLeft - 1 }).then(resolve, reject);
          }
          res.setEncoding("utf8"); // keeps multi-byte chars like "£" intact across chunks
          let body = "";
          res.on("data", (chunk) => {
            body += chunk;
            if (body.length > MAX_HTML_CHARS) req.destroy(new Error(`Response too large: ${url}`));
          });
          res.on("end", async () => {
            if (CHALLENGE_RE.test(body)) {
              if (userAgent !== this.fallbackUserAgent) {
                try {
                  return resolve(await this.fetchPage(url, { userAgent: this.fallbackUserAgent, redirectsLeft }));
                } catch (err) {
                  return reject(err);
                }
              }
              return reject(new BotChallengeError(url)); // never parse a challenge page as if it were a product
            }
            if (status !== 200) return reject(new HttpStatusError(url, status));
            resolve({ html: body, finalUrl: target.toString() });
          });
          res.on("error", reject);
        }
      );
      req.on("error", reject);
      req.on("timeout", () => req.destroy(new Error(`Timeout connecting to ${url}`)));
    });
  }

  async fetchHtml(url, customUserAgent = null) {
    return (await this.fetchPage(url, { userAgent: customUserAgent || this.userAgent })).html;
  }

  /** True only if the URL really serves an image (HTTP 200 + image/* content-type, not a tiny placeholder). */
  probeImage(url) {
    return new Promise((resolve) => {
      let req;
      try {
        req = https.get(url, { headers: { "User-Agent": this.userAgent, "Accept": "image/*" }, timeout: 8000 }, (res) => {
          const length = Number(res.headers["content-length"]);
          const ok =
            res.statusCode === 200 &&
            /^image\//i.test(res.headers["content-type"] || "") &&
            !(Number.isFinite(length) && length > 0 && length < 1500);
          res.on("error", () => {});
          res.destroy();
          resolve(ok);
        });
      } catch {
        return resolve(false);
      }
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * Keep only images that really download. For Magento cache URLs (/media/catalog/product/cache/<hash>/...)
   * the master photo is tried first, then the cached variant — whichever actually exists.
   */
  async resolveImages(urls) {
    const list = urls.slice(0, MAX_IMAGES * 2);
    const resolved = await Promise.all(
      list.map(async (u) => {
        const master = u.replace(/\/media\/catalog\/product\/cache\/[a-f0-9]{32}\//, "/media/catalog/product/");
        if (master !== u && (await this.probeImage(master))) return master;
        return (await this.probeImage(u)) ? u : null;
      })
    );
    return [...new Set(resolved.filter(Boolean))].slice(0, MAX_IMAGES);
  }

  /* ------------------------------- extraction ------------------------------ */

  /** Price: Schema.org first, then THIS product's Magento price box; validated + cross-checked. */
  readPrice(node, html, fail) {
    const schema = readSchemaOffer(node);
    const magento = readMagentoMainPrice(html);
    let pennies;
    let vat = null;

    if (schema.ok) {
      if (schema.currency !== "GBP") {
        fail("price", `currency is "${schema.currency || "missing"}", expected GBP`);
        return null;
      }
      if (magento && magento.pennies !== schema.pennies) {
        fail("price", `schema price ${gbp(schema.pennies)} differs from the page's own product price ${gbp(magento.pennies)}`);
        return null;
      }
      pennies = schema.pennies;
      vat = schema.vat;
      const pagePrices = collectHtmlPrices(html);
      if (pagePrices.size > 0 && !pagePrices.has(pennies)) {
        fail("price", `schema price ${gbp(pennies)} not found among page prices (${[...pagePrices].map(gbp).join(", ")})`);
        return null;
      }
    } else if (schema.missing && magento) {
      pennies = magento.pennies; // schema has no usable price; the page's own product price box does
    } else {
      fail("price", schema.reason);
      return null;
    }

    // VAT basis must be explicit: from the page, or from your config. Never assumed.
    let includesVat = vat;
    if (includesVat === null) {
      includesVat = this.supplierPriceIncludesVat;
    } else if (this.supplierPriceIncludesVat !== null && this.supplierPriceIncludesVat !== includesVat) {
      fail("price", "VAT flag on the page conflicts with supplierPriceIncludesVat config");
      return null;
    }
    if (includesVat === null) {
      fail("price", "can't tell whether the supplier price includes VAT — set FTG_PRICES_INCLUDE_VAT=true|false");
      return null;
    }
    return {
      rawPennies: pennies,
      isVatIncluded: includesVat,
      costPennies: includesVat ? Math.round(pennies / UK_VAT_MULTIPLIER) : pennies
    };
  }

  /**
   * Strictly extract product data from a supplier page.
   * mode "import": every field in REQUIRED_FIELDS.import must be present.
   * mode "sync":   only title, sku, price, availability are required.
   * optionalFields: fields the caller supplies by hand (e.g. ["price"] when a manual trade cost is given).
   * Throws ProductRejectedError (with all reasons) if anything required is missing or doubtful.
   */
  async extractProductData(url, { mode = "import", verifyImages = mode === "import", optionalFields = [] } = {}) {
    if (!REQUIRED_FIELDS[mode]) throw new Error(`Unknown extraction mode "${mode}"`);
    const required = new Set(REQUIRED_FIELDS[mode].filter((f) => !optionalFields.includes(f)));
    const cleanUrl = String(url || "").trim();

    const { html, finalUrl } = await this.fetchPage(cleanUrl);
    if (pathOf(finalUrl) !== pathOf(cleanUrl)) {
      throw new ProductRejectedError(cleanUrl, [{ field: "url", reason: `supplier redirected to a different page (${finalUrl})` }]);
    }
    const picked = pickProductNode(collectJsonLdNodes(html), finalUrl);
    if (!picked.node) throw new ProductRejectedError(cleanUrl, [{ field: "schema", reason: picked.error }]);
    const node = picked.node;

    const problems = [];
    const fail = (field, reason) => problems.push({ field, reason });
    const text = visibleText(html);
    const attrs = readAttributeTable(html);

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
      if (!cleanProductTitle(title)) fail("title", "empty after removing supplier branding");
    }

    // 2. SKU (never fabricated)
    const rawSku = Array.isArray(node.sku) ? node.sku[0] : node.sku ?? node.productID;
    const sku = typeof rawSku === "string" || typeof rawSku === "number" ? String(rawSku).trim() : "";
    if (!sku) fail("sku", "missing in Product schema (sku / productID)");

    // 3. Price
    const price = this.readPrice(node, html, fail);

    // 4. Stock — only from the schema's explicit availability
    const offers = flattenOffers(node);
    const availKeys = [...new Set(offers.map((o) => String((o && o.availability) || "").split("/").pop().toLowerCase()))];
    let isOutOfStock = null;
    if (availKeys.length !== 1 || !availKeys[0]) fail("availability", "stock status missing or inconsistent between offers");
    else if (!(availKeys[0] in AVAILABILITY_IS_OUT_OF_STOCK)) fail("availability", `unrecognised availability "${availKeys[0]}"`);
    else isOutOfStock = AVAILABILITY_IS_OUT_OF_STOCK[availKeys[0]];

    // 5. Description (supplier text only — no generic filler)
    const description = cleanHtmlDescription(node.description);
    if (description.length < MIN_DESCRIPTION_CHARS) fail("description", "missing or too short in Product schema");

    // 6. Dimensions (no default sizes, ever)
    const dims = parseDimensions(`${description} ${text}`);
    if (!dims.value) fail("dimensions", dims.problems.join("; "));

    // 7. Finish / colour: page attribute table -> schema `color` -> title (verbatim)
    let finishColor = null;
    const fromTable = pickAttribute(attrs, ["colour", "color", "finish"]);
    const schemaColor = Array.isArray(node.color) ? node.color[0] : node.color;
    if (fromTable.value) {
      finishColor = fromTable.value;
    } else if (fromTable.reason) {
      fail("finish", fromTable.reason);
    } else if (typeof schemaColor === "string" && schemaColor.trim()) {
      finishColor = decodeEntities(schemaColor).trim();
    } else if (title) {
      const f = extractFinishFromTitle(title);
      finishColor = f.value;
      if (!f.value) fail("finish", f.reason);
    } else {
      fail("finish", "no title to read the finish from");
    }

    // 8. Images — this product's own schema / og / gallery only, then proven to be real images
    let images = collectImageCandidates(node, html, finalUrl);
    if (images.length === 0) {
      fail("images", "no product image found in Product schema, og:image or product gallery");
    } else if (verifyImages) {
      images = await this.resolveImages(images);
      if (images.length === 0) fail("images", "image URLs found, but none could be fetched as a valid image");
    }

    // 9. Optional extras: used only when the page states them clearly, otherwise left NULL
    const weightKg = weightFromSchema(node.weight) ?? parseWeightKg(text);
    const material = (pickAttribute(attrs, ["material"]).value) || null; // informational only, not stored
    const assemblyInstructionsUrl = parseAssemblyUrl(html);
    const rawGtin = String(node.gtin13 || node.gtin12 || node.gtin14 || node.gtin8 || node.gtin || "").replace(/\D/g, "");
    const gtin = [8, 12, 13, 14].includes(rawGtin.length) ? rawGtin : null;

    const blocking = problems.filter((p) => required.has(p.field));
    if (blocking.length) throw new ProductRejectedError(cleanUrl, blocking);

    return {
      title: title ? cleanProductTitle(title) : null,
      sku,
      costPennies: price ? price.costPennies : null, // supplier cost excl. VAT, in pennies
      priceGbp: price ? price.costPennies / 100 : null, // supplier cost excl. VAT
      rawPriceGbp: price ? price.rawPennies / 100 : null, // price exactly as shown by the supplier
      priceVerified: Boolean(price),
      isVatIncluded: price ? price.isVatIncluded : null,
      finishColor,
      material,
      isOutOfStock,
      description,
      dimensions: dims.value,
      weightKg,
      assemblyInstructionsUrl,
      gtin,
      images
    };
  }

  /** Dry run: what would be imported from this URL (or exactly why it would be skipped). Writes nothing. */
  async previewProduct(url, mode = "import") {
    try {
      return { ok: true, data: await this.extractProductData(url, { mode }) };
    } catch (err) {
      if (err instanceof ProductRejectedError) return { ok: false, reasons: err.problems };
      throw err;
    }
  }

  /* -------------------------------- pricing -------------------------------- */

  cleanProductTitle(rawTitle) {
    return cleanProductTitle(rawTitle);
  }

  cleanHtmlDescription(raw) {
    return cleanHtmlDescription(raw);
  }

  /**
   * Retail price (UK, incl. 20% VAT):
   *   (Trade Cost + Supplier Carriage) * (1 + Markup/100) * 1.20
   * All inputs are mandatory — no hidden defaults.
   */
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
    const t = String(tier || "").toLowerCase();
    if (t.includes("parcel")) return "standard_parcel";
    if (t.includes("pallet")) return "pallet";
    if (t === "two_man_white_glove" || t.includes("white")) return "two_man_white_glove";
    throw new Error(
      `deliveryTier is required: standard_parcel | pallet | two_man_white_glove (got "${tier ?? ""}"). It is no longer guessed.`
    );
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
   * (a timeout / challenge page / parse failure is NOT treated as "out of stock"). Only HTTP 404/410 hides a product.
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
    let manualsUpdated = 0;
    let imagesRepaired = 0;

    if (live) {
      if (live.sku !== String(item.supplier_sku).trim()) {
        throw new ProductRejectedError(item.source_url, [
          { field: "sku", reason: `page SKU "${live.sku}" doesn't match stored supplier SKU "${item.supplier_sku}"` }
        ]);
      }

      // Price — uses the markup & carriage STORED for this product (never a hard-coded one)
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
          notes.push(`Price changed: Cost ${gbp(oldCost)} -> ${gbp(newCost)}, Retail ${gbp(Number(item.price_pennies))} -> ${gbp(retailPricePennies)}`);
        }
      }

      // Images: replace placeholders (e.g. Unsplash) with verified supplier images; otherwise only add when MORE are found
      const currentImages = toArray(item.images_json);
      const placeholderInUse = !item.thumbnail_url || isPlaceholderImage(item.thumbnail_url) || currentImages.some(isPlaceholderImage);
      if (live.images.length > 0 && (placeholderInUse || live.images.length > currentImages.length)) {
        const verified = await this.resolveImages(live.images);
        if (verified.length > 0 && (placeholderInUse || verified.length > currentImages.length)) {
          ops.push([
            `UPDATE products SET images_json = ?, thumbnail_url = ?, updated_at = NOW() WHERE id = ?`,
            [JSON.stringify(verified), verified[0], item.product_id]
          ]);
          imagesRepaired = 1;
          notes.push(placeholderInUse ? `Placeholder image replaced with ${verified.length} supplier photo(s)` : `Images updated: ${verified.length} photos`);
        } else if (placeholderInUse) {
          notes.push("Placeholder image still in use — no valid supplier image could be fetched");
        }
      } else if (placeholderInUse) {
        notes.push("Placeholder image still in use — supplier page has no usable image");
      }

      // Assembly manual (only the product's own link; only when it changed)
      if (live.assemblyInstructionsUrl && live.assemblyInstructionsUrl !== item.current_assembly_url) {
        ops.push([`UPDATE furniture_specs SET assembly_instructions_url = ? WHERE product_id = ?`, [live.assemblyInstructionsUrl, item.product_id]]);
        manualsUpdated = 1;
        notes.push("Assembly manual link updated");
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
      changed: pricesUpdated > 0 || stockUpdated > 0 || manualsUpdated > 0 || imagesRepaired > 0,
      pricesUpdated,
      stockUpdated,
      manualsUpdated,
      imagesRepaired,
      details: notes.length ? notes.join(" | ") : "Synced, no change"
    };
  }

  /** Synchronize all tracked Furniture To Go products in MySQL. */
  async syncTrackedCatalog(pool, options = { triggerType: "manual" }) {
    // 0. White-label repair: supplier branding in titles of FTG products only
    let repairedTitlesCount = 0;
    try {
      const [legacyRows] = await pool.query(
        `SELECT p.id, p.title FROM products p
         JOIN supplier_feed_items fi ON fi.product_id = p.id
         WHERE fi.supplier_id = '${SUPPLIER_ID}'
           AND (p.title LIKE 'FTG %' OR p.title LIKE 'FTG-%' OR p.title LIKE 'Furniture To Go %')`
      );
      for (const lp of Array.isArray(legacyRows) ? legacyRows : []) {
        const newTitle = cleanProductTitle(lp.title);
        if (newTitle && newTitle !== lp.title) {
          const newHandle = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          await pool.query(`UPDATE products SET title = ?, handle = ?, updated_at = NOW() WHERE id = ?`, [newTitle, newHandle, lp.id]);
          repairedTitlesCount++;
        }
      }
    } catch (e) {
      console.warn("[FTG Title Cleanup Warning]:", e.message);
    }

    const [rows] = await pool.query(`
      SELECT fi.id as feed_item_id, fi.supplier_sku, fi.source_url, fi.cost_price_pennies,
             fi.shipping_cost_pennies, fi.markup_percentage, fi.retail_price_pennies,
             fi.stock_level, p.id as product_id, p.title, p.price_pennies, p.status,
             p.thumbnail_url, p.images_json, fs.assembly_instructions_url AS current_assembly_url
      FROM supplier_feed_items fi
      JOIN products p ON fi.product_id = p.id
      LEFT JOIN furniture_specs fs ON fs.product_id = p.id
      WHERE fi.supplier_id = '${SUPPLIER_ID}'
    `);

    let itemsScanned = 0;
    let itemsFailed = 0;
    let pricesUpdated = 0;
    let stockUpdated = 0;
    let manualsUpdated = 0;
    let imagesRepairedCount = 0;
    const diffs = [];

    for (const item of rows) {
      if (!item.source_url) continue;
      itemsScanned++;
      await sleep(250); // polite rate limit
      try {
        const r = await this.reconcileItem(pool, item);
        pricesUpdated += r.pricesUpdated;
        stockUpdated += r.stockUpdated;
        manualsUpdated += r.manualsUpdated;
        imagesRepairedCount += r.imagesRepaired;
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
        console.warn(`[FTG Sync] ${item.source_url}: ${err.message} — product left unchanged.`);
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

    // White-label compliance: purge supplier-branded Dropbox links from specs
    try {
      await pool.query(`UPDATE furniture_specs SET assembly_instructions_url = NULL WHERE assembly_instructions_url LIKE '%dropbox.com%'`);
    } catch (e) {
      console.warn("[FTG Dropbox Cleanup Warning]:", e.message);
    }

    await pool.query(`UPDATE suppliers SET last_sync_at = NOW() WHERE code = '${SUPPLIER_ID}'`);

    return {
      supplier: "Furniture To Go (Wiltshire, UK)",
      itemsScanned,
      itemsFailed,
      pricesUpdated,
      stockUpdated,
      manualsUpdated,
      repairedTitlesCount,
      imagesRepairedCount,
      diffs
    };
  }

  /* --------------------------------- import -------------------------------- */

  /**
   * Import ONE product. Either everything required is scraped and verified, or nothing is written
   * (ProductRejectedError). All tables are written in a single transaction.
   *
   * @param {string} deliveryTierOverride REQUIRED: standard_parcel | pallet | two_man_white_glove (no longer guessed).
   * Manual inputs from the admin UI are still honoured (they are human decisions, not engine guesses):
   *   tradeCostPenniesOverride, markupPercentOverride, titleOverride, assemblyUrlOverride, imagesOverride.
   *   Manual images must be https, not placeholders, and must really download.
   */
  async extractAndImportUrl(
    pool,
    url,
    categoryId = "auto",
    deliveryTierOverride = null,
    assemblyUrlOverride = null,
    tradeCostPenniesOverride = null,
    markupPercentOverride = null,
    titleOverride = null,
    imagesOverride = null
  ) {
    const cleanUrl = String(url || "").trim();
    const tier = this.normalizeDeliveryTier(deliveryTierOverride);

    let manualCost = null;
    if (isProvided(tradeCostPenniesOverride)) {
      manualCost = Number(tradeCostPenniesOverride);
      if (!Number.isFinite(manualCost) || manualCost <= 0) throw new Error(`Invalid tradeCostPenniesOverride: ${tradeCostPenniesOverride}`);
      manualCost = Math.round(manualCost);
    }
    let markup = this.markupPercent;
    if (isProvided(markupPercentOverride)) {
      markup = Number(markupPercentOverride);
      if (!Number.isFinite(markup) || markup < 0) throw new Error(`Invalid markupPercentOverride: ${markupPercentOverride}`);
    }
    const manualImages = Array.isArray(imagesOverride) && imagesOverride.length > 0 ? imagesOverride : null;
    if (manualImages) {
      const bad = manualImages.filter((u) => typeof u !== "string" || !/^https:\/\//i.test(u.trim()) || isPlaceholderImage(u));
      if (bad.length) throw new ProductRejectedError(cleanUrl, [{ field: "images", reason: `invalid or placeholder image override: ${bad.join(", ")}` }]);
    }

    const optionalFields = [];
    if (manualCost) optionalFields.push("price");
    if (manualImages) optionalFields.push("images");
    const live = await this.extractProductData(cleanUrl, { mode: "import", optionalFields });

    let images = live.images;
    if (manualImages) {
      const list = manualImages.map((u) => u.trim());
      const ok = await Promise.all(list.map((u) => this.probeImage(u)));
      const unreachable = list.filter((_, i) => !ok[i]);
      if (unreachable.length) throw new ProductRejectedError(cleanUrl, [{ field: "images", reason: `image override not downloadable: ${unreachable.join(", ")}` }]);
      images = list;
    }

    const tradeCostPennies = manualCost ?? live.costPennies;
    const priceSource = manualCost ? "manual override" : "supplier page";
    const { retailPricePennies, compareAtPennies } = this.calculateRetailPrice(tradeCostPennies, this.carriagePennies, markup);

    const cleanTitle = cleanProductTitle(isProvided(titleOverride) ? titleOverride : live.title);
    const handle = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!cleanTitle || !handle) throw new ProductRejectedError(cleanUrl, [{ field: "title", reason: "empty after cleaning" }]);

    const rawFtgSku = live.sku.replace(/^(FTG-|SAN-)/i, "");
    if (!rawFtgSku) throw new ProductRejectedError(cleanUrl, [{ field: "sku", reason: "empty after removing prefix" }]);
    const productSku = `SAN-${rawFtgSku}`;
    const productId = `prod_ftg_${live.sku.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    let finalCategoryId = categoryId;
    if (!finalCategoryId || finalCategoryId === "auto") {
      finalCategoryId = classifyFurnitureProduct({ title: cleanTitle, description: live.description, url: cleanUrl })?.categoryId;
    }
    if (!finalCategoryId) throw new ProductRejectedError(cleanUrl, [{ field: "category", reason: "could not classify the product" }]);

    const finalAssemblyUrl = isProvided(assemblyUrlOverride) && String(assemblyUrlOverride).trim()
      ? String(assemblyUrlOverride).trim()
      : live.assemblyInstructionsUrl || null;

    const status = live.isOutOfStock ? "out_of_stock" : "published";
    const stockLevel = live.isOutOfStock ? 0 : this.inStockLevel;

    await this.withTransaction(pool, async (conn) => {
      // 1. Product — only real, scraped (or admin-entered) data. Anything we don't have stays NULL / DB default.
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
          live.description,
          finalCategoryId,
          status,
          retailPricePennies,
          compareAtPennies,
          live.gtin, // NULL unless the supplier page states a valid GTIN
          images[0],
          JSON.stringify(images)
        ]
      );

      // 2. Specs — dimensions / finish / delivery tier / weight / manual link only if scraped; nothing else is invented
      await conn.query(
        `INSERT INTO furniture_specs (
           id, product_id, width_cm, height_cm, depth_cm, weight_kg, color,
           assembly_instructions_url, delivery_tier, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           width_cm = VALUES(width_cm),
           height_cm = VALUES(height_cm),
           depth_cm = VALUES(depth_cm),
           weight_kg = VALUES(weight_kg),
           color = VALUES(color),
           delivery_tier = VALUES(delivery_tier),
           assembly_instructions_url = COALESCE(VALUES(assembly_instructions_url), furniture_specs.assembly_instructions_url)`,
        [
          `spec_${productId}`,
          productId,
          live.dimensions.width_cm,
          live.dimensions.height_cm,
          live.dimensions.depth_cm,
          live.weightKg, // NULL unless stated on the supplier page
          live.finishColor,
          finalAssemblyUrl,
          tier
        ]
      );

      // 3. Supplier feed item
      await conn.query(
        `INSERT INTO supplier_feed_items (
           id, supplier_id, supplier_sku, product_id, cost_price_pennies,
           shipping_cost_pennies, markup_percentage, retail_price_pennies,
           stock_level, source_url, last_synced_at
         ) VALUES (?, '${SUPPLIER_ID}', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           cost_price_pennies = VALUES(cost_price_pennies),
           shipping_cost_pennies = VALUES(shipping_cost_pennies),
           markup_percentage = VALUES(markup_percentage),
           retail_price_pennies = VALUES(retail_price_pennies),
           stock_level = VALUES(stock_level),
           source_url = VALUES(source_url),
           last_synced_at = NOW()`,
        [
          `fi_ftg_${live.sku.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
          live.sku,
          productId,
          tradeCostPennies,
          this.carriagePennies,
          markup,
          retailPricePennies,
          stockLevel,
          cleanUrl
        ]
      );

      // 4. Supplier last_sync_at
      await conn.query(`UPDATE suppliers SET last_sync_at = NOW() WHERE code = '${SUPPLIER_ID}'`);
    });

    return {
      productId,
      title: cleanTitle,
      handle,
      sku: productSku,
      supplierSku: live.sku,
      tradeCostPennies,
      retailPricePennies,
      priceSource,
      deliveryTier: tier,
      imagesCount: images.length,
      isOutOfStock: live.isOutOfStock,
      url: cleanUrl
    };
  }

  /** Batch import. Rejected products are skipped and reported with the exact reasons. */
  async batchImportUrls(pool, urls, categoryId = "auto", deliveryTierOverride = null) {
    this.normalizeDeliveryTier(deliveryTierOverride); // fail fast, before any network call
    const products = [];
    const errors = [];

    for (const url of urls) {
      try {
        await sleep(200);
        products.push(await this.extractAndImportUrl(pool, url, categoryId, deliveryTierOverride));
      } catch (err) {
        errors.push({
          url,
          skipped: err instanceof ProductRejectedError,
          error: err.message,
          reasons: err.problems || null
        });
      }
    }

    return { importedCount: products.length, failedCount: errors.length, products, errors };
  }

  /* -------------------------------- discovery ------------------------------ */

  /** Product URLs from the official FTG sitemap. On failure this THROWS — there is no built-in fallback list. */
  async fetchSitemapUrls() {
    if (this._sitemapCache && Date.now() - this._sitemapCacheTime < 10 * 60 * 1000) return this._sitemapCache;

    const xml = await this.fetchHtml(SITEMAP_URL);
    const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

    const excludeSet = new Set([
      "bedrooms.html", "living-rooms.html", "dining.html", "home-office.html",
      "kids.html", "collections.html", "packages.html", "b2b-services.html",
      "sofas.html", "on-sale-and-end-of-line.html", "bathroom.html", "inspiration.html"
    ]);

    const productUrls = locMatches.filter((u) => {
      const match = u.match(/^https:\/\/furniture-to-go\.co\.uk\/([^/]+)\.html$/);
      return match ? !excludeSet.has(`${match[1]}.html`) : false;
    });

    this._sitemapCache = productUrls;
    this._sitemapCacheTime = Date.now();
    return productUrls;
  }

  /**
   * Discover FTG products from the live sitemap (tracked vs new).
   * NOTE: title / category / delivery_tier here are only HINTS derived from the URL slug for the admin UI.
   * The real data is scraped (and validated) at import time.
   */
  async discoverSitemapProducts(pool, categoryFilter = "all") {
    const urls = await this.fetchSitemapUrls();

    const [existingRows] = await pool.query(
      `SELECT fi.supplier_sku, fi.source_url, fi.product_id, p.title, p.price_pennies, p.status
       FROM supplier_feed_items fi
       JOIN products p ON fi.product_id = p.id
       WHERE fi.supplier_id = '${SUPPLIER_ID}'`
    );
    const existingByUrl = new Map(existingRows.map((r) => [(r.source_url || "").toLowerCase().trim(), r]));

    const categorized = urls.map((url) => {
      const slug = url.replace(`${SUPPLIER_BASE}/`, "").replace(".html", "").toLowerCase();
      const cleanTitle = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const classification = classifyFurnitureProduct({ title: cleanTitle, url });

      let tier = "standard_parcel";
      if (slug.includes("wardrobe") || slug.includes("4-door") || slug.includes("3-door") || slug.includes("sofa")) tier = "two_man_white_glove";
      else if (slug.includes("extending") || slug.includes("dining-table") || slug.includes("sideboard")) tier = "pallet";

      const existingMatch = existingByUrl.get(url.toLowerCase().trim());
      return {
        url,
        slug,
        title: cleanTitle,
        category_id: classification.categoryId,
        delivery_tier: tier,
        category_label: classification.categoryName,
        is_imported: Boolean(existingMatch),
        product_id: existingMatch ? existingMatch.product_id : null,
        current_retail_pennies: existingMatch ? existingMatch.price_pennies : null
      };
    });

    const filtered =
      categoryFilter === "all"
        ? categorized
        : categorized.filter(
            (c) =>
              c.category_id === categoryFilter ||
              c.slug.includes(categoryFilter.toLowerCase()) ||
              c.category_label.toLowerCase().includes(categoryFilter.toLowerCase())
          );

    const alreadyImportedCount = categorized.filter((c) => c.is_imported).length;
    return {
      supplier: "Furniture To Go (FTG Wiltshire UK)",
      totalInSitemap: urls.length,
      alreadyImportedCount,
      availableToImportCount: urls.length - alreadyImportedCount,
      products: filtered
    };
  }
}

const envBool = (v) => (v === "true" ? true : v === "false" ? false : null);

export const furnitureToGoExtractor = new FurnitureToGoExtractorEngine({
  supplierPriceIncludesVat: envBool(process.env.FTG_PRICES_INCLUDE_VAT)
});
