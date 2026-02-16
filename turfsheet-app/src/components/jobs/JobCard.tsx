import { X } from 'lucide-react';

interface JobCardProps {
    title: string;
    crewNeeded: number;
    priority?: string;
    description?: string;
    section?: 'First Jobs' | 'Second Jobs';
}

export default function JobCard({ title, crewNeeded, priority, description, section }: JobCardProps) {
    return (
        <article className="bg-panel-white border border-border-color shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="bg-turf-green px-4 py-3 flex items-center justify-between">
                <h4 className="text-white font-heading font-black text-xs uppercase tracking-widest truncate mr-2">
                    {title}
                </h4>
                <X className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
            </div>
            <div className="p-5 space-y-3 font-sans">
                <div className="flex gap-2 flex-wrap">
                    {priority && priority !== 'Normal' && (
                        <div className={`inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${priority === 'Urgent' ? 'bg-red-500 text-white' :
                                priority === 'High' ? 'bg-accent-orange text-white' : 'bg-accent-grey text-white'
                            }`}>
                            {priority}
                        </div>
                    )}
                    {section && (
                        <div className={`inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${
                            section === 'First Jobs'
                                ? 'bg-turf-green text-white'
                                : 'bg-blue-500 text-white'
                        }`}>
                            {section}
                        </div>
                    )}
                </div>

                {description && (
                    <div className="text-[0.8rem] text-text-primary">
                        {description}
                    </div>
                )}

                <div className="pt-2">
                    <div className="text-[0.8rem] text-turf-green font-bold">
                        Crew Needed: {crewNeeded}
                    </div>
                    <button className="text-[0.8rem] text-turf-green font-bold hover:text-turf-green-dark transition-colors inline-block mt-1">
                        Assign Crew
                    </button>
                </div>
            </div>
        </article>
    );
}
