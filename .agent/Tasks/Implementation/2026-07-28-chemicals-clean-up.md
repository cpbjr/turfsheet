# Chemicals Page Clean-Up

**Branch:** `feature/chemicals-clean-up`
**On approval:** copy this file to `.agent/Tasks/Implementation/2026-07-28-chemicals-clean-up.md` (project convention) before coding.

---

## Context

The Chemical Management page is the one part of TurfSheet Darryl has responded to, so it needs to be correct and usable before anything else gets built. Two things prompted this pass:

1. **A real logging failure today.** Chris applied Cutrine Plus Granular by hand into Pond 8 East. The Application Method dropdown offers only spray/granular/injection/drench/other and the Equipment dropdown has no hand option, so the record went in as method `granular` with equipment blank. A missing dropdown option must never block logging an application.
2. **An external QA audit** (`~/Documents/Obsidian/Bob/WPA-Work/projects/03-turfsheet-spray/dogfood-output/report.md`, 2026-07-28) found a real display bug plus polish items.

Verified before planning:
- The audit's "Recommended By" fix was made in a **different clone** (`/home/wpauser/src/turfsheet`, not on this machine). It is **not** in this repo and **not** on `origin/main`. It must be made here.
- Audit items #3 (Test Fert) and #4 (22:19 sample time) are **already resolved** in live data — `Test Fert` is `is_active = false`, the March record now reads `07:30`. No work needed.
- `CLAUDE.md` lists Supabase ref `scktzhwtkscabtpkvhne`. That is **stale** — `.env.local`, CI secrets, and the live app all use **`klyzdnocgrvassppripi`**. Correcting the doc is a separate cleanup, noted here so nobody points a migration at the wrong project.
- Local `HEAD` (`f4168c8` Maintenance Photo Viewer) is one commit ahead of `origin/main` and comes along on this branch.

**Outcome:** Darryl can log any application — including hand-broadcast aquatic granulars — the printed compliance log shows the right names and REIs, and the form isn't a scroll tunnel.

---

## Scope (approved)

| # | Item | Type |
|---|------|------|
| 1 | Method + Equipment options expanded, with an "Other → free text" escape hatch | Feature + migration |
| 2 | "Recommended By" always shows `--` | Bug |
| 3 | Record Application modal too narrow | UX |
| 4 | Every product has `rei_hours = 0`, so REI never autofills | Data |

Explicitly **out of scope:** anon write / RLS lockdown (needs auth — flagged in the audit as Medium, acceptable for a private pilot URL); the repo-wide `Staff.id` type sweep; the committed Postgres password found in `.agent/Tasks/completed/2026-02/*.md` (**flagging only — separate security task, do not touch here**).

---

## Step 1 — Shared helpers

**New `turfsheet-app/src/lib/pesticideOptions.ts`** — single source of truth for both dropdowns and all three display sites.

```ts
export const METHOD_OPTIONS = [
  { value: 'spray',             label: 'Spray' },
  { value: 'granular',          label: 'Granular' },
  { value: 'broadcast_by_hand', label: 'Broadcast (By Hand)' },
  { value: 'spot_treatment',    label: 'Spot Treatment' },
  { value: 'aquatic_treatment', label: 'Aquatic / Water Treatment' },
  { value: 'injection',         label: 'Injection' },
  { value: 'drench',            label: 'Drench' },
];

export const EQUIPMENT_OPTIONS = [ /* existing 5 + By Hand, Hand Spreader, Push Spreader, ATV/Utility Spreader */ ];

export function formatMethod(method?: string | null): string {
  if (!method) return '--';
  const known = METHOD_OPTIONS.find(o => o.value === method);
  if (known) return known.label;
  return method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
```

This replaces three duplicated `formatMethod` helpers that just capitalize the first letter (`PesticidePage.tsx:290-292`, `PesticideListItem.tsx:15-17`, `ApplicationPrintView.tsx:24-26`) — those would render `broadcast_by_hand` as `"Broadcast_by_hand"`.

**Add `sameId()` to existing `turfsheet-app/src/lib/utils.ts`** (alongside `cn`):

```ts
export function sameId(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}
```

