# Task 4 - Pin Map Mobile Usability ✅

**Completed**: 2026-08-08

## What Was Done

Setting pins on a phone is now practical. Two defects that made `/pins` → Setup → Map mode
frustrating are fixed: a dead zone that swallowed taps near the hole-number badge and the
current pin, and a map frame permanently stuck at 240px tall regardless of screen size.

## Key Changes

- **Tap dead zone removed.** `google.maps.Marker` defaults to `clickable: true`, and a clickable
  marker *consumes* the click so the map's own `click` listener never fires. The hole-number
  badge (`scale: 10`, ~20px, sitting directly on the green) and the red pin marker (`scale: 7`,
  ~14px) both omitted the option, creating two dead zones — the second being why nudging an
  existing pin required "finagling". Both now use `clickable: !pinModeRef.current`, matching what
  `applyStyle` already did for the Data-layer polygons. `/maps` (`pinMode={false}`) is unchanged.
- **Map frame actually fills the screen.** Root cause was a broken flex chain, not the map:
  `PinSetupForm.tsx` set `min-h-[50vh]` on the map-mode body *without* `min-h-0`. A
  viewport-relative floor on a flex item can never shrink, so the column overflowed its parent
  and `PinsPage`'s `overflow-hidden` clipped it — while the `shrink-0` bottom sheet (~254px of
  content) took its share first and the map fell back to its `min-h-[240px]` floor. Both floors
  removed; `MapsPage.tsx:204` already had the correct idiom (`flex-1 min-h-0`, no `min-h-*`).
- **Chrome trimmed to give the green the height.** The collapse toggle now hides only the ~120px
  "Nudge by yards" card instead of the whole sheet body and defaults to collapsed, so Back / Skip
  / Clear / Next and the 18-hole grid stay visible while stepping holes. The "Pin Sheets" title
  and subtitle are `hidden md:block` while in Setup. Desktop ≥768px is unchanged.
- **Earlier in the same plan:** green-fill zoom — `fitLiteral` padding 80 → 16, zoom clamp
  19 → 20, and `mapTypeControl` / `keyboardShortcuts` / `cameraControl` disabled.

Expected phone budget: 100vh − 60 header − 32 section padding − ~55 tabs − ~65 toggle row −
~150 collapsed sheet ≈ **~400px of map**, up from 240px, and ~480px with the sheet closed.

## Notes

Browser automation is still dead in this environment, so static checks were `tsc --noEmit`
(exit 0) and `eslint`. **Both changes were then confirmed working in the browser by Chris** —
the marker dead-zone fix and the map-sizing work, each verified separately as it landed. This
mattered: two earlier fixes in this same file (`bf6bbc4`, `5b0df2e`) passed `tsc`/`eslint` and
still failed at runtime, so hand-verification is the only real gate here.

Pre-existing `react-hooks/set-state-in-effect` error at `PinMapMode.tsx:63` (the edit-field sync
effect) was confirmed identical on `HEAD` and deliberately left alone — unrelated to this work.

The map still does not use the `MapsPage` negative-margin trick to reclaim the App shell's `p-4`;
if more height is wanted later, that is the next ~32px. Files touched: `CourseMap.tsx`,
`PinMapMode.tsx`, `PinSetupForm.tsx`, `PinsPage.tsx`.
