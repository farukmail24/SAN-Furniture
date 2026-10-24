# SAN Furniture – UK Dropshipping Master Architecture & Implementation Plan

> **Project Goal**: Build a high-performance, UK-tailored, dropshipping furniture e-commerce platform with automated supplier sync, multi-tier UK postal logistics, Google/Meta feed engines, programmatic SEO, enterprise brute-force security, sub-millisecond database indexing, and a full point-to-point admin control suite.

---

## 1. Executive Summary & Recommended Tech Stack

| Layer | Recommended Technology | Architectural Rationale & Why It Beats Alternatives |
| :--- | :--- | :--- |
| **Storefront** | **Next.js 15 (App Router, React 19, TypeScript)** | SSR/ISR for sub-second TTFB, 100/100 Core Web Vitals, dynamic OpenGraph/JSON-LD, Server Actions for checkout safety. Unmatched ecosystem for AI code generation. |
| **Styling & UI** | **Tailwind CSS + shadcn/ui + Lucide Icons + Framer Motion** | Ultra-clean design system tokens, responsive mobile-first layouts, zero CSS bloat, smooth micro-interactions, accessible keyboard navigation. |
| **Commerce Engine** | **Custom Node.js API (TypeScript / JavaScript)** | Project-owned commerce and admin API backed by MySQL, with explicit routes for catalog, orders, supplier sync, and operational workflows. |
| **Admin Control Panel** | **Next.js Admin App** | Project-owned admin routes and APIs for content, catalog, supplier operations, SEO, and security management. |
| **Database** | **MySQL 8 / MariaDB (XAMPP)** | Canonical InnoDB schema and transactional catalog/order storage; local development connects to port 3306. |
| **Cache & Async Queue** | **Redis + BullMQ** | High-throughput supplier feed ingestion, scheduled price/stock reconciliations, async webhook processing, and sliding-window rate limiting. |
| **Instant Search** | **Meilisearch** | Typo-tolerant search and faceted filtering without fuzzy-search load on MySQL. |
| **Payments (UK)** | **Stripe (Payment Element) + PayPal Business** | Comprehensive UK payments: Visa/Mastercard, Apple Pay, Google Pay, **Klarna**, **Clearpay**, Pay by Bank (Open Banking). Idempotent webhooks. |
| **UK Delivery & Postal** | **Ideal Postcodes / getAddress.io API + Custom Zone Matrix** | UK PAF address lookup, automated surcharge calculation for Scottish Highlands/Islands, Northern Ireland, Isle of Wight/Man. |
| **Feeds & Marketing** | **Google Merchant API + Meta Catalog Feed + CAPI** | Automated RSS 2.0 / JSON product feeds, dynamic stock updates, Facebook Conversions API for high data match quality. |
| **Security & Edge** | **Cloudflare (Turnstile + WAF) + Custom Redis Sliding Window** | Edge bot protection, DDoS mitigation, sliding-window rate limit, dual-layer IP/Account brute force lockout with auto-jail. |
| **Email & Storage** | **Resend (React Email) + Cloudflare R2 (S3-compatible)** | UK transactional emails (VAT invoices, tracking links), zero-egress asset storage for high-res furniture imagery. |

---

## 2. System Architecture Blueprint

```mermaid
graph TD
    Client[Customer / Mobile / Desktop Browser] -->|HTTPS / Turnstile / WAF| CF[Cloudflare CDN & Edge Security]
    CF -->|Cached Assets & SSR Pages| NextStorefront[Next.js 15 Storefront App]
    NextStorefront -->|Instant Faceted Search| Meili[Meilisearch Engine]
    NextStorefront -->|REST API| CommerceBackend[Custom Node.js Commerce API]
    
    AdminUser[Store Admin / Ops Lead] -->|Admin UI| StoreAdmin[Next.js Admin Panel]
    StoreAdmin --> CommerceBackend
    
    CommerceBackend -->|mysql2 connection pool| MySQL[(MySQL 8 / MariaDB on XAMPP)]
    CommerceBackend -->|Cache / Sessions / IP Lock| Redis[(Redis)]
    
    subgraph Async & Background Workers (BullMQ)
        Redis --> Worker[BullMQ Worker Service]
        Worker -->|Scheduled Sync| SupplierAPI[UK Furniture Suppliers: CSV/XML/API]
        Worker -->|Order Auto-Dispatch| SupplierDispatch[Supplier Fulfillment Endpoint]
        Worker -->|Feed Generation| GoogleMerchant[Google Merchant Center API]
        Worker -->|Feed Generation| MetaCatalog[Meta / Facebook Catalog Feed]
        Worker -->|Transactional Mail| ResendService[Resend UK VAT Invoices]
    end

    subgraph Payments & Logistics
        NextStorefront -->|Direct Card / Klarna / Apple Pay| StripeGateway[Stripe UK]
        NextStorefront -->|PayPal Checkout| PayPalGateway[PayPal UK]
        CommerceBackend -->|Postcode Verification| UKAddressAPI[Ideal Postcodes / PAF]
    end
```

---

## 3. Database Architecture & Indexing Strategy (MySQL 8 / MariaDB)

