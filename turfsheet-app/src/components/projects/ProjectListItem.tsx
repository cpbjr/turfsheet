import { useState, useRef, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectListItemProps {
  project: Project;
  onUpdate: (id: string, fields: Partial<Project>) => void;
  onClick: (project: Project) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  A: '#e74c3c', B: '#e74c3c', C: '#e67e22', D: '#f39c12',
  E: '#27ae60', F: '#2ecc71', G: '#3498db', H: '#2980b9',
  I: '#8e44ad', J: '#9b59b6', K: '#1abc9c', L: '#16a085',
  M: '#d35400', N: '#c0392b', O: '#7f8c8d', P: '#34495e',
};

function getPriorityColor(letter?: string): string {
  if (!letter) return '#BDC3C7';
  return PRIORITY_COLORS[letter.toUpperCase()] || '#7F8C8D';
}

export default function ProjectListItem({ project, onUpdate, onClick }: ProjectListItemProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingPriority, setIsEditingPriority] = useState(false);
  const [titleValue, setTitleValue] = useState(project.title);
  const [priorityValue, setPriorityValue] = useState(project.priority || '');
  const titleRef = useRef<HTMLInputElement>(null);
  const priorityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleValue(project.title);
    setPriorityValue(project.priority || '');
  }, [project.title, project.priority]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) titleRef.current.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingPriority && priorityRef.current) {
      priorityRef.current.focus();
      priorityRef.current.select();
    }
  }, [isEditingPriority]);

  const commitTitle = () => {
    setIsEditingTitle(false);
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== project.title) {
      onUpdate(project.id, { title: trimmed });
    } else {
      setTitleValue(project.title);
    }
  };

  const commitPriority = () => {
    setIsEditingPriority(false);
    const letter = priorityValue.trim().toUpperCase();
    const newVal = letter.length === 1 && /^[A-Z]$/.test(letter) ? letter : null;
    const oldVal = project.priority || null;
    if (newVal !== oldVal) {
      onUpdate(project.id, { priority: newVal as string | undefined });
      setPriorityValue(newVal || '');
    } else {
      setPriorityValue(project.priority || '');
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitTitle();
    if (e.key === 'Escape') { setTitleValue(project.title); setIsEditingTitle(false); }
  };

  const handlePriorityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitPriority();
    if (e.key === 'Escape') { setPriorityValue(project.priority || ''); setIsEditingPriority(false); }
  };

  return (
    <div className="flex items-center gap-3 group py-1.5 px-2 hover:bg-turf-green-light/50 transition-colors">
      {/* Priority Letter Badge */}
      {isEditingPriority ? (
        <input
          ref={priorityRef}
          type="text"
          maxLength={1}
          value={priorityValue}
          onChange={(e) => setPriorityValue(e.target.value.toUpperCase())}
          onBlur={commitPriority}
          onKeyDown={handlePriorityKeyDown}
          className="w-7 h-7 text-center text-xs font-heading font-black uppercase border border-turf-green bg-panel-white outline-none"
        />
      ) : (
        <button
          onClick={() => setIsEditingPriority(true)}
          className="w-7 h-7 flex items-center justify-center text-xs font-heading font-black text-white shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          style={{ backgroundColor: getPriorityColor(project.priority) }}
          title={project.priority ? `Priority ${project.priority} — click to edit` : 'Click to set priority'}
        >
          {project.priority || '·'}
        </button>
      )}

      {/* Title — inline editable */}
      {isEditingTitle ? (
        <input
          ref={titleRef}
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={handleTitleKeyDown}
          className="flex-1 text-sm font-sans text-text-primary bg-panel-white border border-turf-green px-2 py-0.5 outline-none"
        />
      ) : (
        <span
          onClick={() => setIsEditingTitle(true)}
          className="flex-1 text-sm font-sans text-text-primary cursor-text truncate hover:text-turf-green-dark transition-colors"
          title="Click to edit title"
        >
          {project.title}
        </span>
      )}

      {/* Open detail link */}
      <button
        onClick={() => onClick(project)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-turf-green/10 rounded-sm"
        title="Open project details"
      >
        <ChevronRight className="w-4 h-4 text-text-secondary" />
      </button>
    </div>
  );
}
