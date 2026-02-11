-- Migration: Fix ALL sequence permissions + anon grants
-- Date: 2026-02-11
-- Rollback: REVOKE permissions (but these are needed for app to function)

-- Fix sequence permissions for anon and authenticated roles
GRANT USAGE, SELECT ON SEQUENCE turfsheet.jobs_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.staff_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.daily_assignments_id_seq TO anon, authenticated;

-- Ensure anon can CRUD daily_assignments (app uses anon key)
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO anon;

-- Reset sequences to avoid duplicate key errors
SELECT setval('turfsheet.jobs_id_seq', COALESCE((SELECT MAX(id) FROM turfsheet.jobs), 0) + 1, false);
SELECT setval('turfsheet.staff_id_seq', COALESCE((SELECT MAX(id) FROM turfsheet.staff), 0) + 1, false);
