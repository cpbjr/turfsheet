-- Migration: Close remaining IDAPA 02.03.03.101.01 record gaps
-- Date: 2026-08-12
-- Purpose: Element (m) applicator license was structurally present but always
--          blank, because it is free text retyped per application. It now lives
--          on staff and autofills from the selected operator.
--          Element (o) required the name of the grower/operator contacted and the
--          date and time of contact; only a boolean was stored.
--          Element (n) supervising applicator for Apprentice (CA) holders had no
--          fields at all. Built optional -- not known to apply at Banbury today.
-- Ref: IDAPA 02.03.03.101.01(m), (o), (n); authority Idaho Code 22-3421
-- Rollback:
--   ALTER TABLE turfsheet.staff DROP COLUMN IF EXISTS applicator_license;
--   ALTER TABLE turfsheet.pesticide_applications
--       DROP COLUMN IF EXISTS wps_contact_name,
--       DROP COLUMN IF EXISTS wps_contact_date,
--       DROP COLUMN IF EXISTS wps_contact_time,
--       DROP COLUMN IF EXISTS supervisor_name,
--       DROP COLUMN IF EXISTS supervisor_license;

-- 101.01(m): the license belongs to the applicator, not to each application.
ALTER TABLE turfsheet.staff
    ADD COLUMN IF NOT EXISTS applicator_license TEXT;

COMMENT ON COLUMN turfsheet.staff.applicator_license IS 'Idaho professional applicator license number. Autofills pesticide_applications.applicator_license per IDAPA 02.03.03.101.01(m).';

-- The per-event column stays. It records what was true at application time, which
-- is what the regulator asks for -- a later license renewal must not silently
-- rewrite historical records.

ALTER TABLE turfsheet.pesticide_applications
    -- 101.01(o): "including name of grower or operator contacted and date and time of contact"
    ADD COLUMN IF NOT EXISTS wps_contact_name TEXT,
    ADD COLUMN IF NOT EXISTS wps_contact_date DATE,
    ADD COLUMN IF NOT EXISTS wps_contact_time TEXT,
    -- 101.01(n): only required when the applicator holds the Apprentice Category (CA).
    ADD COLUMN IF NOT EXISTS supervisor_name TEXT,
    ADD COLUMN IF NOT EXISTS supervisor_license TEXT;

COMMENT ON COLUMN turfsheet.pesticide_applications.wps_contact_name IS 'Name of grower or operator contacted for the worker protection exchange, per IDAPA 02.03.03.101.01(o).';
COMMENT ON COLUMN turfsheet.pesticide_applications.supervisor_name IS 'Supervising professional applicator, required only for Apprentice Category (CA) holders per IDAPA 02.03.03.101.01(n).';

-- No UPDATE against existing rows. Chris chose fix-forward 2026-08-12: historical
-- records are not amended, so a blank license stays blank rather than being
-- retroactively populated with a value that was not recorded at the time.
