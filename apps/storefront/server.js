/**
 * SAN Furniture - Production Server Entry Point for cPanel (Phusion Passenger / Custom Node Server)
 * Compatible with cPanel "Setup Node.js App"
 *
 * UNIFIED ZERO-CONFIG ENGINE:
 * Automatically supervises and spawns the Commerce Backend on port 9000
 * so the entire full-stack platform runs seamlessly from a SINGLE cPanel Node.js App!
 * No PM2, terminal management, or multi-app hassle required.
 */
const Module = require("node:module");
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const { parse } = require("node:url");
const { fork } = require("node:child_process");

// 0. Preserve hosting environment port (e.g. Phusion Passenger socket) before loading any .env
const passengerPort = process.env.PORT;

// Load environment variables across common monorepo deployment paths
try {
  const dotenv = require("dotenv");
  const envCandidates = [
    path.join(__dirname, ".env"),
    path.join(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../backend/.env"),
  ];
  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
    }
  }
} catch {}

// 1. Intercept TypeScript module resolution at Node.js CJS layer
// Prevents runtime MODULE_NOT_FOUND errors without requiring the 70MB+ typescript package on cPanel
const originalResolveFilename = Module._resolveFilename;
const stubPath = path.resolve(__dirname, "typescript-stub.js");

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === "typescript" || request.startsWith("typescript/")) {
    return stubPath;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// 2. Ensure node_modules links and @san-furniture/types package exist so monorepo resolves cleanly
function ensureSanTypesPkg() {
  const typesPkgDist = path.resolve(__dirname, "../../packages/types/dist");
  const typesPkgJson = path.resolve(__dirname, "../../packages/types/package.json");
  if (!fs.existsSync(typesPkgDist)) return;

  const targetDirs = [
    path.resolve(__dirname, "node_modules/@san-furniture/types"),
    path.resolve(__dirname, "../backend/node_modules/@san-furniture/types"),
    path.resolve(__dirname, "../../node_modules/@san-furniture/types"),
  ];

  for (const tDir of targetDirs) {
    try {
      fs.mkdirSync(tDir, { recursive: true });
      fs.cpSync(typesPkgDist, path.join(tDir, "dist"), { recursive: true });
      fs.copyFileSync(typesPkgJson, path.join(tDir, "package.json"));
    } catch {}
  }
}

function ensureModuleLinks() {
  const localModules = path.join(__dirname, "node_modules");
  if (!fs.existsSync(localModules)) return;

  const linkTargets = [
    path.resolve(__dirname, "../backend/node_modules"),
    path.resolve(__dirname, "../../node_modules"),
    path.resolve(__dirname, "../node_modules"),
    path.resolve(__dirname, "../../packages/types/node_modules"),
  ];

  for (const target of linkTargets) {
    let exists = false;
    try {
      const stat = fs.lstatSync(target);
      exists = true;
    } catch {}

    if (!exists) {
      try {
        const targetParent = path.dirname(target);
        if (fs.existsSync(targetParent)) {
          fs.symlinkSync(localModules, target, "junction");
          console.log(`> Linked node_modules to: ${target}`);
        }
      } catch (err) {
        // Silently continue if symlinks aren't permitted
      }
    }
  }
}
try {
  ensureModuleLinks();
  ensureSanTypesPkg();
} catch {}

// 3. Neutralize any residual next.config.ts files on disk
const tsConfigPaths = [
  path.join(__dirname, "next.config.ts"),
  path.resolve(__dirname, "../../next.config.ts"),
  path.resolve(process.cwd(), "next.config.ts"),
  path.resolve(process.cwd(), "apps/storefront/next.config.ts"),
];

for (const tsPath of tsConfigPaths) {
  if (fs.existsSync(tsPath)) {
    try {
      fs.unlinkSync(tsPath);
      console.log(`> Auto-deleted obsolete file: ${tsPath}`);
    } catch {
      try {
        fs.writeFileSync(tsPath, 'module.exports = require("./next.config.js");\n', "utf8");
        console.log(`> Neutralized legacy config file: ${tsPath}`);
      } catch {}
    }
  }
}

// 4. Ensure next.config.js exists at runtime cwd if different from __dirname
try {
  const rootConfig = path.resolve(process.cwd(), "next.config.js");
  const localConfig = path.join(__dirname, "next.config.js");
  if (process.cwd() !== __dirname && fs.existsSync(localConfig) && !fs.existsSync(rootConfig)) {
    fs.copyFileSync(localConfig, rootConfig);
  }
} catch {}

const next = require("next");

// Force production mode for cPanel deployment stability & zero memory spikes
process.env.NODE_ENV = "production";
const dev = false;
// Determine Storefront listening target:
// In cPanel Phusion Passenger, process.env.PORT is provided as a Unix socket path or assigned port.
// We must NEVER allow PORT=9000 (from .env intended for backend) to collide with Storefront!
let port = passengerPort || process.env.STOREFRONT_PORT || process.env.PORT || 3000;
if (port === "9000" || port === 9000) {
  port = process.env.STOREFRONT_PORT || 3000;
}

// Find backend entry file across common deployment folder structures
function findBackendEntry() {
  const candidates = [
    path.resolve(__dirname, "../backend/src/server.mjs"),
    path.resolve(__dirname, "apps/backend/src/server.mjs"),
    path.resolve(__dirname, "../../apps/backend/src/server.mjs"),
    path.resolve(process.cwd(), "apps/backend/src/server.mjs"),
    path.resolve(process.cwd(), "../backend/src/server.mjs"),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

// Kill any stale process listening on a port to guarantee fresh code execution
function killProcessOnPort(targetPort = 9000) {
  try {
    const { execSync } = require("node:child_process");
    if (process.platform === "win32") {
      try {
        const cmd = `for /f "tokens=5" %a in ('netstat -aon ^| findstr :${targetPort} ^| findstr LISTENING') do taskkill /F /PID %a`;
        execSync(cmd, { stdio: "ignore", shell: true, timeout: 1500 });
      } catch {}
    } else {
      try {
        execSync(`fuser -k ${targetPort}/tcp 2>/dev/null || true`, { stdio: "ignore", timeout: 1500 });
      } catch {}
      try {
        execSync(`lsof -ti:${targetPort} | xargs kill -9 2>/dev/null || true`, { stdio: "ignore", timeout: 1500 });
      } catch {}
    }
  } catch {}
}

let backendChildProcess = null;

async function launchBackend() {
  const backendEntry = findBackendEntry();
  if (!backendEntry) {
    console.warn("> Notice: Commerce backend entry file not found in parent paths. Running storefront in standalone mode.");
    return;
  }

  // Always kill any stale backend process on port 9000 before spawning to ensure fresh code
  killProcessOnPort(9000);
  await new Promise((r) => setTimeout(r, 600));

  console.log(`> Spawning Fresh SAN Commerce Backend Engine: ${backendEntry}`);
  try {
    const nodeModulesPath = path.resolve(__dirname, "node_modules");
    const rawDbHost = process.env.DB_HOST || "127.0.0.1";
    const safeDbHost = rawDbHost.toLowerCase() === "localhost" ? "127.0.0.1" : rawDbHost;

    backendChildProcess = fork(backendEntry, [], {
      cwd: path.dirname(backendEntry),
      env: {
        ...process.env,
        NODE_PATH: nodeModulesPath,
        PORT: "9000",
        DB_HOST: safeDbHost,
        BACKEND_URL: "http://127.0.0.1:9000",
        BACKEND_INTERNAL_URL: "http://127.0.0.1:9000",
      },
      stdio: "inherit",
    });

    backendChildProcess.on("exit", (code, signal) => {
      console.warn(`> Commerce Backend exited (code: ${code}, signal: ${signal}). Auto-restarting in 3s...`);
      backendChildProcess = null;
      setTimeout(launchBackend, 3000);
    });
  } catch (err) {
    console.error("> Failed to auto-launch Commerce Backend:", err);
  }
}

// Graceful cleanup on server shutdown
function cleanup() {
  if (backendChildProcess) {
    try {
      backendChildProcess.kill();
    } catch {}
  }
}

process.on("SIGINT", () => { cleanup(); process.exit(0); });
process.on("SIGTERM", () => { cleanup(); process.exit(0); });
process.on("exit", cleanup);

// Initialize Backend Supervisor
launchBackend().catch(console.error);

// 5. Ensure critical Next.js production manifests exist on disk to prevent ENOENT startup crashes
function ensureNextManifests(nextDir) {
  if (!fs.existsSync(nextDir)) return;

  const manifests = {
    "prerender-manifest.json": JSON.stringify({
      version: 4,
      routes: {},
      dynamicRoutes: {},
      notFoundRoutes: [],
      preview: {
        previewModeId: "preview-id",
        previewModeSigningKey: "preview-signing-key",
        previewModeEncryptionKey: "preview-encryption-key",
      },
    }),
    "images-manifest.json": JSON.stringify({
      version: 1,
      images: {
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        path: "/_next/image",
        loader: "default",
        loaderFile: "",
        domains: [],
        disableStaticImages: false,
        minimumCacheTTL: 60,
        formats: ["image/webp"],
        dangerouslyAllowSVG: false,
        contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
        contentDispositionType: "attachment",
        remotePatterns: [],
        unoptimized: false,
      },
    }),
    "export-marker.json": JSON.stringify({
      version: 1,
      hasExportPathMap: false,
      exportTrailingSlash: false,
      isNextImageImported: false,
    }),
  };

  for (const [file, fallbackContent] of Object.entries(manifests)) {
    const fullPath = path.join(nextDir, file);
    if (!fs.existsSync(fullPath)) {
      try {
        fs.writeFileSync(fullPath, fallbackContent, "utf8");
        console.log(`> Auto-generated missing Next.js manifest: ${file}`);
      } catch (err) {
        console.warn(`> Failed to write fallback for ${file}:`, err);
      }
    }
  }
}
try {
  ensureNextManifests(path.join(__dirname, ".next"));
} catch {}

// 6. Purge stale Next.js cache directories on server startup to eliminate stale SSG/ISR cache collisions
try {
  const cacheCandidates = [
    path.join(__dirname, ".next/cache"),
    path.resolve(process.cwd(), ".next/cache"),
    path.resolve(process.cwd(), "apps/storefront/.next/cache"),
  ];
  for (const cPath of cacheCandidates) {
    if (fs.existsSync(cPath)) {
      fs.rmSync(cPath, { recursive: true, force: true });
      console.log(`> Purged stale Next.js cache directory: ${cPath}`);
    }
  }
} catch {}

// Pass customConfig directly into next() to completely bypass internal loadConfigFile
let customConfig = {};
try {
  customConfig = require("./next.config.js");
} catch (e) {
  console.warn("> Notice: using default Next.js configuration:", e.message);
}

const app = next({ dev, dir: __dirname, conf: customConfig });
const handle = app.getRequestHandler();

// MIME Types Map for Static Asset Fallback
const STATIC_MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

app.prepare()
  .then(() => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        const { pathname } = parsedUrl;

        // 1. Static Asset Handler for /_next/static/ (guarantees CSS/JS load even under cPanel Passenger)
        if (pathname && pathname.startsWith("/_next/static/")) {
          const relPath = pathname.replace("/_next/static/", "");
          const filePath = path.join(__dirname, ".next/static", relPath);

          const candidatePaths = [
            filePath,
            path.join(__dirname, ".next/static", relPath.replace(/^chunks\//, "")),
            path.join(__dirname, ".next/static/chunks", relPath.replace(/^chunks\//, "")),
            path.join(__dirname, ".next/static/chunks", relPath),
          ];

          let foundPath = candidatePaths.find((p) => {
            try {
              return fs.existsSync(p) && fs.statSync(p).isFile();
            } catch {
              return false;
            }
          });

          // Resilient JS Chunk Fallback: If client asks for an older deleted hash (e.g. page-*.js, loading-*.js, layout-*.js, webpack-*.js)
          if (!foundPath && pathname.endsWith(".js")) {
            const fileName = path.basename(relPath);
            const dirName = path.dirname(relPath);
            const prefix = fileName.split("-")[0] || fileName.split(".")[0];

            const searchDirs = [
              path.join(__dirname, ".next/static", dirName),
              path.join(__dirname, ".next/static/chunks", dirName),
              path.join(__dirname, ".next/static", dirName.replace(/^chunks\//, "")),
              path.join(__dirname, ".next/static/chunks", dirName.replace(/^chunks\//, "")),
            ];

            for (const d of searchDirs) {
              try {
                if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
                  const candidates = fs.readdirSync(d).filter((f) => f.startsWith(prefix) && f.endsWith(".js"));
                  if (candidates.length > 0) {
                    foundPath = path.join(d, candidates[0]);
                    break;
                  }
                }
              } catch {}
            }
          }

          if (foundPath) {
            const ext = path.extname(foundPath).toLowerCase();
            res.writeHead(200, {
              "Content-Type": STATIC_MIME_TYPES[ext] || "application/octet-stream",
              "Cache-Control": "public, max-age=31536000, immutable",
            });
            fs.createReadStream(foundPath).pipe(res);
            return;
          }

          // Resilient JS Chunk Fallback: If client asks for an older deleted hash that cannot be found, serve a safe noop webpack module to prevent fatal 404 script load failure
          if (pathname.endsWith(".js") && (pathname.includes("/chunks/") || pathname.includes("/static/"))) {
            res.writeHead(200, {
              "Content-Type": "application/javascript; charset=utf-8",
              "Cache-Control": "public, max-age=60",
            });
            res.end("/* resilient fallback */ (self.webpackChunk_N_E=self.webpackChunk_N_E||[]);");
            return;
          }

          // Resilient CSS Fallback: If client asks for an older deleted CSS hash, serve the largest main stylesheet
          if (pathname.endsWith(".css")) {
            const cssDir = path.join(__dirname, ".next/static/css");
            if (fs.existsSync(cssDir)) {
              const availableCss = fs.readdirSync(cssDir)
                .filter(f => f.endsWith(".css"))
                .map(f => {
                  try {
                    return { name: f, size: fs.statSync(path.join(cssDir, f)).size };
                  } catch {
                    return { name: f, size: 0 };
                  }
                })
                .sort((a, b) => b.size - a.size);
              if (availableCss.length > 0) {
                const latestCssFile = path.join(cssDir, availableCss[0].name);
                res.writeHead(200, {
                  "Content-Type": "text/css; charset=utf-8",
                  "Cache-Control": "public, max-age=3600",
                });
                fs.createReadStream(latestCssFile).pipe(res);
                return;
              }
            }
          }
        }

        // 2. Public Directory Asset Handler (e.g. /SanFurnitureLogo.png, /favicon.ico)
        if (pathname && pathname !== "/" && !pathname.startsWith("/api/") && !pathname.startsWith("/_next/")) {
          const publicCandidates = [
            path.join(__dirname, "public", pathname),
            path.resolve(__dirname, "../../", pathname.replace(/^\/+/, "")),
          ];
          for (const cand of publicCandidates) {
            if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
              const ext = path.extname(cand).toLowerCase();
              if (STATIC_MIME_TYPES[ext]) {
                res.writeHead(200, {
                  "Content-Type": STATIC_MIME_TYPES[ext],
                  "Cache-Control": "public, max-age=86400",
                });
                fs.createReadStream(cand).pipe(res);
                return;
              }
            }
          }
        }

        // 3. Prevent downstream proxies and LiteSpeed from caching dynamic Admin or API pages
        if (pathname && (pathname.startsWith("/admin") || pathname.startsWith("/api/"))) {
          res.setHeader("Cache-Control", "private, no-cache, no-store, max-age=0, must-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }

        // 4. Delegate to Next.js Request Handler
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error handling request:", req.url, err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(JSON.stringify({ error: "Internal Server Error", message: err.message || "An unexpected error occurred." }));
      }
    });

    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> SAN Furniture Storefront active on ${port} (Node: ${process.version}, Mode: ${dev ? "development" : "production"})`);
    });
  })
  .catch((err) => {
    console.error("> Fatal error during Next.js app.prepare():", err);
    // Diagnostic HTTP server so Passenger never throws 503 and exposes the exact log
    const fallbackServer = http.createServer((req, res) => {
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(`<!DOCTYPE html>
<html>
<head><title>SAN Furniture Startup Diagnostics</title></head>
<body style="font-family: system-ui, sans-serif; padding: 40px; line-height: 1.6; color: #1e293b; background: #f8fafc;">
  <h2 style="color: #b91c1c;">SAN Furniture Server Startup Notice</h2>
  <p>Next.js prepare encountered an issue:</p>
  <pre style="background: #ffffff; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow-x: auto;">${err.stack || err.message}</pre>
</body>
</html>`);
    });
    fallbackServer.listen(port, () => {
      console.log(`> Diagnostic fallback server listening on ${port}`);
    });
  });
