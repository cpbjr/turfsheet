# Handoff: Pin Sheet UX Redesign — Implementation

**Date:** 2026-07-31  
**Status:** Ready to implement (plan approved; **do not start until Christopher says execute** unless this handoff is your execute signal in a new thread)  
**Owner / product:** Christopher (cpbjr)  
**Prior agent:** Old Tom / Hermes (planning)  
**Target agent:** Implementer (Claude Code preferred when credits available; else coding agent on Beefy)

---

## Mission

Implement **Phase 1** of the pin-sheet redesign so Banbury can plan, set, and deliver pin sheets cleanly — including **yards entry** (Darryl paper style), without cluttering Course Maps.

**Authoritative plan (read fully before coding):**

| Doc | Path |
|-----|------|
| **Plan v2.1** | `/home/clawuser/turfsheet/.agent/Tasks/Implementation/2026-07-31_pin-sheet-redesign-v2.md` |
| Drive | https://drive.google.com/file/d/1y_kWOmcMXRLx7akt8b4Zd9_udWjHTWWu/view |
| Mirror | `~/.hermes/course-docs/2026-07-31_pin-sheet-redesign-v2.md` |
| History v1 | `…/2026-07-31_pin-sheet-redesign-v1.md` (superseded) |

This handoff is the **operations wrapper**. The plan is the **spec**. If they disagree, **plan wins** except Hard Rules below.

---

## Hard rules (non-negotiable)

1. **Feature branch only** — never commit on `main`. Suggested: `feature/pin-sheet-redesign`.
2. **Do not push / PR / merge / deploy** unless Christopher explicitly says ship / get it live.
3. **Never `supabase db push`.** Schema changes only via `npx supabase db query --linked -f <file.sql>` if ever needed. **Phase 1 needs no migration.**
4. Live Supabase: project `klyzdnocgrvassppripi`, schema **`turfsheet`**.
5. Shared clone hygiene: `git status` first; **do not discard other agents’ dirty files**.
6. Workdir app: `/home/clawuser/turfsheet/turfsheet-app` (repo root `/home/clawuser/turfsheet`).
7. Live site: https://whitepine-tech.com/turfsheet/ — do not assume local = live.
8. Channel context: `~/.hermes/course-docs/turfsheet-site-channel-context.md`.

---

## Product outcome (Phase 1)

1. New route **`/pins`** with views: **Library | Setup | Delivery** (component state OK; sub-routes optional).
2. Sidebar nav item **Pin Sheets**.
3. Setup dual mode **Table | Map**, same `session.pins`:
   - **Table:** Darryl-style yards (Depth/onYd + L|C|R + lrYd); **SVG** `GreenPreview` (no runtime Google Maps).
   - **Map:** reuse `CourseMap` pinMode tap → `measurePin`; mobile bottom sheet ≤ ~40% height (no full-height panel trap).
4. **`placePinFromYards`** in `courseGeometry.ts` + round-trip via `measurePin` + PIP gate; standalone tests `courseGeometry.placeYards.test.mjs` (real GeoJSON fixture).
5. Library: list / new / open / resume draft / delete / **Duplicate** (draft, today, `"Copy of {label}"`).
6. Delivery: print + public token **without re-walking 18 holes**; keep **`/maps?pinToken=`**.
7. Slim **`/maps`**: no pin session panel; optional pins layer **default OFF** + picker; deep link to `/pins?set=…`.
8. **Delete** `PinPanel.tsx` only after extract (no zombie).

### Explicit non-goals (Phase 1)

- Difficulty scoring UI/schema  
- Club Champ import UI (script only on request — Phase 1.5)  
- Static aerial underlays (Phase 2 — design hook only: `GreenPreview({ backgroundSrc? })`)  
- `source` field on pins  
- Print redesign  
- New handout route  
- Shipping without ask  

---

## Geometry conventions (do not “improve”)

| Paper / UI | Product field | Meaning |
|------------|---------------|---------|
| Depth | `onYd` | Yards from **front** of green along approach |
| GD | `depthYd` (geometry, read-only in table) | Full green front→back; paper GD may differ |
| Left / Right | `lrSide` + `lrYd` | Yards to **nearest side edge at that depth** (not centerline offset) |
| Center | `lrSide: 'C'` | Within ~0.75 yd of centerline |
| — | whole yards | Integers |

Validation: `onYd=0` allowed with warning. **Do not hard-reject** solely because paper depth > map GD; use **point-in-polygon + measurePin**. Reject off-green with clear reason.

Existing: `measurePin`, `lateralEdgeDistancesM` in `turfsheet-app/src/lib/courseGeometry.ts`.  
Tests pattern: `node src/lib/*.test.mjs` (see `courseGeometry.lateral.test.mjs`).

---

## Club Championship data (do not lose)

Darryl’s **final** placements for weekend event (import later, not Phase 1 must):

- JSON: `/home/clawuser/turfsheet/tmp/club-championship-2026-08-pins-darryl.json`
- Sat 2026-08-01, Sun 2026-08-02; includes difficulty for future only
- Phase 1.5 optional: `scripts/import-pin-yards-json.mjs` outline in plan §5 — run **only** if Christopher asks

