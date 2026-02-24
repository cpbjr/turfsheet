import React, { useState } from 'react';

interface EventFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialDate?: Date;
}

export default function EventForm({ onSubmit, onCancel, initialDate }: EventFormProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'event',
    event_date: formatDate(initialDate),
    end_date: '',
    all_day: true,
    start_time: '',
    end_time: '',
    description: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData = {
      ...formData,
      end_date: formData.end_date || undefined,
      start_time: !formData.all_day && formData.start_time ? formData.start_time : undefined,
      end_time: !formData.all_day && formData.end_time ? formData.end_time : undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
    };
    onSubmit(cleanedData);
  };

  const inputClasses = "w-full bg-dashboard-bg border border-border-color px-4 py-3 text-sm focus:border-turf-green outline-none transition-colors font-sans";
  const labelClasses = "block text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Row 1: Title + Event Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Title</label>
          <input
            required
            type="text"
            className={inputClasses}
            placeholder="e.g. Member-Guest Tournament"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClasses}>Event Type</label>
          <select
            required
            className={inputClasses}
            value={formData.event_type}
            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
          >
            <option value="tournament">Tournament</option>
            <option value="championship">Championship</option>
            <option value="event">Event</option>
            <option value="maintenance">Maintenance</option>
            <option value="holiday">Holiday</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Row 2: Event Date + End Date */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClasses}>Event Date</label>
          <input
            required
            type="date"
            className={inputClasses}
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClasses}>End Date (optional)</label>
          <input
            type="date"
            className={inputClasses}
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      {/* Row 3: All Day checkbox */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="all_day"
          checked={formData.all_day}
          onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
          className="w-4 h-4 accent-turf-green"
        />
        <label htmlFor="all_day" className="text-[0.65rem] font-heading font-black text-text-secondary uppercase tracking-widest">
          All Day Event
        </label>
      </div>

      {/* Conditional Row: Start/End Time */}
      {!formData.all_day && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Start Time</label>
            <input
              type="time"
              className={inputClasses}
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClasses}>End Time</label>
            <input
              type="time"
              className={inputClasses}
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Row 4: Description */}
      <div>
        <label className={labelClasses}>Description</label>
        <textarea
          className={`${inputClasses} min-h-[80px] resize-none`}
          placeholder="Event details..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Row 5: Notes */}
      <div>
        <label className={labelClasses}>Notes</label>
        <textarea
          className={`${inputClasses} min-h-[80px] resize-none`}
          placeholder="Internal notes, prep requirements, etc."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      {/* Buttons */}
      <div className="pt-4 flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-4 border border-border-color text-text-secondary font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-dashboard-bg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-4 bg-turf-green text-white font-heading font-black text-[0.7rem] uppercase tracking-[0.2em] hover:bg-turf-green-dark transition-colors shadow-sm"
        >
          Add Event
        </button>
      </div>
    </form>
  );
}
