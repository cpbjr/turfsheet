-- Migration: Fix sequence permissions for jobs and staff tables
-- Date: 2026-02-09
-- Description: Grant USAGE and SELECT on auto-increment sequences to anon and authenticated roles
-- Rollback: REVOKE USAGE, SELECT ON SEQUENCE turfsheet.jobs_id_seq FROM anon, authenticated;
--           REVOKE USAGE, SELECT ON SEQUENCE turfsheet.staff_id_seq FROM anon, authenticated;

-- Grant sequence permissions for jobs table
GRANT USAGE, SELECT ON SEQUENCE turfsheet.jobs_id_seq TO anon, authenticated;

-- Grant sequence permissions for staff table
GRANT USAGE, SELECT ON SEQUENCE turfsheet.staff_id_seq TO anon, authenticated;
