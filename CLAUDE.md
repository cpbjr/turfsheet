# TurfSheet Project Configuration

## RULES
MUST FOLLOW EXPLORE AGENT RULE IN GLOBAL CLAUDE.MD
AWLAYS CALL A HAIKU SUBAGENT!

## Project Overview

TurfSheet is a comprehensive task management and agronomic intelligence platform for golf course maintenance operations.

**Tech Stack:**
- Frontend: React + TypeScript + Vite
- Backend: Supabase (PostgreSQL + REST API)
- Styling: Tailwind CSS
- Hosting: Vercel (planned)

**Development Server:** `npm run dev` (prefer port 5179)

---

## Project Folder Structure

### Documentation Structure (.agent/)

```
.agent/
├── README.md              # Documentation index
├── PRD/                   # Product Requirements Documents
│   ├── README.md          # PRD index
│   ├── core-features.md
│   ├── data-models.md
│   └── ...
├── Tasks/                 # Task Management
│   ├── planned.md         # Tasks ready to work on (source: PRD)
│   ├── active.md          # Currently in progress
│   ├── blocked.md         # Blocked tasks
│   ├── Implementation/    # Implementation plans (REQUIRED before coding)
│   │   └── *.md          # Detailed plans for each task
│   └── completed/         # Archived completed tasks
│       └── YYYY-MM/       # Monthly folders
│           └── *.md       # Completion records
├── System/                # Current State Documentation
│   ├── style-guide.md     # Visual and component standards
│   ├── layout-structure.md
│   └── component-code-reference.md
└── Knowledge/             # Domain Expertise & Lessons Learned
    ├── golf-course/       # Golf course operations knowledge
    │   ├── terminology.md
    │   ├── workflows.md
    │   └── best-practices.md
    └── lessons-learned/   # Project-specific insights
        └── *.md           # Dated lesson files
```

**CRITICAL RULES:**
- Implementation plans MUST be saved to `.agent/Tasks/Implementation/` before coding
- When work is completed:
  1. Move task to `.agent/Tasks/completed/YYYY-MM/`
  2. Delete associated file from `Implementation/`
- NEVER guess at folder structure - check this file first

---

## Task Workflow

### 1. Planning Phase
**Location:** `.agent/Tasks/planned.md`
- Tasks extracted from PRD
- Prioritized and ready to work on
- No implementation details yet

### 2. Implementation Planning (MANDATORY)
**Location:** `.agent/Tasks/Implementation/`
- **ALWAYS create implementation plan BEFORE coding**
- File naming: `implementation-<task-name>.md` or `YYYY-MM-DD_<task-name>.md`
- Include:
  - Task overview
  - Files to modify/create
  - Step-by-step implementation
  - Testing plan
  - Dependencies

### 3. Active Work
**Location:** `.agent/Tasks/active.md`
- Currently in progress tasks
- Reference implementation plan from `Implementation/`
- Update status as work progresses

### 4. Blocked Tasks
**Location:** `.agent/Tasks/blocked.md`
- Tasks that cannot proceed
- Document blocking issue
- Resolution path (if known)

### 5. Completion
**Location:** `.agent/Tasks/completed/YYYY-MM/`
- Move completed task documentation here
- Include:
  - What was accomplished
  - Files changed
  - Testing results
  - Migration details (if applicable)
- **DELETE** associated plan from `Implementation/`

---

## Knowledge Management

### Golf Course Domain Knowledge
**Location:** `.agent/Knowledge/golf-course/`

Purpose: Build institutional knowledge about golf course operations to improve future AI assistance.

**Topics to document:**
- Golf course terminology (greens, fairways, rough, HOC, etc.)
- Maintenance workflows (mowing patterns, scheduling)
- Agronomic concepts (turf health, irrigation, chemicals)
- Industry-specific tools and equipment
- Common tasks and their requirements

**When to add:**
- After learning new golf course concepts
- When user provides domain expertise
- After implementing features that required domain knowledge

### Lessons Learned
**Location:** `.agent/Knowledge/lessons-learned/`

Purpose: Document project-specific insights for more efficient future work.

**What to document:**
- Common mistakes and their solutions
- Architectural decisions and rationale
- Performance optimizations discovered
- Database schema insights
- UI/UX patterns that work well

**File naming:** `YYYY-MM-DD_<topic>.md`

**Template:**
```markdown
# [Topic]
Date: YYYY-MM-DD

## Context
[What was the situation?]

## Problem
[What went wrong or what was learned?]

## Solution
[How was it resolved?]

## Future Application
[How should this inform future work?]
```

---

