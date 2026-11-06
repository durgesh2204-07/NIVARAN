import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ExternalLink,
  Flame,
  MapPin,
  Radio,
  Siren,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAlertLevelMeta } from '../utils/alertUtils';
import { Language } from '../types';

interface NotificationCenterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const NotificationCenterPopover: React.FC<NotificationCenterPopoverProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const navigate = useNavigate();
  const popoverRef = useRef<HTMLDivElement>(null);

  const activeAlertZones = useAppStore((s) => s.activeAlertZones);
  const voiceAlerts = useAppStore((s) => s.voiceAlerts);
  const sosAlerts = useAppStore((s) => s.sosAlerts);
  const incidents = useAppStore((s) => s.incidents);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter high severity active alerts (Red, Orange)
  const highSeverityAlerts = activeAlertZones.filter(
    (z) => z.level === 'Red' || z.level === 'Orange'
  );
  const pendingSos = sosAlerts.filter((s) => s.status !== 'Resolved');
  const undeliveredVoice = voiceAlerts.filter(
    (v) => v.status === 'Delivered to control room' || v.status === 'Queued Offline'
  );
  const openIncidents = incidents.filter(
    (i) => i.status === 'Reported' || i.status === 'In Progress'
  );

  const totalCount =
    highSeverityAlerts.length + pendingSos.length + undeliveredVoice.length + openIncidents.length;

  const titleText =
    language === 'mr'
      ? 'आपत्कालीन सूचना केंद्र'
      : language === 'hi'
      ? 'आपातकालीन सूचना केंद्र'
      : 'Emergency Notification Center';

  const subText =
    language === 'mr'
      ? 'थेट सक्रिय इशारे, एसओएस आणि फील्ड घटनांची स्थिती'
      : language === 'hi'
      ? 'लाइव सक्रिय अलर्ट, एसओएस एवं फील्ड घटनाओं की स्थिति'
      : 'Live active alerts, SOS beacons, and pending field triage';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="absolute right-0 top-full mt-2 w-96 max-w-[95vw] bg-white dark:bg-[#0B291D] border border-[#D1E7DD] dark:border-[#1E543A] rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right"
          role="dialog"
          aria-label="Notification Center"
        >
      {/* Header */}
      <div className="px-4 py-3 bg-[#F4F9F5] dark:bg-[#061A12] border-b border-[#D1E7DD] dark:border-[#1E543A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#E8F5E9] dark:bg-emerald-900/60 text-[#059669] flex items-center justify-center font-bold">
            <Bell className="w-4 h-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#0F291E] dark:text-emerald-100 flex items-center gap-1.5">
              <span>{titleText}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#B91C1C] text-white">
                {totalCount}
              </span>
            </h3>
            <p className="text-[10px] text-[#355344] dark:text-emerald-400">{subText}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-emerald-200"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Notification Items List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#D1E7DD]/50 dark:divide-[#1E543A]/50">
        {totalCount === 0 ? (
          <div className="p-6 text-center text-xs text-[#355344] dark:text-emerald-300">
            <CheckCircle2 className="w-8 h-8 text-[#059669] mx-auto mb-2" strokeWidth={1.5} />
            <div className="font-bold">All clear · No active emergency alerts</div>
            <div className="text-[10.5px] opacity-75 mt-0.5">
              Normal operating conditions across all monitoring sectors.
            </div>
          </div>
        ) : (
          <>
            {/* SOS Alerts */}
            {pendingSos.map((sos) => (
              <div
                key={sos.id}
                className="p-3 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100/60 transition-colors flex items-start gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                  <Siren className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-black text-red-700 dark:text-red-300 uppercase tracking-wide">
                      EMERGENCY SOS BEACON
                    </span>
                    <span className="text-[9.5px] font-mono text-red-600 dark:text-red-400">
                      {sos.timestamp}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0F291E] dark:text-gray-100 truncate mt-0.5">
                    {sos.district ? `${sos.district} (${sos.lat.toFixed(4)}°N, ${sos.lng.toFixed(4)}°E)` : `${sos.lat.toFixed(4)}°N, ${sos.lng.toFixed(4)}°E`}
                  </div>
                  <div className="text-[10.5px] text-[#355344] dark:text-gray-300 line-clamp-1 mt-0.5">
                    {sos.priority ? `${sos.priority} · Caller: ${sos.userName || 'Citizen'}` : 'Urgent assistance requested.'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/sos');
                        onClose();
                      }}
                      className="px-2 py-0.8 rounded text-[10.5px] font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      Dispatch Responders
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/map');
                        onClose();
                      }}
                      className="text-[10.5px] font-semibold text-red-700 dark:text-red-300 hover:underline flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>View on Map</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* High-Severity CAP Alert Zones */}
            {highSeverityAlerts.map((zone) => {
              const meta = getAlertLevelMeta(zone.level);
              return (
                <div
                  key={zone.id}
                  className="p-3 hover:bg-[#F4F9F5] dark:hover:bg-[#113828] transition-colors flex items-start gap-2.5"
                >
                  <div
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0 mt-0.5 font-black text-xs shadow-2xs"
                    style={{ backgroundColor: meta.bg }}
                  >
                    !
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white uppercase"
                        style={{ backgroundColor: meta.bg }}
                      >
                        {zone.level} Alert
                      </span>
                      <span className="text-[10px] text-[#355344] dark:text-emerald-400 font-mono">
                        {zone.district}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#0F291E] dark:text-gray-100 truncate mt-1">
                      {zone.areaName}
                    </div>
                    <div className="text-[10.5px] text-[#355344] dark:text-gray-300 line-clamp-1 mt-0.5">
                      {zone.instructions}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/map');
                          onClose();
                        }}
                        className="text-[10.5px] font-bold text-[#059669] hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Inspect Polygon</span>
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigate('/alerts');
                          onClose();
                        }}
                        className="text-[10.5px] font-semibold text-[#355344] dark:text-emerald-300 hover:underline"
                      >
                        View Broadcast
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Unacknowledged Voice Alerts */}
            {undeliveredVoice.map((voice) => (
              <div
                key={voice.id}
                className="p-3 hover:bg-[#F4F9F5] dark:hover:bg-[#113828] transition-colors flex items-start gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                      Voice Advisory
                    </span>
                    <span className="text-[9.5px] font-mono text-[#355344] dark:text-emerald-400">
                      {voice.timestamp}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0F291E] dark:text-gray-100 truncate mt-0.5">
                    {voice.district || `${voice.lat.toFixed(4)}°N, ${voice.lng.toFixed(4)}°E`}
                  </div>
                  <div className="text-[10.5px] text-[#355344] dark:text-gray-300 line-clamp-1 mt-0.5">
                    {voice.transcriptSummary || 'Voice broadcast transmission recorded.'}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/alerts');
                      onClose();
                    }}
                    className="mt-1.5 text-[10.5px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    Acknowledge Voice Broadcast →
                  </button>
                </div>
              </div>
            ))}

            {/* Pending Citizen Reports */}
            {openIncidents.slice(0, 2).map((inc) => (
              <div
                key={inc.id}
                className="p-3 hover:bg-[#F4F9F5] dark:hover:bg-[#113828] transition-colors flex items-start gap-2.5"
              >
                <div className="w-7 h-7 rounded-lg bg-[#EA580C] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-[#EA580C] uppercase">
                      Incident: {inc.hazardType}
                    </span>
                    <span className="text-[9.5px] font-mono text-[#355344] dark:text-emerald-400">
                      {inc.reportedAt}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[#0F291E] dark:text-gray-100 truncate mt-0.5">
                    {inc.villageName}
                  </div>
                  <div className="text-[10.5px] text-[#355344] dark:text-gray-300 line-clamp-1 mt-0.5">
                    {inc.description}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('/incidents');
                      onClose();
                    }}
                    className="mt-1.5 text-[10.5px] font-bold text-[#EA580C] hover:underline"
                  >
                    Triage Incident ({inc.status}) →
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-[#F4F9F5] dark:bg-[#061A12] border-t border-[#D1E7DD] dark:border-[#1E543A] flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => {
            navigate('/alerts');
            onClose();
          }}
          className="text-[#059669] font-bold hover:underline flex items-center gap-1"
        >
          <span>View All Official Alerts</span>
          <ExternalLink className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => {
            navigate('/incidents');
            onClose();
          }}
          className="text-[#355344] dark:text-emerald-300 font-semibold hover:underline"
        >
          Incident Desk
        </button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
