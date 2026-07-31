# Pin Sheet UX Redesign — Implementation Plan v1
Date: 2026-07-31 · Status: PLANNING (no code changes yet) · Author: Old Tom Morris

> Planning-only document. No app code in this phase. Feature branches only,
> never `db push`, no ship unless Christopher asks.

---

## 1. Current-State Summary (grounded in code)

### Where pin sheets live today
Everything pin-related is embedded in the single `/maps` route:

- `src/pages/MapsPage.tsx` (~600 lines) — one page owns **everything**: layer
  toggles (`LayerControls`), hole filter, the pin-placement session state
  machine (`PinSession`, draft localStorage, tap-to-place, skip/back/next,
  avoid notes, save/load/delete pin sets, public handout token, print
  overlay). It is a map browser AND a pin wizard AND a print dispatcher in
  one component.
- `src/components/maps/PinPanel.tsx` (~570 lines) — a monolithic side panel
  with 40+ props doing setup form, saved-sets list, per-hole navigation,
  avoid toggles, save/finish/token actions.
- `src/components/maps/CourseMap.tsx` — Google map, green index loading,
  hole focus, tap handling, pin markers.
- `src/components/maps/PrintSheet.tsx` + `printSheet.css` +
  `src/lib/pinSheetPrintHtml.ts` — read-only handout rendered in a dedicated
  print window (token flow: `/maps?pinToken=...` → `pinSetByToken` RPC).
- `src/lib/courseGeometry.ts` — pure geometry: `buildGreenIndex`,
  `measurePin` (lat/lng → onYd/lrSide/lrYd), `lateralEdgeDistancesM`,
  `svgForHole`, storage normalization. Deliberately DOM-free and testable.
- `src/lib/pinSets.ts` — Supabase CRUD on `banbury_pin_sets` + localStorage
  draft (`banbury_pin_draft_v1`) + token helpers.
- `src/types/courseMap.ts` — `Pin`, `PinMap`, `PinSession`, `PinSetRow`,
  `GreenIndex` types.
- `src/lib/courseGeometry.lateral.test.mjs` — standalone Node test pattern
  (inline copy of the logic, `node src/lib/*.test.mjs`). This is the
  established testing convention for geometry; we follow it.

### Geometry conventions (already correct, keep as-is)
- `u` axis = along approach (front→back), `v` = across (left→right);
  computed per-green in `buildGreenIndex` from the hole centreline.
- `measurePin` rounds whole yards; `onYd` = distance from green front
  (`pu - frontU`); `depthYd` = full green depth (paper "GD").
- L/R = yards to nearest polygon side edge at the pin's depth
  (`lateralEdgeDistancesM`, true collar intersection, not envelope width).
  C = within 0.75 yd of centerline.
- Pin stored with `lat/lng` AND `u/v`; `pinsFromStorage` re-measures on load.

### Pain points
1. IA clutter: pin planning is a modal-ish panel bolted onto a map page that
   also serves irrigation layers, hole browsing, etc.
2. Setup → walk → print → share is a single cramped panel; no sense of
   "library of sheets" vs "active job" vs "delivery".
3. Placement is map-tap only. Darryl plans on paper (Hole | GD | Depth |
   Left | Center | Right) and there is no yards-first entry path — so paper
   sheets (e.g. the Club Champ finals) can't be keyed in directly.
4. `PinPanel`'s prop surface (40+) makes any change risky.

### Existing assets to reuse (do not rebuild)
- `courseGeometry.ts` pure functions, `pinSets.ts` persistence,
  `PrintSheet`/`pinSheetPrintHtml` delivery, `banbury_pin_sets` schema and
  `banbury_pin_set_by_token` RPC, localStorage draft recovery, avoid notes.

---

## 2. UX / IA Options

### Option A — Dedicated `/pins` route (RECOMMENDED)
New top-level route `PinsPage` with three internal views (state, not
sub-routes, to keep it simple): **Library** (list, new, load, duplicate,
delete), **Setup/Edit** (the planning surface: per-hole yards entry + map
mini-view), **Delivery** (status, token, print, handout link). Sidebar gets
a "Pin Sheets" item; `/maps` keeps a read-only "today's pins" layer toggle
and a "Open in Pin Sheets" deep link (`/pins?set=<id>`).

Pros: matches every other feature in the app (one page per concern); the
Sidebar already exists; setup/delivery get full width; map page declutters.
Cons: shared geometry/map code must be extracted into a hook; handout URL
moves (mitigation: keep `/maps?pinToken=` redirect working).

