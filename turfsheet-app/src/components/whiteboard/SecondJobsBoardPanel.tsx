import { useState, useEffect } from 'react';
import type { Staff, Job, SecondJobBoardFull } from '../../types';
import { supabase } from '../../lib/supabase';
import SecondJobBoardItem from './SecondJobBoardItem';
import AddSecondJobDropdown from './AddSecondJobDropdown';

interface SecondJobsBoardPanelProps {
  date: string;
  allStaff: Staff[];
  availableJobs: Job[];
  onAssignmentChange: () => void;
}

export default function SecondJobsBoardPanel({
  date,
  allStaff,
  availableJobs,
  onAssignmentChange,
}: SecondJobsBoardPanelProps) {
  const [boardItems, setBoardItems] = useState<SecondJobBoardFull[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoardData();
  }, [date]);

  async function fetchBoardData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('second_job_board')
        .select(`
          *,
          job:job_id(*),
          assignments:second_job_assignments(
            *,
            staff:staff_id(*)
          )
        `)
        .eq('board_date', date)
        .order('rank', { ascending: true });

      if (error) throw error;
      setBoardItems((data as SecondJobBoardFull[]) || []);
    } catch (error) {
      console.error('Error fetching second job board data:', error);
      setBoardItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToBoard(jobId: string) {
    try {
      const nextRank = boardItems.length > 0
        ? Math.max(...boardItems.map((i) => i.rank)) + 1
        : 1;

      const { error } = await supabase
        .from('second_job_board')
        .insert({ job_id: jobId, board_date: date, rank: nextRank });

      if (error) throw error;
      await fetchBoardData();
    } catch (error) {
      console.error('Error adding job to board:', error);
    }
  }

  async function handleRemoveFromBoard(boardItemId: string) {
    try {
      const { error } = await supabase
        .from('second_job_board')
        .delete()
        .eq('id', boardItemId);

      if (error) throw error;
      await fetchBoardData();
      onAssignmentChange();
    } catch (error) {
      console.error('Error removing job from board:', error);
    }
  }

  async function handleAssignStaff(boardItemId: string, staffId: string) {
    try {
      const { error: assignError } = await supabase
        .from('second_job_assignments')
        .insert({ board_item_id: boardItemId, staff_id: staffId });

      if (assignError) throw assignError;

      const { error: updateError } = await supabase
        .from('second_job_board')
        .update({ status: 'assigned' })
        .eq('id', boardItemId);

      if (updateError) throw updateError;

      await fetchBoardData();
      onAssignmentChange();
    } catch (error) {
      console.error('Error assigning staff:', error);
    }
  }

  async function handleUnassignStaff(assignmentId: string) {
    try {
      const { data: assignmentData, error: fetchError } = await supabase
        .from('second_job_assignments')
        .select('board_item_id')
        .eq('id', assignmentId)
        .single();

      if (fetchError) throw fetchError;

      const boardItemId = assignmentData.board_item_id;

      const { error: deleteError } = await supabase
        .from('second_job_assignments')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;

      const { data: remainingAssignments, error: countError } = await supabase
        .from('second_job_assignments')
        .select('id')
        .eq('board_item_id', boardItemId);

      if (countError) throw countError;

      if (!remainingAssignments || remainingAssignments.length === 0) {
        const { error: updateError } = await supabase
          .from('second_job_board')
          .update({ status: 'pending' })
          .eq('id', boardItemId);

        if (updateError) throw updateError;
      }

      await fetchBoardData();
      onAssignmentChange();
    } catch (error) {
      console.error('Error unassigning staff:', error);
    }
  }

  async function handleMoveUp(boardItemId: string) {
    try {
      const currentIndex = boardItems.findIndex((item) => item.id === boardItemId);
      if (currentIndex <= 0) return;

      const currentItem = boardItems[currentIndex];
      const aboveItem = boardItems[currentIndex - 1];

      const { error: error1 } = await supabase
        .from('second_job_board')
        .update({ rank: aboveItem.rank })
        .eq('id', currentItem.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('second_job_board')
        .update({ rank: currentItem.rank })
        .eq('id', aboveItem.id);

      if (error2) throw error2;

      await fetchBoardData();
    } catch (error) {
      console.error('Error moving item up:', error);
    }
  }

  async function handleMoveDown(boardItemId: string) {
    try {
      const currentIndex = boardItems.findIndex((item) => item.id === boardItemId);
      if (currentIndex < 0 || currentIndex >= boardItems.length - 1) return;

      const currentItem = boardItems[currentIndex];
      const belowItem = boardItems[currentIndex + 1];

      const { error: error1 } = await supabase
        .from('second_job_board')
        .update({ rank: belowItem.rank })
        .eq('id', currentItem.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('second_job_board')
        .update({ rank: currentItem.rank })
        .eq('id', belowItem.id);

      if (error2) throw error2;

      await fetchBoardData();
    } catch (error) {
      console.error('Error moving item down:', error);
    }
  }

  // Expose fetchBoardData for parent to call
  // The parent can trigger this via onAssignmentChange callback pattern

  const existingJobIds = boardItems.map((item) => String(item.job_id));

  return (
    <div className="flex flex-col h-full border-l border-border-color bg-panel-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-turf-green">
        <h2 className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
          Second Jobs Board
        </h2>
        <AddSecondJobDropdown
          availableJobs={availableJobs}
          existingJobIds={existingJobIds}
          onAdd={handleAddToBoard}
        />
      </div>

      {/* Board Items */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-text-muted">Loading...</p>
          </div>
        ) : boardItems.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-text-muted">No second jobs on the board yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-color">
            {boardItems.map((item, index) => (
              <SecondJobBoardItem
                key={item.id}
                boardItem={item}
                rank={index + 1}
                allStaff={allStaff}
                onAssignStaff={handleAssignStaff}
                onUnassignStaff={handleUnassignStaff}
                onRemoveFromBoard={handleRemoveFromBoard}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={index === 0}
                isLast={index === boardItems.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
