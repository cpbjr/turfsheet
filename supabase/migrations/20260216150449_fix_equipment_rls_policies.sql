-- Migration: Fix equipment table RLS policies to allow anonymous access
-- Date: 2026-02-16
-- Description: Drop restrictive authenticated-only policies and create permissive policies that allow all users (including anonymous)
-- Rollback: Recreate the authenticated-only policies

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Equipment are viewable by authenticated users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Equipment are creatable by authenticated users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Equipment are updatable by authenticated users" ON turfsheet.equipment;
DROP POLICY IF EXISTS "Equipment are deletable by authenticated users" ON turfsheet.equipment;

-- Create permissive policies for all users (matching jobs/staff pattern)
CREATE POLICY "Enable read access for all users" ON turfsheet.equipment
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for all users" ON turfsheet.equipment
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON turfsheet.equipment
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON turfsheet.equipment
    FOR DELETE
    USING (true);

-- Ensure GRANT permissions exist for anon and authenticated roles
GRANT ALL ON turfsheet.equipment TO anon, authenticated;
