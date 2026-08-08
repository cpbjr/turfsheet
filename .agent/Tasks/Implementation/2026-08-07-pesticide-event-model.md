# Pesticide Applications: Move to an Explicit Event Model

## Context

The `/pesticide` page stores **one database row per chemical**. There is no stored notion of a
spray event — but the app clearly believes in one. `src/lib/pesticideMix.ts:7-24` declares 16
fields as "shared across every product row in a tank mix" (operator, license, weather, wind,
humidity, equipment, time, WPS briefing, method, area, date), duplicates them onto every product
row, and cascades edits across "siblings" to keep them in sync.

Sibling identity is **inferred** by normalized `application_date` + `area_applied` string matching
(`pesticideMix.ts:40-53`). That key has three failure modes on Idaho ISDA compliance records:

1. **False merge** — a morning fungicide and an afternoon insecticide on the same area become one
   "mix". Editing either overwrites the other's `application_time`, weather, and operator, because
   `application_time` is itself in `SHARED_MIX_FIELDS`. The record that two applications occurred
   is destroyed.
2. **False split** — "Greens" vs "All Greens" vs a trailing space silently breaks the group and
   shared fields stop cascading.
3. **Self-rekeying** — `area_applied` and `application_date` are both cascade *targets* and the
   group *key*. Editing the area re-identifies the group mid-write, and `PesticidePage.tsx:210-214`
   compounds this by matching the new date/area against a pre-edit snapshot.

Beyond correctness: row count ≠ application count, so "how many applications in July" is
unanswerable, and a tank mix renders as N unrelated log lines.

### Evidence from production (queried 2026-08-07)

**32 rows representing 13 actual applications.** Five are 5-product tank mixes, one is a 4-product
mix — each currently displaying as five or four separate log lines.

Two findings that shaped this plan:

- **Grouping by `date+area` and by `date+area+time+operator` both yield exactly 13 groups.** The
  conservative key costs nothing on existing data and buys safety going forward. Every row has a
  non-null `application_time` and `operator_id`, so the strict key is fully populated.
- **`target_pest` is genuinely per-product.** The 2026-07-29 "Creeks + Pond 18" mix holds four
  distinct values across four products (2,4-D Amine → "Broadleaf / vegetation"; Glyphosate →
  "Vegetation / aquatic edge weeds"; Sticker → "Adjuvant"; Tribune → "Vegetation burn-down"). A
  backfill that treated `target_pest` as event-level would silently destroy three of those on a
  live compliance record. It must live on the child.

The reason `date+area` hasn't collided yet is luck: area labels happen to be long and specific
("Fairways + Approaches — APP 6,7,8; FWY 6,7,15"). One day with two sprays both labelled "Greens"
breaks it.

### Intended outcome

An application is a first-class row with a real primary key; products are child line items
referencing it. Grouping becomes a foreign key instead of a string heuristic. The log shows 13
applications, expandable to their product lines. The cascade machinery disappears entirely —
shared fields live in one place, so there is nothing to keep in sync.

## Decisions

1. **Backfill key:** `application_date + area_applied + application_time + operator_id`, NULL-safe.
2. **Two staged migrations.** A creates the child table and backfills, leaving legacy product
   columns in place as a safety net. B drops them after verification in the live app.
3. **UI:** expandable event rows — one row per application with a product summary; chevron expands
   product lines inline; clicking the row opens the detail modal.
4. **`target_pest` moves to the child** (proven by data above). **`method` stays event-level with a
   nullable child override** — no current group disagrees on method, but `SprayCalculator.tsx:730`
   already computes it per product (`carrier_volume_gal === 0 ? 'granular' : 'spray'`), so a
   granular broadcast plus a tank spray in one visit is a legitimate future record.

## Critical constraints

⚠️ **Never run `supabase db push` on this project.** Migration history is out of sync (see
`supabase/migrations/20260807200000_lock_down_anon_access.sql:13-14`). Apply migrations by pasting
into the **Supabase Studio SQL editor**.

For read-only verification, the MCP project name `turfsheet` is broken ("Unknown project"). Use
`maintenance-log` — same instance — and wrap in `json_agg` with an alias **other than `t`** (the
RPC mangles the result otherwise):

```bash
cd ~/WhitePineTech/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"maintenance-log","sql":"SELECT json_agg(g) FROM (…) g"}'
```