The canonical schema and sample data are maintained in `database/san_furniture.sql` for MySQL 8 / MariaDB on XAMPP. The active backend connects through `mysql2` using the root `.env` values `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD`. PostgreSQL and Medusa are not supported in this project.

- Store money as integer GBP pennies and furniture measurements in centimetres/kilograms.
- Use InnoDB foreign keys and indexes that match measured query patterns. The canonical product catalog index is `idx_prod_cat_status_price` on `(category_id, status, price_pennies)`; the supplier reconciliation key is `uniq_supplier_sku` on `(supplier_id, supplier_sku)`.
- Check real plans with MySQL `EXPLAIN`. MySQL does not support PostgreSQL partial indexes or GIN trigram indexes; use Meilisearch for typo-tolerant/fuzzy search.
- Keep SQL parameterized and never apply schema or seed scripts to an existing database without confirming the intended operation and backup.

## 4. Phase-by-Phase AI Implementation Plan

This roadmap is split into continuous batch phases. Each phase provides exact deliverables, concrete steps, verification tests, and copy-pasteable **AI Execution Prompts**.

```
[x] Phase 0: Project Foundation & UK Specifications (Setup & Rules)
[x] Phase 1: Monorepo Skeleton & Docker Infrastructure
[x] Phase 2: Furniture Data Models, MySQL Schema & Indexing
[x] Phase 3: Dropshipping & Automated Supplier Sync Engine
[x] Phase 4: Modern High-Conversion Storefront UI (Next.js 15)
[x] Phase 5: UK Multi-Payment & Postcode-Tier Logistics Engine
[x] Phase 6: Automated Google Merchant & Meta Catalog Engine
[x] Phase 7: Super Programmatic SEO Auto-Scaling Engine
[x] Phase 8: Multi-Layer Security, Redis Rate Limiting & IP Jail
[x] Phase 9: Point-to-Point Advanced Admin Control Suite
[x] Phase 10: Performance Optimization & Sub-Millisecond Database Tuning
[x] Phase 11: End-to-End Verification & Production Launch Readiness
[x] Phase 12: Enterprise Authentication & Multi-Role RBAC (Admin & Customer Portal)
[x] Phase 13: Dedicated Admin Suite 2.0 (Isolated Layout & Full Database CRUD)
[x] Phase 14: Customer Account Portal & Self-Service Order Tracking
[x] Phase 15: Statutory UK VAT Invoicing & Financial Accounting Export
[x] Phase 16: Customer Reviews Moderation & Social Proof Engine
[x] Phase 17: Promotions, Coupon Vouchers & Seasonal Sales Rules Engine
[x] Phase 18: Full Administrative Operations Suite & Governance (Settings, Suppliers EDI, Logistics, Security IP Jail, Syndicated Marketing, Audit Trail)
```

---

### Phase 0: Project Foundation & UK Legal Specifications
**Objective**: Establish repository standards, environment contracts, UK legal compliance specs, and AI guardrail guidelines.

- **Tasks**:
  1. Create project governance files: `SPEC.md`, `CLAUDE.md`, and `AGENTS.md`.
  2. Setup color palette and design tokens based on SAN Furniture brand identity (Deep Navy, Warm Sand/Beige, Forest/Sage Green accents).
  3. Define UK Legal & Dropshipping Compliance checklist:
     - 14-day statutory return under UK Consumer Contracts Regulations.
     - UK Furniture & Furnishings (Fire Safety) Regulations 1988 compliance flag.
     - All customer-facing prices displayed inclusive of 20% UK VAT.
     - UK GDPR / PECR cookie banner with granular consent.
     - Registered UK business address and Company Number in footer.

> **AI Prompt for Phase 0**:
> ```text
> Act as a Senior Software Architect and UK E-Commerce Specialist. Initialize the foundation of the SAN Furniture UK dropshipping project. Generate:
> 1. AGENTS.md specifying strict architectural rules, TypeScript coding conventions, zero-assumption guidelines, and component modularity.
> 2. SPEC.md detailing the entire furniture dropshipping domain: dimensions (W/H/D), materials, weight, 2-man delivery logistics, UK 20% VAT rules, and fire-safety certificates.
> 3. A comprehensive UK legal compliance checklist for Consumer Contracts Regulations, GDPR/PECR cookie consent, and Furniture Fire Safety 1988 requirements.
> ```

---

### Phase 1: Monorepo Skeleton & Docker Infrastructure
**Objective**: Run the XAMPP MySQL database alongside Redis, Meilisearch, the Next.js storefront, and the custom Node.js backend.

- **Directory Structure**:
  ```
  san-furniture/
  ├── apps/
  │   ├── storefront/          # Next.js 15 App Router
  │   └── backend/             # Custom Node.js Commerce API
  ├── packages/
  │   ├── types/               # Shared TypeScript schemas (Zod)
  │   └── config/              # Shared Tailwind, ESLint, TS configs
  ├── docker-compose.yml       # Redis 7, Meilisearch (MySQL runs in XAMPP)
  ├── .env.example
  └── package.json
  ```
- **Verification**: `docker compose up -d` boots Redis and Meilisearch; confirm MySQL is running in XAMPP.

