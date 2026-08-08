# 5 — Fix `react-hooks/set-state-in-effect` in PinMapMode

Completed: 2026-08-08
PR: [#33](https://github.com/cpbjr/turfsheet/pull/33) · commit `690f405` · merged `599aeaa`

## What was accomplished

Removed the last lint error in the pin-sheet components. `PinMapMode.tsx:63` tripped
`react-hooks/set-state-in-effect`: a "sync edit fields when hole/pin changes" effect reset four
`useState` values (`editOn`, `editSide`, `editLr`, `editErr`) from the `pin` prop.

The error was **pre-existing**, not introduced by the mobile work in PR #32 — verified by linting
the `HEAD` blob directly, which produced the identical error at the identical line. It had been
left alone during that PR under the surgical-changes rule.

## Why the obvious fixes didn't apply

- **Not derivable state.** The four values back controlled inputs the user types into (Depth /
  Side / Yards in the nudge card), so they can't become pure derived values.
- **`key={currentHole}` alone was insufficient.** The effect's deps were
  `[currentHole, pin?.onYd, pin?.lrSide, pin?.lrYd, pin?.ok]` — the fields must also resync when
  the pin moves *within* a hole (tap map → pin moves → yards recompute → fields update).
- **Keying `PinMapMode` itself was rejected.** It owns `<CourseMap>`; remounting would re-boot the
  Google Maps instance on every hole change and likely resurrect the listener bugs fixed in
  `a427580`.

## Solution

Extracted the nudge card into a local `NudgeByYards` component in the same file — same file so the
module-level `btnClass` / `fieldClass` constants stay in scope, no prop drilling and no new file.
It seeds its own state from props on mount with lazy `useState` initializers, so there is no effect
at all. The parent remounts it with a key encoding both hole and pin position:

```tsx
<NudgeByYards key={`${currentHole}:${pin?.onYd}:${pin?.lrSide}:${pin?.lrYd}:${pin?.ok}`} ... />
```

Those are exactly the deleted effect's deps, so the resync transitions are identical and
in-progress typing is discarded on the same transitions as before. Card JSX and class names were
moved verbatim. Observable behaviour unchanged.

## Files changed

- `turfsheet-app/src/components/pins/PinMapMode.tsx` (only file touched)

## Testing results

- `npx tsc --noEmit` → exit 0
- `npx eslint src/components/pins/PinMapMode.tsx` → **0 errors** (was 1)
- `npx eslint src` → 45 errors, vs **46 on `main`** (measured by stashing the change and
  re-linting, not assumed). Exactly one removed, none added.
- `npm run build` → clean
- **Runtime confirmed by Chris** at `/pins` → Setup → Map: fields populate when stepping holes,
  fields update when the pin moves within a hole, "Apply yards" nudges, validation still works.

## Follow-up raised during this task

Chris observed that **Skip and Next appear to do the same thing**. Investigation confirmed he is
essentially right — see `.agent/Tasks/active.md`. `skipCurrent` sets `session.skipped[hole]`, but
that flag is **never read anywhere in the app**: only `types/courseMap.ts:140` (declaration),
`MapsPage.tsx:129` and `usePinSession.ts:45/61/389` (empty initializers), and
`usePinSession.ts:266` (draft restore). It is not rendered, not printed, and not used in the
delivery sheet. Net effect:

- On a hole **with** a pin, `skipCurrent`'s guard returns state unchanged → Skip is *exactly* Next.
- On a hole **without** a pin, Skip = Next + sets an inert flag.
- On hole 18, Next calls `goDelivery()` but Skip calls `goRelative(1)`, which no-ops at index 17 —
  so Skip is strictly worse there.

Left in place pending Chris's decision. Not removed under the surgical-changes rule.

## Notes

- Pre-existing untracked files (`Implementation/implementation-blue-orange-schedules.md` and the
  six `supabase/migrations/2026032*.sql` pgvector files) were kept untracked; only the one source
  file was staged.
- `src` still carries 45 pre-existing lint errors, mostly `@typescript-eslint/no-explicit-any` in
  `StaffPage.tsx` plus another `set-state-in-effect` elsewhere. Out of scope here.
