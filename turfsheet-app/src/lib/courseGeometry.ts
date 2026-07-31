/**
 * Course geometry for the Banbury map — green index, pin measurement and the
 * print-sheet green diagram.
 *
 * Ported verbatim in behaviour from the standalone map's app.js. Deliberately
 * free of DOM and of the `google` global so the maths stays testable.
 */

import type {
  AvoidEntry,
  AvoidState,
  CourseFeatureProps,
  GreenIndex,
  GreenIndexEntry,
  LatLngBoundsLiteral,
  LayerKey,
  Pin,
  PinMap,
  PlaceYardsResult,
  UnitVec,
  YardsInput,
} from '@/types/courseMap';

export const CENTER = { lat: 43.670886, lng: -116.361379 };
// Read defensively so the pure geometry helpers can also be exercised outside Vite.
const BASE_URL = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
export const GEO_URL = `${BASE_URL}geo/banbury-course-v1.geojson`;
/** Irrigation heads/valves export (points). SoR is course_features when populated. */
export const IRRIGATION_GEO_URL = `${BASE_URL}geo/banbury-irrigation-v1.geojson`;
export const YARDS_PER_METER = 1.0936133;
const M_PER_DEG_LAT = 111320;

export const AVOID_KINDS = [
  'recent cup/plug',
  'worn/thin',
  'disease/stress',
  'collar/fringe',
  'temp green',
  'irrigation nearby',
  'other',
] as const;

export interface LayerStyle {
  fill: string;
  stroke: string;
  fillOpacity: number;
}

export const COLORS: Record<string, LayerStyle> = {
  green: { fill: '#66bb6a', stroke: '#2e7d32', fillOpacity: 0.45 },
  fairway: { fill: '#9ccc65', stroke: '#558b2f', fillOpacity: 0.28 },
  bunker: { fill: '#ffe082', stroke: '#f9a825', fillOpacity: 0.4 },
  tee: { fill: '#a5d6a7', stroke: '#43a047', fillOpacity: 0.35 },
  water_hazard: { fill: '#4fc3f7', stroke: '#0288d1', fillOpacity: 0.35 },
  lateral_water_hazard: { fill: '#4dd0e1', stroke: '#00838f', fillOpacity: 0.35 },
  rough: { fill: '#aed581', stroke: '#689f38', fillOpacity: 0.18 },
  clubhouse: { fill: '#bcaaa4', stroke: '#6d4c41', fillOpacity: 0.5 },
  out_of_bounds: { fill: '#ef9a9a', stroke: '#c62828', fillOpacity: 0.15 },
  golf_course: { fill: '#c5e1a5', stroke: '#7cb342', fillOpacity: 0.08 },
  hole: { fill: '#ffffff', stroke: '#ffffff', fillOpacity: 0 },
  default: { fill: '#b0bec5', stroke: '#607d8b', fillOpacity: 0.2 },
};

export type ShowState = Record<LayerKey, boolean>;

export const DEFAULT_SHOW: ShowState = {
  green: true,
  fairway: true,
  bunker: true,
  tee: false,
  water: true,
  hole: true,
  irrigation: true,
  other: false,
};

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function featureHoleNumber(props: CourseFeatureProps): number | null {
  if (props.hole_number != null) return Number(props.hole_number);
  return null;
}

export function categoryOf(props: CourseFeatureProps): LayerKey {
  const g = props.golf || props.feature_type || '';
  if (g === 'water_hazard' || g === 'lateral_water_hazard') return 'water';
  if (['green', 'fairway', 'bunker', 'tee', 'hole'].includes(g)) return g as LayerKey;
  return 'other';
}

export function styleFor(props: CourseFeatureProps): LayerStyle {
  const g = props.golf || props.feature_type || 'default';
  return COLORS[g] || COLORS.default;
}

export function passesFilters(
  props: CourseFeatureProps,
  show: ShowState,
  holeFilter: string
): boolean {
  const cat = categoryOf(props);
  if (cat === 'water' && !show.water) return false;
  if (cat !== 'water' && show[cat] === false) return false;
  if (cat === 'other' && !show.other) return false;

  const hole = featureHoleNumber(props);
  if (holeFilter === 'all') return true;
  if (holeFilter === 'front') return hole == null || hole <= 9;
  if (holeFilter === 'back') return hole == null || hole >= 10;
  const n = Number(holeFilter);
  if (hole == null) {
    return ['fairway', 'green', 'bunker', 'water', 'tee', 'other'].includes(cat);
  }
  return hole === n;
}

