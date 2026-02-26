-- Migration: Fix jobs table auto-increment sequence
-- Date: 2026-02-25
-- Rollback: SELECT setval(pg_get_serial_sequence('turfsheet.jobs', 'id'), COALESCE(MAX(id), 1)) FROM turfsheet.jobs;

SELECT setval(
  pg_get_serial_sequence('turfsheet.jobs', 'id'),
  COALESCE((SELECT MAX(id) FROM turfsheet.jobs), 1)
);
