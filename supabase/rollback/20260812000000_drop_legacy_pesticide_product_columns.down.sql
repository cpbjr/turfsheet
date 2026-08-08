-- Rollback for: 20260812000000_drop_legacy_pesticide_product_columns.sql
-- Date: 2026-08-12
-- Re-adds the legacy per-product columns and repopulates them from the FIRST product line
-- of each event.
--
-- BEST EFFORT BY DESIGN: a multi-product event cannot be represented in the
-- one-row-per-product shape these columns assume. Lines 2..N are not restored here.
-- The complete data remains in turfsheet.pesticide_application_products regardless --
-- this rollback only restores the columns, never the product records.
--
-- Lives outside supabase/migrations/ so a migration run can never pick it up.
-- Apply via the Supabase Studio SQL editor.

BEGIN;

ALTER TABLE turfsheet.pesticide_applications
    ADD COLUMN IF NOT EXISTS product_name            TEXT,
    ADD COLUMN IF NOT EXISTS epa_registration_number TEXT,
    ADD COLUMN IF NOT EXISTS active_ingredient       TEXT,
    ADD COLUMN IF NOT EXISTS application_rate        TEXT,
    ADD COLUMN IF NOT EXISTS rate_unit               TEXT,
    ADD COLUMN IF NOT EXISTS total_amount_used       TEXT,
    ADD COLUMN IF NOT EXISTS amount_per_tank         TEXT,
    ADD COLUMN IF NOT EXISTS manufacturer            TEXT,
    ADD COLUMN IF NOT EXISTS rei_hours               INTEGER,
    ADD COLUMN IF NOT EXISTS epa_lot_number          TEXT,
    ADD COLUMN IF NOT EXISTS target_pest             TEXT;

UPDATE turfsheet.pesticide_applications p
SET product_name            = f.product_name,
    epa_registration_number = f.epa_registration_number,
    active_ingredient       = f.active_ingredient,
    application_rate        = f.application_rate,
    rate_unit               = f.rate_unit,
    total_amount_used       = f.total_amount_used,
    amount_per_tank         = f.amount_per_tank,
    manufacturer            = f.manufacturer,
    rei_hours               = f.rei_hours,
    epa_lot_number          = f.epa_lot_number,
    target_pest             = f.target_pest
FROM (
    SELECT DISTINCT ON (c.application_id) c.*
    FROM turfsheet.pesticide_application_products c
    ORDER BY c.application_id, c.line_number ASC, c.created_at ASC
) f
WHERE p.id = f.application_id;

CREATE INDEX IF NOT EXISTS idx_pesticide_app_product
    ON turfsheet.pesticide_applications(product_name);

NOTIFY pgrst, 'reload schema';

COMMIT;
