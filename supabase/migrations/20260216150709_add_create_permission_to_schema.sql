-- Migration: Add CREATE permission on turfsheet schema
-- Date: 2026-02-16
-- Description: Grant CREATE permission on turfsheet schema to anon and authenticated roles (in addition to USAGE)
-- Rollback: REVOKE CREATE ON SCHEMA turfsheet FROM anon, authenticated;

-- Grant CREATE permission on schema (USAGE was already granted in previous migration)
GRANT CREATE ON SCHEMA turfsheet TO anon, authenticated;
