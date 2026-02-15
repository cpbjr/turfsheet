-- Migration: Create projects table for superintendent's project board items
-- Date: 2026-02-11
-- Rollback: DROP TABLE IF EXISTS turfsheet.projects CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.projects (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES turfsheet.project_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT CHECK (priority IS NULL OR (length(priority) = 1 AND priority ~ '^[A-Z]$')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'on_hold')),

  -- Optional estimators (visible in detail popup)
  estimated_start_date DATE,
  estimated_end_date DATE,
  estimated_hours NUMERIC(8,1),
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  estimated_crew_size INTEGER,
  required_roles TEXT,
  notes TEXT,

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_projects_section ON turfsheet.projects(section_id);
CREATE INDEX idx_projects_priority ON turfsheet.projects(priority);
CREATE INDEX idx_projects_status ON turfsheet.projects(status);

-- Enable Row Level Security
ALTER TABLE turfsheet.projects ENABLE ROW LEVEL SECURITY;

-- RLS policy (allow all, matching existing pattern)
CREATE POLICY "Allow all access to projects" ON turfsheet.projects
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions to both roles (including sequence)
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.projects TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE turfsheet.projects_id_seq TO anon, authenticated;
