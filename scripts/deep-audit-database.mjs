import mysql from "mysql2/promise";

async function runAudit() {
  const conn = await mysql.createConnection("mysql://root:@127.0.0.1:3306/san_furniture");
  const issues = [];
  const warnings = [];
  const metrics = {};

  console.log("=================================================");
  console.log("   SAN FURNITURE: DEEP DATABASE AUDIT            ");
  console.log("=================================================");

  // 1. Products Audit
  const [products] = await conn.execute("SELECT * FROM products");
  metrics.totalProducts = products.length;

  const handleSet = new Set();
  const duplicateHandles = [];
  const bannedKeywords = [
    "furniture to go",
    "furnituretogo",
    "amos mann",
    "amosmann",
    "white glove",
    "2 man",
    "2-man",
    "san dedicated delivery fleet",
  ];

  let nullCategoryCount = 0;
  let invalidPriceCount = 0;
  let malformedImagesCount = 0;
  let bannedKeywordMatches = [];

  for (const p of products) {
    // Unique handle check
    if (handleSet.has(p.handle)) {
      duplicateHandles.push(p.handle);
    }
    handleSet.add(p.handle);

    // Category check
    if (!p.category_id) {
      nullCategoryCount++;
      issues.push(`Product #${p.id} (${p.title}) has NULL category_id`);
    }

    // Price check
    if (!Number.isInteger(p.price_pennies) || p.price_pennies <= 0) {
      invalidPriceCount++;
      issues.push(`Product #${p.id} (${p.title}) has invalid price_pennies: ${p.price_pennies}`);
    }

    // JSON checks
    if (p.images_json) {
      try {
        const imgs = typeof p.images_json === "string" ? JSON.parse(p.images_json) : p.images_json;
        if (!Array.isArray(imgs) || imgs.length === 0) {
          warnings.push(`Product #${p.id} (${p.handle}) has empty images array`);
        }
      } catch (e) {
        malformedImagesCount++;
        issues.push(`Product #${p.id} (${p.handle}) has invalid images_json: ${e.message}`);
      }
    } else {
      warnings.push(`Product #${p.id} (${p.handle}) has NULL images_json`);
    }

    // Banned keyword checks
    const fullText = `${p.title || ""} ${p.description || ""} ${p.subtitle || ""} ${p.handle || ""}`.toLowerCase();
    for (const kw of bannedKeywords) {
      if (fullText.includes(kw)) {
        bannedKeywordMatches.push({ id: p.id, handle: p.handle, keyword: kw });
      }
    }
  }

  if (duplicateHandles.length > 0) {
    issues.push(`Duplicate handles found: ${duplicateHandles.join(", ")}`);
  }

  // 2. Categories Audit
  const [categories] = await conn.execute("SELECT * FROM categories");
  metrics.totalCategories = categories.length;

  for (const c of categories) {
    const [pCount] = await conn.execute(
      "SELECT COUNT(*) as c FROM products WHERE category_id = ?",
      [c.id]
    );
    if (pCount[0].c === 0) {
      warnings.push(`Category '${c.name}' (${c.handle}) has 0 products`);
    }
  }

  // 3. Site Page Sections Audit
  const [sections] = await conn.execute("SELECT * FROM site_page_sections");
  metrics.totalSections = sections.length;

  let malformedSections = 0;
  let sectionBannedMatches = [];
  for (const s of sections) {
    try {
      const content = JSON.parse(s.content_json);
      const text = JSON.stringify(content).toLowerCase();
      for (const kw of bannedKeywords) {
        if (text.includes(kw)) {
          sectionBannedMatches.push({ sectionKey: s.section_key, keyword: kw });
        }
      }
    } catch (e) {
      malformedSections++;
      issues.push(`Section '${s.section_key}' has malformed JSON: ${e.message}`);
    }
  }

  // 4. Customer Addresses Audit
  const [addressCount] = await conn.execute("SELECT COUNT(*) as c FROM customer_addresses");
  metrics.totalCustomerAddresses = addressCount[0].c;

  // 5. Orders Audit
  const [orderCount] = await conn.execute("SELECT COUNT(*) as c FROM orders");
  metrics.totalOrders = orderCount[0].c;

  console.log("AUDIT METRICS:", metrics);
  console.log(`CRITICAL ISSUES (${issues.length}):`);
  issues.forEach((iss) => console.log("  [CRITICAL]", iss));

  console.log(`BANNED KEYWORD MATCHES (${bannedKeywordMatches.length + sectionBannedMatches.length}):`);
  bannedKeywordMatches.forEach((m) =>
    console.log(`  [BANNED IN PRODUCT #${m.id} / ${m.handle}]: "${m.keyword}"`)
  );
  sectionBannedMatches.forEach((m) =>
    console.log(`  [BANNED IN SECTION ${m.sectionKey}]: "${m.keyword}"`)
  );

  console.log(`WARNINGS (${warnings.length}):`);
  warnings.forEach((w) => console.log("  [WARNING]", w));

  await conn.end();
}

runAudit().catch(console.error);
