# TurfSheet PRD: Superintendent Dashboard

> Extracted from PRD.md lines 342-486. Source of truth: [PRD.md](../../PRD.md)

### 7. Superintendent Dashboard

**Purpose:** Command center for agronomic data tracking and weather intelligence.

#### A. Grass Clippings Tracking

Track daily clipping yield as a key turf health indicator.

**Features:**
- Daily clipping yield recording by zone (greens, fairways, etc.)
- Weight measurements (clippings emptied from mower basket and weighed)
- Height of cut (HOC) recording
- Trend visualization:
  - Moving averages (7-day, 14-day, 30-day)
  - Year-over-year comparison
  - Growth rate calculations
- Correlation views:
  - Clippings vs weather (temperature, rainfall)
  - Clippings vs fertilizer applications
  - Clippings vs irrigation
- Alerts for unusual yield changes:
  - Growth spurts (potential disease or fertilizer response)
  - Stress indicators (declining yields)
  - Seasonal anomalies

**Data Model:**
```typescript
ClippingRecord {
  id: UUID
  organization_id: UUID
  zone_id: UUID
  recorded_date: Date
  recorded_by: UUID
  weight_grams: number
  height_of_cut_mm: number
  notes: text // Color, density, stress signs
}
```

#### B. Weather Intelligence

**Purpose:** Beyond simple forecasts—pattern recognition and historical analog matching to support agronomic decisions.

**Core Features:**

1. **Current Conditions & Forecast**
   - 7-14 day forecast with hourly detail
   - Spray window identification (wind speed, temperature, humidity)
   - Temperature trends and extremes
   - Precipitation timing and totals

2. **Historical Comparison**
   - Current season vs 30-year averages
   - GDD (Growing Degree Day) accumulation
   - Precipitation totals comparison
   - Temperature range deviations

3. **Analog Year Matching**
   - Identify past years with similar weather patterns
   - Correlation scores (0.0 - 1.0)
   - "2025 is tracking like 2015" insights
   - Pull forward what happened next in analog years

4. **Pattern Alerts**
   - Notifications when conditions deviate from historical norms
   - Disease pressure predictions based on temperature/humidity
   - Pest emergence timing (GDD thresholds)
   - Frost/freeze warnings

5. **GDD Tracking**
   - Cumulative growing degree days
   - Pest/disease model thresholds
   - Crabgrass germination predictions
   - Poa annua seedhead emergence

6. **Microclimate Notes**
   - Log local observations different from weather station
   - Site-specific conditions
   - Historical microclimate patterns

**Example Insight:**
> "January 2025 is running 4.2°F above the 30-year average with 62% of normal precipitation. The closest historical match is January 2015 (correlation: 0.87). In 2015, early warmth led to premature green-up followed by frost damage in late February. Consider delaying spring fertilization."

**Practical Insights Delivered:**

| Pattern Detected | Actionable Insight |
|------------------|-------------------|
| Early warm spell (like 2015) | "2015 saw late Feb frost after similar warmth. Delay spring fert, monitor soil temps." |
| Below-normal precip + high GDD | "Conditions favor dollar spot. In 2018, outbreaks started week 3 of this pattern." |
| Wet spring (like 2017) | "2017 had extended Pythium pressure through June. Plan preventive apps." |
| GDD ahead of schedule | "Crabgrass germination expected 10 days early. Adjust pre-emergent timing." |

**Technical Implementation:**

**Data Sources:**
- NOAA Climate Data Online (free historical data)
- Open-Meteo API (free forecasts, no API key required)
- Visual Crossing (backup, affordable historical data)
- On-site observations (manual entries)

**Analog Year Matching Algorithm:**
1. Collect daily data: temp high/low, precipitation, GDD accumulation
2. Normalize to season progress (Jan 1 - today vs same window in historical years)
3. Calculate similarity scores: Pearson correlation on temp trends, precip patterns, GDD curves
4. Weight recent data: Last 30 days weighted 2x vs earlier season
5. Rank and surface: Show top 3 analog years with correlation scores
6. Pull forward insights: Display what happened next in analog years

**Data Models:**
```typescript
WeatherReading {
  id: UUID
  organization_id: UUID
  reading_date: Date
  source: "API" | "MANUAL" | "ON_SITE_STATION"
  temp_high_f: number
  temp_low_f: number
  temp_avg_f: number
  precipitation_in: number
  humidity_avg: number
  wind_avg_mph: number
  gdd_base50: number // Growing degree days (base 50°F)
  soil_temp_4in_f?: number
  notes: text
}

HistoricalWeatherBaseline {
  id: UUID
  location_id: string // Weather station ID
  year: number // Or 0 for 30-year average
  month: number
  day_of_month?: number // Null for monthly summary
  temp_avg_f: number
  precip_avg_in: number
  gdd_cumulative: number
  season_notes: text // "Late frost Feb 28", "Early green-up"
}
```

**Implementation Notes:**
- Pre-load 30 years of historical data during onboarding
- Daily cron job fetches current conditions and updates comparisons
- Allow superintendents to annotate historical years ("2019: worst Poa triv year")
- Start simple (temp + precip correlation), add complexity based on feedback
- Consider regional turf networks where superintendents share analog insights
