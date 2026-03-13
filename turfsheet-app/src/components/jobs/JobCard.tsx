import { Pencil } from 'lucide-react';

interface JobCardProps {
    title: string;
    crewNeeded: number;
    priority?: string;
    description?: string;
    section?: 'First Jobs' | 'Second Jobs';
    onEdit?: () => void;
    isScheduled?: boolean;
    scheduledDays?: string[];
    jobType?: string;
    mowDirection?: string;
    hoc?: number;
    mowPattern?: string;
}

export default function JobCard({ title, crewNeeded, priority, description, section, onEdit, isScheduled, scheduledDays, jobType, mowDirection, hoc, mowPattern }: JobCardProps) {
    return (
        <article className="bg-panel-white border border-border-color shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
            <div className="bg-turf-green px-4 py-3 flex items-center justify-between">
                <h4 className="text-white font-heading font-black text-xs uppercase tracking-widest truncate mr-2">
                    {title}
                </h4>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="text-white/60 hover:text-white transition-colors flex-shrink-0"
                        title="Edit job"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                )}
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
                    {isScheduled && scheduledDays && scheduledDays.length > 0 && (
                        <div className="inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider bg-indigo-500 text-white">
                            {scheduledDays.map(d => d.slice(0, 3)).join(' · ')}
                        </div>
                    )}
                </div>

                {description && (
                    <div className="text-[0.8rem] text-text-primary">
                        {description}
                    </div>
                )}

                {jobType === 'Mowing' && (mowDirection || hoc || mowPattern) && (
                    <div className="pt-2 border-t border-border-color space-y-1">
                        {mowDirection && (
                            <div className="text-[0.75rem] font-sans">
                                <span className="text-text-secondary">Direction: </span>
                                <span className="text-text-primary font-bold">{mowDirection}</span>
                            </div>
                        )}
                        {hoc && (
                            <div className="text-[0.75rem] font-sans">
                                <span className="text-text-secondary">HOC: </span>
                                <span className="text-text-primary font-bold">{hoc}"</span>
                            </div>
                        )}
                        {mowPattern && (
                            <div className="text-[0.75rem] font-sans">
                                <span className="text-text-secondary">Pattern: </span>
                                <span className="text-text-primary font-bold">{mowPattern}</span>
                            </div>
                        )}
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
