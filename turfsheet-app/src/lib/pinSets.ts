/**
 * Persistence for pin sheets: Supabase (turfsheet.banbury_pin_sets) plus the
 * localStorage draft the standalone map used to survive a reload mid-session.
 */

import { supabase } from '@/lib/supabase';
import { pinsForStorage } from '@/lib/courseGeometry';
import type { PinSession, PinSetRow, PinSetSummary } from '@/types/courseMap';

const TABLE = 'banbury_pin_sets';
export const PIN_STORAGE_KEY = 'banbury_pin_draft_v1';

/** Lists saved sets for the panel, newest play date first. */
export async function listPinSets(): Promise<PinSetSummary[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id,play_date,label,status,start_hole,public_token,updated_at')
    .order('play_date', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(40);
  if (error) throw new Error(error.message);
  return (data ?? []) as PinSetSummary[];
}

export async function getPinSet(id: string): Promise<PinSetRow> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Set not found');
  return data as PinSetRow;
}

/** Inserts or updates, depending on whether the session already has an id. */
export async function savePinSet(session: PinSession): Promise<PinSetRow> {
  const body = {
    play_date: session.playDate,
    label: session.label || '',
    status: session.status || 'draft',
    start_hole: session.startHole || 1,
    pins: pinsForStorage(session.pins),
    avoid: session.avoid,
    public_token: session.publicToken || null,
    created_by: 'turfsheet-maps',
  };

  const query = session.id
    ? supabase.from(TABLE).update(body).eq('id', session.id).select().single()
    : supabase.from(TABLE).insert(body).select().single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  if (!data) throw new Error('No row returned from save');
  return data as PinSetRow;
}

export async function setPublicToken(id: string, token: string): Promise<PinSetRow> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ public_token: token })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as PinSetRow;
}

/** Resolves a clubhouse handout link. Returns null when the token is unknown or expired. */
export async function pinSetByToken(token: string): Promise<PinSetRow | null> {
  const { data, error } = await supabase.rpc('banbury_pin_set_by_token', { p_token: token });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as PinSetRow[];
  return rows[0] ?? null;
}

export function randomToken(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (
      crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    );
  }
  let s = '';
  for (let i = 0; i < 40; i++) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

/** Handout URL for a token — same-origin, on the Maps route. */
export function handoutUrl(token: string): string {
  const path = window.location.pathname.replace(/\/$/, '');
  return `${window.location.origin}${path}?pinToken=${encodeURIComponent(token)}`;
}

/* ---------- localStorage draft ---------- */

export interface DraftPayload extends PinSession {
  active: boolean;
  savedAt: string;
}

export function saveDraft(session: PinSession, active: boolean): void {
  try {
    localStorage.setItem(
      PIN_STORAGE_KEY,
      JSON.stringify({ ...session, active, savedAt: new Date().toISOString() })
    );
  } catch {
    /* quota — the draft is a convenience, not a requirement */
  }
}

export function loadDraft(): DraftPayload | null {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftPayload;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(PIN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function draftHasPins(draft: DraftPayload | null): boolean {
  return !!(draft && draft.pins && Object.keys(draft.pins).length > 0);
}
