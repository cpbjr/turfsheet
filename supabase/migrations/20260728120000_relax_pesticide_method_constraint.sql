-- Migration: Relax the pesticide_applications.method CHECK constraint
-- Date: 2026-07-28
-- Why: The enum (spray/granular/injection/drench/other) could not describe a
--      granular algaecide hand-tossed into a pond. The form now offers an
--      expanded vocabulary plus an "Other" free-text escape hatch, so a missing
--      dropdown option never blocks logging an application.
-- Rollback: DROP CONSTRAINT pesticide_applications_method_sane, then re-add
--           CHECK (method IS NULL OR method IN ('spray','granular','injection','drench','other'))

-- The original CHECK was declared inline and unnamed in three separate migrations
-- (20260224000000, 20260225041632, 20260225060000), so Postgres auto-named it.
-- Discover it by the column it constrains rather than trusting a literal name.
DO $$
DECLARE
    con_name text;
BEGIN
    FOR con_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class     r ON r.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = r.relnamespace
        WHERE n.nspname = 'turfsheet'
          AND r.relname = 'pesticide_applications'
          AND c.contype = 'c'
          AND EXISTS (
              SELECT 1
              FROM unnest(c.conkey) AS ck
              JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum = ck
              WHERE a.attname = 'method'
          )
    LOOP
        EXECUTE format('ALTER TABLE turfsheet.pesticide_applications DROP CONSTRAINT %I', con_name);
        RAISE NOTICE 'Dropped method CHECK constraint: %', con_name;
    END LOOP;
END $$;

-- Permissive sanity check rather than no check at all: free text is allowed,
-- blanks and runaway pastes are not.
ALTER TABLE turfsheet.pesticide_applications
    ADD CONSTRAINT pesticide_applications_method_sane
    CHECK (method IS NULL OR char_length(btrim(method)) BETWEEN 1 AND 60);

COMMENT ON COLUMN turfsheet.pesticide_applications.method IS
    'Application method. The UI offers a controlled vocabulary plus a free-text Other escape hatch. Canonical option list: turfsheet-app/src/lib/pesticideOptions.ts';
