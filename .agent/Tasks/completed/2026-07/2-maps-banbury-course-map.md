# Task 2 - Banbury Course Map merged into TurfSheet `/maps` ✅

**Completed**: 2026-07-29
**Plan**: `Implementation/2026-07-28-maps-banbury-course-map.md` (retained — see Notes)

## What Was Done

Replaced the "Coming Soon" stub at `/maps` with the full Banbury course map, ported from a
standalone HTML/CSS/JS app that lived outside version control on the `beefy` server. TurfSheet is
now the single live app for pin sheets; the standalone has been retired.

## Key Changes

- **Maps feature is live** at https://whitepine-tech.com/turfsheet/maps — satellite basemap, layer
  toggles, hole filter, feature InfoWindows, green index + pin measurement (On / L-R / Depth),
  tap-cycle, avoid/do-not-cut marking, save/load/schedule, localStorage draft, printable clubhouse
  handout with QR, and `?pinToken=` public handouts.
- **Pin data migrated into the TurfSheet database** — `turfsheet.banbury_pin_sets` +
  `banbury_pin_set_by_token` RPC, both live rows seeded under their original UUIDs and share
  tokens. One database, one anon key, reusing `src/lib/supabase.ts` instead of a second client.
- **Geometry parity proven, not assumed** — re-measuring the genuine stored pins with the ported TS
  reproduced the standalone's `onYd`/`lrYd`/`lrSide`/`depthYd`/`widthYd` and `u`/`v` to 1e-9:
  **0 mismatches across 90 fields**, 18/18 greens indexed.
- **Standalone retired** — `/banbury-map` now 302s to `/turfsheet/maps` with the query string
  preserved, so printed QR handouts keep resolving. Verified before cutover that both tables held
  identical rows, so no pin sheets were stranded.
- **Production Maps key wired up** — `VITE_GOOGLE_MAPS_API_KEY` added to the deploy workflow and
  GitHub secrets. Without it the bundle throws `MissingMapsKeyError`, since Vite inlines
  `import.meta.env` at build time.

## Notes

**One defect is unresolved and the plan file was deliberately kept.** Two quick taps still advance
two holes instead of one. Two fixes were attempted and both failed — including a single-timer model
that should make it structurally impossible — so the cause is still unknown. Details, what was ruled
out, and the next diagnostic steps are in `active.md`. The plan file holds the parity checklist that
work still needs, so it was **not** deleted per the usual completion rule.

**Root cause of the difficulty: no working browser automation in this environment.** Both
`run.ts chrome:*` and the Chrome extension were non-functional, so every fix was verified by
`tsc`/`eslint` only and hand-tested by Chris. This is what turned a small bug into three rounds.

**Two documented project facts were found to be wrong** and are recorded in memory: the Supabase
project ref in `CLAUDE.md` is stale (`scktzhwtkscabtpkvhne` → `klyzdnocgrvassppripi`), and
`supabase db push` is unsafe on this repo (~60 local-only migrations interleaved with ~70
remote-only; same shape as the 2026-02-25 incident that dropped 12 tables). Use
`db query --linked -f` instead.

**Follow-on exposure:** retiring the standalone made `/maps` the sole system of record for
tournament pin positions on a site with no authentication. Auth is now Task 0 in `planned.md`.
