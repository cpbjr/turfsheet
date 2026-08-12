-- Migration: Course location for pesticide record compliance
-- Date: 2026-08-12
-- Purpose: IDAPA 02.03.03.101.01(c) requires the location of the property treated,
--          by street address, general legal description (township/range/section),
--          or latitude/longitude. TurfSheet stored only `area_applied`, which is
--          element (b) (the property treated) -- a different requirement.
--          Settings previously lived in browser localStorage, which cannot back a
--          regulatory record: it is per-browser and lost on cache clear.
-- Ref: IDAPA 02.03.03.101.01(c); authority Idaho Code 22-3421
-- Rollback: DROP TABLE turfsheet.course_settings;

CREATE TABLE IF NOT EXISTS turfsheet.course_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    course_name TEXT,
    -- 101.01(c) option 1: street address. Chris selected this format 2026-08-12.
    street_address TEXT,
    city TEXT,
    state TEXT DEFAULT 'ID',
    postal_code TEXT,
    -- 101.01(c) options 2 and 3, kept available without a further migration.
    legal_description TEXT,
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Single-row table: one course, one location.
    CONSTRAINT course_settings_singleton CHECK (id = 1)
);

COMMENT ON TABLE turfsheet.course_settings IS 'Single-row course identity and location. Backs IDAPA 02.03.03.101.01(c) on the printed pesticide log.';
COMMENT ON COLUMN turfsheet.course_settings.street_address IS 'Location of the property treated per IDAPA 02.03.03.101.01(c).';
COMMENT ON COLUMN turfsheet.course_settings.legal_description IS 'Optional township, range, and section alternative under 101.01(c).';

-- Seed the singleton so the app always has a row to update.
-- Address is intentionally NULL: it is a regulatory value and must be supplied
-- by the operator, not guessed here. The log header omits the line while NULL.
INSERT INTO turfsheet.course_settings (id, course_name)
VALUES (1, 'Banbury Golf Course')
ON CONFLICT (id) DO NOTHING;
