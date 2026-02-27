-- Migration: Create spray_mix_templates table
-- Date: 2026-02-26
-- Rollback: DROP TABLE IF EXISTS turfsheet.spray_mix_templates;

CREATE TABLE IF NOT EXISTS turfsheet.spray_mix_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    area_sqft NUMERIC(12,2),
    tank_size_gal NUMERIC(8,2),
    carrier_rate NUMERIC(6,2) DEFAULT 2.0,
    products JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE turfsheet.spray_mix_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to spray_mix_templates" ON turfsheet.spray_mix_templates
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON turfsheet.spray_mix_templates TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.spray_mix_templates_id_seq TO anon, authenticated;
