-- Migration: Create pesticide applications table for regulatory compliance
-- Date: 2026-02-24
-- Rollback: DROP TABLE IF EXISTS turfsheet.pesticide_applications CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.pesticide_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_date DATE NOT NULL,
    product_name TEXT NOT NULL,
    epa_registration_number TEXT,
    active_ingredient TEXT,
    application_rate TEXT NOT NULL,
    rate_unit TEXT DEFAULT 'oz/1000sqft',
    total_amount_used TEXT,
    area_applied TEXT NOT NULL,
    area_size TEXT,
    target_pest TEXT,
    method TEXT CHECK (method IS NULL OR method IN (
        'spray', 'granular', 'injection', 'drench', 'other'
    )),
    operator_id INTEGER REFERENCES turfsheet.staff(id) ON DELETE SET NULL,
    wind_speed TEXT,
    temperature TEXT,
    weather_conditions TEXT,
    rei_hours INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pesticide_app_date ON turfsheet.pesticide_applications(application_date DESC);
CREATE INDEX idx_pesticide_app_product ON turfsheet.pesticide_applications(product_name);
CREATE INDEX idx_pesticide_app_operator ON turfsheet.pesticide_applications(operator_id);

ALTER TABLE turfsheet.pesticide_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to pesticide_applications" ON turfsheet.pesticide_applications
    FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON turfsheet.pesticide_applications TO anon, authenticated;