> **AI Prompt for Phase 1**:
> ```text
> Act as a DevOps and Full-Stack Engineer. Scaffold the monorepo for SAN Furniture using Turborepo or npm workspaces:
> 1. Root package.json with workspaces for apps/storefront and apps/backend.
> 2. docker-compose.yml containing:
>    - XAMPP MySQL/MariaDB on port 3306 (configured through `.env`; not managed by Docker).
>    - Redis 7 on port 6379 with persistent volume.
>    - Meilisearch on port 7700 with master key configured.
> 3. Standardized .env.example with MySQL DB_* settings and placeholders for Stripe UK keys, Resend API key, and Cloudflare credentials.
> 4. apps/backend initialized as the project-owned Node.js API and apps/storefront initialized with Next.js 15 App Router, TypeScript, and Tailwind CSS.
> Verify that all workspaces build without TypeScript or linting errors.
> ```

---

### Phase 2: Furniture Data Models, MySQL Schema & Indexing
**Objective**: Build rich furniture product models, category trees, variant attributes, and database indexes.

- **Deliverables**:
  1. Extend the canonical MySQL schema (`database/san_furniture.sql`) and shared TypeScript/Zod models:
     - Dimensions (width, depth, height, seat height in cm).
     - Weight (kg), boxed package dimensions for courier calculation.
     - Materials (Solid Oak, Velvet, Bouclé, Linen, Walnut).
     - UK Fire Safety compliance badge (`compliant`, `BS 5852 standard`).
     - Delivery classification (`parcel_courier`, `heavy_pallet`, `two_man_white_glove`).
  2. MySQL schema and measured composite indexes, maintained in `database/san_furniture.sql`.
  3. Seed script with 50 realistic UK furniture items (chests, corner sofas, dining tables, velvet armchairs) with accurate dimensions and UK GTINs.

> **AI Prompt for Phase 2**:
> ```text
> Act as a Principal Database Architect. Align the furniture product data model with the canonical MySQL schema for SAN Furniture:
> 1. Define TypeScript types and Zod schemas in packages/types for furniture attributes: dimensions (W/D/H in cm), weight_kg, material, finish, assembly_required, fire_safety_certificate, delivery_class (parcel, pallet, 2-man).
> 2. Keep furniture specifications and supplier entities compatible with the MySQL schema and active Node.js backend.
> 3. Maintain MySQL DDL in the canonical schema and add indexes only after verifying query plans with EXPLAIN:
>    - The catalog composite index for category, status, and price.
>    - Supplier SKU lookup and other measured query indexes.
>    - Meilisearch for typo-tolerant fuzzy product search.
> 4. Create a seed script that populates the database with 50 high-ticket UK furniture items with full specifications.
> Run MySQL EXPLAIN on a sample faceted-search query and document any filesort or table scan before proposing index changes.
> ```

---

### Phase 3: Dropshipping & Automated Supplier Sync Engine
**Objective**: Build an enterprise BullMQ background engine that imports supplier catalogs, safeguards profit margins, synchronizes stock, and dispatches orders.

- **Key Components**:
  1. **Supplier Feed Adapter Pattern**: Abstract interface supporting CSV, XML, and JSON REST feeds from multiple UK suppliers.
  2. **Margin Guard Calculation Engine**:
     $$\text{Retail Price} = \frac{(\text{Cost Price} + \text{Supplier Carriage}) \times (1 + \text{Target Margin})}{1 - \text{Payment Fee \%}} \times 1.20\ (\text{UK VAT})$$
     *Guardrail: If supplier cost jumps such that margin drops below 15%, flag product for manual review and do not lower retail price.*
  3. **Stock Auto-Unpublish**: If supplier stock drops to 0, mark product status as `out_of_stock` or auto-unpublish to prevent customer unfulfillment.
  4. **Automated Order Forwarding**: When an order is paid, dispatch an API payload or encrypted XML PO to the supplier, ingest the tracking number via webhook, and notify the customer.

> **AI Prompt for Phase 3**:
> ```text
> Act as a Senior Backend Engineer. Build the dropshipping synchronization engine in apps/backend using Redis and BullMQ:
> 1. Implement SupplierFeedAdapter interface and create a concrete CsvSupplierAdapter that parses UK supplier CSV feeds with column mapping.
> 2. Implement the MarginGuardService with a formula incorporating supplier cost, shipping surcharge, minimum profit margin percentage, Stripe fee deduction, and 20% UK VAT. Add an alert rule if margin drops below threshold.
> 3. Create a BullMQ recurring cron job (sync-supplier-stock) running every 30 minutes that updates variant stock and unpublishes products with 0 inventory.
> 4. Build the OrderFulfillmentWorkflow: upon order.placed event, generate a Purchase Order payload and record dispatch status.
> Write automated tests covering margin calculations, edge cases (zero stock, price spike), and feed parsing.
> ```

---

### Phase 4: Modern High-Conversion Storefront UI (Next.js 15)
**Objective**: Build a gorgeous, compact, ultra-modern UK furniture storefront with instant faceted search, micro-animations, and 95+ mobile Lighthouse score.

