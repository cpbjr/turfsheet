-- Migration: Add rank column to staff table
-- Date: 2026-02-25
-- Purpose: Frontend orders staff by rank (hierarchical display order)
-- Rollback: ALTER TABLE turfsheet.staff DROP COLUMN IF EXISTS rank;

-- Add rank column (lower number = higher rank)
ALTER TABLE turfsheet.staff ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 99;

-- Set rank based on existing role for current staff
UPDATE turfsheet.staff SET rank = CASE
  WHEN role = 'Superintendent' THEN 1
  WHEN role = 'Superintendant' THEN 1
  WHEN role = 'Assistant Superintendant' THEN 2
  WHEN role = 'Mechanic' THEN 3
  WHEN role = 'Senior Staff Member' THEN 4
  WHEN role = 'Staff Member' THEN 5
  WHEN role = 'Temporary Staff Member' THEN 6
  ELSE 99
END
WHERE rank IS NULL OR rank = 99;
