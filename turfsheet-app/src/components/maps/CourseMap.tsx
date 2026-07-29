import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import {
  CENTER,
  COLORS,
  GEO_URL,
  IRRIGATION_GEO_URL,
  buildGreenIndex,
  formatPinStats,
  passesFilters,
  styleFor,
} from '@/lib/courseGeometry';
import type { CourseGeoJson, ShowState } from '@/lib/courseGeometry';
import { loadGoogleMaps } from '@/lib/googleMaps';
import type { CourseFeatureProps, GreenIndex, PinMap } from '@/types/courseMap';

export interface CourseMapHandle {
  /** Zooms to a hole's green (used as the pin session steps through holes). */
  focusHole: (hole: number) => void;
  /**
   * Zooms for a hole-filter control value: single hole (1–18), front/back nine,
   * or full-course recenter for "all".
   */
  focusHoleFilter: (filter: string) => void;
  recenter: () => void;
}

interface CourseMapProps {
  show: ShowState;
  holeFilter: string;
  pins: PinMap;
  /** When true, feature InfoWindows are suppressed and map clicks drop pins. */
  pinMode: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  onGeoLoaded?: (greenIndex: GreenIndex, version: string) => void;
  onError?: (message: string) => void;
}

interface IrrigationPoint {
  name: string;
  featureType: string;
  holeNumber: number | null;
  lat: number;
  lng: number;
  source?: string | null;
  confidence?: string | null;
  notes?: string | null;
}

function propsOf(feature: google.maps.Data.Feature): CourseFeatureProps {
  const out: Record<string, unknown> = {};
  feature.forEachProperty((val, key) => {
    out[key] = val;
  });
  return out as CourseFeatureProps;
}

function irrigationPassesHoleFilter(hole: number | null, holeFilter: string): boolean {
  if (holeFilter === 'all') return true;
  if (hole == null) return true;
  if (holeFilter === 'front') return hole <= 9;
  if (holeFilter === 'back') return hole >= 10;
  return hole === Number(holeFilter);
}

