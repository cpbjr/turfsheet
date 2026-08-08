-- Rollback for: 20260810000000_create_pesticide_application_products.sql
-- Date: 2026-08-10
-- Restores the one-row-per-product shape from the pre-split snapshot.
--
-- Lives outside supabase/migrations/ so a migration run can never pick it up.
-- Apply via the Supabase Studio SQL editor.
--
-- Refuses to run if any product line was created AFTER the split -- those rows
-- exist in no snapshot and would be destroyed silently.

BEGIN;

-- Fail loudly rather than silently dropping post-split work.
DO $$
DECLARE post_split integer;
BEGIN
    SELECT count(*) INTO post_split FROM turfsheet.pesticide_application_products
    WHERE legacy_source_id IS NULL;
    IF post_split > 0 THEN
        RAISE EXCEPTION 'Refusing to roll back: % product line(s) created after the split are not in the snapshot. Export them first.', post_split;
    END IF;
END $$;

DROP TABLE IF EXISTS turfsheet.pesticide_application_products CASCADE;

DELETE FROM turfsheet.pesticide_applications;
INSERT INTO turfsheet.pesticide_applications
    SELECT * FROM turfsheet.pesticide_applications_pre_split_20260810;

ALTER TABLE turfsheet.pesticide_applications
    ALTER COLUMN product_name     SET NOT NULL,
    ALTER COLUMN application_rate SET NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
