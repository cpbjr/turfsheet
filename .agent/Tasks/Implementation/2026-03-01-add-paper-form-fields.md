# Plan: Add Missing Paper Form Fields to Chemicals Page

## Context
Banbury Golf Club uses a paper "Plant Protectant Applications" form for Idaho regulatory compliance. The TurfSheet Chemicals page (pesticide tracker) is missing 7 fields that exist on this form. We need to add them to the database, TypeScript types, form UI, and print report so the digital record matches the paper form.

**Paper form photo:** Shows fields for Date, Time, Wind Direction/Speed, Worker Protection Info Exchange, Worker Protection Requirements, Applicator, Certification Number, Pesticide Recommendation (Staff Name), Crop/Target, Crop Location, Product(s), Active Ingredients, EPA Registration Number, EPA Lot Number, Manufacturer, Rate Applied, Amount per Tank, Total Amount Applied, Size of Area, Equipment, Area Location, Miscellaneous Notes.

---

## Fields to Add to `turfsheet.pesticide_applications`

| Column Name | DB Type | Form Behavior |
|---|---|---|
| `worker_protection_exchange` | `BOOLEAN NOT NULL DEFAULT false` | Checkbox — "WPS briefing completed" — **MUST be true to submit** (form validation) |
| `worker_protection_requirements` | `TEXT` | Auto-pulled from product label `warnings` field in `chemical_products` table |
| `recommended_by` | `INTEGER REFERENCES turfsheet.staff(id)` | Staff dropdown, default pre-selected to Darryl |
| `epa_lot_number` | `TEXT` | Manual text entry |
| `manufacturer` | `TEXT` | Auto-filled from `chemical_products.manufacturer` when product selected |
| `amount_per_tank` | `TEXT` | Simple text field (purpose TBD — ask Darryl) |
| `equipment_used` | `TEXT` | Dropdown with generic defaults (see below) |

**Equipment dropdown options:** Spray Rig, Backpack Sprayer, Spreader, Boom Sprayer, Hand Sprayer

---

## Task 1: Database Migration

**Create:** `supabase/migrations/20260301000000_add_paper_form_fields.sql`

```sql
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
```

**Run:** `npx supabase@latest db push`

**Note:** Schema is `turfsheet`, NOT `public`. The table is `turfsheet.pesticide_applications`.

---

## Task 2: Update TypeScript Interface

**File:** `turfsheet-app/src/types/index.ts`

**Current `PesticideApplication` interface** (lines 268-289) is missing several fields that already exist in the DB. Update to:

```typescript
export interface PesticideApplication {
  id: string;
  application_date: string;
  product_name: string;
  epa_registration_number?: string;
  active_ingredient?: string;
  application_rate: string;
  rate_unit?: string;
  total_amount_used?: string;
  area_applied: string;
  area_size?: string;
  target_pest?: string;
  method?: ApplicationMethod;
  operator_id?: string;
  wind_speed?: string;
  temperature?: string;
  weather_conditions?: string;
  rei_hours?: number;
  notes?: string;
  // Compliance fields (already in DB, missing from type)
  application_time?: string;
  applicator_license?: string;
  wind_direction?: string;
  humidity?: string;
  // NEW paper form fields
  worker_protection_exchange: boolean;
  worker_protection_requirements?: string;
  recommended_by?: number;
  epa_lot_number?: string;
  manufacturer?: string;
  amount_per_tank?: string;
  equipment_used?: string;
  // Timestamps
  created_at: string;
  updated_at: string;
}
```

**Important:** After adding these to the type, search for `as any` casts in `PesticidePage.tsx` that access `application_time`, `applicator_license`, `wind_direction`, `humidity` — these can now be replaced with proper typed access.

---

## Task 3: Update PesticideForm.tsx

**File:** `turfsheet-app/src/components/pesticide/PesticideForm.tsx` (~560 lines)

### Form state — add defaults for new fields:
```typescript
// In the initial formData state, add:
worker_protection_exchange: false,
worker_protection_requirements: '',
recommended_by: '', // find Darryl's staff ID and default to it
epa_lot_number: '',
manufacturer: '',
amount_per_tank: '',
equipment_used: '',
```

