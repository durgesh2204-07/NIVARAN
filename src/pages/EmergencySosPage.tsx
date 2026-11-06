import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { EmergencySosPanel } from '../components/EmergencySosModal';

/**
 * Dedicated Emergency SOS Screen (Section B)
 * Purpose: Instant, one-gesture distress signal with location, no recording.
 * Hold for 2 seconds to confirm with a visible progress ring and Cancel option.
 */
export const EmergencySosPage: React.FC = () => {
  const language = useAppStore((s) => s.language);

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="neu-raised p-5 sm:p-6 space-y-4 border-2 border-[#B91C1C]">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-3">
          <div className="w-11 h-11 rounded-[12px] bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              {language === 'hi'
                ? 'आपातकालीन SOS (Emergency SOS)'
                : 'Emergency SOS'}
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Instant, one-gesture distress signal with GPS location (No audio recording)
            </p>
          </div>
        </div>

        <EmergencySosPanel />
      </div>
    </div>
  );
};
