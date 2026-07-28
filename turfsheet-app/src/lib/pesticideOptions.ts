export interface OptionDef {
    value: string;
    label: string;
}

/**
 * Canonical application method vocabulary offered by the UI.
 * The DB no longer constrains `method` to this list - the form has an "Other"
 * free-text escape hatch so a missing option never blocks logging an application.
 */
export const METHOD_OPTIONS: OptionDef[] = [
    { value: 'spray', label: 'Spray' },
    { value: 'granular', label: 'Granular' },
    { value: 'broadcast_by_hand', label: 'Broadcast (By Hand)' },
    { value: 'spot_treatment', label: 'Spot Treatment' },
    { value: 'aquatic_treatment', label: 'Aquatic / Water Treatment' },
    { value: 'injection', label: 'Injection' },
    { value: 'drench', label: 'Drench' },
];

export const EQUIPMENT_OPTIONS: OptionDef[] = [
    { value: 'Spray Rig', label: 'Spray Rig' },
    { value: 'Boom Sprayer', label: 'Boom Sprayer' },
    { value: 'Backpack Sprayer', label: 'Backpack Sprayer' },
    { value: 'Hand Sprayer', label: 'Hand Sprayer' },
    { value: 'Spreader', label: 'Spreader' },
    { value: 'Hand Spreader', label: 'Hand Spreader' },
    { value: 'Push Spreader', label: 'Push Spreader' },
    { value: 'ATV/Utility Spreader', label: 'ATV/Utility Spreader' },
    { value: 'By Hand', label: 'By Hand' },
];

/**
 * Render a stored method value. Known slugs map to their label; anything else
 * (free text entered via "Other") is title-cased rather than mangled.
 */
export function formatMethod(method?: string | null): string {
    if (!method) return '--';
    const known = METHOD_OPTIONS.find(o => o.value === method);
    if (known) return known.label;
    return method
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}
