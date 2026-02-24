# Implementation Plan: Darryl's Web Interface to Old Tom Morris

**Date:** 2026-02-24
**Branch:** `feature/darryl-tom-chat`

## Context

Darryl is the Superintendent at Banbury Golf Course. He doesn't use technology much and needs a simple way to communicate with **Old Tom Morris** — the OpenClaw AI agent that manages TurfSheet operations. Currently Tom is only accessible via Telegram. This plan creates:

1. A **web chat interface** inside TurfSheet so Darryl can talk to Tom from his desktop
2. **Email-to-Tom** processing so Darryl can email tom@whitepineagency.com and Tom will handle tasks/queries

---

## Architecture

```
Darryl's Browser (TurfSheet)
    │
    ├── Web Chat UI (/tom route)
    │       │
    │       ▼
    │   Caddy Reverse Proxy (beefy server, HTTPS)
    │       │   tom.whitepine-tech.com/api/* → localhost:18790
    │       ▼
    │   OpenClaw Gateway (Old Tom Morris, port 18790)
    │       │   POST /hooks/agent  (send message)
    │       │   POST /v1/chat/completions  (OpenAI-compatible)
    │       ▼
    │   Tom processes → responds
    │
    └── Email Path
        Darryl emails tom@whitepineagency.com
            │
            ▼
        Himalaya CLI (cron, every 5 min on beefy)
            │
            ▼
        Email processor script → calls OpenClaw gateway
            │
            ▼
        Tom processes → replies via email + stores in Supabase
```

### Key Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Frontend-to-Tom connection | Caddy reverse proxy on beefy → OpenClaw gateway | Simplest path. No new backend service needed. Caddy handles HTTPS + auth. |
| Chat history storage | Supabase `tom_conversations` table | Persistent, queryable, consistent with TurfSheet patterns |
| Real-time responses | HTTP request/response (not polling) | OpenClaw `/hooks/agent` returns response directly. No polling needed. |
| Email processing | Himalaya CLI + Python cron script on beefy | Proven pattern from Bud agent. Already installed. |
| Email address | tom@whitepineagency.com | Use existing Hostinger domain. Quick setup. |

---

## Phase 1: Infrastructure (Beefy Server)

### Task 1.1: Expose OpenClaw Gateway via Caddy

Add a Caddy reverse proxy rule on beefy server to expose Tom's gateway securely.

**On beefy server — update Caddyfile:**
```caddy
tom.whitepine-tech.com {
    # CORS for TurfSheet frontend
    header Access-Control-Allow-Origin "https://turfsheet.vercel.app"
    header Access-Control-Allow-Methods "POST, OPTIONS"
    header Access-Control-Allow-Headers "Content-Type, Authorization"

    handle /api/* {
        uri strip_prefix /api
        reverse_proxy localhost:18790
    }
}
```

- HTTPS via Let's Encrypt (automatic with Caddy)
- Auth: Bearer token passed through from frontend (OpenClaw validates it)
- DNS: Add A record for `tom.whitepine-tech.com` → 5.78.152.85

### Task 1.2: Verify Gateway Token

SSH to beefy as turfuser, find the gateway auth token in `~/.openclaw/openclaw.json` or gateway state files. Test:

```bash
curl -X POST http://127.0.0.1:18790/hooks/agent \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Hello from HTTP test","channel":"web"}'
```

---

## Phase 2: Database Schema

### Task 2.1: Create tom_conversations table

**File:** `supabase/migrations/YYYYMMDD_01_create_tom_conversations.sql`

```sql
-- Migration: Create tom_conversations table for Darryl-Tom chat history
-- Rollback: DROP TABLE IF EXISTS tom_conversations;

CREATE TABLE tom_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'email', 'telegram')),
  email_subject TEXT,
  email_from TEXT,
  status TEXT DEFAULT 'delivered' CHECK (status IN ('sending', 'delivered', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tom_conversations_created ON tom_conversations(created_at DESC);

-- RLS
ALTER TABLE tom_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON tom_conversations FOR ALL USING (true);
```

Push: `npx supabase@latest db push`

---

## Phase 3: Frontend — Chat Page

### Task 3.1: Add TypeScript types

**File:** `turfsheet-app/src/types/index.ts` — add:

```typescript
export interface TomMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  source: 'web' | 'email' | 'telegram';
  email_subject?: string;
  created_at: string;
  status: 'sending' | 'delivered' | 'failed';
}
```

### Task 3.2: Create chat hook

**File:** `turfsheet-app/src/hooks/useTomChat.ts`

Responsibilities:
- Fetch conversation history from Supabase (paginated, newest first)
- Send message: save to Supabase with status='sending', POST to `tom.whitepine-tech.com/api/hooks/agent`, save Tom's response, update status
- Auto-scroll to newest message
- Error handling (Tom offline, network issues)

### Task 3.3: Create chat components

**File:** `turfsheet-app/src/components/tom/ChatMessage.tsx`
- Message bubble component
- User messages: right-aligned, turf-green background
- Tom messages: left-aligned, light gray background
- Timestamp below each message
- Markdown rendering for Tom's responses (he may use formatting)

**File:** `turfsheet-app/src/components/tom/ChatInput.tsx`
- Text input + Send button
- Send on Enter, Shift+Enter for newline
- Disabled while waiting for response
- Simple, large input — easy for Darryl