⚠️ **`product_name` and `application_rate` are `NOT NULL` on the parent.** The moment the new UI
inserts an event with no product columns, every save fails with an opaque 400. Migration A must
drop those constraints. This is the easiest step to omit and the most confusing to debug.

---

## Migration A — child table + backfill

**File:** `supabase/migrations/20260810000000_create_pesticide_application_products.sql`
**Rollback:** `supabase/rollback/20260810000000_create_pesticide_application_products.down.sql`

```sql
-- Migration: Split pesticide applications into event + product line items
-- Date: 2026-08-10
-- Purpose: One spray event = one turfsheet.pesticide_applications row with N
--          turfsheet.pesticide_application_products children. Replaces the inferred grouping
--          (normalized application_date + area_applied) in turfsheet-app/src/lib/pesticideMix.ts,
--          which falsely merged two same-day sprays to one area and falsely split on area typos.
--          Idaho ISDA records -- lossless by design.
-- Rollback: supabase/rollback/20260810000000_create_pesticide_application_products.down.sql
--
-- DO NOT APPLY WITH `supabase db push` -- migration history on this project is out of sync.
-- Apply via the Supabase Studio SQL editor.
--
-- Run the PREVIEW queries (plan section "Preview") and eyeball the output BEFORE running this.
-- The DELETE at the end is irreversible except via the snapshot table.

BEGIN;

-- 0. Snapshot. Everything below can be reconstructed from this table.
CREATE TABLE IF NOT EXISTS turfsheet.pesticide_applications_pre_split_20260810 AS
    SELECT * FROM turfsheet.pesticide_applications;

-- New table in a PostgREST-exposed schema -> lock it down explicitly.
ALTER TABLE turfsheet.pesticide_applications_pre_split_20260810 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON turfsheet.pesticide_applications_pre_split_20260810 FROM anon, authenticated;

COMMENT ON TABLE turfsheet.pesticide_applications_pre_split_20260810 IS
    'Pre-split snapshot (one row per product). Rollback and verification source for 20260810000000. Do not drop until Migration B is verified in production. No policy, no grants: service_role only.';

-- 1. Child table
CREATE TABLE IF NOT EXISTS turfsheet.pesticide_application_products (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL
        REFERENCES turfsheet.pesticide_applications(id) ON DELETE CASCADE,
    line_number    INTEGER NOT NULL DEFAULT 1 CHECK (line_number >= 1),

    product_name            TEXT NOT NULL CHECK (char_length(btrim(product_name)) > 0),
    epa_registration_number TEXT,
    active_ingredient       TEXT,
    manufacturer            TEXT,
    epa_lot_number          TEXT,

    application_rate  TEXT NOT NULL CHECK (char_length(btrim(application_rate)) > 0),
    rate_unit         TEXT DEFAULT 'oz/1000sqft',
    total_amount_used TEXT,
    amount_per_tank   TEXT,
    rei_hours         INTEGER CHECK (rei_hours IS NULL OR rei_hours >= 0),

    -- Per-product. Proven by production data: one 4-product mix holds 4 distinct target pests.
    target_pest TEXT,

    -- Nullable override; NULL inherits the event's method.
    method TEXT CHECK (method IS NULL OR char_length(btrim(method)) BETWEEN 1 AND 60),

    -- Audit trail to the pre-split row. NULL for rows created after the split.
    -- UNIQUE makes the backfill INSERT re-runnable.
    legacy_source_id UUID UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pap_application_id
    ON turfsheet.pesticide_application_products(application_id, line_number);
CREATE INDEX IF NOT EXISTS idx_pap_product_name
    ON turfsheet.pesticide_application_products(product_name);

ALTER TABLE turfsheet.pesticide_application_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pesticide_application_products_authenticated_all"
    ON turfsheet.pesticide_application_products;
CREATE POLICY "pesticide_application_products_authenticated_all"
    ON turfsheet.pesticide_application_products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

REVOKE ALL ON turfsheet.pesticide_application_products FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON turfsheet.pesticide_application_products TO authenticated;

DROP TRIGGER IF EXISTS update_pesticide_application_products_updated_at
    ON turfsheet.pesticide_application_products;
CREATE TRIGGER update_pesticide_application_products_updated_at
    BEFORE UPDATE ON turfsheet.pesticide_application_products
    FOR EACH ROW EXECUTE FUNCTION turfsheet.update_updated_at_column();

COMMENT ON TABLE turfsheet.pesticide_application_products IS
    'One product line within a spray event. Parent = turfsheet.pesticide_applications.';
COMMENT ON COLUMN turfsheet.pesticide_application_products.method IS
    'Per-product override. NULL inherits pesticide_applications.method. Non-null only when one event genuinely mixed methods (granular broadcast + tank spray).';
COMMENT ON COLUMN turfsheet.pesticide_application_products.legacy_source_id IS
    'id of the pre-split pesticide_applications row this line was backfilled from.';

-- 2. The parent must be insertable with no product data. Without this every save 400s.
ALTER TABLE turfsheet.pesticide_applications
    ALTER COLUMN product_name     DROP NOT NULL,
    ALTER COLUMN application_rate DROP NOT NULL;

DO $$
DECLARE col text;
BEGIN
    FOREACH col IN ARRAY ARRAY[
        'product_name','epa_registration_number','active_ingredient','application_rate',
        'rate_unit','total_amount_used','amount_per_tank','manufacturer','rei_hours',
        'epa_lot_number','target_pest'
    ] LOOP
        EXECUTE format('COMMENT ON COLUMN turfsheet.pesticide_applications.%I IS %L', col,
            'DEPRECATED 2026-08-10. Superseded by turfsheet.pesticide_application_products. Stale after the first app-side edit. Dropped by migration 20260812000000.');
    END LOOP;
END $$;

-- 3a. One child line per ORIGINAL row. Canonical parent = oldest row in the group.
--     GROUP/PARTITION on raw area_applied: a typo splits into two events rather than
--     falsely merging. Postgres partitions NULLs together, so nullable time/operator are fine.
WITH ranked AS (
    SELECT p.*,
           first_value(p.id) OVER w AS canonical_id,
           row_number()      OVER w AS line_no
    FROM turfsheet.pesticide_applications p
    WINDOW w AS (
        PARTITION BY p.application_date, p.area_applied, p.application_time, p.operator_id
        ORDER BY p.created_at ASC, p.id ASC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    )
)
INSERT INTO turfsheet.pesticide_application_products (
    application_id, line_number,
    product_name, epa_registration_number, active_ingredient, manufacturer, epa_lot_number,
    application_rate, rate_unit, total_amount_used, amount_per_tank, rei_hours,
    target_pest, method, legacy_source_id, created_at, updated_at
)
SELECT r.canonical_id, r.line_no,
       r.product_name, r.epa_registration_number, r.active_ingredient, r.manufacturer,
       r.epa_lot_number, r.application_rate, r.rate_unit, r.total_amount_used,
       r.amount_per_tank, r.rei_hours, r.target_pest, r.method,
       r.id, r.created_at, r.updated_at
FROM ranked r
ON CONFLICT (legacy_source_id) DO NOTHING;

-- 3b. Preserve notes that would otherwise die with the non-canonical rows.
--     Reads from the snapshot, so re-running yields the identical string.
UPDATE turfsheet.pesticide_applications canon
SET notes = m.merged_notes
FROM (
    SELECT c.application_id AS id,
           string_agg(DISTINCT btrim(b.notes), E'\n---\n') AS merged_notes
    FROM turfsheet.pesticide_application_products c
    JOIN turfsheet.pesticide_applications_pre_split_20260810 b ON b.id = c.legacy_source_id
    WHERE b.notes IS NOT NULL AND btrim(b.notes) <> ''
    GROUP BY c.application_id
    HAVING count(DISTINCT btrim(b.notes)) > 1
) m
WHERE canon.id = m.id;

-- 3c. Drop the now-redundant parent rows. Provably safe:
--       * a CANONICAL row has a child whose application_id = its own id -> EXISTS is false
--         -> never deleted.
--       * a NON-CANONICAL row has zero children pointing at it (its line was re-parented in
--         3a) -> ON DELETE CASCADE removes nothing. No orphans.
--       * re-running deletes zero rows.
DELETE FROM turfsheet.pesticide_applications p
WHERE EXISTS (
    SELECT 1 FROM turfsheet.pesticide_application_products c
    WHERE c.legacy_source_id = p.id AND c.application_id <> p.id
);

NOTIFY pgrst, 'reload schema';

COMMIT;
```

