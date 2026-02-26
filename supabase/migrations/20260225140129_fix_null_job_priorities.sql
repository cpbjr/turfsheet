-- Fix NULL priority on jobs created before priority was enforced
UPDATE turfsheet.jobs SET priority = 'Normal' WHERE priority IS NULL;
