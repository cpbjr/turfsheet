import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import CourseMap from '@/components/maps/CourseMap';
import type { CourseMapHandle } from '@/components/maps/CourseMap';
import LayerControls from '@/components/maps/LayerControls';
import PinPanel from '@/components/maps/PinPanel';
import PrintSheet from '@/components/maps/PrintSheet';
import {
  DEFAULT_SHOW,
  holeOrder,
  measurePin,
  normalizeAvoid,
  pinsFromStorage,
  todayISO,
} from '@/lib/courseGeometry';
import type { ShowState } from '@/lib/courseGeometry';
import {
  clearDraft,
  draftHasPins,
  getPinSet,
  handoutUrl,
  loadDraft,
  pinSetByToken,
  randomToken,
  saveDraft,
  savePinSet,
  setPublicToken,
} from '@/lib/pinSets';
import type {
  AvoidState,
  GreenIndex,
  LayerKey,
  Pin,
  PinSession,
  PinSetRow,
} from '@/types/courseMap';

function emptySession(): PinSession {
  return {
    id: null,
    startHole: 1,
    order: holeOrder(1),
    index: 0,
    label: '',
    playDate: todayISO(),
    status: 'draft',
    pins: {},
    skipped: {},
    avoid: { course: [], holes: {} },
    publicToken: null,
  };
}

