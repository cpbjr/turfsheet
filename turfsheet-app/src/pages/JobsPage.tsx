import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';
import JobCard from '../components/jobs/JobCard';

export default function JobsPage() {
    const jobTemplates = [
        { id: 1, title: 'Mow Greens', direction: '8-2 (L to R)', cleanup: 'Clockwise', hoc: '0.125"', crewNeeded: 3 },
        { id: 2, title: 'Mow Fairways', direction: '50:50 Tuxedo', cleanup: 'Tan & Black', crewNeeded: 4 },
        { id: 3, title: 'Mow Approaches', direction: '3-9 (Side to Side)', cleanup: 'Clockwise', crewNeeded: 2 },
        { id: 4, title: 'Roll Greens', crewNeeded: 2 },
        { id: 5, title: 'Change Cups', hoc: 'Pin Sheet 4', crewNeeded: 1 },
        { id: 6, title: 'Bunker Raking', crewNeeded: 5 },
        { id: 7, title: 'Fairway Aerification', crewNeeded: 8, priority: 'High' },
        { id: 8, title: 'Irrigation Repair', crewNeeded: 1, priority: 'Urgent' },
    ];

    const inputClasses = "bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";

    return (
        <div className="space-y-12 h-full flex flex-col">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-color">
                <div>
                    <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
                        Job Library
                    </h2>
                    <p className="text-text-secondary text-sm font-sans">
                        Manage your standing job templates and specialized maintenance routines.
                    </p>
                </div>
                <button className="bg-turf-green text-white px-8 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]">
                    <Plus className="w-5 h-5" />
                    Add Job Template
                </button>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-panel-white p-4 border border-border-color shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        className={`${inputClasses} pl-10 w-full`}
                    />
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 px-3 py-2 border border-border-color text-text-secondary text-xs font-heading font-black uppercase tracking-widest cursor-pointer hover:bg-dashboard-bg">
                        <Filter className="w-4 h-4" />
                        Category
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 border border-border-color text-text-secondary text-xs font-heading font-black uppercase tracking-widest cursor-pointer hover:bg-dashboard-bg">
                        <Filter className="w-4 h-4" />
                        Priotity
                    </div>
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

            {/* Jobs Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-12">
                    {jobTemplates.map((job) => (
                        <JobCard key={job.id} {...job} />
                    ))}
                </div>
            </div>
        </div>
    );
}