### Product auto-fill — update the product selection handler:
When a product is selected from the library, also auto-fill:
- `manufacturer` from `selectedProduct.manufacturer`
- `worker_protection_requirements` from `selectedProduct.warnings` (the label safety text)

The existing handler is around lines 138-156. Add to it.

### Operator selection — auto-pull cert #:
This already exists partially. When `operator_id` changes, if the staff member has certification info stored, auto-fill `applicator_license`. Check if the `Staff` type has a certification field — if not, this is future work (leave `applicator_license` as manual entry for now).

### New form fields to add (in order matching the paper form):

**After the Date/Time/Operator row (around line 297):**
1. **Worker Protection Exchange** — Checkbox with label "Worker Protection Safety briefing completed". Display as a prominent checkbox. Form submit handler must validate this is `true`.

**After Applicator License / Target Pest row (around line 321):**
2. **Recommended By** — Staff dropdown (`<select>`) populated from `staffMembers` prop, same pattern as `operator_id`. Default to Darryl (find by name in staffMembers array).

**After Product / EPA Registration row (around line 346):**
3. **EPA Lot Number** — Text input
4. **Manufacturer** — Text input (auto-filled from product library, but editable)

**After Application Rate / Total Amount Used row (around line 383):**
5. **Amount per Tank** — Text input, placeholder "e.g., 32 oz"

**After Application Method / REI Hours row (around line 438):**
6. **Equipment Used** — Dropdown `<select>` with options: "", "Spray Rig", "Backpack Sprayer", "Spreader", "Boom Sprayer", "Hand Sprayer"

**Worker Protection Requirements** — Display-only text below the WPS checkbox, showing the product's label warnings. Not editable (pulled from product data). Show only when a product is selected.

### Submit validation:
In the submit handler (~line 182), add validation:
```typescript
if (!formData.worker_protection_exchange) {
  alert('Worker Protection Safety briefing must be completed before recording an application.');
  return;
}
```

---

## Task 4: Update Print Report

**File:** `turfsheet-app/src/pages/PesticidePage.tsx`

The `handlePrint()` function (around lines 161-257) generates HTML for a print window.

**Add these columns to the print table:**
- WPS (checkmark ✓ or ✗)
- Recommended By (staff name lookup)
- EPA Lot #
- Manufacturer
- Amount/Tank
- Equipment

**Also add Worker Protection Requirements** as a note below the table or as a separate row per application.

The print should match the paper form layout as closely as practical in a table format.

---

## Task 5: Remove `as any` Casts

**File:** `turfsheet-app/src/pages/PesticidePage.tsx`

Search for `(selectedApplication as any)` or similar `as any` casts accessing `application_time`, `applicator_license`, `wind_direction`, `humidity`. Now that these are in the type, use proper typed access.

---

## Files to Modify (summary)
1. **NEW:** `supabase/migrations/20260301000000_add_paper_form_fields.sql`
2. **EDIT:** `turfsheet-app/src/types/index.ts` (PesticideApplication interface, ~lines 268-289)
3. **EDIT:** `turfsheet-app/src/components/pesticide/PesticideForm.tsx` (form fields + auto-fill + validation)
4. **EDIT:** `turfsheet-app/src/pages/PesticidePage.tsx` (print report + remove `as any` casts)

## Verification
1. `npx supabase@latest db push` — migration succeeds
2. `npm run dev` in `turfsheet-app/` — no TypeScript errors, runs on port 5179
3. Open Chemicals page → Record Application → verify:
   - WPS checkbox visible and required
   - Recommended By dropdown defaults to Darryl
   - Selecting a product auto-fills manufacturer and worker protection requirements
   - EPA Lot Number, Amount per Tank, Equipment fields present
   - Cannot submit without WPS checked
4. Submit an application → verify all 7 new fields saved to DB (check via MCP-as-code: `npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT worker_protection_exchange, recommended_by, epa_lot_number, manufacturer, amount_per_tank, equipment_used FROM turfsheet.pesticide_applications ORDER BY created_at DESC LIMIT 1"}'`)
5. Print report → verify new columns appear

## Supabase Config
- **Project ref:** `scktzhwtkscabtpkvhne`
- **Schema:** `turfsheet` (NOT public)
- **MCP project name:** `turfsheet`
- **Access token:** Set via `export SUPABASE_ACCESS_TOKEN` (check project CLAUDE.md or ask user)
