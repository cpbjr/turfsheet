-- Migration: Fix RLS policies for staff schedules to allow anon access
-- Date: 2026-02-14
-- Description: Updates RLS policies to allow anon users to insert/update staff schedules
-- Rollback: Revert to authenticated-only policies

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to insert staff schedules" ON turfsheet.staff_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to update staff schedules" ON turfsheet.staff_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to delete staff schedules" ON turfsheet.staff_schedules;
DROP POLICY IF EXISTS "Allow authenticated users to update default schedule" ON turfsheet.default_schedule;

-- Create new policies allowing anon access
CREATE POLICY "Allow all users to insert staff schedules"
    ON turfsheet.staff_schedules
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all users to update staff schedules"
    ON turfsheet.staff_schedules
    FOR UPDATE
    USING (true);

CREATE POLICY "Allow all users to delete staff schedules"
    ON turfsheet.staff_schedules
    FOR DELETE
    USING (true);

CREATE POLICY "Allow all users to update default schedule"
    ON turfsheet.default_schedule
    FOR UPDATE
    USING (true);
