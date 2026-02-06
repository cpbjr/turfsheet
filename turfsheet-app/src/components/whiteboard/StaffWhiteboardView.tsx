import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import JobForm from '../jobs/JobForm';
import JobAssignmentCell from './JobAssignmentCell';
import PriorityCell from './PriorityCell';
import type { Job, WhiteboardRow, DailyAssignmentWithDetails } from '../../types';

interface StaffWhiteboardViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function StaffWhiteboardView({
  selectedDate,
  onDateChange,
}: StaffWhiteboardViewProps) {
  const [whiteboardRows, setWhiteboardRows] = useState<WhiteboardRow[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);

  const dateString = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all staff
      const { data: staffList, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: true });

      if (staffError) throw staffError;

      // 2. Fetch all jobs for dropdowns
      const { data: jobsList, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('title', { ascending: true });

      if (jobsError) throw jobsError;

      // 3. Fetch assignments for date with job details (JOIN)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('daily_assignments')
        .select(
          `
          *,
          job:job_id(*)
        `
        )
        .eq('assignment_date', dateString);

      if (assignmentsError) throw assignmentsError;

      // 4. Transform to WhiteboardRow[]
      const rows = (staffList || []).map((staff) => {
        const job1 = (assignments || []).find(
          (a) => a.staff_id === staff.id && a.job_order === 1
        ) as DailyAssignmentWithDetails | undefined;
        const job2 = (assignments || []).find(
          (a) => a.staff_id === staff.id && a.job_order === 2
        ) as DailyAssignmentWithDetails | undefined;
        return { staff, job1, job2 };
      });

      setWhiteboardRows(rows);
      setAvailableJobs(jobsList || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      console.error('Error fetching whiteboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePrevious = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleDateToday = () => {
    onDateChange(new Date());
  };

  const handleDateNext = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreateJob = () => {
    setIsJobModalOpen(true);
  };

  const handleSaveJob = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          title: formData.title,
          description: formData.description,
          crew_needed: formData.crewNeeded,
          priority: formData.priority,
          section: formData.section,
        });

      if (error) throw error;

      setIsJobModalOpen(false);
      // Refresh jobs list and data
      await fetchData();
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Date Navigator */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-panel-white">
        <div className="flex items-center gap-4">
          <button
            onClick={handleDatePrevious}
            className="p-2 hover:bg-dashboard-bg border border-border-color transition-colors"
            title="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleDateToday}
            className="px-4 py-2 border border-border-color hover:border-turf-green text-sm font-heading font-bold uppercase transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleDateNext}
            className="p-2 hover:bg-dashboard-bg border border-border-color transition-colors"
            title="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="text-sm font-heading font-bold text-text-primary">
          {formatDate(selectedDate)}
        </div>
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-[2fr_3fr_1fr_3fr] gap-4 px-6 py-3 bg-turf-green border-x border-t border-turf-green/20 shadow-sm">
        <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
          Staff Name
        </span>
        <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
          Job 1
        </span>
        <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
          Priority
        </span>
        <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
          Job 2
        </span>
      </div>

      {/* Body Content */}
      {loading && (
        <div className="flex items-center justify-center flex-1">
          <p className="text-text-secondary">Loading whiteboard...</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center flex-1">
          <p className="text-red-500">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {whiteboardRows.length > 0 ? (
            whiteboardRows.map((row, idx) => (
              <div
                key={row.staff.id}
                className={`grid grid-cols-[2fr_3fr_1fr_3fr] gap-4 px-6 py-4 border-x border-b border-border-color ${
                  idx % 2 === 0 ? 'bg-panel-white' : 'bg-dashboard-bg/30'
                }`}
              >
                <div className="font-heading font-bold text-text-primary">
                  {row.staff.name}
                </div>
                <JobAssignmentCell
                  staffId={String(row.staff.id)}
                  date={dateString}
                  jobOrder={1}
                  currentAssignment={row.job1}
                  availableJobs={availableJobs}
                  onUpdate={fetchData}
                  onCreateJob={handleCreateJob}
                />
                <PriorityCell
                  assignment={row.job2}
                  onUpdate={fetchData}
                />
                <JobAssignmentCell
                  staffId={String(row.staff.id)}
                  date={dateString}
                  jobOrder={2}
                  currentAssignment={row.job2}
                  availableJobs={availableJobs}
                  onUpdate={fetchData}
                  onCreateJob={handleCreateJob}
                />
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-64 bg-panel-white border border-border-color border-dashed rounded-sm m-6">
              <p className="text-text-secondary font-sans text-sm">
                No staff members in your library yet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Job Creation Modal */}
      <Modal
        isOpen={isJobModalOpen}
        onClose={() => setIsJobModalOpen(false)}
        title="Create New Job"
      >
        <JobForm
          onSubmit={handleSaveJob}
          onCancel={() => setIsJobModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
