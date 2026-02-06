import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { DailyAssignmentWithDetails } from '../../types';

interface PriorityCellProps {
  assignment?: DailyAssignmentWithDetails;
  onUpdate: () => void;
}

export default function PriorityCell({
  assignment,
  onUpdate,
}: PriorityCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(assignment?.priority || '');

  const handleSave = async (value: string) => {
    if (!assignment) return;

    // Validate single letter A-Z only
    if (value && !/^[A-Z]$/.test(value)) {
      console.error('Priority must be a single letter A-Z');
      setInputValue('');
      return;
    }

    try {
      await supabase
        .from('daily_assignments')
        .update({ priority: value || null })
        .eq('id', assignment.id);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      console.error('Error updating priority:', err);
    }
  };

  // Disabled state when no Job 2 assignment
  if (!assignment) {
    return (
      <div className="bg-dashboard-bg/30 border border-border-color px-4 py-2 text-sm text-text-muted cursor-not-allowed opacity-50">
        -
      </div>
    );
  }

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={inputValue.toUpperCase()}
        onChange={(e) => {
          const val = e.target.value.toUpperCase();
          // Only allow single character A-Z
          if (val.length <= 1 && /^[A-Z]?$/.test(val)) {
            setInputValue(val);
          }
        }}
        onBlur={() => {
          handleSave(inputValue.toUpperCase());
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSave(inputValue.toUpperCase());
          } else if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue(assignment.priority || '');
          }
        }}
        maxLength={1}
        className="bg-panel-white border border-turf-green w-12 text-center uppercase font-sans font-bold text-sm focus:border-turf-green outline-none transition-colors"
        placeholder=""
      />
    );
  }

  if (assignment.priority) {
    return (
      <button
        onClick={() => {
          setInputValue(assignment.priority || '');
          setIsEditing(true);
        }}
        className="bg-turf-green text-white px-3 py-1 rounded-full text-xs font-heading font-black uppercase cursor-pointer hover:bg-turf-green-dark transition-colors"
      >
        {assignment.priority}
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        setInputValue('');
        setIsEditing(true);
      }}
      className="border-2 border-dashed border-border-color px-4 py-2 text-sm font-sans text-text-muted hover:border-turf-green hover:text-turf-green transition-colors w-12 text-center"
    >
      -
    </button>
  );
}
