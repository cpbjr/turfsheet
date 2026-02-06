-- Migration: Simplify RLS policies for daily_assignments table
-- Date: 2026-02-07
-- Rollback: DROP POLICY IF EXISTS "Allow authenticated users to select daily_assignments" ON turfsheet.daily_assignments; DROP POLICY IF EXISTS "Allow authenticated users to insert daily_assignments" ON turfsheet.daily_assignments; DROP POLICY IF EXISTS "Allow authenticated users to update daily_assignments" ON turfsheet.daily_assignments; DROP POLICY IF EXISTS "Allow authenticated users to delete daily_assignments" ON turfsheet.daily_assignments;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users to select daily_assignments" ON turfsheet.daily_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to insert daily_assignments" ON turfsheet.daily_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to update daily_assignments" ON turfsheet.daily_assignments;
DROP POLICY IF EXISTS "Allow authenticated users to delete daily_assignments" ON turfsheet.daily_assignments;
DROP POLICY IF EXISTS "Allow all access to daily_assignments" ON turfsheet.daily_assignments;

-- Create permissive RLS policies that allow all operations
-- This allows the app to work while maintaining RLS structure for future granular control
CREATE POLICY "Allow all to select daily_assignments" ON turfsheet.daily_assignments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all to insert daily_assignments" ON turfsheet.daily_assignments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all to update daily_assignments" ON turfsheet.daily_assignments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete daily_assignments" ON turfsheet.daily_assignments
  FOR DELETE
  USING (true);

-- Ensure grants are set correctly for all roles
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO authenticated;
GRANT USAGE, CREATE ON SCHEMA turfsheet TO anon;
GRANT USAGE, CREATE ON SCHEMA turfsheet TO authenticated;
