import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export default function CustomSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  className = '',
  icon,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string, optDisabled?: boolean) => {
    if (optDisabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-slate-200 text-base font-medium text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs text-left ${
          isOpen ? 'bg-white ring-2 ring-blue-500/20 border-blue-500' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate text-base">
            {selectedOption ? selectedOption.label : placeholder || '선택하세요'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Rounded Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xl max-h-64 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onClick={() => handleSelect(option.value, option.disabled)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-base font-medium transition-all text-left ${
                  option.disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400'
                    : isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {option.icon && <span className="shrink-0">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {option.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
                      {option.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
