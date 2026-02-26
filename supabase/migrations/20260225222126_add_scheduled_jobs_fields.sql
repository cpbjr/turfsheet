-- Migration: Add scheduling fields to turfsheet.jobs
-- Date: 2026-02-25
-- Rollback: ALTER TABLE turfsheet.jobs DROP COLUMN IF EXISTS is_scheduled, DROP COLUMN IF EXISTS scheduled_days;

ALTER TABLE turfsheet.jobs
  ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_days TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_jobs_is_scheduled ON turfsheet.jobs(is_scheduled)
  WHERE is_scheduled = true;