### Option B — Tabs inside `/maps`
"Map | Pin Sheets | Print" tabs on the existing page. Pros: smallest diff,
no routing changes. Cons: page stays a god-component; tabs hide the
workflow; doesn't fix PinPanel prop sprawl; print/delivery still cramped.

### Option C — Modal wizard over the map
Full-screen modal with stepper (Setup → Place → Deliver). Pros: keeps
context, feels guided. Cons: modals on mobile are miserable for a map +
table mix; deep-linking/sharing a sheet mid-edit is awkward; worse for
keying 18 rows of yards.

### Recommendation: Option A
Rationale: pin sheets are a first-class recurring workflow (Darryl plans on
paper, crew consumes a printout/link), not a map feature. A route gives
room for the yards-entry table, matches app IA, and lets `/maps` go back to
being a course map. Tabs are the fallback if route churn is judged too big.

---

## 3. Yards → Pin Inverse Placement (`placePinFromYards`)

### Signature (new pure function in `courseGeometry.ts`)
```ts
export interface YardsInput {
  onYd: number;                 // Depth-from-front (paper "Depth")
  side: 'L' | 'C' | 'R';
  lrYd?: number;                // required for L/R; ignored for C
}
export function placePinFromYards(
  greenIndex: GreenIndex,
  hole: number,
  input: YardsInput
): Pin | { ok: false; reason: string }
```

### Algorithm
1. `g = greenIndex[hole]`; bail `ok:false` if missing.
2. Target `pu = g.frontU + input.onYd / YARDS_PER_METER`.
   Validate `0 <= onYd <= round(g.depthYd)` (clamp with warning flag rather
   than hard reject? — decide: hard reject outside [0, depthYd+1], note in
   `reason`; paper GD may differ from geometry, so allow onYd up to
   `depthYd + 1` tolerance).
