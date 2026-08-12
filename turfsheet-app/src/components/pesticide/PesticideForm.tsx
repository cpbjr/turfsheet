import React, { useEffect, useMemo, useState } from 'react';
import { Cloud, Plus, RefreshCw } from 'lucide-react';
import type {
    CalculatorRecordPayload,
    ChemicalProduct,
    EventDraft,
    PesticideApplicationDraft,
    PesticideApplicationWithProducts,
    ProductLineDraft,
    Staff,
} from '../../types';
import { getCurrentWeather } from '../../services/weather';
import type { WeatherData } from '../../types/weather';
import SelectWithOther from '../ui/SelectWithOther';
import { METHOD_OPTIONS, EQUIPMENT_OPTIONS } from '../../lib/pesticideOptions';
import { blankProductLine, reconcileMethods } from '../../lib/pesticideApplication';
import { eventToDraft } from '../../lib/pesticideData';
import { sameId } from '../../lib/utils';
import ProductLineFields from './ProductLineFields';

interface PesticideFormProps {
    onSubmit: (draft: PesticideApplicationDraft) => void;
    onCancel: () => void;
    staffMembers: Staff[];
    products?: ChemicalProduct[];
    /** Prefill from Spray Calculator (event + lines). */
    calculatorPrefill?: CalculatorRecordPayload | null;
    initialData?: PesticideApplicationWithProducts;
}

function degreesToCardinal(deg: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
}

function weatherCodeToDescription(code: number): string {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Overcast';
    if (code <= 67) return 'Rain';
    if (code <= 82) return 'Rain Showers';
    return 'Other';
}

function blankEvent(darrylId: string): EventDraft {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);
    return {
        application_date: today,
        application_time: now,
        area_applied: '',
        area_size: '',
        method: '',
        operator_id: '',
        applicator_license: '',
        recommended_by: darrylId,
        equipment_used: '',
        temperature: '',
        wind_speed: '',
        wind_direction: '',
        humidity: '',
        weather_conditions: '',
        worker_protection_exchange: false,
        worker_protection_requirements: '',
        wps_contact_name: '',
        wps_contact_date: today,
        wps_contact_time: now,
        supervisor_name: '',
        supervisor_license: '',
        notes: '',
    };
}

