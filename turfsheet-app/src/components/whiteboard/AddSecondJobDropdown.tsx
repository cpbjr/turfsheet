import { useState, useRef, useEffect } from 'react';
import { Plus } from 'lucide-react';

interface AddSecondJobDropdownProps {
  onAdd: (description: string) => void;
}

export default function AddSecondJobDropdown({
  onAdd,
}: AddSecondJobDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSubmit();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, text]);

  const handleSubmit = () => {
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (const line of lines) {
      onAdd(line);
    }

    setText('');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 text-xs font-sans text-white/80 hover:text-white border border-white/30 rounded hover:bg-white/10 transition-colors"
      >
        <Plus size={14} />
        Add Jobs
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 right-0 bg-panel-white border border-border-color shadow-lg w-72 p-3">
          <p className="text-[0.65rem] font-sans text-text-muted mb-1.5">
            One job per line
          </p>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setText('');
                setIsOpen(false);
              }
            }}
            rows={5}
            placeholder={"Mow fairway 3\nRake bunkers 7-9\nFill divots driving range"}
            className="w-full px-2 py-1.5 text-sm font-sans border border-border-color focus:border-turf-green outline-none transition-colors resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              className="px-3 py-1 text-xs font-sans font-bold bg-turf-green text-white hover:bg-turf-green-dark transition-colors"
            >
              Add to Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