## Supabase Configuration

**Project Ref:** `scktzhwtkscabtpkvhne`
**MCP Project Name:** `turfsheet`

### Database Operations

**For schema changes (migrations):**
```bash
# Link project (one-time setup)
export SUPABASE_ACCESS_TOKEN="<token-in-secure-location>"
npx supabase@latest link --project-ref scktzhwtkscabtpkvhne

# Create migration
npx supabase@latest migration new <description>

# Push to remote
npx supabase@latest db push
```

**For queries (data inspection):**
```bash
cd ~/Documents/AI_Automation/Tools/mcp-servers
npx tsx run.ts supabase:sql '{"project":"turfsheet","sql":"SELECT * FROM public.staff LIMIT 5"}'
```

**Default Schema:** `public`

**Key Tables:**
- `staff` - Staff members and roles
- `job_templates` - Job definitions
- `staff_jobs` - Assigned tasks
- `projects` - Long-term projects
- `project_tasks` - Project task board

---

## Development Workflow

### Starting New Work

1. ✅ Check `.agent/Tasks/planned.md` for next task
2. ✅ Read relevant PRD sections
3. ✅ Create implementation plan in `.agent/Tasks/Implementation/`
4. ✅ Move task to `.agent/Tasks/active.md`
5. ✅ Begin implementation
6. ✅ Test locally (`npm run dev`)
7. ✅ Verify in browser before deploying

### Completing Work

1. ✅ Test all functionality
2. ✅ Document completion in `.agent/Tasks/completed/YYYY-MM/`
3. ✅ Delete plan from `.agent/Tasks/Implementation/`
4. ✅ Update domain knowledge if applicable
5. ✅ Commit changes (feature branch)

### Git Workflow

- **NEVER push directly to main**
- Create feature branches for all work
- Descriptive commit messages
- PR for review before merging

---

## Style Guide

**Location:** `.agent/System/style-guide.md`

**Key Standards:**
- Component library: Shadcn/ui
- Color palette: Defined in style-guide.md
- Typography: System fonts
- Layout: Responsive, mobile-first

**ALWAYS reference style guide before creating new components.**

---

## Common File Paths

| Shorthand | Full Path |
|-----------|-----------|
| `active` | `.agent/Tasks/active.md` |
| `planned` | `.agent/Tasks/planned.md` |
| `blocked` | `.agent/Tasks/blocked.md` |
| `implementation` | `.agent/Tasks/Implementation/` |
| `completed` | `.agent/Tasks/completed/` |
| `prd` | `.agent/PRD/README.md` |
| `style-guide` | `.agent/System/style-guide.md` |
| `knowledge` | `.agent/Knowledge/` |

---

## AI Assistant Guidelines

### Before Starting ANY Task

1. ☐ Check if relevant implementation plan exists in `Implementation/`
2. ☐ If not, create one (mandatory)
3. ☐ Read style guide for UI work
4. ☐ Check database schema for data operations
5. ☐ Search knowledge base for relevant domain info

### During Implementation

1. ☐ Test locally before deploying
2. ☐ Verify database changes with schema queries
3. ☐ Follow style guide for components
4. ☐ Document new domain knowledge discovered

### After Completion

1. ☐ Move task to completed/
2. ☐ Delete implementation plan
3. ☐ Update knowledge base if applicable
4. ☐ Verify deployment successful

### Context Management

**Use subagents when:**
- Exploring unknown code structure
- Multi-file architecture questions
- Database schema investigation
- Large-scale refactoring analysis

**Keep in parent session:**
- Known file edits (≤3 files)
- Implementation from existing plan
- Style guide reference

---

## Emergency Contacts

- **Developer:** Chris (user)
- **Domain Expert:** Chris (golf course operations knowledge)

---

## Project Status

**Current Phase:** Phase 2 - Staff Management & Scheduling
**Active Features:**
- Dashboard (completed)
- Staff Management (completed)
- Jobs Library (completed)
- Projects/Whiteboard (completed)
- Settings (planned)
- Scheduling System (planned)

**See:** `.agent/Tasks/planned.md` for upcoming work

---

## Quick Start for New AI Sessions

1. Read this CLAUDE.md file
2. Read `.agent/README.md`
3. Check `.agent/Tasks/active.md` for current work
4. Review `.agent/Knowledge/` for domain context
5. Reference `.agent/System/style-guide.md` for UI standards

**For database work:** Always check schema first using MCP-as-code tools.

**For UI work:** Always reference style guide and existing components.

**For new features:** Always create implementation plan first.

---

*Last Updated: 2026-02-16*
