import { X } from 'lucide-react';

interface EquipmentCardProps {
    name: string;
    category: string;
    status: string;
    model?: string;
    manufacturer?: string;
    description?: string;
    onDelete?: () => void;
}

export default function EquipmentCard({
    name,
    category,
    status,
    model,
    manufacturer,
    description,
    onDelete
}: EquipmentCardProps) {
    const statusColors = {
        Active: 'bg-green-500',
        Maintenance: 'bg-accent-orange',
        Retired: 'bg-accent-grey'
    };

    return (
        <article className="bg-panel-white border border-border-color shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="bg-turf-green px-4 py-3 flex items-center justify-between">
                <h4 className="text-white font-heading font-black text-xs uppercase tracking-widest truncate mr-2">
                    {name}
                </h4>
                {onDelete && (
                    <X
                        className="w-4 h-4 text-white/60 group-hover:text-white transition-colors cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    />
                )}
            </div>
            <div className="p-5 space-y-3 font-sans">
                <div className="flex items-center gap-2">
                    <span className={`inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${statusColors[status as keyof typeof statusColors]} text-white`}>
                        {status}
                    </span>
                    <span className="text-[0.65rem] text-text-secondary uppercase tracking-wider">
                        {category}
                    </span>
                </div>

                {(manufacturer || model) && (
                    <div className="text-[0.75rem] text-text-primary">
                        {manufacturer && <span className="font-bold">{manufacturer}</span>}
                        {manufacturer && model && <span> - </span>}
                        {model && <span>{model}</span>}
                    </div>
                )}

                {description && (
                    <div className="text-[0.8rem] text-text-primary">
                        {description}
                    </div>
                )}

                <div className="pt-2">
                    <button className="text-[0.8rem] text-turf-green font-bold hover:text-turf-green-dark transition-colors inline-block">
                        View Details
                    </button>
                </div>
            </div>
        </article>
    );
}