- **UI / UX Lead Specifications**:
  - **Design Signature**: Elegant architectural minimalism. Deep navy (`#0B132B`), Warm Limestone/Oatmeal (`#F4F1EA`), Slate Muted accents, and subtle Gold/Brass metallic highlights.
  - **Hero Section**: High-impact editorial photography, compact typography, "Designed for British Living" value prop, 3-point Trustpilot / UK 2-Man Delivery / 5-Year Guarantee badges.
  - **Product Page (PDP)**:
    - Interactive 360/multi-angle gallery with zoom.
    - Explicit UK Dimensions visualization widget (Width × Depth × Height compared to doorway clearance).
    - Klarna "Pay in 3 of £X/mo" interactive banner.
    - Postcode delivery estimator widget (customer enters postcode → sees exact delivery lead time and courier tier).
    - Fabric swatch selector with high-res texture previews.
  - **Instant Search & Filter Drawer**: Meilisearch-powered instant search modal with keyboard navigation (`Cmd+K`).
  - **Mobile Cart Drawer & Sticky Buy Bar**: Sticky bottom bar on mobile with price and "Add to Basket" to maximize conversions.

> **AI Prompt for Phase 4**:
> ```text
> Act as an Elite Frontend Architect and UI/UX Lead. Develop the Next.js 15 App Router storefront for SAN Furniture:
> 1. Implement the design system tokens in Tailwind CSS: brand colors (deep navy, warm limestone, soft cream, subtle brass), modern typography using Outfit/Inter, and accessible focus rings.
> 2. Build the Product Detail Page (PDP):
>    - High-performance image gallery with Next.js Image optimization (AVIF/WebP) and zero Cumulative Layout Shift (CLS).
>    - Dimensions & Doorway Clearance visualizer card.
>    - Klarna / Clearpay installment breakdown calculator.
>    - Postcode delivery estimation widget.
>    - Sticky mobile checkout CTA bar.
> 3. Build the Category Faceted Filter using Meilisearch React InstantSearch (filters for material, color, price range slider, delivery type, assembly).
> 4. Ensure 100% mobile responsiveness, semantic HTML5, and prefers-reduced-motion compatibility.
> ```

---

### Phase 5: UK Multi-Payment & Postcode-Tier Logistics Engine
**Objective**: Integrate Stripe UK, Klarna, Clearpay, PayPal, address autocompletion, and UK regional shipping matrices.

- **Postcode Surcharge Matrix**:
  - **Zone 1 (UK Mainland Standard)**: Most England, Wales, Scottish Lowlands. Standard rates.
  - **Zone 2 (Scottish Highlands & Islands)**: Postcodes `IV`, `HS`, `KA27-28`, `KW`, `PA20-49`, `PA60-78`, `PH17-26`, `PH30-44`, `PH49-50`, `ZE`. Automatic £25-£65 pallet/2-man surcharge.
  - **Zone 3 (Northern Ireland)**: Postcodes starting with `BT`. Separate logistics and customs buffer.
  - **Zone 4 (Offshore UK)**: Isle of Man (`IM`), Scilly Isles (`TR21-25`), Channel Islands (`GY`, `JE`).
- **Postcode Lookup**: Address autocomplete using Ideal Postcodes or getAddress.io for 1-click address entry on checkout.
- **UK Tax & Payment**:
  - Stripe Payment Element rendering Credit Card, Apple Pay, Google Pay, Klarna Pay in 3, and Clearpay.
  - Webhook listener with idempotency keys (`stripe_events` table) to prevent double-charging or duplicate order creation.
  - Automated PDF VAT Invoice generation sent via Resend.

> **AI Prompt for Phase 5**:
> ```text
> Act as a Senior Payment and Logistics Architect. Build the UK checkout, payment, and shipping calculation engine:
> 1. Implement the UK Postcode Zone Service:
>    - Regex engine that categorizes UK postcodes into Mainland, Scottish Highlands/Islands, Northern Ireland (BT), and Channel Islands.
>    - Shipping rate calculation based on furniture delivery tier (Standard Parcel, Pallet, or 2-Man White Glove) + Regional Surcharge.
> 2. Implement the Ideal Postcodes / getAddress API client for rapid UK address lookup.
> 3. Build the Stripe Payment Element integration in Next.js Server Actions with support for Cards, Apple Pay, Google Pay, Klarna, and Clearpay.
> 4. Implement the Stripe webhook handler with database idempotency verification to prevent duplicate order events.
> 5. Generate UK-compliant VAT invoices (showing 20% VAT rate, VAT Registration Number, and breakdown) and dispatch via Resend.
> ```

---

### Phase 6: Automated Google Merchant & Meta Catalog Engine
**Objective**: Build real-time product feed endpoints and API synchronization for Google Shopping (Performance Max) and Facebook/Instagram Shop.

- **Deliverables**:
  1. `/api/feeds/google-merchant.xml`: Compliant RSS 2.0 XML feed with all mandatory UK furniture fields:
     - `g:id`, `g:title`, `g:description`, `g:link`, `g:image_link`, `g:additional_image_link`.
     - `g:availability` (`in_stock` / `out_of_stock`).
     - `g:price` (`GBP` with 20% VAT included).
     - `g:brand`, `g:gtin`, `g:mpn`.
     - `g:condition` (`new`).
     - `g:google_product_category` (e.g. `Home & Garden > Furniture > Sofas`).
     - `g:shipping` (UK mainland standard cost + transit time).
  2. Integration with Google Merchant API for real-time item updates on price or stock changes.
  3. `/api/feeds/meta-catalog.xml` or CSV format with scheduled sync.
  4. Server-Side Meta Conversions API (CAPI) on Next.js backend for `PageView`, `ViewContent`, `AddToCart`, and `Purchase` events.

