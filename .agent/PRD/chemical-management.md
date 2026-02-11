# TurfSheet PRD: Chemical Application Management

> Extracted from PRD.md lines 488-542. Source of truth: [PRD.md](../../PRD.md)

### 8. Chemical Application Management (Future - Phase 5)

**Purpose:** Comprehensive tracking for fertilizers, pesticides, and turf chemicals for regulatory compliance and agronomic planning.

#### Features
- Product inventory with EPA registration numbers and SDS links
- Application scheduling with weather-aware recommendations
- Detailed application records:
  - Product, rate, area, applicator
  - Weather conditions (wind, temp, humidity)
  - Equipment used
  - Re-entry interval (REI) tracking
- Pre-harvest interval tracking (if applicable)
- Spray log exports for state reporting requirements
- Applicator certification tracking with expiration alerts
- Historical application reports by zone/product/date range

#### Data Models
```typescript
ChemicalProduct {
  id: UUID
  organization_id: UUID
  name: string
  type: "FERTILIZER" | "HERBICIDE" | "FUNGICIDE" | "INSECTICIDE" | "PGR" | "OTHER"
  epa_registration: string
  active_ingredient: string
  rei_hours: number // Re-entry interval
  sds_url: string // Safety Data Sheet
  default_rate: number
  rate_unit: string // "oz/1000 sq ft", "lbs/acre"
  quantity_on_hand: number
  quantity_unit: string // "gallons", "lbs"
}

ApplicationRecord {
  id: UUID
  organization_id: UUID
  product_id: UUID
  zone_id: UUID
  applied_by: UUID // Certified applicator
  scheduled_date: Date
  applied_at: timestamp
  rate_applied: number
  area_treated_sqft: number
  total_product_used: number
  wind_speed_mph: number
  wind_direction: string
  temperature_f: number
  humidity_percent: number
  soil_moisture: "DRY" | "MOIST" | "WET"
  rei_expires_at: timestamp
  notes: text
  status: "SCHEDULED" | "COMPLETED" | "SKIPPED" | "CANCELLED"
}
```
