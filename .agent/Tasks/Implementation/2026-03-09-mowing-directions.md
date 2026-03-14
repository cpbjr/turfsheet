# Mowing Directions on Job Templates

## Next Agent Quickstart

**Task:** Implement mowing directions on job templates — all planning is done, execute the 6 steps below.

**Branch to create:** `feature/mowing-directions`

**Dev server:** `npm run dev` from `turfsheet-app/` (prefers port 5179)

**Supabase link (run once if not linked):**
```bash
export SUPABASE_ACCESS_TOKEN="<token from secure location>"
npx supabase@latest link --project-ref scktzhwtkscabtpkvhne
```

**Key existing patterns to follow:**
- Form field style: `inputClasses` and `labelClasses` vars defined at top of `JobForm.tsx`
- Section radio toggle style: copy the existing `section` radio pattern in `JobForm.tsx` (lines ~66-82)
- Card badge style: copy the existing priority/section badge pattern in `JobCard.tsx`
- Supabase queries use schema prefix: `turfsheet.jobs` (but Supabase JS client uses `.from('jobs')` — the schema is set at the client level)

**Do NOT:**
- Add a Whiteboard update — the whiteboard reads from `daily_assignments` joined to `jobs`, so the new columns will appear automatically once JobCard is updated
- Add equipment fields — deferred to future task
- Add mowing pattern icons — text only for now

**Verify DB after migration:**
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = '\''turfsheet'\'' AND table_name = '\''jobs'\'' ORDER BY ordinal_position"}'
```

---

## Context
Golf course mowing jobs are distinct from general maintenance tasks — they require specific metadata (direction, HOC, pattern) that general jobs don't need. Rather than building a fully separate table (which would require changing the `daily_assignments` FK and all assignment logic), we add a `job_type` column to `turfsheet.jobs` and mowing-specific columns. The Job Library gets separate tabs so mowing jobs feel like a distinct template type in the UI. The dashboard/whiteboard job card gains optional metadata rows for mowing fields. This is the simplest approach that keeps all existing FK/query code unchanged.

---

## Confirmed Requirements
- **Job Type:** `General` (default) | `Mowing`
- **Mowing fields (only populated for Mowing type):**
  - `mow_direction`: `12-6` | `2-8` | `3-9` | `4-10`
  - `hoc`: decimal (e.g. `0.125`)
  - `mow_pattern`: `Double Cut (Cross)` | `Double Cut (Parallel)` | `No Cleanup`
- **No Clean Up direction field** — out of scope
- **Equipment field** — deferred (not MVP)
- **Job Library:** Separate tabs — "General Jobs" | "Mowing Jobs"
- **Card display:** Same existing card + metadata rows for mowing fields (no separate card component needed)
- **Icons:** Text only for now
- **Scheduling:** Mowing jobs use the existing `is_scheduled` / `scheduled_days` system — no extra work needed

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/20260309000000_add_mowing_fields_to_jobs.sql` | New — adds 4 columns |
| `turfsheet-app/src/types/index.ts` | Add types + update `Job` interface |
| `turfsheet-app/src/components/jobs/JobForm.tsx` | Job Type selector + conditional mowing fields section |
| `turfsheet-app/src/components/jobs/JobCard.tsx` | Optional mowing metadata rows |
| `turfsheet-app/src/pages/JobsPage.tsx` | Two tabs (General / Mowing), pass new props to JobCard |
| `turfsheet-app/src/pages/ClassicDashboard.tsx` | Pass new props to all 3 JobCard usages |

---

## Step-by-Step Implementation

### Step 1 — Database Migration

Create `supabase/migrations/20260309000000_add_mowing_fields_to_jobs.sql`:

```sql
-- Migration: Add job_type and mowing-specific fields to turfsheet.jobs
-- Date: 2026-03-09
-- Rollback: ALTER TABLE turfsheet.jobs DROP COLUMN job_type, mow_direction, hoc, mow_pattern;

ALTER TABLE turfsheet.jobs
  ADD COLUMN job_type TEXT NOT NULL DEFAULT 'General'
    CHECK (job_type IN ('General', 'Mowing')),
  ADD COLUMN mow_direction TEXT
    CHECK (mow_direction IN ('12-6', '2-8', '3-9', '4-10')),
  ADD COLUMN hoc NUMERIC(6,4),
  ADD COLUMN mow_pattern TEXT
    CHECK (mow_pattern IN ('Double Cut (Cross)', 'Double Cut (Parallel)', 'No Cleanup'));
```