/* ---------- projection helpers ---------- */

export function haversineM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function ringCentroid(ring: [number, number][]): { lat: number; lng: number } {
  let sx = 0;
  let sy = 0;
  const n = ring.length > 1 ? ring.length - 1 : ring.length;
  for (let i = 0; i < n; i++) {
    sx += ring[i][0];
    sy += ring[i][1];
  }
  return { lng: sx / n, lat: sy / n };
}

export function metersPerDegLng(lat: number): number {
  return M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

export function toLocalXY(
  lng: number,
  lat: number,
  origin: { lat: number; lng: number }
): { x: number; y: number } {
  const mLng = metersPerDegLng(origin.lat);
  return {
    x: (lng - origin.lng) * mLng,
    y: (lat - origin.lat) * M_PER_DEG_LAT,
  };
}

function normalize(vx: number, vy: number): UnitVec {
  const len = Math.hypot(vx, vy) || 1;
  return { x: vx / len, y: vy / len };
}

/* ---------- green index ---------- */

interface GeoFeature {
  properties: CourseFeatureProps;
  geometry: { type: string; coordinates: unknown } | null;
}

export interface CourseGeoJson {
  type: string;
  properties?: { version?: number | string; [k: string]: unknown };
  features: GeoFeature[];
}

function emptyBounds(): LatLngBoundsLiteral {
  return {
    minLat: Infinity,
    maxLat: -Infinity,
    minLng: Infinity,
    maxLng: -Infinity,
  };
}

function extendBounds(b: LatLngBoundsLiteral, lat: number, lng: number): void {
  b.minLat = Math.min(b.minLat, lat);
  b.maxLat = Math.max(b.maxLat, lat);
  b.minLng = Math.min(b.minLng, lng);
  b.maxLng = Math.max(b.maxLng, lng);
}

/** Walk GeoJSON coordinates (Point / LineString / Polygon / Multi*) into a bounds box. */
function extendBoundsFromGeometry(b: LatLngBoundsLiteral, geometry: CourseGeoJson['features'][number]['geometry']): void {
  if (!geometry) return;
  const walk = (coords: unknown): void => {
    if (!Array.isArray(coords) || coords.length === 0) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      extendBounds(b, coords[1] as number, coords[0] as number);
      return;
    }
    for (const c of coords) walk(c);
  };
  walk((geometry as { coordinates?: unknown }).coordinates);
}

/**
 * Pairs each hole centreline with its green, then builds a local frame per green:
 * u runs along the approach (front → back), v runs across it (left → right).
 * Also builds a tee-to-green holeBounds for map framing.
 */
