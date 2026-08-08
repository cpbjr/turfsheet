import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatMethod } from '../../lib/pesticideOptions';
import { productSummary, resolveMethod } from '../../lib/pesticideApplication';
import type { PesticideApplicationWithProducts } from '../../types';

interface PesticideEventRowProps {
    event: PesticideApplicationWithProducts;
    operatorName: string;
    expanded: boolean;
    onToggleExpand: () => void;
    onClick: () => void;
}

export default function PesticideEventRow({
    event,
    operatorName,
    expanded,
    onToggleExpand,
    onClick,
}: PesticideEventRowProps) {
    const products = event.products ?? [];
    const multi = products.length > 1;

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="border-b border-border-color">
            <div
                onClick={onClick}
                className="grid grid-cols-[28px_1.2fr_2fr_1.5fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-dashboard-bg cursor-pointer transition-colors items-center"
            >
                <button
                    type="button"
                    disabled={!multi}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (multi) onToggleExpand();
                    }}
                    className={`flex items-center justify-center w-6 h-6 rounded ${
                        multi
                            ? 'text-text-secondary hover:text-text-primary hover:bg-panel-white'
                            : 'text-transparent cursor-default'
                    }`}
                    aria-label={expanded ? 'Collapse products' : 'Expand products'}
                >
                    {multi ? (
                        expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                    ) : (
                        <span className="w-4" />
                    )}
                </button>
                <span className="text-sm font-sans text-text-primary">
                    {formatDate(event.application_date)}
                    {event.application_time ? (
                        <span className="text-text-secondary text-xs ml-1">{event.application_time}</span>
                    ) : null}
                </span>
                <span className="text-sm font-sans text-text-primary font-medium">
                    {productSummary(products)}
                </span>
                <span className="text-sm font-sans text-text-secondary">
                    {event.area_applied}
                </span>
                <span className="text-sm font-sans text-text-secondary">
                    {operatorName}
                </span>
                <span className="text-sm font-sans text-text-secondary">
                    {formatMethod(event.method)}
                </span>
            </div>

            {expanded && multi && (
                <div className="bg-dashboard-bg border-t border-border-color px-6 py-3">
                    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-3 text-[0.6rem] font-heading font-black uppercase tracking-widest text-text-secondary mb-2 pl-7">
                        <span>Product</span>
                        <span>Rate</span>
                        <span>Target</span>
                        <span>Method</span>
                    </div>
                    {[...products]
                        .sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0))
                        .map((p) => (
                            <div
                                key={p.id}
                                className="grid grid-cols-[2fr_1.5fr_1fr_1fr] gap-3 text-sm font-sans text-text-primary py-1.5 pl-7"
                            >
                                <span className="font-medium">{p.product_name}</span>
                                <span className="text-text-secondary">{p.application_rate}</span>
                                <span className="text-text-secondary">{p.target_pest || '—'}</span>
                                <span className="text-text-secondary">
                                    {formatMethod(resolveMethod(event, p))}
                                </span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