export default function PesticideForm({
    onSubmit,
    onCancel,
    staffMembers,
    products = [],
    calculatorPrefill,
    initialData,
}: PesticideFormProps) {
    const darrylId = staffMembers.find((s) => s.name === 'Darryl')?.id?.toString() || '';

    const [event, setEvent] = useState<EventDraft>(() => {
        if (initialData) return eventToDraft(initialData).event;
        return blankEvent(darrylId);
    });

    const [lines, setLines] = useState<ProductLineDraft[]>(() => {
        if (initialData) {
            const d = eventToDraft(initialData);
            return d.lines.length > 0 ? d.lines : [blankProductLine()];
        }
        return [blankProductLine()];
    });

    /** Library selection id per line key */
    const [selectedProductIds, setSelectedProductIds] = useState<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        if (initialData) {
            for (const p of initialData.products ?? []) {
                const match = products.find((lib) => lib.name === p.product_name);
                // keys assigned in eventToDraft; rematch by name after first render via effect
                if (match) {
                    // filled after lines mount — see effect below
                }
            }
        }
        return map;
    });

    const [weatherLoaded, setWeatherLoaded] = useState(false);
    const [weatherData, setWeatherData] = useState<{
        temp_f: number;
        wind_mph: number;
        precip_chance: number;
    } | null>(null);

    // Match library products when editing
    useEffect(() => {
        if (!initialData) return;
        const map: Record<string, string> = {};
        const draft = eventToDraft(initialData);
        draft.lines.forEach((line, i) => {
            const src = initialData.products?.[i];
            const match = products.find((p) => p.name === (src?.product_name || line.product_name));
            if (match) map[line.key] = String(match.id);
        });
        // Re-seed lines so keys match the map
        setLines(draft.lines.length > 0 ? draft.lines : [blankProductLine()]);
        setSelectedProductIds(map);
    }, [initialData, products]);

    const fetchWeather = async () => {
        try {
            const data: WeatherData = await getCurrentWeather();
            const tempF = Math.round((data.current.temperature_2m * 9) / 5 + 32);
            const windMph = Math.round(data.current.wind_speed_10m);
            const windDir = degreesToCardinal(data.current.wind_direction_10m);
            const humidity = data.current.relative_humidity_2m;
            const desc = weatherCodeToDescription(data.current.weather_code);
            const daily = data as WeatherData & {
                daily?: { precipitation_probability_max?: number[] };
            };
            const precipChance =
                data.current.precipitation_probability ??
                daily.daily?.precipitation_probability_max?.[0] ??
                0;

            setEvent((prev) => ({
                ...prev,
                temperature: String(tempF),
                wind_speed: String(windMph),
                wind_direction: windDir,
                humidity: String(humidity),
                weather_conditions: desc,
            }));
            setWeatherData({ temp_f: tempF, wind_mph: windMph, precip_chance: precipChance });
            setWeatherLoaded(true);
        } catch (err) {
            console.warn('Weather auto-fill failed:', err);
        }
    };

    useEffect(() => {
        if (!initialData) {
            fetchWeather();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculator prefill
    useEffect(() => {
        if (!calculatorPrefill) return;
        const { event: eventPartial, lines: linePartials } = calculatorPrefill;
        setEvent((prev) => {
            const next = { ...prev };
            for (const [k, v] of Object.entries(eventPartial ?? {})) {
                if (v !== '' && v !== undefined) {
                    (next as Record<string, unknown>)[k] = v;
                }
            }
            return next;
        });
        if (linePartials && linePartials.length > 0) {
            const nextLines = linePartials.map((partial) => ({
                ...blankProductLine(),
                ...partial,
                key: crypto.randomUUID(),
            }));
            setLines(nextLines);
            const map: Record<string, string> = {};
            for (const line of nextLines) {
                const match = products.find((p) => p.name === line.product_name);
                if (match) map[line.key] = String(match.id);
            }
            setSelectedProductIds(map);
        }
    }, [calculatorPrefill, products]);

    const updateLine = (key: string, patch: Partial<ProductLineDraft>) => {
        setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
    };

    const handleProductSelect = (key: string, productId: string) => {
        setSelectedProductIds((prev) => ({ ...prev, [key]: productId }));
        if (!productId) return;
        const product = products.find((p) => String(p.id) === productId);
        if (!product) return;

        const method = product.carrier_volume_gal === 0 ? 'granular' : 'spray';
        updateLine(key, {
            product_name: product.name,
            epa_registration_number: product.epa_registration || '',
            active_ingredient: product.active_ingredient || '',
            application_rate: product.default_rate
                ? `${product.default_rate} ${product.rate_unit.replace('sqft', ' sq ft')}`
                : '',
            rei_hours: product.rei_hours != null ? product.rei_hours.toString() : '',
            method,
            manufacturer: product.manufacturer || '',
        });

        // Aggregate WPS warnings across lines (deduped); only set when changed
        const warning = (product.warnings || '').trim();
        if (warning) {
            setEvent((prev) => {
                const existing = (prev.worker_protection_requirements || '')
                    .split(/\n---\n/)
                    .map((s) => s.trim())
                    .filter(Boolean);
                if (existing.includes(warning)) return prev;
                const next = [...existing, warning].join('\n---\n');
                if (next === prev.worker_protection_requirements) return prev;
                return { ...prev, worker_protection_requirements: next };
            });
        }
    };

    const alertsByLineKey = useMemo(() => {
        const map: Record<string, { severity: 'danger' | 'warning'; message: string }[]> = {};
        if (!weatherData) return map;
        for (const line of lines) {
            const productId = selectedProductIds[line.key];
            if (!productId) continue;
            const product = products.find((p) => String(p.id) === productId);
            if (!product) continue;
            const prefix = (line.product_name || product.name || 'Product').trim();
            const alerts: { severity: 'danger' | 'warning'; message: string }[] = [];
            if (product.max_wind_mph && weatherData.wind_mph > product.max_wind_mph) {
                alerts.push({
                    severity: 'danger',
                    message: `${prefix}: Wind ${weatherData.wind_mph} mph exceeds label max ${product.max_wind_mph} mph`,
                });
            }
            if (product.max_temp_f && weatherData.temp_f > product.max_temp_f) {
                alerts.push({
                    severity: 'danger',
                    message: `${prefix}: Temperature ${weatherData.temp_f}°F exceeds label max ${product.max_temp_f}°F`,
                });
            }
            if (product.min_temp_f && weatherData.temp_f < product.min_temp_f) {
                alerts.push({
                    severity: 'danger',
                    message: `${prefix}: Temperature ${weatherData.temp_f}°F below label min ${product.min_temp_f}°F`,
                });
            }
            if (product.rain_delay_hours && weatherData.precip_chance >= 50) {
                alerts.push({
                    severity: 'warning',
                    message: `${prefix}: ${weatherData.precip_chance}% rain chance — label requires ${product.rain_delay_hours}h rain-free`,
                });
            }
            if (alerts.length) map[line.key] = alerts;
        }
        return map;
    }, [weatherData, lines, selectedProductIds, products]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!event.worker_protection_exchange) {
            alert(
                'Worker Protection Safety briefing must be completed before recording an application.'
            );
            return;
        }

        // Drop lines blank in both name and rate
        const surviving = lines.filter(
            (l) => l.product_name.trim() !== '' || l.application_rate.trim() !== ''
        );
        if (surviving.length === 0) {
            alert('Add at least one product with a name and application rate.');
            return;
        }

        for (let i = 0; i < surviving.length; i++) {
            const l = surviving[i];
            if (!l.product_name.trim() || !l.application_rate.trim()) {
                alert(
                    `Product line ${i + 1} is incomplete — both product name and application rate are required.`
                );
                return;
            }
        }

        const names = surviving.map((l) => l.product_name.trim().toLowerCase());
        const dupes = names.filter((n, i) => names.indexOf(n) !== i);
        if (dupes.length > 0) {
            const ok = window.confirm(
                `Duplicate product name(s): ${[...new Set(dupes)].join(', ')}. Double-dosing in one visit is unusual but allowed. Continue?`
            );
            if (!ok) return;
        }

        const reconciled = reconcileMethods(surviving, event.method);
        onSubmit({
            event: { ...event, method: reconciled.eventMethod },
            lines: reconciled.lines,
        });
    };

    const addLine = () => setLines((prev) => [...prev, blankProductLine()]);
    const removeLine = (key: string) => {
        setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
        setSelectedProductIds((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const inputClasses =
        'w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans';
    const labelClasses =
        'block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2';

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Date | Time | Operator */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelClasses}>Application Date *</label>
                    <input
                        required
                        type="date"
                        className={inputClasses}
                        value={event.application_date}
                        onChange={(e) => setEvent({ ...event, application_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Application Time</label>
                    <input
                        type="time"
                        className={inputClasses}
                        value={event.application_time}
                        onChange={(e) => setEvent({ ...event, application_time: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Operator *</label>
                    <select
                        required
                        className={inputClasses}
                        value={event.operator_id}
                        onChange={(e) => {
                            // IDAPA 02.03.03.101.01(m): the license is the applicator's, so it
                            // autofills here rather than being retyped per application -- which
                            // is why it was blank on every historical record.
                            const picked = staffMembers.find((s) => sameId(s.id, e.target.value));
                            setEvent({
                                ...event,
                                operator_id: e.target.value,
                                applicator_license:
                                    picked?.applicator_license || event.applicator_license,
                            });
                        }}
                    >
                        <option value="">Select operator...</option>
                        {staffMembers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Worker Protection Exchange (WPS) */}
            <div className="bg-amber-50 border border-amber-300 p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        className="w-5 h-5 accent-turf-green"
                        checked={event.worker_protection_exchange}
                        onChange={(e) =>
                            setEvent({ ...event, worker_protection_exchange: e.target.checked })
                        }
                    />
                    <span className="text-sm font-heading font-black uppercase tracking-wider text-amber-800">
                        Worker Protection Safety briefing completed *
                    </span>
                </label>
                {event.worker_protection_requirements && (
                    <p className="mt-2 text-xs text-amber-700 font-sans leading-relaxed pl-8">
                        <strong>Label Requirements:</strong> {event.worker_protection_requirements}
                    </p>
                )}
                {/* IDAPA 02.03.03.101.01(o) requires the name of the grower or operator
                    contacted plus the date and time of contact -- a checkbox alone does not
                    satisfy the element. */}
                {event.worker_protection_exchange && (
                    <div className="mt-4 grid grid-cols-3 gap-4 pl-8">
                        <div>
                            <label className={labelClasses}>Contact Name *</label>
                            <input
                                required
                                type="text"
                                className={inputClasses}
                                placeholder="Grower or operator contacted"
                                value={event.wps_contact_name}
                                onChange={(e) =>
                                    setEvent({ ...event, wps_contact_name: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Contact Date *</label>
                            <input
                                required
                                type="date"
                                className={inputClasses}
                                value={event.wps_contact_date}
                                onChange={(e) =>
                                    setEvent({ ...event, wps_contact_date: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Contact Time *</label>
                            <input
                                required
                                type="time"
                                className={inputClasses}
                                value={event.wps_contact_time}
                                onChange={(e) =>
                                    setEvent({ ...event, wps_contact_time: e.target.value })
                                }
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Applicator License # (Idaho)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. ID-12345"
                        value={event.applicator_license}
                        onChange={(e) =>
                            setEvent({ ...event, applicator_license: e.target.value })
                        }
                    />
                    <p className="mt-1 text-[0.65rem] text-text-secondary font-sans">
                        Autofills from the operator&rsquo;s staff record. Editable for this
                        application.
                    </p>
                </div>
                <div>
                    <label className={labelClasses}>Pesticide Recommendation By</label>
                    <select
                        className={inputClasses}
                        value={event.recommended_by}
                        onChange={(e) => setEvent({ ...event, recommended_by: e.target.value })}
                    >
                        <option value="">Select staff...</option>
                        {staffMembers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Area + event method */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Area / Location Applied *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Greens 1-9, Fairway 5"
                        value={event.area_applied}
                        onChange={(e) => setEvent({ ...event, area_applied: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Area Size (sq ft or acres)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 45,000 sq ft"
                        value={event.area_size}
                        onChange={(e) => setEvent({ ...event, area_size: e.target.value })}
                    />
                </div>
            </div>

            {/* IDAPA 02.03.03.101.01(n): required only when the applicator holds the
                Apprentice Category (CA). Optional here -- not known to apply at Banbury,
                but the record is conforming if it ever does. */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Supervising Applicator (if apprentice)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="Leave blank if not applicable"
                        value={event.supervisor_name}
                        onChange={(e) => setEvent({ ...event, supervisor_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Supervisor License #</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="Leave blank if not applicable"
                        value={event.supervisor_license}
                        onChange={(e) => setEvent({ ...event, supervisor_license: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <SelectWithOther
                    label="Application Method"
                    options={METHOD_OPTIONS}
                    value={event.method}
                    onChange={(v) => setEvent({ ...event, method: v })}
                    placeholder="Select method..."
                    otherPlaceholder="Describe the method..."
                    inputClasses={inputClasses}
                    labelClasses={labelClasses}
                />
                <SelectWithOther
                    label="Equipment Used"
                    options={EQUIPMENT_OPTIONS}
                    value={event.equipment_used}
                    onChange={(v) => setEvent({ ...event, equipment_used: v })}
                    placeholder="Select equipment..."
                    otherPlaceholder="Describe the equipment..."
                    inputClasses={inputClasses}
                    labelClasses={labelClasses}
                />
            </div>

            {/* Product lines */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest">
                        Products in this application
                    </p>
                    <button
                        type="button"
                        onClick={addLine}
                        className="flex items-center gap-1.5 text-xs font-heading font-black uppercase tracking-wider text-turf-green hover:text-turf-green-dark"
                    >
                        <Plus size={14} />
                        Add product
                    </button>
                </div>
                {lines.map((line, index) => (
                    <ProductLineFields
                        key={line.key}
                        line={line}
                        index={index}
                        products={products}
                        canRemove={lines.length > 1}
                        weatherAlerts={alertsByLineKey[line.key] || []}
                        selectedProductId={selectedProductIds[line.key] || ''}
                        onChange={(patch) => updateLine(line.key, patch)}
                        onProductSelect={(id) => handleProductSelect(line.key, id)}
                        onRemove={() => removeLine(line.key)}
                        inputClasses={inputClasses}
                        labelClasses={labelClasses}
                    />
                ))}
            </div>

            {/* Weather Conditions */}
            <div className="border-t border-border-color pt-4">
                <div className="flex items-center gap-2 mb-3">
                    <p className="text-[0.6rem] font-heading font-black text-text-secondary uppercase tracking-widest">
                        Weather Conditions at Time of Application
                    </p>
                    {weatherLoaded && (
                        <span className="flex items-center gap-1 text-[0.55rem] text-turf-green font-sans bg-turf-green-light px-2 py-0.5">
                            <Cloud className="w-3 h-3" /> Auto-filled from live weather
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={fetchWeather}
                        className="text-text-secondary hover:text-turf-green transition-colors ml-1"
                        title="Refresh weather"
                    >
                        <RefreshCw size={13} />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClasses}>Temperature (F)</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="e.g. 72"
                            value={event.temperature}
                            onChange={(e) => setEvent({ ...event, temperature: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Wind Speed (mph)</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="e.g. 5"
                            value={event.wind_speed}
                            onChange={(e) => setEvent({ ...event, wind_speed: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClasses}>Wind Direction</label>
                        <select
                            className={inputClasses}
                            value={event.wind_direction}
                            onChange={(e) =>
                                setEvent({ ...event, wind_direction: e.target.value })
                            }
                        >
                            <option value="">Select...</option>
                            <option value="N">North</option>
                            <option value="NE">Northeast</option>
                            <option value="E">East</option>
                            <option value="SE">Southeast</option>
                            <option value="S">South</option>
                            <option value="SW">Southwest</option>
                            <option value="W">West</option>
                            <option value="NW">Northwest</option>
                            <option value="Calm">Calm</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClasses}>Humidity %</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="e.g. 45"
                            value={event.humidity}
                            onChange={(e) => setEvent({ ...event, humidity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Sky Conditions</label>
                        <select
                            className={inputClasses}
                            value={event.weather_conditions}
                            onChange={(e) =>
                                setEvent({ ...event, weather_conditions: e.target.value })
                            }
                        >
                            <option value="">Select...</option>
                            <option value="Clear">Clear</option>
                            <option value="Partly Cloudy">Partly Cloudy</option>
                            <option value="Overcast">Overcast</option>
                            <option value="Light Rain">Light Rain</option>
                            <option value="Rain">Rain</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <label className={labelClasses}>Notes</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Additional notes about this application..."
                    value={event.notes}
                    onChange={(e) => setEvent({ ...event, notes: e.target.value })}
                />
            </div>

            <div className="pt-4 flex gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-6 py-4 border border-border-color text-text-secondary font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-dashboard-bg transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-turf-green text-white font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-turf-green-dark transition-colors shadow-sm"
                >
                    {initialData ? 'Update Application' : 'Record Application'}
                </button>
            </div>
        </form>
    );
}
