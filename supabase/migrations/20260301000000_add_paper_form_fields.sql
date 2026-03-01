-- Migration: Add paper form fields to pesticide_applications
-- Date: 2026-03-01
-- Rollback: ALTER TABLE turfsheet.pesticide_applications DROP COLUMN worker_protection_exchange, DROP COLUMN worker_protection_requirements, DROP COLUMN recommended_by, DROP COLUMN epa_lot_number, DROP COLUMN manufacturer, DROP COLUMN amount_per_tank, DROP COLUMN equipment_used;

ALTER TABLE turfsheet.pesticide_applications
  ADD COLUMN worker_protection_exchange BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN worker_protection_requirements TEXT,
  ADD COLUMN recommended_by INTEGER REFERENCES turfsheet.staff(id),
  ADD COLUMN epa_lot_number TEXT,
  ADD COLUMN manufacturer TEXT,
  ADD COLUMN amount_per_tank TEXT,
  ADD COLUMN equipment_used TEXT;
