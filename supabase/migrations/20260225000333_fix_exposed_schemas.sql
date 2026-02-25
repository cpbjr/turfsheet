-- Migration: Fix exposed schemas - add turfsheet back
-- Date: 2026-02-25
-- Rollback: ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,storage,graphql_public,maintenance';

ALTER ROLE authenticator SET pgrst.db_schemas TO 'public,storage,graphql_public,turfsheet,maintenance';

NOTIFY pgrst, 'reload config';
