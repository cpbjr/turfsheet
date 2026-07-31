# Pin Sheet UX Redesign — Implementation Plan v2
Date: 2026-07-31 · Status: PLANNING (revised after review) · Author: Old Tom Morris  
**Rev:** 2.1 (2026-07-31) — static green basemap underlay noted as Phase 2; Phase 1 SVG confirmed

> Planning-only document. No app code in this phase. Feature branches only,
> never `db push`, no ship unless Christopher asks.
> Supersedes 2026-07-31_pin-sheet-redesign-v1.md (kept for history).

---

## 1. Current-State Summary (unchanged from v1, verified in code)

Everything pin-related lives in the single `/maps` route:

- `src/pages/MapsPage.tsx` (~600 lines) — map browser + pin session state
  machine + print dispatcher in one component.
- `src/components/maps/PinPanel.tsx` (~570 lines, 40+ props) — setup form,
  saved-sets list, per-hole nav, avoid toggles, save/token actions in one
  panel. Known pain: full-height panel covers the map on mobile.
- `src/components/maps/CourseMap.tsx` — Google map, green index, hole
  focus, tap-to-place (existing "pinMode" tap behavior).
- `PrintSheet.tsx` / `printSheet.css` / `pinSheetPrintHtml.ts` — handout
  print window; token flow `/maps?pinToken=...` → `pinSetByToken` RPC.
- `src/lib/courseGeometry.ts` — pure, DOM-free geometry: `buildGreenIndex`,
  `measurePin`, `lateralEdgeDistancesM`, `svgForHole`, storage normalize.
- `src/lib/pinSets.ts` — `banbury_pin_sets` CRUD + localStorage draft +
  token helpers.
- Test convention: standalone Node scripts (`src/lib/*.test.mjs`,
  `node src/lib/x.test.mjs`). Follow it.

Geometry conventions (keep as-is): whole yards; onYd from front
(`pu - frontU`); depthYd = geometry green depth; L/R = nearest polygon
side edge at depth via `lateralEdgeDistancesM`; C = < 0.75 yd of
centerline; pins stored with lat/lng + u/v; `pinsFromStorage` re-measures.

Assets to reuse (do not rebuild): courseGeometry pure functions, pinSets
persistence, PrintSheet/pinSheetPrintHtml, `banbury_pin_sets` schema +
token RPC, draft recovery, avoid notes.

---

## 2. UX / IA Decision (resolved)

**Option A: dedicated `/pins` route** with three internal views (component
state, not sub-routes):

1. **Library** — list/new/open/duplicate/delete/resume-draft.
2. **Setup** — per-hole placement with a **Table | Map** mode toggle
   (see §4b). Both modes write the same `session.pins`.
3. **Delivery** — review sheet, status, print, handout token.

Sidebar gains "Pin Sheets". `/maps` becomes a course map again: layer
controls + hole browse + irrigation; pin content read-only behind a layer
toggle (default OFF, see §4d) plus an "Open in Pin Sheets" deep link.

Options B (tabs) and C (modal wizard) rejected as in v1: B keeps the
god-component, C is bad on mobile for map+table mix.

---

## 3. Yards → Pin Inverse Placement (`placePinFromYards`)

New pure function in `src/lib/courseGeometry.ts`:

```ts
export interface YardsInput {
  onYd: number;                 // paper "Depth" (from front)
  side: 'L' | 'C' | 'R';
  lrYd?: number;                // required for L/R; ignored for C
}
export type PlaceYardsResult =
  | { ok: true; pin: Pin; approx?: boolean; warnings: string[] }
  | { ok: false; reason: string };

export function placePinFromYards(
  greenIndex: GreenIndex,
  hole: number,
  input: YardsInput
): PlaceYardsResult
```

### Algorithm
1. `g = greenIndex[hole]`; fail if missing.
2. Target `pu = g.frontU + onYd / YARDS_PER_METER`.
3. Resolve `pv`:
   - `ringUV = ringToLocalUV(g)` (export the existing private helper).
   - C → `pv = 0`.
   - L → left-edge intersection v at `u = pu` (same intersection walk as
     `lateralEdgeDistancesM`, returning edge v), then
     `pv = vLeft + lrYd / YARDS_PER_METER`.
   - R → `pv = vRight - lrYd / YARDS_PER_METER`.
   - No crossing at that exact u (pinched front/back) → nearest-u edge
     vertex fallback, `approx: true` + warning.
