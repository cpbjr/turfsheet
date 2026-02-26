# Pesticide & Fertilizer Tracking System

Date: 2026-02-26
Priority: High

## Task Overview

Build a comprehensive system for tracking and calculating pesticide/fertilizer spraying. The system must:

1. **Product Library** - Store products with their label rates, EPA info, and application details
2. **Spray Calculator** - Calculate how much product to mix for a given area size
3. **Application Log** - Record applications (already partially exists)
4. **PDF Export** - Print application records for regulatory review

### Products from user's photos:
- Cutrine Plus (Granular Algaecide) - 10.7% copper ethanolamine
- 2,4-D Amine (Selective Weed Killer) - 47.2% 2,4-D acid
- Nutriculture Hi-Nitrate Special 20-5-30 (Soluble Fertilizer)
- Nutriculture Spoon-Feeding Soluble Fertilizer
- Extreme Green 20 (Iron supplement - 20% Fe, 12% S)

### Future consideration:
- Historical data import (deferred)

## Files to Modify/Create

### Database
- `supabase/migrations/YYYYMMDD_create_chemical_products.sql` - New product library table

### Types
- `turfsheet-app/src/types/index.ts` - Add ChemicalProduct type

### New Components
- `turfsheet-app/src/components/pesticide/ProductLibrary.tsx` - Product list/management
- `turfsheet-app/src/components/pesticide/ProductForm.tsx` - Add/edit product form
- `turfsheet-app/src/components/pesticide/SprayCalculator.tsx` - Mix calculation tool
- `turfsheet-app/src/components/pesticide/ApplicationPDF.tsx` - PDF generation component

### Modified Components
- `turfsheet-app/src/pages/PesticidePage.tsx` - Add tabs for Applications, Products, Calculator
- `turfsheet-app/src/components/pesticide/PesticideForm.tsx` - Link to product library for auto-fill

## Implementation Steps

### Step 1: Database Migration
Create `chemical_products` table with fields:
- name, type (FERTILIZER/HERBICIDE/FUNGICIDE/INSECTICIDE/PGR/ALGAECIDE/IRON_SUPPLEMENT/OTHER)
- epa_registration, active_ingredient, rei_hours
- default_rate, rate_unit, rate_per (per 1000 sq ft or per acre)
- concentration_percentage
- manufacturer, notes

### Step 2: TypeScript Types
Add ChemicalProduct interface to types/index.ts

### Step 3: Rebuild PesticidePage with Tabs
- Tab 1: Application Log (existing functionality)
- Tab 2: Product Library (new)
- Tab 3: Spray Calculator (new)

### Step 4: Product Library
- List all products in a table/grid
- Add/edit products with a form
- Auto-populate from the images (seed data)

### Step 5: Spray Calculator
Given a product and area size:
- Calculate total product needed
- Show water volume for spray tank
- Support different rate units (oz/1000sqft, lbs/acre, ppm)
- Display carrier volume

### Step 6: Enhance Application Form
- Product dropdown from library auto-fills EPA, active ingredient, rate, REI
- Still allow manual entry

### Step 7: PDF Export
Use browser print / window.print() with a print-optimized layout
- Application record formatted for regulatory review
- Include all required fields: date, product, EPA #, rate, area, operator, weather

## Testing Plan
- Verify product CRUD operations
- Test spray calculator math with known values
- Test PDF print layout
- Verify application form auto-fill from product library
