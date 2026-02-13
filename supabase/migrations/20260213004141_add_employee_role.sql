-- Migration: Change role field to ENUM type in staff table
-- Date: 2026-02-13
-- Rollback: ALTER TABLE turfsheet.staff ALTER COLUMN role TYPE TEXT;

-- Add role enum type
CREATE TYPE turfsheet.staff_role AS ENUM (
  'Superintendant',
  'Assistant Superintendant',
  'Mechanic',
  'Senior Staff Member',
  'Staff Member',
  'Temporary Staff Member'
);

-- Update existing data to match ENUM values
UPDATE turfsheet.staff SET role = 'Superintendant' WHERE role = 'Superintendent';
UPDATE turfsheet.staff SET role = 'Assistant Superintendant' WHERE role = 'Assistant Superintendent';
UPDATE turfsheet.staff SET role = 'Staff Member' WHERE role IN ('Crew memeber', 'Crew member', 'Staff member');
UPDATE turfsheet.staff SET role = 'Senior Staff Member' WHERE role = 'Senior Staff member';
UPDATE turfsheet.staff SET role = 'Temporary Staff Member' WHERE role IN ('Temporary Staff member', 'Temp');
UPDATE turfsheet.staff SET role = 'Mechanic' WHERE role = 'mechanic';

-- Change role column from TEXT to ENUM
ALTER TABLE turfsheet.staff
ALTER COLUMN role TYPE turfsheet.staff_role
USING role::turfsheet.staff_role;

-- Update comment
COMMENT ON COLUMN turfsheet.staff.role IS 'Staff member role/position at the golf course';