**Ordering is absolute:** 3a (insert) before 3c (delete). Reversed, the product data is gone. The
single `BEGIN;…COMMIT;` means any failure rolls back the whole thing.

The canonical row's own product data stays in its (now nullable, now deprecated) legacy columns
*and* is copied to a child line — duplicated on purpose during the A→B window. Nothing may read
the parent copies; they go stale on the first edit.

### Rollback for A

`supabase/rollback/20260810000000_create_pesticide_application_products.down.sql` — lives outside
`migrations/` so a migration run can never pick it up:

```sql
BEGIN;

-- Fail loudly rather than silently dropping post-split work.
DO $$
DECLARE post_split integer;
BEGIN
    SELECT count(*) INTO post_split FROM turfsheet.pesticide_application_products
    WHERE legacy_source_id IS NULL;
    IF post_split > 0 THEN
        RAISE EXCEPTION 'Refusing to roll back: % product line(s) created after the split are not in the snapshot. Export them first.', post_split;
    END IF;
END $$;

DROP TABLE IF EXISTS turfsheet.pesticide_application_products CASCADE;

DELETE FROM turfsheet.pesticide_applications;
INSERT INTO turfsheet.pesticide_applications
    SELECT * FROM turfsheet.pesticide_applications_pre_split_20260810;

ALTER TABLE turfsheet.pesticide_applications
    ALTER COLUMN product_name     SET NOT NULL,
    ALTER COLUMN application_rate SET NOT NULL;

NOTIFY pgrst, 'reload schema';
COMMIT;
```