---

## Implementation order (execute in this sequence)

From plan §6 — **do not skip step 1**:

1. **Hook extract** `usePinSession` from `MapsPage` — **zero behavior change**; manual verify walk/save/draft/token/print.
2. **`placePinFromYards` + tests** green.
3. **`PinsPage` skeleton** + route + Sidebar.
4. **Library** (+ Duplicate).
5. **Setup Table** + SVG `GreenPreview`.
6. **Setup Map** + mobile-safe sheet.
7. **Delivery** → existing PrintSheet / token.
8. **Slim MapsPage**; delete `PinPanel.tsx`.
9. Docs / Phase 1.5 notes as needed.
10. Acceptance criteria + `npm run build` + phone-width smoke.

---

## Key files (today)

| Path | Role |
|------|------|
| `turfsheet-app/src/pages/MapsPage.tsx` | Monolith session + print — extract then slim |
| `turfsheet-app/src/components/maps/PinPanel.tsx` | Delete after extract |
| `turfsheet-app/src/components/maps/CourseMap.tsx` | Reuse pinMode |
| `turfsheet-app/src/lib/courseGeometry.ts` | Add placePinFromYards |
| `turfsheet-app/src/lib/pinSets.ts` | Keep CRUD/draft/token |
| `turfsheet-app/src/lib/pinSheetPrintHtml.ts` | Keep print HTML |
| `turfsheet-app/src/components/maps/PrintSheet.tsx` | Keep |
| `turfsheet-app/src/types/courseMap.ts` | Add YardsInput / PlaceYardsResult |
| `turfsheet-app/src/App.tsx` | Route `/pins` |
| `turfsheet-app/src/components/layout/Sidebar.tsx` | Nav item |
| `public/geo/banbury-course-v1.geojson` | Test + green index fixture |

**New (expected):** `pages/PinsPage.tsx`, `components/pins/*`, `lib/usePinSession.ts`, `lib/courseGeometry.placeYards.test.mjs`.

---

## Acceptance checklist (Phase 1 done when)

- [ ] `/pins` library works (new/open/duplicate/delete/resume draft)
- [ ] Table: Depth=9 L6 hole 1 places, saves, reloads same numbers
- [ ] Map tap updates same session; Table↔Map preserves pins
- [ ] Mobile: complete 18-hole table without full-height panel trap
- [ ] placeYards tests pass incl. 18-hole round-trip on real GeoJSON
- [ ] Delivery print + token; `/maps?pinToken=` still works
- [ ] `/maps` no PinPanel; pins layer default off
- [ ] PinPanel.tsx gone; no schema migration; build clean
- [ ] No push/deploy unless asked

---

## Coding agent notes

- Prefer **Claude Code** (`--effort medium`, `-p`, minimal tools, workdir turfsheet) when available; Claude was credit-capped during planning — retry or use alternate.
- Hermes/orchestrator should **verify diffs and tests**, not rubber-stamp agent claims.
- Multi-agent: feature branch; don’t force-push; don’t wipe uncommitted work.
- Style: match existing TurfSheet Tailwind / heading patterns.
- Google Maps: required only in Map mode and existing `/maps` — not for Table SVG preview.

---

## Decisions already locked (do not re-litigate)

| Topic | Decision |
|-------|----------|
| IA | Dedicated `/pins`, not tabs-on-maps |
| Table preview Phase 1 | SVG only |
| Table preview Phase 2 | Static aerial underlays + SVG overlay; license-safe; no scraped Google tiles |
| Handout URL Phase 1 | Keep `/maps?pinToken=` |
| Maps pins layer | Default OFF |
| Duplicate | Phase 1, today + “Copy of …” |
| Difficulty | Future |
| `source` on pin JSON | Deferred |

---

## Session bootstrap for implementer

```bash
git -C /home/clawuser/turfsheet status -sb
# read plan
less /home/clawuser/turfsheet/.agent/Tasks/Implementation/2026-07-31_pin-sheet-redesign-v2.md
# branch
git -C /home/clawuser/turfsheet checkout main && git pull --ff-only
git -C /home/clawuser/turfsheet checkout -b feature/pin-sheet-redesign
cd /home/clawuser/turfsheet/turfsheet-app
# start at plan step 1 only
```

When finished Phase 1 (or blocked): update this handoff status + plan completion notes; leave branch unpushed unless Christopher ships.

---

## Related context (optional)

- Pin L/R nearest-edge already live (PR #23).
- Print via dedicated window (PR #24 era).
- Irrigation map is **separate** work — do not mix into this branch.
- Darryl paper sheets photographed; JSON transcription only for Club Champ finals.

---

## Handoff checklist for leaving agent

- [x] Plan v2.1 complete and on Drive  
- [x] Club Champ JSON on disk  
- [x] This handoff written  
- [ ] Christopher: say **execute** (or assign thread) to start coding  
- [ ] Implementer: branch + step 1  

**End of handoff.**
