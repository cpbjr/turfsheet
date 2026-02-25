-- Migration: Expose maintenance schema to PostgREST API
-- Date: 2026-02-24
-- Purpose: Make the maintenance schema accessible via Supabase REST API
-- Rollback: Run the previous configuration or remove maintenance from db_schemas

-- Update the PostgREST role to include the maintenance schema in exposed schemas
ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,storage,graphql_public,maintenance';

-- Notify PostgREST to reload its configuration
NOTIFY pgrst, 'reload config';