3. Resolve target `pv`:
   - Build `ringUV = ringToLocalUV(g)`.
   - For `side='C'`: `pv = 0`.
   - For `side='L'`: find left-edge intersection v-coordinate `vL` at
     `u = pu` by scanning `ringUV` for edges crossing `u = pu` (same
     intersection walk as `lateralEdgeDistancesM`, but returning the edge v,
     then `pv = vL + lrYd / YARDS_PER_METER` (v grows rightward; left edge
     is the smaller-v intersection of the two crossings at that u).
   - For `side='R'`: `pv = vR - lrYd / YARDS_PER_METER`.
   - If no left/right crossing exists at that exact `u` (very front/back of
     a pinched green), fall back to nearest-u edge vertex and set
     `approx: true` in the result.
4. Convert `(pu, pv)` → lat/lng by inverting the local frame:
   `xy = pu*u + pv*v`; `lat = origin.lat + xy.y / M_PER_DEG_LAT`;
   `lng = origin.lng + xy.x / metersPerDegLng(origin.lat)`.
5. **Round-trip through `measurePin`** so labels/lrSide/lrYd are
   recomputed exactly as a tap would produce them (single source of truth
   for rounding and C-threshold).
6. Point-in-polygon sanity: if the solved point falls outside the ring
   (e.g. lrYd > green width at that depth), return
   `ok:false, reason:'outside green'` — never silently place a pin off the
   green.
7. Result `Pin` includes `u/v`, `setAt`, plus a new optional
   `source: 'yards' | 'map'` marker (additive, nullable — existing rows
   read as `'map'`/undefined; no migration needed since `pins` is JSONB
   and `pinsForStorage` whitelists fields — add `source` to that whitelist).

### Validation rules (UI surfaces these inline)
- `onYd` integer, `1..round(depthYd)` (0 allowed but flagged "front edge").
- `lrYd` integer ≥ 0; required when side is L/R.
- C ignores lrYd.
- Show computed check: "green depth here: {depthYd} yd; width at this
  depth: {w} yd" — the same numbers `lateralEdgeDistancesM` yields.

### Tests — `src/lib/courseGeometry.placeYards.test.mjs`
Follow the existing `.test.mjs` standalone pattern (node-run, no Vite):
1. Round-trip: for every hole 1–18, take a known in-green (u,v) →
   `measurePin`-equivalent yards → `placePinFromYards` → measurePin result
   matches original onYd/lrSide/lrYd (±0 due to whole-yard rounding; assert
   |Δlat/lng| < 0.5 m).
2. C placement: pv ≈ 0, lrLabel === 'C'.
3. L vs R symmetry on a symmetric synthetic ring (square green): L6 from
   left edge == R6 from right edge mirrored.
4. Rejects: onYd > depthYd+1; lrYd wider than green at that depth
   (point-in-polygon fails); missing green index.
5. Pinched-front green (u with single crossing) → `approx` fallback or
   clean failure, never NaN lat/lng.
6. `depthYd=4` pin on a 24-yd green (hole 18 shape) places near front
   without falling off.
Use the real `banbury-course-v1.geojson` from `public/geo/` as fixture.

---

## 4. Flows (Phase 1)

### 4a. Library view (`/pins`, default)
- Table of saved sets via existing `listPinSets()`: play date, label,
  status badge, start hole, has-token icon, updated_at.
- Actions per row: Open (→ Setup), Duplicate (new draft copied), Delete
  (confirm), and status quick-set.
- "New pin sheet" button → Setup with empty session (same defaults as
  `emptySession()` today: today, start hole 1).
- Resume-local-draft banner (existing `loadDraft()`/`draftHasPins()`).

### 4b. Setup / Edit view (`/pins?set=<id>` or new)
Layout: left = 18-row **yards entry table** (the new core), right =
green mini-map (reuse `svgForHole`-style SVG or a zoomed CourseMap in
"single hole" mode) showing the placed dot live.

Table columns per hole (matching Darryl's paper):
`Hole | GD (read-only, from geometry depthYd) | Depth (onYd) | L/C/R
segmented toggle | Yards (lrYd, disabled on C) | live readout
(On X · L6 · depth Y)`.

- Row edit → `placePinFromYards` → updates `session.pins[hole]` → dot
  redraws. Map tap on the mini-map still works and back-fills the row
  (map → yards is `measurePin`, already exists).
- Header: label, play date, status, start hole (hole order preserved for
  printing), course avoid notes; per-hole avoid notes collapse per row.
- Autosave draft to localStorage (existing), explicit Save → `savePinSet`.
- Skip/clear per row (maps to existing `skipped` + `onClearPin`).
- Difficulty column: NOT shown (future; see non-goals).

### 4c. Delivery view
- Reached from Setup ("Review & deliver") or Library row.
- Read-only sheet summary table (18 holes in start-hole order) +
  green diagrams (reuse `svgForHole` rendering path).
- Actions: Print/PDF (existing `PrintSheet` window flow), Enable handout
  link (`randomToken` + `setPublicToken`, existing), copy URL, revoke.
- Status transitions: draft → scheduled → active → archived.

### 4d. `/maps` after split
- Layer controls + hole browse + irrigation stay.
- Pin UI reduced to: read-only display of the active/scheduled sheet's pins
  when a "Pins" layer is on, and a button "Open in Pin Sheets →".
- Handout compatibility: `/maps?pinToken=...` keeps working — either keep
  the token-resolution branch in MapsPage for one release, or redirect to
  `/pins/handout?token=...`. Decide in review; cheapest is leaving the
  branch in place.

---

## 5. Phases

### Phase 1 (this plan's scope — ship candidate)
1. Extract shared pin-session logic from MapsPage into
   `src/lib/usePinSession.ts` hook (state machine + draft + save/load
   callbacks) — pure refactor, MapsPage keeps working.
2. `placePinFromYards` + tests in courseGeometry.
3. New `PinsPage` (Library / Setup / Delivery), route `/pins`, Sidebar
   entry, `PinEntryTable` + `GreenMiniMap` components; reuse PinPanel
   internals broken into `PinLibraryList`, `PinSetupForm`, `PinDelivery`
   components.
4. Slim MapsPage to map + read-only pins layer + deep link.
5. Keep `/maps?pinToken=` working.
6. Note-only: document Club Champ JSON import path (see §7), no import UI.

### Phase 2 (later)
- Difficulty scoring (1–7) column + schema field + difficulty_average.
- Club Champ JSON importer (validated script → `banbury_pin_sets`).
- Print layout polish (offline PDF handouts integration w/ Drive).
- Avoid-note templates, pin-rotation suggestions from history.

---

## 6. File Touch List

New:
- `src/pages/PinsPage.tsx`
- `src/components/pins/PinLibraryList.tsx`
- `src/components/pins/PinSetupForm.tsx`
- `src/components/pins/PinEntryTable.tsx`
- `src/components/pins/GreenMiniMap.tsx`
- `src/components/pins/PinDelivery.tsx`
- `src/lib/usePinSession.ts`
- `src/lib/courseGeometry.placeYards.test.mjs`

Modified:
- `src/lib/courseGeometry.ts` (add `placePinFromYards`, export
  `ringToLocalUV`, add point-in-polygon helper, `source` field in
  `pinsForStorage`)
- `src/types/courseMap.ts` (`Pin.source?: 'map'|'yards'`, `YardsInput`)
- `src/App.tsx` (route `/pins`)
- `src/components/layout/Sidebar.tsx` (nav item)
- `src/pages/MapsPage.tsx` (remove session/panel/print wiring, keep
  read-only pins + token handout branch + deep link)
- `src/components/maps/PinPanel.tsx` (cannibalized into pins/* components;
  file likely deleted at end of Phase 1)

Unchanged: `pinSets.ts`, `PrintSheet.tsx`, `pinSheetPrintHtml.ts`,
`printSheet.css`, DB schema (JSONB `pins` absorbs `source`; no migration).

---

## 7. Club Championship data (tracking only)
`tmp/club-championship-2026-08-pins-darryl.json` holds FINAL placements for
2026-08-01/02 with difficulty scores. Phase 1 adds only a short
"Import notes" doc section: the file maps 1:1 onto `placePinFromYards`
inputs (Depth→onYd, L/C/R+value), GD differs from geometry in places —
import script (Phase 2) must trust Depth, not GD. Difficulty ignored for v1.

---

## 8. Acceptance Criteria (Phase 1)
1. `/pins` shows Library with existing saved sets; New/Resume/Open/Duplicate/
   Delete all work against `banbury_pin_sets`.
2. Setup table: entering Depth=9, L=6 on hole 1 places a pin whose
   readout matches, dot renders on mini-map, saves to DB with
   `source:'yards'`; re-opening reproduces the same numbers.
3. Map-tap placement still works and back-fills the table.
4. All `placePinFromYards` tests pass (`node src/lib/*.test.mjs`),
   including 18-hole round-trip on real GeoJSON.
5. Delivery: print window + handout token flow work unchanged;
   `/maps?pinToken=<existing>` still renders the handout.
6. `/maps` no longer shows the pin session panel; pins visible read-only.
7. No schema migrations; `npm run build` clean; manual smoke on dev server.

---

## 9. Risks
- **Map extraction regression**: MapsPage refactor is the riskiest step.
  Mitigate: do hook extraction first as its own commit with zero behavior
  change, verify, then build PinsPage on the hook.
- **Inverse-geometry edge cases**: pinched greens where u-line crosses the
  ring once; rounding drift between entered and displayed yards.
  Mitigate: round-trip via `measurePin`, `approx` flag, hard reject
  outside polygon.
- **Handout links already distributed**: breaking `/maps?pinToken=` would
  strand printed QR/links. Keep the branch.
- **Scope creep**: difficulty, rotation suggestions, import UI are tempting
  mid-build — explicitly deferred.
- **Two editors**: if MapsPage keeps any pin editing, state forks. Rule:
  `/maps` is read-only for pins after Phase 1.

## 10. Open Questions
1. Handout URL: keep `/maps?pinToken=` forever, or move to
   `/pins/handout?token=` with a redirect? (Default: keep, decide in review.)
2. `/maps` read-only pins layer: auto-show today's `active` sheet, or only
   via layer toggle? (Default: toggle.)
3. Mini-map in Setup: lightweight SVG (`svgForHole` style, no Google Maps
   dependency, tap-to-place via SVG click) vs embedded CourseMap? (Default:
   SVG — faster, testable, no API key path; confirm.)
4. Duplicate-set semantics: copy as new draft with today's date?
   (Default: yes, label "Copy of …".)
5. Should `onYd = 0` (front edge) be allowed or min 1? (Default: allow 0
   with warning chip.)
6. Does Darryl ever want fraction yards on paper? Current convention is
   whole yards — table input integer-only. Confirm.

## 11. Phase-1 Non-Goals
- No Difficulty column/scoring anywhere in UI or schema.
- No Club Champ JSON importer UI/script (note only).
- No DB migrations, no `db push`.
- No print layout redesign (reuse existing PrintSheet as-is).
- No irrigation layer changes; no pin-rotation/history analytics.
- No deploy/merge — feature branch only, ship only when Christopher asks.
