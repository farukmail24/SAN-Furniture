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

      // 1. GraphQL Product & Introspection query
      const gqlQuery = `query {
        products(filter: { sku: { eq: "${sku}" } }) {
          items {
            name
            sku
            description { html }
            short_description { html }
            ... on ProductInterface {
              name
            }
          }
        }
      }`;

      const gqlQueryWithAttachments = `query {
        products(filter: { sku: { eq: "${sku}" } }) {
          items {
            name
            sku
            mw_attachments {
              tab_title
              block_title
              items {
                id
                name
                description
                url
                size_str
              }
            }
          }
        }
      }`;

      const runGql = (queryStr: string) => new Promise((resolve) => {
        const payload = JSON.stringify({ query: queryStr });
        const req = https.request({
          hostname: "furniture-to-go.co.uk",
          path: "/graphql",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
            "User-Agent": (furnitureToGoExtractor as any).userAgent,
            "Accept": "application/json"
          },
          timeout: 10000
        }, (res) => {
          let b = "";
          res.on("data", c => b += c);
          res.on("end", () => {
            try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, raw: b.slice(0, 500) }); }
          });
        });
        req.on("error", (e) => resolve({ error: e.message }));
        req.write(payload);
        req.end();
      });

      results.gqlAttachments = await runGql(gqlQueryWithAttachments);
      if ((results.gqlAttachments as any)?.data?.errors || !(results.gqlAttachments as any)?.data?.data) {
        results.gqlBasic = await runGql(gqlQuery);
      }

      // Also introspect for attachment types
      const introspectionQuery = `query {
        __type(name: "ProductInterface") {
          fields {
            name
            type { name kind }
          }
        }
      }`;
      const introRes: any = await runGql(introspectionQuery);
      if (introRes?.data?.data?.__type?.fields) {
        results.productInterfaceAttachmentFields = introRes.data.data.__type.fields.filter((f: any) => 
          f.name.toLowerCase().includes("attach") || 
          f.name.toLowerCase().includes("download") || 
          f.name.toLowerCase().includes("doc") || 
          f.name.toLowerCase().includes("file") || 
          f.name.toLowerCase().includes("manual") ||
          f.name.toLowerCase().includes("instruction") ||
          f.name.toLowerCase().includes("mw_")
        );
      } else {
        results.introRaw = introRes;
      }

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
                  res3.on("end", async () => {
                    // Step D: Call customer/section/load with combinedCookies
                    const sectionDataRes = await new Promise((resolve) => {
                      const req4 = https.get({
                        hostname: "furniture-to-go.co.uk",
                        path: "/customer/section/load/?sections=",
                        headers: {
                          "User-Agent": (furnitureToGoExtractor as any).userAgent,
                          "Cookie": combinedCookies,
                          "X-Requested-With": "XMLHttpRequest",
                          "Accept": "application/json, text/javascript, */*; q=0.01",
                          "Referer": "https://furniture-to-go.co.uk/chelsea-living-1-drawer-2-door-sideboard-in-white-gloss-with-an-oak-trim.html"
                        },
                        timeout: 15000
                      }, (res4) => {
                        let b4 = "";
                        res4.on("data", c => b4 += c);
                        res4.on("end", () => {
                          try {
                            const j = JSON.parse(b4);
                            resolve({ status: res4.statusCode, sectionKeys: Object.keys(j), data: j });
                          } catch {
                            resolve({ status: res4.statusCode, raw: b4.slice(0, 500) });
                          }
                        });
                      });
                      req4.on("error", (e) => resolve({ error: e.message }));
                    });

                    // Analyze b3 HTML for download/assembly/pdf
                    const pdfMatches = Array.from(new Set(b3.match(/https?:\/\/[^\s"'<>]+\.pdf[^\s"'<>]*|\/[^\s"'<>]+\.pdf[^\s"'<>]*/gi) || []));
                    const mageworxMatches = Array.from(new Set(b3.match(/https?:\/\/[^\s"'<>]*(?:mageworx|attachment|downloads?)[^\s"'<>]*|\/[^\s"'<>]*(?:mageworx|attachment|downloads?)[^\s"'<>]*/gi) || []));
                    const has541 = b3.includes("5.41");
                    const hasAssembly = b3.toLowerCase().includes("assembly");
                    const hasDownloadDocs = b3.toLowerCase().includes("download documents");

                    // Find context around "4023544"
                    const skuSnippets: string[] = [];
                    let idx = 0;
                    while ((idx = b3.indexOf("4023544", idx)) !== -1 && skuSnippets.length < 10) {
                      skuSnippets.push(b3.slice(Math.max(0, idx - 100), Math.min(b3.length, idx + 150)).replace(/\s+/g, " "));
                      idx += 7;
                    }

                    // Find context around "Download documents" or "5.41" if found
                    const docSnippets: string[] = [];
                    if (has541) {
                      const pos = b3.indexOf("5.41");
                      docSnippets.push(b3.slice(Math.max(0, pos - 200), Math.min(b3.length, pos + 200)).replace(/\s+/g, " "));
                    }

                    // Extract snippet around "boxesOpen" and following 3000 characters!
                    let boxesSnippet = "";
                    const boxesIdx = b3.indexOf("boxesOpen");
                    if (boxesIdx !== -1) {
                      boxesSnippet = b3.slice(boxesIdx, boxesIdx + 4000);
                    } else {
                      const specIdx = b3.toLowerCase().indexOf("product specifications");
                      if (specIdx !== -1) {
                        boxesSnippet = b3.slice(specIdx, specIdx + 4000);
                      }
                    }

                    // Also check for any mentions of "attachment" or "download" in full b3
                    const allHrefMatches: string[] = [];
                    for (const m of b3.matchAll(/href=["']([^"']+)["']/gi)) {
                      const h = m[1];
                      if (h.includes("download") || h.includes("attach") || h.includes("doc") || h.includes("pdf") || h.includes("file") || h.includes("manual") || h.includes("instruct")) {
                        allHrefMatches.push(h);
                      }
                    }

                    // Save b3 to public/documents/ftg_product.html for full inspection
                    const fs = await import("node:fs");
                    const path = await import("node:path");
                    const savePaths = [
                      path.join(process.cwd(), "apps/storefront/public/documents/ftg_product.html"),
                      path.join(process.cwd(), "public/documents/ftg_product.html"),
                      "/home/sansoft/sanfurniture.com/apps/storefront/public/documents/ftg_product.html",
                      "/home/sansoft/sanfurniture.com/public/documents/ftg_product.html"
                    ];
                    let fileSaved = false;
                    for (const sp of savePaths) {
                      try {
                        fs.mkdirSync(path.dirname(sp), { recursive: true });
                        fs.writeFileSync(sp, b3, "utf8");
                        fileSaved = true;
                      } catch {}
                    }

                    // Step E: Fetch /b2b-services/images-and-data-to-download.html
                    const b2bDocsRes = await new Promise((resolve) => {
                      const reqB2b = https.get({
                        hostname: "furniture-to-go.co.uk",
                        path: "/b2b-services/images-and-data-to-download.html",
                        headers: {
                          "User-Agent": (furnitureToGoExtractor as any).userAgent,
                          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                          "Cookie": combinedCookies,
                          "Referer": "https://furniture-to-go.co.uk/"
                        },
                        timeout: 15000
                      }, (resB) => {
                        let bB = "";
                        resB.on("data", c => bB += c);
                        resB.on("end", () => {
                          const links: string[] = [];
                          for (const m of bB.matchAll(/href=["']([^"']+)["']/gi)) {
                            const l = m[1];
                            if (l.includes("dropbox") || l.includes("drive.google") || l.includes("box.com") || l.includes("media") || l.includes("pdf") || l.includes("download") || l.includes("instruction") || l.includes("assembly")) {
                              links.push(l);
                            }
                          }
                          resolve({
                            status: resB.statusCode,
                            length: bB.length,
                            hasChelsea: bB.toLowerCase().includes("chelsea"),
                            has4023544: bB.includes("4023544"),
                            links: Array.from(new Set(links)).slice(0, 30)
                          });
                        });
                      });
                      reqB2b.on("error", (e) => resolve({ error: e.message }));
                    });

                    resolve({
                      loginStatus: res2.statusCode,
                      loginLocation: res2.headers["location"],
                      productPageStatus: res3.statusCode,
                      productPageLength: b3.length,
                      b2bDocsRes,
                      fileSaved,
                      headings: (b3.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi) || []).map(h => h.replace(/<[^>]+>/g, "").trim()).filter(Boolean)
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
