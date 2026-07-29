/**
 * Pure contract tests for tank-mix sibling matching / shared field pick.
 * Run: node src/lib/pesticideMix.test.mjs
 */

import assert from 'node:assert/strict';

function norm(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isSameTankMix(a, b) {
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

const SHARED_MIX_FIELDS = [
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
];

function pickSharedMixFields(source) {
  const out = {};
  for (const key of SHARED_MIX_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      out[key] = source[key];
    }
  }
  return out;
}

function findMixSiblingIds(apps, current) {
  return apps.filter((app) => isSameTankMix(current, app)).map((app) => app.id);
}

assert.equal(
  isSameTankMix(
    { id: '1', application_date: '2026-07-29', area_applied: 'Creeks + Pond 18' },
    { id: '2', application_date: '2026-07-29', area_applied: ' creeks + pond 18 ' }
  ),
  true,
  'same date+area (normalized) are siblings'
);

assert.equal(
  isSameTankMix(
    { id: '1', application_date: '2026-07-29', area_applied: 'Creeks + Pond 18' },
    { id: '1', application_date: '2026-07-29', area_applied: 'Creeks + Pond 18' }
  ),
  false,
  'same id is not a sibling of itself'
);

assert.equal(
  isSameTankMix(
    { id: '1', application_date: '2026-07-29', area_applied: 'Greens' },
    { id: '2', application_date: '2026-07-29', area_applied: 'Tees' }
  ),
  false,
  'different areas are not siblings'
);

assert.equal(
  isSameTankMix(
    { id: '1', application_date: '2026-07-29', area_applied: 'Pond' },
    { id: '2', application_date: '2026-07-28', area_applied: 'Pond' }
  ),
  false,
  'different dates are not siblings'
);

assert.equal(
  isSameTankMix(
    { id: '1', application_date: '2026-07-29', area_applied: '' },
    { id: '2', application_date: '2026-07-29', area_applied: '' }
  ),
  false,
  'empty area does not cascade broadly'
);

const picked = pickSharedMixFields({
  operator_id: 11,
  product_name: 'Glyphosate',
  weather_conditions: 'Clear',
  application_rate: '1.5 gal',
  total_amount_used: '1.5 gal',
  equipment_used: 'Workman 4200',
});
assert.deepEqual(picked, {
  operator_id: 11,
  weather_conditions: 'Clear',
  equipment_used: 'Workman 4200',
});
assert.equal('product_name' in picked, false);
assert.equal('application_rate' in picked, false);

assert.deepEqual(
  findMixSiblingIds(
    [
      { id: 'a', application_date: '2026-07-29', area_applied: 'Pond' },
      { id: 'b', application_date: '2026-07-29', area_applied: 'Pond' },
      { id: 'c', application_date: '2026-07-28', area_applied: 'Pond' },
      { id: 'd', application_date: '2026-07-29', area_applied: 'Tees' },
    ],
    { id: 'a', application_date: '2026-07-29', area_applied: 'Pond' }
  ),
  ['b']
);

console.log('pesticideMix tests passed');
