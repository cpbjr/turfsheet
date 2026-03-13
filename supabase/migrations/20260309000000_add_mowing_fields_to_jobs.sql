-- Migration: Add job_type and mowing-specific fields to turfsheet.jobs
-- Date: 2026-03-09
-- Rollback: ALTER TABLE turfsheet.jobs DROP COLUMN job_type, mow_direction, hoc, mow_pattern;

ALTER TABLE turfsheet.jobs
  ADD COLUMN job_type TEXT NOT NULL DEFAULT 'General'
    CHECK (job_type IN ('General', 'Mowing')),
  ADD COLUMN mow_direction TEXT
    CHECK (mow_direction IN ('12-6', '2-8', '3-9', '4-10')),
  ADD COLUMN hoc NUMERIC(6,4),
  ADD COLUMN mow_pattern TEXT
    CHECK (mow_pattern IN ('Double Cut (Cross)', 'Double Cut (Parallel)', 'No Cleanup'));
