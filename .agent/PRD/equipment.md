# TurfSheet PRD: Equipment Management

> Extracted from PRD.md lines 234-290. Source of truth: [PRD.md](../../PRD.md)

### 5. Equipment Management

**Purpose:** Track equipment location, usage, and maintenance with path toward Toro myTurf integration.

#### Core Features
- Equipment inventory (type, model, serial number, hour meter)
- Checkout/check-in logging (who has what, when)
- Usage logging tied to tasks (which mower was used for which area)
- Basic maintenance tracking:
  - Oil changes
  - Blade sharpening
  - Repairs with cost tracking
  - Parts replacement
- Service alerts based on hour meter thresholds
- Issue reporting with photos ("left reel making noise")
- Equipment status: Available | In Use | Maintenance | Out of Service

#### Future: Toro myTurf Integration
Toro's myTurf platform provides GPS tracking, fault codes, and telematics for connected equipment. Architecture designed to support future API integration:
- Real-time equipment location on course map
- Automatic hour meter updates
- Diagnostic alerts and fault codes
- Usage efficiency reporting
- Automated service scheduling

#### Data Model
```typescript
Equipment {
  id: UUID
  organization_id: UUID
  name: string // "Greens Mower #2"
  type: "MOWER" | "UTILITY" | "SPRAYER" | "AERATOR" | "OTHER"
  make: string // "Toro"
  model: string
  serial_number: string
  year: number
  hour_meter: number
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "OUT_OF_SERVICE"
  checked_out_to?: UUID
  checked_out_at?: timestamp
  next_service_hours: number
  toro_asset_id?: string // Future: myTurf integration
  photo_url?: string
  notes: text
}

EquipmentLog {
  id: UUID
  equipment_id: UUID
  user_id: UUID
  task_id?: UUID
  log_type: "CHECKOUT" | "CHECKIN" | "MAINTENANCE" | "ISSUE" | "FUEL"
  hour_meter_reading: number
  description: text
  photos: string[]
  created_at: timestamp
}
```
