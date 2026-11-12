import { NextResponse } from "next/server";
import https from "node:https";
import { getDbPool } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth-token";
import { furnitureToGoExtractor } from "@/lib/dropship";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromRequest(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pool = getDbPool();

    const probe = new URL(request.url).searchParams.get("probe");
    if (probe) {
      await furnitureToGoExtractor.loadAuthSession(pool);
      const token = await (furnitureToGoExtractor as any).getOrRefreshApiToken();
      const sku = new URL(request.url).searchParams.get("sku") || "4023544";
      
      const results: any = { token: token ? "acquired" : "failed" };

      // 1. products-render-info
      const renderRes = await new Promise((resolve) => {
        const queryPath = `/rest/V1/products-render-info?searchCriteria[filterGroups][0][filters][0][field]=sku&searchCriteria[filterGroups][0][filters][0][value]=${encodeURIComponent(sku)}&searchCriteria[filterGroups][0][filters][0][conditionType]=eq&storeId=1&currencyCode=GBP`;
        const req = https.get({
          hostname: "furniture-to-go.co.uk",
          path: queryPath,
          headers: {
            "Authorization": `Bearer ${token}`,
            "User-Agent": (furnitureToGoExtractor as any).userAgent,
            "Accept": "application/json"
          },
          timeout: 10000
        }, (res) => {
          let b = "";
          res.on("data", c => b += c);
          res.on("end", () => {
            try { resolve(JSON.parse(b)); } catch { resolve(b.slice(0, 500)); }
          });
        });
        req.on("error", (e) => resolve({ error: e.message }));
      });
      results.renderInfo = renderRes;

      // 2. Test full B2B login and fetch authenticated product page
      const b2bLoginAndFetch = await new Promise((resolve) => {
        // Step A: Get form_key and initial PHPSESSID
        const req1 = https.get({
          hostname: "furniture-to-go.co.uk",
          path: "/customer/account/login/",
          headers: {
            "User-Agent": (furnitureToGoExtractor as any).userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          },
          timeout: 10000
        }, (res1) => {
          let b1 = "";
          res1.on("data", c => b1 += c);
          res1.on("end", () => {
            const formKeyMatch = b1.match(/name=["']form_key["'][^>]*value=["']([^"']+)["']/i) ||
                                 b1.match(/value=["']([^"']+)["'][^>]*name=["']form_key["']/i);
            const formKey = formKeyMatch ? formKeyMatch[1] : null;
            const cookies1 = (res1.headers["set-cookie"] || []).map(c => c.split(";")[0]).join("; ");

            if (!formKey) {
              return resolve({ step: "get_form_key", error: "form_key not found" });
            }

            // Step B: POST login
            const postData = new URLSearchParams({
              form_key: formKey,
              "login[username]": "arif@sanfurniture.com",
              "login[password]": "njaWt78ATtDm!brViHeMU"
            }).toString();

            const req2 = https.request({
              hostname: "furniture-to-go.co.uk",
              path: "/customer/account/loginPost/",
              method: "POST",
              headers: {
                "User-Agent": (furnitureToGoExtractor as any).userAgent,
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(postData),
                "Cookie": cookies1,
                "Referer": "https://furniture-to-go.co.uk/customer/account/login/",
                "Origin": "https://furniture-to-go.co.uk"
              },
              timeout: 15000
            }, (res2) => {
              let b2 = "";
              res2.on("data", c => b2 += c);
              res2.on("end", () => {
                const cookies2 = (res2.headers["set-cookie"] || []).map(c => c.split(";")[0]);
                const combinedCookies = [
                  ...cookies1.split("; ").filter(Boolean),
                  ...cookies2
                ].join("; ");

                // Step C: Fetch authenticated product page
                const req3 = https.get({
                  hostname: "furniture-to-go.co.uk",
                  path: "/chelsea-living-1-drawer-2-door-sideboard-in-white-gloss-with-an-oak-trim.html",
                  headers: {
                    "User-Agent": (furnitureToGoExtractor as any).userAgent,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "Cookie": combinedCookies,
                    "Referer": "https://furniture-to-go.co.uk/"
                  },
                  timeout: 15000
                }, (res3) => {
                  let b3 = "";
                  res3.on("data", c => b3 += c);
                  res3.on("end", () => {
                    const snippets = [];
                    const lowerB3 = b3.toLowerCase();
                    for (const term of ["5.41", "size:", "document", "instruction", "sideboard 109", "mageworx", "attachment", "4023544"]) {
                      let p = 0;
                      while ((p = lowerB3.indexOf(term, p)) !== -1) {
                        snippets.push({
                          term,
                          pos: p,
                          snippet: b3.slice(Math.max(0, p - 80), Math.min(b3.length, p + 180)).replace(/[\r\n]+/g, " ")
                        });
                        p += term.length + 50;
                        if (snippets.length > 25) break;
                      }
                      if (snippets.length > 25) break;
                    }

                    resolve({
                      loginStatus: res2.statusCode,
                      loginLocation: res2.headers["location"],
                      productPageLength: b3.length,
                      snippets
                    });
                  });
                });

                req3.on("error", (e) => resolve({ step: "fetch_product", error: e.message }));
              });
            });
            req2.on("error", (e) => resolve({ step: "login_post", error: e.message }));
            req2.write(postData);
            req2.end();
          });
        });
        req1.on("error", (e) => resolve({ step: "get_login_page", error: e.message }));
      });
      results.b2bLoginAndFetch = b2bLoginAndFetch;



      // 3. Test direct file / downloads controllers for 4023544
      const candidatePaths = [
        "/media/mageworx/downloads/attachment/4023544.pdf",
        "/media/mageworx/downloads/attachment/chelsea_4023544.pdf",
        "/media/downloads/4023544.pdf",
        "/downloads/attachment/download/id/288/",
        "/mageworx_downloads/attachment/download/id/288/",
        "/mageworx_downloads/attachment/file/id/288/",
        "/media/catalog/product/4/0/4023544_assembly.pdf",
        "/media/documents/4023544.pdf"
      ];
      const candidateStatuses: Record<string, any> = {};
      for (const p of candidatePaths) {
        candidateStatuses[p] = await new Promise((resolve) => {
          const req = https.request({
            hostname: "furniture-to-go.co.uk",
            path: p,
            method: "HEAD",
            headers: {
              "User-Agent": (furnitureToGoExtractor as any).userAgent,
              "Authorization": `Bearer ${token}`
            },
            timeout: 5000
          }, (res) => {
            resolve({ status: res.statusCode, contentType: res.headers["content-type"], length: res.headers["content-length"], location: res.headers["location"] });
          });
          req.on("error", (e) => resolve({ error: e.message }));
          req.end();
        });
      }
      results.candidateStatuses = candidateStatuses;

      return NextResponse.json({ success: true, probe: results });
    }

    const [items]: any = await pool.query(`
      SELECT fi.*, p.title, p.handle, p.thumbnail_url
      FROM supplier_feed_items fi
      JOIN products p ON fi.product_id = p.id
      WHERE fi.supplier_id = 'furniture_to_go'
      ORDER BY fi.stock_level DESC
    `).catch(() => [[]]);

    return NextResponse.json({
      supplier: "Furniture To Go (FTG)",
      hub: "Melksham, Wiltshire UK Distribution Centre",
      feedType: "B2B CSV / Direct DPD & 2-Man Dropship",
      leadTimeDays: 3,
      defaultDelivery: "DPD Express (<40kg) / 2-Man Room of Choice (>40kg)",
      activeSkus: items?.length || 0,
      items: items || [],
    });
  } catch (err: any) {
    console.error("[FTG Status Error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch Furniture To Go status" },
      { status: 500 }
    );
  }
}
