import { useState } from 'react';
import type { GreenReading, Staff } from '../../types';

interface ReadingFormProps {
  initialData?: Partial<GreenReading>;
  staff: Staff[];
  onSubmit: (data: Omit<GreenReading, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export default function ReadingForm({ initialData, staff, onSubmit, onCancel }: ReadingFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  const [formData, setFormData] = useState({
    reading_date: initialData?.reading_date ?? today,
    reading_time: initialData?.reading_time ?? now,
    hole_number: initialData?.hole_number ?? 1,
    moisture: initialData?.moisture ?? '',
    firmness: initialData?.firmness ?? '',
    clippings_lbs: initialData?.clippings_lbs ?? '',
    staff_id: initialData?.staff_id ?? '',
    notes: initialData?.notes ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      reading_date: formData.reading_date,
      reading_time: formData.reading_time || undefined,
      hole_number: Number(formData.hole_number),
      moisture: formData.moisture !== '' ? Number(formData.moisture) : undefined,
      firmness: formData.firmness !== '' ? Number(formData.firmness) : undefined,
      clippings_lbs: formData.clippings_lbs !== '' ? Number(formData.clippings_lbs) : undefined,
      staff_id: formData.staff_id !== '' ? Number(formData.staff_id) : undefined,
      notes: formData.notes || undefined,
    });
  };

  const fieldClass = 'w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-turf-green/30 focus:border-turf-green';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            required
            className={fieldClass}
            value={formData.reading_date}
            onChange={e => setFormData(f => ({ ...f, reading_date: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>Time</label>
          <input
            type="time"
            className={fieldClass}
            value={formData.reading_time}
            onChange={e => setFormData(f => ({ ...f, reading_time: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Hole *</label>
        <select
          required
          className={fieldClass}
          value={formData.hole_number}
          onChange={e => setFormData(f => ({ ...f, hole_number: Number(e.target.value) }))}
        >
          {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>Hole {h}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Moisture (%)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="e.g. 22.5"
            className={fieldClass}
            value={formData.moisture}
            onChange={e => setFormData(f => ({ ...f, moisture: e.target.value }))}
          />
        </div>
        <div>
          <label className={labelClass}>Firmness</label>
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 85.0"
            className={fieldClass}
            value={formData.firmness}
            onChange={e => setFormData(f => ({ ...f, firmness: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Clippings (lbs) <span className="text-gray-400 font-normal">— daily total</span></label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g. 3.25"
          className={fieldClass}
          value={formData.clippings_lbs}
          onChange={e => setFormData(f => ({ ...f, clippings_lbs: e.target.value }))}
        />
      </div>

      <div>
        <label className={labelClass}>Taken by</label>
        <select
          className={fieldClass}
          value={formData.staff_id}
          onChange={e => setFormData(f => ({ ...f, staff_id: e.target.value }))}
        >
          <option value="">— Select staff —</option>
          {staff.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          rows={3}
          placeholder="Observations, conditions, etc."
          className={fieldClass}
          value={formData.notes}
          onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-turf-green rounded-lg hover:bg-turf-green/90"
        >
          Save Reading
        </button>
      </div>
    </form>
  );
}
