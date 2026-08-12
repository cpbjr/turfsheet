import { supabase } from './supabase';
import { toEventRow, toProductRow } from './pesticideApplication';
import type {
  CourseSettings,
  PesticideApplicationDraft,
  PesticideApplicationProduct,
  PesticideApplicationWithProducts,
  ProductLineDraft,
} from '../types';

/**
 * Course identity and location for the printed log header, backing
 * IDAPA 02.03.03.101.01(c). Returns null when unset so the header omits the line
 * rather than printing an empty label.
 */
export async function fetchCourseSettings(): Promise<CourseSettings | null> {
  const { data, error } = await supabase
    .from('course_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

/** Nested select: one event row + ordered product lines. */
export const APPLICATION_SELECT = `
  id, application_date, application_time, area_applied, area_size, method, operator_id,
  applicator_license, recommended_by, equipment_used, temperature, wind_speed, wind_direction,
  humidity, weather_conditions, worker_protection_exchange, worker_protection_requirements,
  wps_contact_name, wps_contact_date, wps_contact_time, supervisor_name, supervisor_license,
  notes, created_at, updated_at,
  products:pesticide_application_products (
    id, application_id, line_number, product_name, epa_registration_number, active_ingredient,
    manufacturer, epa_lot_number, application_rate, rate_unit, total_amount_used,
    amount_per_tank, rei_hours, target_pest, method, created_at, updated_at
  )
`;

export async function fetchPesticideApplications(): Promise<PesticideApplicationWithProducts[]> {
  const { data, error } = await supabase
    .from('pesticide_applications')
    .select(APPLICATION_SELECT)
    .order('application_date', { ascending: false })
    .order('application_time', { ascending: false, nullsFirst: false })
    .order('line_number', { referencedTable: 'pesticide_application_products', ascending: true });

  if (error) throw error;
  return (data as PesticideApplicationWithProducts[]) ?? [];
}

/**
 * Insert parent, then product lines. If the line insert fails, delete the parent
 * so we never leave a childless event (Migration B blocker).
 */
export async function insertPesticideApplication(
  draft: PesticideApplicationDraft
): Promise<string> {
  const eventRow = toEventRow(draft.event);
  const { data: parent, error: parentError } = await supabase
    .from('pesticide_applications')
    .insert(eventRow)
    .select('id')
    .single();

  if (parentError) throw parentError;
  const applicationId = parent.id as string;

  const productRows = draft.lines.map((line, i) =>
    toProductRow(line, i + 1, applicationId)
  );

  const { error: linesError } = await supabase
    .from('pesticide_application_products')
    .insert(productRows);

  if (linesError) {
    await supabase.from('pesticide_applications').delete().eq('id', applicationId);
    throw linesError;
  }

  return applicationId;
}

/**
 * Diff product lines rather than delete-all-reinsert: preserves created_at and
 * avoids a window where the event has zero lines.
 */
export async function updatePesticideApplication(
  eventId: string,
  draft: PesticideApplicationDraft,
  existingProducts: PesticideApplicationProduct[]
): Promise<void> {
  const eventRow = toEventRow(draft.event);
  const { error: eventError } = await supabase
    .from('pesticide_applications')
    .update(eventRow)
    .eq('id', eventId);
  if (eventError) throw eventError;

  const draftIds = new Set(
    draft.lines.map((l) => l.id).filter((id): id is string => Boolean(id))
  );
  const existingIds = new Set(existingProducts.map((p) => p.id));

  const toRemove = existingProducts.filter((p) => !draftIds.has(p.id)).map((p) => p.id);
  const toInsert = draft.lines.filter((l) => !l.id);

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from('pesticide_application_products')
      .delete()
      .in('id', toRemove);
    if (error) throw error;
  }

  for (let i = 0; i < draft.lines.length; i++) {
    const line = draft.lines[i];
    if (!line.id || !existingIds.has(line.id)) continue;
    const row = toProductRow(line, i + 1);
    const { error } = await supabase
      .from('pesticide_application_products')
      .update(row)
      .eq('id', line.id);
    if (error) throw error;
  }

  if (toInsert.length > 0) {
    const rows = draft.lines
      .map((line, i) => ({ line, lineNumber: i + 1 }))
      .filter(({ line }) => !line.id)
      .map(({ line, lineNumber }) => toProductRow(line, lineNumber, eventId));
    const { error } = await supabase
      .from('pesticide_application_products')
      .insert(rows);
    if (error) throw error;
  }
}

export async function deletePesticideApplication(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('pesticide_applications')
    .delete()
    .eq('id', eventId);
  if (error) throw error;
}

/** Map an existing event into form drafts. */
export function eventToDraft(
  event: PesticideApplicationWithProducts
): PesticideApplicationDraft {
  return {
    event: {
      application_date: event.application_date || '',
      application_time: event.application_time || '',
      area_applied: event.area_applied || '',
      area_size: event.area_size || '',
      method: event.method || '',
      operator_id: event.operator_id != null ? String(event.operator_id) : '',
      applicator_license: event.applicator_license || '',
      recommended_by: event.recommended_by != null ? String(event.recommended_by) : '',
      equipment_used: event.equipment_used || '',
      temperature: event.temperature || '',
      wind_speed: event.wind_speed || '',
      wind_direction: event.wind_direction || '',
      humidity: event.humidity || '',
      weather_conditions: event.weather_conditions || '',
      worker_protection_exchange: Boolean(event.worker_protection_exchange),
      worker_protection_requirements: event.worker_protection_requirements || '',
      wps_contact_name: event.wps_contact_name || '',
      wps_contact_date: event.wps_contact_date || '',
      wps_contact_time: event.wps_contact_time || '',
      supervisor_name: event.supervisor_name || '',
      supervisor_license: event.supervisor_license || '',
      notes: event.notes || '',
    },
    lines: (event.products ?? [])
      .slice()
      .sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0))
      .map((p) => productToLineDraft(p)),
  };
}

export function productToLineDraft(p: PesticideApplicationProduct): ProductLineDraft {
  return {
    key: crypto.randomUUID(),
    id: p.id,
    product_name: p.product_name || '',
    epa_registration_number: p.epa_registration_number || '',
    active_ingredient: p.active_ingredient || '',
    manufacturer: p.manufacturer || '',
    epa_lot_number: p.epa_lot_number || '',
    application_rate: p.application_rate || '',
    rate_unit: p.rate_unit || 'oz/1000sqft',
    total_amount_used: p.total_amount_used || '',
    amount_per_tank: p.amount_per_tank || '',
    rei_hours: p.rei_hours != null ? String(p.rei_hours) : '',
    target_pest: p.target_pest || '',
    method: p.method || '',
  };
}
