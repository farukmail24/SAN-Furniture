# CLAUDE.md – AI Engineering Guidelines for SAN Furniture (UK)

Welcome, AI Engineer. You are building **SAN Furniture**, an ultra-premium UK dropshipping furniture platform. Strictly follow these commands, code styles, and domain truths.

---

## 1. Core Verification Directive ("Done" is a Verified Claim)

- Never claim a task is completed without running actual builds, linters, and typechecks.
- Run `npm run typecheck` and verify **0 errors**.
- Run `npm test` and verify all tests pass.
- If anything fails, fix the root cause immediately before reporting.

---

## 2. Common Commands

```bash
# Workspace root
npm install                  # Install all dependencies across monorepo
npm run typecheck            # Run TypeScript typecheck across packages & apps
npm run lint                 # Run ESLint across apps
npm test                     # Run unit tests (Vitest)

# Docker Services (MySQL runs locally through XAMPP)
docker compose up -d         # Start Redis and Meilisearch
docker compose ps            # Check health status of containers
docker compose down          # Stop Redis and Meilisearch

# Development
npm run dev                  # Start both Storefront (Next.js) & custom Node.js backend
```

---

## 3. Technology Stack & Key Conventions

- **Storefront**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion.
- **Backend**: Custom Node.js commerce API, BullMQ, Redis.
- **Database**: MySQL 8 / MariaDB only, accessed through `mysql2`; local development uses XAMPP on port 3306.
- **Search**: Meilisearch client.
- **Validation**: Zod (all schemas strictly defined in `packages/types`).
- **Security**: Argon2id for password hashing, Redis sliding-window rate limit, Cloudflare Turnstile token verification.
- **Testing**: Vitest for unit tests, Playwright for E2E checkout & logistics.

---

## 4. UK Domain Truths & Invariants

1. **Currency**: Always GBP (`£`). Internal prices in database MUST be stored in **integer pennies** (`pennies`). Example: `£499.00` = `49900`.
2. **VAT**: Customer-facing prices always include **20% UK VAT**.
3. **Dimensions**: Recorded in centimetres (`width_cm`, `height_cm`, `depth_cm`, `seat_height_cm`).
4. **Weight**: Recorded in kilograms (`weight_kg`).
5. **Delivery Tiers**: `standard_parcel` (small décor/stools), `pallet` (dining tables, flatpack), `two_man_white_glove` (assembled sofas, bulky wardrobes).
6. **Postcode Surcharge Zones**: Mainland UK vs. Scottish Highlands (`IV`, `KW`, `HS`), Northern Ireland (`BT`), Channel Islands (`GY`, `JE`).
7. **Compliance**: Every upholstered item MUST have `fire_safety_compliant: true` per UK Furniture and Furnishings (Fire Safety) Regulations 1988 (BS 5852).

---

## 5. MySQL Indexing Rules

- Indexes must match measured MySQL query patterns and be checked with `EXPLAIN`; do not use PostgreSQL-only partial or GIN indexes.
- Use MySQL `FULLTEXT` where suitable or Meilisearch for fuzzy catalog search.
- Never perform raw string concatenation in SQL queries. Always use parameterized queries.
