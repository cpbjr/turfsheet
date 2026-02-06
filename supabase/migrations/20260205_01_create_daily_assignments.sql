-- Migration: Create daily_assignments table for staff whiteboard
-- Date: 2026-02-05
-- Rollback: DROP TABLE IF EXISTS turfsheet.daily_assignments CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.daily_assignments (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES turfsheet.staff(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES turfsheet.jobs(id) ON DELETE RESTRICT,
  assignment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  job_order INTEGER NOT NULL CHECK (job_order IN (1, 2)),
  priority TEXT CHECK (priority IS NULL OR (length(priority) = 1 AND priority ~ '^[A-Z]$')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  UNIQUE(staff_id, assignment_date, job_order)
);

-- Create indexes for common queries
CREATE INDEX idx_daily_assignments_date ON turfsheet.daily_assignments(assignment_date);
CREATE INDEX idx_daily_assignments_staff_id ON turfsheet.daily_assignments(staff_id);
CREATE INDEX idx_daily_assignments_staff_date ON turfsheet.daily_assignments(staff_id, assignment_date);

-- Enable Row Level Security
ALTER TABLE turfsheet.daily_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all access to daily_assignments" ON turfsheet.daily_assignments
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.daily_assignments TO authenticated;
GRANT USAGE ON SCHEMA turfsheet TO authenticated;