export function buildGreenIndex(fc: CourseGeoJson): GreenIndex {
  const greens: {
    ring: [number, number][];
    c: { lat: number; lng: number };
    tagged: number | null;
  }[] = [];
  const paths: Record<number, [number, number][]> = {};
  /** Extra hole-tagged playable features (tee / fairway / bunker) for framing. */
  const extrasByHole: Record<number, CourseGeoJson['features'][number]['geometry'][]> = {};

  (fc.features || []).forEach((f) => {
    const p = f.properties || {};
    const t = p.golf || p.feature_type;
    if (t === 'green' && f.geometry && f.geometry.type === 'Polygon') {
      const ring = (f.geometry.coordinates as [number, number][][])[0];
      greens.push({
        ring,
        c: ringCentroid(ring),
        tagged: p.hole_number != null ? Number(p.hole_number) : null,
      });
    }
    if (t === 'hole' && f.geometry && f.geometry.type === 'LineString' && p.hole_number != null) {
      paths[Number(p.hole_number)] = f.geometry.coordinates as [number, number][];
    }
    if (
      p.hole_number != null &&
      f.geometry &&
      (t === 'tee' || t === 'fairway' || t === 'bunker' || t === 'lateral_water_hazard' || t === 'water_hazard')
    ) {
      const hn = Number(p.hole_number);
      if (!extrasByHole[hn]) extrasByHole[hn] = [];
      extrasByHole[hn].push(f.geometry);
    }
  });

  const used = new Set<number>();
  const index: GreenIndex = {};

  for (let hn = 1; hn <= 18; hn++) {
    const path = paths[hn];
    if (!path || path.length < 2) continue;
    const end = { lng: path[path.length - 1][0], lat: path[path.length - 1][1] };

    // Prefer an explicitly tagged green, else the one nearest the end of the centreline.
    let bestI = -1;
    let bestD = Infinity;
    greens.forEach((g, i) => {
      if (used.has(i)) return;
      if (g.tagged === hn) {
        bestI = i;
        bestD = -1;
        return;
      }
      if (bestD < 0) return;
      const d = haversineM(end, g.c);
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    });
    if (bestI < 0) continue;
    used.add(bestI);
    const g = greens[bestI];

    const a = path[path.length - 2];
    const b = path[path.length - 1];
    const origin = g.c;
    const axy = toLocalXY(a[0], a[1], origin);
    const bxy = toLocalXY(b[0], b[1], origin);
    let ux = bxy.x - axy.x;
    let uy = bxy.y - axy.y;
    if (Math.hypot(ux, uy) < 1e-3) {
      ux = 0;
      uy = 1;
    }
    const u = normalize(ux, uy);
    const v = normalize(u.y, -u.x);

    const us: number[] = [];
    const vs: number[] = [];
    const bounds = emptyBounds();
    g.ring.forEach(([lng, lat]) => {
      const pxy = toLocalXY(lng, lat, origin);
      us.push(pxy.x * u.x + pxy.y * u.y);
      vs.push(pxy.x * v.x + pxy.y * v.y);
      extendBounds(bounds, lat, lng);
    });

    // Tee → green view: centreline + green, plus any hole-tagged extras.
    const holeBounds = emptyBounds();
    g.ring.forEach(([lng, lat]) => extendBounds(holeBounds, lat, lng));
    path.forEach(([lng, lat]) => extendBounds(holeBounds, lat, lng));
    (extrasByHole[hn] || []).forEach((geom) => extendBoundsFromGeometry(holeBounds, geom));

    const frontU = Math.min(...us);
    const backU = Math.max(...us);
    const leftV = Math.min(...vs);
    const rightV = Math.max(...vs);
    const depthM = Math.max(0.5, backU - frontU);
    const widthM = Math.max(0.5, rightV - leftV);

    index[hn] = {
      hole: hn,
      ring: g.ring,
      path,
      origin,
      u,
      v,
      frontU,
      backU,
      leftV,
      rightV,
      depthYd: depthM * YARDS_PER_METER,
      widthYd: widthM * YARDS_PER_METER,
      bounds,
      holeBounds,
    };
  }

  return index;
}

/**
 * Distance (meters) from pin (pu,pv) to the green polygon's left and right
 * edges along constant-u (true collar at this depth), not envelope width.
 * Left = smaller v; right = larger v in the green-local frame.
 */
export function lateralEdgeDistancesM(
  ringUV: { u: number; v: number }[],
  pu: number,
  pv: number
): { leftM: number; rightM: number } {
  const eps = 1e-9;
  let bestLeft: number | null = null; // max v among intersections with v <= pv
  let bestRight: number | null = null; // min v among intersections with v >= pv

  const n = ringUV.length;
  if (n < 2) {
    return { leftM: 0, rightM: 0 };
  }

  for (let i = 0; i < n - 1; i++) {
    const a = ringUV[i];
    const b = ringUV[i + 1];
    const du = b.u - a.u;
    const dv = b.v - a.v;
    // Intersect edge with horizontal line u = pu in UV plane.
    if (Math.abs(du) < eps) {
      // Vertical edge in UV: only if a.u ≈ pu, whole edge is a candidate span in v
      if (Math.abs(a.u - pu) > eps) continue;
      const vLo = Math.min(a.v, b.v);
      const vHi = Math.max(a.v, b.v);
      if (vLo <= pv + eps) {
        const vHit = Math.min(vHi, pv);
        if (bestLeft == null || vHit > bestLeft) bestLeft = vHit;
      }
      if (vHi >= pv - eps) {
        const vHit = Math.max(vLo, pv);
        if (bestRight == null || vHit < bestRight) bestRight = vHit;
      }
      continue;
    }
    const t = (pu - a.u) / du;
    if (t < -eps || t > 1 + eps) continue;
    const vHit = a.v + t * dv;
    if (vHit <= pv + eps) {
      if (bestLeft == null || vHit > bestLeft) bestLeft = vHit;
    }
    if (vHit >= pv - eps) {
      if (bestRight == null || vHit < bestRight) bestRight = vHit;
    }
  }

  // Fallback: if ray missed (pin outside / open ring), use nearest vertex on that side.
  if (bestLeft == null || bestRight == null) {
    for (const p of ringUV) {
      if (bestLeft == null && p.v <= pv) bestLeft = p.v;
      else if (p.v <= pv && p.v > (bestLeft as number)) bestLeft = p.v;
      if (bestRight == null && p.v >= pv) bestRight = p.v;
      else if (p.v >= pv && p.v < (bestRight as number)) bestRight = p.v;
    }
  }

  const leftM = bestLeft == null ? 0 : Math.max(0, pv - bestLeft);
  const rightM = bestRight == null ? 0 : Math.max(0, bestRight - pv);
  return { leftM, rightM };
}

