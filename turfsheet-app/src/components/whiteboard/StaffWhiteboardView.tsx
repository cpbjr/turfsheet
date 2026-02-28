import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../ui/Modal';
import JobForm from '../jobs/JobForm';
import StaffRow from './StaffRow';
import SecondJobsBoardPanel from './SecondJobsBoardPanel';
import type { Job, Staff, WhiteboardRow, DailyAssignmentWithDetails, SecondJobBoardItemWithStaff } from '../../types';

interface StaffWhiteboardViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function StaffWhiteboardView({
  selectedDate,
  onDateChange,
}: StaffWhiteboardViewProps) {
  const [whiteboardRows, setWhiteboardRows] = useState<WhiteboardRow[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [secondJobAssignments, setSecondJobAssignments] = useState<SecondJobBoardItemWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [workingStaffIds, setWorkingStaffIds] = useState<Set<string>>(new Set());
  const [offStaffIds, setOffStaffIds] = useState<Set<string>>(new Set());

  const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

  // Fetch static data (staff & jobs) only on mount
  useEffect(() => {
    fetchStaticData();
  }, []);

  // Fetch dynamic data (assignments) when date changes
  useEffect(() => {
    if (staffList.length > 0) {
      fetchAssignmentsForDate();
    }
  }, [selectedDate, staffList.length]);

  // Keep a ref to the latest fetch function so the event listener never goes stale
  const fetchRef = useRef<(() => void) | null>(null);

  // Re-fetch when schedule is changed via ManageScheduleModal
  useEffect(() => {
    const handler = () => { fetchRef.current?.(); };
    window.addEventListener('schedule-changed', handler);
    return () => window.removeEventListener('schedule-changed', handler);
  }, []);

  // Fetch staff and jobs once (they rarely change)
  const fetchStaticData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all staff (ordered by rank, then name)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (staffError) throw staffError;

      // 2. Fetch all jobs for dropdowns (only First Jobs for primary assignments)
      const { data: jobsList, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('title', { ascending: true });

      if (jobsError) throw jobsError;

      setStaffList(staffData || []);
      setAvailableJobs(jobsList || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch static data';
      setError(message);
      console.error('Error fetching static data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch working staff for the selected date (schedules + time off)
  const fetchWorkingStaffIds = async () => {
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const dayColumn = `${dayOfWeek}_on`;

    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*');

    if (error) {
      console.warn('Staff schedules table not available:', error.message);
      setWorkingStaffIds(new Set(staffList.map(s => String(s.id))));
    } else if (data) {
      const workingIds = data
        .filter((schedule: any) => schedule[dayColumn])
        .map((schedule: any) => String(schedule.staff_id));
      setWorkingStaffIds(new Set(workingIds));
    }

    // Check staff_time_off for the selected date
    const { data: timeOffData, error: timeOffError } = await supabase
      .from('staff_time_off')
      .select('staff_id')
      .lte('start_date', dateString)
      .gte('end_date', dateString)
      .eq('status', 'approved');

    if (timeOffError) {
      console.warn('staff_time_off not available:', timeOffError.message);
      setOffStaffIds(new Set());
    } else {
      const offIds = (timeOffData || []).map((row: any) => String(row.staff_id));
      setOffStaffIds(new Set(offIds));
    }
  };

  // Fetch assignments only (date-dependent data)
  const fetchAssignmentsForDate = async () => {
    try {
      setError(null);

      // Fetch working staff for this date
      await fetchWorkingStaffIds();

      // 3. Fetch daily assignments for date with job details
      const { data: assignments, error: assignmentsError } = await supabase
        .from('daily_assignments')
        .select(`
          *,
          job:job_id(*)
        `)
        .eq('assignment_date', dateString);

      if (assignmentsError) throw assignmentsError;

      // 4. Fetch second job board items with grabbed staff details
      const { data: boardData, error: boardError } = await supabase
        .from('second_job_board')
        .select(`*, staff:grabbed_by(*)`)
        .eq('board_date', dateString)
        .order('sort_order', { ascending: true });

      if (boardError) throw boardError;

      // 5. Transform to WhiteboardRow[] — one primary job per staff
      const rows = staffList.map((staff) => {
        const primaryJob = (assignments || []).find(
          (a) => a.staff_id === staff.id
        ) as DailyAssignmentWithDetails | undefined;
        return { staff, primaryJob };
      });

      setWhiteboardRows(rows);
      setSecondJobAssignments((boardData as SecondJobBoardItemWithStaff[]) || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assignments';
      setError(message);
      console.error('Error fetching assignments:', err);
    }
  };
  fetchRef.current = fetchAssignmentsForDate;

  // Optimistically update a primary job assignment
  const handleOptimisticJobUpdate = (staffId: string, jobId: string | null) => {
    setWhiteboardRows(prevRows =>
      prevRows.map(row => {
        if (row.staff.id === staffId) {
          if (jobId === null) {
            // Removing assignment
            return { ...row, primaryJob: undefined };
          } else {
            // Adding/updating assignment
            const job = availableJobs.find(j => j.id === jobId);
            if (job) {
              return {
                ...row,
                primaryJob: {
                  id: `temp-${Date.now()}`, // Temporary ID until confirmed
                  staff_id: staffId,
                  assignment_date: dateString,
                  job_id: jobId,
                  job: job,
                } as DailyAssignmentWithDetails
              };
            }
          }
        }
        return row;
      })
    );
  };

  // Build a map of staff_id -> their second job chips
  const getSecondJobChipsForStaff = (staffId: string) => {
    return secondJobAssignments
      .filter(item => String(item.grabbed_by) === String(staffId))
      .map(item => ({
        id: String(item.id),
        jobTitle: item.description,
        assignmentId: String(item.id),
      }));
  };

  const handleUnassignSecondJob = async (boardItemId: string) => {
    try {
      const { error } = await supabase
        .from('second_job_board')
        .update({ grabbed_by: null, grabbed_at: null })
        .eq('id', boardItemId);

      if (error) throw error;

      await fetchAssignmentsForDate();
    } catch (err) {
      console.error('Error unassigning second job:', err);
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
          crew_needed: formData.crew_needed,
          priority: formData.priority,
          section: formData.section,
        });

      if (error) throw error;

      setIsJobModalOpen(false);
      // Refetch jobs since we just added a new one
      await fetchStaticData();
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

      {/* Two-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Staff + Jobs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[120px_1fr_1fr] gap-2 px-6 py-3 h-10 bg-turf-green border-x border-t border-turf-green/20 shadow-sm items-center">
            <span className="text-xs font-heading font-black text-white uppercase tracking-[0.2em]">
              Staff Name
            </span>
            <span className="text-xs font-heading font-black text-white uppercase tracking-[0.2em]">
              First Jobs
            </span>
            <span className="text-xs font-heading font-black text-white uppercase tracking-[0.2em]">
              Second Jobs
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
                  <StaffRow
                    key={row.staff.id}
                    row={row}
                    dateString={dateString}
                    availableJobs={availableJobs}
                    secondJobChips={getSecondJobChipsForStaff(String(row.staff.id))}
                    onUpdate={fetchAssignmentsForDate}
                    onOptimisticUpdate={handleOptimisticJobUpdate}
                    onCreateJob={handleCreateJob}
                    onUnassignSecondJob={handleUnassignSecondJob}
                    isEven={idx % 2 === 0}
                    isWorking={workingStaffIds.has(String(row.staff.id)) && !offStaffIds.has(String(row.staff.id))}
                    isOff={offStaffIds.has(String(row.staff.id))}
                  />
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
        </div>

        {/* Right Panel: Second Jobs Board */}
        <div className="w-80 flex-shrink-0">
          <SecondJobsBoardPanel
            date={dateString}
            allStaff={staffList}
            onAssignmentChange={fetchAssignmentsForDate}
          />
        </div>
      </div>

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
