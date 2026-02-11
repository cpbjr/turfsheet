-- Migration: Add completed_at to daily_assignments
-- Date: 2026-02-11
-- Rollback: ALTER TABLE turfsheet.daily_assignments DROP COLUMN IF EXISTS completed_at;

ALTER TABLE turfsheet.daily_assignments
  ADD COLUMN completed_at TIMESTAMPTZ;

COMMENT ON COLUMN turfsheet.daily_assignments.completed_at IS 'When the primary job was marked complete. NULL = still in progress.';
