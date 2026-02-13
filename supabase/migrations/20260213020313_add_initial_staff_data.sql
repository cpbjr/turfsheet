-- Migration: Add initial staff data from whiteboard
-- Date: 2026-02-13
-- Rollback: DELETE FROM turfsheet.staff WHERE name IN ('Andy', 'Matt', 'Jose', 'Heath', 'Pickle', 'Alan', 'Rodger', 'Brennan', 'Kami', 'Casey', 'Rick');

-- Insert all staff members from whiteboard (excluding Darryl and Christopher who already exist)
-- Note: If staff already exist, this migration will fail. Delete duplicates first or run manually.
INSERT INTO turfsheet.staff (name, role) VALUES
('Andy', 'Assistant Superintendant'),
('Matt', 'Mechanic'),
('Jose', 'Senior Staff Member'),
('Heath', 'Senior Staff Member'),
('Pickle', 'Staff Member'),
('Alan', 'Staff Member'),
('Rodger', 'Staff Member'),
('Brennan', 'Staff Member'),
('Kami', 'Temporary Staff Member'),
('Casey', 'Staff Member'),
('Rick', 'Staff Member');
