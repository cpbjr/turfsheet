import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import ProductForm from './ProductForm';
import { supabase } from '../../lib/supabase';
import type { ChemicalProduct } from '../../types';

const TYPE_LABELS: Record<string, string> = {
    FERTILIZER: 'Fertilizer',
    HERBICIDE: 'Herbicide',
    FUNGICIDE: 'Fungicide',
    INSECTICIDE: 'Insecticide',
    PGR: 'PGR',
    ALGAECIDE: 'Algaecide',
    IRON_SUPPLEMENT: 'Iron',
    SURFACTANT: 'Surfactant',
    OTHER: 'Other',
};

const TYPE_COLORS: Record<string, string> = {
    FERTILIZER: 'bg-green-100 text-green-800',
    HERBICIDE: 'bg-red-100 text-red-800',
    FUNGICIDE: 'bg-purple-100 text-purple-800',
    INSECTICIDE: 'bg-orange-100 text-orange-800',
    PGR: 'bg-blue-100 text-blue-800',
    ALGAECIDE: 'bg-cyan-100 text-cyan-800',
    IRON_SUPPLEMENT: 'bg-amber-100 text-amber-800',
    SURFACTANT: 'bg-slate-100 text-slate-800',
    OTHER: 'bg-gray-100 text-gray-800',
};

export default function ProductLibrary() {
    const [products, setProducts] = useState<ChemicalProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ChemicalProduct | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('chemical_products')
                .select('*')
                .order('name');

            if (fetchError) throw fetchError;
            setProducts(data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch products';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (formData: any) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('chemical_products')
                .insert([formData])
                .select();

            if (insertError) throw insertError;
            setProducts([...(data || []), ...products].sort((a, b) => a.name.localeCompare(b.name)));
            setIsAddModalOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add product';
            setError(message);
        }
    };

    const handleUpdate = async (formData: any) => {
        if (!editingProduct) return;
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('chemical_products')
                .update(formData)
                .eq('id', editingProduct.id)
                .select();

            if (updateError) throw updateError;
            setProducts(products.map(p => p.id === editingProduct.id ? (data?.[0] || p) : p));
            setEditingProduct(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update product';
            setError(message);
        }
    };

    const handleDelete = async (product: ChemicalProduct) => {
        if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('chemical_products')
                .delete()
                .eq('id', product.id);

            if (deleteError) throw deleteError;
            setProducts(products.filter(p => p.id !== product.id));
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete product';
            setError(message);
        }
    };

    const filteredProducts = products.filter(p => {
        const query = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query) ||
            (p.active_ingredient || '').toLowerCase().includes(query) ||
            (p.manufacturer || '').toLowerCase().includes(query);
    });

    const formatRate = (product: ChemicalProduct) => {
        if (!product.default_rate) return '--';
        const unitLabel = product.rate_unit.replace('sqft', ' sq ft');
        return `${product.default_rate} ${unitLabel}`;
    };

    const inputClasses = "bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-panel-white p-4 border border-border-color shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className={`${inputClasses} pl-10 w-full`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-turf-green text-white px-6 py-3 shadow-sm flex items-center gap-2 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-0.5 transition-all duration-300 text-[0.7rem] uppercase tracking-[0.15em]"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {/* Product Table */}
            <div className="flex-1 overflow-y-auto">
                {/* Header */}
                <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_80px] gap-4 px-6 py-3 bg-turf-green text-white text-[0.65rem] font-heading font-black uppercase tracking-widest">
                    <span>Product</span>
                    <span>Type</span>
                    <span>Active Ingredient</span>
                    <span>Label Rate</span>
                    <span>REI</span>
                    <span></span>
                </div>

                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-text-secondary">Loading products...</p>
                    </div>
                )}

                {!loading && filteredProducts.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-t-0 border-dashed">
                        <p className="text-text-secondary font-sans text-sm">
                            {searchQuery ? 'No products match your search.' : 'No products in library yet.'}
                        </p>
                    </div>
                )}

                {!loading && filteredProducts.length > 0 && (
                    <div className="bg-panel-white border border-border-color border-t-0">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_80px] gap-4 px-6 py-4 border-b border-border-color hover:bg-dashboard-bg transition-colors items-center"
                            >
                                <div>
                                    <p className="text-sm font-sans text-text-primary font-medium">{product.name}</p>
                                    {product.manufacturer && (
                                        <p className="text-xs text-text-secondary mt-0.5">{product.manufacturer}</p>
                                    )}
                                </div>
                                <span className={`inline-flex items-center px-2 py-1 text-[0.6rem] font-heading font-black uppercase tracking-wider w-fit ${TYPE_COLORS[product.type] || TYPE_COLORS.OTHER}`}>
                                    {TYPE_LABELS[product.type] || product.type}
                                </span>
                                <span className="text-sm font-sans text-text-secondary">
                                    {product.active_ingredient || (product.analysis ? `NPK: ${product.analysis}` : '--')}
                                </span>
                                <span className="text-sm font-sans text-text-secondary">
                                    {formatRate(product)}
                                </span>
                                <span className="text-sm font-sans text-text-secondary">
                                    {product.rei_hours ? `${product.rei_hours}h` : '--'}
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setEditingProduct(product)}
                                        className="p-1.5 text-text-secondary hover:text-turf-green transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product)}
                                        className="p-1.5 text-text-secondary hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Product"
            >
                <ProductForm
                    onSubmit={handleAdd}
                    onCancel={() => setIsAddModalOpen(false)}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingProduct}
                onClose={() => setEditingProduct(null)}
                title="Edit Product"
            >
                {editingProduct && (
                    <ProductForm
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingProduct(null)}
                        initialData={editingProduct}
                    />
                )}
            </Modal>
        </div>
    );
}
