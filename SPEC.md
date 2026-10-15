# SAN Furniture – Comprehensive Domain & System Specification (SPEC.md)

## 1. Brand Identity & Design Tokens

### Brand Personality
**SAN Furniture** represents modern British living: refined architectural minimalism, warmth, craftsmanship, and understated luxury.
- **Tagline**: *"Crafted for British Living"*
- **Tone**: Sophisticated, trustworthy, reassuring, and transparent.

### Design Tokens

#### Color Palette
| Token Name | Hex Code | HSL | Semantic Role |
| :--- | :--- | :--- | :--- |
| `--color-navy-950` | `#070D1E` | `225, 62%, 7%` | Ultra-deep background, primary text on light mode |
| `--color-navy-900` | `#0B132B` | `226, 59%, 11%` | Brand Primary: Header, primary CTA buttons, footer |
| `--color-navy-800` | `#1C2541` | `225, 40%, 18%` | Secondary Navy: Borders, hover states, card backdrops |
| `--color-sand-50` | `#FAF8F5` | `38, 33%, 97%` | Body background (Warm Sand / Limestone) |
| `--color-sand-100` | `#F4F1EA` | `43, 29%, 94%` | Card background, input backgrounds, subtle contrast |
| `--color-sand-200` | `#E8E2D5` | `42, 26%, 87%` | Dividers, subtle borders, inactive tab lines |
| `--color-brass-500` | `#C89B3C` | `41, 56%, 51%` | Brand Accent (Signature Gold/Brass): Star ratings, badge accents |
| `--color-brass-600` | `#B5882D` | `41, 60%, 44%` | Hover brass, active focus highlights |
| `--color-sage-700` | `#2D6A4F` | `153, 40%, 30%` | Trust & Compliance: "In Stock", "Fire Safety Certified", "Free UK Delivery" |
| `--color-crimson-600`| `#DC2626` | `0, 72%, 51%` | Security alerts, out-of-stock badges, error states |

#### Typography
- **Display / Headings**: `Outfit`, `sans-serif` (weights: 500, 600, 700). Clean geometric proportions with British editorial elegance.
- **Body / Interface**: `Inter`, `sans-serif` (weights: 400, 500, 600). Crisp legibility at small sizes, optimal tabular numbers (`font-variant-numeric: tabular-nums`).

#### Spacing & Geometry
- **Border Radii**:
  - Small elements (buttons, inputs): `6px` (`rounded-md`)
  - Product cards & modals: `12px` (`rounded-xl`)
  - Flyout drawers & banners: `16px` (`rounded-2xl`)
- **Elevation / Shadows**:
  - Ambient Card: `0 4px 20px -2px rgba(11, 19, 43, 0.05)`
  - Hover Elevation: `0 12px 32px -4px rgba(11, 19, 43, 0.12)`
  - Drawer / Modal: `0 24px 64px -12px rgba(7, 13, 30, 0.25)`

---

## 2. Furniture Domain Entities & Data Model

Every furniture SKU in SAN Furniture is represented with exact real-world attributes:

### A. Dimensions & Physical Metrics
```typescript
interface FurnitureDimensions {
  width_cm: number;          // e.g. 210.0 cm
  height_cm: number;         // e.g. 85.0 cm
  depth_cm: number;          // e.g. 95.0 cm
  seat_height_cm?: number;   // e.g. 48.0 cm (for chairs, sofas, stools)
  seat_depth_cm?: number;    // e.g. 60.0 cm (for sofas)
  arm_height_cm?: number;    // e.g. 65.0 cm
  weight_kg: number;         // e.g. 58.5 kg
  packaged_boxes: {
    box_number: number;
    box_width_cm: number;
    box_height_cm: number;
    box_depth_cm: number;
    box_weight_kg: number;
  }[];
}
```

### B. Materials, Swatches & Finishes
- **Upholstery Materials**: `Bouclé`, `Velvet`, `Linen Blend`, `Chenille`, `Top-Grain Leather`, `Faux Leather`, `Wool Blend`.
- **Frame Materials**: `Solid Oak`, `American Walnut`, `Engineered Hardwood`, `Powder-Coated Steel`, `Brushed Brass`.
- **Color Families**: `Neutral/Cream`, `Charcoal/Grey`, `Forest Green`, `Navy Blue`, `Rust/Terracotta`, `Mustard/Gold`, `Ochre`.
- **Fabric Swatches**: Each variant must store high-resolution texture URLs (`swatch_thumbnail_url`, `swatch_zoom_url`) to enable swatch ordering for prospective customers.

### C. Assembly & Room Clearance
- `assembly_required`: `boolean` (e.g., `false` for assembled sofas, `true` for flatpack tables).
- `assembly_time_mins`: estimated time (e.g. `20` mins).
- `doorway_clearance_min_cm`: minimum door width required for delivery entry (crucial for UK terraced houses and apartments).

### D. UK Fire Safety Compliance
Under the **Furniture and Furnishings (Fire Safety) Regulations 1988 (as amended)**:
- Every upholstered item must have:
  - `fire_safety_compliant`: `boolean` (MUST be `true` to be published).
  - `fire_safety_standard`: e.g., `"BS 5852: Part 1: 1979 (Cigarette & Match Test)"` or `"BS 7176: Low/Medium Hazard"`.
  - `fire_label_display`: `boolean` (specifies permanent swing label attached).

---

