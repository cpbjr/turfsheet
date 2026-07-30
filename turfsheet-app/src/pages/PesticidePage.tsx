import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Printer, Download, ClipboardList, Package, Calculator, Edit2, Trash2 } from 'lucide-react';
import Modal from '../components/ui/Modal';
import PesticideForm from '../components/pesticide/PesticideForm';
import PesticideListItem from '../components/pesticide/PesticideListItem';
import ProductLibrary from '../components/pesticide/ProductLibrary';
import SprayCalculator from '../components/pesticide/SprayCalculator';
import ApplicationPrintView from '../components/pesticide/ApplicationPrintView';
import { supabase } from '../lib/supabase';
import { sameId } from '../lib/utils';
import { formatMethod } from '../lib/pesticideOptions';
import {
    buildPesticideLogPrintHtml,
    downloadPesticideLogPdf,
} from '../lib/pesticideLogExport';
import {
    findMixSiblingIds,
    pickSharedMixFields,
    type CalculatorRecordPayload,
    type MixProductPrefill,
} from '../lib/pesticideMix';
import type { PesticideApplication, Staff, ChemicalProduct } from '../types';

type TabId = 'applications' | 'products' | 'calculator';

const TABS: { id: TabId; label: string; icon: typeof ClipboardList }[] = [
    { id: 'applications', label: 'Application Log', icon: ClipboardList },
    { id: 'products', label: 'Product Library', icon: Package },
    { id: 'calculator', label: 'Spray Calculator', icon: Calculator },
];