const CourseMap = forwardRef<CourseMapHandle, CourseMapProps>(function CourseMap(
  { show, holeFilter, pins, pinMode, onMapClick, onGeoLoaded, onError },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const dataLayerRef = useRef<google.maps.Data | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const holeLabelsRef = useRef<google.maps.Marker[]>([]);
  const pinMarkersRef = useRef<Record<number, google.maps.Marker>>({});
  const irrigationMarkersRef = useRef<google.maps.Marker[]>([]);
  const irrigationPointsRef = useRef<IrrigationPoint[]>([]);
  const greenIndexRef = useRef<GreenIndex>({});
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Kept in refs so the long-lived Maps listeners always read current values
  // without being torn down and rebuilt on every render.
  const showRef = useRef(show);
  const holeFilterRef = useRef(holeFilter);
  const pinModeRef = useRef(pinMode);
  const onMapClickRef = useRef(onMapClick);
  showRef.current = show;
  holeFilterRef.current = holeFilter;
  pinModeRef.current = pinMode;
  onMapClickRef.current = onMapClick;

  const clearHoleLabels = useCallback(() => {
    holeLabelsRef.current.forEach((m) => m.setMap(null));
    holeLabelsRef.current = [];
  }, []);

  const addHoleLabel = useCallback((feature: google.maps.Data.Feature) => {
    const map = mapRef.current;
    if (!map) return;
    const golf = feature.getProperty('golf') as string | undefined;
    const holeNumber = feature.getProperty('hole_number') as number | null | undefined;
    const par = feature.getProperty('par') as number | null | undefined;
    if (golf !== 'hole' || holeNumber == null) return;

    const geom = feature.getGeometry();
    if (!geom) return;
    let point: google.maps.LatLng | null = null;
    geom.forEachLatLng((ll) => {
      point = ll;
    });
    if (!point) return;

    const marker = new google.maps.Marker({
      map,
      position: point,
      label: {
        text: String(holeNumber),
        color: '#0f1410',
        fontWeight: '700',
        fontSize: '11px',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#e8efe6',
        fillOpacity: 0.92,
        strokeColor: '#2e7d32',
        strokeWeight: 2,
      },
      title: `Hole ${holeNumber}${par ? ` · par ${par}` : ''}`,
      zIndex: 1000 + Number(holeNumber),
    });
    holeLabelsRef.current.push(marker);
  }, []);

  const applyStyle = useCallback(
    (feature: google.maps.Data.Feature): google.maps.Data.StyleOptions => {
      const p = propsOf(feature);
      if (!passesFilters(p, showRef.current, holeFilterRef.current)) {
        return { visible: false };
      }
      const s = styleFor(p);
      const isHole = p.golf === 'hole';
      return {
        visible: true,
        fillColor: s.fill,
        fillOpacity: s.fillOpacity,
        strokeColor: s.stroke,
        strokeOpacity: isHole ? 0.85 : 0.9,
        strokeWeight: isHole ? 2 : 1.5,
        zIndex: isHole ? 50 : p.golf === 'green' ? 40 : 10,
        clickable: !pinModeRef.current,
      };
    },
    []
  );

  const refreshStyles = useCallback(() => {
    const layer = dataLayerRef.current;
    if (!layer) return;
    clearHoleLabels();
    layer.setStyle((feature) => applyStyle(feature));
    if (showRef.current.hole) {
      layer.forEach((feature) => {
        const p: CourseFeatureProps = {
          golf: feature.getProperty('golf') as string | undefined,
          hole_number: feature.getProperty('hole_number') as number | null | undefined,
        };
        if (passesFilters(p, showRef.current, holeFilterRef.current)) addHoleLabel(feature);
      });
    }
  }, [applyStyle, addHoleLabel, clearHoleLabels]);

  /* ---------- pin markers ---------- */

  const redrawPinMarkers = useCallback(() => {
    const map = mapRef.current;
    Object.values(pinMarkersRef.current).forEach((m) => m.setMap(null));
    pinMarkersRef.current = {};
    if (!map) return;
    Object.entries(pins).forEach(([h, pin]) => {
      if (!pin) return;
      const hole = Number(h);
      pinMarkersRef.current[hole] = new google.maps.Marker({
        map,
        position: { lat: pin.lat, lng: pin.lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#ff5252',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: `Hole ${hole} pin · ${formatPinStats(pin)}`,
        zIndex: 2000 + hole,
      });
    });
  }, [pins]);

  const clearIrrigationMarkers = useCallback(() => {
    irrigationMarkersRef.current.forEach((m) => m.setMap(null));
    irrigationMarkersRef.current = [];
  }, []);

  const redrawIrrigationMarkers = useCallback(() => {
    const map = mapRef.current;
    clearIrrigationMarkers();
    if (!map || !showRef.current.irrigation || pinModeRef.current) return;

    const info = infoRef.current;
    for (const pt of irrigationPointsRef.current) {
      if (!irrigationPassesHoleFilter(pt.holeNumber, holeFilterRef.current)) continue;
      const isValve = pt.featureType === 'valve';
      const marker = new google.maps.Marker({
        map,
        position: { lat: pt.lat, lng: pt.lng },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isValve ? 6 : 4.5,
          fillColor: isValve ? '#ffb300' : '#29b6f6',
          fillOpacity: 0.95,
          strokeColor: '#0d47a1',
          strokeWeight: 1.25,
        },
        title: pt.name,
        zIndex: 1500,
        clickable: true,
      });
      marker.addListener('click', () => {
        if (!info || pinModeRef.current) return;
        const lines = [
          `<strong>${pt.name}</strong>`,
          `Type: ${pt.featureType}`,
        ];
        if (pt.holeNumber != null) lines.push(`Hole # ${pt.holeNumber}`);
        if (pt.source) lines.push(`Source: ${pt.source}`);
        if (pt.confidence) lines.push(`Confidence: ${pt.confidence}`);
        if (pt.notes) lines.push(pt.notes);
        info.setContent(lines.join('<br>'));
        info.setPosition({ lat: pt.lat, lng: pt.lng });
        info.open({ map });
      });
      irrigationMarkersRef.current.push(marker);
    }
  }, [clearIrrigationMarkers]);

  /* ---------- boot ---------- */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !containerRef.current) return;

        const map = new google.maps.Map(containerRef.current, {
          center: CENTER,
          zoom: 16,
          mapTypeId: 'satellite',
          tilt: 0,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            mapTypeIds: ['satellite', 'hybrid', 'roadmap'],
          },
        });
        mapRef.current = map;

        const res = await fetch(GEO_URL, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`GeoJSON fetch failed (${res.status})`);
        const fc = (await res.json()) as CourseGeoJson;
        if (cancelled) return;

        greenIndexRef.current = buildGreenIndex(fc);

        const layer = map.data;
        layer.addGeoJson(fc);
        dataLayerRef.current = layer;

        const info = new google.maps.InfoWindow();
        infoRef.current = info;
        layer.addListener('click', (event: google.maps.Data.MouseEvent) => {
          if (pinModeRef.current) return;
          const p = propsOf(event.feature);
          const lines: string[] = [];
          const title =
            p.golf === 'hole' && p.hole_number != null
              ? `Hole ${p.hole_number}`
              : p.name || p.golf || p.feature_type || 'Feature';
          lines.push(`<strong>${title}</strong>`);
          if (p.par) lines.push(`Par ${p.par}`);
          if (p.handicap) lines.push(`Handicap ${p.handicap}`);
          if (p.tee) lines.push(`Tee: ${p.tee}`);
          if (p.golf) lines.push(`Type: ${p.golf}`);
          if (p.hole_number != null && p.golf !== 'hole') lines.push(`Hole # ${p.hole_number}`);
          lines.push(`<span style="opacity:.7">OSM ${p.osm_type || ''} ${p.osm_id || ''}</span>`);
          info.setContent(lines.join('<br>'));
          info.setPosition(event.latLng);
          info.open({ map });
        });

        // Fit to the playable extent rather than the raw feature bounds.
        const bounds = new google.maps.LatLngBounds();
        let any = false;
        layer.forEach((feature) => {
          const g = feature.getProperty('golf');
          if (g === 'green' || g === 'fairway' || g === 'hole') {
            feature.getGeometry()?.forEachLatLng((ll) => {
              bounds.extend(ll);
              any = true;
            });
          }
        });
        if (any) map.fitBounds(bounds, 48);

        refreshStyles();
        redrawPinMarkers();
        redrawIrrigationMarkers();

        onGeoLoaded?.(greenIndexRef.current, String(fc.properties?.version ?? '1'));

        // Irrigation layer (points) — separate file; empty until heads are imported.
        try {
          const ires = await fetch(IRRIGATION_GEO_URL, { cache: 'no-cache' });
          if (ires.ok) {
            const ifc = (await ires.json()) as {
              features?: Array<{
                geometry?: { type?: string; coordinates?: number[] };
                properties?: Record<string, unknown>;
              }>;
            };
            if (!cancelled) {
              const pts: IrrigationPoint[] = [];
              for (const f of ifc.features || []) {
                if (f.geometry?.type !== 'Point' || !f.geometry.coordinates) continue;
                const [lng, lat] = f.geometry.coordinates;
                if (typeof lat !== 'number' || typeof lng !== 'number') continue;
                const p = f.properties || {};
                const holeRaw = p.hole_number;
                pts.push({
                  name: String(p.name || 'irrigation'),
                  featureType: String(p.feature_type || 'irrigation_head'),
                  holeNumber:
                    holeRaw == null || holeRaw === ''
                      ? null
                      : Number(holeRaw),
                  lat,
                  lng,
                  source: (p.source as string) || null,
                  confidence: (p.confidence as string) || null,
                  notes: (p.notes as string) || null,
                });
              }
              irrigationPointsRef.current = pts;
              redrawIrrigationMarkers();
            }
          }
        } catch {
          // Non-fatal: course map still works without irrigation file.
        }
      } catch (err) {
        if (!cancelled) onError?.(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
      clearHoleLabels();
      clearIrrigationMarkers();
      Object.values(pinMarkersRef.current).forEach((m) => m.setMap(null));
      pinMarkersRef.current = {};
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
      infoRef.current?.close();
      // Data features live on map.data; drop them so a remount re-adds cleanly.
      dataLayerRef.current?.forEach((f) => dataLayerRef.current?.remove(f));
      dataLayerRef.current = null;
      mapRef.current = null;
    };
    // Boots once; live values are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshStyles();
    redrawIrrigationMarkers();
  }, [show, holeFilter, pinMode, refreshStyles, redrawIrrigationMarkers]);

  useEffect(() => {
    redrawPinMarkers();
  }, [redrawPinMarkers]);

  // Pin mode: map clicks drop a pin instead of doing nothing.
  useEffect(() => {
    const map = mapRef.current;
    clickListenerRef.current?.remove();
    clickListenerRef.current = null;
    if (!map || !pinMode) return;
    clickListenerRef.current = map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      onMapClickRef.current?.(event.latLng.lat(), event.latLng.lng());
    });
    return () => {
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
    };
  }, [pinMode]);

  useImperativeHandle(
    ref,
    () => {
      const focusHole = (hole: number) => {
        const map = mapRef.current;
        const g = greenIndexRef.current[hole];
        if (!map || !g) return;
        const bounds = new google.maps.LatLngBounds(
          { lat: g.bounds.minLat, lng: g.bounds.minLng },
          { lat: g.bounds.maxLat, lng: g.bounds.maxLng }
        );
        map.fitBounds(bounds, 80);
        // fitBounds is async; clamp after the camera settles.
        google.maps.event.addListenerOnce(map, 'idle', () => {
          const z = map.getZoom();
          if (z == null) return;
          if (z < 18) map.setZoom(18);
          else if (z > 19) map.setZoom(19);
        });
      };

      const focusHoleRange = (from: number, to: number) => {
        const map = mapRef.current;
        if (!map) return;
        const bounds = new google.maps.LatLngBounds();
        let any = false;
        for (let h = from; h <= to; h++) {
          const g = greenIndexRef.current[h];
          if (!g) continue;
          bounds.extend({ lat: g.bounds.minLat, lng: g.bounds.minLng });
          bounds.extend({ lat: g.bounds.maxLat, lng: g.bounds.maxLng });
          any = true;
        }
        if (!any) return;
        map.fitBounds(bounds, 64);
      };

      const recenter = () => {
        const map = mapRef.current;
        if (!map) return;
        map.setCenter(CENTER);
        map.setZoom(16);
      };

      return {
        focusHole,
        focusHoleFilter(filter: string) {
          if (filter === 'all') {
            recenter();
            return;
          }
          if (filter === 'front') {
            focusHoleRange(1, 9);
            return;
          }
          if (filter === 'back') {
            focusHoleRange(10, 18);
            return;
          }
          const n = Number(filter);
          if (Number.isFinite(n) && n >= 1 && n <= 18) focusHole(n);
        },
        recenter,
      };
    },
    []
  );

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="BanBury golf course map"
      className={`h-full w-full ${pinMode ? 'cursor-crosshair' : ''}`}
      style={{ background: COLORS.golf_course.fill }}
    />
  );
});

export default CourseMap;
