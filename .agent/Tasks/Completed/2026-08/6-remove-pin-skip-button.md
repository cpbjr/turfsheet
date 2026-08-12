# 6 — Remove the Skip button from Pin Sheets Setup

Completed: 2026-08-08
PR: [#35](https://github.com/cpbjr/turfsheet/pull/35) · commit `ffac3c3` · merged `b355a31`

## What was accomplished

Chris noticed while verifying task 5 that Skip and Next appeared to do the same thing.
Investigation confirmed it, and found the hole-18 case was worse than a duplicate.

`skipCurrent` set `session.skipped[hole] = true` then advanced — but **`skipped` was never read
anywhere in the app.** The only references were `types/courseMap.ts:140` (declaration),
`MapsPage.tsx` and `usePinSession.ts` empty initializers, and a draft restore. Not rendered in
the hole grid, not in `pinSheetPrintHtml.ts`, not in the delivery sheet.

| Situation | Next | Skip (before) |
|---|---|---|
| Hole **with** a pin | advance | advance — *identical*; the guard `if (hole == null \|\| s.pins[hole]) return s` bailed first |
| Hole **without** a pin | advance | advance + set a flag nothing reads |
| **Hole 18** | `goDelivery()` | `goRelative(1)`, a no-op at index 17 — **the button looked dead** |

## Solution

Removed `skipCurrent` and the `onSkip` prop chain (`usePinSession` → `PinsPage` →
`PinSetupForm` → `PinMapMode`). Button row went `grid-cols-4` → `grid-cols-3`:
Back / Clear / Next.

## Deliberately kept

- **`skipped` stays in `PinSession`.** Saved drafts persist it (`usePinSession.ts` restores
  `d.skipped || {}`); removing the field would change the draft shape for no gain.
- **The `delete skipped[hole]` lines in `handleMapClick` and `setPinForHole` stay.** Not dead —
  a draft saved before this change can still carry entries, and placing a pin should clear them.

## Files changed

- `turfsheet-app/src/lib/usePinSession.ts`
- `turfsheet-app/src/pages/PinsPage.tsx`
- `turfsheet-app/src/components/pins/PinSetupForm.tsx`
- `turfsheet-app/src/components/pins/PinMapMode.tsx`

## Testing results

- `npm run build` → clean. This was the real check: the prop chain is fully typed, so a missed
  call site could not compile.
- `grep -rn "onSkip\|skipCurrent" src/` → no residual references
- **Runtime confirmed by Chris** on `/pins` → Setup → Map.
