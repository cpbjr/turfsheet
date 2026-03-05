-- Add clippings weight (lbs) to green_readings
-- One daily measurement, recorded alongside any hole entry

ALTER TABLE turfsheet.green_readings
  ADD COLUMN clippings_lbs NUMERIC(6,2);
