-- Migration: Create project_sections table for categorizing project board items
-- Date: 2026-02-11
-- Rollback: DROP TABLE IF EXISTS turfsheet.project_sections CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.project_sections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE turfsheet.project_sections ENABLE ROW LEVEL SECURITY;

-- RLS policy (allow all, matching existing pattern)
CREATE POLICY "Allow all access to project_sections" ON turfsheet.project_sections
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to both roles
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.project_sections TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.project_sections_id_seq TO anon, authenticated;

-- Seed with sections from the physical whiteboard
-- Use ON CONFLICT to make idempotent (safe to re-run)
INSERT INTO turfsheet.project_sections (name, sort_order) VALUES
  ('Projects', 1),
  ('Irrigation', 2)
ON CONFLICT (name) DO NOTHING;
