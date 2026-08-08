-- Migration: close the match_memory_chunks hole left open by 20260807200000
-- Date: 2026-08-08
-- Rollback: GRANT EXECUTE ON FUNCTION turfsheet.match_memory_chunks(
--               turfsheet.vector, integer, double precision, text, text, text, text) TO PUBLIC;
--
-- 20260807200000 revoked EXECUTE from anon, which removed anon=X from the ACL but did not
-- close the hole: Supabase grants EXECUTE to PUBLIC on functions by default, and anon is a
-- member of PUBLIC. Verified after that migration - anon calling the RPC still returned
-- HTTP 200, not 403. The function is SECURITY DEFINER, so it reads memory_chunks with the
-- owner's rights and the table lockdown does not constrain it.
--
-- authenticated and service_role hold explicit grants and are unaffected.
--
-- banbury_pin_set_by_token deliberately keeps its PUBLIC grant - that is the clubhouse
-- handout path, and it is asserted at the end of this migration.

BEGIN;

REVOKE EXECUTE ON FUNCTION turfsheet.match_memory_chunks(
    turfsheet.vector, integer, double precision, text, text, text, text
) FROM PUBLIC;

DO $$
BEGIN
    IF has_function_privilege('anon', 'turfsheet.match_memory_chunks(turfsheet.vector,integer,double precision,text,text,text,text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon can still EXECUTE match_memory_chunks - the revoke did not take';
    END IF;
    IF NOT has_function_privilege('authenticated', 'turfsheet.match_memory_chunks(turfsheet.vector,integer,double precision,text,text,text,text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'authenticated lost EXECUTE on match_memory_chunks';
    END IF;
    IF NOT has_function_privilege('anon', 'turfsheet.banbury_pin_set_by_token(text)', 'EXECUTE') THEN
        RAISE EXCEPTION 'anon lost EXECUTE on banbury_pin_set_by_token - pin handouts would break';
    END IF;
END $$;

COMMIT;