> **AI Prompt for Phase 6**:
> ```text
> Act as a Digital Marketing & API Engineer. Implement the Google Shopping and Meta Catalog Feed engines:
> 1. Create a streaming XML feed route in the custom API at /api/feeds/google-merchant.xml that outputs Google Merchant Center compliant XML:
>    - Maps furniture dimensions, materials, and colors into Google custom attributes.
>    - Correctly sets g:availability, g:price with GBP suffix, g:gtin/mpn, and g:shipping tags.
>    - Streams responses with Redis caching (1 hour TTL) to handle 20,000+ SKUs with zero memory spikes.
> 2. Create the Meta Catalog feed at /api/feeds/meta-catalog.csv.
> 3. Implement Meta Conversions API (CAPI) on the server side to record AddToCart and Purchase events with hashed customer PII (SHA-256) for maximum match quality.
> Write unit tests verifying that all required XML tags match Google specifications.
> ```

---

### Phase 7: Super Programmatic SEO Auto-Scaling Engine
**Objective**: Drive organic high-intent UK buyer traffic through structured Schema.org JSON-LD, dynamic split sitemaps, and safe programmatic landing pages.

- **SEO Safeguards against Google "Scaled Content Abuse"**:
  - *Golden Rule*: No empty or thin programmatic pages. Only generate a programmatic page (e.g., `/sofas/green-velvet-3-seater`) if at least 4 in-stock products match the exact criteria.
  - Every page must feature curated buyer guide information, actual dimension comparisons, delivery lead times, and genuine customer reviews.
- **Structured Data Engine**:
  - Product & Offer schema with UK currency (`GBP`), price valid until date, in-stock status, and seller organization.
  - AggregateRating and Review schema.
  - BreadcrumbList schema with exact hierarchical levels.
  - LocalBusiness / OnlineStore Organization schema with UK customer service hours.
- **Dynamic Sitemaps**: Split sitemaps (`sitemap-products.xml`, `sitemap-categories.xml`, `sitemap-collections.xml`, `sitemap-index.xml`) generated dynamically with `lastmod` headers.

> **AI Prompt for Phase 7**:
> ```text
> Act as a Senior Technical SEO Engineer. Build the SEO auto-scaling and structured data engine:
> 1. Implement high-fidelity Schema.org JSON-LD components:
>    - Product Schema with Offer (priceCurrency: GBP, availability, itemCondition, shippingDetails with UK transit times).
>    - BreadcrumbList and Organization Schema.
> 2. Build the programmatic landing page router:
>    - URL pattern: /[category]/[filter-combination] (e.g. /armchairs/velvet-accent-chairs).
>    - Add a Thin Content Guard: if matching active products < 4, automatically return 404 or set meta robots to 'noindex, follow' with canonical pointing to parent category.
> 3. Generate dynamic split sitemaps using Next.js App Router sitemap.ts with sitemapIndex for products, categories, and editorial guides.
> 4. Ensure canonical tags, OpenGraph images, and semantic H1/H2 hierarchy are automated across all pages.
> Verify schemas with Google Rich Results Test definitions.
> ```

---

### Phase 8: Multi-Layer Security, Redis Rate Limiting & IP Jail
**Objective**: Protect against card testing attacks, credential stuffing, scraping bots, and brute force login attempts.

- **Defense Layers**:
  1. **Edge**: Cloudflare Turnstile bot challenges on checkout and login forms; Cloudflare WAF managed rules.
  2. **Application (Sliding Window Rate Limit)**: Redis-backed sliding window limiter:
     - `/api/auth/login`: Max 5 attempts per 15 minutes per IP.
     - `/api/checkout/pay`: Max 3 attempts per 10 minutes per IP/Cardholder (stops carding attacks).
     - `/api/search`: Max 60 queries per minute per IP.
  3. **Brute Force IP Lock System (IP Jail)**:
     - After 5 consecutive failed login attempts on admin or user portal, store IP in `security_ip_jail` with exponential lockout (15 mins → 1 hour → 24 hours → Permanent).
     - Provide an Admin UI to view blocked IPs, inspection logs, and 1-click unblock.
  4. **Strict Security Headers & Zero Raw SQL**:
     - CSP, HSTS (`max-age=63072000`), X-Frame-Options: DENY, Permissions-Policy.
     - Argon2id password hashing for admin accounts.
     - Webhook HMAC SHA-256 signature verification on Stripe, PayPal, and Supplier callbacks.

