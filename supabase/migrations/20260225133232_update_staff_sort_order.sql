-- Migration: Update staff sort_order based on role hierarchy
-- Date: 2026-02-25
-- Rollback: Re-run with different values

UPDATE turfsheet.staff SET sort_order = CASE
  WHEN role = 'Superintendent' THEN 1
  WHEN role = 'Assistant Superintendent' THEN 2
  WHEN role = 'Mechanic' THEN 3
  WHEN role = 'Senior Staff' THEN 4
  WHEN role = 'Staff' THEN 5
  WHEN role = 'Temporary Staff' THEN 6
  ELSE 99
END
WHERE id > 0;
