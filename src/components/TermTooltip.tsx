import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TermTooltipProps {
  term: string;
  explanation: string;
  example?: string;
}

/**
 * Technical term tooltip helper with keyboard and hover accessibility.
 * Explains domain concepts like Carrying Capacity, MCDA, Digital Dress Rehearsal, Red Zone, etc.
 */
export const TermTooltip: React.FC<TermTooltipProps> = ({
  term,
  explanation,
  example,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-1 group cursor-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      role="button"
      aria-label={`${term}: ${explanation}`}
    >
      <span className="border-b border-dotted border-slate-400 dark:border-slate-500">
        {term}
      </span>
      <HelpCircle className="w-3.5 h-3.5 text-[#0E9F8E] shrink-0" aria-hidden="true" />
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-xl bg-[#0B1F33] text-white text-xs leading-relaxed shadow-soft-lg border border-slate-700 z-50 pointer-events-none text-left font-normal"
        >
          <span className="block font-semibold text-[#0E9F8E] mb-1">{term}</span>
          <span className="block text-slate-200">{explanation}</span>
          {example && (
            <span className="block mt-1.5 pt-1.5 border-t border-slate-700/80 text-[11px] text-amber-300 font-mono">
              Ex: {example}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
