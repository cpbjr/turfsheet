import type { PesticideApplication } from '../types';

/**
 * Ops / context fields shared across every product row in a tank mix.
 * Product-specific chemistry fields are intentionally excluded.
 */
export const SHARED_MIX_FIELDS = [
  'operator_id',
  'applicator_license',
  'weather_conditions',
  'temperature',
  'wind_speed',
  'wind_direction',
  'humidity',
  'equipment_used',
  'application_time',
  'worker_protection_exchange',
  'worker_protection_requirements',
  'recommended_by',
  'method',
  'area_applied',
  'application_date',
  'area_size',
] as const;

export type SharedMixField = (typeof SHARED_MIX_FIELDS)[number];

export type SharedMixPayload = Partial<
  Pick<PesticideApplication, SharedMixField>
>;

function norm(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Primary mix identity: same spray date + treated area label. */
export function isSameTankMix(
  a: Pick<PesticideApplication, 'application_date' | 'area_applied' | 'id'>,
  b: Pick<PesticideApplication, 'application_date' | 'area_applied' | 'id'>
): boolean {
  if (!a || !b) return false;
  if (a.id != null && b.id != null && String(a.id) === String(b.id)) return false;
  const dateA = norm(a.application_date);
  const dateB = norm(b.application_date);
  const areaA = norm(a.area_applied);
  const areaB = norm(b.area_applied);
  if (!dateA || !dateB || dateA !== dateB) return false;
  if (!areaA || !areaB || areaA !== areaB) return false;
  return true;
}

export function pickSharedMixFields(
  source: Record<string, unknown> | Partial<PesticideApplication>
): SharedMixPayload {
  const out: Record<string, unknown> = {};
  for (const key of SHARED_MIX_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const value = (source as Record<string, unknown>)[key];
      // Skip undefined so PATCH does not wipe unspecified keys
      if (value !== undefined) {
        out[key] = value;
      }
    }
  }
  return out as SharedMixPayload;
}

export function findMixSiblings(
  apps: PesticideApplication[],
  current: Pick<PesticideApplication, 'id' | 'application_date' | 'area_applied'>
): PesticideApplication[] {
  return apps.filter((app) => isSameTankMix(current, app));
}

export function findMixSiblingIds(
  apps: PesticideApplication[],
  current: Pick<PesticideApplication, 'id' | 'application_date' | 'area_applied'>
): string[] {
  return findMixSiblings(apps, current).map((app) => app.id);
}

/** One product line from the spray calculator, ready for multi-row insert. */
export interface MixProductPrefill {
  product_name: string;
  epa_registration_number?: string;
  active_ingredient?: string;
  application_rate: string;
  rate_unit?: string;
  total_amount_used?: string;
  amount_per_tank?: string;
  manufacturer?: string;
  rei_hours?: string;
  method?: string;
}

export interface CalculatorRecordPayload {
  /** Shared / first-product fields for form prefill */
  shared: Record<string, string>;
  /** All products in the tank (length >= 1) */
  mixProducts: MixProductPrefill[];
}
