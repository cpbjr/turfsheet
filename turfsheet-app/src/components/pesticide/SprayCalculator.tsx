import { useState, useEffect, useMemo } from 'react';
import { Calculator, FlaskConical, AlertTriangle, Wind, Thermometer, CloudRain } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ChemicalProduct } from '../../types';

interface MixItem {
    productId: number | '';
    rate: string;
    rateUnit: string;
}

interface WeatherData {
    temp_f?: number;
    wind_mph?: number;
    description?: string;
}

const SIGNAL_COLORS: Record<string, string> = {
    CAUTION: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    WARNING: 'bg-orange-100 border-orange-400 text-orange-800',
    DANGER: 'bg-red-100 border-red-400 text-red-800',
};

export default function SprayCalculator() {
    const [products, setProducts] = useState<ChemicalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [areaSqft, setAreaSqft] = useState('');
    const [tankSizeGal, setTankSizeGal] = useState('');
    const [carrierRate, setCarrierRate] = useState('2');
    const [mixItems, setMixItems] = useState<MixItem[]>([{ productId: '', rate: '', rateUnit: 'oz/1000sqft' }]);
    const [weather, setWeather] = useState<WeatherData | null>(null);

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

        // Try to get current weather from the header's weather widget data
        // This uses a simple approach - checking localStorage or window state
        const storedWeather = localStorage.getItem('turfsheet_current_weather');
        if (storedWeather) {
            try {
                setWeather(JSON.parse(storedWeather));
            } catch { /* ignore parse errors */ }
        }
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
        const alerts: { product: string; message: string; severity: 'warning' | 'danger' }[] = [];

        selectedProducts.forEach(product => {
            if (weather?.wind_mph && product.max_wind_mph && weather.wind_mph > product.max_wind_mph) {
                alerts.push({
                    product: product.name,
                    message: `Current wind ${weather.wind_mph} mph exceeds max ${product.max_wind_mph} mph`,
                    severity: 'danger',
                });
            }
            if (weather?.temp_f && product.max_temp_f && weather.temp_f > product.max_temp_f) {
                alerts.push({
                    product: product.name,
                    message: `Current temp ${weather.temp_f}°F exceeds max ${product.max_temp_f}°F`,
                    severity: 'danger',
                });
            }
            if (weather?.temp_f && product.min_temp_f && weather.temp_f < product.min_temp_f) {
                alerts.push({
                    product: product.name,
                    message: `Current temp ${weather.temp_f}°F below min ${product.min_temp_f}°F`,
                    severity: 'danger',
                });
            }
        });

        return alerts;
    }, [selectedProducts, weather]);

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

            if (rate <= 0) return { product, rate: 0, unit, totalAmount: 0, perTank: 0, displayUnit: 'oz' };

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

            return { product, rate, unit, totalAmount, perTank, displayUnit };
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

    const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

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
                    {weather && (
                        <span className="ml-auto text-xs text-text-secondary font-sans flex items-center gap-3">
                            {weather.temp_f && (
                                <span className="flex items-center gap-1">
                                    <Thermometer className="w-3 h-3" /> {weather.temp_f}°F
                                </span>
                            )}
                            {weather.wind_mph && (
                                <span className="flex items-center gap-1">
                                    <Wind className="w-3 h-3" /> {weather.wind_mph} mph
                                </span>
                            )}
                            {weather.description && <span>{weather.description}</span>}
                        </span>
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
                                            {calc.product?.name || 'Custom Product'}
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
                    </div>
                </div>
            )}
        </div>
    );
}
