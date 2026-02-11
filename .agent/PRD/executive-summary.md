# TurfSheet PRD: Executive Summary

> Extracted from PRD.md lines 1-66. Source of truth: [PRD.md](../../PRD.md)

# TurfSheet - Product Requirements Document

## Executive Summary

**Product Name:** TurfSheet
**Version:** 1.0
**Last Updated:** 2026-01-26
**Status:** Planning Phase

### Vision

TurfSheet is a comprehensive task management application designed specifically for golf course maintenance operations. The system enables superintendents and managers to assign daily tasks to grounds crew members based on their availability, complex rotation schedules, skills, and current conditions. Workers receive assignments on mobile devices while managers coordinate from a desktop dashboard.

### Developer's Plan
Main components of the app are the following, each of which will have it's own separate page and will be accessible via the main left navigation bar.
    1. Dashboard
    2. Jobs. Users can create their own custom jobs, or use pre-defined jobs.
    3. Equipment. Users can create their own custom equipment, or use pre-defined equipment. Ability to integrate with manufacturer APIs for real-time data (future)
    4. Staff
    5. Irrigation
    6. Reports
        6.1 Irrigation Reports
        6.2 Job Reports
        6.3 Equipment Reports
        6.4 Staff Reports
    7. Inventory, primarily of chemicals.
    8. Planning
        8.1 Agronomic Planning
        8.2 Tournament Planning
        8.3 Other Planning
    9. Messaging
    10. Training
    11. Settings
    12. Help
** Note: This has been added subsequent to PRD production. **

### Key Differentiators

- **Golf-Specific Scheduling:** Blue/Orange 19-day rotation system proven at Banbury Golf Course
- **Mixed Workforce Support:** Single system handling full-time rotation crews, part-time workers, and weekend staff
- **Agronomic Intelligence:** Weather pattern matching, clipping yield tracking, irrigation logging
- **Equipment Management:** Path toward Toro myTurf integration for connected equipment
- **Cost-Effective:** 10-20% of typical whiteboard app pricing ($10-35/month vs $50-200/month)

### Success Metrics

- Replace physical whiteboards and paper logs
- Reduce task assignment time
- Eliminate missed tasks or plans, due to poor record keeping.
- Historical data capture for compliance and planning

---

## Table of Contents

1. [Core Features](#core-features)
2. [User Roles & Personas](#user-roles--personas)
3. [Scheduling System](#scheduling-system)
4. [Data Models](#data-models)
5. [API Specification](#api-specification)
6. [System Architecture](#system-architecture)
7. [Development Phases](#development-phases)
8. [Security & Compliance](#security--compliance)
9. [Cost Analysis](#cost-analysis)
10. [Success Criteria](#success-criteria)
