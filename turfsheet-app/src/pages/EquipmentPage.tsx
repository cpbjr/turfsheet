import { useState, useEffect } from 'react';
import { Search, Plus, LayoutGrid, List, Upload } from 'lucide-react';
import EquipmentCard from '../components/equipment/EquipmentCard';
import Modal from '../components/ui/Modal';
import EquipmentForm from '../components/equipment/EquipmentForm';
import EquipmentBatchUpload from '../components/equipment/EquipmentBatchUpload';
import { supabase } from '../lib/supabase';
import type { Equipment } from '../types';

export default function EquipmentPage() {
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isBatchUploadModalOpen, setIsBatchUploadModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchEquipment();
    }, []);

    const fetchEquipment = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('equipment')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setEquipment(data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch equipment';
            setError(message);
            console.error('Error fetching equipment:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEquipment = async (formData: any) => {
        try {
            setError(null);
            console.log('Inserting equipment:', formData);
            const { data, error: insertError } = await supabase
                .from('equipment')
                .insert([formData])
                .select();

            if (insertError) throw insertError;

            console.log('Equipment created successfully:', data);
            setEquipment([...(data || []), ...equipment]);
            setIsAddEquipmentModalOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create equipment';
            setError(message);
            console.error('Error creating equipment:', err);
        }
    };

    const handleViewEquipment = (item: Equipment) => {
        setSelectedEquipment(item);
        setIsDetailModalOpen(true);
    };

    const handleDeleteEquipment = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this equipment?')) return;

        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('equipment')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setEquipment(equipment.filter(e => e.id !== id));
            setIsDetailModalOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete equipment';
            setError(message);
            console.error('Error deleting equipment:', err);
        }
    };

    const handleBatchUpload = async (equipmentList: Partial<Equipment>[]) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('equipment')
                .insert(equipmentList)
                .select();

            if (insertError) throw insertError;

            console.log('Batch upload successful:', data);
            await fetchEquipment(); // Refresh the list
            setIsBatchUploadModalOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to upload equipment';
            setError(message);
            console.error('Error uploading equipment:', err);
            throw err;
        }
    };

    const inputClasses = "bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";

    // Filter equipment based on search and filters
    const filteredEquipment = equipment.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.model?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        const matchesStatus = !statusFilter || item.status === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="space-y-12 h-full flex flex-col">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-color">
                <div>
                    <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
                        Equipment Inventory
                    </h2>
                    <p className="text-text-secondary text-sm font-sans">
                        Manage your equipment inventory, maintenance records, and asset tracking.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsBatchUploadModalOpen(true)}
                        className="bg-panel-white border border-border-color text-text-primary px-6 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-dashboard-bg hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]"
                    >
                        <Upload className="w-5 h-5" />
                        Batch Upload
                    </button>
                    <button
                        onClick={() => setIsAddEquipmentModalOpen(true)}
                        className="bg-turf-green text-white px-8 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]"
                    >
                        <Plus className="w-5 h-5" />
                        Add Equipment
                    </button>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-panel-white p-4 border border-border-color shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search equipment..."
                        className={`${inputClasses} pl-10 w-full`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <select
                        className={`${inputClasses} text-xs font-heading font-black uppercase tracking-widest cursor-pointer`}
                        value={categoryFilter || ''}
                        onChange={(e) => setCategoryFilter(e.target.value || null)}
                    >
                        <option value="">All Categories</option>
                        <option value="Mowers">Mowers</option>
                        <option value="Carts">Carts</option>
                        <option value="Tools">Tools</option>
                        <option value="Other">Other</option>
                    </select>
                    <select
                        className={`${inputClasses} text-xs font-heading font-black uppercase tracking-widest cursor-pointer`}
                        value={statusFilter || ''}
                        onChange={(e) => setStatusFilter(e.target.value || null)}
                    >
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Retired">Retired</option>
                    </select>
                    <div className="ml-auto lg:ml-4 flex border border-border-color">
                        <button className="p-2 bg-dashboard-bg border-r border-border-color text-turf-green">
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-dashboard-bg text-text-muted transition-colors">
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Equipment Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-text-secondary">Loading equipment...</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-red-500">Error: {error}</p>
                    </div>
                )}
                {!loading && !error && filteredEquipment.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-dashed rounded-sm">
                        <p className="text-text-secondary font-sans text-sm">
                            {searchQuery || categoryFilter || statusFilter
                                ? 'No equipment found matching your filters.'
                                : 'No equipment in your inventory yet.'}
                        </p>
                    </div>
                )}
                {!loading && !error && filteredEquipment.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-12">
                        {filteredEquipment.map((item) => (
                            <EquipmentCard
                                key={item.id}
                                name={item.name}
                                equipment_number={item.equipment_number}
                                category={item.category}
                                status={item.status}
                                model={item.model}
                                manufacturer={item.manufacturer}
                                description={item.description}
                                onClick={() => handleViewEquipment(item)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Equipment Modal */}
            <Modal
                isOpen={isAddEquipmentModalOpen}
                onClose={() => setIsAddEquipmentModalOpen(false)}
                title="Add Equipment"
            >
                <EquipmentForm
                    onSubmit={handleSaveEquipment}
                    onCancel={() => setIsAddEquipmentModalOpen(false)}
                />
            </Modal>

            {/* Equipment Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Equipment Details"
            >
                {selectedEquipment && (
                    <div className="space-y-6 font-sans">
                        {/* Header Section */}
                        <div className="pb-4 border-b border-border-color">
                            <h3 className="text-2xl font-heading font-black text-text-primary uppercase tracking-tight">
                                {selectedEquipment.name}
                            </h3>
                            {selectedEquipment.equipment_number && (
                                <p className="text-text-secondary text-sm mt-1">
                                    Equipment #{selectedEquipment.equipment_number}
                                </p>
                            )}
                        </div>

                        {/* Status and Category */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                    Status
                                </label>
                                <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                    selectedEquipment.status === 'Active' ? 'bg-turf-green' :
                                    selectedEquipment.status === 'Maintenance' ? 'bg-accent-orange' :
                                    'bg-accent-grey'
                                } text-white`}>
                                    {selectedEquipment.status}
                                </span>
                            </div>
                            <div>
                                <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                    Category
                                </label>
                                <p className="text-sm text-text-primary">{selectedEquipment.category}</p>
                            </div>
                        </div>

                        {/* Manufacturer and Model */}
                        {(selectedEquipment.manufacturer || selectedEquipment.model) && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedEquipment.manufacturer && (
                                    <div>
                                        <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                            Manufacturer
                                        </label>
                                        <p className="text-sm text-text-primary">{selectedEquipment.manufacturer}</p>
                                    </div>
                                )}
                                {selectedEquipment.model && (
                                    <div>
                                        <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                            Model
                                        </label>
                                        <p className="text-sm text-text-primary">{selectedEquipment.model}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {selectedEquipment.description && (
                            <div>
                                <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                    Description
                                </label>
                                <p className="text-sm text-text-primary">{selectedEquipment.description}</p>
                            </div>
                        )}

                        {/* Purchase Information */}
                        {(selectedEquipment.purchase_date || selectedEquipment.purchase_cost) && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedEquipment.purchase_date && (
                                    <div>
                                        <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                            Purchase Date
                                        </label>
                                        <p className="text-sm text-text-primary">
                                            {new Date(selectedEquipment.purchase_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {selectedEquipment.purchase_cost && (
                                    <div>
                                        <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                            Purchase Cost
                                        </label>
                                        <p className="text-sm text-text-primary">
                                            ${selectedEquipment.purchase_cost.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Maintenance Information */}
                        {(selectedEquipment.last_serviced_date || selectedEquipment.maintenance_notes) && (
                            <div className="border-t border-border-color pt-4">
                                <h4 className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary mb-3">
                                    Maintenance
                                </h4>
                                {selectedEquipment.last_serviced_date && (
                                    <div className="mb-3">
                                        <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-1">
                                            Last Serviced
                                        </label>
                                        <p className="text-sm text-text-primary">
                                            {new Date(selectedEquipment.last_serviced_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                )}
                                {selectedEquipment.maintenance_notes && (
                                    <div>
                                        <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-1">
                                            Notes
                                        </label>
                                        <p className="text-sm text-text-primary whitespace-pre-wrap">
                                            {selectedEquipment.maintenance_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4 border-t border-border-color">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 bg-panel-white border border-border-color px-6 py-3 font-heading font-black text-xs uppercase tracking-wider text-text-primary hover:bg-dashboard-bg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleDeleteEquipment(selectedEquipment.id)}
                                className="px-6 py-3 bg-red-500 text-white font-heading font-black text-xs uppercase tracking-wider hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Batch Upload Modal */}
            <Modal
                isOpen={isBatchUploadModalOpen}
                onClose={() => setIsBatchUploadModalOpen(false)}
                title="Batch Upload Equipment"
            >
                <EquipmentBatchUpload
                    onUpload={handleBatchUpload}
                    onCancel={() => setIsBatchUploadModalOpen(false)}
                />
            </Modal>
        </div>
    );
}
