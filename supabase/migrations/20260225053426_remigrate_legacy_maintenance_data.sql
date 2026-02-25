-- Migration: Re-migrate legacy maintenance data from maintenance_log schema
-- Date: 2026-02-25
-- Purpose: Copy historical issues from maintenance_log.issues into turfsheet.maintenance_issues
-- Context: Data was lost during migration cascade drop; original data still in maintenance_log schema
-- Rollback: DELETE FROM turfsheet.maintenance_issues WHERE id <= (SELECT MAX(id) FROM maintenance_log.issues);

-- Only run if maintenance_log schema exists (source data)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if source schema exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'maintenance_log') THEN
    RAISE NOTICE 'maintenance_log schema does not exist - skipping migration';
    RETURN;
  END IF;

  -- Check if source table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'maintenance_log' AND table_name = 'issues') THEN
    RAISE NOTICE 'maintenance_log.issues table does not exist - skipping migration';
    RETURN;
  END IF;

  -- Check if target already has data (avoid duplicate migration)
  SELECT count(*) INTO v_count FROM turfsheet.maintenance_issues;
  IF v_count > 0 THEN
    RAISE NOTICE 'turfsheet.maintenance_issues already has % rows - skipping to avoid duplicates', v_count;
    RETURN;
  END IF;

  -- Copy issues from maintenance_log to turfsheet
  INSERT INTO turfsheet.maintenance_issues (
    issue_number,
    description,
    location_area,
    location_detail,
    location_position,
    status,
    priority,
    reporter_name,
    reporter_telegram_id,
    photo_url,
    notes,
    assigned_to,
    created_at,
    completed_at
  )
  SELECT
    issue_number,
    description,
    location_area,
    location_detail,
    location_position,
    status,
    priority,
    reporter_name,
    reporter_telegram_id,
    photo_url,
    notes,
    assigned_to,
    created_at,
    completed_at
  FROM maintenance_log.issues
  ORDER BY issue_number;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % issues from maintenance_log to turfsheet.maintenance_issues', v_count;
END $$;