export default function MapsPage() {
  const mapRef = useRef<CourseMapHandle | null>(null);

  const [show, setShow] = useState<ShowState>({ ...DEFAULT_SHOW });
  const [holeFilter, setHoleFilter] = useState('all');
  const [status, setStatus] = useState('');
  const [statusIsError, setStatusIsError] = useState(false);
  const [greenIndex, setGreenIndex] = useState<GreenIndex>({});

  const [panelOpen, setPanelOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [session, setSession] = useState<PinSession>(emptySession);
  const [holeNote, setHoleNote] = useState('');
  const [courseNote, setCourseNote] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [listToken, setListToken] = useState(0);
  const [draftAvailable, setDraftAvailable] = useState(() => draftHasPins(loadDraft()));

  const [printing, setPrinting] = useState(false);
  const [readOnlyHandout, setReadOnlyHandout] = useState(false);

  /** Latest session, readable from timers/callbacks without going stale. */
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const currentHole = sessionActive ? (session.order[session.index] ?? null) : null;

  const flash = useCallback((msg: string, isError = false) => {
    setStatus(msg);
    setStatusIsError(isError);
  }, []);

  /** Persist the draft on every session change while a session is running. */
  useEffect(() => {
    if (!sessionActive) return;
    saveDraft(session, true);
  }, [session, sessionActive]);

  const focusHole = useCallback((hole: number) => {
    setHoleFilter(String(hole));
    mapRef.current?.focusHole(hole);
  }, []);

  const applyRow = useCallback(
    (row: PinSetRow, index: GreenIndex): PinSession => ({
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
    }),
    []
  );

  /** Fired once the geometry is in — also where a ?pinToken= handout is resolved. */
  const onGeoLoaded = useCallback(
    (index: GreenIndex, version: string) => {
      setGreenIndex(index);
      const count = Object.keys(index).length;
      flash(
        `Course v${version} · greens ${count}/18 · pin save/schedule ready · ops map, not a survey`
      );
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
          setSession(applyRow(row, index));
          setReadOnlyHandout(true);
          setSessionActive(false);
          setPrinting(true);
          setStatus('');
        })
        .catch((err: unknown) => flash(err instanceof Error ? err.message : String(err), true));
    },
    [applyRow, flash]
  );

  /* ---------- session lifecycle ---------- */

  const startSession = useCallback(
    (fromDraft: boolean) => {
      setReadOnlyHandout(false);
      if (fromDraft) {
        const d = loadDraft();
        if (!d) return;
        const restored: PinSession = {
          id: d.id ?? null,
          startHole: d.startHole || 1,
          order: d.order?.length === 18 ? d.order : holeOrder(d.startHole || 1),
          index: Math.min(Math.max(0, d.index || 0), 17),
          label: d.label || '',
          playDate: d.playDate || todayISO(),
          status: d.status || 'draft',
          pins: pinsFromStorage(d.pins as unknown as Record<string, Pin>, greenIndex),
          skipped: d.skipped || {},
          avoid: normalizeAvoid(d.avoid),
          publicToken: d.publicToken ?? null,
        };
        setSession(restored);
        setSessionActive(true);
        focusHole(restored.order[restored.index]);
      } else {
        const next: PinSession = {
          ...emptySession(),
          label: session.label,
          playDate: session.playDate || todayISO(),
          status: session.status,
          startHole: session.startHole,
          order: holeOrder(session.startHole),
        };
        setSession(next);
        setSessionActive(true);
        focusHole(next.order[0]);
      }
    },
    [focusHole, greenIndex, session.label, session.playDate, session.startHole, session.status]
  );

  const endSession = useCallback(
    (keepDraft: boolean) => {
      setSessionActive(false);
      setReadOnlyHandout(false);
      setStatus('');
      if (keepDraft) {
        saveDraft(session, false);
      } else {
        clearDraft();
        setSession(emptySession());
      }
      setDraftAvailable(draftHasPins(loadDraft()));
    },
    [session]
  );

  /* ---------- avoid ---------- */

  /** Notes live in their own inputs; stamp them onto the current entries before persisting. */
  const applyNotes = useCallback(
    (s: PinSession): AvoidState => {
      const avoid: AvoidState = {
        course: (s.avoid.course || []).map((x) => ({ ...x, note: courseNote || x.note || '' })),
        holes: { ...s.avoid.holes },
      };
      const hole = s.order[s.index];
      if (hole != null && avoid.holes[String(hole)]) {
        avoid.holes[String(hole)] = avoid.holes[String(hole)].map((x) => ({
          ...x,
          note: holeNote || x.note || '',
        }));
      }
      return avoid;
    },
    [courseNote, holeNote]
  );

  const toggleAvoid = useCallback(
    (scope: 'hole' | 'course', kind: string) => {
      setSession((s) => {
        const avoid: AvoidState = {
          course: [...(s.avoid.course || [])],
          holes: { ...s.avoid.holes },
        };
        if (scope === 'course') {
          const idx = avoid.course.findIndex((x) => x.kind === kind);
          if (idx >= 0) avoid.course.splice(idx, 1);
          else avoid.course.push({ kind, note: courseNote });
        } else {
          const hole = s.order[s.index];
          if (hole == null) return s;
          const key = String(hole);
          const list = [...(avoid.holes[key] || [])];
          const idx = list.findIndex((x) => x.kind === kind);
          if (idx >= 0) list.splice(idx, 1);
          else list.push({ kind, note: holeNote });
          if (list.length) avoid.holes[key] = list;
          else delete avoid.holes[key];
        }
        return { ...s, avoid };
      });
    },
    [courseNote, holeNote]
  );

  /* ---------- navigation ---------- */

  const goRelative = useCallback(
    (delta: number) => {
      setSession((s) => {
        const next = s.index + delta;
        if (next < 0 || next > 17) return s;
        focusHole(s.order[next]);
        return { ...s, avoid: applyNotes(s), index: next };
      });
      setHoleNote('');
    },
    [applyNotes, focusHole]
  );

  const jumpToHole = useCallback(
    (hole: number) => {
      setSession((s) => {
        const idx = s.order.indexOf(hole);
        if (idx < 0) return s;
        focusHole(hole);
        return { ...s, avoid: applyNotes(s), index: idx };
      });
      setHoleNote('');
    },
    [applyNotes, focusHole]
  );

  /** Tapping the map measures the pin, then auto-advances — the tap-cycle from the standalone. */
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (!sessionActive || readOnlyHandout) return;

      const hole = sessionRef.current.order[sessionRef.current.index];
      if (hole == null) return;
      const pin = measurePin(greenIndex, hole, lat, lng);

      setSession((s) => {
        const skipped = { ...s.skipped };
        delete skipped[hole];
        return { ...s, pins: { ...s.pins, [hole]: pin }, skipped };
      });
      if (sessionRef.current.index >= 17) flash(`Hole ${hole} set. Save or finish when ready.`);

      window.setTimeout(() => {
        const s = sessionRef.current;
        // Guards from the standalone: bail if the user moved on, or re-tapped this hole.
        if (s.order[s.index] !== hole) return;
        if (s.pins[hole] !== pin) return;
        if (s.index >= 17) return;
        const nextIndex = s.index + 1;
        focusHole(s.order[nextIndex]);
        setSession((prev) => ({ ...prev, index: nextIndex }));
        setHoleNote('');
      }, 350);
    },
    [flash, focusHole, greenIndex, readOnlyHandout, sessionActive]
  );

  const skipCurrent = useCallback(() => {
    setSession((s) => {
      const hole = s.order[s.index];
      if (hole == null || s.pins[hole]) return s;
      return { ...s, skipped: { ...s.skipped, [hole]: true } };
    });
    goRelative(1);
  }, [goRelative]);

  const clearCurrentPin = useCallback(() => {
    setSession((s) => {
      const hole = s.order[s.index];
      if (hole == null) return s;
      const pins = { ...s.pins };
      delete pins[hole];
      return { ...s, pins };
    });
  }, []);

  /* ---------- save / load ---------- */

  const doSave = useCallback(async (): Promise<string | null> => {
    setSaveMsg('Saving…');
    try {
      const toSave: PinSession = { ...session, avoid: applyNotes(session) };
      if (!toSave.playDate) {
        setSaveMsg('Play date required.');
        return null;
      }
      const row = await savePinSet(toSave);
      setSession((s) => ({
        ...s,
        avoid: toSave.avoid,
        id: row.id,
        publicToken: row.public_token || s.publicToken,
      }));
      const msg = `Saved · ${row.play_date} · ${row.status} · ${
        Object.keys(toSave.pins).length
      }/18 pins`;
      setSaveMsg(msg);
      flash(msg);
      setListToken((n) => n + 1);
      return row.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveMsg(msg);
      flash(msg, true);
      return null;
    }
  }, [applyNotes, flash, session]);

  const loadSet = useCallback(
    async (id: string) => {
      try {
        flash('Loading pin set…');
        const row = await getPinSet(id);
        const loaded = applyRow(row, greenIndex);
        const firstSet = Object.keys(loaded.pins)
          .map(Number)
          .sort((a, b) => a - b)[0];
        if (firstSet) {
          const idx = loaded.order.indexOf(firstSet);
          loaded.index = idx >= 0 ? idx : 0;
        }
        setSession(loaded);
        setSessionActive(true);
        setReadOnlyHandout(false);
        focusHole(loaded.order[loaded.index]);
        flash(
          `Loaded "${loaded.label || loaded.playDate}" (${
            Object.keys(loaded.pins).length
          }/18 pins)`
        );
      } catch (err) {
        flash(err instanceof Error ? err.message : String(err), true);
      }
    },
    [applyRow, flash, focusHole, greenIndex]
  );

  const enablePublicLink = useCallback(async () => {
    try {
      const id = session.id ?? (await doSave());
      if (!id) return;
      let token = session.publicToken;
      if (!token) {
        token = randomToken();
        const row = await setPublicToken(id, token);
        token = row.public_token || token;
        const finalToken = token;
        setSession((s) => ({ ...s, publicToken: finalToken }));
      }
      const url = handoutUrl(token);
      try {
        await navigator.clipboard.writeText(url);
        flash('Public handout link copied.');
      } catch {
        flash(url);
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : String(err), true);
    }
  }, [doSave, flash, session.id, session.publicToken]);

  const finishToPrint = useCallback(() => {
    setSession((s) => ({ ...s, avoid: applyNotes(s) }));
    setPrinting(true);
  }, [applyNotes]);

  /* ---------- render ---------- */

  if (printing) {
    return (
      <PrintSheet
        session={session}
        greenIndex={greenIndex}
        tokenUrl={session.publicToken ? handoutUrl(session.publicToken) : ''}
        readOnly={readOnlyHandout}
        onBackToMap={() => setPrinting(false)}
        onPublicLink={enablePublicLink}
      />
    );
  }

  return (
    // Negates the routed section's padding so the map runs edge to edge.
    <div className="-m-4 md:-m-6 lg:-m-8 h-[calc(100%+2rem)] md:h-[calc(100%+3rem)] lg:h-[calc(100%+4rem)] flex flex-col">
      <div className="border-b border-border-color bg-panel-white px-4 py-3 space-y-3">
        <div>
          <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
            Course Maps
          </h2>
          <p className="text-text-secondary text-sm font-sans mt-0.5">
            BanBury ops map · geometry + pin sheets · not a survey
          </p>
        </div>
        <LayerControls
          show={show}
          onToggleLayer={(key: LayerKey, value) => setShow((s) => ({ ...s, [key]: value }))}
          holeFilter={holeFilter}
          onHoleFilterChange={setHoleFilter}
          holeFilterDisabled={sessionActive}
          onRecenter={() => {
            setHoleFilter('all');
            mapRef.current?.recenter();
          }}
          pinPanelOpen={panelOpen}
          onTogglePinPanel={() => setPanelOpen((o) => !o)}
        />
      </div>

      <div className="relative flex-1 min-h-0">
        <CourseMap
          ref={mapRef}
          show={show}
          holeFilter={holeFilter}
          pins={session.pins}
          pinMode={sessionActive}
          onMapClick={handleMapClick}
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

        {!panelOpen && (
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
        )}

        {panelOpen && (
          <PinPanel
            onClose={() => setPanelOpen(false)}
            active={sessionActive}
            session={session}
            currentHole={currentHole}
            draftAvailable={draftAvailable}
            reloadListToken={listToken}
            onStart={() => startSession(false)}
            onResume={() => startSession(true)}
            onLoadSet={loadSet}
            onMetaChange={(patch) =>
              setSession((s) => ({
                ...s,
                ...patch,
                ...(patch.startHole && !sessionActive ? { order: holeOrder(patch.startHole) } : {}),
              }))
            }
            onBack={() => goRelative(-1)}
            onSkip={skipCurrent}
            onClearPin={clearCurrentPin}
            onNext={() => (session.index >= 17 ? finishToPrint() : goRelative(1))}
            onJumpToHole={jumpToHole}
            holeNote={holeNote}
            courseNote={courseNote}
            onHoleNoteChange={setHoleNote}
            onCourseNoteChange={setCourseNote}
            onToggleAvoid={toggleAvoid}
            onSave={doSave}
            onFinish={finishToPrint}
            onEnableToken={enablePublicLink}
            onCancel={() => {
              if (window.confirm('Cancel pin session and clear local draft?')) {
                endSession(false);
                setPanelOpen(false);
                setHoleFilter('all');
              }
            }}
            saveMsg={saveMsg}
          />
        )}
      </div>
    </div>
  );
}