---

## Preview queries — run first, eyeball the output

**P1 — what will merge** (expect the 13-group shape; 6 rows with `> 1`):

```sql
SELECT application_date, area_applied, application_time, operator_id,
       count(*) AS product_rows,
       string_agg(product_name, ' + ' ORDER BY created_at, id) AS products,
       array_agg(id ORDER BY created_at, id) AS row_ids
FROM turfsheet.pesticide_applications
GROUP BY 1,2,3,4 HAVING count(*) > 1
ORDER BY application_date DESC;
```

**P2 — what the conservative key splits that the old UI showed as one mix.** This is the regression
surface of decision #1. Currently returns zero rows; re-run before applying in case new data landed.

```sql
SELECT application_date, lower(btrim(area_applied)) AS area_norm,
       count(*) AS rows_total,
       count(DISTINCT (area_applied, application_time, operator_id)) AS new_groups,
       array_agg(DISTINCT area_applied) AS area_variants,
       array_agg(DISTINCT application_time) AS times,
       array_agg(DISTINCT product_name) AS products
FROM turfsheet.pesticide_applications
GROUP BY 1,2
HAVING count(DISTINCT (area_applied, application_time, operator_id)) > 1
ORDER BY 1 DESC;
```

**P3 — case/whitespace-only area variants.** Fix by hand *before* Migration A if they should merge.

```sql
SELECT application_date, lower(btrim(area_applied)) AS area_norm,
       array_agg(DISTINCT area_applied) AS raw_variants
FROM turfsheet.pesticide_applications
GROUP BY 1,2 HAVING count(DISTINCT area_applied) > 1
ORDER BY 1 DESC;
```

**P4 — shared-field disagreement (data-loss detector).** Anything listed means the canonical row's
value wins and the others are dropped. Already run: only `notes` (2026-08-07, handled by 3b) and
`target_pest` (2026-07-29, now a child column) disagree. Re-run before applying.

```sql
SELECT application_date, area_applied, count(*) AS rows,
       count(DISTINCT weather_conditions) AS n_weather,
       count(DISTINCT temperature) AS n_temp,
       count(DISTINCT equipment_used) AS n_equip,
       count(DISTINCT area_size) AS n_areasize,
       count(DISTINCT notes) AS n_notes,
       count(DISTINCT method) AS n_method,
       count(DISTINCT target_pest) AS n_target,
       count(DISTINCT applicator_license) AS n_license,
       count(DISTINCT worker_protection_exchange) AS n_wps
FROM turfsheet.pesticide_applications
GROUP BY 1,2,application_time,operator_id
HAVING greatest(count(DISTINCT weather_conditions), count(DISTINCT temperature),
                count(DISTINCT equipment_used), count(DISTINCT area_size),
                count(DISTINCT notes), count(DISTINCT method), count(DISTINCT target_pest),
                count(DISTINCT applicator_license),
                count(DISTINCT worker_protection_exchange)) > 1
ORDER BY 1 DESC;
```

If P4 flags a column other than `notes` or `target_pest`, fix the source rows by hand before
applying — far cheaper than reconstructing an ISDA record later.

