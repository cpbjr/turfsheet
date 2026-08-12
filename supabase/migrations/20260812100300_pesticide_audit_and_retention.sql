-- Migration: Audit trail and 2-year retention lock on pesticide records
-- Date: 2026-08-12
-- Purpose: IDAPA 02.03.03.101.01 requires records be maintained two (2) years,
--          ready to be inspected. Idaho Code 22-3420 makes it a prohibited act to
--          neglect to keep required records, or to make false or misleading ones.
--          Records could previously be edited or hard-deleted with no trace.
--          This blocks deletion inside the retention window and records every
--          change.
-- Ref: IDAPA 02.03.03.101.01; Idaho Code 22-3420, 22-3421
-- Rollback:
--   DROP TRIGGER IF EXISTS trg_pesticide_applications_audit ON turfsheet.pesticide_applications;
--   DROP TRIGGER IF EXISTS trg_pesticide_products_audit ON turfsheet.pesticide_application_products;
--   DROP TRIGGER IF EXISTS trg_pesticide_applications_retention ON turfsheet.pesticide_applications;
--   DROP FUNCTION IF EXISTS turfsheet.log_pesticide_audit();
--   DROP FUNCTION IF EXISTS turfsheet.enforce_pesticide_retention();
--   DROP TABLE IF EXISTS turfsheet.pesticide_application_audit;

CREATE TABLE IF NOT EXISTS turfsheet.pesticide_application_audit (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('UPDATE', 'DELETE')),
    -- NOTE: shared login accounts mean this identifies the account, not a person.
    -- Per-person accounts are a known open item; see the auth completion record.
    changed_by TEXT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    old_data JSONB,
    new_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_pesticide_audit_record
    ON turfsheet.pesticide_application_audit (record_id, changed_at DESC);

COMMENT ON TABLE turfsheet.pesticide_application_audit IS 'Change history for pesticide records. Supports the 2-year retention duty in IDAPA 02.03.03.101.01 and the false-records prohibition in Idaho Code 22-3420.';

CREATE OR REPLACE FUNCTION turfsheet.log_pesticide_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = turfsheet, pg_temp
AS $$
BEGIN
    INSERT INTO turfsheet.pesticide_application_audit (
        table_name, record_id, action, changed_by, old_data, new_data
    )
    VALUES (
        TG_TABLE_NAME,
        CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        current_setting('request.jwt.claim.email', true),
        to_jsonb(OLD),
        CASE TG_OP WHEN 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Retention lock: refuse to delete an application whose date is inside two years.
-- Records older than the retention window may still be purged.
CREATE OR REPLACE FUNCTION turfsheet.enforce_pesticide_retention()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.application_date > (CURRENT_DATE - INTERVAL '2 years') THEN
        RAISE EXCEPTION
            'Cannot delete a pesticide record dated %. Idaho requires these records be kept 2 years (IDAPA 02.03.03.101.01). Correct the record instead of deleting it.',
            OLD.application_date
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_pesticide_applications_audit ON turfsheet.pesticide_applications;
CREATE TRIGGER trg_pesticide_applications_audit
    AFTER UPDATE OR DELETE ON turfsheet.pesticide_applications
    FOR EACH ROW EXECUTE FUNCTION turfsheet.log_pesticide_audit();

DROP TRIGGER IF EXISTS trg_pesticide_products_audit ON turfsheet.pesticide_application_products;
CREATE TRIGGER trg_pesticide_products_audit
    AFTER UPDATE OR DELETE ON turfsheet.pesticide_application_products
    FOR EACH ROW EXECUTE FUNCTION turfsheet.log_pesticide_audit();

-- BEFORE DELETE so the exception fires before any cascade to product lines.
DROP TRIGGER IF EXISTS trg_pesticide_applications_retention ON turfsheet.pesticide_applications;
CREATE TRIGGER trg_pesticide_applications_retention
    BEFORE DELETE ON turfsheet.pesticide_applications
    FOR EACH ROW EXECUTE FUNCTION turfsheet.enforce_pesticide_retention();

ALTER TABLE turfsheet.pesticide_application_audit ENABLE ROW LEVEL SECURITY;

-- Read-only to the app. Rows are written by the SECURITY DEFINER trigger, which
-- bypasses RLS -- so no INSERT policy is needed and none should be added.
CREATE POLICY pesticide_audit_authenticated_read
    ON turfsheet.pesticide_application_audit
    FOR SELECT
    TO authenticated
    USING (true);

GRANT SELECT ON turfsheet.pesticide_application_audit TO authenticated;
REVOKE ALL ON turfsheet.pesticide_application_audit FROM anon;
