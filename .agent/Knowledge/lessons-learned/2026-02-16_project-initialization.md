# Project Initialization and Documentation Structure

Date: 2026-02-16

## Context

TurfSheet project was developed with extensive documentation but lacked a central CLAUDE.md file to guide AI assistants on project structure and workflows.

## Problem

Without a CLAUDE.md file:
- AI assistants had to discover folder structure through exploration
- Inconsistent understanding of where to save implementation plans
- No guidance on completing tasks (moving to completed/, deleting from Implementation/)
- No mechanism to build domain knowledge over time

## Solution

Created comprehensive CLAUDE.md with:

1. **Project Folder Structure Section**
   - Visual tree of .agent/ directory
   - Clear documentation of Implementation/ and completed/ workflows
   - CRITICAL RULES section to prevent structural mistakes

2. **Task Workflow Section**
   - Step-by-step process from planning to completion
   - Mandatory implementation planning before coding
   - Clear completion criteria (move to completed/, delete from Implementation/)

3. **Knowledge Management System**
   - New `.agent/Knowledge/` folder structure
   - `golf-course/` for domain expertise
   - `lessons-learned/` for project insights
   - Templates for documenting learnings

4. **Supabase Configuration**
   - Project ref and MCP project name
   - Clear separation: CLI for schema, MCP for queries
   - Example commands for common operations

## Future Application

### For All Projects

1. **Create CLAUDE.md early** - Don't wait until project is mature
2. **Document folder structure explicitly** - Prevents AI from guessing/creating wrong paths
3. **Include workflow diagrams** - Step-by-step processes reduce errors
4. **Add Knowledge/ folder** - Domain expertise accumulates over time

### For TurfSheet Specifically

1. **Update terminology.md** as new golf course concepts are learned
2. **Document lessons-learned/** after each major feature
3. **Keep CLAUDE.md in sync** with actual project structure
4. **Reference Knowledge/** before starting domain-heavy features

### AI Assistant Guidance

**Before starting work:**
- ✅ Read CLAUDE.md first
- ✅ Check Knowledge/ for relevant domain context
- ✅ Verify folder structure before creating files

**During implementation:**
- ✅ Document new domain concepts to Knowledge/golf-course/
- ✅ Save implementation plans to correct location (.agent/Tasks/Implementation/)

**After completion:**
- ✅ Follow completion workflow (move to completed/, delete from Implementation/)
- ✅ Add lessons-learned/ entry if significant insights gained

## Impact

This structure should:
- Reduce context window waste on exploration
- Improve consistency across AI sessions
- Build institutional knowledge over time
- Make onboarding faster for new AI assistants or human developers

---

**Key Insight:** Documentation isn't just for humans - it's essential for AI assistants to work efficiently and build on past learnings rather than rediscovering the same information each session.