---

## Verification

**Before** — record these: `SELECT count(*) AS rows_before, count(DISTINCT (application_date,
area_applied, application_time, operator_id)) AS expected_events FROM
turfsheet.pesticide_applications;` (currently 32 and 13).

**After** — all of these must hold:

| # | Check | Expect |
|---|---|---|
| V1 | `count(*)` on `pesticide_application_products` | `= rows_before` (32) |
| V2 | `count(*)` on `pesticide_applications` | `= expected_events` (13) |
| V3 | children with no parent | 0 |
| V4 | events with no children | 0 |
| V5 | child fields vs snapshot (`IS DISTINCT FROM` across all 12 product columns) | 0 |
| V6 | snapshot rows with no child (`legacy_source_id` unmatched) | 0 |
| V7 | surviving parents' event fields vs snapshot (`notes` excluded — 3b may merge) | 0 |

```sql
-- V5 (the important one)
SELECT count(*) AS mismatched
FROM turfsheet.pesticide_application_products c
JOIN turfsheet.pesticide_applications_pre_split_20260810 b ON b.id = c.legacy_source_id
WHERE c.product_name            IS DISTINCT FROM b.product_name
   OR c.epa_registration_number IS DISTINCT FROM b.epa_registration_number
   OR c.active_ingredient       IS DISTINCT FROM b.active_ingredient
   OR c.manufacturer            IS DISTINCT FROM b.manufacturer
   OR c.epa_lot_number          IS DISTINCT FROM b.epa_lot_number
   OR c.application_rate        IS DISTINCT FROM b.application_rate
   OR c.rate_unit               IS DISTINCT FROM b.rate_unit
   OR c.total_amount_used       IS DISTINCT FROM b.total_amount_used
   OR c.amount_per_tank         IS DISTINCT FROM b.amount_per_tank
   OR c.rei_hours               IS DISTINCT FROM b.rei_hours
   OR c.target_pest             IS DISTINCT FROM b.target_pest
   OR c.method                  IS DISTINCT FROM b.method;
```

**Spot check** — the shape the UI and export will render:

```sql
SELECT p.application_date, p.application_time, p.area_applied, s.name AS operator,
       c.line_number, c.product_name, c.application_rate, c.total_amount_used,
       c.rei_hours, c.target_pest, COALESCE(c.method, p.method) AS method
FROM turfsheet.pesticide_applications p
JOIN turfsheet.pesticide_application_products c ON c.application_id = p.id
LEFT JOIN turfsheet.staff s ON s.id = p.operator_id
ORDER BY p.application_date DESC, p.application_time NULLS LAST, p.id, c.line_number;
```

The 2026-07-29 Creeks + Pond 18 event must show four lines with four distinct target pests.

**Anon lockdown:** add `'pesticide_application_products'` and
`'pesticide_applications_pre_split_20260810'` to the `TABLES` array in
`scripts/verify-anon-lockdown.mjs:23-30`, then `node scripts/verify-anon-lockdown.mjs` → both
`LOCKED`, exit 0.

---

## Migration B — drop legacy product columns

**File:** `supabase/migrations/20260812000000_drop_legacy_pesticide_product_columns.sql`
**Precondition:** A applied AND verified AND the new frontend deployed and soaked.

Two `RAISE EXCEPTION` guards up front — refuse if any event has zero product lines (dropping the
columns would erase its only product record), and refuse if the snapshot table is missing (it is
the rollback source). Then:

```sql
DROP INDEX IF EXISTS turfsheet.idx_pesticide_app_product;

ALTER TABLE turfsheet.pesticide_applications
    DROP COLUMN IF EXISTS product_name,
    DROP COLUMN IF EXISTS epa_registration_number,
    DROP COLUMN IF EXISTS active_ingredient,
    DROP COLUMN IF EXISTS application_rate,
    DROP COLUMN IF EXISTS rate_unit,
    DROP COLUMN IF EXISTS total_amount_used,
    DROP COLUMN IF EXISTS amount_per_tank,
    DROP COLUMN IF EXISTS manufacturer,
    DROP COLUMN IF EXISTS rei_hours,
    DROP COLUMN IF EXISTS epa_lot_number,
    DROP COLUMN IF EXISTS target_pest;
```

