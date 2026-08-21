# Chemical Inventory

**Date:** 2026-08-20
**Status:** plan only. Not built. Christopher asked this into Implementation after a review of InvenTree. Paul did not finish a planner pass (Nous 402).
**Branch when coding:** `feature/chemical-inventory` (do not start until Christopher approves)
**Repo:** `/home/wpauser/src/turfsheet` · app in `turfsheet-app/`
**Supabase:** `klyzdnocgrvassppripi` · schema `turfsheet` (never CC `cfwaefobqjouyglocuyh`)

Related: vault `Bob/WPA-Work/projects/03-turfsheet-spray/darryl-inventory-summary-2026-08-12.md`. PRD: `.agent/PRD/chemical-management.md` (Phase 5, not live schema).

---

## Outcome

Shop can see how much of each product is on hand. Logging a spray subtracts that amount. No second inventory screen to remember.

---

## InvenTree (reference only)

Do **not** install, vendor, or fork [InvenTree](https://github.com/inventree/InvenTree). It is a Django MRP stack (parts, stock items, locations, BOM, builds, POs, plugins, mobile). Banbury is one shed of shop chemicals.

**Steal**

- Catalog (part) is not the same as stock.
- Every change leaves a tracking row. Do not only overwrite a number.
- Low-stock is a minimum on the product. Later.
- Lots later map to their batch / stock-item. Not now.

**Ignore**

- BOM, builds, assemblies
- Location trees, drawers, external/structural sites
- Serial numbers and acceptance tests
- Supplier catalog, purchase-order module, sales orders
- Plugins, mobile app, a second auth/API

---

## MVP (v1)

Simplest version that works.

1. Confirm spray line `total_amount_used` is a number the app can math. If it is still text, coerce/store numeric first. No visual change to the spray log.
2. Add `quantity_on_hand` and `quantity_unit` on `turfsheet.chemical_products`.
3. Add `turfsheet.chemical_stock_moves` (cheap InvenTree steal). One row per change.
4. On spray **insert**, write a `spray` move per product line and subtract.
5. On spray **update**, reverse the old line amounts, then subtract the new ones. Same application id.
6. Do **not** decrement on delete. Idaho two-year trigger already rejects delete (`23514`), including service_role.
7. Show on-hand on the existing product list (`ProductLibrary`). No new inventory page.

Tank mix: one application, multiple product lines, one subtract per line.

### v1 schema

`chemical_products` (additions only, do not rebuild the catalog):

| Column | Type | Notes |
|--------|------|--------|
| quantity_on_hand | NUMERIC(12,4) NOT NULL DEFAULT 0 | |
| quantity_unit | TEXT | gal, lb, oz. One unit per product. No conversion in v1. |

`chemical_stock_moves` (new):

| Column | Type | Notes |
|--------|------|--------|
| id | BIGSERIAL PK | |
| product_id | INT NOT NULL FK chemical_products | |
| delta | NUMERIC(12,4) NOT NULL | negative = out, positive = in |
| reason | TEXT NOT NULL | `spray` in v1. Later: `receive`, `correct` |
| application_id | INT NULL | set for spray. FK if the applications PK allows it |
| note | TEXT NULL | |
| created_at | TIMESTAMPTZ NOT NULL DEFAULT NOW() | |
| created_by | TEXT NULL | staff/auth id if cheap. Else null. |

Qty on the product row is the running total. Moves are the audit. Do not invent history for sprays logged before this ships.

### Files (expected)

Touch only these unless a test forces one more:

- `supabase/migrations/YYYYMMDDHHMMSS_chemical_inventory_v1.sql` (explicit path, never `git add .`)
- `turfsheet-app/src/types/index.ts` (ChemicalProduct fields)
- `turfsheet-app/src/lib/pesticideApplication.ts` (numeric amount, hook stock on save)
- `turfsheet-app/src/components/pesticide/ProductLibrary.tsx` (show on-hand)
- `turfsheet-app/src/components/pesticide/ProductForm.tsx` (unit + optional starting qty)
- New small helper, e.g. `turfsheet-app/src/lib/chemicalStock.ts` (apply/reverse moves)
- Tests next to existing pesticide tests: `turfsheet-app/src/lib/pesticideApplication.test.mjs` or a sibling `chemicalStock.test.mjs`

Do not run `npx supabase db push`. Apply with Studio SQL or `db query --linked -f` per repo warnings. `npx tsc --noEmit` is a no-op. Use `tsc -b` / `npm run build`.

### Tests (v1 done bar)

- Insert spray with one line: move delta = -amount, on-hand drops by amount.
- Tank mix two lines: two moves, two products drop.
- Edit amount: old delta reversed, new delta applied. Net matches the new amount.
- Missing/blank amount: no NaN, no move, on-hand unchanged.
- Delete path: no stock code on delete (trigger still owns reject).
- Product list shows on-hand and unit.

A change is not done until the project test command ran and a reviewer who did not write the code checked the diff.

---

## Out of v1

- New inventory page / shed map
- Receive UI
- Correction UI
- Low-stock warnings
- Lots / which jug
- Spend / cost
- Email PO to OldTom
- Unit conversion
- Backfill from old spray rows
- REI hours, applicator licenses, Caddyfile, maps
- InvenTree sidecar

---

## Roadmap (after v1)

| Order | What | Why then |
|-------|------|----------|
| 2 | Receive (qty, date. Vendor/cost/lot optional) | Count only goes down until this exists |
| 3 | Correction | Shed counts drift. Uses `correct` on the same moves table |
| 4 | Low-stock minimum on the product | Needs a trusted number first |
| 5 | Lots / which jug | Needs receive. Do not invent stock-items early |
| 6 | Spend | Needs cost on receive |
| 7 | Forward PO to OldTom | Own project. After basics run |

Day-to-day promise (from the 2026-08-12 note, still the product story):

- Spray: count goes down by itself.
- Product in: tell it once.
- Count wrong: correction, history stays honest.

---

## Open questions (lock before Cody)

Recommended defaults if Christopher does not pick otherwise:

1. **Seed on-hand.** Start at 0. First real stock is a receive (or a one-time shed count entered as receive). Do not guess jug levels.
2. **Units.** One unit per product. No ml↔oz math in v1.
3. **Negative on-hand.** Allow it. Do not block a spray save. Flag in the list if below 0.
4. **Moves table in v1.** Yes. Skipping it makes receive/correct a rebuild.

---

## Hard stops

- No production code until Christopher approves this plan.
- Bob does not write the app change. Cody implements. Ricky reviews.
- Do not delete pesticide applications inside two years.
- Never invent `applicator_license`.
- Tank mix = one application + product lines.
- Never `git add .` (untracked paused migrations under `supabase/migrations/`).
- Never `npx supabase db push`.

---

## Coding loop

1. Christopher approves this file (and the four open questions).
2. Cody on `feature/chemical-inventory`.
3. Ricky reviews diff + same tests.
4. Bob reports evidence. Christopher says ship.
