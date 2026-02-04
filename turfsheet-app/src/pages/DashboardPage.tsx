import { Plus } from 'lucide-react';
import JobCard from '../components/jobs/JobCard';

interface DashboardPageProps {
    onCreateJob?: () => void;
}

export default function DashboardPage({ onCreateJob }: DashboardPageProps) {
    // Sample active jobs
    const firstJobs = [
        { id: 1, title: 'Mow Greens', direction: '8-2 (L to R)', cleanup: 'Clockwise', hoc: '0.125"', crewNeeded: 3 },
        { id: 2, title: 'Mow Fairways', direction: '50:50 Tuxedo', cleanup: 'Tan & Black', crewNeeded: 4 },
    ];

    const secondJobs = [
        { id: 3, title: 'Change Cups', hoc: 'Pin Sheet 4', crewNeeded: 1 },
    ];

    return (
        <div className="flex flex-col space-y-24">
            {/* First Jobs Section */}
            <section>
                <h3 className="text-[0.75rem] font-heading font-black text-text-secondary uppercase px-10 py-6 border-b border-border-color tracking-[0.3em] mb-8 bg-panel-white border border-border-color">
                    First Jobs Portfolio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {firstJobs.map(job => (
                        <JobCard key={job.id} {...job} />
                    ))}
                    <button
                        onClick={onCreateJob}
                        className="border-2 border-dashed border-border-color bg-panel-white/50 p-8 flex flex-col items-center justify-center gap-4 group hover:border-turf-green transition-colors min-h-[250px]"
                    >
                        <div className="w-12 h-12 rounded-full border border-border-color flex items-center justify-center group-hover:border-turf-green group-hover:bg-turf-green/5 transition-all">
                            <Plus className="w-6 h-6 text-text-muted group-hover:text-turf-green" />
                        </div>
                        <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest group-hover:text-turf-green">Add First Job</span>
                    </button>
                </div>
            </section>

            {/* Accent Divider - Medium Thickness Line */}
            <div className="flex items-center gap-6">
                <div className="flex-1 h-[2px] bg-turf-green/20"></div>
                <div className="flex gap-4">
                    <div className="w-2 h-2 bg-turf-green/40 rotate-45"></div>
                    <div className="w-2 h-2 bg-turf-green/60 rotate-45"></div>
                    <div className="w-2 h-2 bg-turf-green/40 rotate-45"></div>
                </div>
                <div className="flex-1 h-[2px] bg-turf-green/20"></div>
            </div>

            {/* Second Jobs Section */}
            <section>
                <h3 className="text-[0.75rem] font-heading font-black text-text-secondary uppercase px-10 py-6 border-b border-border-color tracking-[0.3em] mb-8 bg-panel-white border border-border-color">
                    Second Jobs Portfolio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                    {secondJobs.map(job => (
                        <JobCard key={job.id} {...job} />
                    ))}
                    <button
                        onClick={onCreateJob}
                        className="border-2 border-dashed border-border-color bg-panel-white/50 p-8 flex flex-col items-center justify-center gap-4 group hover:border-turf-green transition-colors min-h-[250px]"
                    >
                        <div className="w-12 h-12 rounded-full border border-border-color flex items-center justify-center group-hover:border-turf-green group-hover:bg-turf-green/5 transition-all">
                            <Plus className="w-6 h-6 text-text-muted group-hover:text-turf-green" />
                        </div>
                        <span className="text-[0.7rem] font-heading font-black text-text-muted uppercase tracking-widest group-hover:text-turf-green">Add Second Job</span>
                    </button>
                </div>
            </section>
        </div>
    );
}
