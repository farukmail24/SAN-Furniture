/**
 * SAN Furniture - Furniture To Go (FTG) Assembly Instructions Synchronization Service
 * 
 * Securely streams, extracts and indexes official assembly manuals (PDFs) from
 * the supplier B2B Dropbox repository into SAN Furniture's UK static assets directory,
 * mapping them directly to MySQL furniture_specs.assembly_instructions_url.
 */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DOCS_DIR = path.resolve(ROOT_DIR, "apps/storefront/public/documents/assembly");

// Supplier Dropbox Shared Link
const DROPBOX_SHARED_LINK = "https://www.dropbox.com/scl/fo/8qcrahcyse84f4075mntd/AOE38-nLR3MacO3t0v_avhU?rlkey=zvufk5975fdapbiyyt6vzgzxg&dl=1";

const DB_CONFIG = {
  host: "127.0.0.1",
  port: 3306,
  user: "root",
  password: "",
  database: "san_furniture",
};

/**
 * Ensure storage directory exists
 */
export function ensureDocsDir() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
  }
}

/**
 * Stream and extract specific target PDFs from the live Dropbox ZIP archive
 * @param {string[]} targetSkus - List of SKU substrings to search for (e.g. ['90A0000102468', '4029644'])
 * @param {number} maxScanMb - Max MB to stream before stopping (default 250 MB)
 * @returns {Promise<Map<string, string>>} - Map of sku -> local public URL path
 */
export async function streamExtractAssemblyPdfs(targetSkus, maxScanMb = 350) {
  ensureDocsDir();
  const cleanTargets = targetSkus.map(s => s.toLowerCase().trim()).filter(Boolean);
  const matchedFiles = new Map();

  if (cleanTargets.length === 0) {
    return matchedFiles;
  }

  console.log(`[AssemblySync] Resolving Dropbox stream for targets: [${cleanTargets.join(", ")}]...`);

  // Step 1: Follow redirects to obtain the raw storage streaming endpoint
  const streamUrl = await new Promise((resolve, reject) => {
    const req = https.get(DROPBOX_SHARED_LINK, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else if (res.statusCode === 200) {
        resolve(DROPBOX_SHARED_LINK);
      } else {
        reject(new Error(`Dropbox redirect returned status ${res.statusCode}`));
      }
      res.destroy();
    });
    req.on("error", reject);
  });

  console.log(`[AssemblySync] Connected to Dropbox cloud stream. Scanning entries...`);

  return new Promise((resolve) => {
    const req = https.get(streamUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
    }, (res) => {
      let buf = Buffer.alloc(0);
      let totalBytesScanned = 0;

      res.on("data", (chunk) => {
        totalBytesScanned += chunk.length;
        buf = Buffer.concat([buf, chunk]);

        // Search for local file header signatures 0x04034b50 (PK\x03\x04)
        let pos = 0;
        while (pos < buf.length - 30) {
          const idx = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), pos);
          if (idx === -1) {
            buf = buf.subarray(Math.max(0, buf.length - 4));
            break;
          }

          if (idx + 30 > buf.length) {
            buf = buf.subarray(idx);
            break;
          }

          const compMethod = buf.readUInt16LE(idx + 8);
          const fnLen = buf.readUInt16LE(idx + 26);
          const extraLen = buf.readUInt16LE(idx + 28);
          const headerEnd = idx + 30 + fnLen + extraLen;

          if (buf.length < headerEnd) {
            buf = buf.subarray(idx);
            break;
          }

          const rawName = buf.subarray(idx + 30, idx + 30 + fnLen).toString("utf8");
          const lowerName = rawName.toLowerCase();

          // Check if matches any of our target SKUs and is a PDF
          if (lowerName.endsWith(".pdf")) {
            const matchedTarget = cleanTargets.find(t => lowerName.includes(t));
            if (matchedTarget && !matchedFiles.has(matchedTarget)) {
              // Locate boundary of this file's compressed payload (next PK\x50\x4b or descriptor)
              const nextSig = buf.indexOf(Buffer.from([0x50, 0x4b]), headerEnd);
              if (nextSig !== -1) {
                const payload = buf.subarray(headerEnd, nextSig);
                try {
                  let decompressed = null;
                  if (compMethod === 8) {
                    decompressed = zlib.inflateRawSync(payload);
                  } else if (compMethod === 0) {
                    decompressed = payload;
                  }

                  if (decompressed && decompressed.subarray(0, 4).toString("ascii") === "%PDF") {
                    const cleanFilename = path.basename(rawName).replace(/[^a-zA-Z0-9_\-\.]/g, "_");
                    const targetPath = path.join(DOCS_DIR, cleanFilename);
                    fs.writeFileSync(targetPath, decompressed);

                    const publicUrl = `/documents/assembly/${cleanFilename}`;
                    matchedFiles.set(matchedTarget, publicUrl);
                    console.log(`✓ [SAVED] Extracted "${rawName}" -> ${publicUrl} (${(decompressed.length / 1024).toFixed(1)} KB)`);

                    if (matchedFiles.size >= cleanTargets.length) {
                      console.log(`All ${cleanTargets.length} target SKUs successfully extracted!`);
                      res.destroy();
                      resolve(matchedFiles);
                      return;
                    }
                  }
                } catch {
                  // If buffer was truncated on packet boundary, it will re-attempt on next chunk
                }
              }
            }
          }

          pos = headerEnd;
        }

        // Circuit breaker: limit scan size
        const scannedMb = totalBytesScanned / (1024 * 1024);
        if (scannedMb >= maxScanMb) {
          console.log(`[AssemblySync] Reached scan limit of ${maxScanMb}MB. Stopping stream.`);
          res.destroy();
          resolve(matchedFiles);
        }
      });

      res.on("end", () => {
        resolve(matchedFiles);
      });
    });

    req.on("error", (err) => {
      if (err.code !== "ECONNRESET") console.error("[AssemblySync Error]", err.message);
      resolve(matchedFiles);
    });
  });
}

/**
 * Links a local or remote assembly instruction URL to a product in the database
 */
export async function assignAssemblyUrlToProduct(productId, url) {
  const pool = mysql.createPool(DB_CONFIG);
  try {
    await pool.query(
      `UPDATE furniture_specs SET assembly_instructions_url = ?, assembly_required = 1 WHERE product_id = ?`,
      [url, productId]
    );
    console.log(`✓ Updated product "${productId}" with assembly URL: ${url}`);
  } finally {
    await pool.end();
  }
}

// CLI Execution Support
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const skuArg = args.find(a => a.startsWith("--sku="))?.split("=")[1];

  (async () => {
    const pool = mysql.createPool(DB_CONFIG);
    try {
      if (skuArg) {
        console.log(`Targeting single SKU: ${skuArg}`);
        const results = await streamExtractAssemblyPdfs([skuArg]);
        console.log("Extraction results:", Object.fromEntries(results));
      } else {
        // Query products that need assembly instructions
        const [rows] = await pool.query(`
          SELECT p.id, p.title, p.sku, sup.supplier_sku 
          FROM products p
          LEFT JOIN supplier_feed_items sup ON p.id = sup.product_id
          WHERE sup.supplier_id = 'furniture_to_go' OR p.id LIKE '%ftg%'
        `);
        console.log(`Found ${rows.length} FTG products to check for manuals.`);
        ensureDocsDir();
      }
    } finally {
      await pool.end();
    }
  })().catch(console.error);
}
