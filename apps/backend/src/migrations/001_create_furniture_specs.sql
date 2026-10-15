-- =============================================================================
-- Migration 001: Create Furniture Domain Tables
-- SAN Furniture (UK)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Product Categories Table
CREATE TABLE IF NOT EXISTS product_categories (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    handle VARCHAR(255) NOT NULL UNIQUE,
    parent_category_id VARCHAR(100) REFERENCES product_categories(id) ON DELETE SET NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Core Products Table (Mirroring Medusa commerce product with integer pence)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    handle VARCHAR(255) NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT,
    category_id VARCHAR(100) REFERENCES product_categories(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'published', -- 'draft', 'published', 'out_of_stock', 'archived'
    price_pennies INT NOT NULL,                      -- Stored in pence (£1,299.00 = 129900)
    compare_at_price_pennies INT,
    vat_rate_percent NUMERIC(4, 2) NOT NULL DEFAULT 20.00,
    is_fire_safety_certified BOOLEAN NOT NULL DEFAULT TRUE,
    gtin_barcode VARCHAR(50),
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 3. Furniture Specialized Specifications Table
CREATE TABLE IF NOT EXISTS furniture_specs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(255) NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    width_cm NUMERIC(6, 2) NOT NULL CHECK (width_cm > 0),
    height_cm NUMERIC(6, 2) NOT NULL CHECK (height_cm > 0),
    depth_cm NUMERIC(6, 2) NOT NULL CHECK (depth_cm > 0),
    seat_height_cm NUMERIC(6, 2) CHECK (seat_height_cm > 0),
    seat_depth_cm NUMERIC(6, 2) CHECK (seat_depth_cm > 0),
    arm_height_cm NUMERIC(6, 2) CHECK (arm_height_cm > 0),
    weight_kg NUMERIC(6, 2) NOT NULL CHECK (weight_kg > 0),
    material VARCHAR(100) NOT NULL,
    frame_material VARCHAR(100) NOT NULL,
    color VARCHAR(100) NOT NULL,
    assembly_required BOOLEAN NOT NULL DEFAULT FALSE,
    assembly_time_mins INT,
    doorway_clearance_min_cm NUMERIC(6, 2),
    delivery_tier VARCHAR(50) NOT NULL DEFAULT 'two_man_white_glove', -- 'standard_parcel', 'pallet', 'two_man_white_glove'
    fire_safety_compliant BOOLEAN NOT NULL DEFAULT TRUE,              -- UK Furniture & Furnishings Fire Safety Regs 1988
    fire_safety_standard VARCHAR(255) NOT NULL DEFAULT 'BS 5852: Part 1: 1979 (Cigarette & Match Test)',
    fire_safety_certificate VARCHAR(255) NOT NULL,
    lead_time_days INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Packaged Courier Boxes for Pallet & Volume Calculation
CREATE TABLE IF NOT EXISTS furniture_packaged_boxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    furniture_spec_id UUID NOT NULL REFERENCES furniture_specs(id) ON DELETE CASCADE,
    box_number INT NOT NULL,
    width_cm NUMERIC(6, 2) NOT NULL,
    height_cm NUMERIC(6, 2) NOT NULL,
    depth_cm NUMERIC(6, 2) NOT NULL,
    weight_kg NUMERIC(6, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Supplier Dropship Inventory Link
CREATE TABLE IF NOT EXISTS supplier_feed_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(100) NOT NULL,
    supplier_sku VARCHAR(255) NOT NULL,
    internal_product_id VARCHAR(255) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    cost_price_pennies INT NOT NULL CHECK (cost_price_pennies > 0),
    shipping_cost_pennies INT NOT NULL DEFAULT 0,
    markup_percentage NUMERIC(5, 2) NOT NULL DEFAULT 35.00,
    retail_price_pennies INT NOT NULL,
    stock_level INT NOT NULL DEFAULT 0,
    lead_time_days INT NOT NULL DEFAULT 3,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(supplier_id, supplier_sku)
);

-- 6. Security IP Jail & Brute Force Lockout
CREATE TABLE IF NOT EXISTS security_ip_jail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL UNIQUE,
    failed_attempts INT NOT NULL DEFAULT 1,
    locked_until TIMESTAMPTZ,
    reason VARCHAR(255) NOT NULL,
    is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
    user_agent TEXT,
    country_code VARCHAR(2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