Push: `npx supabase@latest db push`

### Step 2 — Update TypeScript Types (`src/types/index.ts`)

Add before the `Job` interface:
```typescript
export type MowDirection = '12-6' | '2-8' | '3-9' | '4-10';
export type MowPattern = 'Double Cut (Cross)' | 'Double Cut (Parallel)' | 'No Cleanup';
export type JobType = 'General' | 'Mowing';
```

Add 4 fields to the `Job` interface:
```typescript
job_type: JobType;            // NEW (default 'General')
mow_direction?: MowDirection; // NEW
hoc?: number;                 // NEW
mow_pattern?: MowPattern;     // NEW
```

### Step 3 — Update JobForm.tsx

Add to form state (after `section`):
- `job_type: initialData?.job_type ?? 'General'`
- `mow_direction: initialData?.mow_direction ?? ''`
- `hoc: initialData?.hoc ?? ''`
- `mow_pattern: initialData?.mow_pattern ?? ''`

Add **Job Type** toggle (after Dashboard Section, before Scheduling):
- Radio buttons or styled toggle: `General` | `Mowing`
- Use same radio style as the existing Section selector

Add conditional **Mowing Details** block (only when `job_type === 'Mowing'`):
```
[Mow Direction dropdown: 12-6 / 2-8 / 3-9 / 4-10]
[HOC input: number, step=0.001, placeholder="0.125"]
[Mow Pattern dropdown: Double Cut (Cross) / Double Cut (Parallel) / No Cleanup]
```

On submit: when `job_type !== 'Mowing'`, null out the three mowing fields before calling `onSubmit`.

### Step 4 — Update JobCard.tsx

Add new optional props:
```typescript
jobType?: string;
mowDirection?: string;
hoc?: number;
mowPattern?: string;
```

In the card body, after the existing badges block, add:
```tsx
{jobType === 'Mowing' && (mowDirection || hoc || mowPattern) && (
  <div className="pt-2 border-t border-border-color space-y-1">
    {mowDirection && (
      <div className="text-[0.75rem] font-sans">
        <span className="text-text-secondary">Direction: </span>
        <span className="text-text-primary font-bold">{mowDirection}</span>
      </div>
    )}
    {hoc && (
      <div className="text-[0.75rem] font-sans">
        <span className="text-text-secondary">HOC: </span>
        <span className="text-text-primary font-bold">{hoc}"</span>
      </div>
    )}
    {mowPattern && (
      <div className="text-[0.75rem] font-sans">
        <span className="text-text-secondary">Pattern: </span>
        <span className="text-text-primary font-bold">{mowPattern}</span>
      </div>
    )}
  </div>
)}
```

### Step 5 — Update JobsPage.tsx

Add tab state: `'General' | 'Mowing'`, default `'General'`.

Replace the single job grid with tabbed layout:
- Tab bar: **General Jobs** | **Mowing Jobs** (styled like existing section toggles)
- Filter `jobTemplates` by `job_type` matching the active tab
- Pass 4 new props to all `<JobCard>` instances:
  `jobType={job.job_type} mowDirection={job.mow_direction} hoc={job.hoc} mowPattern={job.mow_pattern}`

### Step 6 — Update ClassicDashboard.tsx

Pass the 4 new props to each of the 3 `<JobCard>` usages (scheduled queue, first jobs, second jobs):
```tsx
jobType={job.job_type}
mowDirection={job.mow_direction}
hoc={job.hoc}
mowPattern={job.mow_pattern}
```

---

## Verification

1. `npm run dev` — confirm no TypeScript errors
2. **Job Library → Mowing Jobs tab** → Add Job Template → set type Mowing → mowing fields appear
3. Save mowing job → card shows Direction / HOC / Pattern rows
4. **Job Library → General Jobs tab** → confirm no mowing metadata on those cards
5. Edit existing mowing job → values pre-populated
6. **Classic Dashboard** → mowing jobs show metadata rows on their cards
7. DB check:
   ```bash
   cd ~/Documents/AI_Automation/Tools/mcp-servers
   npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT id, title, job_type, mow_direction, hoc, mow_pattern FROM turfsheet.jobs LIMIT 10"}'
   ```
