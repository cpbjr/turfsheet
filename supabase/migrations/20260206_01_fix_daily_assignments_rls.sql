-- Migration: Fix RLS policies for daily_assignments table
-- Date: 2026-02-06
-- Rollback: DROP POLICY IF EXISTS "Allow authenticated users to select daily_assignments" ON turfsheet.daily_assignments; DROP POLICY IF EXISTS "Allow authenticated users to insert daily_assignments" ON turfsheet.daily_assignments; DROP POLICY IF EXISTS "Allow authenticated users to update daily_assignments" ON turfsheet.daily_assignments; DROP POLICY IF EXISTS "Allow authenticated users to delete daily_assignments" ON turfsheet.daily_assignments;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all access to daily_assignments" ON turfsheet.daily_assignments;

-- Create more explicit RLS policies
CREATE POLICY "Allow authenticated users to select daily_assignments" ON turfsheet.daily_assignments
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert daily_assignments" ON turfsheet.daily_assignments
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update daily_assignments" ON turfsheet.daily_assignments
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete daily_assignments" ON turfsheet.daily_assignments
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Ensure grants are set correctly
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO authenticated;
GRANT USAGE, CREATE ON SCHEMA turfsheet TO authenticated;
