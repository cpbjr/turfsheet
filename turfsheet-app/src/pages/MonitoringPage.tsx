import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/ui/Modal';
import ReadingForm from '../components/monitoring/ReadingForm';
import type { GreenReading, Staff } from '../types';

// ─── Simple SVG line chart ────────────────────────────────────────────────────

interface LineChartProps {
  data: { x: string; y: number }[];
  color: string;
  label: string;
  unit: string;
}

function LineChart({ data, color, label, unit }: LineChartProps) {
  const W = 460;
  const H = 120;
  const PAD = { top: 12, right: 16, bottom: 28, left: 44 };

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-[120px] text-sm text-gray-400">
        Log at least 2 readings to see the trend
      </div>
    );
  }

  const ys = data.map(d => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - ((v - minY) / rangeY) * innerH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.y)}`).join(' ');

  // Y-axis labels (3 ticks)
  const yTicks = [minY, (minY + maxY) / 2, maxY];

  // X-axis labels — show first, last, and middle dates
  const xLabels: { i: number; label: string }[] = [];
  const labelIndices = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
  labelIndices.forEach(i => {
    xLabels.push({ i, label: data[i].x.slice(5) }); // MM-DD
  });

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
        {/* Y-axis ticks */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={toY(v)}
              x2={W - PAD.right} y2={toY(v)}
              stroke="#e5e7eb" strokeWidth="1"
            />
            <text
              x={PAD.left - 4} y={toY(v)}
              textAnchor="end" dominantBaseline="middle"
              fontSize="9" fill="#9ca3af"
            >
              {v.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ i, label: xl }) => (
          <text
            key={i}
            x={toX(i)} y={H - 4}
            textAnchor="middle" fontSize="9" fill="#9ca3af"
          >
            {xl}
          </text>
        ))}

        {/* Area fill */}
        <polygon
          points={[
            `${toX(0)},${PAD.top + innerH}`,
            ...data.map((_, i) => `${toX(i)},${toY(data[i].y)}`),
            `${toX(data.length - 1)},${PAD.top + innerH}`,
          ].join(' ')}
          fill={color}
          fillOpacity="0.08"
        />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={toX(i)} cy={toY(d.y)} r="3" fill={color} />
        ))}
      </svg>
      <p className="text-right text-xs text-gray-400 mt-0.5">{unit}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [readings, setReadings] = useState<GreenReading[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<GreenReading | null>(null);

  // Filters
  const [holeFilter, setHoleFilter] = useState<number | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<'reading_date' | 'hole_number'>('reading_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: rData, error: rErr }, { data: sData, error: sErr }] = await Promise.all([
        supabase.from('green_readings').select('*').order('reading_date', { ascending: false }).order('hole_number'),
        supabase.from('staff').select('id, name, role, sort_order, telephone, telegram_id, created_at, updated_at').order('sort_order'),
      ]);
      if (rErr) throw rErr;
      if (sErr) throw sErr;
      setReadings(rData ?? []);
      setStaff(sData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Omit<GreenReading, 'id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      if (editingReading) {
        const { error: e } = await supabase
          .from('green_readings')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', editingReading.id);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('green_readings').insert([data]);
        if (e) throw e;
      }
      setIsFormOpen(false);
      setEditingReading(null);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reading');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reading?')) return;
    setError(null);
    try {
      const { error: e } = await supabase.from('green_readings').delete().eq('id', id);
      if (e) throw e;
      setReadings(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reading');
    }
  };

  const openEdit = (r: GreenReading) => {
    setEditingReading(r);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingReading(null);
  };

  const staffMap = useMemo(() => new Map(staff.map(s => [String(s.id), s.name])), [staff]);

  const filtered = useMemo(() => {
    return readings
      .filter(r => {
        if (holeFilter !== 'all' && r.hole_number !== holeFilter) return false;
        if (dateFrom && r.reading_date < dateFrom) return false;
        if (dateTo && r.reading_date > dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        const va = sortField === 'reading_date' ? a.reading_date : String(a.hole_number);
        const vb = sortField === 'reading_date' ? b.reading_date : String(b.hole_number);
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [readings, holeFilter, dateFrom, dateTo, sortField, sortDir]);

  // Chart data — aggregate by date (average across holes for the filtered set)
  const chartData = useMemo(() => {
    const byDate = new Map<string, { moistures: number[]; firmnesses: number[]; clippings: number | null }>();
    filtered.forEach(r => {
      if (!byDate.has(r.reading_date)) byDate.set(r.reading_date, { moistures: [], firmnesses: [], clippings: null });
      const entry = byDate.get(r.reading_date)!;
      if (r.moisture != null) entry.moistures.push(r.moisture);
      if (r.firmness != null) entry.firmnesses.push(r.firmness);
      if (r.clippings_lbs != null && entry.clippings === null) entry.clippings = r.clippings_lbs;
    });
    const dates = Array.from(byDate.keys()).sort();
    const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
    return {
      moisture: dates
        .filter(d => byDate.get(d)!.moistures.length > 0)
        .map(d => ({ x: d, y: avg(byDate.get(d)!.moistures) })),
      firmness: dates
        .filter(d => byDate.get(d)!.firmnesses.length > 0)
        .map(d => ({ x: d, y: avg(byDate.get(d)!.firmnesses) })),
      clippings: dates
        .filter(d => byDate.get(d)!.clippings !== null)
        .map(d => ({ x: d, y: byDate.get(d)!.clippings! })),
    };
  }, [filtered]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const sortIcon = (field: typeof sortField) =>
    sortField !== field ? ' ↕' : sortDir === 'asc' ? ' ↑' : ' ↓';

  const inputClass = 'px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-turf-green/30';
  const thClass = 'text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3 select-none';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-turf-green" />
          <h1 className="text-xl font-semibold text-gray-900">Monitoring</h1>
          <span className="text-sm text-gray-400 ml-1">— Green Conditions</span>
        </div>
        <button
          onClick={() => { setEditingReading(null); setIsFormOpen(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-turf-green text-white text-sm rounded-lg hover:bg-turf-green/90"
        >
          <Plus className="w-4 h-4" />
          Log Reading
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <LineChart
            data={chartData.moisture}
            color="#16a34a"
            label="Moisture Trend (avg across holes)"
            unit="% VWC"
          />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <LineChart
            data={chartData.firmness}
            color="#2563eb"
            label="Firmness Trend (avg across holes)"
            unit="Clegg value"
          />
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <LineChart
            data={chartData.clippings}
            color="#d97706"
            label="Clippings Trend (daily)"
            unit="lbs"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          className={inputClass}
          value={holeFilter === 'all' ? 'all' : String(holeFilter)}
          onChange={e => setHoleFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">All Holes</option>
          {Array.from({ length: 18 }, (_, i) => i + 1).map(h => (
            <option key={h} value={h}>Hole {h}</option>
          ))}
        </select>
        <input
          type="date"
          className={inputClass}
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          placeholder="From"
        />
        <span className="text-gray-400 text-sm">to</span>
        <input
          type="date"
          className={inputClass}
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          placeholder="To"
        />
        {(holeFilter !== 'all' || dateFrom || dateTo) && (
          <button
            className="text-sm text-gray-400 hover:text-gray-600"
            onClick={() => { setHoleFilter('all'); setDateFrom(''); setDateTo(''); }}
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">{filtered.length} reading{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center text-sm text-gray-400 py-12">Loading readings…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No readings yet.</p>
            <p className="text-gray-300 text-xs mt-1">Click "Log Reading" to add your first entry.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th
                  className={`${thClass} cursor-pointer hover:text-gray-700`}
                  onClick={() => toggleSort('reading_date')}
                >
                  Date{sortIcon('reading_date')}
                </th>
                <th
                  className={`${thClass} cursor-pointer hover:text-gray-700`}
                  onClick={() => toggleSort('hole_number')}
                >
                  Hole{sortIcon('hole_number')}
                </th>
                <th className={thClass}>Moisture (%)</th>
                <th className={thClass}>Firmness</th>
                <th className={thClass}>Clippings (lbs)</th>
                <th className={thClass}>Staff</th>
                <th className={thClass}>Notes</th>
                <th className={thClass + ' text-right'}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span>{r.reading_date}</span>
                    {r.reading_time && (
                      <span className="text-xs text-gray-400 ml-1.5">{r.reading_time.slice(0, 5)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-turf-green/10 text-turf-green text-sm font-semibold">
                      {r.hole_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.moisture != null ? r.moisture.toFixed(1) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.firmness != null ? r.firmness.toFixed(1) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {r.clippings_lbs != null ? r.clippings_lbs.toFixed(2) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {r.staff_id != null ? (staffMap.get(String(r.staff_id)) ?? '—') : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">
                    {r.notes || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 text-gray-400 hover:text-turf-green hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingReading ? 'Edit Reading' : 'Log New Reading'}
      >
        <ReadingForm
          initialData={editingReading ?? undefined}
          staff={staff}
          onSubmit={handleSave}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}