This formalizes a pattern already used 8+ times in the codebase — `ManageScheduleModal.tsx:69-70`, `StaffWhiteboardView.tsx:98,346,352`, `ProjectsPage.tsx:73`. **Do not refactor those call sites** in this branch; use `sameId` in the pesticide files only.

---

## Step 2 — Fix "Recommended By" (Bug 2)

Root cause: `staff.id` is `SERIAL`/integer in Postgres but declared `id: string` in `types/index.ts:50`, so the code compares a runtime number against a `String()`-ified id — `5 === "5"` is always false.

| File:line | Change |
|---|---|
| `PesticidePage.tsx:169-170` | `getStaffName` (print popup) → `staffMembers.find(s => sameId(s.id, id))` |
| `PesticidePage.tsx:620` | detail modal Recommended By → same |
| `PesticidePage.tsx:82-83` | `getOperatorName` → `sameId` too (works today only by accident) |
| `ApplicationPrintView.tsx:12-13` | `getOperatorName` → `sameId` |

**Do NOT change `Staff.id` to `number`.** Blast radius is 4+ hard typecheck failures in whiteboard code this branch has no business touching (`AssignStaffDropdown.tsx:20,59`, `StaffWhiteboardView.tsx:154,173`), and the real fix cascades into `DailyAssignment.staff_id` and four other subsystems. Leave a `// TODO` on `Staff.id` noting the DB is `SERIAL` and that an id-type sweep is its own task. `sameId` is behavior-identical either way and has zero blast radius.

**Do change `PesticideApplication.operator_id?: string` → `number`** (`types/index.ts:289`) — 5 sites, all inside this branch. Then fix `PesticideForm.tsx:41` to `initialData.operator_id?.toString() ?? ''` and `:207` to `parseInt(formData.operator_id, 10)`, making it symmetric with `recommended_by` at `:223` (it currently ships a raw string and only works because Postgres coerces it).

---

## Step 3 — Modal size prop (Bug 3)

