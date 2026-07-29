-- Migration: Create banbury_pin_sets + public-token lookup RPC
-- Date: 2026-07-28
-- Purpose: Home for course-map pin sheets, ported from the standalone Banbury map
--          (was wpa.banbury_pin_sets in Supabase project cfwaefobqjouyglocuyh).
-- Rollback:
--   DROP FUNCTION IF EXISTS turfsheet.banbury_pin_set_by_token(TEXT);
--   DROP TABLE IF EXISTS turfsheet.banbury_pin_sets CASCADE;

CREATE TABLE turfsheet.banbury_pin_sets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    play_date    DATE NOT NULL,
    label        TEXT NOT NULL DEFAULT '',
    status       TEXT NOT NULL DEFAULT 'draft',
        -- 'draft', 'scheduled', 'active', 'archived'
    start_hole   INTEGER NOT NULL DEFAULT 1,
    pins         JSONB NOT NULL DEFAULT '{}'::jsonb,
        -- { "<hole>": { lat, lng, onYd, lrYd, lrSide, depthYd, widthYd, u, v, ok, setAt } }
    avoid        JSONB NOT NULL DEFAULT '{"course":[],"holes":{}}'::jsonb,
        -- { course: [{kind,note}], holes: { "<hole>": [{kind,note}] } }
    public_token TEXT UNIQUE,
    created_by   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT banbury_pin_sets_status_check
        CHECK (status IN ('draft', 'scheduled', 'active', 'archived')),
    CONSTRAINT banbury_pin_sets_start_hole_check
        CHECK (start_hole BETWEEN 1 AND 18)
);

CREATE INDEX idx_banbury_pin_sets_play_date ON turfsheet.banbury_pin_sets(play_date DESC);
CREATE INDEX idx_banbury_pin_sets_status ON turfsheet.banbury_pin_sets(status);

CREATE TRIGGER update_banbury_pin_sets_updated_at
    BEFORE UPDATE ON turfsheet.banbury_pin_sets
    FOR EACH ROW
    EXECUTE FUNCTION turfsheet.update_updated_at_column();

ALTER TABLE turfsheet.banbury_pin_sets ENABLE ROW LEVEL SECURITY;

-- Matches the standalone map's behaviour: the app is behind the ops perimeter and
-- uses the anon key for the full pin-sheet workflow.
CREATE POLICY "banbury_pin_sets_anon_all" ON turfsheet.banbury_pin_sets
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "banbury_pin_sets_service_all" ON turfsheet.banbury_pin_sets
    FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.banbury_pin_sets TO anon, authenticated;
GRANT ALL ON turfsheet.banbury_pin_sets TO service_role;

COMMENT ON TABLE turfsheet.banbury_pin_sets IS 'Daily hole-location (pin) sheets for the Banbury course map.';

-- Public clubhouse handout: resolve a set by its share token without exposing the table listing.
CREATE OR REPLACE FUNCTION turfsheet.banbury_pin_set_by_token(p_token TEXT)
RETURNS SETOF turfsheet.banbury_pin_sets
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = turfsheet, public
AS $$
    SELECT *
    FROM turfsheet.banbury_pin_sets
    WHERE public_token IS NOT NULL
      AND length(p_token) >= 16
      AND public_token = p_token
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION turfsheet.banbury_pin_set_by_token(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION turfsheet.banbury_pin_set_by_token(TEXT) IS 'Returns a single pin set matching a public share token, for clubhouse handout links.';
