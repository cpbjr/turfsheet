-- Migration: Split pesticide applications into event + product line items
-- Date: 2026-08-10
-- Purpose: One spray event = one turfsheet.pesticide_applications row with N
--          turfsheet.pesticide_application_products children. Replaces the inferred grouping
--          (normalized application_date + area_applied) in turfsheet-app/src/lib/pesticideMix.ts,
--          which falsely merged two same-day sprays to one area and falsely split on area typos.
--          Idaho ISDA records -- lossless by design.
-- Rollback: supabase/rollback/20260810000000_create_pesticide_application_products.down.sql
--
-- DO NOT APPLY WITH `supabase db push` -- migration history on this project is out of sync.
-- Apply via the Supabase Studio SQL editor.
--
-- Run the PREVIEW queries (plan section "Preview") and eyeball the output BEFORE running this.
-- The DELETE at the end is irreversible except via the snapshot table.
--
-- Verified against production 2026-08-07: 32 rows -> 13 events; P2 and P3 empty; P4 flags only
-- notes (2026-08-07) and target_pest (2026-07-29), both handled below.

BEGIN;

-- 0. Snapshot. Everything below can be reconstructed from this table.
CREATE TABLE IF NOT EXISTS turfsheet.pesticide_applications_pre_split_20260810 AS
    SELECT * FROM turfsheet.pesticide_applications;

-- New table in a PostgREST-exposed schema -> lock it down explicitly.
ALTER TABLE turfsheet.pesticide_applications_pre_split_20260810 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON turfsheet.pesticide_applications_pre_split_20260810 FROM anon, authenticated;

COMMENT ON TABLE turfsheet.pesticide_applications_pre_split_20260810 IS
    'Pre-split snapshot (one row per product). Rollback and verification source for 20260810000000. Do not drop until Migration B is verified in production. No policy, no grants: service_role only.';

