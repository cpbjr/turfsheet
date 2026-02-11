import { X } from 'lucide-react';

interface SecondJobChipProps {
  jobTitle: string;
  onRemove: () => void;
}

export default function SecondJobChip({ jobTitle, onRemove }: SecondJobChipProps) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-turf-green-light text-turf-green-dark font-sans font-semibold group">
      <span>{jobTitle}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-turf-green-dark/10 rounded-full p-0.5"
        aria-label={`Remove ${jobTitle}`}
      >
        <X size={12} className="text-turf-green-dark" />
      </button>
    </div>
  );
}
