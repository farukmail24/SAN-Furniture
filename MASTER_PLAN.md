# SAN Furniture – UK Dropshipping Master Architecture & Implementation Plan

> **Project Goal**: Build a high-performance, UK-tailored, dropshipping furniture e-commerce platform with automated supplier sync, multi-tier UK postal logistics, Google/Meta feed engines, programmatic SEO, enterprise brute-force security, sub-millisecond database indexing, and a full point-to-point admin control suite.

---

## 1. Executive Summary & Recommended Tech Stack

| Layer | Recommended Technology | Architectural Rationale & Why It Beats Alternatives |
| :--- | :--- | :--- |
| **Storefront** | **Next.js 15 (App Router, React 19, TypeScript)** | SSR/ISR for sub-second TTFB, 100/100 Core Web Vitals, dynamic OpenGraph/JSON-LD, Server Actions for checkout safety. Unmatched ecosystem for AI code generation. |
| **Styling & UI** | **Tailwind CSS + shadcn/ui + Lucide Icons + Framer Motion** | Ultra-clean design system tokens, responsive mobile-first layouts, zero CSS bloat, smooth micro-interactions, accessible keyboard navigation. |
| **Commerce Engine** | **Medusa v2 (Headless Commerce, TypeScript)** | Modern, modular open-source Node.js commerce backend. Native support for multi-currency, carts, orders, inventory, promotions, and custom modules (supplier sync, margin rules). |
| **Admin Control Panel** | **Medusa Admin v2 (React + Vite Extension Framework)** | Extensible point-to-point dashboard with custom widgets, UI extensions, and endpoints for supplier logs, SEO manager, and security IP jail. |
| **Database** | **PostgreSQL 16** | Native support for JSONB attributes (furniture dimensions, materials), `pg_trgm` fuzzy search, partial indexes, and time-series partitioning. |
| **Cache & Async Queue** | **Redis + BullMQ** | High-throughput supplier feed ingestion, scheduled price/stock reconciliations, async webhook processing, and sliding-window rate limiting. |
| **Instant Search** | **Meilisearch** | Sub-50ms typo-tolerant search, faceted filtering (dimensions, color, material, assembly status, price range), zero load on PostgreSQL. |
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
    NextStorefront -->|REST / GraphQL API| MedusaBackend[Medusa v2 Commerce Core]
    
    AdminUser[Store Admin / Ops Lead] -->|2FA / Passkey / IP Allowlist| MedusaAdmin[Point-to-Point Admin Panel]
    MedusaAdmin --> MedusaBackend
    
    MedusaBackend -->|Connection Pool PgBouncer| PG[(PostgreSQL 16 Database)]
    MedusaBackend -->|Cache / Sessions / IP Lock| Redis[(Redis Cluster)]
    
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
        MedusaBackend -->|Postcode Verification| UKAddressAPI[Ideal Postcodes / PAF]
    end
```

---

## 3. Database Architecture & Indexing Strategy (PostgreSQL)

Furniture e-commerce queries are heavily faceted and filtered by dimensions, stock status, category, and price range. Applying the **ESR (Equality, Sort, Range)** rule guarantees sub-millisecond execution.

### Key Schema Extensions & Indexes

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Furniture Specialized Product Attributes Table
CREATE TABLE IF NOT EXISTS furniture_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(255) NOT NULL UNIQUE,
    width_cm NUMERIC(6, 2) NOT NULL,
    height_cm NUMERIC(6, 2) NOT NULL,
    depth_cm NUMERIC(6, 2) NOT NULL,
    seat_height_cm NUMERIC(6, 2),
    weight_kg NUMERIC(6, 2) NOT NULL,
    material VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    assembly_required BOOLEAN DEFAULT FALSE,
    fire_safety_compliant BOOLEAN DEFAULT TRUE, -- UK Furniture & Furnishings Fire Safety Regs 1988
    delivery_type VARCHAR(50) NOT NULL DEFAULT 'standard_parcel', -- 'standard_parcel', 'pallet', 'two_man_white_glove'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Supplier Dropship Inventory Link
CREATE TABLE IF NOT EXISTS supplier_feed_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(100) NOT NULL,
    supplier_sku VARCHAR(255) NOT NULL,
    internal_product_id VARCHAR(255) NOT NULL,
    cost_price_pennies INT NOT NULL, -- Stored in pence (e.g. £100.00 = 10000)
    shipping_cost_pennies INT NOT NULL DEFAULT 0,
    markup_percentage NUMERIC(5, 2) NOT NULL DEFAULT 35.00,
    retail_price_pennies INT NOT NULL,
    stock_level INT NOT NULL DEFAULT 0,
    lead_time_days INT NOT NULL DEFAULT 3,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, supplier_sku)
);

-- 3. Security IP Jail & Brute Force Tracker
CREATE TABLE IF NOT EXISTS security_ip_jail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL UNIQUE,
    failed_attempts INT NOT NULL DEFAULT 1,
    locked_until TIMESTAMPTZ,
    reason VARCHAR(255) NOT NULL,
    is_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ESR Composite Indexes for Storefront Catalog Filtering
-- Query Pattern: WHERE status = 'published' AND category_id = :id AND price BETWEEN :min AND :max ORDER BY created_at DESC
CREATE INDEX idx_products_cat_status_created_price 
ON product (category_id, status, created_at DESC, price);

-- 5. Partial Filtered Index for Live Products (Saves ~70% index buffer RAM)
CREATE INDEX idx_published_furniture 
ON product (id, handle, title) 
WHERE status = 'published' AND deleted_at IS NULL;

-- 6. GIN Trigram Fuzzy Search Index on Titles & Handles
CREATE INDEX idx_product_title_trgm 
ON product USING gin (title gin_trgm_ops);

-- 7. Supplier Feed Sync Lookup Index
CREATE INDEX idx_supplier_sku_sync 
ON supplier_feed_items (supplier_id, supplier_sku);
```

