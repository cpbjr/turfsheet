-- ============================================================
-- EQUIPMENT TABLE MIGRATION
-- Run this in Supabase SQL Editor if migrations haven't been applied
-- ============================================================

-- Ensure turfsheet schema exists
CREATE SCHEMA IF NOT EXISTS turfsheet;

-- Grant schema permissions
GRANT USAGE ON SCHEMA turfsheet TO anon, authenticated;
GRANT CREATE ON SCHEMA turfsheet TO anon, authenticated;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION turfsheet.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop equipment table if it exists (to start fresh)
DROP TABLE IF EXISTS turfsheet.equipment CASCADE;

-- Create equipment table
CREATE TABLE turfsheet.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    equipment_number TEXT,
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_equipment_category ON turfsheet.equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON turfsheet.equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON turfsheet.equipment(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_number ON turfsheet.equipment(equipment_number);

-- Create trigger for updated_at
CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON turfsheet.equipment
    FOR EACH ROW
    EXECUTE FUNCTION turfsheet.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE turfsheet.equipment ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Enable insert for all users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Enable update for all users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Enable delete for all users" ON turfsheet.equipment;

-- Create RLS policies (permissive - matching jobs/staff pattern)
CREATE POLICY "Enable read access for all users"
    ON turfsheet.equipment FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users"
    ON turfsheet.equipment FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users"
    ON turfsheet.equipment FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users"
    ON turfsheet.equipment FOR DELETE
    USING (true);

-- Grant permissions to anon and authenticated roles
GRANT ALL ON turfsheet.equipment TO anon, authenticated;

-- Add table comment
COMMENT ON TABLE turfsheet.equipment IS 'Equipment inventory and asset tracking';

-- Verify the table was created
SELECT
    'Equipment table created successfully!' as message,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'turfsheet'
AND table_name = 'equipment';

-- Show table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'turfsheet'
AND table_name = 'equipment'
ORDER BY ordinal_position;
