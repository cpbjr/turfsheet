# TurfSheet PRD - Section Index

> **Source of truth:** [`/PRD.md`](../../PRD.md) (root of project)
>
> This directory contains decomposed sections of the PRD for efficient agent consumption.
> Each file is self-contained. Read only the section(s) relevant to your task.

## Section Map

| File | Lines in PRD | What's Inside | Read When... |
|------|-------------|---------------|--------------|
| [executive-summary.md](executive-summary.md) | 1-66 | Vision, key differentiators, success metrics, app navigation structure | You need project overview or high-level goals |
| [core-features.md](core-features.md) | 69-106 | Task management, task templates, frequency patterns, priority levels | Working on task creation, assignment, or templates |
| [staff-and-scheduling.md](staff-and-scheduling.md) | 108-182 | Staff data model, schedule types, worker availability, skill profiles | Working on staff management UI or scheduling logic |
| [scheduling-system.md](scheduling-system.md) | 640-917 | Blue/Orange 19-day rotation algorithms, availability calculation, assignment logic, visual indicators, schedule preview | Implementing scheduling algorithms or availability features |
| [communication.md](communication.md) | 184-204 | Messaging, broadcasts, push notifications, team groups | Working on messaging or notification features |
| [reporting.md](reporting.md) | 206-232 | Daily reports, mowing direction history, worker productivity, compliance logs | Working on reports or analytics |
| [equipment.md](equipment.md) | 234-290 | Equipment inventory, checkout/checkin, maintenance tracking, Toro myTurf integration | Working on equipment management features |
| [irrigation.md](irrigation.md) | 292-340 | Irrigation quick-log, probe readings, hand watering, dry spot tracking, syringe cycles | Working on irrigation logging features |
| [superintendent-dashboard.md](superintendent-dashboard.md) | 342-486 | Clippings tracking, weather intelligence, analog year matching, GDD tracking, pattern alerts | Working on dashboard, weather, or agronomic features |
| [chemical-management.md](chemical-management.md) | 488-542 | Chemical products, application records, REI tracking, compliance (Phase 5) | Working on chemical/spray management |
| [user-roles.md](user-roles.md) | 546-637 | Superintendent, worker, office manager personas, typical day workflows, pain points | Understanding user needs or designing UX |
| [data-models.md](data-models.md) | 920-1306 | All SQL CREATE TABLE statements, indexes, relationships | Working on database schema, migrations, or queries |
| [api-specification.md](api-specification.md) | 1308-2078 | All REST API endpoints with request/response examples | Working on API routes or frontend data fetching |
| [system-architecture.md](system-architecture.md) | 2080-2232 | Tech stack, deployment, multi-tenancy, performance, security architecture | Making infrastructure or architecture decisions |
| [development-phases.md](development-phases.md) | 2234-2430 | Phase 1-7 deliverables, technical tasks, success criteria | Planning work or understanding project timeline |
| [security-compliance.md](security-compliance.md) | 2432-2506 | Data protection, encryption, backup, compliance, privacy/GDPR | Working on auth, security, or compliance features |
| [cost-analysis.md](cost-analysis.md) | 2508-2570 | Monthly operating costs, scaling costs, competitor comparison, dev cost estimates | Business planning or infrastructure decisions |

## Usage for Agents

```
# Example: Agent needs to understand the scheduling algorithm
Read .agent/PRD/scheduling-system.md

# Example: Agent needs to check database schema for a table
Read .agent/PRD/data-models.md

# Example: Agent building a new API endpoint
Read .agent/PRD/api-specification.md
```

## Notes

- Files were decomposed from PRD.md v1.1 (2026-01-26)
- If PRD.md is updated, these files should be regenerated
- The appendix (glossary, references, changelog) is not split out — refer to PRD.md directly for those
