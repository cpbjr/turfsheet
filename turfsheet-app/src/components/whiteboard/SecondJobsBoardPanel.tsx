import { useState, useEffect } from 'react';
import type { Staff, SecondJobBoardItemWithStaff } from '../../types';
import { supabase } from '../../lib/supabase';
import SecondJobBoardItem from './SecondJobBoardItem';
import AddSecondJobDropdown from './AddSecondJobDropdown';

interface SecondJobsBoardPanelProps {
  date: string;
  allStaff: Staff[];
  onAssignmentChange: () => void;
}

export default function SecondJobsBoardPanel({
  date,
  allStaff,
  onAssignmentChange,
}: SecondJobsBoardPanelProps) {
  const [boardItems, setBoardItems] = useState<SecondJobBoardItemWithStaff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoardData();
  }, [date]);

  async function fetchBoardData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('second_job_board')
        .select(`*, staff:grabbed_by(*)`)
        .eq('board_date', date)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setBoardItems((data as SecondJobBoardItemWithStaff[]) || []);
    } catch (error) {
      console.error('Error fetching second job board data:', error);
      setBoardItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToBoard(description: string) {
    try {
      const nextSortOrder = boardItems.length > 0
        ? Math.max(...boardItems.map((i) => i.sort_order)) + 1
        : 1;

      const { error } = await supabase
        .from('second_job_board')
        .insert({ description, board_date: date, sort_order: nextSortOrder });

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
      const { error } = await supabase
        .from('second_job_board')
        .update({ grabbed_by: staffId, grabbed_at: new Date().toISOString() })
        .eq('id', boardItemId);

      if (error) throw error;

      await fetchBoardData();
      onAssignmentChange();
    } catch (error) {
      console.error('Error assigning staff:', error);
    }
  }

  async function handleUnassignStaff(boardItemId: string) {
    try {
      const { error } = await supabase
        .from('second_job_board')
        .update({ grabbed_by: null, grabbed_at: null })
        .eq('id', boardItemId);

      if (error) throw error;

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
        .update({ sort_order: aboveItem.sort_order })
        .eq('id', currentItem.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('second_job_board')
        .update({ sort_order: currentItem.sort_order })
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
        .update({ sort_order: belowItem.sort_order })
        .eq('id', currentItem.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from('second_job_board')
        .update({ sort_order: currentItem.sort_order })
        .eq('id', belowItem.id);

      if (error2) throw error2;

      await fetchBoardData();
    } catch (error) {
      console.error('Error moving item down:', error);
    }
  }

  return (
    <div className="flex flex-col h-full border-l border-border-color bg-panel-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-turf-green border-t border-turf-green/20 shadow-sm">
        <span className="text-[0.6rem] font-heading font-black text-white uppercase tracking-[0.2em]">
          Second Jobs
        </span>
        <AddSecondJobDropdown onAdd={handleAddToBoard} />
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
