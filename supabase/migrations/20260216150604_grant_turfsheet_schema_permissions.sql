-- Migration: Grant schema usage permissions for turfsheet schema
-- Date: 2026-02-16
-- Description: Grant USAGE and CREATE permissions on turfsheet schema to anon and authenticated roles
-- Rollback: REVOKE USAGE, CREATE ON SCHEMA turfsheet FROM anon, authenticated;

-- Grant schema usage and create permissions (matching other tables pattern)
GRANT USAGE, CREATE ON SCHEMA turfsheet TO anon, authenticated;

-- Ensure all permissions on equipment table
GRANT ALL ON turfsheet.equipment TO anon, authenticated;