/** Measures a tapped point: yards on from front; L/R = yards to nearest side edge (C near center). */
export function measurePin(
  greenIndex: GreenIndex,
  hole: number,
  lat: number,
  lng: number
): Pin {
  const g = greenIndex[hole];
  if (!g) {
    return {
      hole,
      lat,
      lng,
      onYd: null,
      lrYd: null,
      depthYd: null,
      widthYd: null,
      lrLabel: '—',
      onLabel: '—',
      depthLabel: '—',
      ok: false,
    };
  }
  const pxy = toLocalXY(lng, lat, g.origin);
  const pu = pxy.x * g.u.x + pxy.y * g.u.y;
  const pv = pxy.x * g.v.x + pxy.y * g.v.y;
  const onM = pu - g.frontU;
  const onYd = Math.round(onM * YARDS_PER_METER);
  const depthYd = Math.round(g.depthYd);

  // C stays centerline-based (~0.75 yd of approach axis).
  const centerlineAbsYd = Math.abs(pv) * YARDS_PER_METER;
  const nearCenter = centerlineAbsYd < 0.75;

  const ringUV = ringToLocalUV(g);
  const { leftM, rightM } = lateralEdgeDistancesM(ringUV, pu, pv);
  const leftYd = Math.round(leftM * YARDS_PER_METER);
  const rightYd = Math.round(rightM * YARDS_PER_METER);

  let lrSide: 'L' | 'R' | 'C';
  let lrYd: number;
  if (nearCenter) {
    lrSide = 'C';
    lrYd = 0;
  } else if (leftM <= rightM) {
    lrSide = 'L';
    lrYd = leftYd;
  } else {
    lrSide = 'R';
    lrYd = rightYd;
  }
  const lrLabel = lrSide === 'C' ? 'C' : `${lrSide}${lrYd}`;

  return {
    hole,
    lat,
    lng,
    onYd,
    lrYd,
    lrSide,
    depthYd,
    widthYd: Math.round(g.widthYd),
    onLabel: String(onYd),
    lrLabel,
    depthLabel: String(depthYd),
    u: pu,
    v: pv,
    ok: true,
    setAt: new Date().toISOString(),
  };
}

export function formatPinStats(pin: Pin | null | undefined): string {
  if (!pin || !pin.ok) return 'No pin';
  return `On ${pin.onLabel} · ${pin.lrLabel} · depth ${pin.depthLabel} yd`;
}

export function holeOrder(start: number): number[] {
  const s = Number(start) || 1;
  const order: number[] = [];
  for (let i = 0; i < 18; i++) order.push(((s - 1 + i) % 18) + 1);
  return order;
}

/* ---------- storage normalisation ---------- */

export function normalizeAvoid(raw: unknown): AvoidState {
  const out: AvoidState = { course: [], holes: {} };
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as { course?: unknown; holes?: unknown };
  if (Array.isArray(r.course)) {
    out.course = (r.course as AvoidEntry[])
      .filter((x) => x && x.kind)
      .map((x) => ({ kind: String(x.kind), note: x.note ? String(x.note) : '' }));
  }
  const holes = r.holes && typeof r.holes === 'object' ? (r.holes as Record<string, unknown>) : {};
  Object.keys(holes).forEach((k) => {
    const arr = Array.isArray(holes[k]) ? (holes[k] as AvoidEntry[]) : [];
    out.holes[String(k)] = arr
      .filter((x) => x && x.kind)
      .map((x) => ({ kind: String(x.kind), note: x.note ? String(x.note) : '' }));
  });
  return out;
}

