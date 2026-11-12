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

      // 2. Test fetching customer login page and ajax login from UK server
      const loginProbe = await new Promise((resolve) => {
        const req = https.get({
          hostname: "furniture-to-go.co.uk",
          path: "/customer/account/login/",
          headers: {
            "User-Agent": (furnitureToGoExtractor as any).userAgent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
          },
          timeout: 10000
        }, (res) => {
          let b = "";
          res.on("data", c => b += c);
          res.on("end", () => {
            const isAnubis = b.includes("Making sure you're not a bot") || b.includes("anubis");
            const formKeyMatch = b.match(/name=["']form_key["'][^>]*value=["']([^"']+)["']/i) ||
                                 b.match(/value=["']([^"']+)["'][^>]*name=["']form_key["']/i);
            const cookies = (res.headers["set-cookie"] || []).map(c => c.split(";")[0]);
            resolve({
              status: res.statusCode,
              isAnubis,
              htmlLength: b.length,
              formKey: formKeyMatch ? formKeyMatch[1] : null,
              cookies
            });
          });
        });
        req.on("error", (e) => resolve({ error: e.message }));
      });
      results.loginProbe = loginProbe;


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
