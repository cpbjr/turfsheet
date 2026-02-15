-- Add all 13 staff members from whiteboard
INSERT INTO turfsheet.staff (name, role) VALUES
('Darryl', 'Superintendant'),
('Andy', 'Assistant Superintendant'),
('Matt', 'Mechanic'),
('Jose', 'Senior Staff Member'),
('Heath', 'Senior Staff Member'),
('Pickle', 'Staff Member'),
('Alan', 'Staff Member'),
('Rodger', 'Staff Member'),
('Brennan', 'Staff Member'),
('Christopher', 'Staff Member'),
('Kami', 'Temporary Staff Member'),
('Casey', 'Staff Member'),
('Rick', 'Staff Member')
ON CONFLICT (name) DO NOTHING;

-- Verify
SELECT id, name, role FROM turfsheet.staff ORDER BY name;
