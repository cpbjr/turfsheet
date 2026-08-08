import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import type { CourseMapHandle } from '@/components/maps/CourseMap';
import PrintSheet from '@/components/maps/PrintSheet';
import PinDelivery from '@/components/pins/PinDelivery';
import PinLibraryList from '@/components/pins/PinLibraryList';
import PinSetupForm from '@/components/pins/PinSetupForm';
import { GEO_URL, buildGreenIndex } from '@/lib/courseGeometry';
import type { CourseGeoJson } from '@/lib/courseGeometry';
import { handoutUrl } from '@/lib/pinSets';
import { usePinSession } from '@/lib/usePinSession';
import type { GreenIndex, PinSetStatus } from '@/types/courseMap';

type PinsView = 'library' | 'setup' | 'delivery';

export default function PinsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<PinsView>('library');
  const [greenIndex, setGreenIndex] = useState<GreenIndex>({});
  const [geoReady, setGeoReady] = useState(false);
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const mapRef = useRef<CourseMapHandle | null>(null);
  const deepLinkHandled = useRef<string | null>(null);

  const flash = useCallback((msg: string, isError = false) => {
    setStatus(msg);
    setStatusIsError(isError);
    if (!isError) {
      window.setTimeout(() => setStatus((s) => (s === msg ? '' : s)), 4000);
    }
  }, []);

  const focusHole = useCallback((hole: number) => {
    mapRef.current?.focusHole(hole);
  }, []);

  const pin = usePinSession({ greenIndex, focusHole, flash });

  // Load course geometry once (no Google Maps required for table/library).
  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Course geo HTTP ${r.status}`);
        return r.json();
      })
      .then((fc: CourseGeoJson) => {
        if (cancelled) return;
        const index = buildGreenIndex(fc);
        setGreenIndex(index);
        setGeoReady(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        flash(err instanceof Error ? err.message : String(err), true);
      });
    return () => {
      cancelled = true;
    };
  }, [flash]);

  // Deep link: /pins?set=<id>
  useEffect(() => {
    if (!geoReady) return;
    const setId = (searchParams.get('set') || '').trim();
    if (!setId || deepLinkHandled.current === setId) return;
    deepLinkHandled.current = setId;
    void pin.loadSet(setId).then(() => {
      setView('setup');
    });
    // strip query so refresh doesn't re-open aggressively mid-edit
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoReady, searchParams]);

  const goLibrary = () => {
    pin.setSessionActive(false);
    pin.setPrinting(false);
    setView('library');
  };

  const goSetup = () => {
    if (!pin.sessionActive) {
      pin.setSessionActive(true);
    }
    pin.setPrinting(false);
    setView('setup');
  };

  const goDelivery = () => {
    pin.setSession((s) => ({ ...s, avoid: pin.applyNotes(s) }));
    pin.setPrinting(false);
    setView('delivery');
  };

  if (pin.printing) {
    return (
      <PrintSheet
        session={pin.session}
        greenIndex={greenIndex}
        tokenUrl={pin.session.publicToken ? handoutUrl(pin.session.publicToken) : ''}
        readOnly={pin.readOnlyHandout}
        onBackToMap={() => {
          pin.setPrinting(false);
          setView('delivery');
        }}
        onPublicLink={pin.enablePublicLink}
      />
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full min-h-0 gap-4 overflow-hidden">
      <div className="shrink-0">
        {/* Setup is the map-heavy view; on phones the title block is ~60px of height the
            green needs more than the label does. Tabs stay for navigation. */}
        <div className={view === 'setup' ? 'hidden md:block' : ''}>
          <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
            Pin Sheets
          </h2>
          <p className="text-text-secondary text-sm font-sans mt-0.5">
            Plan, set, and deliver Banbury pin sheets · yards table or map
          </p>
        </div>

        <div className="flex flex-wrap gap-1 mt-3 border-b border-border-color">
          {(
            [
              ['library', 'Library'],
              ['setup', 'Setup'],
              ['delivery', 'Delivery'],
            ] as const
          ).map(([id, label]) => {
            const needsSession = id === 'setup' || id === 'delivery';
            const disabled = needsSession && !pin.sessionActive && view !== id;
            return (
              <button
                key={id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  if (id === 'library') goLibrary();
                  else if (id === 'setup') goSetup();
                  else goDelivery();
                }}
                className={`px-4 py-2 text-xs font-heading font-black uppercase tracking-wide border-b-2 -mb-px transition-colors ${
                  view === id
                    ? 'border-turf-green text-turf-green'
                    : 'border-transparent text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {status && (
        <div
          role="status"
          className={`shrink-0 px-3 py-2 text-xs font-sans border ${
            statusIsError
              ? 'bg-red-50 border-red-300 text-red-700'
              : 'bg-panel-white border-border-color text-text-primary'
          }`}
        >
          {statusIsError && <AlertTriangle className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />}
          {status}
        </div>
      )}

      {!geoReady && (
        <div className="text-sm font-sans text-text-muted">Loading course geometry…</div>
      )}

      {geoReady && view === 'library' && (
        <PinLibraryList
          reloadToken={pin.listToken}
          onNew={() => {
            pin.startNewSession();
            setView('setup');
          }}
          onOpen={async (id) => {
            await pin.loadSet(id);
            setView('setup');
          }}
          onDuplicate={async (id) => {
            const newId = await pin.duplicateSet(id);
            if (newId) await pin.loadSet(newId);
          }}
          onDelete={pin.removeSavedSet}
          onResumeDraft={() => {
            pin.startSession(true);
            setView('setup');
          }}
          onDiscardDraft={pin.discardLocalDraft}
        />
      )}

      {geoReady && view === 'setup' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <PinSetupForm
            session={pin.session}
            greenIndex={greenIndex}
            currentHole={pin.currentHole}
            holeNote={pin.holeNote}
            courseNote={pin.courseNote}
            saveMsg={pin.saveMsg}
            mapRef={mapRef}
            onMetaChange={pin.onMetaChange}
            onJumpToHole={pin.jumpToHole}
            onSetPin={pin.setPinForHole}
            onMapClick={pin.handleMapClick}
            onGeoLoaded={(index) => {
              // Prefer map-built index if richer; merge by replacement when non-empty
              if (Object.keys(index).length) setGreenIndex(index);
            }}
            onBack={() => pin.goRelative(-1)}
            onNext={() =>
              pin.session.index >= 17 ? goDelivery() : pin.goRelative(1)
            }
            onClearPin={pin.clearCurrentPin}
            onHoleNoteChange={pin.setHoleNote}
            onCourseNoteChange={pin.setCourseNote}
            onToggleAvoid={pin.toggleAvoid}
            onSave={() => void pin.doSave()}
            onDeliver={goDelivery}
            onCancel={() => {
              if (
                window.confirm(
                  'Leave setup? Local draft is kept unless you discard it from the library.'
                )
              ) {
                pin.endSession(true);
                setView('library');
              }
            }}
            onError={(msg) => flash(msg, true)}
          />
        </div>
      )}

      {geoReady && view === 'delivery' && (
        <div className="flex-1 min-h-0 overflow-auto">
          <PinDelivery
            session={pin.session}
            greenIndex={greenIndex}
            onPrint={() => pin.setPrinting(true)}
            onEnableToken={pin.enablePublicLink}
            onStatusChange={(status: PinSetStatus) => pin.setStatus(status)}
            onSave={() => void pin.doSave()}
            onBackToSetup={() => setView('setup')}
            onBackToLibrary={goLibrary}
            saveMsg={pin.saveMsg}
          />
        </div>
      )}
    </div>
  );
}
