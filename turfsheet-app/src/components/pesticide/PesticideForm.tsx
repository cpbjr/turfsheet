import React, { useState, useEffect, useMemo } from 'react';
import { Cloud, AlertTriangle, RefreshCw } from 'lucide-react';
import type { Staff, ChemicalProduct, PesticideApplication } from '../../types';
import { getCurrentWeather } from '../../services/weather';
import type { WeatherData } from '../../types/weather';

interface PesticideFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    staffMembers: Staff[];
    products?: ChemicalProduct[];
    prefillData?: Record<string, string> | null;
    initialData?: PesticideApplication;
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

export default function PesticideForm({ onSubmit, onCancel, staffMembers, products = [], prefillData, initialData }: PesticideFormProps) {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().slice(0, 5);

    const darrylId = staffMembers.find(s => s.name === 'Darryl')?.id?.toString() || '';

    const [formData, setFormData] = useState(() => {
        if (initialData) {
            return {
                application_date: initialData.application_date || today,
                application_time: initialData.application_time || '',
                operator_id: initialData.operator_id || '',
                applicator_license: initialData.applicator_license || '',
                product_name: initialData.product_name || '',
                epa_registration_number: initialData.epa_registration_number || '',
                active_ingredient: initialData.active_ingredient || '',
                target_pest: initialData.target_pest || '',
                application_rate: initialData.application_rate || '',
                total_amount_used: initialData.total_amount_used || '',
                area_applied: initialData.area_applied || '',
                area_size: initialData.area_size || '',
                method: initialData.method || '',
                rei_hours: initialData.rei_hours?.toString() || '',
                weather_conditions: initialData.weather_conditions || '',
                temperature: initialData.temperature || '',
                wind_speed: initialData.wind_speed || '',
                wind_direction: initialData.wind_direction || '',
                humidity: initialData.humidity || '',
                notes: initialData.notes || '',
                worker_protection_exchange: initialData.worker_protection_exchange || false,
                worker_protection_requirements: initialData.worker_protection_requirements || '',
                recommended_by: initialData.recommended_by?.toString() || darrylId,
                epa_lot_number: initialData.epa_lot_number || '',
                manufacturer: initialData.manufacturer || '',
                amount_per_tank: initialData.amount_per_tank || '',
                equipment_used: initialData.equipment_used || '',
            };
        }
        return {
            application_date: today,
            application_time: now,
            operator_id: '',
            applicator_license: '',
            product_name: '',
            epa_registration_number: '',
            active_ingredient: '',
            target_pest: '',
            application_rate: '',
            total_amount_used: '',
            area_applied: '',
            area_size: '',
            method: '',
            rei_hours: '',
            weather_conditions: '',
            temperature: '',
            wind_speed: '',
            wind_direction: '',
            humidity: '',
            notes: '',
            worker_protection_exchange: false,
            worker_protection_requirements: '',
            recommended_by: darrylId,
            epa_lot_number: '',
            manufacturer: '',
            amount_per_tank: '',
            equipment_used: '',
        };
    });

    const [weatherLoaded, setWeatherLoaded] = useState(false);
    const [weatherData, setWeatherData] = useState<{ temp_f: number; wind_mph: number; precip_chance: number } | null>(null);

    const fetchWeather = async () => {
        try {
            const data: WeatherData = await getCurrentWeather();
            const tempF = Math.round(data.current.temperature_2m * 9 / 5 + 32);
            const windMph = Math.round(data.current.wind_speed_10m);
            const windDir = degreesToCardinal(data.current.wind_direction_10m);
            const humidity = data.current.relative_humidity_2m;
            const desc = weatherCodeToDescription(data.current.weather_code);
            const precipChance = data.current.precipitation_probability ??
                (data as any).daily?.precipitation_probability_max?.[0] ?? 0;

            setFormData(prev => ({
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

    // Auto-fill weather from live API on mount (skip if editing existing record)
    useEffect(() => {
        if (!initialData) {
            fetchWeather();
        }
    }, []);

    const [selectedProductId, setSelectedProductId] = useState<string>('');

    // Apply prefill data from calculator
    useEffect(() => {
        if (prefillData) {
            setFormData(prev => ({
                ...prev,
                ...Object.fromEntries(
                    Object.entries(prefillData).filter(([_, v]) => v !== '' && v !== undefined)
                ),
            }));
            const matchingProduct = products.find(p => p.name === prefillData.product_name);
            if (matchingProduct) {
                setSelectedProductId(String(matchingProduct.id));
            }
        }
    }, [prefillData]);

    const handleProductSelect = (productId: string) => {
        setSelectedProductId(productId);
        if (!productId) return;

        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return;

        setFormData(prev => ({
            ...prev,
            product_name: product.name,
            epa_registration_number: product.epa_registration || '',
            active_ingredient: product.active_ingredient || '',
            application_rate: product.default_rate
                ? `${product.default_rate} ${product.rate_unit.replace('sqft', ' sq ft')}`
                : '',
            rei_hours: product.rei_hours ? product.rei_hours.toString() : '',
            method: product.carrier_volume_gal === 0 ? 'granular' : (prev.method || 'spray'),
            manufacturer: product.manufacturer || '',
            worker_protection_requirements: product.warnings || '',
        }));
    };

    const selectedProduct = selectedProductId
        ? products.find(p => p.id === parseInt(selectedProductId))
        : null;

    const weatherAlerts = useMemo(() => {
        if (!weatherData || !selectedProductId) return [];
        const product = products.find(p => p.id === parseInt(selectedProductId));
        if (!product) return [];
        const alerts: { severity: 'danger' | 'warning'; message: string }[] = [];
        if (product.max_wind_mph && weatherData.wind_mph > product.max_wind_mph) {
            alerts.push({ severity: 'danger', message: `Wind ${weatherData.wind_mph} mph exceeds label max ${product.max_wind_mph} mph` });
        }
        if (product.max_temp_f && weatherData.temp_f > product.max_temp_f) {
            alerts.push({ severity: 'danger', message: `Temperature ${weatherData.temp_f}°F exceeds label max ${product.max_temp_f}°F` });
        }
        if (product.min_temp_f && weatherData.temp_f < product.min_temp_f) {
            alerts.push({ severity: 'danger', message: `Temperature ${weatherData.temp_f}°F below label min ${product.min_temp_f}°F` });
        }
        if (product.rain_delay_hours && weatherData.precip_chance >= 50) {
            alerts.push({ severity: 'warning', message: `${weatherData.precip_chance}% rain chance — label requires ${product.rain_delay_hours}h rain-free` });
        }
        return alerts;
    }, [weatherData, selectedProductId, products]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.worker_protection_exchange) {
            alert('Worker Protection Safety briefing must be completed before recording an application.');
            return;
        }
        const cleanedData = {
            ...formData,
            operator_id: formData.operator_id || undefined,
            applicator_license: formData.applicator_license || undefined,
            application_time: formData.application_time || undefined,
            epa_registration_number: formData.epa_registration_number || undefined,
            active_ingredient: formData.active_ingredient || undefined,
            target_pest: formData.target_pest || undefined,
            total_amount_used: formData.total_amount_used || undefined,
            area_size: formData.area_size || undefined,
            method: formData.method || undefined,
            rei_hours: formData.rei_hours ? parseInt(formData.rei_hours) : undefined,
            weather_conditions: formData.weather_conditions || undefined,
            temperature: formData.temperature || undefined,
            wind_speed: formData.wind_speed || undefined,
            wind_direction: formData.wind_direction || undefined,
            humidity: formData.humidity || undefined,
            notes: formData.notes || undefined,
            recommended_by: formData.recommended_by ? parseInt(formData.recommended_by) : undefined,
            epa_lot_number: formData.epa_lot_number || undefined,
            manufacturer: formData.manufacturer || undefined,
            amount_per_tank: formData.amount_per_tank || undefined,
            equipment_used: formData.equipment_used || undefined,
            worker_protection_requirements: formData.worker_protection_requirements || undefined,
        };
        onSubmit(cleanedData);
    };

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

    const SIGNAL_COLORS: Record<string, string> = {
        CAUTION: 'bg-yellow-50 border-yellow-400 text-yellow-800',
        WARNING: 'bg-orange-50 border-orange-400 text-orange-800',
        DANGER: 'bg-red-50 border-red-400 text-red-800',
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Library Selection */}
            {products.length > 0 && (
                <div className="bg-turf-green-light border border-turf-green/30 p-4">
                    <label className={labelClasses}>Select from Product Library</label>
                    <select
                        className={inputClasses}
                        value={selectedProductId}
                        onChange={(e) => handleProductSelect(e.target.value)}
                    >
                        <option value="">-- Type manually or select a product --</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.signal_word ? `[${p.signal_word}]` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Warnings for selected product */}
            {selectedProduct && (selectedProduct.warnings || selectedProduct.signal_word) && (
                <div className={`border-l-4 p-3 text-xs ${SIGNAL_COLORS[selectedProduct.signal_word || 'CAUTION']}`}>
                    <p className="font-heading font-black uppercase tracking-wider text-[0.6rem] mb-1">
                        {selectedProduct.signal_word || 'CAUTION'} — {selectedProduct.name}
                    </p>
                    {selectedProduct.warnings && (
                        <p className="font-sans leading-relaxed">{selectedProduct.warnings}</p>
                    )}
                </div>
            )}

            {/* Weather safety warnings */}
            {weatherAlerts.length > 0 && (
                <div className="space-y-2">
                    {weatherAlerts.map((alert, i) => (
                        <div key={i} className={`flex items-center gap-3 px-4 py-3 text-sm ${
                            alert.severity === 'danger' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
                        }`}>
                            <AlertTriangle size={16} className="flex-shrink-0" />
                            <span>{alert.message}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Row 1: Date | Time | Operator */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelClasses}>Application Date *</label>
                    <input
                        required
                        type="date"
                        className={inputClasses}
                        value={formData.application_date}
                        onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Application Time</label>
                    <input
                        type="time"
                        className={inputClasses}
                        value={formData.application_time}
                        onChange={(e) => setFormData({ ...formData, application_time: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Operator *</label>
                    <select
                        required
                        className={inputClasses}
                        value={formData.operator_id}
                        onChange={(e) => setFormData({ ...formData, operator_id: e.target.value })}
                    >
                        <option value="">Select operator...</option>
                        {staffMembers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
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
                        checked={formData.worker_protection_exchange}
                        onChange={(e) => setFormData({ ...formData, worker_protection_exchange: e.target.checked })}
                    />
                    <span className="text-sm font-heading font-black uppercase tracking-wider text-amber-800">
                        Worker Protection Safety briefing completed *
                    </span>
                </label>
                {formData.worker_protection_requirements && (
                    <p className="mt-2 text-xs text-amber-700 font-sans leading-relaxed pl-8">
                        <strong>Label Requirements:</strong> {formData.worker_protection_requirements}
                    </p>
                )}
            </div>

            {/* Applicator License (Idaho requirement) */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Applicator License # (Idaho)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. ID-12345"
                        value={formData.applicator_license}
                        onChange={(e) => setFormData({ ...formData, applicator_license: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Target Pest / Purpose</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Dollar spot, broadleaf weeds"
                        value={formData.target_pest}
                        onChange={(e) => setFormData({ ...formData, target_pest: e.target.value })}
                    />
                </div>
            </div>

            {/* Recommended By (Pesticide Recommendation) */}
            <div>
                <label className={labelClasses}>Pesticide Recommendation By</label>
                <select
                    className={inputClasses}
                    value={formData.recommended_by}
                    onChange={(e) => setFormData({ ...formData, recommended_by: e.target.value })}
                >
                    <option value="">Select staff...</option>
                    {staffMembers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            {/* Product | EPA # */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Product Name *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Primo Maxx"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>EPA Registration #</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 100-1164"
                        value={formData.epa_registration_number}
                        onChange={(e) => setFormData({ ...formData, epa_registration_number: e.target.value })}
                    />
                </div>
            </div>

            {/* EPA Lot Number | Manufacturer */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>EPA Lot Number</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="From product container"
                        value={formData.epa_lot_number}
                        onChange={(e) => setFormData({ ...formData, epa_lot_number: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Manufacturer</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Syngenta"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                </div>
            </div>

            {/* Active Ingredient */}
            <div>
                <label className={labelClasses}>Active Ingredient</label>
                <input
                    type="text"
                    className={inputClasses}
                    placeholder="e.g. Trinexapac-ethyl"
                    value={formData.active_ingredient}
                    onChange={(e) => setFormData({ ...formData, active_ingredient: e.target.value })}
                />
            </div>

            {/* Application Rate | Total Amount */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Application Rate *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 2 oz/1000 sq ft"
                        value={formData.application_rate}
                        onChange={(e) => setFormData({ ...formData, application_rate: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Total Amount Used</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 32 oz"
                        value={formData.total_amount_used}
                        onChange={(e) => setFormData({ ...formData, total_amount_used: e.target.value })}
                    />
                </div>
            </div>

            {/* Amount per Tank */}
            <div>
                <label className={labelClasses}>Amount per Tank</label>
                <input
                    type="text"
                    className={inputClasses}
                    placeholder="e.g., 32 oz"
                    value={formData.amount_per_tank}
                    onChange={(e) => setFormData({ ...formData, amount_per_tank: e.target.value })}
                />
            </div>

            {/* Area Applied | Area Size */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Area / Location Applied *</label>
                    <input
                        required
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. Greens 1-9, Fairway 5"
                        value={formData.area_applied}
                        onChange={(e) => setFormData({ ...formData, area_applied: e.target.value })}
                    />
                </div>
                <div>
                    <label className={labelClasses}>Area Size (sq ft or acres)</label>
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder="e.g. 45,000 sq ft"
                        value={formData.area_size}
                        onChange={(e) => setFormData({ ...formData, area_size: e.target.value })}
                    />
                </div>
            </div>

            {/* Method | REI Hours */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Application Method</label>
                    <select
                        className={inputClasses}
                        value={formData.method}
                        onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    >
                        <option value="">Select method...</option>
                        <option value="spray">Spray</option>
                        <option value="granular">Granular</option>
                        <option value="injection">Injection</option>
                        <option value="drench">Drench</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div>
                    <label className={labelClasses}>REI (Hours)</label>
                    <input
                        type="number"
                        min="0"
                        className={inputClasses}
                        placeholder="Hours"
                        value={formData.rei_hours}
                        onChange={(e) => setFormData({ ...formData, rei_hours: e.target.value })}
                    />
                </div>
            </div>

            {/* Equipment Used */}
            <div>
                <label className={labelClasses}>Equipment Used</label>
                <select
                    className={inputClasses}
                    value={formData.equipment_used}
                    onChange={(e) => setFormData({ ...formData, equipment_used: e.target.value })}
                >
                    <option value="">Select equipment...</option>
                    <option value="Spray Rig">Spray Rig</option>
                    <option value="Backpack Sprayer">Backpack Sprayer</option>
                    <option value="Spreader">Spreader</option>
                    <option value="Boom Sprayer">Boom Sprayer</option>
                    <option value="Hand Sprayer">Hand Sprayer</option>
                </select>
            </div>

            {/* Weather Conditions - Idaho compliance */}
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
                            value={formData.temperature}
                            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Wind Speed (mph)</label>
                        <input
                            type="text"
                            className={inputClasses}
                            placeholder="e.g. 5"
                            value={formData.wind_speed}
                            onChange={(e) => setFormData({ ...formData, wind_speed: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className={labelClasses}>Wind Direction</label>
                        <select
                            className={inputClasses}
                            value={formData.wind_direction}
                            onChange={(e) => setFormData({ ...formData, wind_direction: e.target.value })}
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
                            value={formData.humidity}
                            onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Sky Conditions</label>
                        <select
                            className={inputClasses}
                            value={formData.weather_conditions}
                            onChange={(e) => setFormData({ ...formData, weather_conditions: e.target.value })}
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

            {/* Notes */}
            <div>
                <label className={labelClasses}>Notes</label>
                <textarea
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    placeholder="Additional notes about this application..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
            </div>

            {/* Buttons */}
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
