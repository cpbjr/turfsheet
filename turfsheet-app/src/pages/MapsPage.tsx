import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import CourseMap from '@/components/maps/CourseMap';
import type { CourseMapHandle } from '@/components/maps/CourseMap';
import LayerControls from '@/components/maps/LayerControls';
import PrintSheet from '@/components/maps/PrintSheet';
import {
  DEFAULT_SHOW,
  holeOrder,
  normalizeAvoid,
  pinsFromStorage,
  todayISO,
} from '@/lib/courseGeometry';
import type { ShowState } from '@/lib/courseGeometry';
import {
  getPinSet,
  handoutUrl,
  listPinSets,
  pinSetByToken,
} from '@/lib/pinSets';
import type {
  GreenIndex,
  LayerKey,
  PinMap,
  PinSession,
  PinSetSummary,
} from '@/types/courseMap';

export default function MapsPage() {
  const mapRef = useRef<CourseMapHandle | null>(null);

  const [show, setShow] = useState<ShowState>({ ...DEFAULT_SHOW });
  const [holeFilter, setHoleFilter] = useState('all');
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [greenIndex, setGreenIndex] = useState<GreenIndex>({});

  /** Pins layer: default OFF; when ON, show one chosen sheet read-only. */
  const [showPinsLayer, setShowPinsLayer] = useState(false);
  const [pinSetOptions, setPinSetOptions] = useState<PinSetSummary[]>([]);
  const [selectedPinSetId, setSelectedPinSetId] = useState('');
  const [overlayPins, setOverlayPins] = useState<PinMap>({});
  const [overlaySetLabel, setOverlaySetLabel] = useState('');

  const [handoutSession, setHandoutSession] = useState<PinSession | null>(null);
  const [printing, setPrinting] = useState(false);

  const flash = useCallback((msg: string, isError = false) => {
    setStatus(msg);
    setStatusIsError(isError);
  }, []);

  const handleHoleFilterChange = useCallback((value: string) => {
    setHoleFilter(value);
    mapRef.current?.focusHoleFilter(value);
  }, []);

  // Load scheduled/active sets for the read-only picker
  useEffect(() => {
    if (!showPinsLayer) return;
    let cancelled = false;
    listPinSets()
      .then((rows) => {
        if (cancelled) return;
        const usable = rows.filter((r) => r.status === 'active' || r.status === 'scheduled' || r.status === 'draft');
        setPinSetOptions(usable);
      })
      .catch(() => {
        if (!cancelled) setPinSetOptions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [showPinsLayer]);

  // Load chosen set pins onto the map
  useEffect(() => {
    if (!showPinsLayer || !selectedPinSetId || !Object.keys(greenIndex).length) {
      if (!showPinsLayer) {
        setOverlayPins({});
        setOverlaySetLabel('');
      }
      return;
    }
    let cancelled = false;
    getPinSet(selectedPinSetId)
      .then((row) => {
        if (cancelled) return;
        setOverlayPins(pinsFromStorage(row.pins, greenIndex));
        setOverlaySetLabel(row.label || row.play_date);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        flash(err instanceof Error ? err.message : String(err), true);
        setOverlayPins({});
      });
    return () => {
      cancelled = true;
    };
  }, [showPinsLayer, selectedPinSetId, greenIndex, flash]);

  const onGeoLoaded = useCallback(
    (index: GreenIndex, version: string) => {
      setGreenIndex(index);
      const count = Object.keys(index).length;
      flash(`Course v${version} · greens ${count}/18 · ops map, not a survey`);
      window.setTimeout(() => setStatus(''), 5000);

      const token = (new URLSearchParams(window.location.search).get('pinToken') || '').trim();
      if (token.length < 16) return;

      flash('Loading pin handout…');
      pinSetByToken(token)
        .then((row) => {
          if (!row) {
            flash('Handout not found or link expired.', true);
            return;
          }
          const session: PinSession = {
            id: row.id,
            startHole: row.start_hole || 1,
            order: holeOrder(row.start_hole || 1),
            index: 0,
            label: row.label || '',
            playDate: row.play_date || todayISO(),
            status: row.status || 'draft',
            pins: pinsFromStorage(row.pins, index),
            skipped: {},
            avoid: normalizeAvoid(row.avoid),
            publicToken: row.public_token || null,
          };
          setHandoutSession(session);
          setPrinting(true);
          setStatus('');
        })
        .catch((err: unknown) => flash(err instanceof Error ? err.message : String(err), true));
    },
    [flash]
  );

  if (printing && handoutSession) {
    return (
      <PrintSheet
        session={handoutSession}
        greenIndex={greenIndex}
        tokenUrl={handoutSession.publicToken ? handoutUrl(handoutSession.publicToken) : ''}
        readOnly
        onBackToMap={() => {
          setPrinting(false);
          setHandoutSession(null);
        }}
        onPublicLink={() => {
          /* read-only handout — no enable */
        }}
      />
    );
  }

  const displayPins = showPinsLayer ? overlayPins : {};

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)] lg:h-[calc(100%+4rem)] flex flex-col">
      <div className="border-b border-border-color bg-panel-white px-4 py-3 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
              Course Maps
            </h2>
            <p className="text-text-secondary text-sm font-sans mt-0.5">
              BanBury ops map · layers + irrigation · not a survey
            </p>
          </div>
          <Link
            to="/pins"
            className="px-3 py-1.5 text-xs font-heading font-black uppercase tracking-wide border border-turf-green text-turf-green hover:bg-turf-green/10 transition-colors"
          >
            Open in Pin Sheets →
          </Link>
        </div>
        <LayerControls
          show={show}
          onToggleLayer={(key: LayerKey, value) => setShow((s) => ({ ...s, [key]: value }))}
          holeFilter={holeFilter}
          onHoleFilterChange={handleHoleFilterChange}
          holeFilterDisabled={false}
          onRecenter={() => {
            setHoleFilter('all');
            mapRef.current?.recenter();
          }}
          showPinsLayer={showPinsLayer}
          onTogglePinsLayer={setShowPinsLayer}
          pinSetOptions={pinSetOptions}
          selectedPinSetId={selectedPinSetId}
          onSelectPinSet={setSelectedPinSetId}
        />
        {showPinsLayer && overlaySetLabel && (
          <p className="text-[11px] font-sans text-text-muted">
            Showing pins: {overlaySetLabel} (read-only)
          </p>
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        <CourseMap
          ref={mapRef}
          show={show}
          holeFilter={holeFilter}
          pins={displayPins}
          pinMode={false}
          onGeoLoaded={onGeoLoaded}
          onError={(msg) => flash(msg, true)}
        />

        {status && (
          <div
            role="status"
            className={`absolute top-3 left-3 z-10 max-w-[70%] px-3 py-2 text-xs font-sans shadow-md border ${
              statusIsError
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-panel-white border-border-color text-text-primary'
            }`}
          >
            {statusIsError && <AlertTriangle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
            {status}
          </div>
        )}

        <aside className="absolute bottom-3 left-3 z-10 bg-panel-white/95 border border-border-color px-3 py-2 shadow-sm">
          <h2 className="text-[11px] font-heading font-black uppercase tracking-wide text-text-primary mb-1.5">
            Layers
          </h2>
          <div className="space-y-1 text-[11px] font-sans text-text-secondary">
            {[
              ['#66bb6a', 'green'],
              ['#9ccc65', 'fairway'],
              ['#ffe082', 'bunker'],
              ['#4fc3f7', 'water'],
              ['#e8efe6', 'hole #'],
              ['#ff5252', 'pin'],
            ].map(([color, name]) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 border border-border-color"
                  style={{ background: color }}
                />
                {name}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
