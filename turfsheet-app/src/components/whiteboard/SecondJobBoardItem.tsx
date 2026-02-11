import { ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Staff, SecondJobBoardFull } from '../../types';
import AssignStaffDropdown from './AssignStaffDropdown';

interface SecondJobBoardItemProps {
  boardItem: SecondJobBoardFull;
  rank: number;
  allStaff: Staff[];
  onAssignStaff: (boardItemId: string, staffId: string) => void;
  onUnassignStaff: (assignmentId: string) => void;
  onRemoveFromBoard: (boardItemId: string) => void;
  onMoveUp: (boardItemId: string) => void;
  onMoveDown: (boardItemId: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function SecondJobBoardItem({
  boardItem,
  rank,
  allStaff,
  onAssignStaff,
  onUnassignStaff,
  onRemoveFromBoard,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SecondJobBoardItemProps) {
  const hasAssignments = boardItem.assignments.length > 0;
  const assignedStaffIds = boardItem.assignments.map((a) => String(a.staff_id));

  return (
    <div className="border border-border-color bg-panel-white px-4 py-3">
      {/* Top row: Rank, Job Title, Action Buttons */}
      <div className="flex items-center gap-2">
        <div className="text-xs font-heading font-bold text-text-secondary w-6 text-center">
          {rank}
        </div>

        <div className="flex-1">
          <span
            className={`text-sm font-sans font-semibold text-text-primary ${
              hasAssignments ? 'line-through opacity-60' : ''
            }`}
          >
            {boardItem.job.title}
          </span>
        </div>

        <button
          onClick={() => onMoveUp(boardItem.id)}
          disabled={isFirst}
          className={`p-1 transition-colors ${
            isFirst
              ? 'text-text-muted opacity-30 cursor-not-allowed'
              : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label="Move up"
        >
          <ChevronUp size={16} />
        </button>

        <button
          onClick={() => onMoveDown(boardItem.id)}
          disabled={isLast}
          className={`p-1 transition-colors ${
            isLast
              ? 'text-text-muted opacity-30 cursor-not-allowed'
              : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label="Move down"
        >
          <ChevronDown size={16} />
        </button>

        <button
          onClick={() => onRemoveFromBoard(boardItem.id)}
          className="p-1 text-text-muted hover:text-red-500 transition-colors"
          aria-label="Remove from board"
        >
          <X size={16} />
        </button>
      </div>

      {/* Bottom row: Assigned staff and assign button */}
      <div className="flex items-center gap-2 ml-8 mt-1">
        {hasAssignments ? (
          <div className="flex-1 flex flex-wrap items-center gap-1">
            <span className="text-xs font-sans text-text-secondary">Assigned:</span>
            {boardItem.assignments.map((assignment, index) => (
              <span key={assignment.id} className="text-xs font-sans text-text-secondary">
                <button
                  onClick={() => onUnassignStaff(assignment.id)}
                  className="hover:text-red-500 hover:line-through transition-colors"
                  title={`Unassign ${assignment.staff.name}`}
                >
                  {assignment.staff.name}
                </button>
                {index < boardItem.assignments.length - 1 && ','}
              </span>
            ))}
          </div>
        ) : (
          <div className="flex-1 text-xs font-sans text-text-muted italic">pending</div>
        )}

        <AssignStaffDropdown
          availableStaff={allStaff}
          assignedStaffIds={assignedStaffIds}
          onAssign={(staffId) => onAssignStaff(boardItem.id, staffId)}
        />
      </div>
    </div>
  );
}
