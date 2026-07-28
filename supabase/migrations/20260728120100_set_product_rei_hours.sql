-- Migration: Populate real Restricted Entry Intervals on chemical_products
-- Date: 2026-07-28
-- Why: Every product row shipped with rei_hours = 0. PesticideForm autofills REI
--      from the product, so a 0 meant the REI field was always blank on new
--      applications and the compliance printout showed "--".
-- Rollback: UPDATE turfsheet.chemical_products SET rei_hours = 0;
--
-- !! REI is a regulated compliance figure. These values are proposed from
-- !! general label knowledge and MUST be confirmed against the physical
-- !! Banbury container labels before this migration is pushed.

UPDATE turfsheet.chemical_products SET rei_hours = 48
 WHERE epa_registration IN ('81927-23', '42750-19');   -- 2,4-D Amine / 2,4-D Amine 4

UPDATE turfsheet.chemical_products SET rei_hours = 12
 WHERE epa_registration = '53883-310';                 -- Chlorothalonil 720 SFT

UPDATE turfsheet.chemical_products SET rei_hours = 48
 WHERE name = 'Crossroad';                             -- triclopyr + 2,4-D; no EPA # on file

UPDATE turfsheet.chemical_products SET rei_hours = 4
 WHERE epa_registration = '100-937';                   -- Podium

UPDATE turfsheet.chemical_products SET rei_hours = 0
 WHERE epa_registration = '8959-11';                   -- Cutrine Plus Granular (aquatic algaecide)

-- Fertilizers, the iron supplement and the surfactant are not pesticides and
-- carry no REI: Nutriculture (x2), Extreme Green 20, Multi-K GG,
-- 46-0-0 Prilled Nitrogen, Spray-007 (SurfPack), Test Fert. Left at 0.
--
-- Deliberately NOT backfilling pesticide_applications.rei_hours on existing
-- rows: those are compliance records of what the applicator entered at the
-- time. Correcting them is an Edit, not a migration.
