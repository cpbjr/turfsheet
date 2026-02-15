import { useState, useEffect } from 'react';
import { X, Clock, DollarSign, Users, FileText } from 'lucide-react';
import type { Project, ProjectStatus } from '../../types';

interface ProjectDetailModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, fields: Partial<Project>) => void;
  onDelete: (id: string) => void;
}

export default function ProjectDetailModal({
  project,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}: ProjectDetailModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: '',
    status: 'active' as ProjectStatus,
    estimated_start_date: '',
    estimated_end_date: '',
    estimated_hours: '',
    estimated_cost: '',
    actual_cost: '',
    estimated_crew_size: '',
    required_roles: '',
    notes: '',
  });

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title,
        description: project.description || '',
        priority: project.priority || '',
        status: project.status,
        estimated_start_date: project.estimated_start_date || '',
        estimated_end_date: project.estimated_end_date || '',
        estimated_hours: project.estimated_hours?.toString() || '',
        estimated_cost: project.estimated_cost?.toString() || '',
        actual_cost: project.actual_cost?.toString() || '',
        estimated_crew_size: project.estimated_crew_size?.toString() || '',
        required_roles: project.required_roles || '',
        notes: project.notes || '',
      });
    }
  }, [project]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleSave = async () => {
    // Validate title
    if (!form.title.trim()) {
      alert('Project title is required');
      return;
    }

    // Validate dates
    if (form.estimated_start_date && form.estimated_end_date) {
      if (form.estimated_end_date < form.estimated_start_date) {
        alert('End date cannot be before start date');
        return;
      }
    }

    // Validate numeric fields are positive
    const estimatedHours = form.estimated_hours ? parseFloat(form.estimated_hours) : undefined;
    const estimatedCost = form.estimated_cost ? parseFloat(form.estimated_cost) : undefined;
    const estimatedCrewSize = form.estimated_crew_size ? parseInt(form.estimated_crew_size) : undefined;

    if (estimatedHours !== undefined && estimatedHours <= 0) {
      alert('Estimated hours must be positive');
      return;
    }

    if (estimatedCost !== undefined && estimatedCost < 0) {
      alert('Estimated cost cannot be negative');
      return;
    }

    if (estimatedCrewSize !== undefined && estimatedCrewSize <= 0) {
      alert('Estimated crew size must be positive');
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(project.id, {
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority.length === 1 ? form.priority.toUpperCase() : undefined,
        status: form.status,
        estimated_start_date: form.estimated_start_date || undefined,
        estimated_end_date: form.estimated_end_date || undefined,
        estimated_hours: estimatedHours,
        estimated_cost: estimatedCost,
        actual_cost: form.actual_cost ? parseFloat(form.actual_cost) : undefined,
        estimated_crew_size: estimatedCrewSize,
        required_roles: form.required_roles || undefined,
        notes: form.notes || undefined,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await onDelete(project.id);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const inputClasses = "w-full bg-dashboard-bg border border-border-color px-3 py-2 text-sm focus:border-turf-green outline-none transition-colors font-sans";
  const labelClasses = "block text-[0.6rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-1";
  const sectionLabel = "text-[0.65rem] font-heading font-black text-turf-green uppercase tracking-widest mb-3 flex items-center gap-2";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-text-primary/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-panel-white w-full max-w-lg shadow-2xl border border-border-color max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-turf-green px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-white font-heading font-black text-sm uppercase tracking-[0.2em]">
            Project Details
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title + Priority + Status */}
          <div className="grid grid-cols-[1fr_60px] gap-3">
            <div>
              <label className={labelClasses}>Title</label>
              <input
                type="text"
                className={inputClasses}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClasses}>Priority</label>
              <input
                type="text"
                maxLength={1}
                className={`${inputClasses} text-center uppercase font-heading font-black`}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value.toUpperCase() })}
                placeholder="A-Z"
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Status</label>
            <select
              className={inputClasses}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className={labelClasses}>Description</label>
            <textarea
              className={`${inputClasses} min-h-[60px] resize-none`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Project scope and details..."
            />
          </div>

          {/* Time Estimates */}
          <div className="border-t border-border-color pt-4">
            <div className={sectionLabel}>
              <Clock className="w-3.5 h-3.5" /> Time Estimates
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClasses}>Start</label>
                <input type="date" className={inputClasses} value={form.estimated_start_date}
                  onChange={(e) => setForm({ ...form, estimated_start_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClasses}>End</label>
                <input type="date" className={inputClasses} value={form.estimated_end_date}
                  onChange={(e) => setForm({ ...form, estimated_end_date: e.target.value })} />
              </div>
              <div>
                <label className={labelClasses}>Hours</label>
                <input type="number" min="0" step="0.5" className={inputClasses} value={form.estimated_hours}
                  onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Cost Estimates */}
          <div className="border-t border-border-color pt-4">
            <div className={sectionLabel}>
              <DollarSign className="w-3.5 h-3.5" /> Cost Estimates
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Estimated ($)</label>
                <input type="number" min="0" step="0.01" className={inputClasses} value={form.estimated_cost}
                  onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <label className={labelClasses}>Actual ($)</label>
                <input type="number" min="0" step="0.01" className={inputClasses} value={form.actual_cost}
                  onChange={(e) => setForm({ ...form, actual_cost: e.target.value })} placeholder="0.00" />
              </div>
            </div>
          </div>

          {/* Staffing Estimates */}
          <div className="border-t border-border-color pt-4">
            <div className={sectionLabel}>
              <Users className="w-3.5 h-3.5" /> Staffing
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Crew Size</label>
                <input type="number" min="1" className={inputClasses} value={form.estimated_crew_size}
                  onChange={(e) => setForm({ ...form, estimated_crew_size: e.target.value })} placeholder="1" />
              </div>
              <div>
                <label className={labelClasses}>Roles Needed</label>
                <input type="text" className={inputClasses} value={form.required_roles}
                  onChange={(e) => setForm({ ...form, required_roles: e.target.value })} placeholder="e.g. Foreman, 2x Workers" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="border-t border-border-color pt-4">
            <div className={sectionLabel}>
              <FileText className="w-3.5 h-3.5" /> Notes
            </div>
            <textarea
              className={`${inputClasses} min-h-[60px] resize-none`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border-color flex items-center gap-3 shrink-0">
          <button
            onClick={handleDelete}
            disabled={isSaving}
            className="px-4 py-2 text-red-500 border border-red-200 text-[0.65rem] font-heading font-black uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-border-color text-text-secondary text-[0.65rem] font-heading font-black uppercase tracking-widest hover:bg-dashboard-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-turf-green text-white text-[0.65rem] font-heading font-black uppercase tracking-widest hover:bg-turf-green-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
