# Implementation: True-merge Banbury course map into TurfSheet

Date: 2026-07-28
Branch: `feature/maps-banbury-course-map`

## Task overview

Port the standalone Banbury course map (static HTML/CSS/JS on `beefy:/home/wpauser/src/banbury-course-map/`,
live at https://whitepine-tech.com/banbury-map/) into the TurfSheet React app, replacing the
`Coming Soon` stub at `turfsheet-app/src/pages/MapsPage.tsx` (`/maps`).

Standalone is **not** a git repo (only a `.gitignore`); source of truth is the directory itself.
A copy was pulled to the session scratchpad for reference during the port.

### Source inventory (verified)

| File | Lines | Role |
|---|---|---|
| `app.js` | 1709 | All behavior: map boot, layers, hole filter, green index, pin measurement, pin session, Supabase save/load, print sheet, public token handout, access gate |
| `index.html` | 207 | DOM skeleton the JS drives by id |
| `styles.css` | 534 | App chrome + `@media print` rules for the handout |
| `geo/banbury-course-v1.geojson` | 173 KB | 190 features — 18 greens, 18 hole paths, 61 bunkers, 70 tees, 14 fairways, 6 water, clubhouse, OOB. `properties.version` 1.61 |
| `config.example.js` | — | `window.BANBURY_MAP_CONFIG` (Maps key, accessCode, supabaseUrl/anonKey, publicBaseUrl) |
| `app.js.bak-v1-pins`, `geo/*.bak-v1*`, `scripts/`, `refine-refs/`, `incoming/` | — | Backups / digitizing scratch. **Not ported.** |

### Backend (verified live, not assumed)

`banbury_pin_sets` lives in Supabase project `cfwaefobqjouyglocuyh`, schema `wpa`,
and holds 2 real rows. Confirmed via the same REST path the app uses (HTTP 200).
RPC `wpa.banbury_pin_set_by_token(p_token)` exists and returns `[]` for an unknown token.

> Note: the `white-pine-projects` entry in `~/WhitePineTech/Tools/mcp-servers/config.json`
> has a stale connection string — it reports `relation "wpa.banbury_pin_sets" does not exist`
> while REST against the same project ref returns rows. Trust REST here, not that MCP entry.

Columns: `id uuid pk`, `play_date date`, `label text`, `status text`, `start_hole int`,
`pins jsonb`, `avoid jsonb`, `public_token text`, `created_by text`,
`created_at timestamptz`, `updated_at timestamptz`.

## Decisions (confirmed with Chris, 2026-07-28)

1. **Pin data → migrate into TurfSheet DB.** Create `turfsheet.banbury_pin_sets` +
   `turfsheet.banbury_pin_set_by_token` RPC, copy the 2 existing rows, use the existing
   `src/lib/supabase.ts` client. One DB, one anon key.
2. **Public handout stays on `/maps`.** `…/turfsheet/maps?pinToken=…` renders the read-only
   print sheet. TurfSheet has no auth gate today, so this matches current behavior with no new routing.
3. **Access gate (`accessCode`) is dropped.** It is disabled in live config (`accessCode: ""`)
   and TurfSheet has its own app shell. No parity loss.
4. **Layout:** map goes full-bleed inside the routed content area (negating the `p-4/6/8`
   padding on the `<section>` in `App.tsx`) rather than restructuring the router.

## Files

### New

```
turfsheet-app/public/geo/banbury-course-v1.geojson    # served at /turfsheet/geo/…
turfsheet-app/src/types/courseMap.ts                  # Feature props, Pin, PinSet, AvoidEntry
turfsheet-app/src/lib/googleMaps.ts                   # idempotent Maps JS loader (promise singleton)
turfsheet-app/src/lib/courseGeometry.ts               # haversine, local XY, green index, measurePin, svgForHole
turfsheet-app/src/lib/pinSets.ts                      # Supabase CRUD + token RPC + draft localStorage
turfsheet-app/src/components/maps/CourseMap.tsx       # map instance, data layer, styles, hole labels, pin markers
turfsheet-app/src/components/maps/LayerControls.tsx   # layer checkboxes, hole filter, recenter, pin-sheet toggle
turfsheet-app/src/components/maps/PinPanel.tsx        # pin sheet aside — setup + active session + avoid chips
turfsheet-app/src/components/maps/PrintSheet.tsx      # printable handout (grid + summary table + QR)
turfsheet-app/src/components/maps/printSheet.css      # @media print rules ported from styles.css
supabase/migrations/<ts>_create_banbury_pin_sets.sql
supabase/migrations/<ts>_seed_banbury_pin_sets.sql    # the 2 rows copied from wpa
```

### Modified

```
turfsheet-app/src/pages/MapsPage.tsx   # stub → orchestrator
turfsheet-app/.env.local               # + VITE_GOOGLE_MAPS_API_KEY
```

Do **not** touch the pre-existing untracked migrations in `supabase/migrations/`
(`*_add_unique_source_hash`, `*_enable_pgvector`, `*_create_memory_*`) — unrelated work in flight.

## Parity checklist (must all hold before deleting the standalone)

- [ ] Satellite basemap, `mapTypeId: satellite`, dropdown for satellite/hybrid/roadmap, recenter to CENTER @ z16
- [ ] Layer toggles: greens, fairways, bunkers, tees, water, hole paths, other — same defaults (tees + other off)
- [ ] Hole filter: all / front / back / 1–18, same `passesFilters` semantics
- [ ] Numbered hole-path markers with par in the tooltip
- [ ] Feature click → InfoWindow with name/par/handicap/tee/type/OSM id (suppressed during pin mode)
- [ ] Green index builds 18/18 greens; depth/width in yards match standalone
- [ ] Pin tap-cycle: tap green → measures On / L-R / Depth → auto-advances after 350 ms
- [ ] Back / Skip / Clear pin / Next; hole strip chips with set / skipped / current / has-avoid states
- [ ] Avoid: 7 kinds, per-hole + course-wide, with notes
- [ ] Save (insert + update), saved-set list split upcoming vs past, load by id
- [ ] Schedule via `status` draft/scheduled/active/archived and `play_date`
- [ ] localStorage draft: save / resume / cancel-clears
- [ ] Print sheet: 18 SVG green diagrams w/ pin dot + front marker, summary table, avoid block, QR, footnote
- [ ] `?pinToken=…` loads read-only handout straight to the print sheet
- [ ] Print / PDF output is sane at A4/Letter

## Steps

1. **Migration** — create `turfsheet.banbury_pin_sets` (same columns + `updated_at` trigger),
   RLS enabled with anon read/write to match current behavior, and the
   `banbury_pin_set_by_token` RPC (security definer, returns the row for a token).
   → verify: `npx supabase@latest db push` succeeds; REST GET against `turfsheet` profile returns `[]`.
2. **Seed** — copy the 2 wpa rows verbatim (ids preserved).
   → verify: REST GET returns both rows, `public_token` intact.
3. **Assets + env** — copy the geojson to `public/geo/`, add `VITE_GOOGLE_MAPS_API_KEY` to `.env.local`.
   → verify: `curl localhost:5179/turfsheet/geo/banbury-course-v1.geojson | head` is JSON.
4. **Geometry lib** — port `haversineM`, `ringCentroid`, `toLocalXY`, `buildGreenIndex`,
   `measurePin`, `ringToLocalUV`, `svgForHole` to TS. Pure functions, no DOM, no `google` global
   except the `LatLngBounds` (replace with a plain bounds tuple so the lib stays testable).
   → verify: greens indexed = 18; hole 1 depth/width match the standalone's numbers.
5. **Maps loader + CourseMap** — promise-singleton script loader; data layer, `applyStyle`,
   hole labels, pin markers, click handling.
   → verify: map renders with overlays; toggles and hole filter behave.
6. **PinPanel** — session state, strip, avoid chips, save/load/list.
   → verify: full 18-hole walk, save, reload page, load from list, numbers identical.
7. **PrintSheet + print CSS** — port markup and `@media print`.
   → verify: print preview matches live standalone side by side.
8. **Token handout** — read `?pinToken=` on mount, RPC, render read-only sheet.
   → verify: existing token `e2e-public-token-banbury-refine-20260728` renders.
9. **Parity pass** — run the checklist above against https://whitepine-tech.com/banbury-map/.
10. **Only after parity** — remove the standalone (leave the `wpa` table in place as a safety net;
    dropping it is a separate, later decision).

## Testing

- `npm run dev` on port 5179, verify in browser.
- `npx tsx run.ts chrome:errors '{"url":"http://localhost:5179/turfsheet/maps"}'` — zero console errors.
- `npm run build` must pass (`tsc -b` is strict).

## Risks / notes

- **Maps API key referrer restriction.** The live browser key is restricted to
  `https://whitepine-tech.com/*`. That already covers `/turfsheet/maps`, so production is fine.
  Local dev on `http://localhost:5179` needs `http://localhost:*/*` added to the key's referrer
  list in GCP, or a separate dev key. Chris must do this in the console — not scriptable from here.
- The QR image is fetched from `api.qrserver.com` (external). Kept as-is for parity.
- `google.maps.Marker` is deprecated in favor of `AdvancedMarkerElement`. Porting as-is for
  parity; migrating markers is deliberately out of scope for this task.
