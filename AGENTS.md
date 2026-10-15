# AI Pair Programming Protocol & Conventions: SAN Furniture (UK)

Welcome, AI Engineer. You are developing **SAN Furniture**, an ultra-premium, high-performance UK dropshipping furniture platform. You must adhere strictly to these project rules and domain models.

---

## 1. Core Principles

1. **"Done" is a Verified Claim**: Never mark a task as completed without running the actual build, lint, and test commands (`npm run check`, `npm test`, `docker compose ps`).
2. **Zero Assumptions**: Read existing files and schemas before making edits. Do not invent arbitrary types or field names.
3. **UK E-Commerce Domain Truths**:
   - Currency is always GBP (`£`). Internal prices in database are stored in **pennies (integers)** to eliminate floating-point rounding errors (e.g., `£499.00` = `49900`).
   - Customer-facing prices always include **20% UK VAT**.
   - Furniture dimensions are recorded in **centimetres (cm)**: `width_cm`, `height_cm`, `depth_cm`, `seat_height_cm`.
   - Weight is recorded in **kilograms (kg)**.
   - Delivery tiers: `standard_parcel` (small décor/stools), `pallet` (dining tables, flatpack), `two_man_white_glove` (assembled sofas, bulky wardrobes).
   - Postcode Surcharge Zones: Mainland UK vs. Scottish Highlands (`IV`, `KW`, `HS`), Northern Ireland (`BT`), Channel Islands (`GY`, `JE`).
   - Compliance: Every upholstered item must have the `fire_safety_compliant` flag adhering to UK Furniture and Furnishings (Fire Safety) Regulations 1988.

---

## 2. Monorepo Structure & Conventions

```
san-furniture/
├── apps/
│   ├── storefront/              # Next.js 15 (App Router, Tailwind, TypeScript)
│   └── backend/                 # Medusa v2 commerce engine, BullMQ, Admin extensions
├── packages/
│   ├── types/                   # Zod schemas & TypeScript interfaces (single source of truth)
│   └── config/                  # Shared ESLint, Prettier, Tailwind configurations
├── docker-compose.yml           # PostgreSQL 16, Redis 7, Meilisearch
├── MASTER_PLAN.md               # Master phase-by-phase implementation plan
└── AGENTS.md                    # This file (AI instructions & rules)
```

---

## 3. Technology Stack & Mandatory Libraries

- **Language**: TypeScript strict mode (`"strict": true`, `"noImplicitAny": true`).
- **Storefront**: Next.js 15 App Router, React 19, Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion.
- **Backend**: Medusa v2, Node.js, BullMQ, Redis.
- **Database**: PostgreSQL 16 with pg_trgm and uuid-ossp extensions.
- **Search**: Meilisearch client.
- **Validation**: Zod for all external inputs, webhook payloads, and environment variables.
- **Security**: Argon2id for password hashing, Redis sliding-window for rate-limiting, Cloudflare Turnstile token verification.
- **Testing**: Vitest for unit tests, Playwright for end-to-end checkout & logistics flows.

---

## 4. Database Indexing & Query Rules (PostgreSQL)

1. Follow the **ESR (Equality, Sort, Range)** rule for composite indexes:
   - Place exact-match columns first (`status`, `category_id`).
   - Place sorting columns second (`created_at DESC`, `price`).
   - Place range filters last (`price BETWEEN min AND max`).
2. Use **Partial Indexes** for active records:
   ```sql
   CREATE INDEX idx_products_active ON product (id, handle) WHERE status = 'published' AND deleted_at IS NULL;
   ```
3. Use **GIN Trigram Indexes** for fuzzy product search:
   ```sql
   CREATE INDEX idx_product_title_trgm ON product USING gin (title gin_trgm_ops);
   ```
4. Never perform raw string concatenation in SQL queries. Always use parameterized queries.

---

## 5. Security & Brute-Force Protocol

1. **Redis Sliding Window Rate Limiting**:
   - `auth`: 5 requests / 15 minutes.
   - `checkout/payment`: 3 requests / 10 minutes.
   - `search`: 60 requests / 1 minute.
2. **IP Lockout (IP Jail)**:
   - Track failed attempts by IP.
   - 5 consecutive failures = auto-insert into `security_ip_jail` with a 15-minute lock.
   - Repeated offenses escalate lock to 24 hours.
3. **Webhook Verification**:
   - Always verify Stripe signature (`stripe.webhooks.constructEvent`).
   - Always verify PayPal webhook signature headers.
   - Verify supplier webhook HMAC tokens.

---

## 6. Commands Reference

```bash
# Infrastructure
docker compose up -d

# Development
npm run dev

# Verification & Quality Gate
npm run typecheck
npm run lint
npm test
npm run test:e2e
```
