import { useState, useEffect, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import ProjectSection from '../components/projects/ProjectSection';
import ProjectDetailModal from '../components/projects/ProjectDetailModal';
import SectionForm from '../components/projects/SectionForm';
import { supabase } from '../lib/supabase';
import type { Project, ProjectSection as ProjectSectionType, ProjectStatus } from '../types';

export default function ProjectsPage() {
  const [sections, setSections] = useState<ProjectSectionType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);

  // Fetch sections + projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sectionsRes, projectsRes] = await Promise.all([
          supabase.from('project_sections').select('*').order('sort_order', { ascending: true }),
          supabase.from('projects').select('*').order('sort_order', { ascending: true }),
        ]);

        if (sectionsRes.error) throw sectionsRes.error;
        if (projectsRes.error) throw projectsRes.error;

        setSections(sectionsRes.data || []);
        setProjects(projectsRes.data || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch projects';
        setError(message);
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.notes?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    return filtered;
  }, [projects, searchQuery, statusFilter]);

  // Group projects by section
  const projectsBySection = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const section of sections) {
      map.set(section.id, filteredProjects.filter(p => String(p.section_id) === String(section.id)));
    }
    return map;
  }, [sections, filteredProjects]);

  // --- Handlers ---

  const handleAddProject = async (sectionId: string, title: string) => {
    try {
      const maxSort = projects
        .filter(p => String(p.section_id) === String(sectionId))
        .reduce((max, p) => Math.max(max, p.sort_order), 0);

      const { data, error: insertError } = await supabase
        .from('projects')
        .insert([{ section_id: sectionId, title, sort_order: maxSort + 1 }])
        .select();

      if (insertError) throw insertError;
      if (data) setProjects(prev => [...prev, ...data]);
    } catch (err) {
      console.error('Error adding project:', err);
      setError(err instanceof Error ? err.message : 'Failed to add project');
    }
  };

  const handleUpdateProject = async (id: string, fields: Partial<Project>) => {
    try {
      // Convert undefined values to null for Supabase
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        payload[key] = value === undefined ? null : value;
      }

      const { error: updateError } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', id);

      if (updateError) throw updateError;

      setProjects(prev =>
        prev.map(p => p.id === id ? { ...p, ...fields } : p)
      );

      // Update selected project if it's the one being edited
      if (selectedProject?.id === id) {
        setSelectedProject(prev => prev ? { ...prev, ...fields } : null);
      }
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const handleAddSection = async (name: string) => {
    try {
      const maxSort = sections.reduce((max, s) => Math.max(max, s.sort_order), 0);

      const { data, error: insertError } = await supabase
        .from('project_sections')
        .insert([{ name, sort_order: maxSort + 1 }])
        .select();

      if (insertError) throw insertError;
      if (data) setSections(prev => [...prev, ...data]);
      setIsAddingSection(false);
    } catch (err) {
      console.error('Error adding section:', err);
      setError(err instanceof Error ? err.message : 'Failed to add section');
    }
  };

  const handleOpenDetail = (project: Project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const statusOptions: { value: ProjectStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Done' },
  ];

  const inputClasses = "bg-panel-white border border-border-color px-4 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-color">
        <div>
          <h2 className="text-2xl font-heading font-black uppercase tracking-tight text-text-primary">
            Project Board
          </h2>
          <p className="text-text-secondary text-sm font-sans">
            Superintendent's project backlog — click any item to see details.
          </p>
        </div>
        <button
          onClick={() => setIsAddingSection(true)}
          className="bg-turf-green text-white px-8 py-4 shadow-sm flex items-center gap-3 font-heading font-black hover:bg-turf-green-dark hover:-translate-y-1 transition-all duration-300 text-[0.75rem] uppercase tracking-[0.2em]"
        >
          <Plus className="w-5 h-5" />
          Add Section
        </button>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-panel-white p-4 border border-border-color shadow-sm">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            className={`${inputClasses} pl-10 w-full`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-2 border text-xs font-heading font-black uppercase tracking-widest cursor-pointer transition-colors ${
                statusFilter === opt.value
                  ? 'border-turf-green text-turf-green bg-turf-green-light'
                  : 'border-border-color text-text-secondary hover:bg-dashboard-bg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Add Section Form (inline) */}
      {isAddingSection && (
        <div className="bg-panel-white border border-border-color p-4 shadow-sm">
          <SectionForm
            onSubmit={handleAddSection}
            onCancel={() => setIsAddingSection(false)}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <p className="text-text-secondary">Loading projects...</p>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-16 mb-4">
            <p className="text-red-500 text-sm">Error: {error}</p>
          </div>
        )}
        {!loading && sections.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center bg-panel-white border border-border-color border-dashed">
            <p className="text-text-secondary font-sans text-sm">
              No sections yet. Click "Add Section" to get started.
            </p>
          </div>
        )}
        {!loading && sections.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {sections.map((section) => (
              <ProjectSection
                key={section.id}
                section={section}
                projects={projectsBySection.get(section.id) || []}
                onUpdateProject={handleUpdateProject}
                onClickProject={handleOpenDetail}
                onAddProject={handleAddProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={handleUpdateProject}
        onDelete={handleDeleteProject}
      />
    </div>
  );
}
