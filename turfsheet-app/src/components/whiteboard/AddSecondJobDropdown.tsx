import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Job } from '../../types';

interface AddSecondJobDropdownProps {
  availableJobs: Job[];
  existingJobIds: string[];
  onAdd: (jobId: string) => void;
}

export default function AddSecondJobDropdown({
  availableJobs,
  existingJobIds,
  onAdd,
}: AddSecondJobDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredJobs = availableJobs
    .filter((job) => !existingJobIds.includes(job.id))
    .sort((a, b) => a.title.localeCompare(b.title));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-sans text-white/80 hover:text-white border border-white/30 rounded hover:bg-white/10 transition-colors"
      >
        <Plus size={14} />
        Add Job
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 right-0 bg-panel-white border border-border-color shadow-lg max-h-48 overflow-y-auto w-64">
          {filteredJobs.length === 0 ? (
            <div className="px-4 py-2 text-sm font-sans text-text-muted">
              No jobs available
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => {
                  onAdd(job.id);
                  setIsOpen(false);
                }}
                className="px-4 py-2 text-sm font-sans text-text-primary hover:bg-turf-green-light cursor-pointer"
              >
                {job.title}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
