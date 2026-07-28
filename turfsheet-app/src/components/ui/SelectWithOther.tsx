import { useState } from 'react';
import type { OptionDef } from '../../lib/pesticideOptions';

// UI-only sentinel. Must never reach form state.
const OTHER = '__other__';

interface SelectWithOtherProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: OptionDef[];
    placeholder?: string;
    otherPlaceholder?: string;
    inputClasses: string;
    labelClasses: string;
}

/**
 * A dropdown with an "Other" escape hatch that stores free text directly in the
 * same field, so a missing option never blocks the user from saving.
 */
export default function SelectWithOther({
    label,
    value,
    onChange,
    options,
    placeholder = 'Select...',
    otherPlaceholder = 'Describe...',
    inputClasses,
    labelClasses,
}: SelectWithOtherProps) {
    // Derived from the incoming value so edit mode round-trips a previously
    // saved free-text value back into the text input, not a blank select.
    const [showOther, setShowOther] = useState(
        () => value !== '' && !options.some(o => o.value === value)
    );

    const handleSelect = (selected: string) => {
        if (selected === OTHER) {
            setShowOther(true);
            onChange('');
        } else {
            setShowOther(false);
            onChange(selected);
        }
    };

    return (
        <div>
            <label className={labelClasses}>{label}</label>
            <select
                className={inputClasses}
                value={showOther ? OTHER : value}
                onChange={(e) => handleSelect(e.target.value)}
            >
                <option value="">{placeholder}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
                <option value={OTHER}>Other (type it in)</option>
            </select>

            {showOther && (
                <div className="mt-2">
                    <input
                        type="text"
                        className={inputClasses}
                        placeholder={otherPlaceholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        autoFocus
                    />
                    <button
                        type="button"
                        onClick={() => handleSelect('')}
                        className="mt-1 text-[0.65rem] font-sans text-text-secondary hover:text-turf-green transition-colors underline"
                    >
                        Back to list
                    </button>
                </div>
            )}
        </div>
    );
}
