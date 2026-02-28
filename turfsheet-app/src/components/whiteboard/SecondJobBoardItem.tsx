import { ChevronUp, ChevronDown, X } from 'lucide-react';
import type { Staff, SecondJobBoardItemWithStaff } from '../../types';
import AssignStaffDropdown from './AssignStaffDropdown';

interface SecondJobBoardItemProps {
  boardItem: SecondJobBoardItemWithStaff;
  allStaff: Staff[];
  onAssignStaff: (boardItemId: string, staffId: string) => void;
  onUnassignStaff: (boardItemId: string) => void;
  onRemoveFromBoard: (boardItemId: string) => void;
  onMoveUp: (boardItemId: string) => void;
  onMoveDown: (boardItemId: string) => void;
  onSetPriority: (boardItemId: string, priority: string | null) => void;
  isFirst: boolean;
  isLast: boolean;
}

export default function SecondJobBoardItem({
  boardItem,
  allStaff,
  onAssignStaff,
  onUnassignStaff,
  onRemoveFromBoard,
  onMoveUp,
  onMoveDown,
  onSetPriority,
  isFirst,
  isLast,
}: SecondJobBoardItemProps) {
  const isGrabbed = boardItem.grabbed_by !== null && boardItem.grabbed_by !== undefined;

  return (
    <div className="border border-border-color bg-panel-white px-4 py-3">
      {/* Top row: Priority, Description, Action Buttons */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          maxLength={1}
          value={boardItem.priority || ''}
          onChange={(e) => {
            const val = e.target.value.toUpperCase().trim();
            onSetPriority(boardItem.id, val || null);
          }}
          className={`w-6 h-6 text-center text-xs font-heading font-bold rounded-sm shrink-0 border transition-colors focus:outline-none focus:ring-1 focus:ring-turf-green ${
            boardItem.priority
              ? 'border-turf-green bg-turf-green/10 text-turf-green'
              : 'border-border-color bg-gray-50 text-gray-400'
          }`}
          title="Type a priority letter"
          placeholder="-"
        />

        <div className="flex-1">
          <span
            className={`text-sm font-sans font-semibold text-text-primary ${
              isGrabbed ? 'line-through opacity-60' : ''
            }`}
          >
            {boardItem.description}
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

      {/* Bottom row: Grabbed staff or assign button */}
      <div className="flex items-center gap-2 ml-8 mt-1">
        {isGrabbed ? (
          <div className="flex-1 flex items-center gap-1">
            <span className="text-xs font-sans text-text-secondary">Grabbed by:</span>
            <button
              onClick={() => onUnassignStaff(boardItem.id)}
              className="text-xs font-sans text-text-secondary hover:text-red-500 hover:line-through transition-colors"
              title={`Unassign ${boardItem.staff?.name}`}
            >
              {boardItem.staff?.name}
            </button>
          </div>
        ) : (
          <div className="flex-1 text-xs font-sans text-text-muted italic">available</div>
        )}

        {!isGrabbed && (
          <AssignStaffDropdown
            availableStaff={allStaff}
            assignedStaffIds={[]}
            onAssign={(staffId) => onAssignStaff(boardItem.id, staffId)}
          />
        )}
      </div>
    </div>
  );
}
