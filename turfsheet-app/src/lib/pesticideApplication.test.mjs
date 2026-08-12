/**
 * Pure contract tests for the event/product-line helpers.
 * Run: node src/lib/pesticideApplication.test.mjs
 *
 * Implementations are duplicated below (no TS test runner in this project) —
 * same convention as pesticideMix.test.mjs and courseGeometry.*.test.mjs.
 */

import assert from 'node:assert/strict';

function trimOrNull(value) {
  const trimmed = String(value ?? '').trim();
  return trimmed === '' ? null : trimmed;
}

function intOrNull(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed === '') return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toProductRow(line, lineNumber, applicationId) {
  const row = {
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

function productSummary(products) {
  if (!products || products.length === 0) return '—';
  const [first, ...rest] = products;
  const name = String(first?.product_name ?? '').trim() || 'Unnamed product';
  return rest.length === 0 ? name : `${name} +${rest.length} more`;
}

function resolveMethod(event, product) {
  const override = String(product?.method ?? '').trim();
  if (override !== '') return override;
  const eventMethod = String(event?.method ?? '').trim();
  return eventMethod === '' ? undefined : eventMethod;
}

function maxReiHours(products) {
  const hours = (products ?? [])
    .map((p) => p?.rei_hours)
    .filter((h) => typeof h === 'number' && Number.isFinite(h));
  return hours.length === 0 ? undefined : Math.max(...hours);
}

function flattenEventsToLogLines(events) {
  const lines = [];
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

function reconcileMethods(lines, currentEventMethod = '') {
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

// ---------------------------------------------------------------- toProductRow

const row = toProductRow(
  {
    key: 'k1',
    product_name: '  Glyphosate ',
    epa_registration_number: '',
    active_ingredient: 'Glyphosate 41%',
    manufacturer: '',
    epa_lot_number: '',
    application_rate: ' 1.5 ',
    rate_unit: 'gal/acre',
    total_amount_used: '',
    amount_per_tank: '',
    rei_hours: '12',
    target_pest: 'Vegetation / aquatic edge weeds',
    method: '',
  },
  2,
  'app-1'
);
assert.equal(row.product_name, 'Glyphosate', 'product_name is trimmed');
assert.equal(row.application_rate, '1.5', 'application_rate is trimmed');
assert.equal(row.rei_hours, 12, 'rei_hours parses to an integer');
assert.equal(row.epa_registration_number, null, 'blank text becomes NULL, not ""');
assert.equal(row.method, null, 'blank method inherits the event (stored NULL)');
assert.equal(row.line_number, 2);
assert.equal(row.application_id, 'app-1');

assert.equal(
  'application_id' in toProductRow({ product_name: 'X', application_rate: '1' }, 1),
  false,
  'application_id omitted when not yet known'
);
assert.equal(
  toProductRow({ product_name: 'X', application_rate: '1', rei_hours: 'n/a' }, 1).rei_hours,
  null,
  'unparseable rei_hours becomes NULL rather than NaN'
);

// -------------------------------------------------------------- productSummary

assert.equal(productSummary([]), '—');
assert.equal(productSummary([{ product_name: 'Heritage' }]), 'Heritage');
assert.equal(
  productSummary([
    { product_name: 'Heritage' },
    { product_name: 'Rely III' },
    { product_name: 'Multi-K GG' },
    { product_name: 'Rapture' },
    { product_name: '46-0-0' },
  ]),
  'Heritage +4 more'
);

// --------------------------------------------------------------- resolveMethod

assert.equal(resolveMethod({ method: 'spray' }, { method: 'granular' }), 'granular', 'override wins');
assert.equal(resolveMethod({ method: 'spray' }, { method: '' }), 'spray', 'blank inherits');
assert.equal(resolveMethod({ method: 'spray' }, undefined), 'spray', 'no product inherits');
assert.equal(resolveMethod({ method: '' }, { method: '' }), undefined, 'neither set');

// ---------------------------------------------------------------- maxReiHours

assert.equal(
  maxReiHours([{ rei_hours: 12 }, { rei_hours: 48 }, { rei_hours: 4 }]),
  48,
  'REI for the site is the longest in the mix'
);
assert.equal(maxReiHours([{ rei_hours: undefined }, { rei_hours: 0 }]), 0, 'zero is a real REI');
assert.equal(maxReiHours([]), undefined);
assert.equal(maxReiHours([{ rei_hours: undefined }]), undefined);

// ------------------------------------------------------- flattenEventsToLogLines

const mix = {
  id: 'e1',
  area_applied: 'Creeks + Pond 18',
  products: [
    { id: 'p2', line_number: 2, product_name: '2,4-D Amine' },
    { id: 'p1', line_number: 1, product_name: 'Glyphosate' },
  ],
};
const childless = { id: 'e2', area_applied: 'Greens', products: [] };

const flat = flattenEventsToLogLines([mix, childless]);
assert.equal(flat.length, 3, 'one row per product line, plus one for the childless event');
assert.deepEqual(
  flat.slice(0, 2).map((l) => l.product.product_name),
  ['Glyphosate', '2,4-D Amine'],
  'lines are ordered by line_number, not array order'
);
assert.equal(flat[2].event.id, 'e2');
assert.equal(flat[2].product, undefined, 'a childless event still emits a row');
assert.deepEqual(flattenEventsToLogLines([]), []);

// ------------------------------------------------------------ reconcileMethods

const agree = reconcileMethods(
  [
    { key: 'a', method: 'spray' },
    { key: 'b', method: 'spray' },
  ],
  ''
);
assert.equal(agree.eventMethod, 'spray', 'agreeing lines lift their method to the event');
assert.deepEqual(agree.lines.map((l) => l.method), ['', ''], 'and clear their overrides');

const disagree = reconcileMethods(
  [
    { key: 'a', method: 'spray' },
    { key: 'b', method: 'granular' },
  ],
  'spray'
);
assert.equal(disagree.eventMethod, 'spray');
assert.deepEqual(
  disagree.lines.map((l) => l.method),
  ['', 'granular'],
  'only the line that differs from the event keeps an override'
);

const noneSet = reconcileMethods([{ key: 'a', method: '' }], 'spot_treatment');
assert.equal(noneSet.eventMethod, 'spot_treatment', 'existing event method survives blank lines');

const disagreeNoEvent = reconcileMethods(
  [
    { key: 'a', method: 'granular' },
    { key: 'b', method: 'spray' },
  ],
  ''
);
assert.equal(disagreeNoEvent.eventMethod, 'granular', 'first distinct method seeds an empty event');
assert.deepEqual(disagreeNoEvent.lines.map((l) => l.method), ['', 'spray']);

// ---------------------------------------------------------------------------
// IDAPA 02.03.03.101 compliance helpers
// Duplicated from pesticideApplication.ts / pesticideLogExport.ts per the
// convention noted at the top of this file.
// ---------------------------------------------------------------------------

function isWithinRetention(applicationDate, now = new Date()) {
  if (!applicationDate) return true;
  const applied = new Date(`${applicationDate}T00:00:00`);
  if (Number.isNaN(applied.getTime())) return true;
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - 2);
  return applied > cutoff;
}

const NOW = new Date('2026-08-12T12:00:00');

assert.equal(isWithinRetention('2026-08-01', NOW), true, 'recent record is protected');
assert.equal(isWithinRetention('2025-01-15', NOW), true, 'record 19 months old is protected');
assert.equal(
  isWithinRetention('2024-08-13', NOW),
  true,
  'one day inside the 2-year boundary is protected'
);
assert.equal(
  isWithinRetention('2024-08-11', NOW),
  false,
  'past the 2-year window, deletion is permitted'
);
assert.equal(isWithinRetention('2020-03-01', NOW), false, 'clearly expired record is deletable');
// Fail safe: an unparseable or missing date must not open a deletion path.
assert.equal(isWithinRetention(undefined, NOW), true, 'undated record is treated as protected');
assert.equal(isWithinRetention('not-a-date', NOW), true, 'garbage date is treated as protected');

function formatWpsContact(event) {
  const { wps_contact_name, wps_contact_date, wps_contact_time } = event;
  if (wps_contact_name || wps_contact_date || wps_contact_time) {
    const when = [wps_contact_date, wps_contact_time].filter(Boolean).join(' ');
    return [wps_contact_name, when].filter(Boolean).join(' — ');
  }
  return event.worker_protection_exchange ? '✓ (no contact recorded)' : '✗';
}

assert.equal(
  formatWpsContact({
    worker_protection_exchange: true,
    wps_contact_name: 'Darryl',
    wps_contact_date: '2026-08-12',
    wps_contact_time: '06:30',
  }),
  'Darryl — 2026-08-12 06:30',
  '101.01(o) prints contact name plus date and time'
);
// Records predating the new columns must not read as "no exchange occurred".
assert.equal(
  formatWpsContact({ worker_protection_exchange: true }),
  '✓ (no contact recorded)',
  'legacy row keeps its affirmative boolean and is marked incomplete'
);
assert.equal(
  formatWpsContact({ worker_protection_exchange: false }),
  '✗',
  'no exchange still prints as absent'
);
assert.equal(
  formatWpsContact({ worker_protection_exchange: false, wps_contact_name: 'Darryl' }),
  'Darryl',
  'partial contact data still prints what was recorded'
);

function formatCourseLocation(course) {
  if (!course) return '';
  const street = [course.street_address, course.city, course.state, course.postal_code]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');
  if (street) return street;
  if (course.legal_description?.trim()) return course.legal_description.trim();
  if (course.latitude != null && course.longitude != null) {
    return `${course.latitude}, ${course.longitude}`;
  }
  return '';
}

assert.equal(
  formatCourseLocation({ street_address: '1 Fairway Dr', city: 'Eagle', state: 'ID', postal_code: '83616' }),
  '1 Fairway Dr, Eagle, ID, 83616',
  '101.01(c) street address form'
);
assert.equal(
  formatCourseLocation({ legal_description: 'T4N R1E Sec 12' }),
  'T4N R1E Sec 12',
  'falls back to the general legal description'
);
assert.equal(
  formatCourseLocation({ latitude: 43.6951, longitude: -116.3539 }),
  '43.6951, -116.3539',
  'falls back to latitude/longitude'
);
// Must be empty, not a stray comma — the header omits the line entirely when unset.
assert.equal(formatCourseLocation({}), '', 'unset location yields no header line');
assert.equal(formatCourseLocation(null), '', 'null course yields no header line');

console.log('pesticideApplication tests passed');
