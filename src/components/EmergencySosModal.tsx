import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAccurateGpsSnapshot, useAccurateGps } from '../services/gpsService';
import { EmergencySosItem } from '../types';

export const EmergencySosButton: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}> = ({ className = '', size = 'md', label }) => {
  const setEmergencySosModalOpen = useAppStore((s) => s.setEmergencySosModalOpen);
  const language = useAppStore((s) => s.language);

  const buttonText =
    label || (language === 'hi' ? 'आपातकालीन SOS (Emergency SOS)' : 'Emergency SOS');

  const sizeClasses =
    size === 'lg'
      ? 'px-5 py-3 text-sm font-bold rounded-[12px]'
      : size === 'sm'
      ? 'px-3 py-1.5 text-xs font-bold rounded-[8px]'
      : 'px-4 py-2 text-xs font-bold rounded-[10px]';

  return (
    <button
      type="button"
      onClick={() => setEmergencySosModalOpen(true)}
      className={`bg-[#B91C1C] hover:bg-[#991B1B] text-white flex items-center justify-center gap-2 shadow-sm transition-colors ${sizeClasses} ${className}`}
    >
      <ShieldAlert className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={1.75} />
      <span>{buttonText}</span>
    </button>
  );
};

export const EmergencySosPanel: React.FC<{
  onCancel?: () => void;
}> = ({ onCancel }) => {
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const submitSosAlert = useAppStore((s) => s.submitSosAlert);
  const sosAlerts = useAppStore((s) => s.sosAlerts);

  const { gps } = useAccurateGps();

  const [step, setStep] = useState<'hold' | 'status'>('hold');
  const [holdProgressPct, setHoldProgressPct] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [statusPhase, setStatusPhase] = useState<
    'Sending' | 'Delivered' | 'Acknowledged by control room'
  >('Sending');
  const [sentSosId, setSentSosId] = useState<string | null>(null);
  const [plainError, setPlainError] = useState<string | null>(null);

  const holdStartMsRef = useRef<number | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const triggeredRef = useRef<boolean>(false);

  const trackedSos: EmergencySosItem | undefined = sosAlerts.find(
    (s) => s.id === sentSosId
  );

  useEffect(() => {
    return () => {
      if (holdRafRef.current !== null) {
        cancelAnimationFrame(holdRafRef.current);
      }
    };
  }, []);

  const startHoldGesture = () => {
    if (triggeredRef.current) return;
    setPlainError(null);
    setIsHolding(true);
    holdStartMsRef.current = performance.now();

    const tick = (now: number) => {
      if (holdStartMsRef.current === null) return;
      const elapsed = now - holdStartMsRef.current;
      const pct = Math.min(100, Math.round((elapsed / 2000) * 100));
      setHoldProgressPct(pct);

      if (elapsed >= 2000 && !triggeredRef.current) {
        triggeredRef.current = true;
        setIsHolding(false);
        holdStartMsRef.current = null;
        void confirmAndSendSos();
        return;
      }

      holdRafRef.current = requestAnimationFrame(tick);
    };

    holdRafRef.current = requestAnimationFrame(tick);
  };

  const cancelHoldGesture = () => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    holdStartMsRef.current = null;
    setIsHolding(false);
    if (!triggeredRef.current) {
      setHoldProgressPct(0);
    }
  };

  const confirmAndSendSos = async () => {
    setStep('status');
    setStatusPhase('Sending');

    const gpsSnap = getAccurateGpsSnapshot();
    const lat = Number.isFinite(gpsSnap.lat) ? gpsSnap.lat : 18.9265;
    const lng = Number.isFinite(gpsSnap.lng) ? gpsSnap.lng : 73.2361;
    const accuracyMeters = Number.isFinite(gpsSnap.accuracyMeters) ? gpsSnap.accuracyMeters : 25;

    const created = await submitSosAlert({
      lat,
      lng,
      accuracyMeters,
      phone: user?.emailOrPhone || '',
      district: user?.district && user.district !== 'All' ? user.district : 'Raigad',
    });

    setSentSosId(created.id);

    if (created.status === 'Failed') {
      setPlainError(
        'Emergency SOS could not reach the Control Room immediately and has been queued for automatic retry. Please call 112 right now.'
      );
      return;
    }

    setTimeout(() => {
      setStatusPhase('Delivered');
    }, 300);
  };

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (holdProgressPct / 100) * circumference;

  const districtName =
    user?.district && user.district !== 'All' ? user.district : 'Raigad';

  return (
    <div className="space-y-5">
      {/* GPS Metadata Banner */}
      <div className="neu-flat p-3 rounded-[10px] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#B91C1C] shrink-0" strokeWidth={1.75} />
          <div>
            <div className="font-mono font-bold text-[var(--text-primary)]">
              {gps.lat.toFixed(5)}°N, {gps.lng.toFixed(5)}°E
            </div>
            <div className="text-[11px] text-[var(--text-secondary)]">
              Accuracy: +/- {Math.round(gps.accuracyMeters)} m · Instant GPS distress signal (No audio recorded)
            </div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#B91C1C] text-white text-[10px] font-bold">
          HIGHEST PRIORITY
        </span>
      </div>

      {/* Step 1: 2-Second Hold to Confirm with Visible Progress Ring */}
      {step === 'hold' && (
        <div className="neu-inset p-6 rounded-[14px] text-center space-y-4">
          <p className="text-xs font-bold text-[var(--text-primary)]">
            {language === 'hi'
              ? 'दुर्घटनावश दबने से बचने के लिए पुष्टि करने हेतु 2 सेकंड तक दबाए रखें'
              : 'Hold for 2 seconds to confirm and send an instant distress signal with your GPS location'}
          </p>

          {/* Visible Progress Ring + Hold Button */}
          <div className="relative w-40 h-40 mx-auto flex items-center justify-center select-none">
            <svg
              className="w-40 h-40 -rotate-90 pointer-events-none"
              viewBox="0 0 148 148"
              aria-hidden="true"
            >
              <circle
                cx="74"
                cy="74"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-300 dark:text-slate-700"
              />
              <circle
                cx="74"
                cy="74"
                r={radius}
                stroke="#B91C1C"
                strokeWidth="8"
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-75"
              />
            </svg>

            <button
              type="button"
              onMouseDown={startHoldGesture}
              onMouseUp={cancelHoldGesture}
              onMouseLeave={cancelHoldGesture}
              onTouchStart={(e) => {
                e.preventDefault();
                startHoldGesture();
              }}
              onTouchEnd={cancelHoldGesture}
              onKeyDown={(e) => {
                if ((e.key === ' ' || e.key === 'Enter') && !isHolding) {
                  e.preventDefault();
                  startHoldGesture();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  cancelHoldGesture();
                }
              }}
              className={`absolute w-28 h-28 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] text-white flex flex-col items-center justify-center gap-1 shadow-lg transition-transform ${
                isHolding ? 'scale-95 ring-4 ring-[#B91C1C]/40' : ''
              }`}
              aria-label="Hold for 2 seconds to send Emergency SOS"
            >
              <ShieldAlert className="w-8 h-8" strokeWidth={2} />
              <span className="text-xs font-extrabold tracking-wide uppercase">
                {isHolding ? `${holdProgressPct}%` : 'HOLD 2s'}
              </span>
              <span className="text-[10px] font-semibold opacity-90">SOS</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-[var(--text-secondary)]">
            {isHolding
              ? `Keep holding... (${((2000 - (holdProgressPct / 100) * 2000) / 1000).toFixed(1)}s left)`
              : 'Press and hold the red SOS button for 2 seconds'}
          </div>

          {onCancel && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  cancelHoldGesture();
                  onCancel();
                }}
                className="neu-btn px-5 py-2 text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Delivery States — Sending -> Delivered -> Acknowledged by control room */}
      {step === 'status' && (
        <div className="neu-flat p-4 rounded-[12px] space-y-3 border border-[#B91C1C]/40">
          {trackedSos && (
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#B91C1C]">
                  Ref: {trackedSos.referenceNo} · HIGHEST PRIORITY
                </span>
                <div className="text-xs font-bold text-[var(--text-primary)]">
                  {trackedSos.controlRoomTarget}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-[11px] font-bold text-white ${
                  trackedSos.acknowledgedBy ? 'bg-[#15803D]' : 'bg-[#B91C1C]'
                }`}
              >
                {trackedSos.status === 'Queued Offline'
                  ? 'Queued Offline'
                  : trackedSos.acknowledgedBy
                  ? 'Acknowledged by control room'
                  : statusPhase}
              </span>
            </div>
          )}

          {plainError && (
            <div className="p-3 rounded-[8px] bg-[#B91C1C]/10 border border-[#B91C1C] text-xs text-[#B91C1C] font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{plainError}</span>
            </div>
          )}

          <div className="space-y-2.5 text-xs">
            {/* 1. Sending */}
            <div className="flex items-center gap-2.5 font-semibold text-[#15803D]">
              <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>
                1. Sending — GPS ({trackedSos?.lat.toFixed(5)}°N, {trackedSos?.lng.toFixed(5)}°E, +/-{' '}
                {Math.round(trackedSos?.accuracyMeters || gps.accuracyMeters)} m) & Caller ID (
                {trackedSos?.userId || user?.id || 'Citizen'})
              </span>
            </div>

            {/* 2. Delivered */}
            <div
              className={`flex items-center gap-2.5 font-semibold ${
                statusPhase === 'Delivered' || trackedSos?.acknowledgedBy
                  ? 'text-[#15803D]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {statusPhase === 'Delivered' || trackedSos?.acknowledgedBy ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              ) : (
                <Clock className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              )}
              <span>
                2. Delivered to {trackedSos?.controlRoomTarget || 'District Control Room'} (
                {trackedSos?.timestamp})
              </span>
            </div>

            {/* 3. Acknowledged by control room */}
            <div
              className={`flex items-center gap-2.5 font-semibold ${
                trackedSos?.acknowledgedBy
                  ? 'text-[#15803D]'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              {trackedSos?.acknowledgedBy ? (
                <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              ) : (
                <Clock className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              )}
              <span>
                3. Acknowledged by control room{' '}
                {trackedSos?.acknowledgedBy
                  ? `— ${trackedSos.acknowledgedBy} at ${trackedSos.acknowledgedAt}`
                  : '(Awaiting immediate duty officer acknowledgement...)'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                triggeredRef.current = false;
                setHoldProgressPct(0);
                setStep('hold');
              }}
              className="neu-btn px-3.5 py-2 text-xs font-bold"
            >
              Reset SOS
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-[10px] bg-[#0B1F33] text-white text-xs font-bold"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}

      {/* National Emergency Numbers (112 and Relevant District Helpline) */}
      <div className="neu-flat p-4 rounded-[12px] space-y-2.5">
        <div className="text-xs font-bold text-[var(--text-primary)]">
          National & District Emergency Helpline Numbers (24x7 Toll-Free):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href="tel:112"
            className="p-3 rounded-[10px] bg-[#B91C1C] hover:bg-[#991B1B] text-white flex items-center justify-between font-bold text-xs shadow-sm"
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4" strokeWidth={1.75} />
              <div>
                <div>National Emergency Number</div>
                <div className="text-[10px] opacity-90">Police · Fire · Ambulance · NDRF</div>
              </div>
            </div>
            <span className="text-base font-mono font-extrabold">112</span>
          </a>

          <a
            href="tel:1077"
            className="p-3 rounded-[10px] bg-[#0B1F33] hover:bg-slate-800 text-white flex items-center justify-between font-bold text-xs shadow-sm"
          >
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4" strokeWidth={1.75} />
              <div>
                <div>{districtName} District Control Room</div>
                <div className="text-[10px] opacity-90">DDMA Helpline (State SEOC: 1070)</div>
              </div>
            </div>
            <span className="text-base font-mono font-extrabold">1077</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export const EmergencySosModal: React.FC = () => {
  const open = useAppStore((s) => s.emergencySosModalOpen);
  const setOpen = useAppStore((s) => s.setEmergencySosModalOpen);
  const language = useAppStore((s) => s.language);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] bg-black/65 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-sos-modal-title"
    >
      <div className="neu-raised max-w-md w-full p-6 space-y-4 border-2 border-[#B91C1C]">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2
                id="emergency-sos-modal-title"
                className="text-base font-bold text-[var(--text-primary)]"
              >
                {language === 'hi'
                  ? 'आपातकालीन SOS (Emergency SOS)'
                  : 'Emergency SOS'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Instant one-gesture distress signal with GPS location (No audio recording)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="neu-btn p-1.5"
            aria-label="Close Emergency SOS"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <EmergencySosPanel onCancel={() => setOpen(false)} />
      </div>
    </div>
  );
};