export default function PesticidePage() {
    const [activeTab, setActiveTab] = useState<TabId>('applications');
    const [applications, setApplications] = useState<PesticideApplication[]>([]);
    const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
    const [products, setProducts] = useState<ChemicalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<PesticideApplication | null>(null);
    const [editingApplication, setEditingApplication] = useState<PesticideApplication | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    // Task 1: prefill data from calculator
    const [prefillData, setPrefillData] = useState<Record<string, string> | null>(null);
    /** Full tank mix lines when recording from Spray Calculator (multi-product insert). */
    const [mixProducts, setMixProducts] = useState<MixProductPrefill[] | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [appsResult, staffResult, productsResult] = await Promise.all([
                supabase
                    .from('pesticide_applications')
                    .select('*')
                    .order('application_date', { ascending: false }),
                supabase
                    .from('staff')
                    .select('id, name, role')
                    .order('name'),
                supabase
                    .from('chemical_products')
                    .select('*')
                    .eq('is_active', true)
                    .order('name'),
            ]);

            if (appsResult.error) throw appsResult.error;
            if (staffResult.error) throw staffResult.error;
            // Products table may not exist yet
            if (productsResult.error) {
                console.warn('chemical_products not found:', productsResult.error.message);
            }

            setApplications(appsResult.data || []);
            setStaffMembers((staffResult.data as Staff[]) || []);
            setProducts((productsResult.data as ChemicalProduct[]) || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch data';
            setError(message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getOperatorName = (id?: string | number) =>
        staffMembers.find(s => sameId(s.id, id))?.name || 'Unknown';

    const cascadeSharedToSiblings = async (
        sourceRow: Pick<PesticideApplication, 'id' | 'application_date' | 'area_applied'>,
        formData: Record<string, unknown>,
        appsSnapshot: PesticideApplication[]
    ) => {
        const shared = pickSharedMixFields(formData);
        // Match siblings using post-edit date/area so a corrected area still fans out.
        const matchKey = {
            id: sourceRow.id,
            application_date: String(
                (shared.application_date as string | undefined) ?? sourceRow.application_date ?? ''
            ),
            area_applied: String(
                (shared.area_applied as string | undefined) ?? sourceRow.area_applied ?? ''
            ),
        };
        const siblingIds = findMixSiblingIds(appsSnapshot, matchKey);
        if (siblingIds.length === 0) return 0;

        const { error: cascadeError } = await supabase
            .from('pesticide_applications')
            .update(shared)
            .in('id', siblingIds);
        if (cascadeError) throw cascadeError;
        return siblingIds.length;
    };

    const handleSave = async (formData: any) => {
        try {
            setError(null);
            setStatusMessage(null);

            const rows: Record<string, unknown>[] =
                mixProducts && mixProducts.length > 1
                    ? mixProducts.map((product) => ({
                          ...formData,
                          product_name: product.product_name || formData.product_name,
                          epa_registration_number:
                              product.epa_registration_number || formData.epa_registration_number,
                          active_ingredient: product.active_ingredient || formData.active_ingredient,
                          application_rate: product.application_rate || formData.application_rate,
                          rate_unit: product.rate_unit || formData.rate_unit,
                          total_amount_used: product.total_amount_used || formData.total_amount_used,
                          amount_per_tank: product.amount_per_tank || formData.amount_per_tank,
                          manufacturer: product.manufacturer || formData.manufacturer,
                          rei_hours:
                              product.rei_hours != null && product.rei_hours !== ''
                                  ? parseInt(product.rei_hours, 10)
                                  : formData.rei_hours,
                          method: product.method || formData.method,
                      }))
                    : [formData];

            const { data, error: insertError } = await supabase
                .from('pesticide_applications')
                .insert(rows)
                .select();

            if (insertError) throw insertError;

            const inserted = (data as PesticideApplication[]) || [];
            let cascaded = 0;
            // If only one row was inserted but siblings already exist (import + fill ops),
            // fan shared fields out to matching date+area rows.
            if (inserted.length === 1) {
                cascaded = await cascadeSharedToSiblings(
                    inserted[0],
                    formData,
                    [...inserted, ...applications]
                );
            }

            const { data: refreshed } = await supabase
                .from('pesticide_applications')
                .select('*')
                .order('application_date', { ascending: false });
            if (refreshed) setApplications(refreshed);
            else setApplications([...inserted, ...applications]);

            setIsAddModalOpen(false);
            setPrefillData(null);
            setMixProducts(null);
            if (inserted.length > 1) {
                setStatusMessage(
                    `Recorded ${inserted.length} product rows for this tank mix (shared operator/weather/equipment).`
                );
            } else if (cascaded > 0) {
                setStatusMessage(
                    `Saved. Also updated ${cascaded} other product row${cascaded === 1 ? '' : 's'} in this tank mix.`
                );
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to record application';
            setError(message);
        }
    };

    // Task 7: Edit handler — cascade shared ops fields to tank-mix siblings
    const handleEditApplication = async (formData: any) => {
        if (!editingApplication) return;
        try {
            setError(null);
            setStatusMessage(null);
            const { error: updateError } = await supabase
                .from('pesticide_applications')
                .update(formData)
                .eq('id', editingApplication.id);

            if (updateError) throw updateError;

            const cascaded = await cascadeSharedToSiblings(
                editingApplication,
                formData,
                applications
            );

            const { data: updated } = await supabase
                .from('pesticide_applications')
                .select('*')
                .order('application_date', { ascending: false });
            if (updated) setApplications(updated);
            setEditingApplication(null);
            if (cascaded > 0) {
                setStatusMessage(
                    `Updated. Also synced operator/weather/equipment to ${cascaded} other product row${cascaded === 1 ? '' : 's'} in this tank mix.`
                );
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update application';
            setError(message);
        }
    };

    // Task 7: Delete handler
    const handleDeleteApplication = async (id: string) => {
        if (!window.confirm('Delete this application record? This cannot be undone.')) return;
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('pesticide_applications')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setApplications(prev => prev.filter(app => app.id !== id));
            setIsDetailModalOpen(false);
            setSelectedApplication(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete application';
            setError(message);
        }
    };

    const handleViewApplication = (app: PesticideApplication) => {
        setSelectedApplication(app);
        setIsDetailModalOpen(true);
    };

    // Task 1: Bridge from calculator (supports multi-product tank mix)
    const handleRecordFromCalculator = (payload: CalculatorRecordPayload | Record<string, string>) => {
        if (payload && typeof payload === 'object' && 'shared' in payload && 'mixProducts' in payload) {
            const full = payload as CalculatorRecordPayload;
            setPrefillData(full.shared);
            setMixProducts(full.mixProducts.length > 0 ? full.mixProducts : null);
        } else {
            setPrefillData(payload as Record<string, string>);
            setMixProducts(null);
        }
        setActiveTab('applications');
        setIsAddModalOpen(true);
    };

    const filteredApplications = applications.filter(app => {
        const query = searchQuery.toLowerCase().trim();
        const product = (app.product_name ?? '').toLowerCase();
        const area = (app.area_applied ?? '').toLowerCase();
        const matchesSearch = !query || product.includes(query) || area.includes(query);
        const matchesDateFrom = !dateFrom || app.application_date >= dateFrom;
        const matchesDateTo = !dateTo || app.application_date <= dateTo;
        return matchesSearch && matchesDateFrom && matchesDateTo;
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
            setStatusMessage('Pop-up blocked — allow pop-ups for whitepine-tech.com to print the log.');
            return;
        }

        printWindow.document.write(
            buildPesticideLogPrintHtml(filteredApplications, staffMembers, {
                dateFrom: dateFrom || undefined,
                dateTo: dateTo || undefined,
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
            });
            setStatusMessage(
                `Downloaded PDF (${filteredApplications.length} record${filteredApplications.length !== 1 ? 's' : ''}).`
            );
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            setStatusMessage(`PDF download failed: ${msg}`);
        }
    };

    const inputClasses = "bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";
    const detailLabelClasses = "text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2";

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-color">
                <div>
                    <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
                        Chemical Management
                    </h2>
                    <p className="text-text-secondary text-sm font-sans">
                        Product library, spray calculations, and application records for Idaho regulatory compliance.
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

            {/* Tab Navigation */}
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

            {/* Tab Content */}
            {activeTab === 'applications' && (
                <div className="space-y-6">
                    {/* Search Bar */}
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
                                <label className="text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest whitespace-nowrap">From</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="bg-dashboard-bg border border-border-color px-3 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest whitespace-nowrap">To</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="bg-dashboard-bg border border-border-color px-3 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans"
                                />
                            </div>
                            <span className="text-xs text-text-secondary font-sans">
                                {filteredApplications.length} record{filteredApplications.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>

                    {/* List Header */}
                    <div className="grid grid-cols-6 gap-4 px-6 py-3 bg-turf-green text-white text-[0.65rem] font-heading font-black uppercase tracking-widest">
                        <span>Date</span>
                        <span>Product</span>
                        <span>Rate</span>
                        <span>Area</span>
                        <span>Operator</span>
                        <span>Method</span>
                    </div>

                    {/* List Content */}
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
                                    <PesticideListItem
                                        key={app.id}
                                        application={app}
                                        operatorName={getOperatorName(app.operator_id)}
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
            {/* Task 1: pass onRecordApplication handler */}
            {activeTab === 'calculator' && (
                <div className="pb-8">
                    <SprayCalculator onRecordApplication={handleRecordFromCalculator} />
                </div>
            )}

            {/* Add Application Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => { setIsAddModalOpen(false); setPrefillData(null); setMixProducts(null); }}
                title={
                    mixProducts && mixProducts.length > 1
                        ? `Record Application (${mixProducts.length} products in mix)`
                        : 'Record Application'
                }
                size="lg"
            >
                <PesticideForm
                    onSubmit={handleSave}
                    onCancel={() => { setIsAddModalOpen(false); setPrefillData(null); setMixProducts(null); }}
                    staffMembers={staffMembers}
                    products={products}
                    prefillData={prefillData}
                />
            </Modal>

            {/* Edit Application Modal (Task 7) */}
            <Modal
                isOpen={!!editingApplication}
                onClose={() => setEditingApplication(null)}
                title="Edit Application"
                size="lg"
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

            {/* Detail Modal */}
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
                                {selectedApplication.product_name}
                            </h3>
                            <p className="text-text-secondary text-sm mt-1">
                                Applied on {formatDate(selectedApplication.application_date)}
                                {selectedApplication.application_time && ` at ${selectedApplication.application_time}`}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {selectedApplication.epa_registration_number && (
                                <div>
                                    <label className={detailLabelClasses}>EPA Registration #</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.epa_registration_number}</p>
                                </div>
                            )}
                            {selectedApplication.active_ingredient && (
                                <div>
                                    <label className={detailLabelClasses}>Active Ingredient</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.active_ingredient}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={detailLabelClasses}>Application Rate</label>
                                <p className="text-sm text-text-primary">{selectedApplication.application_rate}</p>
                            </div>
                            {selectedApplication.total_amount_used && (
                                <div>
                                    <label className={detailLabelClasses}>Total Amount Used</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.total_amount_used}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={detailLabelClasses}>Area Applied</label>
                                <p className="text-sm text-text-primary">{selectedApplication.area_applied}</p>
                            </div>
                            {selectedApplication.area_size && (
                                <div>
                                    <label className={detailLabelClasses}>Area Size</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.area_size}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={detailLabelClasses}>Operator</label>
                                <p className="text-sm text-text-primary">{getOperatorName(selectedApplication.operator_id)}</p>
                            </div>
                            <div>
                                <label className={detailLabelClasses}>Method</label>
                                <p className="text-sm text-text-primary">{formatMethod(selectedApplication.method)}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {selectedApplication.applicator_license && (
                                <div>
                                    <label className={detailLabelClasses}>Applicator License #</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.applicator_license}</p>
                                </div>
                            )}
                            {selectedApplication.target_pest && (
                                <div>
                                    <label className={detailLabelClasses}>Target Pest</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.target_pest}</p>
                                </div>
                            )}
                            {selectedApplication.rei_hours != null && (
                                <div>
                                    <label className={detailLabelClasses}>REI</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.rei_hours} hours</p>
                                </div>
                            )}
                        </div>

                        {(selectedApplication.weather_conditions || selectedApplication.temperature || selectedApplication.wind_speed) && (
                            <div className="border-t border-border-color pt-4">
                                <h4 className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary mb-3">
                                    Weather Conditions
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {selectedApplication.temperature && (
                                        <div>
                                            <label className={detailLabelClasses}>Temperature</label>
                                            <p className="text-sm text-text-primary">{selectedApplication.temperature}°F</p>
                                        </div>
                                    )}
                                    {selectedApplication.wind_speed && (
                                        <div>
                                            <label className={detailLabelClasses}>Wind Speed</label>
                                            <p className="text-sm text-text-primary">{selectedApplication.wind_speed} mph</p>
                                        </div>
                                    )}
                                    {selectedApplication.wind_direction && (
                                        <div>
                                            <label className={detailLabelClasses}>Wind Direction</label>
                                            <p className="text-sm text-text-primary">{selectedApplication.wind_direction}</p>
                                        </div>
                                    )}
                                    {selectedApplication.humidity && (
                                        <div>
                                            <label className={detailLabelClasses}>Humidity</label>
                                            <p className="text-sm text-text-primary">{selectedApplication.humidity}%</p>
                                        </div>
                                    )}
                                    {selectedApplication.weather_conditions && (
                                        <div>
                                            <label className={detailLabelClasses}>Conditions</label>
                                            <p className="text-sm text-text-primary">{selectedApplication.weather_conditions}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Paper form fields */}
                        <div className="border-t border-border-color pt-4">
                            <h4 className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary mb-3">
                                Compliance Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={detailLabelClasses}>WPS Briefing</label>
                                    <p className="text-sm text-text-primary">{selectedApplication.worker_protection_exchange ? 'Completed' : 'Not completed'}</p>
                                </div>
                                {selectedApplication.recommended_by && (
                                    <div>
                                        <label className={detailLabelClasses}>Recommended By</label>
                                        <p className="text-sm text-text-primary">{staffMembers.find(s => sameId(s.id, selectedApplication.recommended_by))?.name || '--'}</p>
                                    </div>
                                )}
                                {selectedApplication.manufacturer && (
                                    <div>
                                        <label className={detailLabelClasses}>Manufacturer</label>
                                        <p className="text-sm text-text-primary">{selectedApplication.manufacturer}</p>
                                    </div>
                                )}
                                {selectedApplication.epa_lot_number && (
                                    <div>
                                        <label className={detailLabelClasses}>EPA Lot Number</label>
                                        <p className="text-sm text-text-primary">{selectedApplication.epa_lot_number}</p>
                                    </div>
                                )}
                                {selectedApplication.amount_per_tank && (
                                    <div>
                                        <label className={detailLabelClasses}>Amount per Tank</label>
                                        <p className="text-sm text-text-primary">{selectedApplication.amount_per_tank}</p>
                                    </div>
                                )}
                                {selectedApplication.equipment_used && (
                                    <div>
                                        <label className={detailLabelClasses}>Equipment Used</label>
                                        <p className="text-sm text-text-primary">{selectedApplication.equipment_used}</p>
                                    </div>
                                )}
                            </div>
                            {selectedApplication.worker_protection_requirements && (
                                <div className="mt-3">
                                    <label className={detailLabelClasses}>Worker Protection Requirements</label>
                                    <p className="text-xs text-text-secondary leading-relaxed">{selectedApplication.worker_protection_requirements}</p>
                                </div>
                            )}
                        </div>

                        {selectedApplication.notes && (
                            <div className="border-t border-border-color pt-4">
                                <label className={detailLabelClasses}>Notes</label>
                                <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedApplication.notes}</p>
                            </div>
                        )}

                        {/* Task 7: Edit/Delete footer */}
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
                                onClick={() => handleDeleteApplication(selectedApplication.id)}
                                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-red-100 transition-all text-[0.65rem] uppercase tracking-[0.15em]"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <ApplicationPrintView
                ref={printRef}
                applications={filteredApplications}
                staffMembers={staffMembers}
            />
        </div>
    );
}
