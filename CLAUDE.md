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

# Docker Services
docker compose up -d         # Start PostgreSQL, Redis, Meilisearch
docker compose ps            # Check health status of containers
docker compose down          # Stop containers

# Development
npm run dev                  # Start both Storefront (Next.js) & Backend (Medusa) in dev mode
```

---

## 3. Technology Stack & Key Conventions

- **Storefront**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, Lucide Icons, Framer Motion.
- **Backend**: Medusa v2, Node.js, BullMQ, Redis.
- **Database**: PostgreSQL 16 with `pg_trgm` and `uuid-ossp`.
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

## 5. PostgreSQL Indexing Rules (ESR)

- Composite Indexes MUST follow the **ESR Rule**: **E**quality first (`status = 'published'`), **S**ort second (`created_at DESC`), **R**ange last (`price BETWEEN min AND max`).
- Always use Partial Indexes for active catalog items (`WHERE status = 'published' AND deleted_at IS NULL`).
- Never perform raw string concatenation in SQL queries. Always use parameterized queries.
