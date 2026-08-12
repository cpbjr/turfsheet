import { useState, useEffect } from 'react';
import { Search, Plus, Printer, Download, ClipboardList, Package, Calculator, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import PesticideForm from '../components/pesticide/PesticideForm';
import PesticideEventRow from '../components/pesticide/PesticideEventRow';
import ProductLibrary from '../components/pesticide/ProductLibrary';
import SprayCalculator from '../components/pesticide/SprayCalculator';
import { supabase } from '../lib/supabase';
import { sameId } from '../lib/utils';
import { formatMethod } from '../lib/pesticideOptions';
import {
    buildPesticideLogPrintHtml,
    downloadPesticideLogPdf,
} from '../lib/pesticideLogExport';
import {
    deletePesticideApplication,
    fetchCourseSettings,
    fetchPesticideApplications,
    insertPesticideApplication,
    updatePesticideApplication,
} from '../lib/pesticideData';
import {
    flattenEventsToLogLines,
    isWithinRetention,
    maxReiHours,
    resolveMethod,
} from '../lib/pesticideApplication';
import type {
    CalculatorRecordPayload,
    ChemicalProduct,
    CourseSettings,
    PesticideApplicationDraft,
    PesticideApplicationWithProducts,
    Staff,
} from '../types';

type TabId = 'applications' | 'products' | 'calculator';

const TABS: { id: TabId; label: string; icon: typeof ClipboardList }[] = [
    { id: 'applications', label: 'Application Log', icon: ClipboardList },
    { id: 'products', label: 'Product Library', icon: Package },
    { id: 'calculator', label: 'Spray Calculator', icon: Calculator },
];

export default function PesticidePage() {
    const [activeTab, setActiveTab] = useState<TabId>('applications');
    const [applications, setApplications] = useState<PesticideApplicationWithProducts[]>([]);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [products, setProducts] = useState<ChemicalProduct[]>([]);
    const [courseSettings, setCourseSettings] = useState<CourseSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] =
        useState<PesticideApplicationWithProducts | null>(null);
    const [editingApplication, setEditingApplication] =
        useState<PesticideApplicationWithProducts | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [calculatorPrefill, setCalculatorPrefill] = useState<CalculatorRecordPayload | null>(
        null
    );
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [apps, staffResult, productsResult, course] = await Promise.all([
                fetchPesticideApplications(),
                // applicator_license is needed to autofill IDAPA 02.03.03.101.01(m).
                supabase.from('staff').select('id, name, role, applicator_license').order('name'),
                supabase
                    .from('chemical_products')
                    .select('*')
                    .eq('is_active', true)
                    .order('name'),
                fetchCourseSettings(),
            ]);

            if (staffResult.error) throw staffResult.error;
            if (productsResult.error) {
                console.warn('chemical_products not found:', productsResult.error.message);
            }

            setApplications(apps);
            setStaffMembers((staffResult.data as Staff[]) || []);
            setProducts((productsResult.data as ChemicalProduct[]) || []);
            setCourseSettings(course);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getOperatorName = (id?: string | number) =>
        staffMembers.find((s) => sameId(s.id, id))?.name || 'Unknown';

    const refreshApplications = async () => {
        const apps = await fetchPesticideApplications();
        setApplications(apps);
        return apps;
    };

    const handleSave = async (draft: PesticideApplicationDraft) => {
        try {
            setError(null);
            setStatusMessage(null);
            await insertPesticideApplication(draft);
            await refreshApplications();
            setIsAddModalOpen(false);
            setCalculatorPrefill(null);
            const n = draft.lines.length;
            setStatusMessage(
                n > 1
                    ? `Recorded application with ${n} products.`
                    : 'Recorded application.'
            );
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to record application';
            setError(message);
        }
    };

    const handleEditApplication = async (draft: PesticideApplicationDraft) => {
        if (!editingApplication) return;
        try {
            setError(null);
            setStatusMessage(null);
            await updatePesticideApplication(
                editingApplication.id,
                draft,
                editingApplication.products ?? []
            );
            await refreshApplications();
            setEditingApplication(null);
            setStatusMessage('Application updated.');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update application';
            setError(message);
        }
    };

    const handleDeleteApplication = async (event: PesticideApplicationWithProducts) => {
        const n = event.products?.length ?? 0;
        // Idaho requires these records be kept 2 years (IDAPA 02.03.03.101.01); a
        // database trigger refuses the delete. Say so here rather than letting the
        // user confirm an action that cannot succeed.
        if (isWithinRetention(event.application_date)) {
            setError(
                `This record is dated ${event.application_date} and is within Idaho's 2-year ` +
                    `retention period (IDAPA 02.03.03.101.01). It cannot be deleted. ` +
                    `Edit the record instead if it needs correcting.`
            );
            return;
        }
        const msg =
            n > 1
                ? `Delete this application and its ${n} product lines? This cannot be undone.`
                : 'Delete this application record? This cannot be undone.';
        if (!window.confirm(msg)) return;
        try {
            setError(null);
            await deletePesticideApplication(event.id);
            setApplications((prev) => prev.filter((app) => app.id !== event.id));
            setIsDetailModalOpen(false);
            setSelectedApplication(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete application';
            setError(message);
        }
    };

    const handleViewApplication = (app: PesticideApplicationWithProducts) => {
        setSelectedApplication(app);
        setIsDetailModalOpen(true);
    };

    const handleRecordFromCalculator = (payload: CalculatorRecordPayload) => {
        setCalculatorPrefill(payload);
        setActiveTab('applications');
        setIsAddModalOpen(true);
    };

    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredApplications = applications.filter((app) => {
        const query = searchQuery.toLowerCase().trim();
        const area = (app.area_applied ?? '').toLowerCase();
        const productMatch =
            !query ||
            (app.products ?? []).some((p) =>
                (p.product_name ?? '').toLowerCase().includes(query)
            ) ||
            area.includes(query);
        const matchesDateFrom = !dateFrom || app.application_date >= dateFrom;
        const matchesDateTo = !dateTo || app.application_date <= dateTo;
        return productMatch && matchesDateFrom && matchesDateTo;
    });

    const assertExportReady = (action: 'print' | 'download'): boolean => {
        if (loading) {
            setStatusMessage(
                action === 'print'
                    ? 'Still loading application records — try Print again in a moment.'
                    : 'Still loading application records — try Download again in a moment.'
            );
            return false;
        }
        if (error) {
            setStatusMessage(`Cannot ${action === 'print' ? 'print' : 'download'}: ${error}`);
            return false;
        }
        if (filteredApplications.length === 0) {
            setStatusMessage(
                applications.length === 0
                    ? 'No application records loaded from the database.'
                    : 'No records match the current search/date filters.'
            );
            return false;
        }
        return true;
    };

    const handlePrint = () => {
        if (!assertExportReady('print')) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            setStatusMessage(
                'Pop-up blocked — allow pop-ups for whitepine-tech.com to print the log.'
            );
            return;
        }

        printWindow.document.write(
            buildPesticideLogPrintHtml(filteredApplications, staffMembers, {
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                course: courseSettings,
            })
        );
        printWindow.document.close();
    };

    const handleDownloadPdf = () => {
        if (!assertExportReady('download')) return;
        try {
            downloadPesticideLogPdf(filteredApplications, staffMembers, {
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
                course: courseSettings,
            });
            const lines = flattenEventsToLogLines(filteredApplications).length;
            setStatusMessage(
                `Downloaded PDF (${filteredApplications.length} application${filteredApplications.length !== 1 ? 's' : ''}, ${lines} product line${lines !== 1 ? 's' : ''}).`
            );
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            setStatusMessage(`PDF download failed: ${msg}`);
        }
    };

    const inputClasses =
        'bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans';
    const detailLabelClasses =
        'text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2';

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const selectedProducts = selectedApplication?.products ?? [];
    const longestRei = selectedApplication
        ? maxReiHours(selectedProducts)
        : undefined;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-color">
                <div>
                    <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
                        Chemical Management
                    </h2>
                    <p className="text-text-secondary text-sm font-sans">
                        Product library, spray calculations, and application records for Idaho
                        regulatory compliance.
                    </p>
                </div>
                {activeTab === 'applications' && (
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="bg-panel-white border border-border-color text-text-primary px-6 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-dashboard-bg transition-all text-[0.7rem] uppercase tracking-[0.15em]"
                        >
                            <Printer className="w-4 h-4" />
                            Print Log
                        </button>
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            className="bg-panel-white border border-border-color text-text-primary px-6 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-dashboard-bg transition-all text-[0.7rem] uppercase tracking-[0.15em]"
                        >
                            <Download className="w-4 h-4" />
                            Download PDF
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-turf-green text-white px-6 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-0.5 transition-all duration-300 text-[0.7rem] uppercase tracking-[0.15em]"
                        >
                            <Plus className="w-4 h-4" />
                            Record Application
                        </button>
                    </div>
                )}
            </div>

            <div className="flex overflow-x-auto custom-scrollbar border-b border-border-color">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center whitespace-nowrap gap-2 px-4 md:px-6 py-3 font-heading font-black text-[0.65rem] md:text-[0.7rem] uppercase tracking-[0.15em] border-b-2 transition-colors ${
                            activeTab === tab.id
                                ? 'border-turf-green text-turf-green'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'applications' && (
                <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-panel-white p-4 border border-border-color shadow-sm">
                        <div className="relative flex-1 w-full max-w-2xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Search by product or area..."
                                className={`${inputClasses} pl-10 w-full`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <label className="text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest whitespace-nowrap">
                                    From
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="bg-dashboard-bg border border-border-color px-3 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest whitespace-nowrap">
                                    To
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="bg-dashboard-bg border border-border-color px-3 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans"
                                />
                            </div>
                            <span className="text-xs text-text-secondary font-sans">
                                {filteredApplications.length} application
                                {filteredApplications.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-[28px_1.2fr_2fr_1.5fr_1fr_1fr] gap-4 px-6 py-3 bg-turf-green text-white text-[0.65rem] font-heading font-black uppercase tracking-widest">
                        <span />
                        <span>Date</span>
                        <span>Products</span>
                        <span>Area</span>
                        <span>Operator</span>
                        <span>Method</span>
                    </div>

                    <div className="-mt-2">
                        {statusMessage && (
                            <div className="mx-0 mb-3 px-4 py-3 bg-green-50 border border-green-200 text-green-900 text-sm font-sans">
                                {statusMessage}
                                <button
                                    type="button"
                                    className="ml-3 underline text-green-800"
                                    onClick={() => setStatusMessage(null)}
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                        {loading && (
                            <div className="flex items-center justify-center p-12">
                                <p className="text-text-secondary">Loading applications...</p>
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center justify-center h-64">
                                <p className="text-red-500">Error: {error}</p>
                            </div>
                        )}
                        {!loading && !error && filteredApplications.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-dashed rounded-sm">
                                <p className="text-text-secondary font-sans text-sm">
                                    {searchQuery
                                        ? 'No applications found matching your search.'
                                        : 'No pesticide applications recorded yet.'}
                                </p>
                            </div>
                        )}
                        {!loading && !error && filteredApplications.length > 0 && (
                            <div className="bg-panel-white border border-border-color border-t-0">
                                {filteredApplications.map((app) => (
                                    <PesticideEventRow
                                        key={app.id}
                                        event={app}
                                        operatorName={getOperatorName(app.operator_id)}
                                        expanded={expandedIds.has(app.id)}
                                        onToggleExpand={() => toggleExpand(app.id)}
                                        onClick={() => handleViewApplication(app)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="pb-8">
                    <ProductLibrary />
                </div>
            )}
            {activeTab === 'calculator' && (
                <div className="pb-8">
                    <SprayCalculator onRecordApplication={handleRecordFromCalculator} />
                </div>
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setCalculatorPrefill(null);
                }}
                title={
                    calculatorPrefill && calculatorPrefill.lines.length > 1
                        ? `Record Application (${calculatorPrefill.lines.length} products in mix)`
                        : 'Record Application'
                }
                size="xl"
            >
                <PesticideForm
                    onSubmit={handleSave}
                    onCancel={() => {
                        setIsAddModalOpen(false);
                        setCalculatorPrefill(null);
                    }}
                    staffMembers={staffMembers}
                    products={products}
                    calculatorPrefill={calculatorPrefill}
                />
            </Modal>

            <Modal
                isOpen={!!editingApplication}
                onClose={() => setEditingApplication(null)}
                title="Edit Application"
                size="xl"
            >
                {editingApplication && (
                    <PesticideForm
                        onSubmit={handleEditApplication}
                        onCancel={() => setEditingApplication(null)}
                        staffMembers={staffMembers}
                        products={products}
                        initialData={editingApplication}
                    />
                )}
            </Modal>

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Application Details"
                size="lg"
            >
                {selectedApplication && (
                    <div className="space-y-6 font-sans">
                        <div className="pb-4 border-b border-border-color">
                            <h3 className="text-2xl font-heading font-black text-text-primary uppercase tracking-tight">
                                {selectedApplication.area_applied}
                            </h3>
                            <p className="text-text-secondary text-sm mt-1">
                                Applied on {formatDate(selectedApplication.application_date)}
                                {selectedApplication.application_time &&
                                    ` at ${selectedApplication.application_time}`}
                            </p>
                        </div>

                        {/* Products table */}
                        <div>
                            <h4 className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary mb-3">
                                Products ({selectedProducts.length})
                            </h4>
                            <div className="border border-border-color overflow-hidden">
                                <div className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr_0.8fr] gap-2 px-3 py-2 bg-dashboard-bg text-[0.6rem] font-heading font-black uppercase tracking-widest text-text-secondary">
                                    <span>Product</span>
                                    <span>Rate</span>
                                    <span>Total / Tank</span>
                                    <span>REI</span>
                                    <span>Target</span>
                                    <span>Method</span>
                                </div>
                                {[...selectedProducts]
                                    .sort(
                                        (a, b) => (a.line_number ?? 0) - (b.line_number ?? 0)
                                    )
                                    .map((p) => (
                                        <div
                                            key={p.id}
                                            className="grid grid-cols-[1.5fr_1fr_1fr_0.8fr_1fr_0.8fr] gap-2 px-3 py-2 border-t border-border-color text-sm"
                                        >
                                            <div>
                                                <p className="font-medium text-text-primary">
                                                    {p.product_name}
                                                </p>
                                                {(p.manufacturer || p.epa_registration_number) && (
                                                    <p className="text-xs text-text-secondary mt-0.5">
                                                        {[p.manufacturer, p.epa_registration_number]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </p>
                                                )}
                                                {p.epa_lot_number && (
                                                    <p className="text-xs text-text-secondary">
                                                        Lot {p.epa_lot_number}
                                                    </p>
                                                )}
                                                {p.active_ingredient && (
                                                    <p className="text-xs text-text-secondary">
                                                        {p.active_ingredient}
                                                    </p>
                                                )}
                                            </div>
                                            <span className="text-text-primary">
                                                {p.application_rate}
                                            </span>
                                            <span className="text-text-secondary text-xs">
                                                {[p.total_amount_used, p.amount_per_tank]
                                                    .filter(Boolean)
                                                    .join(' / ') || '—'}
                                            </span>
                                            <span className="text-text-secondary">
                                                {p.rei_hours != null ? `${p.rei_hours}h` : '—'}
                                            </span>
                                            <span className="text-text-secondary">
                                                {p.target_pest || '—'}
                                            </span>
                                            <span className="text-text-secondary">
                                                {formatMethod(
                                                    resolveMethod(selectedApplication, p)
                                                )}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={detailLabelClasses}>Operator</label>
                                <p className="text-sm text-text-primary">
                                    {getOperatorName(selectedApplication.operator_id)}
                                </p>
                            </div>
                            <div>
                                <label className={detailLabelClasses}>Event method</label>
                                <p className="text-sm text-text-primary">
                                    {formatMethod(selectedApplication.method)}
                                </p>
                            </div>
                            {selectedApplication.area_size && (
                                <div>
                                    <label className={detailLabelClasses}>Area Size</label>
                                    <p className="text-sm text-text-primary">
                                        {selectedApplication.area_size}
                                    </p>
                                </div>
                            )}
                            {selectedApplication.applicator_license && (
                                <div>
                                    <label className={detailLabelClasses}>
                                        Applicator License #
                                    </label>
                                    <p className="text-sm text-text-primary">
                                        {selectedApplication.applicator_license}
                                    </p>
                                </div>
                            )}
                            {longestRei != null && (
                                <div>
                                    <label className={detailLabelClasses}>
                                        REI (longest in mix)
                                    </label>
                                    <p className="text-sm text-text-primary">{longestRei} hours</p>
                                </div>
                            )}
                        </div>

                        {(selectedApplication.weather_conditions ||
                            selectedApplication.temperature ||
                            selectedApplication.wind_speed) && (
                            <div className="border-t border-border-color pt-4">
                                <h4 className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary mb-3">
                                    Weather Conditions
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {selectedApplication.temperature && (
                                        <div>
                                            <label className={detailLabelClasses}>Temperature</label>
                                            <p className="text-sm text-text-primary">
                                                {selectedApplication.temperature}°F
                                            </p>
                                        </div>
                                    )}
                                    {selectedApplication.wind_speed && (
                                        <div>
                                            <label className={detailLabelClasses}>Wind Speed</label>
                                            <p className="text-sm text-text-primary">
                                                {selectedApplication.wind_speed} mph
                                            </p>
                                        </div>
                                    )}
                                    {selectedApplication.wind_direction && (
                                        <div>
                                            <label className={detailLabelClasses}>
                                                Wind Direction
                                            </label>
                                            <p className="text-sm text-text-primary">
                                                {selectedApplication.wind_direction}
                                            </p>
                                        </div>
                                    )}
                                    {selectedApplication.humidity && (
                                        <div>
                                            <label className={detailLabelClasses}>Humidity</label>
                                            <p className="text-sm text-text-primary">
                                                {selectedApplication.humidity}%
                                            </p>
                                        </div>
                                    )}
                                    {selectedApplication.weather_conditions && (
                                        <div>
                                            <label className={detailLabelClasses}>Conditions</label>
                                            <p className="text-sm text-text-primary">
                                                {selectedApplication.weather_conditions}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="border-t border-border-color pt-4">
                            <h4 className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary mb-3">
                                Compliance Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={detailLabelClasses}>WPS Briefing</label>
                                    <p className="text-sm text-text-primary">
                                        {selectedApplication.worker_protection_exchange
                                            ? 'Completed'
                                            : 'Not completed'}
                                    </p>
                                </div>
                                {selectedApplication.recommended_by && (
                                    <div>
                                        <label className={detailLabelClasses}>Recommended By</label>
                                        <p className="text-sm text-text-primary">
                                            {staffMembers.find((s) =>
                                                sameId(s.id, selectedApplication.recommended_by)
                                            )?.name || '--'}
                                        </p>
                                    </div>
                                )}
                                {selectedApplication.equipment_used && (
                                    <div>
                                        <label className={detailLabelClasses}>Equipment Used</label>
                                        <p className="text-sm text-text-primary">
                                            {selectedApplication.equipment_used}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {selectedApplication.worker_protection_requirements && (
                                <div className="mt-3">
                                    <label className={detailLabelClasses}>
                                        Worker Protection Requirements
                                    </label>
                                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                                        {selectedApplication.worker_protection_requirements}
                                    </p>
                                </div>
                            )}
                        </div>

                        {selectedApplication.notes && (
                            <div className="border-t border-border-color pt-4">
                                <label className={detailLabelClasses}>Notes</label>
                                <p className="text-sm text-text-primary whitespace-pre-wrap">
                                    {selectedApplication.notes}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-border-color">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 bg-panel-white border border-border-color px-6 py-3 font-heading font-black text-xs uppercase tracking-wider text-text-primary hover:bg-dashboard-bg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    setEditingApplication(selectedApplication);
                                }}
                                className="bg-panel-white border border-border-color text-text-primary px-4 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-dashboard-bg transition-all text-[0.65rem] uppercase tracking-[0.15em]"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteApplication(selectedApplication)}
                                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-red-100 transition-all text-[0.65rem] uppercase tracking-[0.15em]"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
