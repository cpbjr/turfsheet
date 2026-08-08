# Green-fill zoom in Setup → Map mode (mobile)

Date: 2026-08-08
Branch: `bugfix/pin-sheet`

## Problem

On a phone the green occupies ~25% of the map frame instead of filling it. Measured from a
2026-08-08 screenshot of hole 16: map viewport ≈ **390 × 240 CSS px**, i.e. sitting exactly on
`min-h-[240px]` (`PinMapMode.tsx:104`) — `flex-1` never grew.

`focusHole` (`CourseMap.tsx:427`) calls `fitLiteral(g.bounds, 80)`. A **number** passed to
`fitBounds` is applied to all four sides:

```
usable width  = 390 − 160 = 230px
usable height = 240 − 160 =  80px   ← binding constraint
```

A ~30 m green fitted into an 80px slot lands at zoom ≈18.2, so the `z > 19` clamp at `:436`
**never fires**. The padding and the container height are the real limits; the clamp is
currently dead code.

The 240px floor is caused by the `shrink-0` meta grid in `PinSetupForm.tsx:110-160`
(Play date / Status / Start hole / Label ≈ 280px) which cannot compress, leaving the map
nothing to grow into and over-constraining the column.

## Changes (2 files)

1. **`PinSetupForm.tsx:111`** — hide the meta field grid on phones while in Map mode
   (`mode === 'map' ? 'hidden md:grid' : 'grid'`). Desktop is unaffected — it has the height.
   The Table/Map/Save/Review/Cancel row (`:162`) stays visible, so nothing becomes unreachable;
   Table mode restores the fields.

2. **`CourseMap.tsx:431`** — `fitLiteral(g.bounds, 80)` → `fitLiteral(g.bounds, 16)`.

3. **`CourseMap.tsx:436`** — upper zoom clamp `19` → `20`. **Required, not optional:** with
   (1) and (2) the fit now computes ≈zoom 20.5, so leaving the clamp at 19 would cancel out
   most of the gain.

4. **`CourseMap.tsx:266`** — `mapTypeControl: false`, dropping the Satellite/Hybrid/Roadmap
   dropdown and its `mapTypeControlOptions`. `mapTypeId: 'satellite'` is unchanged, so the
   imagery is the same; only the control is gone. **Applies to `/maps` as well as `/pins`** —
   CourseMap is shared. Re-scope with `mapTypeControl: !pinModeRef.current` if the ops viewer
   turns out to want the switcher back.

## Verification

- `npx tsc --noEmit` → clean
- `npx eslint` on both files → clean
- Runtime (REQUIRED): phone-width viewport, `/pins` → open a set → Setup → Map.
  Expect the green to fill most of the frame at ~zoom 20, meta fields hidden, buttons still
  reachable. Switch to Table → fields return.
- Desktop (≥768px): unchanged layout, green framed tighter.

## Risk

**Satellite tile availability above zoom 19.** The map is `mapTypeId: 'satellite'`. Banbury is
in the Boise metro, so zoom 20 imagery is near-certain, but confirm the tiles render sharp
rather than grey/blurred. If they degrade, revert the clamp to 19 and keep (1) and (2), which
still help on their own.
