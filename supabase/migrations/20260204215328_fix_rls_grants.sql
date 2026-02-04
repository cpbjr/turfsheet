-- Migration: Fix RLS - Grant SELECT permissions to anon role
-- Date: 2026-02-04
-- Description: Grant SELECT permissions to the anon role on jobs and staff tables to work with RLS policies
-- Rollback: REVOKE SELECT ON public.jobs, public.staff FROM anon;

-- Grant SELECT permissions to anon role on both tables
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT ON public.staff TO anon;
