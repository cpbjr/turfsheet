-- ============================================================
-- FINAL EQUIPMENT TABLE MIGRATION
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop any existing equipment tables
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS turfsheet.equipment CASCADE;

-- Step 2: Ensure turfsheet schema exists
CREATE SCHEMA IF NOT EXISTS turfsheet;

-- Step 3: Grant schema permissions
GRANT USAGE ON SCHEMA turfsheet TO anon, authenticated;
GRANT CREATE ON SCHEMA turfsheet TO anon, authenticated;

-- Step 4: Ensure update trigger function exists
CREATE OR REPLACE FUNCTION turfsheet.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create equipment table with ALL columns including equipment_number
CREATE TABLE turfsheet.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    equipment_number TEXT,  -- THIS IS THE KEY COLUMN!
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

-- Step 6: Create indexes
CREATE INDEX idx_equipment_category ON turfsheet.equipment(category);
CREATE INDEX idx_equipment_status ON turfsheet.equipment(status);
CREATE INDEX idx_equipment_created_at ON turfsheet.equipment(created_at DESC);
CREATE INDEX idx_equipment_number ON turfsheet.equipment(equipment_number);

-- Step 7: Create trigger for updated_at
CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON turfsheet.equipment
    FOR EACH ROW
    EXECUTE FUNCTION turfsheet.update_updated_at_column();

-- Step 8: Enable Row Level Security
ALTER TABLE turfsheet.equipment ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
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

-- Step 10: Grant permissions
GRANT ALL ON turfsheet.equipment TO anon, authenticated;

-- Step 11: Add comment
COMMENT ON TABLE turfsheet.equipment IS 'Equipment inventory and asset tracking';

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check that table was created
SELECT
    'Equipment table created!' as message,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'turfsheet'
AND table_name = 'equipment';

-- Show all columns (verify equipment_number exists)
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'turfsheet'
AND table_name = 'equipment'
ORDER BY ordinal_position;

-- Test insert (THIS WILL FAIL if equipment_number column is missing!)
INSERT INTO turfsheet.equipment (name, equipment_number, category, status, manufacturer, model, description)
VALUES ('Test Mower', '001', 'Mowers', 'Active', 'Toro', 'Groundsmaster', 'Test equipment - DELETE ME')
RETURNING id, name, equipment_number, category, status;

-- Clean up test data
DELETE FROM turfsheet.equipment WHERE equipment_number = '001';

SELECT 'Migration complete! Equipment table is ready.' as status;