/** Strips a pin map down to the fields that get persisted. */
export function pinsForStorage(pins: PinMap): Record<string, Pin> {
  const out: Record<string, Pin> = {};
  Object.entries(pins || {}).forEach(([h, p]) => {
    if (!p) return;
    out[String(h)] = {
      hole: Number(p.hole) || Number(h),
      lat: p.lat,
      lng: p.lng,
      onYd: p.onYd,
      lrYd: p.lrYd,
      lrSide: p.lrSide,
      lrLabel: p.lrLabel,
      onLabel: p.onLabel,
      depthYd: p.depthYd,
      depthLabel: p.depthLabel,
      widthYd: p.widthYd,
      ok: p.ok !== false,
      setAt: p.setAt || null,
      // u/v are kept so the print diagram can plot without a green index.
      u: p.u,
      v: p.v,
    };
  });
  return out;
}

/** Rehydrates stored pins, re-measuring where coords + green index allow (repairs missing u/v). */
export function pinsFromStorage(
  pins: Record<string, Pin> | null | undefined,
  greenIndex: GreenIndex
): PinMap {
  const out: PinMap = {};
  if (!pins || typeof pins !== 'object') return out;
  Object.entries(pins).forEach(([h, p]) => {
    if (!p) return;
    const hole = Number(p.hole) || Number(h);
    let pin: Pin = { ...p, hole };
    if (pin.lat != null && pin.lng != null && greenIndex[hole]) {
      const m = measurePin(greenIndex, hole, pin.lat, pin.lng);
      pin = { ...m, setAt: p.setAt || m.setAt };
    }
    out[hole] = pin;
  });
  return out;
}

/* ---------- yards → pin (inverse placement) ---------- */

/** Green ring in the local u/v frame (exported for inverse placement + tests). */
export function ringToLocalUV(g: GreenIndexEntry): { u: number; v: number }[] {
  return g.ring.map(([lng, lat]) => {
    const pxy = toLocalXY(lng, lat, g.origin);
    return {
      u: pxy.x * g.u.x + pxy.y * g.u.y,
      v: pxy.x * g.v.x + pxy.y * g.v.y,
    };
  });
}

/** Ray-cast point-in-polygon in UV space (even-odd). */
export function pointInPolygonUV(
  ringUV: { u: number; v: number }[],
  pu: number,
  pv: number
): boolean {
  let inside = false;
  const n = ringUV.length;
  if (n < 3) return false;
  // Drop closing duplicate if present so we don't double-count the last edge.
  const last = ringUV[n - 1];
  const first = ringUV[0];
  const count =
    Math.abs(last.u - first.u) < 1e-12 && Math.abs(last.v - first.v) < 1e-12 ? n - 1 : n;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const ui = ringUV[i].u;
    const vi = ringUV[i].v;
    const uj = ringUV[j].u;
    const vj = ringUV[j].v;
    if (Math.abs(vj - vi) < 1e-15) continue; // horizontal edge
    if (vi > pv !== vj > pv) {
      const xIntersect = ((uj - ui) * (pv - vi)) / (vj - vi) + ui;
      if (pu < xIntersect) inside = !inside;
    }
  }
  return inside;
}

/**
 * Left/right edge v at a constant u (depth). Uses the same edge walk as
 * lateralEdgeDistancesM; falls back to nearest-u vertices when no crossing.
 */
