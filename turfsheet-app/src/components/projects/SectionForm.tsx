import { useState, useRef, useEffect } from 'react';

interface SectionFormProps {
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export default function SectionForm({ onSubmit, onCancel }: SectionFormProps) {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Section name..."
        className="flex-1 bg-dashboard-bg border border-border-color px-3 py-2 text-sm font-sans focus:border-turf-green outline-none transition-colors"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-turf-green text-white text-[0.65rem] font-heading font-black uppercase tracking-widest hover:bg-turf-green-dark transition-colors"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 border border-border-color text-text-secondary text-[0.65rem] font-heading font-black uppercase tracking-widest hover:bg-dashboard-bg transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
