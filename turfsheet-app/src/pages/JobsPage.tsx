import { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';
import JobCard from '../components/jobs/JobCard';
import { supabase } from '../lib/supabase';
import type { Job } from '../types';

export default function JobsPage() {
    const [jobTemplates, setJobTemplates] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                setError(null);
                const { data, error: fetchError } = await supabase
                    .from('jobs')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (fetchError) throw fetchError;
                setJobTemplates(data || []);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to fetch jobs';
                setError(message);
                console.error('Error fetching jobs:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

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
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-text-secondary">Loading jobs...</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-red-500">Error: {error}</p>
                    </div>
                )}
                {!loading && !error && jobTemplates.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-dashed rounded-sm">
                        <p className="text-text-secondary font-sans text-sm">No jobs in your library yet.</p>
                    </div>
                )}
                {!loading && !error && jobTemplates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-12">
                        {jobTemplates.map((job) => (
                            <JobCard
                                key={job.id}
                                title={job.title}
                                crewNeeded={job.crew_needed}
                                priority={job.priority}
                                description={job.description}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