> **AI Prompt for Phase 8**:
> ```text
> Act as an Application Security (AppSec) Engineer. Build the enterprise security infrastructure for SAN Furniture:
> 1. Implement a Redis sliding-window rate limiter middleware in the Node.js backend using a sliding log or token bucket algorithm.
> 2. Build the BruteForceDefenseService:
>    - Track failed login attempts per IP and username.
>    - Automatically trigger IP lockout after 5 failed attempts, writing to the MySQL security_ip_jail table.
>    - Block requests from jailed IPs before invoking route handlers.
> 3. Configure hardened HTTP security headers (Strict CSP, HSTS, X-Content-Type-Options: nosniff, X-Frame-Options: DENY).
> 4. Integrate Cloudflare Turnstile token validation on all sensitive POST routes (login, register, contact, payment submit).
> 5. Implement HMAC signature validation middleware for all external webhooks.
> ```

---

### Phase 9: Point-to-Point Advanced Admin Control Suite
**Objective**: Build a comprehensive, centralized operations dashboard empowering full management of every site parameter without touching code.

- **10 Core Control Modules**:
  1. **Sales & Gross Margin Analytics**: Real-time sales, dropship gross margin, supplier cost vs. retail price breakdown, average order value.
  2. **Order Dispatch & Tracking Dispatcher**: View orders, 1-click manual or automated supplier PO dispatch, tracking number input, customer update triggers.
  3. **Supplier & Margin Management**: Configure markup percentages per category/supplier, set margin floor guards, trigger manual syncs, view supplier error logs.
  4. **Product Catalog & Furniture Attributes**: Manage dimensions (W×D×H), materials, fabric swatches, assembly manuals, fire safety certificates, and stock overrides.
  5. **UK Logistics & Postcode Surcharge Editor**: Add/modify UK postcode zones, edit pallet/2-man courier costs, toggle free delivery thresholds.
  6. **SEO & Dynamic Metadata Studio**: Override page meta titles, descriptions, canonical URLs, and manage 301 redirects table.
  7. **Google & Meta Feed Health Center**: Monitor feed status, view items with missing GTINs or warnings, trigger immediate feed regeneration.
  8. **Security & IP Jail Center**: View active rate-limit bans, inspect blocked IPs, examine failed login audit trails, and manage manual IP allowlist/blocklist.
  9. **CMS, Banners & Announcements**: Edit homepage hero banners, promotional countdowns, Klarna announcement strips, and customer FAQs.
  10. **Role-Based Access Control (RBAC) & Audit Logs**: Super Admin, Catalog Manager, Customer Support roles with granular permission checks and immutable audit logging.

> **AI Prompt for Phase 9**:
> ```text
> Act as a Full-Stack Product Architect. Implement the Point-to-Point Admin Control Suite in the Next.js admin app and custom backend:
> 1. Create custom admin UI routes and widgets for:
>    - Supplier & Margin Config: UI to edit category markup percentages and test margin calculations.
>    - UK Postcode Zone Rates: Data table to edit shipping fees and surcharges for Scottish Highlands, Islands, and Northern Ireland.
>    - Security Center: Table displaying security_ip_jail records with IP address, failed attempts count, reason, and an 'Unblock IP' action button.
>    - Feed Health Monitor: Overview of Google Merchant and Meta Catalog sync status with item error counts.
>    - 301 Redirect Manager: CRUD interface for URL redirection rules.
> 2. Enforce RBAC permissions and structured audit logging for all admin modifications.
> ```

---

### Phase 10: Performance Optimization & Sub-Millisecond Database Tuning
**Objective**: Guarantee sub-second page loads across the UK, optimize MySQL query plans, and achieve 95+ Core Web Vitals.

- **Checklist**:
  1. Profile storefront queries with MySQL `EXPLAIN` and measure query latency before changing indexes.
  2. Configure and size the `mysql2` connection pool for the expected workload.
  3. Tune MySQL InnoDB settings against the actual XAMPP host memory and workload; validate changes with measured MySQL metrics.
  4. Implement Stale-While-Revalidate and Next.js ISR (Incremental Static Regeneration) on category and product routes.
  5. Configure Cloudflare Cache Rules to cache static assets and product images at edge points of presence across London, Manchester, and Edinburgh.

> **AI Prompt for Phase 10**:
> ```text
> Act as a Senior Database and Performance Optimization Engineer:
> 1. Audit all catalog and search database queries using EXPLAIN (ANALYZE, BUFFERS). Ensure index scans are utilized and zero temporary files are written to disk.
> 2. Implement Redis caching layers for catalog navigations and product listings with automatic invalidation on product update events.
> 3. Optimize Next.js Image components using modern AVIF/WebP formats with explicit aspect ratios to guarantee Cumulative Layout Shift (CLS) = 0.
> 4. Run k6 load test simulating 500 concurrent users browsing categories and filtering products. Target: p95 latency < 150ms.
> ```

---

### Phase 11: End-to-End Verification & Production Launch Readiness
**Objective**: Execute end-to-end user journeys, conduct automated penetration testing, test disaster recovery, and launch.

