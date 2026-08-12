# Task 3 - Pin taps do nothing in Setup → Map mode ✅

**Completed**: 2026-08-08
**Branch**: `bugfix/pin-sheet`

## What Was Done

Pin placement on `/pins` → Setup → Map mode had been silently dead since 2026-07-31 — tapping a
green did nothing, with no error. The map's click listener was never attached. Placing pins by map
works again.

## Key Changes

- `turfsheet-app/src/components/maps/CourseMap.tsx` — the map-click listener is now attached once
  inside the async boot effect, immediately after `new google.maps.Map(...)`, guarded by
  `pinModeRef.current` inside the handler. The old `[pinMode]` effect was deleted. (+9/−16)

## Root Cause

The old effect read `mapRef.current` (a `useRef`) and bailed with `if (!map || !pinMode) return;`.
The boot effect `await`s `loadGoogleMaps()` **before** assigning `mapRef.current`, and React runs
all mount effects synchronously after commit — so the map was *always* still `null` when the pin
effect ran. Assigning a ref triggers no re-render and a ref cannot be a dependency, so the effect
never re-ran. Its only dep, `pinMode`, is a hardcoded literal `true` in `PinMapMode.tsx:110`.

Net: zero click listeners on the map, permanently. Deterministic, not a race — it failed in dev and
prod, signed in and signed out. StrictMode's double-invoke does not rescue it, since both
invocations run before the `await` resumes.

**Why it used to work:** the deleted `PinPanel.tsx` made pin mode a user *toggle*. That
`false → true` transition, occurring after the map had loaded, was the only thing that ever made
the effect fire at a moment when `mapRef.current` was non-null.

**Introduced by** `a39ab0e` (2026-07-31, "dedicated pin sheets workspace"), which deleted
`PinPanel.tsx` and replaced the toggle with a constant.

## Notes

**Reported as "authentication broke the pin sheet" — it did not.** `65f091b` touched only
`App.tsx`, `AuthGate.tsx`, `AuthContext.tsx`, `LoginPage.tsx`, `LogoutPage.tsx` and the RLS
migration; no pin-flow file. The `authenticated` grants on `banbury_pin_sets` are correct and
complete (`20260807200000:33-36`). The login wall was simply the most memorable recent change, and
the failure mode — silent, no error — looked exactly like a permissions problem. Four auth
hypotheses (RLS writes, schema USAGE, Maps key dropped from the prod build, `/pins` unreachable)
were each killed with evidence before the real cause was found.

**Verification:** `tsc` clean, `eslint` clean, `npm run build` clean, and confirmed working in the
browser by Chris. Runtime evidence mattered here — the two previous fixes to this same file
(`bf6bbc4`, `5b0df2e`, tap-cycle double-advance) both passed `tsc`/`eslint` and both still failed.

**Bearing on the open tap-cycle double-advance bug:** that defect was reported against `/maps`, but
`/maps` has had `pinMode={false}` hardcoded since `a39ab0e` (`MapsPage.tsx:210`) and registers no
map-click listener at all. The report therefore predates the pin-sheets restructure and is very
likely unreproducible as written. If double-advance still occurs, it will be in `/pins` Setup → Map
mode, against the newly-attached listener — re-test there before spending more time on it.

**Left alone deliberately:**
- `/maps` cannot set pins. By design since `a39ab0e` — it is a read-only viewer that links to `/pins`.
- Hand cursor instead of crosshair in Map mode. `cursor-crosshair` (`CourseMap.tsx:507`) sits on the
  outer container and is overridden by Google Maps' own cursor on its internal panes. Cosmetic;
  would need the map's `draggableCursor` option.
