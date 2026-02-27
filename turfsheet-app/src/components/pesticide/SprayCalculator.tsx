import { useState, useEffect, useMemo } from 'react';
import { Calculator, FlaskConical, AlertTriangle, Wind, Thermometer, CloudRain, Droplets, Compass, RefreshCw, ClipboardList, Printer, Save, Plus, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getCurrentWeather } from '../../services/weather';
import type { ChemicalProduct, SprayMixTemplate } from '../../types';
import type { WeatherData } from '../../types/weather';

interface MixItem {
    productId: number | '';
    rate: string;
    rateUnit: string;
}

interface CurrentConditions {
    temp_f: number;
    wind_mph: number;
    wind_direction: string;
    humidity: number;
    description: string;
    precip_chance: number;
}

interface SprayCalculatorProps {
    onRecordApplication?: (data: Record<string, string>) => void;
}

function degreesToCardinal(deg: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
}

function weatherCodeToDescription(code: number): string {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Overcast/Fog';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain Showers';
    if (code <= 86) return 'Snow Showers';
    if (code >= 95) return 'Thunderstorm';
    return 'Unknown';
}

const SIGNAL_COLORS: Record<string, string> = {
    CAUTION: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    WARNING: 'bg-orange-100 border-orange-400 text-orange-800',
    DANGER: 'bg-red-100 border-red-400 text-red-800',
};