### Task 3.4: Create TomChatPage

**File:** `turfsheet-app/src/pages/TomChatPage.tsx`

Layout:
- Full height of main content area (no right panel on this page)
- Chat history scrollable area (top)
- Fixed input bar at bottom
- "Tom" header with green dot (online) or red dot (offline)
- Simple — no clutter, just a conversation

### Task 3.5: Add route and sidebar nav

**Files to modify:**
- `turfsheet-app/src/App.tsx` — add route: `/tom` → `TomChatPage`
- `turfsheet-app/src/components/layout/Sidebar.tsx` — add MessageCircle icon for Tom Chat, position near top (this is a primary feature for Darryl)

---

## Phase 4: Email Integration (Beefy Server)

### Task 4.1: Set up tom@whitepineagency.com

- Create email account in Hostinger panel
- Configure Himalaya CLI on beefy server for turfuser:
  ```toml
  # ~/.config/himalaya/config.toml (turfuser)
  [accounts.tom]
  default = true
  email = "tom@whitepineagency.com"
  backend.type = "imap"
  backend.host = "imap.hostinger.com"
  backend.port = 993
  backend.encryption = "tls"
  backend.auth.type = "password"
  backend.auth.raw = "<password>"

  message.send.backend.type = "smtp"
  message.send.backend.host = "smtp.hostinger.com"
  message.send.backend.port = 465
  message.send.backend.encryption = "tls"
  message.send.backend.auth.type = "password"
  message.send.backend.auth.raw = "<password>"
  ```

### Task 4.2: Create email processor script

**File:** On beefy server, e.g. `/home/turfuser/scripts/tom-email-processor.py`

Logic:
1. Check inbox via Himalaya: `himalaya message list --account tom`
2. For each unread email from Darryl's address:
   - Parse subject and body
   - POST to OpenClaw gateway (`localhost:18790/hooks/agent`)
   - Save message + response to Supabase `tom_conversations` (source='email')
   - Reply to Darryl via Himalaya with Tom's response
   - Mark email as read
3. Cron: `*/5 * * * * /home/turfuser/scripts/tom-email-processor.py`

### Task 4.3: Email messages appear in web chat

Since both web and email messages go to the same `tom_conversations` table, Darryl will see email conversations in the web chat too (marked with an email icon).

---

## Phase 5: Polish

### Task 5.1: Environment configuration

Store Tom's gateway URL and token securely:
- Add `VITE_TOM_GATEWAY_URL` and `VITE_TOM_GATEWAY_TOKEN` to `.env`
- For production: Vercel environment variables
- Note: Token in frontend is acceptable since this is a single-user app (Darryl), not public

### Task 5.2: Offline handling

- If gateway is unreachable, show "Tom is currently offline" message
- Queue messages locally and retry when Tom comes back (optional, stretch goal)

### Task 5.3: Quick-action suggestions

Add a few suggestion chips below the input for Darryl:
- "Who's working today?"
- "Create a job"
- "Weather forecast"
- "What's on the calendar?"

---

## Files to Create

| File | Purpose |
|------|---------|
| `turfsheet-app/src/pages/TomChatPage.tsx` | Main chat page |
| `turfsheet-app/src/components/tom/ChatMessage.tsx` | Message bubble |
| `turfsheet-app/src/components/tom/ChatInput.tsx` | Input bar |
| `turfsheet-app/src/hooks/useTomChat.ts` | Chat logic + API |
| `supabase/migrations/YYYYMMDD_01_create_tom_conversations.sql` | DB schema |

## Files to Modify

| File | Change |
|------|--------|
| `turfsheet-app/src/App.tsx` | Add `/tom` route |
| `turfsheet-app/src/components/layout/Sidebar.tsx` | Add Tom Chat nav icon |
| `turfsheet-app/src/types/index.ts` | Add `TomMessage` interface |
| `turfsheet-app/.env` | Add gateway URL + token |

## Server-Side (Beefy) — Manual Setup

| Task | What |
|------|------|
| Caddy config | Add `tom.whitepine-tech.com` reverse proxy |
| DNS | A record → 5.78.152.85 |
| Hostinger | Create tom@whitepineagency.com |
| Himalaya | Configure for turfuser |
| Email processor | Python script + cron |

---

## Verification Plan

1. **Infrastructure:** `curl -X POST https://tom.whitepine-tech.com/api/hooks/agent ...` returns Tom's response
2. **Database:** Run migration, verify table exists via MCP query
3. **Frontend chat:** Open `/tom` route, send message, see response from Tom
4. **History:** Refresh page, previous messages load from Supabase
5. **Email:** Send email to tom@whitepineagency.com, verify it appears in web chat within 5 minutes
6. **Email reply:** Verify Darryl receives Tom's response in his inbox
7. **Dev server:** `npm run dev` — verify no build errors, chat page accessible

---

## Implementation Order

1. Infrastructure first (Caddy + verify gateway token) — needed for everything else
2. Database migration — quick, unblocks frontend
3. Frontend chat UI (Phase 3) — the main deliverable
4. Email integration (Phase 4) — can be done in parallel or after
5. Polish (Phase 5) — last
