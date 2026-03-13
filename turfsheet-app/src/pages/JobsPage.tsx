import { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutGrid, List } from 'lucide-react';
import JobCard from '../components/jobs/JobCard';
import Modal from '../components/ui/Modal';
import JobForm from '../components/jobs/JobForm';
import { supabase } from '../lib/supabase';
import type { Job, JobType } from '../types';

export default function JobsPage() {
    const [jobTemplates, setJobTemplates] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
    const [isEditJobModalOpen, setIsEditJobModalOpen] = useState(false);
    const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [activeTab, setActiveTab] = useState<JobType>('General');

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

    const handleSaveJob = async (formData: any) => {
        try {
            setError(null);
            const { data, error: insertError } = await supabase
                .from('jobs')
                .insert([formData])
                .select();

            if (insertError) throw insertError;

            setJobTemplates([...(data || []), ...jobTemplates]);
            setIsAddJobModalOpen(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to create job template';
            setError(message);
            console.error('Error creating job template:', err);
        }
    };

    const handleEditJob = (job: Job) => {
        setJobToEdit(job);
        setConfirmDelete(false);
        setIsEditJobModalOpen(true);
    };

    const handleUpdateJob = async (formData: any) => {
        if (!jobToEdit) return;
        try {
            setError(null);
            const { data, error: updateError } = await supabase
                .from('jobs')
                .update(formData)
                .eq('id', jobToEdit.id)
                .select();

            if (updateError) throw updateError;

            setJobTemplates(jobTemplates.map((j) => (j.id === jobToEdit.id ? data![0] : j)));
            setIsEditJobModalOpen(false);
            setJobToEdit(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update job template';
            setError(message);
            console.error('Error updating job template:', err);
        }
    };

    const handleDeleteJob = async () => {
        if (!jobToEdit) return;
        try {
            setError(null);
            const { error: deleteError } = await supabase
                .from('jobs')
                .delete()
                .eq('id', jobToEdit.id);

            if (deleteError) throw deleteError;

            setJobTemplates(jobTemplates.filter((j) => j.id !== jobToEdit.id));
            setIsEditJobModalOpen(false);
            setJobToEdit(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete job template';
            setError(message);
            console.error('Error deleting job template:', err);
        }
    };

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
                <button onClick={() => setIsAddJobModalOpen(true)} className="bg-turf-green text-white px-8 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]">
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
                        Priority
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

            {/* Tab Bar */}
            <div className="flex gap-0 border-b border-border-color">
                {(['General', 'Mowing'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-3 text-[0.65rem] font-heading font-black uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                            activeTab === tab
                                ? 'border-turf-green text-turf-green'
                                : 'border-transparent text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tab} Jobs
                    </button>
                ))}
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
                {!loading && !error && jobTemplates.filter((j) => j.job_type === activeTab).length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-dashed rounded-sm">
                        <p className="text-text-secondary font-sans text-sm">No {activeTab.toLowerCase()} jobs in your library yet.</p>
                    </div>
                )}
                {!loading && !error && jobTemplates.filter((j) => j.job_type === activeTab).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-12">
                        {jobTemplates.filter((j) => j.job_type === activeTab).map((job) => (
                            <JobCard
                                key={job.id}
                                title={job.title}
                                crewNeeded={job.crew_needed}
                                priority={job.priority}
                                description={job.description}
                                section={job.section}
                                isScheduled={job.is_scheduled}
                                scheduledDays={job.scheduled_days}
                                jobType={job.job_type}
                                mowDirection={job.mow_direction}
                                hoc={job.hoc}
                                mowPattern={job.mow_pattern}
                                onEdit={() => handleEditJob(job)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Job Modal */}
            <Modal
                isOpen={isAddJobModalOpen}
                onClose={() => setIsAddJobModalOpen(false)}
                title="Add Job Template"
            >
                <JobForm
                    onSubmit={handleSaveJob}
                    onCancel={() => setIsAddJobModalOpen(false)}
                />
            </Modal>

            {/* Edit Job Modal */}
            <Modal
                isOpen={isEditJobModalOpen}
                onClose={() => { setIsEditJobModalOpen(false); setJobToEdit(null); setConfirmDelete(false); }}
                title="Edit Job Template"
            >
                {jobToEdit && (
                    <>
                        <JobForm
                            initialData={jobToEdit}
                            onSubmit={handleUpdateJob}
                            onCancel={() => { setIsEditJobModalOpen(false); setJobToEdit(null); }}
                        />
                        <div className="mt-6 pt-6 border-t border-border-color">
                            {!confirmDelete ? (
                                <button
                                    onClick={() => setConfirmDelete(true)}
                                    className="w-full px-6 py-3 border border-red-300 text-red-500 font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-red-50 transition-colors"
                                >
                                    Delete Job
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <p className="text-[0.75rem] font-sans text-red-500 text-center">
                                        Are you sure? This cannot be undone.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConfirmDelete(false)}
                                            className="flex-1 px-4 py-3 border border-border-color text-text-secondary font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-dashboard-bg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleDeleteJob}
                                            className="flex-1 px-4 py-3 bg-red-500 text-white font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-red-600 transition-colors"
                                        >
                                            Yes, Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