Rollback in `supabase/rollback/20260812000000_*.down.sql`: `ADD COLUMN IF NOT EXISTS` for each,
then repopulate from `DISTINCT ON (application_id)` ordered by `line_number` — best effort, since
a multi-product event cannot be represented in the one-row-per-product shape. Full data remains in
the child table regardless.

---

## Frontend

All consumers are `src/pages/PesticidePage.tsx` and `src/components/pesticide/*` — nothing else in
the repo queries these tables (no edge functions exist). These files don't compile independently,
so the cutover ships as one commit.

### Types — `src/types/index.ts`

Replace `PesticideApplication` (lines 290-322) with `PesticideApplicationEvent` (the 19 event
fields), `PesticideApplicationProduct` (the 13 product fields + `application_id`, `line_number`,
`legacy_source_id`), and `PesticideApplicationWithProducts extends PesticideApplicationEvent
{ products: PesticideApplicationProduct[] }`. Keep `KnownApplicationMethod` / `ApplicationMethod`
(278-288) unchanged.

Write-side drafts: `EventDraft` (all strings + `worker_protection_exchange: boolean`),
`ProductLineDraft` (all strings, plus a client-only `key: string` and an optional `id?: string`
present when editing an existing child), and `PesticideApplicationDraft { event, lines }`. Move
`CalculatorRecordPayload` here from `pesticideMix.ts`, reshaped to `{ event, lines }`.

Delete `PesticideApplication` outright — a `@deprecated` alias would just let stale code compile.

### Data layer

Extract the select into `src/lib/pesticideData.ts`; today the same `.select('*')` is repeated at
`PesticidePage.tsx:63-66`, `172-175`, and `216-219`.

```ts
const APPLICATION_SELECT = `
  id, application_date, application_time, area_applied, area_size, method, operator_id,
  applicator_license, recommended_by, equipment_used, temperature, wind_speed, wind_direction,
  humidity, weather_conditions, worker_protection_exchange, worker_protection_requirements,
  notes, created_at, updated_at,
  products:pesticide_application_products (
    id, application_id, line_number, product_name, epa_registration_number, active_ingredient,
    manufacturer, epa_lot_number, application_rate, rate_unit, total_amount_used,
    amount_per_tank, rei_hours, target_pest, method, created_at, updated_at
  )
`;

await supabase.from('pesticide_applications')
  .select(APPLICATION_SELECT)
  .order('application_date', { ascending: false })
  .order('application_time', { ascending: false, nullsFirst: false })
  .order('line_number', { referencedTable: 'pesticide_application_products', ascending: true });
```

One FK from child→parent, so the bare table name resolves it — no `!fk_name` hint needed.
`referencedTable` requires supabase-js ≥ 2.39; installed is **2.94.0** (declared `^2.39.0`).

**Insert** — two round trips, PostgREST has no client transaction. Insert the parent
`.select('id').single()`, then insert the lines. **If the line insert fails, delete the parent.**
Without that compensation a network blip leaves a childless event — invisible in the UI and a hard
blocker for Migration B.

**Edit** — diff the lines rather than delete-all-then-reinsert: partition `draft.lines` into
removed (existing id not in draft), updated (has id), inserted (no id); `line_number` from array
position. Preserves each line's `created_at`, which is compliance-relevant, and avoids a window
where the event has zero lines.

**Delete** — `.delete().eq('id', eventId)` on the parent; `ON DELETE CASCADE` handles children.
Update the confirm copy to mention the line count.

**Delete `src/lib/pesticideMix.ts` entirely** — `SHARED_MIX_FIELDS`, `norm`, `isSameTankMix`,
`pickSharedMixFields`, `findMixSiblings`, `findMixSiblingIds` all exist only to serve the inferred
model. Delete `src/lib/pesticideMix.test.mjs` (all five assertions test the deleted functions). In
`PesticidePage.tsx` delete `cascadeSharedToSiblings` (100-125), the `mixProducts` state (49), the
multi-row fan-out in `handleSave` (132-151), and the `cascaded > 0` status messages (182-190,
222-226).

New pure module `src/lib/pesticideApplication.ts`: `toEventRow`, `toProductRow`,
`blankProductLine`, `productSummary`, `resolveMethod`, `maxReiHours`, `flattenEventsToLogLines`,
`reconcileMethods`. New `src/lib/pesticideApplication.test.mjs` following the existing convention
(no `test` script in package.json; `pesticideMix.test.mjs:4` documents it as
`node src/lib/pesticideMix.test.mjs`, matching `courseGeometry.*.test.mjs`) — duplicate the helper
implementations at the top, `node:assert/strict`, end with a `console.log`.

