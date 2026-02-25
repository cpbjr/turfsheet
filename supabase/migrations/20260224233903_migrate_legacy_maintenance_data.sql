-- Migration: Migrate legacy maintenance data from BanburyMaintenance to TurfSheet
-- Date: 2026-02-24
-- Purpose: Move ~50 historical maintenance issues and reporters from maintenance_log schema
--          to the new maintenance schema
-- Source: BanburyMaintenance Supabase project (klyzdnocgrvassppripi, maintenance_log schema)
-- Target: TurfSheet Supabase project (klyzdnocgrvassppripi, maintenance schema)
-- Rollback: DELETE FROM maintenance.issues; DELETE FROM maintenance.reporters;

-- Schema consolidation context:
-- Both BanburyMaintenance and TurfSheet share the same Supabase instance (klyzdnocgrvassppripi)
-- but use separate schemas:
-- - maintenance_log: Legacy BanburyMaintenance (Telegram bot, web dashboard, Python services)
-- - maintenance: New TurfSheet (Old Tom Morris integration)
--
-- This migration preserves all existing data while making it accessible through Tom's
-- conversational interface and TurfSheet's maintenance UI.

-- =============================================================================
-- 1. Migrate authorized_users → maintenance.reporters
-- =============================================================================
-- Copy all Telegram users who reported issues to the reporters table
-- These users can now interact with Tom for issue management

INSERT INTO maintenance.reporters (
  telegram_id,
  name,
  role,
  is_active,
  message_count,
  last_message_date,
  created_at,
  updated_at
)
SELECT
  telegram_id,
  -- Construct full name from available fields (handles various naming patterns)
  COALESCE(
    CASE
      WHEN (first_name IS NOT NULL AND last_name IS NOT NULL) THEN (first_name || ' ' || last_name)
      WHEN first_name IS NOT NULL THEN first_name
      WHEN last_name IS NOT NULL THEN last_name
      ELSE 'Unknown'
    END,
    'Unknown'
  ) AS name,
  -- Map role: 'reporter', 'supervisor', 'admin' (keep as-is from source)
  COALESCE(role, 'Staff') AS role,
  -- Preserve active status
  is_active,
  -- Copy message count
  message_count,
  -- Copy last activity timestamp
  last_message_date,
  -- Use registration date or current timestamp
  COALESCE(added_date, NOW()) AS created_at,
  COALESCE(updated_at, NOW()) AS updated_at
FROM maintenance_log.authorized_users
ON CONFLICT (telegram_id) DO NOTHING;  -- Skip if already exists (idempotent)

-- =============================================================================
-- 2. Migrate maintenance_issues → maintenance.issues
-- =============================================================================
-- Copy all historical maintenance issues with preserved issue numbers
-- Issues retain their original numbers (#1, #46, etc.) for easy reference

INSERT INTO maintenance.issues (
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
  updated_at,
  completed_at
)
SELECT
  issue_number,  -- Preserve the original issue_number for continuity
  issue_description AS description,  -- Core issue description
  location_area,  -- Hole number or facility (1-18, "Pro Shop", etc.)
  location_detail,  -- Specific feature ("Fairway - Middle", "Green - General", etc.)
  NULL AS location_position,  -- Not present in legacy schema (can be added via Tom interaction)
  COALESCE(status, 'Open') AS status,  -- Default to Open if NULL
  COALESCE(priority, 'Medium') AS priority,  -- Default to Medium if NULL
  sender_name AS reporter_name,  -- Name of person reporting issue
  sender_telegram_id AS reporter_telegram_id,  -- Links to reporters table
  photo_url,  -- Supabase Storage URL (if photo attached)
  notes,  -- Additional details/observations
  assigned_to,  -- Staff member assigned to resolve
  created_at,  -- Preserve creation timestamp
  created_at AS updated_at,  -- Use created_at as updated_at (legacy schema has no separate updated_at)
  completed_at  -- When issue was resolved (NULL if still open)
FROM maintenance_log.maintenance_issues
ORDER BY issue_number  -- Process in order for consistency
ON CONFLICT DO NOTHING;  -- Skip if issue_number already exists (idempotent)

-- =============================================================================
-- 3. Verify migration success
-- =============================================================================
-- Log migration statistics for confirmation

DO $$
DECLARE
  reporter_count INT;
  issue_count INT;
  max_issue_number INT;
BEGIN
  -- Count migrated reporters
  SELECT COUNT(*) INTO reporter_count FROM maintenance.reporters;

  -- Count migrated issues
  SELECT COUNT(*) INTO issue_count FROM maintenance.issues;

  -- Get highest issue number
  SELECT MAX(issue_number) INTO max_issue_number FROM maintenance.issues;

  -- Log via RAISE NOTICE (visible in migration output)
  RAISE NOTICE 'Migration complete: % reporters, % issues (max #%)',
    reporter_count, issue_count, COALESCE(max_issue_number, 0);
END $$;

-- =============================================================================
-- 4. Data migration notes
-- =============================================================================
--
-- Column Mapping Reference:
--
-- maintenance_log.authorized_users → maintenance.reporters
-- - telegram_id → telegram_id (PRIMARY KEY, unchanged)
-- - full_name/first_name/last_name → name (concatenated)
-- - role → role (unchanged: 'reporter', 'supervisor')
-- - is_active → is_active (unchanged)
-- - message_count → message_count (unchanged, counts issues submitted)
-- - last_message_date → last_message_date (unchanged)
-- - added_date → created_at (registration timestamp)
-- - updated_at → updated_at (sync timestamp)
--
-- maintenance_log.maintenance_issues → maintenance.issues
-- - issue_number → issue_number (preserved for easy reference: "#24", "#46")
-- - issue_description → description (issue summary)
-- - location_area → location_area (hole 1-18 or facility name)
-- - location_detail → location_detail (feature: fairway, green, bunker, etc.)
-- - (none) → location_position (new field: front, back, left, right, center)
-- - status → status (Open, In Progress, Completed)
-- - priority → priority (Low, Medium, High)
-- - sender_name → reporter_name (who reported)
-- - sender_telegram_id → reporter_telegram_id (links to reporters table)
-- - photo_url → photo_url (Supabase Storage URL)
-- - notes → notes (additional info)
-- - assigned_to → assigned_to (staff handling resolution)
-- - created_at → created_at (when reported)
-- - updated_at → updated_at (last change)
-- - completed_at → completed_at (when resolved, NULL if open)
--
-- Post-Migration Actions:
-- 1. Verify all issue_numbers are unique (max should be ~46-50)
-- 2. Test Old Tom can query issues: SELECT * FROM maintenance.issues ORDER BY created_at DESC LIMIT 5
-- 3. Verify reporter references work: SELECT i.*, r.name FROM maintenance.issues i LEFT JOIN maintenance.reporters r ON i.reporter_telegram_id = r.telegram_id LIMIT 5
-- 4. Check for NULL values in required fields (description, status, priority)
--
-- Known Data Quality Notes:
-- - ~14 legacy issues created before registration system (sender_telegram_id IS NULL)
-- - ~6 issues with identified reporters (sender_telegram_id matches authorized_users.telegram_id)
-- - 0 photos attached as of migration date (infrastructure ready but not yet used)
-- - location_position intentionally NULL (can be enriched through Tom interaction)
-- - All records have is_active=true (no deactivated reporters)
