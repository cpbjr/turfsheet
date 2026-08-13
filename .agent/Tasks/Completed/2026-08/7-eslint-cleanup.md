# 7 — Fix all eslint errors in turfsheet-app/src

Completed: 2026-08-08
PR: [#36](https://github.com/cpbjr/turfsheet/pull/36) · merged `c200273`
Commits: `17ed8f0`, `d09b8bb`, `f708f68`, `0bda602`, `d9612bc`, `50692cb`

**45 errors → 0.** The 5 remaining warnings are pre-existing and unchanged.

## ⚠️ Important discovery: `npx tsc --noEmit` is a no-op in this repo

The root `tsconfig.json` is `"files": []` plus project references, so **`npx tsc --noEmit`
compiles nothing and always exits 0.** It has been cited as verification in past handoffs and
completion records; those claims were vacuous.

**Use `npx tsc -b` (or `npm run build`, which runs `tsc -b && vite build`).**

Found when `npm run build` caught a `TS2322` that `tsc --noEmit` had just reported clean.

## What was done, by commit

| # | Fix | Errors |
|---|---|---|
| 1 | `any` → real types | 30 |
| 2 | Split non-component exports | 4 |
| 3 | Effects referencing functions declared below them | 5 |
| 4 | Edit buffers seeded at mount, not synced in an effect | 3 |
| 5 | Awaited fetchers in effects | 3 |
| 6 | Last two set-state-in-effect | 2 |

**1 — `any` → real types.** The 27 `no-explicit-any` were largely one leak: form components
declared `onSubmit: (data: any) => void`, and every page handler downstream inherited it. Each
form now exports the payload it actually submits (`StaffFormData`, `JobFormData`,
`EquipmentFormData`, `EventFormData`, `DaySchedule[]`). Plus `prefer-const`, an unused `_file`
binding, and a case-block declaration.

**2 — Non-component exports.** `contexts/useAuth.ts` and `contexts/useSettings.ts` now hold the
context object and hook; the `.tsx` files export only their provider. `createCalendarToolbar`
moved beside `CalendarToolbar`. `isPinHandoutRequest` lost its `export` (nothing else imports it).

**3 — Declaration order.** `react-hooks/immutability` fired where a `useEffect` called a `const`
arrow function defined further down the body. Moved the effect below the declarations; each
file's effects keep their relative order. **This uncovered 2 errors it had been masking**, so
11 → 8 rather than 11 → 6.

**4 — Edit buffers.** Same class as task 5's nudge card, three different right answers:
`ProjectListItem` reads `project.title`/`priority` directly when not editing, so its buffers are
seeded in the handler that starts editing (this also stops an external update clobbering
in-progress typing). `PinEntryTable`'s only state is `drafts` and the effect just cleared it, so
keying on session identity is exactly equivalent. `ProductForm` uses a lazy initializer and is
keyed on product id.

**5 — Awaited fetchers.** Three effects called an async fetcher directly. Each already awaits
before its first `setState`, so nothing ever cascaded synchronously — the rule just cannot see
through the call. An awaited local `load()` satisfies it with **zero behaviour change**:
`setLoading(true)` stays where it was, and `Promise.all` keeps parallel fetches parallel. This
avoided hoisting the loading flag to call sites, which would have forced `ManageScheduleModal`
onto a conditional mount to keep its spinner on reopen.

**6 — Last two.** `CalendarPage` took the same wrapper. `MapsPage` was the only genuine
synchronous `setState` — clearing the pin overlay on layer-off — and that clearing was **dead
code**: both readers (`displayPins`, and the "Showing pins" caption) already gate on
`showPinsLayer`, so a stale overlay was never displayable. Removing it also means re-enabling
the layer redraws immediately instead of blanking until the refetch lands.

## Testing results

- `npx tsc -b --force` → exit 0
- `npm run build` → clean
- `npx eslint src` → **0 errors**, 5 warnings — verified identical to `main` by diffing the
  warning list, not just comparing counts. Only line numbers moved, where effects were relocated.
- **Runtime confirmed by Chris** across login/logout, dashboard right panel + Manage Schedule
  modal, projects list inline edit, Chemicals (product add/edit, spray calculator), Calendar,
  Maps pin-layer toggle, and Pin Sheets table mode.

## Follow-up raised: `StaffSchedule` does not match the database

`types/index.ts:169` declares `StaffSchedule extends WeeklySchedule`, i.e. nested
`monday: DaySchedule` objects. The actual `staff_schedules` table has **flat** `monday_on` /
`monday_start` / `monday_end` columns — as `StaffPage.handleSaveSchedule` demonstrates when it
builds its upsert.

That mismatch is why two files were reading the table through `any`. Those sites now use a local
`ScheduleRow` with a comment explaining why, rather than reuse a type that is wrong. The type
itself is untouched. Logged in `active.md`.
