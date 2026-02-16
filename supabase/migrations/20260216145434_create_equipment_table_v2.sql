-- Migration: Create equipment table for inventory management (v2)
-- Date: 2026-02-16
-- Rollback: DROP TABLE IF EXISTS turfsheet.equipment CASCADE;

-- ============================================================
-- Equipment Table (inventory and asset tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS turfsheet.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Mowers', 'Carts', 'Tools', 'Other')),
    model TEXT,
    manufacturer TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Retired')),
    purchase_date DATE,
    purchase_cost NUMERIC(10, 2),
    maintenance_notes TEXT,
    last_serviced_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_equipment_category ON turfsheet.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON turfsheet.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON turfsheet.equipment(created_at DESC);

-- RLS Policies (authenticated users can read/write)
ALTER TABLE turfsheet.equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment are viewable by authenticated users"
    ON turfsheet.equipment FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Equipment are creatable by authenticated users"
    ON turfsheet.equipment FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Equipment are updatable by authenticated users"
    ON turfsheet.equipment FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Equipment are deletable by authenticated users"
    ON turfsheet.equipment FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON turfsheet.equipment TO anon, authenticated;

COMMENT ON TABLE turfsheet.equipment IS 'Equipment inventory and asset tracking';
