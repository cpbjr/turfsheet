import { X } from 'lucide-react';

interface JobCardProps {
    title: string;
    direction?: string;
    cleanup?: string;
    hoc?: string;
    crewNeeded: number;
    priority?: string;
}

export default function JobCard({ title, direction, cleanup, hoc, crewNeeded, priority }: JobCardProps) {
    return (
        <article className="bg-panel-white border border-border-color shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
            <div className="bg-turf-green px-4 py-3 flex items-center justify-between">
                <h4 className="text-white font-heading font-black text-xs uppercase tracking-widest truncate mr-2">
                    {title}
                </h4>
                <X className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
            </div>
            <div className="p-5 space-y-3 font-sans">
                {priority && priority !== 'Normal' && (
                    <div className={`inline-block px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${priority === 'Urgent' ? 'bg-red-500 text-white' :
                            priority === 'High' ? 'bg-accent-orange text-white' : 'bg-accent-grey text-white'
                        }`}>
                        {priority}
                    </div>
                )}

                {direction && (
                    <div className="text-[0.8rem] text-text-primary">
                        <span className="font-bold">Mow Direction:</span> {direction}
                    </div>
                )}
                {cleanup && (
                    <div className="text-[0.8rem] text-text-primary">
                        <span className="font-bold">Clean Up:</span> {cleanup}
                    </div>
                )}
                {hoc && (
                    <div className="text-[0.8rem] text-text-primary">
                        <span className="font-bold">HOC:</span> {hoc}
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