## 3. UK Logistics & Postcode Surcharge Matrix

### A. Delivery Tiers
1. **`standard_parcel`**:
   - For small home accessories, cushions, lighting, side tables (< 25kg, < 1.2m length).
   - Couriers: DPD Local, Parcelforce, Royal Mail 24/48.
   - Lead Time: 2 - 4 business days.
2. **`pallet`**:
   - For heavy flatpack items, stone/marble dining tables, TV consoles (25kg - 100kg).
   - Delivery: Kerbside pallet drop with tail-lift.
   - Lead Time: 4 - 7 business days.
3. **`two_man_white_glove`**:
   - For fully assembled sofas, corner groups, large wardrobes, luxury beds.
   - Delivery: 2 trained drivers, carry to room of choice (up to 3 flights of stairs), unbox, assemble (optional), and remove packaging.
   - Lead Time: 7 - 14 business days (pre-booked 2-hour delivery window via SMS).

### B. UK Postcode Surcharge Zones
| Zone | Region Description | Postcode Prefix Regex | Courier Surcharge |
| :--- | :--- | :--- | :--- |
| **Zone 1** | UK Mainland Standard | England, Wales, Southern Scotland | `£0.00` (Free Delivery Threshold: £500) |
| **Zone 2** | Scottish Highlands | `^(IV\|KW1-14\|PA34\|PA37-39\|PH19-26\|PH30-40\|PH49-50)` | `+£35.00` (Parcel) / `+£65.00` (2-Man) |
| **Zone 3** | Scottish Offshore Islands | `^(HS\|ZE\|KW15-17\|PA20\|PA41-49\|PA60-78\|PH41-44\|KA27-28)` | `+£55.00` (Parcel) / `+£95.00` (Pallet only) |
| **Zone 4** | Northern Ireland | `^BT` | `+£40.00` (Parcel) / `+£85.00` (Pallet) |
| **Zone 5** | Isle of Man & Scilly | `^(IM\|TR21-25)` | `+£50.00` |
| **Excluded**| Channel Islands | `^(GY\|JE)` | Not serviced initially (Customs border) |

---

## 4. UK Financial & VAT Specifications

1. **Integer Penny Storage**:
   - Database stores all financial values in integer pennies (`pennies`).
   - Example: `£1,249.00` is stored as `124900`.
2. **20% UK VAT Calculation**:
   - All customer-facing prices are **VAT inclusive**.
   - Net Price = $\text{Gross Price} \div 1.20$.
   - VAT Amount = $\text{Gross Price} - \text{Net Price}$.
   - Example on `£600.00` (`60000` pence):
     - Net: `£500.00` (`50000` pence)
     - VAT (20%): `£100.00` (`10000` pence)
3. **Automated UK VAT Invoicing**:
   - Every confirmed order generates an immutable PDF VAT Invoice showing:
     - SAN Furniture registered business name and UK address.
     - UK VAT Registration Number (`GB XXX XXXX XX`).
     - Sequential Invoice Number (e.g. `SAN-INV-2026-0001`).
     - Line items, net subtotal, VAT @ 20.00%, and gross total in GBP.

---

## 5. Automated Dropshipping & Margin Guard Formula

To prevent selling at a loss due to shipping spikes, platform fees, or supplier price increases:

$$\text{Retail Price (pennies)} = \text{round}\left( \frac{(\text{Cost Price} + \text{Supplier Carriage}) \times (1 + \text{Target Margin \%})}{1 - \text{Stripe Fee (0.015 + 0.20)}} \times 1.20 \right)$$

### Rules:
1. **Minimum Floor Margin**: Default is `25%` gross margin after supplier cost and carriage.
2. **Margin Alarm**: If a supplier updates their feed with a cost price jump that causes gross margin to dip below `15%`:
   - System flags product in the Admin Feed Health Dashboard.
   - Retail price is NOT automatically lowered.
   - Status remains `published` but an alert notification is dispatched to ops.
3. **Stock Reconcile**:
   - If supplier feed reports `stock = 0`, product variant is immediately marked `out_of_stock`.
   - If all variants of a product have `stock = 0`, storefront automatically marks product as *"Temporarily Out of Stock – Back in X weeks"* with an email back-in-stock notification form.

---

## 6. Programmatic SEO Safe Scaling Architecture

To scale 500+ high-intent landing pages (e.g., `/sofas/corner-sofas`, `/dining-tables/solid-oak-extendable`) without triggering Google's **"Scaled Content Abuse"** or **"Thin Content"** manual actions:

1. **The 4-Product Minimum Rule**:
   - A programmatic filter page is ONLY indexed if there are at least **4 unique in-stock products** matching the exact query.
   - If matching items `< 4`, the page automatically sets `<meta name="robots" content="noindex, follow">` and sets its canonical link to the parent category (e.g. `/sofas`).
2. **Rich Structured Data (Schema.org JSON-LD)**:
   - Every PDP includes `Product`, `Offer`, `AggregateRating`, `Brand`, and `ShippingDetails`.
   - Every Category page includes `ItemList` and `BreadcrumbList`.
   - FAQ sections include `FAQPage` schema.
3. **Dynamic Split Sitemap**:
   - Root index: `/sitemap.xml`
   - Child sitemaps: `/sitemap-products.xml`, `/sitemap-categories.xml`, `/sitemap-guides.xml`.
   - Cached in Redis with a 6-hour TTL and refreshed on product create/update.