export function edgeVAtU(
  ringUV: { u: number; v: number }[],
  pu: number
): { vLeft: number; vRight: number; approx: boolean } {
  const eps = 1e-9;
  const hits: number[] = [];
  const n = ringUV.length;
  for (let i = 0; i < n - 1; i++) {
    const a = ringUV[i];
    const b = ringUV[i + 1];
    const du = b.u - a.u;
    const dv = b.v - a.v;
    if (Math.abs(du) < eps) {
      if (Math.abs(a.u - pu) > eps) continue;
      hits.push(a.v, b.v);
      continue;
    }
    const t = (pu - a.u) / du;
    if (t < -eps || t > 1 + eps) continue;
    hits.push(a.v + t * dv);
  }
  if (hits.length >= 2) {
    return { vLeft: Math.min(...hits), vRight: Math.max(...hits), approx: false };
  }
  if (hits.length === 1) {
    // Pinched tip: single crossing (or collinear) — zero width at this u.
    return { vLeft: hits[0], vRight: hits[0], approx: true };
  }

  // Nearest-u vertex fallback (pinched front/back / no exact crossing).
  let bestDist = Infinity;
  const near: number[] = [];
  for (const p of ringUV) {
    const d = Math.abs(p.u - pu);
    if (d < bestDist - 1e-6) {
      bestDist = d;
      near.length = 0;
      near.push(p.v);
    } else if (Math.abs(d - bestDist) <= 1e-6) {
      near.push(p.v);
    }
  }
  if (!near.length) {
    return { vLeft: 0, vRight: 0, approx: true };
  }
  return { vLeft: Math.min(...near), vRight: Math.max(...near), approx: true };
}

/**
 * Inverse of measurePin: place a pin from paper yards (Depth + L|C|R + lrYd).
 * Truth gate = point-in-polygon + measurePin round-trip (never silent off-green).
 */
export function placePinFromYards(
  greenIndex: GreenIndex,
  hole: number,
  input: YardsInput
): PlaceYardsResult {
  const g = greenIndex[hole];
  if (!g) {
    return { ok: false, reason: `No green geometry for hole ${hole}` };
  }

  const onYd = Number(input.onYd);
  if (!Number.isFinite(onYd) || onYd < 0 || !Number.isInteger(onYd)) {
    return { ok: false, reason: 'Depth (onYd) must be a whole number ≥ 0' };
  }

  const side = input.side;
  if (side !== 'L' && side !== 'C' && side !== 'R') {
    return { ok: false, reason: 'Side must be L, C, or R' };
  }

  let lrYd = 0;
  if (side === 'L' || side === 'R') {
    lrYd = Number(input.lrYd);
    if (!Number.isFinite(lrYd) || lrYd < 0 || !Number.isInteger(lrYd)) {
      return { ok: false, reason: 'Yards (lrYd) must be a whole number ≥ 0 for L/R' };
    }
  }

  const warnings: string[] = [];
  if (onYd === 0) {
    warnings.push('Depth 0 — front edge of green');
  }
  const depthYdRound = Math.round(g.depthYd);
  if (onYd > depthYdRound) {
    warnings.push(
      `Depth exceeds map green depth (${depthYdRound} yd) — placed from front edge, verify`
    );
  }

  let pu = g.frontU + onYd / YARDS_PER_METER;
  const ringUV = ringToLocalUV(g);
  let edges = edgeVAtU(ringUV, pu);
  let approx = edges.approx;

  let pv: number;
  if (side === 'C') {
    // Prefer approach centerline; if that is outside (pinched/offset tip),
    // sit at mid-width so onYd=0 / front-edge entry still places.
    pv = 0;
    if (!pointInPolygonUV(ringUV, pu, pv)) {
      pv = (edges.vLeft + edges.vRight) / 2;
      if (!pointInPolygonUV(ringUV, pu, pv)) {
        // Nudge a few steps toward the back along the mid-width line.
        let found = false;
        for (let step = 1; step <= 8; step++) {
          const pu2 = pu + (step * 0.25) / YARDS_PER_METER;
          const e2 = edgeVAtU(ringUV, pu2);
          const pv2 = (e2.vLeft + e2.vRight) / 2;
          if (pointInPolygonUV(ringUV, pu2, pv2)) {
            pu = pu2;
            pv = pv2;
            edges = e2;
            approx = true;
            found = true;
            warnings.push('Front-edge centerline outside map outline — nudged onto green');
            break;
          }
        }
        if (!found) {
          return { ok: false, reason: 'outside green' };
        }
      } else {
        approx = true;
        warnings.push('Centerline outside at this depth — placed mid-green');
      }
    }
  } else if (side === 'L') {
    pv = edges.vLeft + lrYd / YARDS_PER_METER;
  } else {
    pv = edges.vRight - lrYd / YARDS_PER_METER;
  }

  if (edges.approx && !warnings.some((w) => /pinched|nudged|mid-green/i.test(w))) {
    warnings.push('Approximate placement (pinched green at this depth)');
    approx = true;
  }

  // Invert local frame → lat/lng
  const xy = {
    x: pu * g.u.x + pv * g.v.x,
    y: pu * g.u.y + pv * g.v.y,
  };
  const lat = g.origin.lat + xy.y / M_PER_DEG_LAT;
  const lng = g.origin.lng + xy.x / metersPerDegLng(g.origin.lat);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, reason: 'Placement produced invalid coordinates' };
  }

  if (!pointInPolygonUV(ringUV, pu, pv)) {
    return { ok: false, reason: 'outside green' };
  }

  const pin = measurePin(greenIndex, hole, lat, lng);
  if (!pin.ok) {
    return { ok: false, reason: 'measurePin failed for placed point' };
  }

  return { ok: true, pin, approx: approx || undefined, warnings };
}

