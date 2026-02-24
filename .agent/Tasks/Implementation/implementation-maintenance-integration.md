# Integration Plan: BanburyMaintenance → TurfSheet via Old Tom

## Context

BanburyMaintenance is a standalone app where field staff report maintenance issues via Telegram, parsed by GPT-4o, stored in Supabase, and viewed on a separate web dashboard. TurfSheet is building "Old Tom Morris" — an AI agent (OpenClaw) that serves as everyone's assistant via web chat, email, and Telegram.

**The key decision:** Tom handles ALL messages. He IS the bot. There is no separate @BanburyGolfBot with its own Python service and AI parser. Tom receives Telegram messages directly through his existing gateway, understands them conversationally (including maintenance reports), and writes issues to the database himself. Staff can also ask Tom anything — weather, schedules, turf advice — he's a full conversational AI for the whole team.

**What this retires:** The entire BanburyMaintenance backend (both Python Flask services, GPT-4o parser, @BanburyGolfBot, @BanburyRegistrationBot) plus the web dashboard. All of it is replaced by Tom.

---

## Phase 1: Database Foundation

**Goal:** Maintenance issue tables exist in TurfSheet's Supabase, ready for Tom to write to.

### 1.1 Create `maintenance` schema in TurfSheet Supabase

**File:** `supabase/migrations/YYYYMMDD_01_create_maintenance_schema.sql`

Two tables:
- `maintenance.issues` — id, issue_number (serial), description, location_area, location_detail, status (Open/In Progress/Completed), priority (Low/Medium/High), reporter_name, reporter_telegram_id, photo_url, notes, assigned_to, created_at, completed_at
- `maintenance.reporters` — telegram_id (PK), name, role, is_active, message_count, last_message_date

RLS: Full access. Indexes on status, priority, date.

### 1.2 Expose `maintenance` schema in Supabase API settings

Dashboard → Settings → API → add `maintenance` to exposed schemas.

### 1.3 Create `maintenance-photos` storage bucket

Public access, 20MB limit. Tom will upload photos here when staff send them via Telegram.

### 1.4 Migrate existing data (~50 issues, ~1 reporter)

One-time export from BanburyMaintenance Supabase → import to TurfSheet. Small dataset, trivial migration.

---

## Phase 2: Tom Gets Maintenance Tools

**Goal:** Tom can receive issue reports, query/update issues, and manage the maintenance list — all through OpenClaw function-calling.

### 2.1 Add `maintenanceSupabase` client to TurfSheet frontend

**File:** `turfsheet-app/src/lib/supabase.ts` — second client with `db: { schema: 'maintenance' }`

### 2.2 Configure Tom's maintenance tools in OpenClaw

Function-calling tools via Supabase REST API (`Accept-Profile: maintenance` header):

| Tool | Purpose |
|------|---------|
| `create_issue` | Tom parses a staff message and creates a new issue (replaces GPT-4o parser + database handler) |
| `list_issues` | Query by status, priority, hole, reporter |
| `get_issue` | Single issue by number |
| `update_issue` | Change status, add notes, assign |
| `get_summary` | Counts by status/priority for briefings |
| `upload_photo` | Store photo from Telegram to Supabase Storage, attach URL to issue |

### 2.3 Tom's Telegram channel

Tom receives Telegram messages through his existing OpenClaw gateway. When a staff member sends a message like "bunker on 7 is washed out from the rain", Tom:
1. Recognizes it as a maintenance report
2. Extracts location (hole 7, bunker), priority (medium), description
3. Calls `create_issue` tool
4. Responds: "Got it — logged as issue #24: bunker washout on hole 7. I'll let Darryl know."

When a staff member asks "how do I treat dollar spot on creeping bent?", Tom just answers conversationally. He's not limited to issue intake.

### 2.4 Tom's system prompt additions

- Awareness of maintenance tracking responsibilities
- Golf course location system (holes 1-18, facility areas, sub-locations like fairway/green/bunker)
- Priority inference from language ("flooding" = high, "small divot" = low)
- Morning briefing behavior: proactively summarize open issues when Darryl opens chat
- Staff management: can register/deactivate reporters

### 2.5 Reporter registration through Tom

No more @BanburyRegistrationBot. When a new staff member messages Tom on Telegram for the first time, Tom can ask their name and add them to `maintenance.reporters`. Or Darryl can say "Tom, add James as a reporter" and Tom handles it.

---

## Phase 3: TurfSheet UI Integration

**Goal:** Visual maintenance list inside TurfSheet for quick reference.

### 3.1 Dashboard RightPanel widget

**File:** `turfsheet-app/src/components/layout/RightPanel.tsx`

"Open Issues" section: count badge + top 3 high-priority items as compact cards (issue #, location, snippet, days open). Click to expand or navigate.

### 3.2 Dedicated `/maintenance` page

**New file:** `turfsheet-app/src/pages/MaintenancePage.tsx`

Simple list view:
- Filter bar: status, priority, hole
- Issue cards: number, date, location, description, priority badge, status, photo thumbnail
- "Mark Complete" button per row
- Simpler than BanburyMaintenance dashboard — no analytics, no user management tabs

### 3.3 Sidebar + Route

- **File:** `turfsheet-app/src/components/layout/Sidebar.tsx` — add `AlertTriangle` icon after Calendar
- **File:** `turfsheet-app/src/App.tsx` — add `/maintenance` route

---

## Phase 4: Retirement

### What gets fully retired:
| Component | Status |
|-----------|--------|
| @BanburyGolfBot + Python bot service | **Shut down** — Tom replaces it |
| @BanburyRegistrationBot + Python registration service | **Shut down** — Tom handles registration |
| GPT-4o-mini AI parser | **Gone** — Tom does his own parsing |
| BanburyMaintenance web dashboard (Netlify) | **Shut down** — TurfSheet `/maintenance` page replaces it |
| `maintenance_log` schema on old Supabase project | **Archived** — data migrated |
| `system_settings` table | **Dropped** |
| Login/password system | **Dropped** |

### What survives:
- The `maintenance.issues` data model (proven, ~50 real records)
- The 3-part location system (area + detail + position)
- The concept of issue_number for easy reference ("#24")

### Note on BanburyMaintenance Supabase project
`klyzdnocgrvassppripi` also hosts the Taskboard schema — cannot delete the project. Maintenance data just stops being written there.

---

## Priority Order

1. **Phase 1** — DB schema + data migration (foundation)
2. **Phase 2** — Tom's maintenance tools (core value — everything flows through Tom)
3. **Phase 3.1** — RightPanel widget (quick glanceable view)
4. **Phase 3.2-3.4** — Full `/maintenance` page
5. **Phase 4** — Shut down old services

---

## Verification

- [ ] Tom receives Telegram message from staff → creates issue in `maintenance.issues`
- [ ] Tom responds with confirmation including issue number and parsed location
- [ ] Staff asks Tom a general question → gets conversational answer (not issue-only)
- [ ] Darryl asks Tom "What needs attention?" → gets live summary from database
- [ ] Darryl tells Tom "Mark #5 as done" → status updates
- [ ] RightPanel shows open issues count + high-priority items
- [ ] `/maintenance` page lists, filters, and allows status changes
- [ ] @BanburyGolfBot and @BanburyRegistrationBot services can be stopped without impact
