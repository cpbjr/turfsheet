import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';
import ProjectListItem from './ProjectListItem';
import type { Project, ProjectSection as ProjectSectionType } from '../../types';

interface ProjectSectionProps {
  section: ProjectSectionType;
  projects: Project[];
  onUpdateProject: (id: string, fields: Partial<Project>) => void;
  onClickProject: (project: Project) => void;
  onAddProject: (sectionId: number, title: string) => void;
}

export default function ProjectSection({
  section,
  projects,
  onUpdateProject,
  onClickProject,
  onAddProject,
}: ProjectSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) inputRef.current.focus();
  }, [isAdding]);

  const commitNew = () => {
    const trimmed = newTitle.trim();
    if (trimmed) {
      onAddProject(Number(section.id), trimmed);
    }
    setNewTitle('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newTitle.trim();
      if (trimmed) {
        onAddProject(Number(section.id), trimmed);
        setNewTitle('');
        // Keep input open for rapid entry
      }
    }
    if (e.key === 'Escape') {
      setNewTitle('');
      setIsAdding(false);
    }
  };

  // Sort: by priority letter (A first, null last), then sort_order
  const sorted = [...projects].sort((a, b) => {
    const pa = a.priority || 'ZZZ';
    const pb = b.priority || 'ZZZ';
    if (pa !== pb) return pa.localeCompare(pb);
    return a.sort_order - b.sort_order;
  });

  return (
    <div className="bg-panel-white border border-border-color shadow-sm">
      {/* Section Header */}
      <div className="bg-turf-green px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-white font-heading font-black text-xs uppercase tracking-[0.2em]">
          {section.name}
        </h3>
        <span className="text-white/60 text-[0.6rem] font-heading font-black uppercase tracking-widest">
          {projects.length} item{projects.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Item List */}
      <div className="py-1">
        {sorted.map((project) => (
          <ProjectListItem
            key={project.id}
            project={project}
            onUpdate={onUpdateProject}
            onClick={onClickProject}
          />
        ))}

        {/* Inline new item row */}
        {isAdding ? (
          <div className="flex items-center gap-3 py-1.5 px-2">
            <div className="w-7 h-7 flex items-center justify-center border border-dashed border-border-color text-text-muted text-xs">
              ·
            </div>
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onBlur={commitNew}
              onKeyDown={handleKeyDown}
              placeholder="New project name..."
              className="flex-1 text-sm font-sans text-text-primary bg-dashboard-bg border border-border-color px-2 py-0.5 outline-none focus:border-turf-green transition-colors"
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-3 py-1.5 px-2 text-text-muted hover:text-turf-green hover:bg-turf-green-light/30 transition-colors"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-sans">Add item...</span>
          </button>
        )}
      </div>
    </div>
  );
}
