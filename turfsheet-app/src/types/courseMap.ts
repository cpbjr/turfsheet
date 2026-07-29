/** Types for the Banbury course map + pin sheets (ported from the standalone map). */

export type LayerKey =
  | 'green'
  | 'fairway'
  | 'bunker'
  | 'tee'
  | 'water'
  | 'hole'
  | 'irrigation'
  | 'other';

export type PinSetStatus = 'draft' | 'scheduled' | 'active' | 'archived';

/** Feature properties as they appear in geo/banbury-course-v1.geojson (OSM-derived). */
export interface CourseFeatureProps {
  golf?: string | null;
  feature_type?: string | null;
  hole_number?: number | null;
  name?: string | null;
  par?: number | null;
  handicap?: number | null;
  ref?: string | null;
  tee?: string | null;
  surface?: string | null;
  osm_type?: string | null;
  osm_id?: number | string | null;
  source?: string | null;
}

export interface LatLngBoundsLiteral {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/** Unit vector in the green-local frame (u = along approach, v = across). */
export interface UnitVec {
  x: number;
  y: number;
}

/** Per-hole green geometry, precomputed once from the GeoJSON. */
export interface GreenIndexEntry {
  hole: number;
  /** Outer ring as [lng, lat] pairs. */
  ring: [number, number][];
  /** Hole centreline path as [lng, lat] pairs. */
  path: [number, number][];
  origin: { lat: number; lng: number };
  u: UnitVec;
  v: UnitVec;
  frontU: number;
  backU: number;
  leftV: number;
  rightV: number;
  depthYd: number;
  widthYd: number;
  bounds: LatLngBoundsLiteral;
}

export type GreenIndex = Record<number, GreenIndexEntry>;

/** A measured pin position for one hole. */
export interface Pin {
  hole: number;
  lat: number;
  lng: number;
  onYd: number | null;
  lrYd: number | null;
  lrSide?: 'L' | 'R' | 'C';
  depthYd: number | null;
  widthYd: number | null;
  onLabel: string;
  lrLabel: string;
  depthLabel: string;
  /** Coordinates in the green-local frame, kept so the print diagram can plot without re-measuring. */
  u?: number;
  v?: number;
  ok: boolean;
  setAt?: string | null;
}

export type PinMap = Record<number, Pin>;

export interface AvoidEntry {
  kind: string;
  note: string;
}

export interface AvoidState {
  course: AvoidEntry[];
  /** Keyed by hole number as a string, matching the stored JSON shape. */
  holes: Record<string, AvoidEntry[]>;
}

/** A row of turfsheet.banbury_pin_sets. */
export interface PinSetRow {
  id: string;
  play_date: string;
  label: string;
  status: PinSetStatus;
  start_hole: number;
  pins: Record<string, Pin>;
  avoid: AvoidState;
  public_token: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Summary row used for the saved-sets list. */
export interface PinSetSummary {
  id: string;
  play_date: string;
  label: string;
  status: PinSetStatus;
  start_hole: number;
  public_token: string | null;
  updated_at: string;
}

/** The in-progress pin session, mirrored to localStorage as a draft. */
export interface PinSession {
  id: string | null;
  startHole: number;
  order: number[];
  index: number;
  label: string;
  playDate: string;
  status: PinSetStatus;
  pins: PinMap;
  skipped: Record<number, boolean>;
  avoid: AvoidState;
  publicToken: string | null;
}
