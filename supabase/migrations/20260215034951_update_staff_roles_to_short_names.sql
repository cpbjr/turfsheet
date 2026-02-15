-- Migration: Add rank column to staff for hierarchical ordering
-- Date: 2026-02-15
-- Description: Adds rank column to enforce display order: super, assistant, mechanic, senior, staff, temporary
-- Rollback: ALTER TABLE turfsheet.staff DROP COLUMN rank;

-- Add rank column
ALTER TABLE turfsheet.staff ADD COLUMN rank INTEGER DEFAULT 99;

-- Update existing staff with correct ranks based on role
UPDATE turfsheet.staff SET rank = 1 WHERE role = 'Superintendant';
UPDATE turfsheet.staff SET rank = 2 WHERE role = 'Assistant Superintendant';
UPDATE turfsheet.staff SET rank = 3 WHERE role = 'Mechanic';
UPDATE turfsheet.staff SET rank = 4 WHERE role = 'Senior Staff Member';
UPDATE turfsheet.staff SET rank = 5 WHERE role = 'Staff Member';
UPDATE turfsheet.staff SET rank = 6 WHERE role = 'Temporary Staff Member';

-- Add comment
COMMENT ON COLUMN turfsheet.staff.rank IS 'Hierarchical rank for display order (1=highest, 6=lowest)';
