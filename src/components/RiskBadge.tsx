import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { RiskLevel } from '../types';
import { useAppStore } from '../store/useAppStore';
import { TRANSLATIONS } from '../i18n/translations';

interface RiskBadgeProps {
  level?: RiskLevel | 'Critical' | 'High' | 'Moderate';
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function normalizeRiskLevel(level?: RiskLevel | 'Critical' | 'High' | 'Moderate'): RiskLevel {
  if (!level) return 'Immediate';
  if (level === 'Critical') return 'Immediate';
  if (level === 'High') return 'Short-term';
  if (level === 'Moderate') return 'Medium-term';
  return level;
}

/**
 * Flat, solid, high-contrast semantic risk chip (never neumorphic, never gradient):
 * - Safe: #15803D
 * - Watch: #CA8A04
 * - Alert: #EA580C
 * - Danger: #B91C1C
 * Always paired with an icon (stroke 1.75) and text label.
 */
export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  showLabel = true,
}) => {
  const language = useAppStore((s) => s.language);
  const t = TRANSLATIONS[language];
  const resolvedLevel = normalizeRiskLevel(level);
  const iconClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const config: Record<
    RiskLevel,
    {
      bg: string;
      text: string;
      border: string;
      icon: React.ReactNode;
      shortText: string;
    }
  > = {
    Immediate: {
      bg: 'bg-[#B91C1C]',
      text: 'text-white',
      border: 'border-[#991B1B]',
      icon: <ShieldAlert className={iconClass} strokeWidth={1.75} aria-hidden="true" />,
      shortText: t.riskLevels.Immediate,
    },
    'Short-term': {
      bg: 'bg-[#EA580C]',
      text: 'text-white',
      border: 'border-[#C2410C]',
      icon: <AlertTriangle className={iconClass} strokeWidth={1.75} aria-hidden="true" />,
      shortText: t.riskLevels['Short-term'],
    },
    'Medium-term': {
      bg: 'bg-[#CA8A04]',
      text: 'text-white',
      border: 'border-[#A16207]',
      icon: <AlertCircle className={iconClass} strokeWidth={1.75} aria-hidden="true" />,
      shortText: t.riskLevels['Medium-term'],
    },
    Safe: {
      bg: 'bg-[#15803D]',
      text: 'text-white',
      border: 'border-[#166534]',
      icon: <CheckCircle2 className={iconClass} strokeWidth={1.75} aria-hidden="true" />,
      shortText: t.riskLevels.Safe,
    },
  };

  const c = config[resolvedLevel];
  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm gap-2'
      : 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-[6px] border ${c.bg} ${c.text} ${c.border} ${sizeClasses} tabular-nums whitespace-nowrap shadow-none`}
    >
      {c.icon}
      {showLabel && <span>{c.shortText}</span>}
      {typeof score === 'number' && (
        <span className="font-mono font-bold opacity-95">({score.toFixed(3)})</span>
      )}
    </span>
  );
};