export default function SprayCalculator({ onRecordApplication }: SprayCalculatorProps) {
    const [products, setProducts] = useState<ChemicalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [areaSqft, setAreaSqft] = useState('');
    const [tankSizeGal, setTankSizeGal] = useState('');
    const [carrierRate, setCarrierRate] = useState('2');
    const [mixItems, setMixItems] = useState<MixItem[]>([{ productId: '', rate: '', rateUnit: 'oz/1000sqft' }]);
    const [conditions, setConditions] = useState<CurrentConditions | null>(null);

    // Template state
    const [templates, setTemplates] = useState<SprayMixTemplate[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDesc, setTemplateDesc] = useState('');
    const [showLoadDropdown, setShowLoadDropdown] = useState(false);

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

    const fetchWeather = async () => {
        try {
            const data: WeatherData = await getCurrentWeather();
            setConditions({
                temp_f: Math.round(data.current.temperature_2m * 9 / 5 + 32),
                wind_mph: Math.round(data.current.wind_speed_10m),
                wind_direction: degreesToCardinal(data.current.wind_direction_10m),
                humidity: data.current.relative_humidity_2m,
                description: weatherCodeToDescription(data.current.weather_code),
                precip_chance: data.current.precipitation_probability ??
                    data.daily.precipitation_probability_max?.[0] ?? 0,
            });
        } catch (err) {
            console.warn('Weather fetch failed:', err);
        }
    };

    const fetchTemplates = async () => {
        const { data } = await supabase
            .from('spray_mix_templates')
            .select('*')
            .order('name');
        if (data) setTemplates(data as SprayMixTemplate[]);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            const { data } = await supabase
                .from('chemical_products')
                .select('*')
                .eq('is_active', true)
                .order('name');
            setProducts(data || []);
            setLoading(false);
        };
        fetchProducts();
        fetchWeather();
        fetchTemplates();
    }, []);

    const handleProductSelect = (index: number, productId: string) => {
        const updated = [...mixItems];
        const id = productId ? parseInt(productId) : '';
        updated[index].productId = id;

        if (id) {
            const product = products.find(p => p.id === id);
            if (product) {
                updated[index].rate = product.default_rate?.toString() || '';
                updated[index].rateUnit = product.rate_unit;
                if (index === 0 && product.carrier_volume_gal) {
                    setCarrierRate(product.carrier_volume_gal.toString());
                }
            }
        }
        setMixItems(updated);
    };

    const addMixItem = () => {
        setMixItems([...mixItems, { productId: '', rate: '', rateUnit: 'oz/1000sqft' }]);
    };

    const removeMixItem = (index: number) => {
        if (mixItems.length <= 1) return;
        setMixItems(mixItems.filter((_, i) => i !== index));
    };

    // Collect all selected products for warnings display
    const selectedProducts = useMemo(() => {
        return mixItems
            .filter(item => item.productId !== '')
            .map(item => products.find(p => p.id === item.productId))
            .filter((p): p is ChemicalProduct => !!p);
    }, [mixItems, products]);

    // Check for weather conflicts with selected products
    const weatherAlerts = useMemo(() => {
        if (!conditions) return [];
        const alerts: { product: string; message: string; severity: 'warning' | 'danger' }[] = [];

        selectedProducts.forEach(product => {
            if (product.max_wind_mph && conditions.wind_mph > product.max_wind_mph) {
                alerts.push({
                    product: product.name,
                    message: `Current wind ${conditions.wind_mph} mph ${conditions.wind_direction} exceeds label max ${product.max_wind_mph} mph`,
                    severity: 'danger',
                });
            }
            if (product.max_temp_f && conditions.temp_f > product.max_temp_f) {
                alerts.push({
                    product: product.name,
                    message: `Current temp ${conditions.temp_f}°F exceeds label max ${product.max_temp_f}°F`,
                    severity: 'danger',
                });
            }
            if (product.min_temp_f && conditions.temp_f < product.min_temp_f) {
                alerts.push({
                    product: product.name,
                    message: `Current temp ${conditions.temp_f}°F below label min ${product.min_temp_f}°F`,
                    severity: 'danger',
                });
            }
            if (product.rain_delay_hours && conditions.precip_chance >= 50) {
                alerts.push({
                    product: product.name,
                    message: `${conditions.precip_chance}% chance of rain — label requires ${product.rain_delay_hours}h rain-free after application`,
                    severity: 'warning',
                });
            }
        });

        return alerts;
    }, [selectedProducts, conditions]);

    const calculations = useMemo(() => {
        const area = parseFloat(areaSqft) || 0;
        const tank = parseFloat(tankSizeGal) || 0;
        const carrier = parseFloat(carrierRate) || 2;

        if (area <= 0) return null;

        const totalWaterNeeded = (area / 1000) * carrier;
        const numberOfTanks = tank > 0 ? Math.ceil(totalWaterNeeded / tank) : 0;

        const productCalcs = mixItems.map(item => {
            const product = item.productId ? products.find(p => p.id === item.productId) : null;
            const rate = parseFloat(item.rate) || 0;
            const unit = item.rateUnit;

            if (rate <= 0) return { product, productName: product?.name || 'Custom', rate: 0, unit, rateUnit: unit, totalAmount: 0, perTank: 0, displayUnit: 'oz' };

            let totalAmount = 0;
            let displayUnit = 'oz';

            if (unit === 'oz/1000sqft') {
                totalAmount = (area / 1000) * rate;
                displayUnit = 'oz';
            } else if (unit === 'lbs/1000sqft') {
                totalAmount = (area / 1000) * rate;
                displayUnit = 'lbs';
            } else if (unit === 'oz/acre') {
                totalAmount = (area / 43560) * rate;
                displayUnit = 'oz';
            } else if (unit === 'lbs/acre') {
                totalAmount = (area / 43560) * rate;
                displayUnit = 'lbs';
            }

            const perTank = numberOfTanks > 0 ? totalAmount / numberOfTanks : totalAmount;

            return { product, productName: product?.name || 'Custom', rate, unit, rateUnit: unit, totalAmount, perTank, displayUnit };
        }).filter(c => c.rate > 0);

        return {
            area,
            totalWaterNeeded,
            numberOfTanks,
            tank,
            waterPerTank: tank > 0 ? Math.min(tank, totalWaterNeeded) : totalWaterNeeded,
            productCalcs,
        };
    }, [areaSqft, tankSizeGal, carrierRate, mixItems, products]);

    // Task 6: Print mix instructions
    const handlePrintMixInstructions = () => {
        if (!calculations) return;
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const productRows = calculations.productCalcs.map(pc => `
            <tr>
                <td style="padding:8px 12px; border-bottom:1px solid #E0E4E8; font-weight:600;">${pc.productName}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #E0E4E8;">${pc.rate} ${pc.unit.replace('sqft', ' sq ft')}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #E0E4E8; font-weight:700; color:#73A657;">${pc.totalAmount.toFixed(2)} ${pc.displayUnit}</td>
                <td style="padding:8px 12px; border-bottom:1px solid #E0E4E8; font-weight:700; color:#73A657;">${pc.perTank.toFixed(2)} ${pc.displayUnit}</td>
            </tr>
        `).join('');

        const weatherSection = conditions ? `
            <div style="margin-top:20px; padding:12px 16px; background:#F4F6F8; border:1px solid #E0E4E8;">
                <strong style="font-size:11px; text-transform:uppercase; letter-spacing:0.1em;">Conditions at Time of Calculation</strong><br/>
                <span style="font-size:13px;">Temp: ${conditions.temp_f}°F | Wind: ${conditions.wind_mph} mph ${conditions.wind_direction} | Humidity: ${conditions.humidity}% | ${conditions.description}</span>
            </div>
        ` : '';

        const safetyWarnings = mixItems
            .filter(m => m.productId !== '')
            .map(m => products.find(p => p.id === m.productId))
            .filter((p): p is ChemicalProduct => !!(p && (p.signal_word || p.warnings)))
            .map(p => `
                <div style="margin-top:8px; padding:8px 12px; border-left:4px solid ${
                    p.signal_word === 'DANGER' ? '#EF4444' : p.signal_word === 'WARNING' ? '#F97316' : '#EAB308'
                }; background:#FFFBEB; font-size:11px;">
                    <strong>${p.signal_word || 'NOTE'}: ${p.name}</strong>${p.warnings ? ` — ${p.warnings}` : ''}
                    ${p.rei_hours ? `<br/>REI: ${p.rei_hours} hours` : ''}
                </div>
            `).join('');

        const html = `<!DOCTYPE html><html><head><title>Mix Instructions</title>
            <style>
                body { font-family: Inter, Arial, sans-serif; padding: 40px; color: #2C3E50; }
                h1 { font-family: Outfit, Arial, sans-serif; font-size: 18px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 4px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th { background: #73A657; color: white; padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; }
                .summary { display: flex; gap: 16px; margin-top: 16px; }
                .summary-box { flex: 1; text-align: center; padding: 12px; border: 1px solid #E0E4E8; }
                .summary-box .value { font-size: 24px; font-weight: 700; color: #73A657; }
                .summary-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #7F8C8D; }
                .notes-box { margin-top: 24px; border: 1px solid #E0E4E8; padding: 16px; min-height: 80px; }
                .notes-box h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0; color: #7F8C8D; }
                .footer { margin-top: 24px; font-size: 10px; color: #BDC3C7; text-align: center; }
            </style>
        </head><body>
            <h1>Tank Mix Instructions</h1>
            <div style="font-size:12px; color:#7F8C8D;">${today} at ${time}</div>

            <div class="summary">
                <div class="summary-box">
                    <div class="value">${calculations.area.toLocaleString()}</div>
                    <div class="label">Total Area (sq ft)</div>
                </div>
                <div class="summary-box">
                    <div class="value">${calculations.totalWaterNeeded.toFixed(1)}</div>
                    <div class="label">Total Water (gal)</div>
                </div>
                <div class="summary-box">
                    <div class="value">${calculations.numberOfTanks || '—'}</div>
                    <div class="label">Tank Loads</div>
                </div>
                <div class="summary-box">
                    <div class="value">${calculations.waterPerTank.toFixed(1)}</div>
                    <div class="label">Water / Tank (gal)</div>
                </div>
            </div>

            <table>
                <thead><tr>
                    <th>Product</th><th>Label Rate</th><th>Total Needed</th><th>Per Tank</th>
                </tr></thead>
                <tbody>${productRows}</tbody>
            </table>

            ${safetyWarnings}
            ${weatherSection}

            <div class="notes-box">
                <h3>Notes / Special Instructions</h3>
            </div>

            <div class="footer">TurfSheet — Tank Mix Instructions — ${today}</div>
            <script>window.onload = function() { window.print(); }</script>
        </body></html>`;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><p className="text-text-secondary">Loading...</p></div>;
    }

    return (
        <div className="space-y-6">
            {/* Weather Alerts */}
            {weatherAlerts.length > 0 && (
                <div className="bg-red-50 border-2 border-red-300 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-heading font-black text-sm uppercase tracking-wider text-red-800">
                            Weather Alerts
                        </h4>
                    </div>
                    {weatherAlerts.map((alert, i) => (
                        <p key={i} className="text-sm text-red-700 font-sans ml-7">
                            <span className="font-medium">{alert.product}:</span> {alert.message}
                        </p>
                    ))}
                </div>
            )}

            {/* Warnings & Cautions for Selected Products */}
            {selectedProducts.filter(p => p.warnings || p.signal_word).length > 0 && (
                <div className="space-y-3">
                    {selectedProducts.filter(p => p.warnings || p.signal_word).map(product => (
                        <div
                            key={product.id}
                            className={`border-l-4 p-4 ${SIGNAL_COLORS[product.signal_word || 'CAUTION'] || SIGNAL_COLORS.CAUTION}`}
                        >
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-heading font-black text-xs uppercase tracking-wider mb-1">
                                        {product.signal_word || 'CAUTION'} — {product.name}
                                    </p>
                                    {product.warnings && (
                                        <p className="text-xs font-sans leading-relaxed">{product.warnings}</p>
                                    )}
                                    <div className="flex flex-wrap gap-4 mt-2">
                                        {product.max_wind_mph && (
                                            <span className="flex items-center gap-1 text-xs font-sans">
                                                <Wind className="w-3 h-3" /> Max Wind: {product.max_wind_mph} mph
                                            </span>
                                        )}
                                        {(product.min_temp_f || product.max_temp_f) && (
                                            <span className="flex items-center gap-1 text-xs font-sans">
                                                <Thermometer className="w-3 h-3" />
                                                Temp: {product.min_temp_f ? `${product.min_temp_f}°F` : '--'} to {product.max_temp_f ? `${product.max_temp_f}°F` : '--'}
                                            </span>
                                        )}
                                        {product.rain_delay_hours && (
                                            <span className="flex items-center gap-1 text-xs font-sans">
                                                <CloudRain className="w-3 h-3" /> Rain-free: {product.rain_delay_hours}h
                                            </span>
                                        )}
                                        {product.rei_hours > 0 && (
                                            <span className="text-xs font-sans">
                                                REI: {product.rei_hours}h
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Section */}
            <div className="bg-panel-white border border-border-color p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border-color">
                    <Calculator className="w-5 h-5 text-turf-green" />
                    <h3 className="font-heading font-black text-sm uppercase tracking-wider text-text-primary">
                        Spray Mix Calculator
                    </h3>
                    {conditions && (
                        <span className="ml-auto text-xs text-text-secondary font-sans flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Thermometer className="w-3 h-3" /> {conditions.temp_f}°F
                            </span>
                            <span className="flex items-center gap-1">
                                <Wind className="w-3 h-3" /> {conditions.wind_mph} mph
                            </span>
                            <span className="flex items-center gap-1">
                                <Compass className="w-3 h-3" /> {conditions.wind_direction}
                            </span>
                            <span className="flex items-center gap-1">
                                <Droplets className="w-3 h-3" /> {conditions.humidity}%
                            </span>
                            <span>{conditions.description}</span>
                            <button
                                type="button"
                                onClick={fetchWeather}
                                className="text-text-secondary hover:text-turf-green transition-colors"
                                title="Refresh weather"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                </div>

                {/* Template controls — New Mix / Load Saved */}
                <div className="flex items-center gap-3 pb-6 border-b border-border-color">
                    <button
                        type="button"
                        onClick={() => {
                            setAreaSqft('');
                            setTankSizeGal('');
                            setCarrierRate('2');
                            setMixItems([{ productId: '', rate: '', rateUnit: 'oz/1000sqft' }]);
                            setShowLoadDropdown(false);
                        }}
                        className="bg-turf-green text-white px-5 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-0.5 transition-all duration-300 text-[0.7rem] uppercase tracking-[0.15em]"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        New Mix
                    </button>
                    {templates.length > 0 && (
                        <>
                            {!showLoadDropdown ? (
                                <button
                                    type="button"
                                    onClick={() => setShowLoadDropdown(true)}
                                    className="bg-panel-white border border-border-color text-text-primary px-5 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-dashboard-bg transition-all text-[0.7rem] uppercase tracking-[0.15em]"
                                >
                                    <FolderOpen className="w-3.5 h-3.5" />
                                    Load Saved
                                </button>
                            ) : (
                                <div className="flex-1">
                                    <select
                                        autoFocus
                                        value=""
                                        onChange={(e) => {
                                            const template = templates.find(t => t.id === parseInt(e.target.value));
                                            if (!template) return;
                                            if (template.area_sqft) setAreaSqft(String(template.area_sqft));
                                            if (template.tank_size_gal) setTankSizeGal(String(template.tank_size_gal));
                                            setCarrierRate(String(template.carrier_rate));
                                            setMixItems(template.products.map(p => ({
                                                productId: p.productId as number | '',
                                                rate: p.rate,
                                                rateUnit: p.rateUnit,
                                            })));
                                            setShowLoadDropdown(false);
                                        }}
                                        onBlur={() => setShowLoadDropdown(false)}
                                        className={inputClasses}
                                    >
                                        <option value="">Select a saved mix...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}{t.description ? ` — ${t.description}` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                    {mixItems.some(m => m.productId !== '') && (
                        <button
                            type="button"
                            onClick={() => setShowSaveModal(true)}
                            className="bg-panel-white border border-border-color text-text-primary px-5 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-dashboard-bg transition-all text-[0.7rem] uppercase tracking-[0.15em] ml-auto"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save Mix
                        </button>
                    )}
                </div>

                {/* Area & Tank */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className={labelClasses}>Area to Spray (sq ft) *</label>
                        <input
                            type="number"
                            min="0"
                            className={inputClasses}
                            placeholder="e.g. 45000"
                            value={areaSqft}
                            onChange={(e) => setAreaSqft(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Spray Tank Size (gallons)</label>
                        <input
                            type="number"
                            min="0"
                            className={inputClasses}
                            placeholder="e.g. 200"
                            value={tankSizeGal}
                            onChange={(e) => setTankSizeGal(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClasses}>Carrier Rate (gal/1,000 sq ft)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            className={inputClasses}
                            placeholder="2.0"
                            value={carrierRate}
                            onChange={(e) => setCarrierRate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Products to Mix */}
                <div>
                    <label className={labelClasses}>Products to Mix</label>
                    <div className="space-y-3">
                        {mixItems.map((item, index) => (
                            <div key={index} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end">
                                <div>
                                    <select
                                        className={inputClasses}
                                        value={item.productId}
                                        onChange={(e) => handleProductSelect(index, e.target.value)}
                                    >
                                        <option value="">Select product...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}{p.signal_word ? ` [${p.signal_word}]` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        min="0"
                                        className={inputClasses}
                                        placeholder="Rate"
                                        value={item.rate}
                                        onChange={(e) => {
                                            const updated = [...mixItems];
                                            updated[index].rate = e.target.value;
                                            setMixItems(updated);
                                        }}
                                    />
                                </div>
                                <div>
                                    <select
                                        className={inputClasses}
                                        value={item.rateUnit}
                                        onChange={(e) => {
                                            const updated = [...mixItems];
                                            updated[index].rateUnit = e.target.value;
                                            setMixItems(updated);
                                        }}
                                    >
                                        <option value="oz/1000sqft">oz/1,000 sq ft</option>
                                        <option value="lbs/1000sqft">lbs/1,000 sq ft</option>
                                        <option value="oz/acre">oz/acre</option>
                                        <option value="lbs/acre">lbs/acre</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMixItem(index)}
                                    className="px-3 py-3 text-text-secondary hover:text-red-500 border border-border-color hover:border-red-300 transition-colors text-sm"
                                    disabled={mixItems.length <= 1}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={addMixItem}
                        className="mt-3 text-sm text-turf-green hover:text-turf-green-dark font-heading font-black uppercase tracking-wider transition-colors"
                    >
                        + Add Another Product
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {calculations && calculations.productCalcs.length > 0 && (
                <div className="bg-panel-white border border-border-color shadow-sm">
                    <div className="bg-turf-green px-6 py-4 flex items-center gap-3">
                        <FlaskConical className="w-5 h-5 text-white" />
                        <h3 className="text-white font-heading font-black text-sm uppercase tracking-[0.15em]">
                            Mix Summary
                        </h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Overview */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-turf-green-light border border-turf-green/20">
                                <p className="text-[0.6rem] font-heading font-black uppercase tracking-widest text-text-secondary mb-1">
                                    Total Area
                                </p>
                                <p className="text-2xl font-heading font-black text-text-primary">
                                    {calculations.area.toLocaleString()}
                                </p>
                                <p className="text-xs text-text-secondary">sq ft</p>
                            </div>
                            <div className="text-center p-4 bg-blue-50 border border-blue-200">
                                <p className="text-[0.6rem] font-heading font-black uppercase tracking-widest text-text-secondary mb-1">
                                    Total Water
                                </p>
                                <p className="text-2xl font-heading font-black text-text-primary">
                                    {calculations.totalWaterNeeded.toFixed(1)}
                                </p>
                                <p className="text-xs text-text-secondary">gallons</p>
                            </div>
                            {calculations.numberOfTanks > 0 && (
                                <div className="text-center p-4 bg-amber-50 border border-amber-200">
                                    <p className="text-[0.6rem] font-heading font-black uppercase tracking-widest text-text-secondary mb-1">
                                        Tank Loads
                                    </p>
                                    <p className="text-2xl font-heading font-black text-text-primary">
                                        {calculations.numberOfTanks}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        @ {calculations.tank} gal each
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Per-Product Breakdown */}
                        <div>
                            <h4 className="text-[0.65rem] font-heading font-black uppercase tracking-widest text-text-secondary mb-3">
                                Product Amounts
                            </h4>
                            <div className="border border-border-color">
                                <div className={`grid ${calculations.numberOfTanks > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-4 px-4 py-2 bg-dashboard-bg text-[0.6rem] font-heading font-black uppercase tracking-widest text-text-secondary`}>
                                    <span>Product</span>
                                    <span>Rate</span>
                                    <span>Total Needed</span>
                                    {calculations.numberOfTanks > 0 && <span>Per Tank</span>}
                                </div>
                                {calculations.productCalcs.map((calc, i) => (
                                    <div key={i} className={`grid ${calculations.numberOfTanks > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-4 px-4 py-3 border-t border-border-color items-center`}>
                                        <span className="text-sm font-sans font-medium text-text-primary">
                                            {calc.productName}
                                        </span>
                                        <span className="text-sm font-sans text-text-secondary">
                                            {calc.rate} {calc.unit.replace('sqft', ' sq ft')}
                                        </span>
                                        <span className="text-sm font-sans font-medium text-turf-green">
                                            {calc.totalAmount.toFixed(2)} {calc.displayUnit}
                                        </span>
                                        {calculations.numberOfTanks > 0 && (
                                            <span className="text-sm font-sans text-text-secondary">
                                                {calc.perTank.toFixed(2)} {calc.displayUnit}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={handlePrintMixInstructions}
                                className="bg-panel-white border border-border-color text-text-primary px-6 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-dashboard-bg transition-all text-[0.7rem] uppercase tracking-[0.15em]"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                Print Mix Sheet
                            </button>
                            {onRecordApplication && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const firstItem = mixItems.find(m => m.productId !== '');
                                        const product = firstItem ? products.find(p => p.id === firstItem.productId) : null;
                                        const firstCalc = calculations.productCalcs[0];
                                        onRecordApplication({
                                            product_name: product?.name || '',
                                            epa_registration_number: product?.epa_registration || '',
                                            active_ingredient: product?.active_ingredient || '',
                                            application_rate: firstItem ? `${firstItem.rate} ${firstItem.rateUnit.replace('sqft', ' sq ft')}` : '',
                                            total_amount_used: firstCalc
                                                ? `${firstCalc.totalAmount.toFixed(2)} ${firstCalc.displayUnit}`
                                                : '',
                                            area_size: `${areaSqft} sq ft`,
                                            method: 'spray',
                                            rei_hours: product?.rei_hours?.toString() || '',
                                            temperature: conditions?.temp_f?.toString() || '',
                                            wind_speed: conditions?.wind_mph?.toString() || '',
                                            wind_direction: conditions?.wind_direction || '',
                                            humidity: conditions?.humidity?.toString() || '',
                                            weather_conditions: conditions?.description || '',
                                        });
                                    }}
                                    className="bg-turf-green text-white px-6 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-0.5 transition-all duration-300 text-[0.7rem] uppercase tracking-[0.15em]"
                                >
                                    <ClipboardList className="w-3.5 h-3.5" />
                                    Record This Application
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Save Template Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
                    <div className="bg-panel-white p-8 w-full max-w-md shadow-xl">
                        <h3 className="text-sm font-heading font-black uppercase tracking-widest mb-6">Save Mix Template</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={labelClasses}>Template Name *</label>
                                <input
                                    value={templateName}
                                    onChange={e => setTemplateName(e.target.value)}
                                    placeholder="e.g. Greens Weekly"
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className={labelClasses}>Description</label>
                                <input
                                    value={templateDesc}
                                    onChange={e => setTemplateDesc(e.target.value)}
                                    placeholder="Optional notes"
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button
                                type="button"
                                onClick={() => { setShowSaveModal(false); setTemplateName(''); setTemplateDesc(''); }}
                                className="flex-1 px-6 py-4 border border-border-color text-text-secondary font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-dashboard-bg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={!templateName.trim()}
                                onClick={async () => {
                                    const { error } = await supabase.from('spray_mix_templates').insert([{
                                        name: templateName.trim(),
                                        description: templateDesc.trim() || null,
                                        area_sqft: areaSqft ? parseFloat(areaSqft) : null,
                                        tank_size_gal: tankSizeGal ? parseFloat(tankSizeGal) : null,
                                        carrier_rate: parseFloat(carrierRate) || 2,
                                        products: mixItems.filter(m => m.productId !== '').map(m => ({
                                            productId: m.productId, rate: m.rate, rateUnit: m.rateUnit,
                                        })),
                                    }]);
                                    if (!error) {
                                        await fetchTemplates();
                                        setShowSaveModal(false);
                                        setTemplateName('');
                                        setTemplateDesc('');
                                    }
                                }}
                                className="flex-1 px-6 py-4 bg-turf-green text-white font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-turf-green-dark transition-colors shadow-sm disabled:opacity-50"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
