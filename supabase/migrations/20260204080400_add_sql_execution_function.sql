-- Migration: Add SQL execution function
-- Date: 2026-02-04
-- Description: Create execute_sql function for MCP-as-code tool compatibility
-- Rollback: DROP FUNCTION IF EXISTS public.execute_sql(text);

CREATE OR REPLACE FUNCTION public.execute_sql(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE query_text INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO anon;