- **Verification Matrix (All Verified & Passing)**:
  - [x] **E2E Purchase Flow**: Guest & logged-in user search → filter → PDP → enter UK postcode → Stripe Klarna checkout → order confirmed (Verified via `launch-verification-e2e.test.mjs`).
  - [x] **Supplier Integration**: Order triggers automated supplier PO; tracking webhook updates order status with idempotent guard (Verified).
  - [x] **Logistics**: UK Mainland standard free shipping applied (£500+ threshold); Scottish Highlands postcode applies £49 regional surcharge correctly (Verified).
  - [x] **Security**: 5+ failed logins from test IP triggers automatic IP lockout and 403 Forbidden; Turnstile blocks automated bot form submissions; Sliding window rate limiting enforced (Verified).
  - [x] **SEO & Feeds**: Google Merchant XML validates with 0 errors with full Google namespace; Meta RFC 4180 CSV & CAPI SHA-256 PII hashing verified; Schema.org Rich Results tests pass for Product, Offer, BreadcrumbList, Organization, and FAQPage.
  - [x] **Database & Performance**: MySQL composite indexes, Meilisearch fuzzy search, and cache behavior verified; tune further only from production measurements.
  - [x] **Operations Control Suite**: Point-to-point Admin dashboard with sales analytics, logistics surcharges, category margins, 1-click IP jail release, and immutable audit logging.

---

### Phase 12: Enterprise Authentication & Multi-Role RBAC (Admin & Customer Portal)
**Objective**: Build a bank-grade authentication system for both SAN Furniture operational staff (RBAC) and UK consumers with password hashing, JWT/HttpOnly session cookies, and route guard middleware.

- **Data Models & Schema (`admin_users`, `customers`, `sessions`)**:
  - `admin_users`: `id`, `email`, `password_hash` (Argon2id / bcrypt with 12 salt rounds), `full_name`, `role` (`super_admin`, `logistics_manager`, `catalog_editor`, `support_lead`), `is_active`, `last_login_at`, `created_at`.
  - `customers`: `id`, `email`, `password_hash`, `first_name`, `last_name`, `phone`, `email_verified`, `marketing_opt_in`, `created_at`.
  - `customer_addresses`: `id`, `customer_id`, `address_line1`, `address_line2`, `city`, `postcode` (UK format e.g. `SW1A 1AA`), `county`, `is_default_delivery`, `is_default_billing`.
- **Admin Authentication Flow**:
  - Dedicated `/admin/login` page with dark luxury operations UI.
  - Rate-limited auth endpoint: `POST /api/admin/auth/login` (5 attempts / 15 mins via Redis sliding window, triggers IP Jail on 5th failure).
  - HttpOnly, `SameSite=Strict`, `Secure` JWT cookie (`san_admin_token`).
  - Next.js Edge Middleware route guard: redirects unauthenticated requests on `/admin/*` (except `/admin/login`) directly to `/admin/login`.
- **Customer Authentication Flow**:
  - `/account/login` and `/account/register` with UK postcode auto-lookup integration.
  - Password strength validation: minimum 8 characters with at least one uppercase, one number, and one symbol.
  - Session cookie (`san_customer_token`) and customer order history access.

---

### Phase 13: Dedicated Admin Suite 2.0 (Isolated Layout & Full Database CRUD)
**Objective**: Isolate the admin control panel from the consumer storefront layout (eliminating customer header/footer) and enable direct database CRUD for Products, Orders, Suppliers, and Postcode Surcharges.

- **Isolated Admin Layout Architecture**:
  - Dynamic route separation: `/admin` renders inside its own dedicated `AdminLayout` containing an enterprise collapsible navy/gold sidebar and top operations bar.
  - Consumer `<Header />` and `<Footer />` components are strictly suppressed for any `/admin` path.
  - Sidebar Navigation Items:
    1. **Overview & Analytics** (`/admin`) – Real-time Gross Revenue, Dropship Margin, AOV, Order Pipeline.
    2. **Product Catalog & Inventory** (`/admin/products`) – Complete CRUD: Add/Edit/Delete products, dimension inputs (cm), BS 5852 fire safety toggles, retail vs supplier cost margins.
    3. **Orders & Fulfillment** (`/admin/orders`) – Order dispatch workflow (`pending_payment` → `paid` → `po_forwarded` → `in_transit_two_man` → `delivered`), tracking code injection.
    4. **Dropship Suppliers** (`/admin/suppliers`) – UK wholesale suppliers management, automated purchase orders, feed sync logs.
    5. **UK Logistics & Postcodes** (`/admin/logistics`) – Free delivery threshold (£500), 2-man base fee (£49), Highlands & Islands surcharges.
    6. **Security & IP Jail** (`/admin/security`) – Real-time brute force defense, strike counts, 1-click IP pardons.
    7. **Feeds & Programmatic SEO** (`/admin/marketing`) – Google Merchant XML & Meta CSV regenerations.
    8. **Audit Trail** (`/admin/audit`) – Immutable staff activity logs.
    9. **Staff & Permissions** (`/admin/staff`) – Manage admin users & roles.

---

### Phase 14: Customer Account Portal & Self-Service Order Tracking
**Objective**: Empower UK buyers with an elegant self-service account dashboard for order tracking, delivery rescheduling, and invoice access.

- **Customer Dashboard Features**:
  - Real-time order progress timeline (Order Received → Fabric Cutting / Oak Milling → Supplier QC Passed → 2-Man Carrier Booked → Out for Delivery).
  - Pre-booked 2-hour delivery window notification and carrier driver contact.
  - Address book management with Royal Mail PAF validation.
  - Saved wishlist with price drop alerts.

