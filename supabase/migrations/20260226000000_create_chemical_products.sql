-- Migration: Create chemical_products table for product library
-- Date: 2026-02-26
-- Purpose: Store product catalog with label rates for spray calculations
-- Rollback: DROP TABLE IF EXISTS turfsheet.chemical_products CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.chemical_products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'FERTILIZER', 'HERBICIDE', 'FUNGICIDE', 'INSECTICIDE',
        'PGR', 'ALGAECIDE', 'IRON_SUPPLEMENT', 'SURFACTANT', 'OTHER'
    )),
    manufacturer TEXT,
    epa_registration TEXT,
    active_ingredient TEXT,
    concentration_pct NUMERIC(6,3),       -- e.g. 47.2 for 2,4-D Amine
    analysis TEXT,                          -- e.g. "20-5-30" for fertilizer
    rei_hours INTEGER DEFAULT 0,
    default_rate NUMERIC(10,4),            -- e.g. 1.5
    rate_unit TEXT DEFAULT 'oz/1000sqft',  -- oz/1000sqft, lbs/1000sqft, lbs/acre, oz/acre, ppm
    carrier_volume_gal NUMERIC(8,2) DEFAULT 2.0, -- gallons of water per 1000 sq ft
    signal_word TEXT CHECK (signal_word IS NULL OR signal_word IN (
        'CAUTION', 'WARNING', 'DANGER'
    )),
    warnings TEXT,                     -- Key warnings/cautions from the label
    max_wind_mph INTEGER,              -- Max wind speed for application (from label)
    min_temp_f INTEGER,                -- Minimum application temp (from label)
    max_temp_f INTEGER,                -- Maximum application temp (from label)
    rain_delay_hours INTEGER,          -- Hours before rain needed after application
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chemical_products_name ON turfsheet.chemical_products(name);
CREATE INDEX idx_chemical_products_type ON turfsheet.chemical_products(type);

ALTER TABLE turfsheet.chemical_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to chemical_products" ON turfsheet.chemical_products
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON turfsheet.chemical_products TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.chemical_products_id_seq TO anon, authenticated;

-- Seed with products from user's photos
INSERT INTO turfsheet.chemical_products (name, type, manufacturer, epa_registration, active_ingredient, concentration_pct, default_rate, rate_unit, carrier_volume_gal, signal_word, warnings, max_wind_mph, min_temp_f, max_temp_f, rain_delay_hours, notes) VALUES
    ('Cutrine Plus Granular', 'ALGAECIDE', 'Applied Biochemists', '8959-11', 'Copper Ethanolamine Complex', 10.7, 60, 'lbs/acre', 0, 'DANGER', 'Corrosive. Causes irreversible eye damage. Harmful if swallowed or absorbed through skin. Do not contaminate water used for irrigation or domestic purposes. Do not apply when fish are spawning.', 15, NULL, NULL, NULL, 'Granular algaecide for ponds/lakes. Apply directly, no carrier water.'),
    ('2,4-D Amine', 'HERBICIDE', 'Alligare', '81927-23', '2,4-Dichlorophenoxyacetic acid', 47.2, 1.5, 'oz/1000sqft', 2, 'DANGER', 'Causes irreversible eye damage. Harmful if swallowed, inhaled, or absorbed through skin. Do not apply when wind speeds exceed 15 mph. Do not apply when temperatures exceed 85F to avoid volatilization and drift. Avoid spray drift to desirable plants. Do not apply to newly seeded areas until after third mowing.', 15, 50, 85, 24, 'Selective broadleaf weed killer.'),
    ('Nutriculture Hi-Nitrate Special 20-5-30', 'FERTILIZER', 'Plant Marvel', NULL, NULL, NULL, 6, 'oz/1000sqft', 2, 'CAUTION', 'Avoid contact with eyes and skin. May cause eye irritation. Apply when turf is dry to avoid foliar burn. Water in lightly after application in hot weather.', NULL, NULL, 90, NULL, 'Soluble fertilizer with trace elements. Analysis: 20-5-30.'),
    ('Nutriculture Spoon-Feeding Formula', 'FERTILIZER', 'Plant Marvel', NULL, NULL, NULL, 3, 'oz/1000sqft', 2, 'CAUTION', 'Avoid contact with eyes. May cause foliar burn at high rates or in hot temperatures above 90F. Apply during cooler parts of the day in summer.', NULL, NULL, 90, NULL, 'Light-rate soluble fertilizer for spoon-feeding programs.'),
    ('Extreme Green 20', 'IRON_SUPPLEMENT', NULL, NULL, 'Iron (20%), Sulfur (12%)', 20, 3, 'oz/1000sqft', 2, 'CAUTION', 'Will stain concrete, clothing, and equipment. Avoid application to sidewalks and cart paths. May cause temporary darkening of turf. Avoid application during extreme heat above 90F.', NULL, NULL, 90, NULL, 'Iron supplement for turf color. 20% Fe, 12% S.');
