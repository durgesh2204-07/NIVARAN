import React, { useEffect, useState } from 'react';
import { AlertTriangle, Inbox, Info, RefreshCw } from 'lucide-react';
import { generateReferenceId } from '../resilience/reporter';

/**
 * Reusable Four-State Screen Primitives (Section 9.5):
 * 1. LoadingSkeletonState (enforces 15-second max spinner rule)
 * 2. EmptyStatePanel (icon + one plain sentence + optional action)
 * 3. ErrorStatePanel (plain message + Retry + reference ID)
 * 4. PartialDataStrip (data displayed with a warning strip)
 */

export const LoadingSkeletonState: React.FC<{
  rows?: number;
  label?: string;
  onTimeoutRetry?: () => void;
}> = ({ rows = 3, label = 'Loading operational records...', onTimeoutRetry }) => {
  const [timedOut, setTimedOut] = useState(false);

  // Timeouts never leave spinners running forever: every loading state ends within 15 seconds (Section 9.5)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTimedOut(true);
    }, 15000);
    return () => window.clearTimeout(timer);
  }, []);

  if (timedOut) {
    return (
      <ErrorStatePanel
        message="Request took longer than 15 seconds to respond."
        onRetry={() => {
          setTimedOut(false);
          onTimeoutRetry?.();
        }}
      />
    );
  }

  return (
    <div role="status" aria-live="polite" className="neu-raised p-5 space-y-3">
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="font-mono text-[11px]">Syncing...</span>
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            className="h-10 rounded-[10px] bg-[var(--border)]/40 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};

export const EmptyStatePanel: React.FC<{
  sentence: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ sentence, actionLabel, onAction }) => {
  return (
    <div className="neu-flat p-6 rounded-[14px] text-center space-y-3">
      <div className="w-10 h-10 rounded-[10px] neu-inset mx-auto flex items-center justify-center text-[var(--text-secondary)]">
        <Inbox className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">{sentence}</p>
      {actionLabel && onAction && (
        <div>
          <button
            type="button"
            onClick={onAction}
            className="neu-btn px-3.5 py-1.5 text-xs font-semibold text-[#0B8F80]"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export const ErrorStatePanel: React.FC<{
  message: string;
  referenceId?: string;
  onRetry?: () => void;
}> = ({ message, referenceId, onRetry }) => {
  const [refId] = useState(() => referenceId || generateReferenceId('NIV-UI'));

  return (
    <div
      role="alert"
      className="neu-flat p-4 rounded-[14px] border border-[#B91C1C]/40 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)]">{message}</p>
          <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
            Reference ID: {refId}
          </p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="neu-btn px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};

export const PartialDataStrip: React.FC<{
  notice: string;
  updatedAtIst?: string;
  onRetry?: () => void;
}> = ({ notice, updatedAtIst, onRetry }) => {
  return (
    <div
      role="status"
      className="neu-flat px-3.5 py-2 rounded-[10px] border-l-4 border-l-[#CA8A04] flex flex-wrap items-center justify-between gap-2 text-xs"
    >
      <div className="flex items-center gap-2 text-[var(--text-primary)]">
        <Info className="w-4 h-4 text-[#CA8A04] shrink-0" strokeWidth={1.75} />
        <span>{notice}</span>
        {updatedAtIst && (
          <span className="font-mono text-[11px] text-[var(--text-secondary)]">
            · Last updated {updatedAtIst} IST
          </span>
        )}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold text-[#0B8F80] hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" strokeWidth={1.75} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