-- 1. Child table
CREATE TABLE IF NOT EXISTS turfsheet.pesticide_application_products (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL
        REFERENCES turfsheet.pesticide_applications(id) ON DELETE CASCADE,
    line_number    INTEGER NOT NULL DEFAULT 1 CHECK (line_number >= 1),

    product_name            TEXT NOT NULL CHECK (char_length(btrim(product_name)) > 0),
    epa_registration_number TEXT,
    active_ingredient       TEXT,
    manufacturer            TEXT,
    epa_lot_number          TEXT,

    application_rate  TEXT NOT NULL CHECK (char_length(btrim(application_rate)) > 0),
    rate_unit         TEXT DEFAULT 'oz/1000sqft',
    total_amount_used TEXT,
    amount_per_tank   TEXT,
    rei_hours         INTEGER CHECK (rei_hours IS NULL OR rei_hours >= 0),

    -- Per-product. Proven by production data: one 4-product mix holds 4 distinct target pests.
    target_pest TEXT,

    -- Nullable override; NULL inherits the event's method.
    method TEXT CHECK (method IS NULL OR char_length(btrim(method)) BETWEEN 1 AND 60),

    -- Audit trail to the pre-split row. NULL for rows created after the split.
    -- UNIQUE makes the backfill INSERT re-runnable.
    legacy_source_id UUID UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pap_application_id
    ON turfsheet.pesticide_application_products(application_id, line_number);
CREATE INDEX IF NOT EXISTS idx_pap_product_name
    ON turfsheet.pesticide_application_products(product_name);

ALTER TABLE turfsheet.pesticide_application_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pesticide_application_products_authenticated_all"
    ON turfsheet.pesticide_application_products;
CREATE POLICY "pesticide_application_products_authenticated_all"
    ON turfsheet.pesticide_application_products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON turfsheet.pesticide_application_products FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.pesticide_application_products TO authenticated;

DROP TRIGGER IF EXISTS update_pesticide_application_products_updated_at
    ON turfsheet.pesticide_application_products;
CREATE TRIGGER update_pesticide_application_products_updated_at
    BEFORE UPDATE ON turfsheet.pesticide_application_products
    FOR EACH ROW EXECUTE FUNCTION turfsheet.update_updated_at_column();

COMMENT ON TABLE turfsheet.pesticide_application_products IS
    'One product line within a spray event. Parent = turfsheet.pesticide_applications.';
COMMENT ON COLUMN turfsheet.pesticide_application_products.method IS
    'Per-product override. NULL inherits pesticide_applications.method. Non-null only when one event genuinely mixed methods (granular broadcast + tank spray).';
COMMENT ON COLUMN turfsheet.pesticide_application_products.legacy_source_id IS
    'id of the pre-split pesticide_applications row this line was backfilled from.';

-- 2. The parent must be insertable with no product data. Without this every save 400s.
ALTER TABLE turfsheet.pesticide_applications
    ALTER COLUMN product_name     DROP NOT NULL,
    ALTER COLUMN application_rate DROP NOT NULL;

DO $$
DECLARE col text;
BEGIN
    FOREACH col IN ARRAY ARRAY[
        'product_name','epa_registration_number','active_ingredient','application_rate',
        'rate_unit','total_amount_used','amount_per_tank','manufacturer','rei_hours',
        'epa_lot_number','target_pest'
    ] LOOP
        EXECUTE format('COMMENT ON COLUMN turfsheet.pesticide_applications.%I IS %L', col,
            'DEPRECATED 2026-08-10. Superseded by turfsheet.pesticide_application_products. Stale after the first app-side edit. Dropped by migration 20260812000000.');
    END LOOP;
END $$;

-- 3a. One child line per ORIGINAL row. Canonical parent = oldest row in the group.
--     GROUP/PARTITION on raw area_applied: a typo splits into two events rather than
--     falsely merging. Postgres partitions NULLs together, so nullable time/operator are fine.
WITH ranked AS (
    SELECT p.*,
           first_value(p.id) OVER w AS canonical_id,
           row_number()      OVER w AS line_no
    FROM turfsheet.pesticide_applications p
    WINDOW w AS (
        PARTITION BY p.application_date, p.area_applied, p.application_time, p.operator_id
        ORDER BY p.created_at ASC, p.id ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )
)
INSERT INTO turfsheet.pesticide_application_products (
    application_id, line_number,
    product_name, epa_registration_number, active_ingredient, manufacturer, epa_lot_number,
    application_rate, rate_unit, total_amount_used, amount_per_tank, rei_hours,
    target_pest, method, legacy_source_id, created_at, updated_at
)
SELECT r.canonical_id, r.line_no,
       r.product_name, r.epa_registration_number, r.active_ingredient, r.manufacturer,
       r.epa_lot_number, r.application_rate, r.rate_unit, r.total_amount_used,
       r.amount_per_tank, r.rei_hours, r.target_pest, r.method,
       r.id, r.created_at, r.updated_at
FROM ranked r
ON CONFLICT (legacy_source_id) DO NOTHING;

-- 3b. Preserve notes that would otherwise die with the non-canonical rows.
--     Reads from the snapshot, so re-running yields the identical string.
UPDATE turfsheet.pesticide_applications canon
SET notes = m.merged_notes
FROM (
    SELECT c.application_id AS id,
           string_agg(DISTINCT btrim(b.notes), E'\n---\n' ORDER BY btrim(b.notes)) AS merged_notes
    FROM turfsheet.pesticide_application_products c
    JOIN turfsheet.pesticide_applications_pre_split_20260810 b ON b.id = c.legacy_source_id
    WHERE b.notes IS NOT NULL AND btrim(b.notes) <> ''
    GROUP BY c.application_id
    HAVING count(DISTINCT btrim(b.notes)) > 1
) m
WHERE canon.id = m.id;

-- 3c. Drop the now-redundant parent rows. Provably safe:
--       * a CANONICAL row has a child whose application_id = its own id -> EXISTS is false
--         -> never deleted.
--       * a NON-CANONICAL row has zero children pointing at it (its line was re-parented in
--         3a) -> ON DELETE CASCADE removes nothing. No orphans.
--       * re-running deletes zero rows.
DELETE FROM turfsheet.pesticide_applications p
WHERE EXISTS (
    SELECT 1 FROM turfsheet.pesticide_application_products c
    WHERE c.legacy_source_id = p.id AND c.application_id <> p.id
);

NOTIFY pgrst, 'reload schema';

COMMIT;
