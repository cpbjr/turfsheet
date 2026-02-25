-- Migration: Create turfsheet schema and grant service_role access
-- Date: 2026-02-25
-- Purpose: 1) Ensure turfsheet schema exists (may have been dropped/never created via migrations)
--          2) Allow service_role key (used by Tom/OpenClaw) to read/write all turfsheet tables
-- Rollback: REVOKE ALL ON SCHEMA turfsheet FROM service_role;

-- Step 1: Ensure the turfsheet schema exists
-- (Original schema was managed via SQL editor; migration history was repaired as "applied"
--  but the CREATE SCHEMA migration may not have actually run)
CREATE SCHEMA IF NOT EXISTS turfsheet;

-- Step 2: Grant service_role schema-level access
GRANT USAGE ON SCHEMA turfsheet TO service_role;

-- Step 3: Grant table-level access on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA turfsheet TO service_role;

-- Step 4: Grant sequence access (needed for inserts with serial/identity columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA turfsheet TO service_role;

-- Step 5: Future-proof — auto-grant on any new tables/sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA turfsheet
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA turfsheet
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- Step 6: Reload PostgREST config to pick up the schema
NOTIFY pgrst, 'reload config';
