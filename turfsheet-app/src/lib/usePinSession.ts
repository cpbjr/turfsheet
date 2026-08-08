/**
 * Pin-session state machine extracted from MapsPage.
 * Shared by /pins (setup/delivery) and the legacy Maps pin flow during migration.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  holeOrder,
  measurePin,
  normalizeAvoid,
  pinsFromStorage,
  todayISO,
} from '@/lib/courseGeometry';
import {
  clearDraft,
  deletePinSet,
  draftHasPins,
  getPinSet,
  handoutUrl,
  loadDraft,
  randomToken,
  saveDraft,
  savePinSet,
  setPublicToken,
} from '@/lib/pinSets';
import type {
  AvoidState,
  GreenIndex,
  Pin,
  PinSession,
  PinSetRow,
  PinSetStatus,
} from '@/types/courseMap';

export function emptySession(): PinSession {
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

export function applyRow(row: PinSetRow, index: GreenIndex): PinSession {
  return {
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
}

export interface UsePinSessionOptions {
  greenIndex: GreenIndex;
  /** Zoom/focus the map when the current hole changes (optional for table-only). */
  focusHole?: (hole: number) => void;
  flash?: (msg: string, isError?: boolean) => void;
}

export function usePinSession({ greenIndex, focusHole, flash }: UsePinSessionOptions) {
  const [sessionActive, setSessionActive] = useState(false);
  const [session, setSession] = useState<PinSession>(emptySession);
  const [holeNote, setHoleNote] = useState('');
  const [courseNote, setCourseNote] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [listToken, setListToken] = useState(0);
  const [draftAvailable, setDraftAvailable] = useState(() => draftHasPins(loadDraft()));
  const [printing, setPrinting] = useState(false);
  const [readOnlyHandout, setReadOnlyHandout] = useState(false);

  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const advanceTimerRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
    },
    []
  );

  const currentHole = sessionActive ? (session.order[session.index] ?? null) : null;

  const notify = useCallback(
    (msg: string, isError = false) => {
      flash?.(msg, isError);
    },
    [flash]
  );

  /** Persist the draft on every session change while a session is running. */
  useEffect(() => {
    if (!sessionActive) return;
    saveDraft(session, true);
  }, [session, sessionActive]);

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

  const goRelative = useCallback(
    (delta: number) => {
      setSession((s) => {
        const next = s.index + delta;
        if (next < 0 || next > 17) return s;
        focusHole?.(s.order[next]);
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
        focusHole?.(hole);
        return { ...s, avoid: applyNotes(s), index: idx };
      });
      setHoleNote('');
    },
    [applyNotes, focusHole]
  );

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
      if (sessionRef.current.index >= 17) {
        notify(`Hole ${hole} set. Save or finish when ready.`);
      }

      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = window.setTimeout(() => {
        advanceTimerRef.current = null;
        const s = sessionRef.current;
        if (s.order[s.index] !== hole) return;
        if (s.index >= 17) return;
        const nextIndex = s.index + 1;
        focusHole?.(s.order[nextIndex]);
        setSession((prev) => ({ ...prev, index: nextIndex }));
        setHoleNote('');
      }, 350);
    },
    [focusHole, greenIndex, notify, readOnlyHandout, sessionActive]
  );

  /** Place or clear a pin for a specific hole (table mode; no auto-advance). */
  const setPinForHole = useCallback((hole: number, pin: Pin | null) => {
    setSession((s) => {
      const pins = { ...s.pins };
      const skipped = { ...s.skipped };
      if (pin) {
        pins[hole] = pin;
        delete skipped[hole];
      } else {
        delete pins[hole];
      }
      return { ...s, pins, skipped };
    });
  }, []);

  const clearCurrentPin = useCallback(() => {
    setSession((s) => {
      const hole = s.order[s.index];
      if (hole == null) return s;
      const pins = { ...s.pins };
      delete pins[hole];
      return { ...s, pins };
    });
  }, []);

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
        focusHole?.(restored.order[restored.index]);
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
        focusHole?.(next.order[0]);
      }
    },
    [focusHole, greenIndex, session.label, session.playDate, session.startHole, session.status]
  );

  /** Start a brand-new empty session (library "New"). */
  const startNewSession = useCallback(() => {
    setReadOnlyHandout(false);
    const next = emptySession();
    setSession(next);
    setSessionActive(true);
    setHoleNote('');
    setCourseNote('');
    setSaveMsg('');
    focusHole?.(next.order[0]);
  }, [focusHole]);

  const endSession = useCallback(
    (keepDraft: boolean) => {
      setSessionActive(false);
      setReadOnlyHandout(false);
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
      notify(msg);
      setListToken((n) => n + 1);
      return row.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveMsg(msg);
      notify(msg, true);
      return null;
    }
  }, [applyNotes, notify, session]);

  const loadSet = useCallback(
    async (id: string) => {
      try {
        notify('Loading pin set…');
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
        focusHole?.(loaded.order[loaded.index]);
        notify(
          `Loaded "${loaded.label || loaded.playDate}" (${Object.keys(loaded.pins).length}/18 pins)`
        );
      } catch (err) {
        notify(err instanceof Error ? err.message : String(err), true);
      }
    },
    [focusHole, greenIndex, notify]
  );

  /** Duplicate a saved set → new draft, today, "Copy of {label}". */
  const duplicateSet = useCallback(
    async (id: string): Promise<string | null> => {
      try {
        const row = await getPinSet(id);
        const baseLabel = row.label?.trim() || row.play_date || 'pins';
        const copy: PinSession = {
          id: null,
          startHole: row.start_hole || 1,
          order: holeOrder(row.start_hole || 1),
          index: 0,
          label: `Copy of ${baseLabel}`,
          playDate: todayISO(),
          status: 'draft',
          pins: pinsFromStorage(row.pins, greenIndex),
          skipped: {},
          avoid: normalizeAvoid(row.avoid),
          publicToken: null,
        };
        const saved = await savePinSet(copy);
        setListToken((n) => n + 1);
        notify(`Duplicated as "${saved.label}"`);
        return saved.id;
      } catch (err) {
        notify(err instanceof Error ? err.message : String(err), true);
        return null;
      }
    },
    [greenIndex, notify]
  );

  const discardLocalDraft = useCallback(() => {
    clearDraft();
    setDraftAvailable(false);
    notify('Local draft discarded.');
  }, [notify]);

  const removeSavedSet = useCallback(
    async (id: string) => {
      await deletePinSet(id);
      setSession((s) => (s.id === id ? { ...s, id: null, publicToken: null } : s));
      setListToken((n) => n + 1);
      notify('Pin set deleted.');
    },
    [notify]
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
        notify('Public handout link copied.');
      } catch {
        notify(url);
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : String(err), true);
    }
  }, [doSave, notify, session.id, session.publicToken]);

  const finishToPrint = useCallback(() => {
    setSession((s) => ({ ...s, avoid: applyNotes(s) }));
    setPrinting(true);
  }, [applyNotes]);

  const onMetaChange = useCallback(
    (patch: Partial<Pick<PinSession, 'label' | 'playDate' | 'status' | 'startHole'>>) => {
      setSession((s) => ({
        ...s,
        ...patch,
        ...(patch.startHole != null
          ? { order: holeOrder(patch.startHole), index: 0 }
          : {}),
      }));
    },
    []
  );

  const setStatus = useCallback((status: PinSetStatus) => {
    setSession((s) => ({ ...s, status }));
  }, []);

  return {
    session,
    setSession,
    sessionActive,
    setSessionActive,
    currentHole,
    holeNote,
    setHoleNote,
    courseNote,
    setCourseNote,
    saveMsg,
    setSaveMsg,
    listToken,
    draftAvailable,
    setDraftAvailable,
    printing,
    setPrinting,
    readOnlyHandout,
    setReadOnlyHandout,
    sessionRef,
    applyNotes,
    applyRow,
    toggleAvoid,
    goRelative,
    jumpToHole,
    handleMapClick,
    setPinForHole,
    clearCurrentPin,
    startSession,
    startNewSession,
    endSession,
    doSave,
    loadSet,
    duplicateSet,
    discardLocalDraft,
    removeSavedSet,
    enablePublicLink,
    finishToPrint,
    onMetaChange,
    setStatus,
  };
}