---

## 4. Phase-by-Phase AI Implementation Plan

This roadmap is split into continuous batch phases. Each phase provides exact deliverables, concrete steps, verification tests, and copy-pasteable **AI Execution Prompts**.

```
[x] Phase 0: Project Foundation & UK Specifications (Setup & Rules)
[x] Phase 1: Monorepo Skeleton & Docker Infrastructure
[x] Phase 2: Furniture Data Models, Postgres Schema & ESR Indexing
[x] Phase 3: Dropshipping & Automated Supplier Sync Engine
[x] Phase 4: Modern High-Conversion Storefront UI (Next.js 15)
[x] Phase 5: UK Multi-Payment & Postcode-Tier Logistics Engine
[ ] Phase 6: Automated Google Merchant & Meta Catalog Engine
[ ] Phase 7: Super Programmatic SEO Auto-Scaling Engine
[ ] Phase 8: Multi-Layer Security, Redis Rate Limiting & IP Jail
[ ] Phase 9: Point-to-Point Advanced Admin Control Suite
[ ] Phase 10: Performance Optimization & Sub-Millisecond Database Tuning
[ ] Phase 11: End-to-End Verification & Production Launch Readiness
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
**Objective**: Stand up a containerized development environment with PostgreSQL, Redis, Meilisearch, Next.js storefront, and Medusa backend.

- **Directory Structure**:
  ```
  san-furniture/
  ├── apps/
  │   ├── storefront/          # Next.js 15 App Router
  │   └── backend/             # Medusa v2 Commerce & Admin
  ├── packages/
  │   ├── types/               # Shared TypeScript schemas (Zod)
  │   └── config/              # Shared Tailwind, ESLint, TS configs
  ├── docker-compose.yml       # Postgres 16, Redis 7, Meilisearch
  ├── .env.example
  └── package.json
  ```
- **Verification**: `docker compose up -d` boots Postgres, Redis, and Meilisearch with 0 health check failures.

> **AI Prompt for Phase 1**:
> ```text
> Act as a DevOps and Full-Stack Engineer. Scaffold the monorepo for SAN Furniture using Turborepo or npm workspaces:
> 1. Root package.json with workspaces for apps/storefront and apps/backend.
> 2. docker-compose.yml containing:
>    - PostgreSQL 16 on port 5432 with health check.
>    - Redis 7 on port 6379 with persistent volume.
>    - Meilisearch on port 7700 with master key configured.
> 3. Standardized .env.example with placeholders for database URLs, Stripe UK keys, Resend API key, and Cloudflare credentials.
> 4. apps/backend initialized with Medusa v2 starter and apps/storefront initialized with Next.js 15 App Router, TypeScript, and Tailwind CSS.
> Verify that all workspaces build without TypeScript or linting errors.
> ```

---

### Phase 2: Furniture Data Models, Postgres Schema & ESR Indexing
**Objective**: Build rich furniture product models, category trees, variant attributes, and database indexes.

- **Deliverables**:
  1. Extended Medusa schema or custom Drizzle/Prisma schema:
     - Dimensions (width, depth, height, seat height in cm).
     - Weight (kg), boxed package dimensions for courier calculation.
     - Materials (Solid Oak, Velvet, Bouclé, Linen, Walnut).
     - UK Fire Safety compliance badge (`compliant`, `BS 5852 standard`).
     - Delivery classification (`parcel_courier`, `heavy_pallet`, `two_man_white_glove`).
  2. SQL migration script implementing the ESR composite indexing, GIN trigram indexes, and partial indexes from Section 3.
  3. Seed script with 50 realistic UK furniture items (chests, corner sofas, dining tables, velvet armchairs) with accurate dimensions and UK GTINs.

> **AI Prompt for Phase 2**:
> ```text
> Act as a Principal Database Architect. Build the furniture product data modeling and PostgreSQL schema for SAN Furniture:
> 1. Define TypeScript types and Zod schemas in packages/types for furniture attributes: dimensions (W/D/H in cm), weight_kg, material, finish, assembly_required, fire_safety_certificate, delivery_class (parcel, pallet, 2-man).
> 2. Create the Medusa v2 custom module/entity migrations for these furniture specs.
> 3. Write a raw PostgreSQL migration file that creates:
>    - ESR composite index for category, published status, created_at, and price.
>    - Partial index for live products WHERE status = 'published' AND deleted_at IS NULL.
>    - GIN trigram search index on product titles.
> 4. Create a seed script that populates the database with 50 high-ticket UK furniture items with full specifications.
> Run EXPLAIN ANALYZE on a sample faceted search query to verify index usage (0 Seq Scans).
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
> 1. Create a streaming XML feed route in Next.js/Medusa at /api/feeds/google-merchant.xml that outputs Google Merchant Center compliant XML:
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
> 1. Implement a Redis sliding-window rate limiter middleware in Next.js / Medusa using sliding log or token bucket algorithm.
> 2. Build the BruteForceDefenseService:
>    - Track failed login attempts per IP and username.
>    - Automatically trigger IP lockout after 5 failed attempts, writing to PostgreSQL security_ip_jail.
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
> Act as a Full-Stack Product Architect. Implement the Point-to-Point Admin Control Suite inside Medusa Admin v2:
> 1. Create custom UI routes and widgets in Medusa Admin for:
>    - Supplier & Margin Config: UI to edit category markup percentages and test margin calculations.
>    - UK Postcode Zone Rates: Data table to edit shipping fees and surcharges for Scottish Highlands, Islands, and Northern Ireland.
>    - Security Center: Table displaying security_ip_jail records with IP address, failed attempts count, reason, and an 'Unblock IP' action button.
>    - Feed Health Monitor: Overview of Google Merchant and Meta Catalog sync status with item error counts.
>    - 301 Redirect Manager: CRUD interface for URL redirection rules.
> 2. Enforce RBAC permissions and structured audit logging for all admin modifications.
> ```

---

### Phase 10: Performance Optimization & Sub-Millisecond Database Tuning
**Objective**: Guarantee sub-second page loads across the UK, optimize PostgreSQL query plans, and achieve 95+ Core Web Vitals.

- **Checklist**:
  1. Profile all storefront SQL queries using `EXPLAIN (ANALYZE, BUFFERS)` to eliminate all table sequential scans (`Seq Scan`).
  2. Configure PgBouncer connection pooling to handle high concurrent traffic spikes during sales events.
  3. Tune PostgreSQL server settings (`shared_buffers = 25% RAM`, `effective_cache_size = 75% RAM`, `work_mem = 16MB`, `random_page_cost = 1.1` for SSDs).
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

- **Verification Matrix**:
  - [ ] **E2E Purchase Flow**: Guest & logged-in user search → filter → PDP → enter UK postcode → Stripe Klarna checkout → order confirmed.
  - [ ] **Supplier Integration**: Order triggers supplier PO; tracking webhook updates order status.
  - [ ] **Logistics**: UK Mainland standard free shipping applied; Scottish Highlands postcode applies £45 surcharge correctly.
  - [ ] **Security**: 6 failed logins from test IP triggers automatic IP lockout and 403 Forbidden; Turnstile blocks automated bot form submissions.
  - [ ] **SEO & Feeds**: Google Merchant XML validates with 0 errors on Google Merchant Feed Debugger; Schema.org Rich Results test passes for Product & Offer.
  - [ ] **Backups**: Automated daily encrypted PostgreSQL backups stored on Cloudflare R2 with tested 15-minute restoration drill.

> **AI Prompt for Phase 11**:
> ```text
> Act as a Lead QA and Release Engineer. Build the Playwright E2E test suite and launch verification scripts:
> 1. Write Playwright E2E tests covering:
>    - Search and faceted filtering for velvet armchairs.
>    - Postcode delivery surcharge application at checkout (testing both SW1A 1AA London and IV1 1AA Inverness).
>    - Complete checkout execution using Stripe test cards and Klarna simulated flow.
> 2. Write an automated security test verifying that rate limits and IP jail lockout trigger accurately on excess failed attempts.
> 3. Generate a release readiness scorecard verifying that all 11 phases meet acceptance criteria with 0 console errors and 0 lint warnings.
> ```

---

## 5. How to Guide Your AI Pairing Agent (Best Practices)

1. **One Phase at a Time**: Never ask the AI to code Phase 1 through Phase 11 in a single prompt. Treat each phase as a discrete milestone.
2. **Verify Before Moving Forward**: At the end of each phase, run the test command (`npm run test`, `docker compose ps`, `tsc --noEmit`). Never proceed to the next phase until the current phase passes with 0 errors.
3. **Use the Embedded AI Prompts**: Use the pre-crafted AI prompt templates above. They contain precise domain rules, edge-case constraints, and architectural standards that prevent hallucinations.
4. **Reference Existing Types**: Always prompt the AI to import types from `packages/types` rather than re-declaring ad-hoc interfaces.
