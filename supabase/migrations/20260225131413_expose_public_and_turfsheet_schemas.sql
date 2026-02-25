-- Migration: Expose both public and turfsheet schemas via PostgREST
-- Date: 2026-02-25
-- Purpose: This Supabase instance is shared between projects. Other projects
--          (e.g. BanburyMaintenance) use the public schema. Previous migration
--          restricted to turfsheet only, locking out other projects.
-- Rollback: ALTER ROLE authenticator SET pgrst.db_schemas = 'turfsheet';

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, turfsheet';
NOTIFY pgrst, 'reload config';