### UI

**`PesticideListItem.tsx` → `PesticideEventRow.tsx`.** Grid becomes
`grid-cols-[28px_1.2fr_2fr_1.5fr_1fr_1fr]` (chevron · Date · Products · Area · Operator · Method) on
both the row and the header at `PesticidePage.tsx:450-457`. The `Rate` column moves into the
expansion — rate is per-product. `productSummary` renders `"Heritage +4 more"`. The chevron button
needs `e.stopPropagation()` or every expand also opens the modal; disable it when
`products.length <= 1`. Expanded state is a `Set<string>` in `PesticidePage`.

**Filter** (`PesticidePage.tsx:273-281`) — product names now live on the child, so match
`event.products.some(p => …)`. Everything is already loaded client-side; no `!inner` needed.

**Detail modal** (558-774) — the `product_name` h3 has no meaning for a mix; headline
`area_applied` with the date/time as subtitle. Lines 577-603 become a products table ordered by
`line_number`. Move `manufacturer`, `epa_lot_number`, `amount_per_tank` out of Compliance Details
into that table. **REI becomes `maxReiHours(products)`** labelled "REI (longest in mix)" — the
site's restricted-entry interval is the longest of the products applied, which the current UI gets
wrong for mixes.

**`PesticideForm.tsx` → multi-product** (the largest change). Split the single flat `formData`
(38-99) into `event: EventDraft` and `lines: ProductLineDraft[]`. New
`src/components/pesticide/ProductLineFields.tsx` renders one bordered card per line: the library
select (currently 253-268), signal-word banner (272-281), that line's weather alerts, and the
product inputs at 394-489 and 528-538, plus Target Pest and an optional Method override.

- **React keys must be `line.key`** (a `crypto.randomUUID()` minted at creation), never the array
  index and never `id` (new lines have none). Index keys produce a silent bug when a user removes a
  middle line: inputs keep old values under a new label. On a compliance record that is serious.
- Do **not** reuse `ProductForm.tsx` — that is the `chemical_products` library editor, a different
  concern. The name collision is the trap.
- `handleProductSelect` (161-181) currently writes two *event*-level side effects into shared
  state. `method` moves to the line; derive `event.method` via `reconcileMethods(lines)` in submit
  (if all lines agree, set it and clear the overrides; if not, keep the overrides).
  `worker_protection_requirements` stays event-level but aggregates deduped warnings across all
  lines — guard the `setEvent` with an inequality check or it loops.
- Weather alerts (187-205) become `alertsByLineKey`, **prefixed with the product name** — with
  three products in the tank, "wind 12 mph exceeds label max 10 mph" doesn't say which to pull.
- Validation: keep the WPS hard block (209-212); drop lines blank in both `product_name` and
  `application_rate`; require ≥1 surviving line and name the incomplete line number; warn (don't
  block) on duplicate product names — double-dosing one product in a visit is unusual but legal.
- `Modal` already has `max-h-[90vh]` + `overflow-y-auto` (`src/components/ui/Modal.tsx:63`), so a
  6-product form scrolls. Consider bumping add/edit from `size="lg"` to `"xl"`.

**`SprayCalculator.tsx`** — net deletion. `{ shared, mixProducts }` → `{ event, lines }`; the
`const first = mixProducts[0]` hoist (734) and the seven first-product copies into `shared`
(737-745) all disappear, since they existed only because the form held one product. **Fix the
existing `area_applied` bug while here**: the calculator has `areaSqft` but no area *name*, so
`shared` never populated the required `area_applied` and the operator retyped it every time — add
an `areaLabel` text input next to the sq-ft input. `handleRecordFromCalculator`
(`PesticidePage.tsx:260-271`) loses its shape-sniffing branch.

### Export / print — unchanged output, new sourcing

The regulator log stays **one row per product line** with event columns repeated on every row (no
`rowSpan`; each row of an ISDA log must stand alone on a photocopy). `PESTICIDE_LOG_COLUMNS`
(`pesticideLogExport.ts:7-31`) is **byte-identical** — same 24 columns, same order, same headers.
Only the sourcing changes: `applicationToLogRow` (48-78) becomes `logLineToRow({ event, product })`,
drawing Product/EPA Reg #/Active Ingredient/Manufacturer/EPA Lot #/Rate/Total Used/Amt-Tank/REI/
Target from the product and the rest from the event, with `product.method ?? event.method`.
`flattenEventsToLogLines` emits one row for an event with zero products so a record can never
silently vanish. `subtitleForLog` (106-118) gains a line count — "12 Applications" now means
something different than it did.

