import { useState, useEffect } from 'react';
import { Search, AlertTriangle, MapPin, Clock, User, CheckCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import type { MaintenanceIssue, IssueStatus, IssuePriority } from '../types';

const daysOpen = (created_at: string) => {
    const days = Math.floor((Date.now() - new Date(created_at).getTime()) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : days === 1 ? '1 day' : `${days} days`;
};

export default function MaintenancePage() {
    const [issues, setIssues] = useState<MaintenanceIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<MaintenanceIssue | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    useEffect(() => {
        fetchIssues();
    }, []);

    const fetchIssues = async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: fetchError } = await supabase
                .from('maintenance_issues')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            setIssues(data || []);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch maintenance issues';
            setError(message);
            console.error('Error fetching maintenance issues:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (id: number) => {
        try {
            const { error } = await supabase
                .from('maintenance_issues')
                .update({ status: 'Completed', completed_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            fetchIssues();
        } catch (err) {
            console.error('Error updating issue:', err);
        }
    };

    const handleViewIssue = (issue: MaintenanceIssue) => {
        setSelectedIssue(issue);
        setIsDetailModalOpen(true);
    };

    const inputClasses = "bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";

    const filteredIssues = issues.filter(issue => {
        const matchesSearch =
            issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.location_area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.location_detail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.reporter_name?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = !statusFilter || issue.status === statusFilter;
        const matchesPriority = !priorityFilter || issue.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const priorityColor = (priority: IssuePriority) => {
        if (priority === 'High') return 'bg-red-500';
        if (priority === 'Medium') return 'bg-accent-orange';
        return 'bg-turf-green';
    };

    const statusColor = (status: IssueStatus) => {
        if (status === 'Open') return 'bg-turf-green';
        if (status === 'In Progress') return 'bg-accent-orange';
        return 'bg-accent-grey';
    };

    return (
        <div className="space-y-12 h-full flex flex-col">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-color">
                <div>
                    <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
                        Maintenance Issues
                    </h2>
                    <p className="text-text-secondary text-sm font-sans">
                        Track and manage course maintenance reports.
                    </p>
                </div>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-panel-white p-4 border border-border-color shadow-sm">
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search issues..."
                        className={`${inputClasses} pl-10 w-full`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <select
                        className={`${inputClasses} text-xs font-heading font-black uppercase tracking-widest cursor-pointer`}
                        value={statusFilter || ''}
                        onChange={(e) => setStatusFilter(e.target.value || null)}
                    >
                        <option value="">All Status</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                    <select
                        className={`${inputClasses} text-xs font-heading font-black uppercase tracking-widest cursor-pointer`}
                        value={priorityFilter || ''}
                        onChange={(e) => setPriorityFilter(e.target.value || null)}
                    >
                        <option value="">All Priority</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
            </div>

            {/* Issues Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-text-secondary">Loading maintenance issues...</p>
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-red-500">Error: {error}</p>
                    </div>
                )}
                {!loading && !error && filteredIssues.length === 0 && (
                    <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-dashed rounded-sm">
                        <p className="text-text-secondary font-sans text-sm">
                            {searchQuery || statusFilter || priorityFilter
                                ? 'No issues found matching your filters.'
                                : 'No maintenance issues reported yet.'}
                        </p>
                    </div>
                )}
                {!loading && !error && filteredIssues.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-12">
                        {filteredIssues.map((issue) => (
                            <div
                                key={issue.id}
                                className="bg-panel-white border border-border-color p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => handleViewIssue(issue)}
                            >
                                {/* Card Top Row: issue number + priority */}
                                <div className="flex items-start justify-between mb-4">
                                    <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-accent-grey">
                                        #{String(issue.issue_number).padStart(2, '0')}
                                    </span>
                                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${priorityColor(issue.priority)}`}>
                                        {issue.priority}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-text-primary font-sans mb-4 line-clamp-3">
                                    {issue.description}
                                </p>

                                {/* Location */}
                                {(issue.location_area || issue.location_detail) && (
                                    <div className="flex items-center gap-2 text-xs text-text-secondary font-sans mb-2">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span>
                                            {[issue.location_area, issue.location_detail].filter(Boolean).join(' — ')}
                                        </span>
                                    </div>
                                )}

                                {/* Reporter + Date */}
                                <div className="flex items-center gap-4 text-xs text-text-muted font-sans mb-4">
                                    {issue.reporter_name && (
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{issue.reporter_name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{daysOpen(issue.created_at)}</span>
                                    </div>
                                </div>

                                {/* Card Bottom: status + mark complete */}
                                <div className="flex items-center justify-between pt-4 border-t border-border-color">
                                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${statusColor(issue.status)}`}>
                                        {issue.status}
                                    </span>
                                    {issue.status !== 'Completed' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMarkComplete(issue.id);
                                            }}
                                            className="flex items-center gap-1 text-xs font-heading font-black uppercase tracking-wider text-turf-green hover:text-turf-green-dark transition-colors"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Mark Complete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Issue Details"
            >
                {selectedIssue && (
                    <div className="space-y-6 font-sans">
                        {/* Header */}
                        <div className="pb-4 border-b border-border-color">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white bg-accent-grey">
                                    #{String(selectedIssue.issue_number).padStart(2, '0')}
                                </span>
                                <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${priorityColor(selectedIssue.priority)}`}>
                                    {selectedIssue.priority} Priority
                                </span>
                                <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${statusColor(selectedIssue.status)}`}>
                                    {selectedIssue.status}
                                </span>
                            </div>
                            <p className="text-text-primary text-sm">{selectedIssue.description}</p>
                        </div>

                        {/* Photo */}
                        {selectedIssue.photo_url && (
                            <div>
                                <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                    Photo
                                </label>
                                <img
                                    src={selectedIssue.photo_url}
                                    alt="Issue photo"
                                    className="w-full max-h-64 object-cover border border-border-color"
                                />
                            </div>
                        )}

                        {/* Location */}
                        {(selectedIssue.location_area || selectedIssue.location_detail || selectedIssue.location_position) && (
                            <div>
                                <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                    Location
                                </label>
                                <div className="flex items-start gap-2 text-sm text-text-primary">
                                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-text-muted" />
                                    <div>
                                        {selectedIssue.location_area && <p>{selectedIssue.location_area}</p>}
                                        {selectedIssue.location_detail && <p className="text-text-secondary">{selectedIssue.location_detail}</p>}
                                        {selectedIssue.location_position && <p className="text-text-muted text-xs">{selectedIssue.location_position}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reporter + Assigned */}
                        <div className="grid grid-cols-2 gap-4">
                            {selectedIssue.reporter_name && (
                                <div>
                                    <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                        Reported By
                                    </label>
                                    <div className="flex items-center gap-2 text-sm text-text-primary">
                                        <User className="w-4 h-4 text-text-muted" />
                                        <span>{selectedIssue.reporter_name}</span>
                                    </div>
                                </div>
                            )}
                            {selectedIssue.assigned_to && (
                                <div>
                                    <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                        Assigned To
                                    </label>
                                    <div className="flex items-center gap-2 text-sm text-text-primary">
                                        <AlertTriangle className="w-4 h-4 text-text-muted" />
                                        <span>{selectedIssue.assigned_to}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                    Reported
                                </label>
                                <p className="text-sm text-text-primary">
                                    {new Date(selectedIssue.created_at).toLocaleDateString()} ({daysOpen(selectedIssue.created_at)} ago)
                                </p>
                            </div>
                            {selectedIssue.completed_at && (
                                <div>
                                    <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                        Completed
                                    </label>
                                    <p className="text-sm text-text-primary">
                                        {new Date(selectedIssue.completed_at).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Notes */}
                        {selectedIssue.notes && (
                            <div>
                                <label className="text-xs font-heading font-black uppercase tracking-wider text-text-secondary block mb-2">
                                    Notes
                                </label>
                                <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedIssue.notes}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4 border-t border-border-color">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 bg-panel-white border border-border-color px-6 py-3 font-heading font-black text-xs uppercase tracking-wider text-text-primary hover:bg-dashboard-bg transition-colors"
                            >
                                Close
                            </button>
                            {selectedIssue.status !== 'Completed' && (
                                <button
                                    onClick={() => {
                                        handleMarkComplete(selectedIssue.id);
                                        setIsDetailModalOpen(false);
                                    }}
                                    className="px-6 py-3 bg-turf-green text-white font-heading font-black text-xs uppercase tracking-wider hover:bg-turf-green-dark transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Mark Complete
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
