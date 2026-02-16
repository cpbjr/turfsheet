# TurfSheet Project

Comprehensive task management and agronomic intelligence platform for golf course maintenance.

## 🚀 Quick Start

**NEW AI ASSISTANTS:** Read [CLAUDE.md](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/CLAUDE.md) FIRST for project structure, workflows, and guidelines.

## Documentation Index

- **[CLAUDE.md](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/CLAUDE.md)**: AI assistant configuration and project structure (START HERE)
- [PRD.md](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/PRD.md): Product Requirements
- [Active Tasks](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/.agent/Tasks/active.md): Current development focus
- [Style Guide](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/.agent/System/style-guide.md): Visual and component standards
- [UI Prototypes](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/index.html): Main Dashboard High-Fidelity Mockup
- [Knowledge Base](file:///home/cpbjr/WhitePineTech/Projects/TurfSheet/.agent/Knowledge/): Golf course domain expertise and lessons learned

## Development Workflow
Use `npm run dev` to start the local development server in turfsheet-app. Prefer port 5179. 

## References
- "active" = .agent/Tasks/active.md
- "planned" = .agent/Tasks/planned.md
- "blocked" = .agent/Tasks/blocked.md
- "implementation" = .agent/Tasks/Implementation/
- "completed" = .agent/Tasks/completed/
- "prd" = PRD.md
- "style-guide" = .agent/System/style-guide.md

## Rules
- ALWAYS use subagents to search/explore when the file is not known. 

- ALWAYS write implementation plans to .agent/Tasks/Implementation/ before coding.

- ALWAYS use the style-guide for visual and component standards.

- ALWAYS use the PRD for product requirements.

- ALWAYS use the active tasks file for current development focus.

- ALWAYS use the planned tasks file for future development focus.

- ALWAYS use the blocked tasks file for tasks that are blocked.

- ALWAYS use the completed tasks file for tasks that are completed.

- ALWAYS use the UI Prototypes for reference when developing the UI.
