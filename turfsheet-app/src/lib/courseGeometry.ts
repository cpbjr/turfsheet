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
  UnitVec,
} from '@/types/courseMap';

export const CENTER = { lat: 43.670886, lng: -116.361379 };
// Read defensively so the pure geometry helpers can also be exercised outside Vite.
const BASE_URL = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
export const GEO_URL = `${BASE_URL}geo/banbury-course-v1.geojson`;
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

function metersPerDegLng(lat: number): number {
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

/**
 * Pairs each hole centreline with its green, then builds a local frame per green:
 * u runs along the approach (front → back), v runs across it (left → right).
 */
export function buildGreenIndex(fc: CourseGeoJson): GreenIndex {
  const greens: {
    ring: [number, number][];
    c: { lat: number; lng: number };
    tagged: number | null;
  }[] = [];
  const paths: Record<number, [number, number][]> = {};

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
    const bounds: LatLngBoundsLiteral = {
      minLat: Infinity,
      maxLat: -Infinity,
      minLng: Infinity,
      maxLng: -Infinity,
    };
    g.ring.forEach(([lng, lat]) => {
      const pxy = toLocalXY(lng, lat, origin);
      us.push(pxy.x * u.x + pxy.y * u.y);
      vs.push(pxy.x * v.x + pxy.y * v.y);
      bounds.minLat = Math.min(bounds.minLat, lat);
      bounds.maxLat = Math.max(bounds.maxLat, lat);
      bounds.minLng = Math.min(bounds.minLng, lng);
      bounds.maxLng = Math.max(bounds.maxLng, lng);
    });
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
    };
  }

  return index;
}

/** Measures a tapped point against its green: yards on from front, yards left/right of centre. */
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
  const lrM = pv;
  const onYd = Math.round(onM * YARDS_PER_METER);
  const lrYd = Math.round(Math.abs(lrM) * YARDS_PER_METER);
  const depthYd = Math.round(g.depthYd);
  const lrSide: 'L' | 'R' | 'C' =
    Math.abs(lrM) * YARDS_PER_METER < 0.75 ? 'C' : lrM >= 0 ? 'R' : 'L';
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

/* ---------- print-sheet green diagram ---------- */

function ringToLocalUV(g: GreenIndexEntry): { u: number; v: number }[] {
  return g.ring.map(([lng, lat]) => {
    const pxy = toLocalXY(lng, lat, g.origin);
    return {
      u: pxy.x * g.u.x + pxy.y * g.u.y,
      v: pxy.x * g.v.x + pxy.y * g.v.y,
    };
  });
}

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