---

### Phase 15: Statutory UK VAT Invoicing & Financial Accounting Export
**Objective**: Automatically generate PDF and printable invoices complying with the UK Value Added Tax Act 1994 and provide clean CSV/Excel exports for UK accounting software (Xero, QuickBooks).

- **Mandatory UK VAT Invoice Fields**:
  - SAN Furniture Ltd company registration number and registered office address (London, UK).
  - Valid UK VAT Registration Number (e.g. `N/A`).
  - Invoice date, tax point (time of supply), and unique serial invoice number.
  - Itemized breakdown: Net cost, 20% VAT rate, VAT amount in GBP, and Gross total.
  - Automated generation upon checkout completion; instant download from `/admin/orders/[id]` and customer portal.

---

### Phase 16: Customer Reviews Moderation & Social Proof Engine
**Objective**: Build a trusted review collection and moderation system for high-ticket furniture purchases.

- **Components**:
  - Post-delivery automated review invitation (7 days after delivery).
  - Verified buyer badge, photo/video room upload capability.
  - Moderation queue in Admin Suite with spam/profanity filter.
  - Dynamic Schema.org `AggregateRating` and `Review` markup updates.

---

### Phase 17: Promotions, Coupon Vouchers & Seasonal Sales Rules Engine
**Objective**: Create a high-converting promotional engine tailored for UK shopping events (Boxing Day Sale, Bank Holiday Specials, Black Friday).

- **Engine Capabilities**:
  - Coupon types: Fixed GBP discount (e.g., `£100 off over £1,000`), percentage discount (`15% off Living Room`), free 2-man white glove upgrade code.
  - Redemptions cap, start/end timestamps, per-customer single use guards.
  - Real-time basket calculation in `CartProvider` and checkout.

---

### Phase 18: Full Administrative Operations Suite & Governance (Settings, Suppliers EDI, Logistics, Security IP Jail, Syndicated Marketing, Audit Trail)
**Objective**: Complete the mission-critical admin toolset with dedicated management surfaces for legal settings, UK dropshipping supplier EDI pipelines, regional delivery matrices, firewall IP Jail mitigation, automated syndication feeds, and immutable staff audit logging.

- **Completed Administrative Modules**:
  1. **Core Architecture & System Settings (`/admin/settings`)**:
     - UK Legal Entity & VAT Registration (Company No: `N/A`, VAT Reg: `N/A`, Mainland UK Logistics).
     - Delivery spend thresholds (£500 free threshold, £49 pallet base, £99 2-man white glove, £49 Scottish Highlands surcharge).
     - Dropship EDI auto-dispatch toggle & 30% floor markup protection.
     - UK Payment Gateway credentials (Stripe live/test, Klarna Merchant ID `N/A`).
     - Brute force lockout & IP jail configuration (5 strikes, 15m duration).
  2. **Dropship Suppliers & EDI Network (`/admin/suppliers`)**:
     - UK wholesale manufacturers directory (`UK Craft Sofas & Upholstery Works`, `Nordic Living UK Importers`, `Cotswold Solid Oak Joinery`).
     - Live stock catalog mapping, lead time metrics, and one-click manual/automated EDI sync (`POST /api/admin/suppliers/sync`).
  3. **Logistics & Regional Postcode Surcharge Matrix (`/admin/logistics`)**:
     - Inline management of Mainland UK vs Highlands/Islands postal zones (`postcode_zones`).
     - Real-time surcharge penny edits, delivery tier breakdown, and quality check flags.
  4. **Cyber Defense & IP Jail Operations (`/admin/security`)**:
     - Real-time view of locked offender IP addresses (`security_ip_jail`).
     - 1-click IP pardon (`POST /api/security/unblock`) and manual IP ban modal (`POST /api/security/block`).
     - Sliding window rate limiting monitoring (Auth: 5/15m, Checkout: 3/10m, Search: 60/1m).
  5. **Google & Meta Syndicated Product Feeds (`/admin/marketing`)**:
     - Google Merchant Center XML feed generator (`/api/feeds/google-merchant.xml`).
     - Meta / Instagram Commerce Catalog CSV export (`/api/feeds/meta-catalog.csv`).
  6. **Immutable Staff Audit Trail (`/admin/audit`)**:
     - Searchable and expandable audit trail with timestamps, staff actor, action name, target resource, client IP, and raw JSON payload (`admin_audit_logs`).
     - PCI-DSS & GDPR Article 32 compliance.

---

## 5. How to Guide Your AI Pairing Agent (Best Practices)

1. **One Phase at a Time**: Never ask the AI to code Phase 1 through Phase 11 in a single prompt. Treat each phase as a discrete milestone.
2. **Verify Before Moving Forward**: At the end of each phase, run the test command (`npm run test`, `docker compose ps`, `tsc --noEmit`). Never proceed to the next phase until the current phase passes with 0 errors.
3. **Use the Embedded AI Prompts**: Use the pre-crafted AI prompt templates above. They contain precise domain rules, edge-case constraints, and architectural standards that prevent hallucinations.
4. **Reference Existing Types**: Always prompt the AI to import types from `packages/types` rather than re-declaring ad-hoc interfaces.
