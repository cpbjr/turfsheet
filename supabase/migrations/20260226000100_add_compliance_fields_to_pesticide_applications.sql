-- Migration: Add Idaho compliance fields to pesticide_applications
-- Date: 2026-02-26
-- Purpose: Idaho ISDA requires applicator license, time of application,
--          wind direction, humidity for pesticide application records.
-- Ref: Idaho Statutes Title 22, Chapter 34; IDAPA 02.03.03

ALTER TABLE turfsheet.pesticide_applications
    ADD COLUMN IF NOT EXISTS application_time TEXT,
    ADD COLUMN IF NOT EXISTS applicator_license TEXT,
    ADD COLUMN IF NOT EXISTS wind_direction TEXT,
    ADD COLUMN IF NOT EXISTS humidity TEXT;