/* ---------- print-sheet green diagram ---------- */

/**
 * Builds the little top-down green diagram for one hole on the handout,
 * front edge at the bottom. Returns SVG markup.
 */
export function svgForHole(
  greenIndex: GreenIndex,
  hole: number,
  pin: Pin | null | undefined
): string {
  const g = greenIndex[hole];
  const W = 120;
  const H = 100;
  const pad = 8;
  if (!g) {
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#fafafa"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#999" font-size="10">No green</text>
    </svg>`;
  }
  const pts = ringToLocalUV(g);
  const minU = g.frontU;
  const maxU = g.backU;
  const minV = g.leftV;
  const maxV = g.rightV;
  const spanU = Math.max(0.5, maxU - minU);
  const spanV = Math.max(0.5, maxV - minV);
  const availW = W - pad * 2;
  const availH = H - pad * 2;
  const scale = Math.min(availW / spanV, availH / spanU);
  const drawW = spanV * scale;
  const drawH = spanU * scale;
  const ox = (W - drawW) / 2;
  const oy = (H - drawH) / 2;

  const proj = (u: number, v: number): [number, number] => [
    ox + (v - minV) * scale,
    oy + (maxU - u) * scale,
  ];

  const poly = pts
    .map((p) => {
      const [x, y] = proj(p.u, p.v);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const [fx1, fy1] = proj(minU, (minV + maxV) / 2);

  let pinDot = '';
  const dot = (px: number, py: number) =>
    `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(
      1
    )}" r="4.2" fill="#c62828" stroke="#111" stroke-width="0.8"/>`;
  if (pin && pin.ok && pin.u != null && pin.v != null) {
    const [px, py] = proj(pin.u, pin.v);
    pinDot = dot(px, py);
  } else if (pin && pin.ok && pin.lat != null) {
    const m = measurePin(greenIndex, hole, pin.lat, pin.lng);
    if (m.ok && m.u != null && m.v != null) {
      const [px, py] = proj(m.u, m.v);
      pinDot = dot(px, py);
    }
  }

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="100%" height="100%" fill="#eef5ea"/>
    <polygon points="${poly}" fill="#81c784" fill-opacity="0.85" stroke="#2e7d32" stroke-width="1.2"/>
    <line x1="${ox.toFixed(1)}" y1="${(oy + drawH).toFixed(1)}" x2="${(ox + drawW).toFixed(
    1
  )}" y2="${(oy + drawH).toFixed(1)}" stroke="#666" stroke-width="0.6" stroke-dasharray="2 2"/>
    <text x="${fx1.toFixed(1)}" y="${Math.min(H - 2, fy1 + 10).toFixed(
    1
  )}" text-anchor="middle" font-size="7" fill="#555">front</text>
    ${pinDot}
  </svg>`;
}

export function collectAvoidLines(avoid: AvoidState): { scope: string; text: string }[] {
  const lines: { scope: string; text: string }[] = [];
  (avoid.course || []).forEach((a) => {
    lines.push({ scope: 'Course', text: a.note ? `${a.kind} — ${a.note}` : a.kind });
  });
  for (let h = 1; h <= 18; h++) {
    (avoid.holes[String(h)] || []).forEach((a) => {
      lines.push({ scope: `Hole ${h}`, text: a.note ? `${a.kind} — ${a.note}` : a.kind });
    });
  }
  return lines;
}

export function formatPlayDate(iso: string): string {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
