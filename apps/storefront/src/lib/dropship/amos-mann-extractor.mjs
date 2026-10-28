import https from "node:https";

/**
 * Amos Mann Automated Web Data Extraction & Dropship Reconciler Engine
 * Periodically crawls live product pages on https://www.amosmannfurniture.co.uk/,
 * extracts Schema.org JSON-LD data, checks stock signals, applies dropshipping margin
 * and UK VAT formulas, and synchronizes the MySQL catalog.
 */

export class AmosMannExtractorEngine {
  constructor() {
    this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
  }

  /**
   * Fetch raw HTML from Amos Mann product page
   */
  async fetchHtml(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const req = https.get(
        parsedUrl,
        {
          headers: {
            "User-Agent": this.userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9",
            "Cache-Control": "no-cache"
          },
          timeout: 10000
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return this.fetchHtml(res.headers.location).then(resolve).catch(reject);
          }
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      );

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error(`Connection timeout fetching ${url}`));
      });
    });
  }

  /**
   * Parse dimension string e.g. "H 90cm W 125cm D 40cm" or "Size W120cm, H200cm, D50cm"
   */
  parseDimensions(text) {
    const hMatch = text.match(/H\s*:?\s*([0-9.]+)\s*cm/i);
    const wMatch = text.match(/W\s*:?\s*([0-9.]+)\s*cm/i);
    const dMatch = text.match(/D\s*:?\s*([0-9.]+)\s*cm/i);

    if (hMatch || wMatch || dMatch) {
      return {
        height_cm: hMatch ? parseFloat(hMatch[1]) : 90,
        width_cm: wMatch ? parseFloat(wMatch[1]) : 125,
        depth_cm: dMatch ? parseFloat(dMatch[1]) : 40
      };
    }

    const legacyMatch = text.match(/Size\s*W([0-9.]+)\s*cm,\s*H([0-9.]+)\s*cm,\s*D([0-9.]+)\s*cm/i);
    if (legacyMatch) {
      return {
        width_cm: parseFloat(legacyMatch[1]),
        height_cm: parseFloat(legacyMatch[2]),
        depth_cm: parseFloat(legacyMatch[3])
      };
    }

    return { width_cm: 120, height_cm: 200, depth_cm: 60 };
  }

  /**
   * Clean and sanitize raw HTML descriptions into luxury typography & clean bullets
   */
  cleanHtmlDescription(raw) {
    if (!raw || typeof raw !== "string") return "";

    let text = raw;
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");
    text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");
    text = text.replace(/<([a-z]+)[^>]*>\s*<\/\1>/gi, "");

    text = text.replace(/<li[^>]*>(.*?)<\/li>/gis, (_, content) => {
      const cleanItem = content.replace(/<[^>]+>/g, "").trim();
      return cleanItem ? `\n• ${cleanItem}` : "";
    });

    text = text.replace(/<\/(p|div|h[1-6])>/gi, "\n\n");
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");

    text = text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line, i, arr) => line.length > 0 || (i > 0 && arr[i - 1].length > 0))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /**
   * Extract live product attributes directly from Amos Mann page HTML
   */
  async extractProductData(url) {
    const html = await this.fetchHtml(url);

    // 1. Extract Schema.org JSON-LD
    const jsonLdBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/gis) || [];
    let productSchema = null;

    for (const block of jsonLdBlocks) {
      const cleanJson = block.replace(/<\/?script[^>]*>/gi, "");
      try {
        const parsed = JSON.parse(cleanJson);
        if (parsed["@type"] === "Product") {
          productSchema = parsed;
          break;
        }
      } catch {}
    }

    if (!productSchema) {
      throw new Error(`Could not parse Schema.org Product data from ${url}`);
    }

    // 2. Extract Stock Availability
    const schemaAvailability = String(productSchema?.offers?.availability || "");
    const isOutOfStock =
      schemaAvailability.toLowerCase().includes("outofstock") ||
      schemaAvailability.toLowerCase().includes("soldout") ||
      schemaAvailability.toLowerCase().includes("discontinued") ||
      /<(?:span|div|p|button|input)[^>]*class=["'][^"']*(?:stock|avail|sold)[^"']*["'][^>]*>\s*(?:Out of Stock|Sold Out|Unavailable)/i.test(html) ||
      /<button[^>]*disabled[^>]*>[\s\S]*?(?:Out of Stock|Sold Out)/i.test(html) ||
      (/(?:Sold\s+Out|Out\s+of\s+Stock|Currently\s+Unavailable)/i.test(html) && !schemaAvailability.toLowerCase().includes("instock"));

    // 3. Extract High-Res CDN Images
    const imgMatches = html.match(/https:\/\/files\.ekmcdn\.com\/amosmann1\/images\/[^\s"'><]+/g) || [];
    const uniqueImages = [...new Set(imgMatches.map((img) => img.split("?")[0]))].filter((u) =>
      u.match(/\.(jpg|jpeg|png|webp)$/i)
    );

    const title = productSchema.name || "Amos Mann Furniture Item";
    const sku = Array.isArray(productSchema.sku) ? productSchema.sku[0] : (productSchema.sku || `AM-${Date.now()}`);
    
    // 4. Extract Trade Price - Check if supplier's Schema.org price is tax-inclusive
    let rawPriceGbp = parseFloat(productSchema.offers?.price) || 0;
    const isVatIncluded = productSchema.offers?.priceSpecification?.valueAddedTaxIncluded === true;
    const priceGbp = (isVatIncluded && rawPriceGbp > 0)
      ? Math.round((rawPriceGbp / 1.20) * 100) / 100
      : rawPriceGbp;

    const rawDescription = productSchema.description || "";
    const description = this.cleanHtmlDescription(rawDescription);
    const dims = this.parseDimensions(description);

    // 5. Extract Authentic Finish / Color from Title
    let finishColor = "Cashmere & Artisan Oak Effect";
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("cashmere") && lowerTitle.includes("oak")) {
      finishColor = "Cashmere & Artisan Oak Effect";
    } else if (lowerTitle.includes("alpine white")) {
      finishColor = "Alpine White";
    } else if (lowerTitle.includes("white gloss")) {
      finishColor = "White High Gloss";
    } else if (lowerTitle.includes("black")) {
      finishColor = "Black Matte";
    } else if (lowerTitle.includes("oak")) {
      finishColor = "Natural Artisan Oak";
    } else if (lowerTitle.includes("walnut")) {
      finishColor = "Rich Walnut Effect";
    } else {
      finishColor = "Standard Manufacturer Finish";
    }

    // 6. Extract Delivery Fee if explicitly mentioned in product HTML or description
    let extractedDeliveryPennies = null;
    const deliveryMatch = html.match(/(?:delivery|carriage|shipping)[\s:]*£\s*([0-9.]+)/i) ||
                          description.match(/(?:delivery|carriage|shipping)[\s:]*£\s*([0-9.]+)/i);
    if (deliveryMatch && parseFloat(deliveryMatch[1]) > 0) {
      extractedDeliveryPennies = Math.round(parseFloat(deliveryMatch[1]) * 100);
    }

    return {
      title: title.trim(),
      sku: String(sku).trim(),
      priceGbp,
      rawPriceGbp,
      isVatIncluded,
      finishColor,
      isOutOfStock,
      extractedDeliveryPennies,
      description: description.trim(),
      dimensions: dims,
      images: uniqueImages.length > 0 ? uniqueImages : (productSchema.image ? [productSchema.image] : [])
    };
  }

  /**
   * Compute UK Dropshipping Retail Price with 20% VAT
   * Landed Cost Formula: (Trade Cost + Supplier Carriage) * (1 + Markup/100) * 1.20 VAT
   * UK Mainland customers receive Free Delivery as carriage is pre-factored into retail price.
   */
  calculateRetailPrice(costPennies, shippingPennies = 1995, markupPercent = 40) {
    const landedCost = costPennies + (shippingPennies || 0);
    const netRetail = Math.round(landedCost * (1 + markupPercent / 100));
    const retailPricePennies = Math.round(netRetail * 1.20);
    const compareAtPennies = Math.round(retailPricePennies * 1.25);
    return { retailPricePennies, compareAtPennies, netRetail, landedCost };
  }

  /**
   * Synchronize all tracked Amos Mann products in the MySQL database
   */
  async syncTrackedCatalog(pool, options = { triggerType: "manual" }) {
    const startTime = Date.now();
    const triggerType = options.triggerType || "manual";

    // Fetch all active Amos Mann products currently in our catalog
    const [rows] = await pool.query(`
      SELECT fi.id as feed_item_id, fi.supplier_sku, fi.source_url, fi.cost_price_pennies,
             fi.shipping_cost_pennies, fi.markup_percentage, fi.retail_price_pennies,
             fi.stock_level, p.id as product_id, p.title, p.price_pennies, p.status, p.images_json
      FROM supplier_feed_items fi
      JOIN products p ON fi.product_id = p.id
      WHERE fi.supplier_id = 'amos_mann_furniture'
    `);

    let itemsScanned = 0;
    let pricesUpdated = 0;
    let stockUpdated = 0;
    const diffs = [];

    for (const item of rows) {
      if (!item.source_url) continue;

      itemsScanned++;
      try {
        // Rate-limiting delay of 300ms between calls
        await new Promise((r) => setTimeout(r, 300));

        const liveData = await this.extractProductData(item.source_url);
        const newCostPennies = Math.round(liveData.priceGbp * 100);
        const newStockLevel = liveData.isOutOfStock ? 0 : 25;
        const newStatus = liveData.isOutOfStock ? "out_of_stock" : "published";

        const shippingCost = item.shipping_cost_pennies || 3500;
        const markup = parseFloat(item.markup_percentage) || 45;

        let itemChanged = false;
        const changeNotes = [];

        // 1. Check for Price Change - incorporating supplier carriage into landed cost
        if (newCostPennies > 0 && Math.abs(newCostPennies - item.cost_price_pennies) > 0) {
          const carriage = item.shipping_cost_pennies !== null && item.shipping_cost_pennies !== undefined
            ? item.shipping_cost_pennies
            : 1995;
          const { retailPricePennies, compareAtPennies } = this.calculateRetailPrice(
            newCostPennies,
            carriage,
            markup || 40
          );

          await pool.query(
            `UPDATE products SET price_pennies = ?, compare_at_price_pennies = ?, updated_at = NOW() WHERE id = ?`,
            [retailPricePennies, compareAtPennies, item.product_id]
          );

          await pool.query(
            `UPDATE supplier_feed_items SET cost_price_pennies = ?, retail_price_pennies = ?, last_synced_at = NOW() WHERE id = ?`,
            [newCostPennies, retailPricePennies, item.feed_item_id]
          );

          pricesUpdated++;
          itemChanged = true;
          changeNotes.push(
            `Price changed: Cost £${(item.cost_price_pennies / 100).toFixed(2)} -> £${(newCostPennies / 100).toFixed(2)}, Retail £${(item.price_pennies / 100).toFixed(2)} -> £${(retailPricePennies / 100).toFixed(2)}`
          );
        }

        // 2. Check for Stock / Status Change & Auto-Hide on Storefront
        const isCurrentlyOutOfStock = item.status === "out_of_stock" || (item.stock_level ?? 25) === 0;
        if (liveData.isOutOfStock !== isCurrentlyOutOfStock || item.status !== newStatus) {
          await pool.query(`UPDATE products SET status = ?, updated_at = NOW() WHERE id = ?`, [
            newStatus,
            item.product_id
          ]);

          await pool.query(
            `UPDATE supplier_feed_items SET stock_level = ?, last_synced_at = NOW() WHERE id = ?`,
            [newStockLevel, item.feed_item_id]
          );

          stockUpdated++;
          itemChanged = true;
          changeNotes.push(
            liveData.isOutOfStock
              ? `Supplier Stock Out -> Product Auto-Hidden from live storefront (status: ${newStatus}, stock: 0)`
              : `Supplier Restocked -> Product Auto-Restored to live storefront (status: ${newStatus}, stock: ${newStockLevel})`
          );
        }

        // 3. Update images if more found
        if (liveData.images.length > 0) {
          const currentImages = item.images_json ? JSON.parse(item.images_json) : [];
          if (liveData.images.length > currentImages.length) {
            await pool.query(`UPDATE products SET images_json = ?, updated_at = NOW() WHERE id = ?`, [
              JSON.stringify(liveData.images),
              item.product_id
            ]);
            changeNotes.push(`Images updated: ${liveData.images.length} photos`);
            itemChanged = true;
          }
        }

        // Always touch last_synced_at
        await pool.query(`UPDATE supplier_feed_items SET last_synced_at = NOW() WHERE id = ?`, [item.feed_item_id]);

        diffs.push({
          sku: item.supplier_sku,
          title: item.title,
          sourceUrl: item.source_url,
          status: liveData.isOutOfStock ? "out_of_stock" : "in_stock",
          costGbp: (newCostPennies / 100).toFixed(2),
          changed: itemChanged,
          details: changeNotes.length > 0 ? changeNotes.join(" | ") : "Synced, no change"
        });
      } catch (err) {
        console.warn(`[Amos Mann Sync] Error scanning ${item.source_url}: ${err.message}. Marking out of stock.`);
        await pool.query(`UPDATE products SET status = 'out_of_stock', updated_at = NOW() WHERE id = ?`, [item.product_id]);
        await pool.query(`UPDATE supplier_feed_items SET stock_level = 0, last_synced_at = NOW() WHERE id = ?`, [item.feed_item_id]);
        stockUpdated++;
        diffs.push({
          sku: item.supplier_sku,
          title: item.title,
          sourceUrl: item.source_url,
          status: "out_of_stock",
          changed: true,
          details: `Supplier page inaccessible or unlisted (${err.message}) -> Auto-Hidden from storefront`
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const logId = `synclog_${Date.now()}`;

    // Record in supplier_sync_logs
    await pool.query(`
      INSERT INTO supplier_sync_logs (
        id, supplier_id, trigger_type, items_scanned, prices_updated, stock_updated,
        status, duration_ms, diff_summary_json, created_at
      ) VALUES (?, 'amos_mann_furniture', ?, ?, ?, ?, 'success', ?, ?, NOW())
    `, [
      logId,
      triggerType,
      itemsScanned,
      pricesUpdated,
      stockUpdated,
      durationMs,
      JSON.stringify(diffs)
    ]);

    // Update suppliers status
    await pool.query(`
      UPDATE suppliers
      SET last_sync_at = NOW(), sync_status = 'operational'
      WHERE code = 'amos_mann_furniture'
    `);

    // Audit log
    await pool.query(`
      INSERT INTO admin_audit_logs (id, actor, action, resource, details_json, ip_address, created_at)
      VALUES (?, 'system@sanfurniture.com', 'AMOS_MANN_AUTO_RECONCILE', 'dropship', ?, '127.0.0.1', NOW())
    `, [
      `log_${Date.now()}`,
      JSON.stringify({
        triggerType,
        itemsScanned,
        pricesUpdated,
        stockUpdated,
        durationMs
      })
    ]);

    return {
      success: true,
      logId,
      triggerType,
      itemsScanned,
      pricesUpdated,
      stockUpdated,
      durationMs,
      diffs
    };
  }

  /**
   * Auto-extract a brand new product from an Amos Mann URL and insert into SAN Furniture catalog
   */
  async extractAndImportUrl(pool, url, categoryId = "cat_beds", deliveryTier = "two_man_white_glove") {
    const liveData = await this.extractProductData(url);
    const tradeCostPennies = Math.round(liveData.priceGbp * 100);

    // Dynamic Delivery Tier & Shipping Cost Auto-Detection per product
    // Amos Mann verified tariff:
    // - Home Delivery to Customer (Standard Flatpack/Parcel): £19.95 (1995 pennies)
    // - Pallet to Home (Wardrobes, large multi-box heavy pieces): £69.00 (6900 pennies)
    let shippingPennies = liveData.extractedDeliveryPennies;
    let effectiveTier = deliveryTier;

    if (!shippingPennies) {
      const lower = (liveData.title + " " + (liveData.description || "")).toLowerCase();
      if (lower.includes("wardrobe") || lower.includes("sliding") || lower.includes("pallet") || (liveData.dimensions?.width_cm >= 160)) {
        effectiveTier = "two_man_white_glove";
        shippingPennies = 6900; // £69.00 Pallet to Home (Amos Mann verified tariff)
      } else {
        effectiveTier = "standard_parcel";
        shippingPennies = 1995; // £19.95 Standard Home Delivery to Customer (Amos Mann verified tariff)
      }
    }

    // Customer retail price incorporates Landed Cost (Trade Cost + Supplier Carriage):
    // Formula: (Trade Cost + Supplier Carriage) * (1 + Margin%) * 1.20 UK VAT
    // Storefront offers Free UK Mainland Delivery as shipping is pre-factored into retail price.
    const { retailPricePennies, compareAtPennies } = this.calculateRetailPrice(tradeCostPennies, shippingPennies, 40);

    // Clean Amos Mann title by removing trailing supplier code like "- 2696", "--- 2696"
    const rawNumberMatch = liveData.title.match(/[-–—]\s*(\d+[a-zA-Z]*)\s*$/) ||
                           String(liveData.sku).match(/^(\d{3,5})/);
    const itemNumber = rawNumberMatch ? rawNumberMatch[1].replace(/[^0-9]/g, "") : String(liveData.sku).replace(/[^0-9]/g, "");

    // Strip "- 2696" from product title
    const cleanTitle = liveData.title.replace(/\s*[-–—]+\s*\d+[a-zA-Z]*\s*$/, "").trim();

    // SAN Furniture SKU format: SAN-2696
    const productSku = itemNumber ? `SAN-${itemNumber}` : `SAN-AM-${liveData.sku}`;
    const handle = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const productId = `prod_live_am_${liveData.sku}`.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const primaryThumbnail = liveData.images[0] || "https://images.unsplash.com/photo-1595428774223-ef52624120d2";

    // 1. Insert Product
    await pool.query(`
      INSERT INTO products (
        id, title, handle, sku, subtitle, description, category_id, status,
        price_pennies, compare_at_price_pennies, vat_rate_percent, gtin_barcode,
        thumbnail_url, images_json, variants_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 20.00, ?, ?, ?, '[]', NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        handle = VALUES(handle),
        sku = VALUES(sku),
        price_pennies = VALUES(price_pennies),
        compare_at_price_pennies = VALUES(compare_at_price_pennies),
        images_json = VALUES(images_json),
        updated_at = NOW()
    `, [
      productId,
      cleanTitle,
      handle,
      productSku,
      "SAN Furniture Luxury Collection - Dispatch Time 2-7 Business Days",
      liveData.description,
      categoryId,
      liveData.isOutOfStock ? "out_of_stock" : "published",
      retailPricePennies,
      compareAtPennies,
      `50609128${String(liveData.sku).replace(/[^0-9]/g, "").padStart(5, "0")}`,
      primaryThumbnail,
      JSON.stringify(liveData.images)
    ]);

    // 2. Insert Specs
    const dbDeliveryTier = (effectiveTier === "standard_parcel" || effectiveTier.includes("parcel"))
      ? "standard_parcel"
      : (effectiveTier === "pallet" || effectiveTier.includes("pallet"))
      ? "pallet"
      : "two_man_white_glove";
    const estimatedWeight = dbDeliveryTier === "two_man_white_glove" ? 110 : (dbDeliveryTier === "pallet" ? 65 : 20);
    await pool.query(`
      INSERT INTO furniture_specs (
        id, product_id, width_cm, height_cm, depth_cm, weight_kg,
        material, frame_material, color, assembly_required,
        delivery_tier, fire_safety_compliant, fire_safety_standard, lead_time_days, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'engineered_hardwood', 'engineered_hardwood', ?, 1, ?, 1, 'UK Quality Checked', 5, NOW())
      ON DUPLICATE KEY UPDATE
        width_cm = VALUES(width_cm),
        height_cm = VALUES(height_cm),
        depth_cm = VALUES(depth_cm),
        delivery_tier = VALUES(delivery_tier),
        weight_kg = VALUES(weight_kg),
        color = VALUES(color)
    `, [
      `spec_${productId}`,
      productId,
      liveData.dimensions.width_cm,
      liveData.dimensions.height_cm,
      liveData.dimensions.depth_cm,
      estimatedWeight,
      liveData.finishColor || "Cashmere & Artisan Oak Effect",
      dbDeliveryTier
    ]);

    // 3. Insert Supplier Feed Item with source_url & extracted shipping cost
    await pool.query(`
      INSERT INTO supplier_feed_items (
        id, supplier_id, supplier_sku, product_id, source_url, cost_price_pennies,
        shipping_cost_pennies, markup_percentage, retail_price_pennies, stock_level, lead_time_days, last_synced_at
      ) VALUES (?, 'amos_mann_furniture', ?, ?, ?, ?, ?, 40.00, ?, ?, 5, NOW())
      ON DUPLICATE KEY UPDATE
        cost_price_pennies = VALUES(cost_price_pennies),
        shipping_cost_pennies = VALUES(shipping_cost_pennies),
        retail_price_pennies = VALUES(retail_price_pennies),
        source_url = VALUES(source_url),
        last_synced_at = NOW()
    `, [
      `feed_${productId}`,
      liveData.sku,
      productId,
      url,
      tradeCostPennies,
      shippingPennies,
      retailPricePennies,
      liveData.isOutOfStock ? 0 : 25
    ]);

    return {
      productId,
      title: cleanTitle,
      handle,
      sku: productSku,
      supplierSku: liveData.sku,
      tradeCostPennies,
      retailPricePennies,
      imagesCount: liveData.images.length,
      isOutOfStock: liveData.isOutOfStock
    };
  }

  /**
   * Get engine status and recent logs
   */
  async getEngineStatus(pool) {
    const [supplier] = await pool.query(
      `SELECT * FROM suppliers WHERE code = 'amos_mann_furniture' LIMIT 1`
    );
    const [trackedItems] = await pool.query(`
      SELECT fi.supplier_sku, fi.source_url, fi.cost_price_pennies, fi.retail_price_pennies,
             COALESCE(fi.shipping_cost_pennies, 1995) as shipping_cost_pennies,
             COALESCE(fi.markup_percentage, 40.00) as markup_percentage,
             COALESCE(fi.lead_time_days, 5) as lead_time_days,
             COALESCE(fi.stock_level, 25) as stock_level, fi.last_synced_at, p.id, p.title, p.status, p.thumbnail_url
      FROM supplier_feed_items fi
      JOIN products p ON fi.product_id = p.id
      WHERE fi.supplier_id = 'amos_mann_furniture'
      ORDER BY fi.last_synced_at DESC
    `);
    const [recentLogs] = await pool.query(`
      SELECT * FROM supplier_sync_logs
      WHERE supplier_id = 'amos_mann_furniture'
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

  /**
   * Fetch all live product URLs from sitemap.xml
   */
  async fetchSitemapUrls() {
    const xml = await this.fetchHtml("https://www.amosmannfurniture.co.uk/sitemap.xml");
    const matches = [...xml.matchAll(/<loc>(https:\/\/[^<]+-p\.asp)<\/loc>/g)].map(m => m[1]);
    return matches;
  }

  /**
   * Discover products from sitemap categorized and showing already tracked vs new
   */
  async discoverSitemapProducts(pool, categoryFilter = "all") {
    const urls = await this.fetchSitemapUrls();
    const [existing] = await pool.query(
      "SELECT source_url FROM supplier_feed_items WHERE supplier_id = 'amos_mann_furniture' AND source_url IS NOT NULL"
    );
    const existingSet = new Set(existing.map(r => r.source_url));

    const categorized = urls.map(url => {
      const slug = url.split("/").pop().toLowerCase();
      let cat = "cat_living";
      let tier = "pallet";
      let label = "Living & Storage";

      if (slug.includes("wardrobe") || slug.includes("sliding") || slug.includes("bed")) {
        cat = "cat_beds";
        tier = slug.includes("wardrobe") || slug.includes("sliding") ? "two_man_white_glove" : "standard_parcel";
        label = "Beds & Wardrobes";
      } else if (slug.includes("dining") || slug.includes("chair")) {
        cat = "cat_dining";
        tier = "pallet";
        label = "Dining";
      } else if (slug.includes("sofa") || slug.includes("couch")) {
        cat = "cat_sofas";
        tier = "two_man_white_glove";
        label = "Sofas";
      }

      return {
        url,
        slug,
        category_id: cat,
        delivery_tier: tier,
        category_label: label,
        is_imported: existingSet.has(url)
      };
    });

    const filtered = categoryFilter === "all"
      ? categorized
      : categorized.filter(c => c.category_id === categoryFilter || c.slug.includes(categoryFilter));

    return {
      totalInSitemap: urls.length,
      alreadyImportedCount: existingSet.size,
      availableToImportCount: urls.length - existingSet.size,
      products: filtered
    };
  }

  /**
   * Batch import multiple URLs
   */
  async batchImportUrls(pool, urls, defaultCategory = "cat_beds", defaultDeliveryTier = "two_man_white_glove") {
    const results = [];
    const errors = [];

    for (const url of urls) {
      if (!url || !url.trim().startsWith("http")) continue;
      try {
        await new Promise(r => setTimeout(r, 400)); // polite delay
        const imported = await this.extractAndImportUrl(pool, url.trim(), defaultCategory, defaultDeliveryTier);
        results.push(imported);
      } catch (e) {
        errors.push({ url, error: e.message });
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

export const amosMannExtractor = new AmosMannExtractorEngine();
