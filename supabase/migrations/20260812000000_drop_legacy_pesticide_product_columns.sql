-- Migration: Drop the legacy per-product columns from turfsheet.pesticide_applications
-- Date: 2026-08-12
-- Purpose: Completes the event/product split begun in 20260810000000. The product data now
--          lives in turfsheet.pesticide_application_products; these parent columns have been
--          stale since the first app-side edit after that migration.
-- Rollback: supabase/rollback/20260812000000_drop_legacy_pesticide_product_columns.down.sql
--
-- DO NOT APPLY WITH `supabase db push` -- migration history on this project is out of sync.
-- Apply via the Supabase Studio SQL editor.
--
-- PRECONDITION: 20260810000000 applied AND verified (V1-V7) AND the new frontend deployed and
-- soaked. Applying this before the new frontend is live 400s every page load.

BEGIN;

-- Guard 1: an event with no product lines would lose its ONLY product record here.
DO $$
DECLARE childless integer;
BEGIN
    SELECT count(*) INTO childless
    FROM turfsheet.pesticide_applications p
    WHERE NOT EXISTS (
        SELECT 1 FROM turfsheet.pesticide_application_products c
        WHERE c.application_id = p.id
    );
    IF childless > 0 THEN
        RAISE EXCEPTION 'Refusing to drop legacy columns: % application(s) have zero product lines. Their product data lives only in the columns this migration drops.', childless;
    END IF;
END $$;

-- Guard 2: the snapshot is the rollback source. No snapshot, no way back.
DO $$
BEGIN
    IF to_regclass('turfsheet.pesticide_applications_pre_split_20260810') IS NULL THEN
        RAISE EXCEPTION 'Refusing to drop legacy columns: the pre-split snapshot table is missing. It is the only rollback source.';
    END IF;
END $$;

DROP INDEX IF EXISTS turfsheet.idx_pesticide_app_product;

ALTER TABLE turfsheet.pesticide_applications
    DROP COLUMN IF EXISTS product_name,
    DROP COLUMN IF EXISTS epa_registration_number,
    DROP COLUMN IF EXISTS active_ingredient,
    DROP COLUMN IF EXISTS application_rate,
    DROP COLUMN IF EXISTS rate_unit,
    DROP COLUMN IF EXISTS total_amount_used,
    DROP COLUMN IF EXISTS amount_per_tank,
    DROP COLUMN IF EXISTS manufacturer,
    DROP COLUMN IF EXISTS rei_hours,
    DROP COLUMN IF EXISTS epa_lot_number,
    DROP COLUMN IF EXISTS target_pest;

NOTIFY pgrst, 'reload schema';

COMMIT;
