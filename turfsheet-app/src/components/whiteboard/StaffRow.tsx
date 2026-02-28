import type { Job, WhiteboardRow } from '../../types';
import JobAssignmentCell from './JobAssignmentCell';
import SecondJobChip from './SecondJobChip';

interface SecondJobChipData {
  id: string;
  jobTitle: string;
  assignmentId: string;
}

interface StaffRowProps {
  row: WhiteboardRow;
  dateString: string;
  availableJobs: Job[];
  secondJobChips: SecondJobChipData[];
  onUpdate: () => void;
  onOptimisticUpdate: (staffId: string, jobId: string | null) => void;
  onCreateJob: () => void;
  onUnassignSecondJob: (boardItemId: string) => void;
  isEven: boolean;
  isWorking?: boolean;
  isOff?: boolean;
}

export default function StaffRow({
  row,
  dateString,
  availableJobs,
  secondJobChips,
  onUpdate,
  onOptimisticUpdate,
  onCreateJob,
  onUnassignSecondJob,
  isEven,
  isWorking = true,
  isOff = false,
}: StaffRowProps) {
  // Not scheduled for today — hide entirely
  if (!isWorking && !isOff) return null;

  return (
    <div
      className={`grid grid-cols-[120px_1fr_1fr] gap-2 px-6 py-4 border-x border-b border-border-color ${
        isEven ? 'bg-panel-white' : 'bg-dashboard-bg/30'
      }`}
    >
      {/* Staff Name */}
      <div className="flex items-center">
        <div className={`font-heading font-bold text-sm ${isOff ? 'text-text-secondary' : 'text-text-primary'}`}>
          {row.staff.name}
        </div>
      </div>

      {/* First Job column */}
      {isOff ? (
        <div className="bg-red-50 border border-red-300 px-4 py-2 flex items-center justify-center col-span-2">
          <span className="text-red-600 font-heading font-black text-sm uppercase tracking-wide">Off</span>
        </div>
      ) : (
        <>
          <JobAssignmentCell
            staffId={String(row.staff.id)}
            date={dateString}
            currentAssignment={row.primaryJob}
            availableJobs={availableJobs}
            onUpdate={onUpdate}
            onOptimisticUpdate={onOptimisticUpdate}
            onCreateJob={onCreateJob}
          />

          {/* Second Jobs column */}
          <div className="flex flex-wrap gap-1 items-center">
            {secondJobChips.map((chip) => (
              <SecondJobChip
                key={chip.id}
                jobTitle={chip.jobTitle}
                onRemove={() => onUnassignSecondJob(chip.assignmentId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
