import type {
  ApplicationMethod,
  EventDraft,
  PesticideApplicationEvent,
  PesticideApplicationProduct,
  PesticideApplicationWithProducts,
  PesticideLogLine,
  ProductLineDraft,
} from '../types';

/** Trim; treat blank as SQL NULL so PATCH clears rather than storing ''. */
function trimOrNull(value: string | undefined): string | null {
  const trimmed = String(value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

function intOrNull(value: string | undefined): number | null {
  const trimmed = String(value ?? '').trim();
  if (trimmed === '') return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function blankProductLine(): ProductLineDraft {
  return {
    key: crypto.randomUUID(),
    product_name: '',
    epa_registration_number: '',
    active_ingredient: '',
    manufacturer: '',
    epa_lot_number: '',
    application_rate: '',
    rate_unit: 'oz/1000sqft',
    total_amount_used: '',
    amount_per_tank: '',
    rei_hours: '',
    target_pest: '',
    method: '',
  };
}

/** EventDraft -> turfsheet.pesticide_applications row. */
export function toEventRow(event: EventDraft): Record<string, unknown> {
  return {
    application_date: trimOrNull(event.application_date),
    application_time: trimOrNull(event.application_time),
    area_applied: trimOrNull(event.area_applied),
    area_size: trimOrNull(event.area_size),
    method: trimOrNull(event.method),
    operator_id: intOrNull(event.operator_id),
    applicator_license: trimOrNull(event.applicator_license),
    recommended_by: intOrNull(event.recommended_by),
    equipment_used: trimOrNull(event.equipment_used),
    temperature: trimOrNull(event.temperature),
    wind_speed: trimOrNull(event.wind_speed),
    wind_direction: trimOrNull(event.wind_direction),
    humidity: trimOrNull(event.humidity),
    weather_conditions: trimOrNull(event.weather_conditions),
    worker_protection_exchange: Boolean(event.worker_protection_exchange),
    worker_protection_requirements: trimOrNull(event.worker_protection_requirements),
    notes: trimOrNull(event.notes),
  };
}

/** ProductLineDraft -> turfsheet.pesticide_application_products row. */
export function toProductRow(
  line: ProductLineDraft,
  lineNumber: number,
  applicationId?: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    line_number: lineNumber,
    product_name: String(line.product_name ?? '').trim(),
    epa_registration_number: trimOrNull(line.epa_registration_number),
    active_ingredient: trimOrNull(line.active_ingredient),
    manufacturer: trimOrNull(line.manufacturer),
    epa_lot_number: trimOrNull(line.epa_lot_number),
    application_rate: String(line.application_rate ?? '').trim(),
    rate_unit: trimOrNull(line.rate_unit),
    total_amount_used: trimOrNull(line.total_amount_used),
    amount_per_tank: trimOrNull(line.amount_per_tank),
    rei_hours: intOrNull(line.rei_hours),
    target_pest: trimOrNull(line.target_pest),
    method: trimOrNull(line.method),
  };
  if (applicationId) row.application_id = applicationId;
  return row;
}

/** "Heritage" / "Heritage +4 more" — the log row's product cell. */
export function productSummary(products: Pick<PesticideApplicationProduct, 'product_name'>[]): string {
  if (!products || products.length === 0) return '—';
  const [first, ...rest] = products;
  const name = String(first?.product_name ?? '').trim() || 'Unnamed product';
  return rest.length === 0 ? name : `${name} +${rest.length} more`;
}

/** A product's own method wins; blank inherits the event's. */
export function resolveMethod(
  event: Pick<PesticideApplicationEvent, 'method'>,
  product?: Pick<PesticideApplicationProduct, 'method'>
): ApplicationMethod | undefined {
  const override = String(product?.method ?? '').trim();
  if (override !== '') return override;
  const eventMethod = String(event?.method ?? '').trim();
  return eventMethod === '' ? undefined : eventMethod;
}

/**
 * The site's restricted-entry interval is the LONGEST of the products applied —
 * the per-product REI the old single-row UI showed was wrong for any tank mix.
 */
export function maxReiHours(
  products: Pick<PesticideApplicationProduct, 'rei_hours'>[]
): number | undefined {
  const hours = (products ?? [])
    .map((p) => p?.rei_hours)
    .filter((h): h is number => typeof h === 'number' && Number.isFinite(h));
  return hours.length === 0 ? undefined : Math.max(...hours);
}

/**
 * One log row per product line, ordered by line_number. An event with zero
 * products still emits one row so a compliance record can never silently vanish.
 */
export function flattenEventsToLogLines(
  events: PesticideApplicationWithProducts[]
): PesticideLogLine[] {
  const lines: PesticideLogLine[] = [];
  for (const event of events ?? []) {
    const products = [...(event.products ?? [])].sort(
      (a, b) => (a.line_number ?? 0) - (b.line_number ?? 0)
    );
    if (products.length === 0) {
      lines.push({ event });
      continue;
    }
    for (const product of products) lines.push({ event, product });
  }
  return lines;
}

/**
 * Collapse per-line methods to the event when they agree, keep overrides when
 * they don't (a granular broadcast plus a tank spray in one visit is legitimate).
 */
export function reconcileMethods(
  lines: ProductLineDraft[],
  currentEventMethod = ''
): { eventMethod: string; lines: ProductLineDraft[] } {
  const distinct = [
    ...new Set((lines ?? []).map((l) => String(l.method ?? '').trim()).filter((m) => m !== '')),
  ];

  if (distinct.length <= 1) {
    const eventMethod = distinct[0] ?? String(currentEventMethod ?? '').trim();
    return {
      eventMethod,
      lines: (lines ?? []).map((l) => (l.method === '' ? l : { ...l, method: '' })),
    };
  }

  const eventMethod = String(currentEventMethod ?? '').trim() || distinct[0];
  return {
    eventMethod,
    lines: (lines ?? []).map((l) => {
      const method = String(l.method ?? '').trim();
      const next = method === eventMethod ? '' : method;
      return next === l.method ? l : { ...l, method: next };
    }),
  };
}
