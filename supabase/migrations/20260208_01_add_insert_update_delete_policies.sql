-- Migration: Add INSERT, UPDATE, DELETE RLS policies for jobs and staff tables
-- Date: 2026-02-06
-- Description: Enable write operations on staff and jobs tables by adding RLS policies for INSERT, UPDATE, and DELETE operations

-- Add INSERT policy for jobs table (allow all inserts)
CREATE POLICY "Enable insert access for all users" ON turfsheet.jobs
    FOR INSERT
    WITH CHECK (true);

-- Add UPDATE policy for jobs table (allow all updates)
CREATE POLICY "Enable update access for all users" ON turfsheet.jobs
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Add DELETE policy for jobs table (allow all deletes)
CREATE POLICY "Enable delete access for all users" ON turfsheet.jobs
    FOR DELETE
    USING (true);

-- Add INSERT policy for staff table (allow all inserts)
CREATE POLICY "Enable insert access for all users" ON turfsheet.staff
    FOR INSERT
    WITH CHECK (true);

-- Add UPDATE policy for staff table (allow all updates)
CREATE POLICY "Enable update access for all users" ON turfsheet.staff
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Add DELETE policy for staff table (allow all deletes)
CREATE POLICY "Enable delete access for all users" ON turfsheet.staff
    FOR DELETE
    USING (true);

-- Grant INSERT, UPDATE, DELETE permissions to anon role on both tables
GRANT INSERT, UPDATE, DELETE ON turfsheet.jobs TO anon;
GRANT INSERT, UPDATE, DELETE ON turfsheet.staff TO anon;
GRANT INSERT, UPDATE, DELETE ON turfsheet.jobs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON turfsheet.staff TO authenticated;
