import { useState, useRef, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import type { Staff } from '../../types';

interface AssignStaffDropdownProps {
  availableStaff: Staff[];
  assignedStaffIds: string[];
  onAssign: (staffId: string) => void;
}

export default function AssignStaffDropdown({
  availableStaff,
  assignedStaffIds,
  onAssign,
}: AssignStaffDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unassignedStaff = availableStaff
    .filter((staff) => !assignedStaffIds.includes(staff.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-sans text-turf-green hover:text-turf-green-dark border border-turf-green/30 rounded hover:bg-turf-green-light transition-colors"
        disabled={unassignedStaff.length === 0}
      >
        <UserPlus className="w-3 h-3" />
        <span>Assign</span>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 right-0 bg-panel-white border border-border-color shadow-lg max-h-48 overflow-y-auto w-48 rounded">
          {unassignedStaff.length === 0 ? (
            <div className="px-3 py-2 text-sm font-sans text-text-muted">
              All staff assigned
            </div>
          ) : (
            unassignedStaff.map((staff) => (
              <div
                key={staff.id}
                onClick={() => {
                  onAssign(staff.id);
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-sm font-sans text-text-primary hover:bg-turf-green-light cursor-pointer"
              >
                {staff.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