`components/ui/Modal.tsx` hardcodes `max-w-xl` on line 35 and is imported by 9 files. Add an optional `size` prop with a **static** class map (Tailwind JIT can't see `max-w-${size}`):

```ts
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md', md: 'max-w-xl' /* current default */, lg: 'max-w-3xl', xl: 'max-w-5xl',
};
```

Default `'md'` → the other 8 consumers emit a byte-identical class string. Pass `size="lg"` to the three pesticide modals in `PesticidePage.tsx` (`:445` Record, `:460` Edit, `:477` Details).

Optional separate commit: `PesticideForm.tsx` uses fixed `grid-cols-2`/`grid-cols-3` at lines 290, 347, 386, 411, 447, 484, 509, 575, 597 — changing to `grid-cols-1 md:grid-cols-2` improves phone use in the shop. Pure CSS, independently revertible.

---

## Step 4 — Method / Equipment options + "Other" (Bug 1)

**New `turfsheet-app/src/components/ui/SelectWithOther.tsx`** so the escape-hatch behavior is defined once and both fields share it.

Storage decision: **free text goes directly into the existing `method` / `equipment_used` columns.** No `method_other` column. `equipment_used` is already unconstrained `TEXT`; a second column would force every read site (`PesticidePage.tsx:188,542`, `PesticideListItem.tsx:41`, `ApplicationPrintView.tsx:181`) to coalesce two fields and would put a sometimes-meaningless `"Other"` on the Idaho compliance printout. `formatMethod` already renders unknown values gracefully.

The one easy-to-get-wrong detail — derive "other" mode from the incoming value so **edit mode round-trips saved free text back into the text input** instead of showing a blank select:

```ts
const isKnown = options.some(o => o.value === value);
const [showOther, setShowOther] = useState(() => value !== '' && !isKnown);
```

The `'__other__'` sentinel is UI-only and must never reach `formData`.

Wire into `PesticideForm.tsx`: replace the Method `<select>` (`:512-523`) and Equipment `<select>` (`:541-552`).

Also fix `PesticideForm.tsx:169` — selecting a product currently **clobbers a method the user already chose** for zero-carrier products (the `prev.method ||` guard only protects the spray branch):

```ts
method: prev.method || (product.carrier_volume_gal === 0 ? 'granular' : 'spray'),
```

And `SprayCalculator.tsx:724` hardcodes `method: 'spray'` in its prefill bridge — make it carrier-aware to match.

---

## Step 5 — Migrations

Two files in `supabase/migrations/`, timestamped after `20260322010400`.

### 5a. `20260728120000_relax_pesticide_method_constraint.sql`

The CHECK is declared **inline and unnamed** in three separate migrations (`20260224000000:17-19`, `20260225041632:481-483`, `20260225060000:544-546`), so Postgres auto-named it. Discover it by the column it constrains rather than trusting a literal name:

```sql
DO $$
DECLARE con_name text;
BEGIN
    FOR con_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class r ON r.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = r.relnamespace
        WHERE n.nspname = 'turfsheet'
          AND r.relname = 'pesticide_applications'
          AND c.contype = 'c'
          AND EXISTS (
              SELECT 1 FROM unnest(c.conkey) AS ck
              JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum = ck
              WHERE a.attname = 'method'
          )
    LOOP
        EXECUTE format('ALTER TABLE turfsheet.pesticide_applications DROP CONSTRAINT %I', con_name);
        RAISE NOTICE 'Dropped method CHECK constraint: %', con_name;
    END LOOP;
END $$;

ALTER TABLE turfsheet.pesticide_applications
    ADD CONSTRAINT pesticide_applications_method_sane
    CHECK (method IS NULL OR char_length(btrim(method)) BETWEEN 1 AND 60);

COMMENT ON COLUMN turfsheet.pesticide_applications.method IS
    'Application method. UI offers a controlled vocabulary plus a free-text Other escape hatch. Canonical option list: turfsheet-app/src/lib/pesticideOptions.ts';
```

Permissive length check rather than no check — a missing option never blocks logging, but the column still can't hold blanks or a 4KB paste.

### 5b. `20260728120100_set_product_rei_hours.sql` (Bug 4)

All 13 `chemical_products` rows ship with `rei_hours = 0`. `PesticideForm.tsx:168` already autofills REI (`product.rei_hours ? ... : ''`) — **the falsy guard means 0 renders blank, so this is purely a data problem, no autofill code change needed.** Optional hardening: `product.rei_hours != null ? String(product.rei_hours) : ''`.

> ⚠️ **CHECKPOINT — Chris must confirm these values against the physical labels before push.** REI is a regulated compliance figure; these are proposed from general label knowledge, not read off Banbury's containers.

```sql
UPDATE turfsheet.chemical_products SET rei_hours = 48 WHERE epa_registration IN ('81927-23','42750-19'); -- 2,4-D Amine / Amine 4
UPDATE turfsheet.chemical_products SET rei_hours = 12 WHERE epa_registration = '53883-310';              -- Chlorothalonil 720 SFT
UPDATE turfsheet.chemical_products SET rei_hours = 48 WHERE name = 'Crossroad';                          -- triclopyr + 2,4-D, no EPA # on file
UPDATE turfsheet.chemical_products SET rei_hours = 4  WHERE epa_registration = '100-937';                -- Podium
UPDATE turfsheet.chemical_products SET rei_hours = 0  WHERE epa_registration = '8959-11';                -- Cutrine Plus Granular
-- Fertilizers/adjuvants are not pesticides; rei_hours = 0 is correct and left untouched.
```

**Do not backfill `pesticide_applications.rei_hours` on the two existing rows.** Those are signed compliance records of what was entered at application time; retroactively writing a REI the applicator never recorded is a records-integrity problem. Chris can Edit them if he wants them corrected.

Also fix both print paths, which use `app.rei_hours ? ... : '--'` and so print `--` for a legitimate `0` (`PesticidePage.tsx:194`, `ApplicationPrintView.tsx:183`) → `!= null`.

Push: `npx supabase@latest db push`. **Steps 4 and 5a must ship together** — UI emitting `broadcast_by_hand` before the constraint is relaxed gets a 400.

---

## Step 6 — Display sites

Delete the three local `formatMethod` helpers and import the shared one in `PesticidePage.tsx`, `PesticideListItem.tsx`, `ApplicationPrintView.tsx`.

Known gap worth fixing while in here: `PesticideForm.tsx` edit mode never initializes `selectedProductId` (only the prefill path at `:148` does), so reopening a saved record shows no product selected and no label-warning banner. Match `initialData.product_name` against `products` in the `useState` initializer.

---

## Verification

**Build**
```bash
cd turfsheet-app && npx tsc -b --noEmit && npm run build && npm run lint
```
Any whiteboard typecheck error means `Staff.id` was changed — revert that.

**DB state** (this exact invocation is verified working — the MCP config has no `turfsheet` project entry, but `maintenance-log` points at the same instance; wrap results in `json_agg` because the RPC mangles plain row sets):
```bash
cd ~/WhitePineTech/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"maintenance-log","sql":"SELECT json_agg(t) FROM (SELECT id,name,epa_registration,rei_hours FROM turfsheet.chemical_products ORDER BY id) t"}'
npx tsx run.ts supabase:sql '{"project":"maintenance-log","sql":"SELECT json_agg(t) FROM (SELECT * FROM turfsheet.pesticide_applications ORDER BY application_date DESC) t"}'
```
Expect REI populated per 5b, and **both application rows byte-identical** to their pre-migration values.

**Dev server:** `npm run dev -- --port 5179 --strictPort`, then at `/pesticide`:

1. Click the 2026-07-28 Cutrine row → detail modal "Recommended By" reads **Darryl**, not `--`.
2. **Print Log** → "Rec. By" column reads **Darryl** on both rows. This is a *different* code path (`:169-170`) from the modal (`:620`) — verify both.
3. Record Application → Method shows 7 options + Other; Equipment shows 9 + Other.
4. Log a test record with Method = *Broadcast (By Hand)*, Equipment = *By Hand*. List renders **"Broadcast (By Hand)"**, not `Broadcast_by_hand`.
5. Log another with Method → Other → `tossed from the dock`. Saves without a 400; renders as **"Tossed From The Dock"**.
6. Edit that record → Method comes back in free-text mode showing the saved text, not a blank select.
7. Select Cutrine Plus Granular → Method auto-sets Granular; change it to *Aquatic / Water Treatment*, re-select the same product → **choice survives**.
8. Select Chlorothalonil → REI autofills **12**; 2,4-D Amine 4 → **48**. Save → detail modal and Print Log show it.
9. Record Application modal is visibly wider; **Staff → Add Staff**, **Jobs → Add Job**, **Equipment** modals are unchanged.
10. Spray Calculator → calc → "Record This Application" bridge still prefills.
11. **Delete the test records from steps 4–5.**

**Edit round-trip regression (highest risk):** `handleEditApplication` (`PesticidePage.tsx:105-126`) writes the whole `cleanedData` object, so any field the form drops or mistypes overwrites the live row. After the `operator_id` parseInt change, edit a **throwaway** record and re-save without changing anything, then re-read via the query above — every column must be identical. Only then touch either real record.

---

## Risk

| Risk | Assessment |
|---|---|
| Method CHECK swap | None. `spray`/`granular` satisfy the new check; DROP/ADD is transactional; 2-row table, instant lock. |
| REI migration | Touches `chemical_products` only. Application rows untouched by design. |
| `operator_id: string → number` | Type-level only; PostgREST already returns a JSON number. The old annotation was a lie the code got away with. |
| Modal `size` default | Zero change for the 8 non-pesticide consumers. |
| Free text in `method` | A typo like `sprya` is now accepted. Mitigated: free text requires explicitly choosing "Other", and `formatMethod` echoes it verbatim so the mistake is visible in the list. |

## Commit sequence

1. `refactor(pesticide): shared method/equipment option maps + sameId helper`
2. `fix(pesticide): normalize staff id comparison so Recommended By resolves`
3. `feat(ui): optional size prop on Modal; widen pesticide modals`
4. `feat(pesticide): expand method/equipment options with Other free-text` ← ships with 5
5. `feat(db): relax pesticide method constraint for free-text methods`
6. `fix(db): populate real REI hours on chemical products` ← after Chris confirms labels
7. `style(pesticide): responsive form grids` (optional)
