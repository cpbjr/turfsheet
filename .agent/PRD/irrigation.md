# TurfSheet PRD: Irrigation Quick-Log

> Extracted from PRD.md lines 292-340. Source of truth: [PRD.md](../../PRD.md)

### 6. Irrigation Quick-Log

**Purpose:** Replace superintendent's paper log for daily hand watering, probing, and irrigation adjustments.

#### Features
- Morning probe readings by green:
  - Moisture level (numeric reading from probe device)
  - Firmness rating (numeric reading from measuring device)
  - Location notes ("front edge", "south slope")
- Hand watering log:
  - Which greens/areas watered
  - Duration in minutes
  - Time of day
  - Coverage notes
- Dry spot tracking:
  - Photo documentation
  - Location mapping
  - Historical dry spot areas
- Syringe cycle logging (quick cooling cycles on hot days):
  - Time of day
  - Duration
  - Greens treated
- System run logging:
  - Irrigation cycles executed
  - Duration per zone
  - Any issues or adjustments
- Historical view:
  - Watering patterns over time per green
  - Correlation with weather data
  - Identify problem areas ("Green 7 always needs extra on south slope")

#### Data Model
```typescript
IrrigationLog {
  id: UUID
  organization_id: UUID
  zone_id: UUID // Green or area
  recorded_by: UUID
  recorded_date: Date
  recorded_time: Time
  activity_type: "PROBE" | "HAND_WATER" | "SYRINGE" | "DRY_SPOT" | "SYSTEM_RUN"
  probe_reading?: number // Moisture meter reading
  duration_minutes?: number
  coverage_notes?: string // "south slope", "front edge"
  firmness_rating?: number // 1-10
  photos: string[]
  notes: text
}
```
