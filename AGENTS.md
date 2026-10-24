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
│   └── backend/                 # Node.js commerce API, MySQL, BullMQ
├── packages/
│   ├── types/                   # Zod schemas & TypeScript interfaces (single source of truth)
│   └── config/                  # Shared ESLint, Prettier, Tailwind configurations
├── docker-compose.yml           # Redis 7, Meilisearch (MySQL runs in XAMPP)
├── MASTER_PLAN.md               # Master phase-by-phase implementation plan
└── AGENTS.md                    # This file (AI instructions & rules)
```

---

## 3. Technology Stack & Mandatory Libraries

- **Language**: TypeScript strict mode (`"strict": true`, `"noImplicitAny": true`) & Node.js ES Modules.
- **Storefront**: Next.js 15 App Router, React 19, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend Runtime**: Node.js Commerce Server (`server.mjs`) on Port 9000, with BullMQ workers.
- **Database**: MySQL 8 / MariaDB only. Local development connects to the XAMPP service on port 3306; do not add PostgreSQL, Medusa, or PostgreSQL migrations.
- **Validation**: Zod schemas (`packages/types`) for all domain models, furniture specs, and address lookups.
- **Security**: PBKDF2 (100k rounds, SHA-512) / Argon2id for password hashing, sliding-window rate-limiting, Cloudflare Turnstile token verification, and automated IP Jail brute-force defense.
- **Testing**: Built-in Node test runner (`node --test`) for unit and integration tests across domain, logistics, and E2E launch phases.

---

## 4. Database Indexing & Query Rules (MySQL)

1. Add indexes only for measured query patterns. For catalog filtering, lead with equality columns such as `category_id` and `status`, then account for sorting/range columns using the actual MySQL query plan.
2. MySQL does not support PostgreSQL partial indexes or GIN trigram indexes. Use MySQL `FULLTEXT` where appropriate or Meilisearch for fuzzy product search.
3. Never perform raw string concatenation in SQL queries. Always use parameterized queries.

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
