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
  onCreateJob: () => void;
  onUnassignSecondJob: (boardItemId: string) => void;
  isEven: boolean;
}

export default function StaffRow({
  row,
  dateString,
  availableJobs,
  secondJobChips,
  onUpdate,
  onCreateJob,
  onUnassignSecondJob,
  isEven,
}: StaffRowProps) {
  return (
    <div
      className={`grid grid-cols-[2fr_3fr] gap-4 px-6 py-4 border-x border-b border-border-color ${
        isEven ? 'bg-panel-white' : 'bg-dashboard-bg/30'
      }`}
    >
      {/* Staff Name + Second Job Chips */}
      <div className="flex flex-col gap-1">
        <div className="font-heading font-bold text-text-primary text-sm">
          {row.staff.name}
        </div>
        {secondJobChips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {secondJobChips.map((chip) => (
              <SecondJobChip
                key={chip.id}
                jobTitle={chip.jobTitle}
                onRemove={() => onUnassignSecondJob(chip.assignmentId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Primary Job */}
      <JobAssignmentCell
        staffId={String(row.staff.id)}
        date={dateString}
        currentAssignment={row.primaryJob}
        availableJobs={availableJobs}
        onUpdate={onUpdate}
        onCreateJob={onCreateJob}
      />
    </div>
  );
}
