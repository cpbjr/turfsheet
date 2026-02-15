import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Job, DailyAssignmentWithDetails } from '../../types';

interface JobAssignmentCellProps {
  staffId: string;
  date: string;
  currentAssignment?: DailyAssignmentWithDetails;
  availableJobs: Job[];
  onUpdate: () => void;
  onOptimisticUpdate: (staffId: string, jobId: string | null) => void;
  onCreateJob: () => void;
}

export default function JobAssignmentCell({
  staffId,
  date,
  currentAssignment,
  availableJobs,
  onUpdate,
  onOptimisticUpdate,
  onCreateJob,
}: JobAssignmentCellProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSelectJob = async (jobId: string) => {
    setIsEditing(false);

    // 1. Optimistically update UI immediately
    onOptimisticUpdate(staffId, jobId);

    try {
      // 2. Save to database in background
      const { error } = await supabase
        .from('daily_assignments')
        .upsert(
          {
            staff_id: staffId,
            assignment_date: date,
            job_id: jobId,
          },
          {
            onConflict: 'staff_id,assignment_date',
          }
        );

      if (error) throw error;

      // 3. Confirm with real data from database
      onUpdate();
    } catch (err) {
      console.error('Error assigning job:', err);
      // 4. Rollback on error - refetch to restore correct state
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (!currentAssignment) return;

    // 1. Optimistically update UI immediately
    onOptimisticUpdate(staffId, null);

    try {
      // 2. Delete from database in background
      const { error } = await supabase
        .from('daily_assignments')
        .delete()
        .eq('id', currentAssignment.id);

      if (error) throw error;

      // 3. Confirm with real data from database
      onUpdate();
    } catch (err) {
      console.error('Error deleting assignment:', err);
      // 4. Rollback on error - refetch to restore correct state
      onUpdate();
    }
  };

  const handleAddNewJob = () => {
    setIsEditing(false);
    onCreateJob();
  };

  // Alphabetically sorted jobs
  const sortedJobs = [...availableJobs].sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  if (isEditing) {
    return (
      <select
        autoFocus
        onChange={(e) => {
          if (e.target.value === 'add-new') {
            handleAddNewJob();
          } else {
            handleSelectJob(e.target.value);
          }
        }}
        className="bg-panel-white border border-turf-green px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans w-full"
      >
        <option value="">Select a job...</option>
        {sortedJobs.map((job) => (
          <option key={job.id} value={job.id}>
            {job.title}
          </option>
        ))}
        <option value="add-new">+ Add New Job</option>
      </select>
    );
  }

  if (currentAssignment) {
    return (
      <div className="group relative bg-panel-white border border-border-color px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-sans text-text-primary">
          {currentAssignment.job.title}
        </span>
        <button
          onClick={handleDelete}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-red-500"
          title="Delete assignment"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="border-2 border-dashed border-border-color px-4 py-2 flex items-center justify-center gap-2 text-sm font-sans text-text-muted hover:border-turf-green hover:text-turf-green transition-colors w-full"
    >
      <Plus className="w-4 h-4" />
      Assign Job
    </button>
  );
}
