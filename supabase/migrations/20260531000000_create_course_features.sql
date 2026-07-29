-- Migration: Create course_features spatial table
-- Date: 2026-05-31
-- Purpose: Store mapped Banbury course features as the source of truth for GIS-aware operations
-- Rollback outline:
--   DROP INDEX IF EXISTS turfsheet.idx_maintenance_issues_lat_lon;
--   DROP INDEX IF EXISTS turfsheet.idx_maintenance_issues_course_feature_id;
--   ALTER TABLE turfsheet.maintenance_issues
--     DROP COLUMN IF EXISTS map_url,
--     DROP COLUMN IF EXISTS location_source,
--     DROP COLUMN IF EXISTS location_confidence,
--     DROP COLUMN IF EXISTS course_feature_id,
--     DROP COLUMN IF EXISTS lon,
--     DROP COLUMN IF EXISTS lat;
--   DROP TABLE IF EXISTS turfsheet.course_features CASCADE;
--   DROP FUNCTION IF EXISTS turfsheet.set_course_features_updated_at();

CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- Supabase commonly includes extensions on the search_path, but make this migration explicit
-- so PostGIS types/operators and gen_random_uuid() resolve consistently during apply.
SET search_path = turfsheet, public, extensions;

CREATE TABLE IF NOT EXISTS turfsheet.course_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN (
    'green',
    'tee',
    'fairway',
    'bunker',
    'cart_path',
    'irrigation_head',
    'valve',
    'drain',
    'building',
    'water',
    'problem_area',
    'other'
  )),
  hole_number INTEGER CHECK (hole_number IS NULL OR hole_number BETWEEN 1 AND 18),
  geometry geometry(Geometry, 4326),
  centroid_lat NUMERIC(10, 7) CHECK (centroid_lat IS NULL OR centroid_lat BETWEEN -90 AND 90),
  centroid_lon NUMERIC(10, 7) CHECK (centroid_lon IS NULL OR centroid_lon BETWEEN -180 AND 180),
  area_sq_ft NUMERIC(12, 2) CHECK (area_sq_ft IS NULL OR area_sq_ft >= 0),
  length_ft NUMERIC(12, 2) CHECK (length_ft IS NULL OR length_ft >= 0),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
    'satellite',
    'gps',
    'plan',
    'manual',
    'imported',
    'estimated'
  )),
  confidence TEXT NOT NULL DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT course_features_geometry_or_centroid CHECK (
    geometry IS NOT NULL OR (centroid_lat IS NOT NULL AND centroid_lon IS NOT NULL)
  ),
  CONSTRAINT course_features_geometry_type CHECK (
    geometry IS NULL OR (
      CASE
        WHEN feature_type IN ('green', 'tee', 'fairway', 'bunker', 'building', 'water', 'problem_area')
          THEN GeometryType(geometry) IN ('POLYGON', 'MULTIPOLYGON')
        WHEN feature_type IN ('irrigation_head', 'valve')
          THEN GeometryType(geometry) IN ('POINT', 'MULTIPOINT')
        WHEN feature_type IN ('cart_path', 'drain')
          THEN GeometryType(geometry) IN ('LINESTRING', 'MULTILINESTRING', 'POLYGON', 'MULTIPOLYGON')
        ELSE true
      END
    )
  )
);

CREATE OR REPLACE FUNCTION turfsheet.set_course_features_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_course_features_updated_at ON turfsheet.course_features;
CREATE TRIGGER set_course_features_updated_at
  BEFORE UPDATE ON turfsheet.course_features
  FOR EACH ROW
  EXECUTE FUNCTION turfsheet.set_course_features_updated_at();

ALTER TABLE turfsheet.course_features ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read course_features" ON turfsheet.course_features;
DROP POLICY IF EXISTS "Write course_features authenticated" ON turfsheet.course_features;
DROP POLICY IF EXISTS "Allow full access to course_features" ON turfsheet.course_features;

CREATE POLICY "Read course_features" ON turfsheet.course_features
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Write course_features authenticated" ON turfsheet.course_features
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_course_features_feature_type ON turfsheet.course_features(feature_type);
CREATE INDEX IF NOT EXISTS idx_course_features_hole_number ON turfsheet.course_features(hole_number);
CREATE INDEX IF NOT EXISTS idx_course_features_active ON turfsheet.course_features(active);
CREATE INDEX IF NOT EXISTS idx_course_features_geometry ON turfsheet.course_features USING GIST (geometry);

GRANT SELECT ON turfsheet.course_features TO anon, authenticated, service_role;
GRANT INSERT, UPDATE, DELETE ON turfsheet.course_features TO authenticated, service_role;

ALTER TABLE turfsheet.maintenance_issues
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10, 7) CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS lon NUMERIC(10, 7) CHECK (lon IS NULL OR lon BETWEEN -180 AND 180),
  ADD COLUMN IF NOT EXISTS course_feature_id UUID REFERENCES turfsheet.course_features(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_confidence TEXT DEFAULT 'unknown' CHECK (location_confidence IN ('high', 'medium', 'low', 'unknown')),
  ADD COLUMN IF NOT EXISTS location_source TEXT DEFAULT 'unknown' CHECK (location_source IN ('pin', 'photo_exif', 'text_match', 'staff_assignment', 'manual', 'estimated', 'unknown')),
  ADD COLUMN IF NOT EXISTS map_url TEXT;

CREATE INDEX IF NOT EXISTS idx_maintenance_issues_course_feature_id ON turfsheet.maintenance_issues(course_feature_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_issues_lat_lon ON turfsheet.maintenance_issues(lat, lon);

COMMENT ON TABLE turfsheet.course_features IS 'Mapped Banbury course features used as GIS source of truth';
COMMENT ON COLUMN turfsheet.course_features.geometry IS 'PostGIS geometry in EPSG:4326. Do not calculate square feet with ST_Area(geometry); use geography/projection conversion.';
COMMENT ON COLUMN turfsheet.course_features.area_sq_ft IS 'Area in square feet. Must be derived from authoritative records or computed from geometry::geography/projection with documented conversion; do not guess.';
COMMENT ON COLUMN turfsheet.course_features.length_ft IS 'Length in feet. Must be derived from authoritative records or computed from geometry::geography/projection with documented conversion.';
COMMENT ON COLUMN turfsheet.course_features.centroid_lat IS 'Cached helper latitude for app/map convenience; keep in sync with geometry via import/update workflow.';
COMMENT ON COLUMN turfsheet.course_features.centroid_lon IS 'Cached helper longitude for app/map convenience; keep in sync with geometry via import/update workflow.';