That the regulator-facing artifact is unchanged in shape is the strongest evidence this refactor is
safe for compliance.

**`ApplicationPrintView.tsx` is dead code** — `PesticidePage.tsx:776-780` renders it with a
`printRef` that is never read, while `handlePrint` (307) uses `window.open` +
`buildPesticideLogPrintHtml`. It only fires on a browser Ctrl+P. It consumes the deleted
`PesticideApplication` type, so it must be ported or removed; **removing it** (with `printRef`) is
the recommendation. Flagging explicitly since it's a deletion beyond the literal ask.

---

## Task order

Each task ends with a runnable check. **Do not start task 7 until 6 is verified in production.**

| # | Task | Verify |
|---|---|---|
| 1 | Run P1-P4 in Studio against production. Hand-fix any P3 area typos and any P4 disagreement outside `notes`/`target_pest`. | P3 empty; P4 shows only the two known rows. |
| 2 | Types in `src/types/index.ts`; `src/lib/pesticideApplication.ts` + its `.test.mjs`. | `node src/lib/pesticideApplication.test.mjs` passes; `npx tsc -b --noEmit` clean. |
| 3 | Write Migration A + its rollback file. Do not apply. | Read against this plan: insert-before-delete ordering and the `DROP NOT NULL` block both present. |
| 4 | **Apply Migration A** via Studio SQL editor. Run V1-V7 + spot check. | V1=32, V2=13, V3-V7=0; the 07-29 event shows 4 lines with 4 target pests. **Riskiest step — stop and roll back if anything is non-zero.** |
| 5 | Add both new tables to `TABLES` in `scripts/verify-anon-lockdown.mjs:23-30`. | `node scripts/verify-anon-lockdown.mjs` → both `LOCKED`, exit 0. |
| 6 | Frontend cutover in one commit: `pesticideData.ts`, `pesticideLogExport.ts`, `ProductLineFields.tsx`, `PesticideForm.tsx`, `PesticideEventRow.tsx`, `PesticidePage.tsx`, `SprayCalculator.tsx`; delete `pesticideMix.ts`, `pesticideMix.test.mjs`, `PesticideListItem.tsx`, `ApplicationPrintView.tsx`. | `npm run build` and `npm run lint` clean. On `npm run dev -- --port 5179`: record a 3-product mix, expand it, edit it (remove line 2, add line 3), delete it, print, download PDF. PDF row count = product-line count; columns unchanged. |
| 7 | Feature branch → PR → merge to main (auto-deploys). Soak. | `SELECT count(*) FROM turfsheet.pesticide_application_products WHERE legacy_source_id IS NULL;` > 0 and the spot check reads correctly. |
| 8 | **Apply Migration B.** | Both guards pass; no product columns on the parent; app still loads, saves, exports. |
| 9 | Later: drop the snapshot table, remove it from the verify script. | Nothing references it. |

### Riskiest steps

1. **The `DELETE` in Migration A** — irreversible except through the snapshot. Mitigated by the
   snapshot taken in the same transaction, the `BEGIN/COMMIT` wrapper, the preview queries, and a
   predicate provably incapable of removing a canonical row. Run task 1 for real; don't skim it.
2. **The insert compensation path** — a missing or failing compensating delete leaves a childless
   event, invisible in the UI and a hard blocker for Migration B. Test it deliberately by
   temporarily pointing the child insert at a bogus column.
3. **`DROP NOT NULL`** — one line; omitting it 400s every save in production.
4. **React keys in the form** — index keys corrupt data silently when a middle line is removed.
5. **Migration B timing** — applying it before the frontend is deployed 400s every page load.

### Out of scope (noted, not touched)

- `supabase/migrations/20260728120100_set_product_rei_hours.sql` is written but unapplied, pending
  REI verification against physical labels (`.agent/Tasks/active.md`).
- The MCP `config.json` entry for `turfsheet` uses a `{url, schema}` shape the runner doesn't
  recognize, hence the `maintenance-log` workaround.
- `ProductLibrary` keeps its own `products` state, so a product added there doesn't reach the
  form's dropdown until reload.