4. Invert local frame → lat/lng:
   `xy = pu*u + pv*v`; `lat = origin.lat + xy.y/M_PER_DEG_LAT`;
   `lng = origin.lng + xy.x/metersPerDegLng(origin.lat)`.
5. **Point-in-polygon check on the solved point** (new small PIP helper
   over ringUV, ray-cast in u/v space).
6. **Round-trip through `measurePin`** — returned `Pin` is the
   `measurePin` output (single source of truth for rounding, C-threshold,
   labels).

### Validation policy (tightened per review #3)
- `onYd = 0` allowed with warning chip ("front edge").
- **Do NOT hard-reject onYd > geometry depthYd.** Paper GD can exceed map
  GD by 1–2 yd. Truth = PIP + measurePin round-trip:
  - solved point inside polygon → accept (add warning if
    `onYd > depthYd`: "Depth exceeds map green depth ({depthYd} yd) —
    placed from front edge, verify").
  - solved point outside polygon → `ok:false, reason:'outside green'`.
    Never silently place off-green.
- `lrYd` integer ≥ 0, required for L/R; wider-than-green at that depth is
  caught by the same PIP check, not by pre-arithmetic.
- C ignores lrYd.

### Tests — `src/lib/courseGeometry.placeYards.test.mjs`
Standalone Node pattern, real `public/geo/banbury-course-v1.geojson`
fixture + one synthetic square ring:
1. 18-hole round-trip: sample in-green (u,v) per hole → yards →
   placePinFromYards → measurePin matches onYd/lrSide/lrYd; |Δlat/lng|
   < 0.5 m.
2. C placement: lrLabel === 'C'.
3. L/R symmetry on the square ring (L6 ≡ mirrored R6).
4. onYd slightly beyond geometry depthYd but inside polygon → accepted
   with warning (paper-GD case).
5. Clearly off-green (huge lrYd / onYd) → ok:false, no NaN.
6. Pinched-front u with single crossing → approx fallback or clean
   failure, never NaN.
7. onYd = 0 accepted with warning.

### `source` field — DEFERRED (review #9)
No `source: 'map'|'yards'` in Phase 1. Placement works without it;
avoid touching the `pinsForStorage` whitelist. Revisit in Phase 2 if
audit value is wanted.

---

## 4. Flows (Phase 1)

### 4a. Library (`/pins` default view)
- Table from `listPinSets()`: play date, label, status badge, start hole,
  token icon, updated_at.
- Row actions: Open → Setup; **Duplicate** (Phase 1, review #4: insert new
  row copying pins/avoid/start_hole, `status='draft'`, `play_date=today`,
  `label="Copy of {label}"`); Delete (confirm); status quick-set.
- "New pin sheet" → Setup with `emptySession()` defaults.
- Resume-local-draft banner via existing `loadDraft()`/`draftHasPins()`.

### 4b. Setup / Edit — dual mode with toggle (review #1)
Header: label, play date, status, start hole, course avoid notes.
Mode toggle: **Table | Map**. Both mutate the same
`session.pins`; switching modes never loses state.

**Table mode** (primary for paper entry):
- 18-row table matching Darryl's paper:
  `Hole | GD (read-only geometry depthYd) | Depth (onYd) | L/C/R toggle |
  Yards (lrYd, disabled on C) | live readout (On X · L6 · depth Y)`.
- Row edit → `placePinFromYards` → updates pin; inline warnings/errors
  from the validation policy.
- Preview: `GreenPreview` component — **Phase 1 = SVG green outline + pin
  + front/approach cue** (`svgForHole`-style; fast, no runtime Google Maps).
  Full Google map stays one toggle away in Map mode. Christopher confirmed
  SVG is good for v1.
- **Phase 2 enhancement (approved direction):** optional **static basemap
  underlay** under the same SVG overlay — pre-captured aerial/green crops
  shipped with the app (e.g. `public/geo/green-previews/h01.webp` … h18),
  not a live Maps API call. Pin math stays geometry-driven; photo is
  visual context only. Prefer licensed/own aerial (drone, open county
  imagery, or tiles with cache rights) — **do not scrape/store Google
  Maps screenshots** for product use (ToS risk). Same pattern is common
  (static map thumbnail + vector markers). Component stays
  `GreenPreview({ hole, pin, backgroundSrc? })` so underlays drop in
  without rewriting Table mode.
- Per-hole avoid notes collapse into the row; skip/clear per row.

**Map mode** (primary for field work):
- Reuses CourseMap with the existing pinMode tap behavior (extracted
  during hook refactor), per-hole focus, tap → `measurePin` → pin set.
- Readout panel shows the same yards fields (read-only mirror, or
  editable — editable preferred so a tap can be nudged by yards without
  mode switch; keep simple: editable).
- Must NOT reproduce the old full-height-panel-over-map mobile trap: on
  phone, the panel is a bottom sheet ≤ 40% height, collapsible.

Autosave draft to localStorage (existing); explicit Save → `savePinSet`.

### 4c. Delivery
- From Setup ("Review & deliver") or Library row — **deep-linked straight
  into the finished sheet; no second 18-hole walk** (review #10).
- Read-only summary (18 holes in start-hole order) + green diagrams.
- Actions: Print/PDF (existing PrintSheet window flow, launched directly
  with the loaded session), Enable handout link (`randomToken` +
  `setPublicToken`), copy URL, revoke.
- Status transitions: draft → scheduled → active → archived.
- **Handout URL stays `/maps?pinToken=...` in Phase 1** (review #2). No
  new handout route. Phase 2 may add `/pins/handout` + redirect.

### 4d. `/maps` after split (review #5)
- Map + layers + hole browse + irrigation only.
- "Pins" layer toggle, **default OFF**. When ON, renders pins of one
  explicitly chosen sheet (picker: active/scheduled sheets). No auto-load
  of "today's sheet" — that's a later option, not Phase 1.
- "Open in Pin Sheets →" deep link (`/pins?set=<id>`).
- Keeps ONLY the `?pinToken=` read-only handout branch (deep link for
  already-distributed URLs) and becomes otherwise thin.

---

## 5. Phase 1.5 (optional, one-shot — Club Champ import, review #7)

Script outline — `scripts/import-pin-yards-json.mjs` (Node, run manually,
NOT a UI feature, run only when Christopher asks):

1. Read a pin-yards JSON file (default
   `tmp/club-championship-2026-08-pins-darryl.json`).
2. Load `public/geo/banbury-course-v1.geojson`, `buildGreenIndex`.
3. Per day, per hole: map paper row → YardsInput
   (`Depth→onYd`; whichever of left/center/right is non-null → side+lrYd;
   center → C). Trust Depth, not GD (GD may differ from geometry).
4. `placePinFromYards` per hole; abort the day with a printed report if
   any hole fails validation (never partial-insert silently).
5. `pinsForStorage` + insert one `banbury_pin_sets` row per day
   (`play_date`, `label` from JSON, `status='scheduled'`,
   `created_by='import-pin-yards-json'`). Difficulty ignored.
6. Print inserted ids + per-hole placed readouts for eyeball check.
Uses service key from env, never committed. Optional; finals stay
trackable before any import UI exists.

---

## 5b. Phase 2 (later — includes static green underlays)

- **Static green basemap underlays** for Table / Delivery / print
  previews: offline-generated aerial crops per green (e.g.
  `public/geo/green-previews/h01.webp` … `h18.webp`) under the same SVG
  pin overlay. No runtime Google Maps in Table mode. Prefer
  licensed/own imagery (drone, open county aerial, cache-licensed
  tiles) — **do not scrape Google Maps screenshots** (ToS). Common
  pattern: static basemap thumbnail + vector markers. `GreenPreview`
  already planned with optional `backgroundSrc` so this is a drop-in.
  Optional regen script under `scripts/`.
- Difficulty scoring (1–7) + average; Club Champ import UI if needed.
- Print polish; optional `/pins/handout` + redirect from `?pinToken=`.
- Avoid templates / pin-rotation history (nice-to-haves).

---

## 6. Implementation Order — executable checklist (review #12)

One feature branch `feature/pin-sheet-redesign`; land as ordered commits
(squash into PRs as Christopher prefers):

1. **Hook extraction (zero behavior change).** Move pin-session state
   machine + draft + save/load/token callbacks out of MapsPage into
   `src/lib/usePinSession.ts`. MapsPage renders identically. Verify
   manually: full walk of 18 holes, save, reload, draft resume, token,
   print.
2. **Geometry.** Add `placePinFromYards`, export `ringToLocalUV`, add PIP
   helper; add `courseGeometry.placeYards.test.mjs`; all tests green.
3. **PinsPage skeleton.** Route `/pins` in App.tsx, Sidebar item, empty
   three-view scaffold (Library/Setup/Delivery) on the hook.
4. **Library view.** List, Open, New, Resume draft, Delete, **Duplicate**.
5. **Setup — Table mode.** PinEntryTable + SVG preview + validation
   wiring + autosave/save.
6. **Setup — Map mode.** CourseMap pinMode reuse + compact bottom-sheet
   readout (mobile-safe).
7. **Delivery view.** Summary + direct PrintSheet launch + token actions +
   status transitions.
8. **MapsPage slim-down.** Remove session/panel/print wiring; add
   read-only pins layer (default off) + picker + deep link; keep
   `?pinToken=` handout branch. **Delete PinPanel.tsx** now that nothing
   imports it (extract-then-delete, review #8 — no zombie half-used
   panel; PinPanel internals live on only as the new pins/* components).
9. **Docs.** Short "Import notes" section in this plan's completion
   record + script outline handoff for Phase 1.5.
10. **Verify.** Acceptance criteria §8; `npm run build` clean; dev-server
    smoke incl. phone-width viewport.

New files:
- `src/pages/PinsPage.tsx`
- `src/components/pins/PinLibraryList.tsx`
- `src/components/pins/PinSetupForm.tsx` (mode toggle host)
- `src/components/pins/PinEntryTable.tsx`
- `src/components/pins/GreenPreview.tsx` (SVG Phase 1; optional `backgroundSrc` for Phase 2 underlays)
- `src/components/pins/PinMapMode.tsx`
- `src/components/pins/PinDelivery.tsx`
- `src/lib/usePinSession.ts`
- `src/lib/courseGeometry.placeYards.test.mjs`

Modified: `courseGeometry.ts`, `types/courseMap.ts` (YardsInput,
PlaceYardsResult only), `App.tsx`, `Sidebar.tsx`, `MapsPage.tsx`.
Deleted: `components/maps/PinPanel.tsx`.
Unchanged: `pinSets.ts`, `PrintSheet.tsx`, `pinSheetPrintHtml.ts`,
`printSheet.css`, DB schema (no migration).

---

## 7. Acceptance Criteria (Phase 1)

1. `/pins` Library lists existing sets; New/Resume/Open/Duplicate/Delete
   all work. Duplicate → new draft, today's date, "Copy of {label}".
2. Setup Table mode: Depth=9 + L6 on hole 1 places a pin whose readout
   matches, preview dot renders, saves, and re-opens with same numbers.
3. Setup Map mode: tap places pin and the same session.pins row updates;
   switching Table↔Map never loses placements.
4. **Mobile (review #6):** on a phone-width viewport a user can complete
   the yards table for all 18 holes — collapsed nav, sticky current-hole
   row, no full-height panel covering the map; Map mode panel is a
   collapsible bottom sheet ≤ 40% height.
5. Validation: onYd=0 warns; paper GD 1–2 yd over geometry still places
   if inside polygon (with warning); clearly off-green input is rejected
   with a reason, never NaN.
6. All `*.test.mjs` pass, including 18-hole round-trip on real GeoJSON.
7. Delivery: print window + handout token flow work unchanged, launched
   directly from the loaded sheet (no re-walk); `/maps?pinToken=<existing>`
   still renders the handout.
8. `/maps`: no pin session panel; pins layer default OFF; picker shows
   chosen sheet read-only; deep link into `/pins?set=<id>` works.
9. PinPanel.tsx deleted; no imports remain; no 40-prop zombie.
10. No schema migrations, no `source` field, no difficulty UI;
    `npm run build` clean.

---

## 8. Risks
- MapsPage refactor regression → step 1 is pure extraction, verified
  before any new UI.
- Inverse-geometry edge cases (pinched greens, rounding drift) →
  round-trip via measurePin, approx flag, PIP hard gate, real-fixture
  tests.
- Distributed handout links → `/maps?pinToken=` branch retained.
- Two editors forking state → `/maps` strictly read-only for pins.
- Scope creep (difficulty, import UI, print polish) → deferred, listed
  in non-goals.

## 9. Resolved Decisions (formerly open questions)
1. Handout URL → keep `/maps?pinToken=` in Phase 1; `/pins/handout` is a
   Phase 2 option. RESOLVED.
2. `/maps` pins layer → toggle, default OFF; no auto-load. RESOLVED.
3. Setup Table preview → **SVG-only in Phase 1** (Christopher confirmed
   2026-07-31). Full Google map only in Map mode. RESOLVED.
4. Duplicate semantics → new draft, today, "Copy of {label}". RESOLVED.
5. onYd=0 → allowed with warning. RESOLVED.
6. Whole-yard integers only (matches product convention). RESOLVED unless
   Darryl says otherwise.
7. **Richer Table preview without runtime Maps** → Phase 2 static basemap
   underlays (pre-captured licensed/own aerial + SVG pin overlay). Not
   scraped Google screenshots. RESOLVED as Phase 2 direction (rev 2.1).

No open product questions blocking Phase 1.

## 10. Phase-1 Non-Goals
- Difficulty scoring (1–7) anywhere in UI or schema.
- Club Champ import UI (Phase 1.5 optional script only, on request).
- DB migrations; `db push`; `source` field on pins.
- Print layout redesign (PrintSheet reused as-is).
- New handout route; auto "today's sheet" on `/maps`.
- **Static aerial underlays / green photo capture** (Phase 2 — see §5b).
- Irrigation changes; pin-rotation/history analytics.
- Deploy/merge — feature branch only, ship only when Christopher asks.

---

## Changelog from v1
0. **Rev 2.1 (Christopher 2026-07-31):** Confirmed SVG Table preview for
   Phase 1. Added Phase 2 **static green basemap underlays** (pre-captured
   aerial + SVG overlay, no runtime Google Maps; license-safe sources only).
   `GreenPreview` designed to accept optional `backgroundSrc` later.
1. **Setup layout (review #1):** Setup is now dual-mode with a Table | Map
   toggle; Map mode reuses CourseMap pinMode for field tap entry; both
   write the same session.pins. Table-mode preview defaults to SVG.
2. **Handout URL (#2):** Phase 1 keeps `/maps?pinToken=` only; new
   handout route moved to Phase 2; open question removed.
3. **onYd validation (#3):** no hard depthYd+1 reject; PIP + measurePin
   round-trip is truth; paper GD exceeding map GD accepted with warning;
   onYd=0 allowed with warning.
4. **Duplicate (#4):** promoted into Phase 1 with defined semantics
   (draft, today, "Copy of {label}").
5. **Maps read-only pins (#5):** layer toggle default OFF; explicit sheet
   picker; no auto-load of today's sheet.
6. **Mobile (#6):** explicit acceptance criteria — 18-hole table
   completable on phone, sticky hole row, bottom-sheet ≤40% in Map mode,
   full-height-panel trap called out.
7. **Club Champ (#7):** added Phase 1.5 optional one-shot script outline
   `scripts/import-pin-yards-json.mjs` (manual, on request, no UI).
8. **PinPanel deletion (#8):** ordered extract-then-delete; PinPanel.tsx
   deleted in step 8 once nothing imports it.
9. **source field (#9):** deferred out of Phase 1 to avoid storage churn.
10. **Print polish (#10):** still non-goal; Delivery deep-links straight
    into existing PrintSheet with no second 18-hole walk.
11. **Open questions (#11):** all resolved with defaults (§9); one
    remaining flag for Christopher on SVG-only Table preview.
12. **Implementation order (#12):** added numbered 10-step executable
    checklist (§6) with commit-style ordering a coding agent can follow.
