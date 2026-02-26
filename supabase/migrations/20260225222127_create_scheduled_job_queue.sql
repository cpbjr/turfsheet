-- Migration: Create scheduled_job_queue table for auto-populated daily scheduled jobs
-- Date: 2026-02-25
-- Rollback: DROP TABLE IF EXISTS turfsheet.scheduled_job_queue CASCADE;

CREATE TABLE IF NOT EXISTS turfsheet.scheduled_job_queue (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES turfsheet.jobs(id) ON DELETE CASCADE,
  queue_date DATE NOT NULL,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT scheduled_job_queue_job_date_unique UNIQUE (job_id, queue_date)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_job_queue_date ON turfsheet.scheduled_job_queue(queue_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_job_queue_active ON turfsheet.scheduled_job_queue(queue_date, dismissed)
  WHERE dismissed = false;

ALTER TABLE turfsheet.scheduled_job_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow all select scheduled_job_queue" ON turfsheet.scheduled_job_queue FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all insert scheduled_job_queue" ON turfsheet.scheduled_job_queue FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all update scheduled_job_queue" ON turfsheet.scheduled_job_queue FOR UPDATE USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all delete scheduled_job_queue" ON turfsheet.scheduled_job_queue FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.scheduled_job_queue TO anon, authenticated, service_role;
DO $$ BEGIN
  GRANT USAGE, SELECT ON SEQUENCE turfsheet.scheduled_job_queue_id_seq TO anon, authenticated, service_role;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
