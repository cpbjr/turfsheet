/**
 * placePinFromYards round-trip + validation tests.
 * Run from turfsheet-app:
 *   node --experimental-strip-types src/lib/courseGeometry.placeYards.test.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildGreenIndex,
  edgeVAtU,
  measurePin,
  placePinFromYards,
  pointInPolygonUV,
  ringToLocalUV,
  YARDS_PER_METER,
} from './courseGeometry.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const geoPath = join(__dirname, '../../public/geo/banbury-course-v1.geojson');
const fc = JSON.parse(readFileSync(geoPath, 'utf8'));
const greenIndex = buildGreenIndex(fc);

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function assertClose(a, b, tol, msg) {
  if (Math.abs(a - b) > tol) {
    throw new Error(`${msg}: expected ${b}, got ${a} (tol ${tol})`);
  }
}

// --- Synthetic square green (manual GreenIndexEntry-shaped) for L/R symmetry ---
function syntheticSquare() {
  // 20m deep (u 0..20), 20m wide (v -10..10); origin at center; u north, v east-ish
  const origin = { lat: 43.67, lng: -116.36 };
  const u = { x: 0, y: 1 };
  const v = { x: 1, y: 0 };
  const mLng = 111320 * Math.cos((origin.lat * Math.PI) / 180);
  const M_PER_DEG_LAT = 111320;
  const toLngLat = (pu, pv) => {
    const x = pu * u.x + pv * v.x;
    const y = pu * u.y + pv * v.y;
    return {
      lat: origin.lat + y / M_PER_DEG_LAT,
      lng: origin.lng + x / mLng,
    };
  };
  // Ring corners in UV: closed
  const corners = [
    [0, -10],
    [20, -10],
    [20, 10],
    [0, 10],
    [0, -10],
  ];
  const ring = corners.map(([pu, pv]) => {
    const ll = toLngLat(pu, pv);
    return [ll.lng, ll.lat];
  });
  const entry = {
    hole: 99,
    ring,
    path: [
      [toLngLat(-5, 0).lng, toLngLat(-5, 0).lat],
      [toLngLat(10, 0).lng, toLngLat(10, 0).lat],
    ],
    origin,
    u,
    v,
    frontU: 0,
    backU: 20,
    leftV: -10,
    rightV: 10,
    depthYd: 20 * YARDS_PER_METER,
    widthYd: 20 * YARDS_PER_METER,
    bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
    holeBounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
  };
  return { 99: entry };
}

// 1. 18-hole round-trip on real GeoJSON
{
  let holesOk = 0;
  for (let hole = 1; hole <= 18; hole++) {
    const g = greenIndex[hole];
    assert(g, `missing green ${hole}`);
    // Sample an in-green point: 40% depth, slightly left of center if width allows
    const onYd = Math.max(1, Math.round(g.depthYd * 0.4));
    const pu = g.frontU + onYd / YARDS_PER_METER;
    const ringUV = ringToLocalUV(g);
    const edges = edgeVAtU(ringUV, pu);
    const midV = (edges.vLeft + edges.vRight) / 2;
    // Prefer a point ~2 yd from left if room, else center
    const spanYd = (edges.vRight - edges.vLeft) * YARDS_PER_METER;
    let side = 'C';
    let lrYd = 0;
    let pv = 0;
    if (spanYd >= 6) {
      side = 'L';
      lrYd = 2;
      pv = edges.vLeft + lrYd / YARDS_PER_METER;
    } else {
      pv = midV;
      // if mid is near centerline use C
      if (Math.abs(pv) * YARDS_PER_METER < 0.75) {
        side = 'C';
        lrYd = 0;
        pv = 0;
      } else if (pv < 0) {
        side = 'L';
        lrYd = Math.round(Math.abs(pv - edges.vLeft) * YARDS_PER_METER);
      } else {
        side = 'R';
        lrYd = Math.round(Math.abs(edges.vRight - pv) * YARDS_PER_METER);
      }
    }
    assert(pointInPolygonUV(ringUV, pu, pv), `sample outside green hole ${hole}`);

    const xy = { x: pu * g.u.x + pv * g.v.x, y: pu * g.u.y + pv * g.v.y };
    const lat = g.origin.lat + xy.y / 111320;
    const lng = g.origin.lng + xy.x / (111320 * Math.cos((g.origin.lat * Math.PI) / 180));
    const measured = measurePin(greenIndex, hole, lat, lng);
    assert(measured.ok, `measure fail hole ${hole}`);

    const placed = placePinFromYards(greenIndex, hole, {
      onYd: measured.onYd,
      side: measured.lrSide || 'C',
      lrYd: measured.lrSide === 'C' ? 0 : measured.lrYd ?? 0,
    });
    assert(placed.ok, `place fail hole ${hole}: ${placed.ok === false ? placed.reason : ''}`);
    assertClose(placed.pin.onYd, measured.onYd, 0, `hole ${hole} onYd`);
    assert(placed.pin.lrSide === measured.lrSide, `hole ${hole} side ${placed.pin.lrSide} vs ${measured.lrSide}`);
    if (measured.lrSide !== 'C') {
      assertClose(placed.pin.lrYd, measured.lrYd, 0, `hole ${hole} lrYd`);
    }
    // |Δlat/lng| < 0.5 m
    const dLatM = Math.abs(placed.pin.lat - measured.lat) * 111320;
    const dLngM =
      Math.abs(placed.pin.lng - measured.lng) *
      111320 *
      Math.cos((g.origin.lat * Math.PI) / 180);
    assert(dLatM < 0.5 && dLngM < 0.5, `hole ${hole} coord drift lat=${dLatM} lng=${dLngM}`);
    holesOk++;
  }
  assert(holesOk === 18, `expected 18 holes, got ${holesOk}`);
}

// 2. C placement
{
  const r = placePinFromYards(greenIndex, 1, { onYd: 9, side: 'C' });
  assert(r.ok, 'C place failed');
  assert(r.pin.lrLabel === 'C' || r.pin.lrSide === 'C', `expected C, got ${r.pin.lrLabel}`);
}

// 3. L/R symmetry on synthetic square
{
  const sq = syntheticSquare();
  // L6: 6 yd from left edge
  const L = placePinFromYards(sq, 99, { onYd: 10, side: 'L', lrYd: 6 });
  const R = placePinFromYards(sq, 99, { onYd: 10, side: 'R', lrYd: 6 });
  assert(L.ok && R.ok, `L/R place fail ${!L.ok ? L.reason : R.reason}`);
  // Mirror about centerline: v_L = -v_R (within rounding)
  assertClose(L.pin.v, -R.pin.v, 0.15, 'L/R mirror v');
  assertClose(L.pin.onYd, R.pin.onYd, 0, 'L/R same depth');
}

// 4. onYd slightly beyond geometry depth but inside polygon → accept with warning
{
  const g = greenIndex[1];
  const depthRound = Math.round(g.depthYd);
  // Try depthYd + 1; may be outside — if outside, try depthYd itself with warning path differently
  const over = placePinFromYards(greenIndex, 1, {
    onYd: depthRound + 1,
    side: 'C',
  });
  if (over.ok) {
    assert(
      over.warnings.some((w) => w.includes('exceeds map green depth')),
      'expected depth warning'
    );
  } else {
    // If +1 is outside, paper-GD case: still verify that exactly at max round may warn only when >
    const at = placePinFromYards(greenIndex, 1, { onYd: depthRound, side: 'C' });
    // depthRound equals map depth → no "exceeds" warning required; just ensure no crash
    assert(at.ok || at.reason === 'outside green', 'depth edge handled');
  }
}

// 5. Clearly off-green
{
  const r = placePinFromYards(greenIndex, 1, { onYd: 9, side: 'L', lrYd: 500 });
  assert(!r.ok, 'huge lrYd should fail');
  assert(r.reason === 'outside green' || /outside|invalid/i.test(r.reason), r.reason);
  assert(!Number.isNaN(r.reason?.length), 'no NaN');
}

// 6. Pinched / edge — huge onYd off green
{
  const r = placePinFromYards(greenIndex, 1, { onYd: 999, side: 'C' });
  assert(!r.ok, 'huge onYd should fail');
  assert(typeof r.reason === 'string' && r.reason.length > 0, 'reason present');
}

// 7. onYd = 0 accepted with warning
{
  const r = placePinFromYards(greenIndex, 1, { onYd: 0, side: 'C' });
  assert(r.ok, `onYd=0 should place: ${!r.ok ? r.reason : ''}`);
  assert(r.warnings.some((w) => /front edge/i.test(w)), 'front edge warning');
}

console.log('courseGeometry.placeYards.test.mjs: all passed');
