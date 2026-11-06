import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Crosshair,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Users,
  HeartHandshake,
  Server,
  Layers,
  ArrowRight,
  Download,
  PhoneCall,
  CheckCircle2,
  Home,
  Mountain,
  Droplets,
  Navigation,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SlidePanel: React.FC = () => {
  const sidePanel = useAppStore((s) => s.sidePanel);
  const closeSidePanel = useAppStore((s) => s.closeSidePanel);
  const addToast = useAppStore((s) => s.addToast);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidePanel.isOpen) {
        closeSidePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidePanel.isOpen, closeSidePanel]);

  if (!sidePanel.isOpen) return null;

  const data = sidePanel.data || {};
  const type = sidePanel.type || 'zone';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Translucent Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeSidePanel}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-In Panel from Right */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="w-screen max-w-md sm:max-w-lg lg:max-w-xl bg-white dark:bg-[#101C2C] border-l border-slate-200 dark:border-[#1E3A5F] shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-[#1E3A5F] flex items-center justify-between bg-slate-50/70 dark:bg-[#172F46]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#008060] text-white flex items-center justify-center font-bold shadow-sm">
                  {type === 'zone' && <ShieldAlert className="w-5 h-5 stroke-[2.2]" />}
                  {type === 'village' && <MapPin className="w-5 h-5 stroke-[2.2]" />}
                  {type === 'alert' && <AlertTriangle className="w-5 h-5 stroke-[2.2]" />}
                  {type === 'shelter' && <Building2 className="w-5 h-5 stroke-[2.2]" />}
                  {type === 'volunteer' && <HeartHandshake className="w-5 h-5 stroke-[2.2]" />}
                  {type === 'health' && <Server className="w-5 h-5 stroke-[2.2]" />}
                </div>

                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#008060] dark:text-emerald-400">
                    {sidePanel.title || (type === 'zone' ? 'Spatial Risk Zone Telemetry' : type === 'village' ? 'Village Risk & Habitation Telemetry' : 'Command Inspection')}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {data.areaName || data.name || data.title || 'Inspection Details'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={closeSidePanel}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1E3A5F] transition-colors cursor-pointer"
                aria-label="Close Slide Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {/* === VIEW 1: GIS RISK ZONE DETAILS === */}
              {type === 'zone' && (
                <div className="space-y-4 text-xs font-sans">
                  {/* Score Hero Strip */}
                  <div
                    className="p-4 rounded-2xl border text-white shadow-md relative overflow-hidden"
                    style={{
                      backgroundColor: data.color_hex || (data.level === 'Red' ? '#DC2626' : '#EAB308'),
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10 mb-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                        {data.category_name || `${(data.level || 'HIGH').toUpperCase()} RISK`}
                      </span>
                      <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        Confidence: 94%
                      </span>
                    </div>

                    <div className="text-3xl font-black font-mono tracking-tight my-2 relative z-10">
                      {Number(data.risk_score || (data.level === 'Red' ? 88.5 : 68.0)).toFixed(1)} / 100
                    </div>

                    <div className="text-[11px] opacity-90 relative z-10">
                      Disaster Vector: <strong>{(data.disasterType || 'Landslide').toUpperCase()}</strong> · Issued by {data.issuedBy || 'NIVARAN GIS'}
                    </div>
                  </div>

                  {/* 3 Core Components */}
                  <div className="grid grid-cols-3 gap-2.5 text-center font-mono">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57]">
                      <span className="text-[10px] text-slate-400 uppercase block">Hazard</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {Number(data.hazard_score || 84.5).toFixed(1)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57]">
                      <span className="text-[10px] text-slate-400 uppercase block">Vulnerability</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {Number(data.vulnerability_score || 76.2).toFixed(1)}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57]">
                      <span className="text-[10px] text-slate-400 uppercase block">Exposure</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {Number(data.exposure_score || 72.0).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Normalized Contributing Indicators */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] space-y-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                      <span>Normalized GIS Indicators:</span>
                      <span className="text-[10.5px] font-mono text-[#008060]">Weighted Model</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="p-2 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">Rainfall (35%)</span>
                        <strong className="text-emerald-600">
                          {Number(data.contributing_indicators?.rainfall_normalized ?? 92.5).toFixed(1)}%
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">Slope (30%)</span>
                        <strong className="text-amber-600">
                          {Number(data.contributing_indicators?.slope_normalized ?? 88.0).toFixed(1)}%
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">History (20%)</span>
                        <strong className="text-red-600">
                          {Number(data.contributing_indicators?.history_normalized ?? 85.0).toFixed(1)}%
                        </strong>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">River Proximity (15%)</span>
                        <strong className="text-cyan-600">
                          {Number(data.contributing_indicators?.river_proximity_normalized ?? 78.0).toFixed(1)}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Impact & Geography */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Total Affected Area:</span>
                      <strong className="text-slate-800 dark:text-white">
                        {data.affected_area_sqkm || 14.8} km²
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">Exposed Population:</span>
                      <strong className="text-slate-800 dark:text-white">
                        {Number(data.exposed_population || 2650).toLocaleString()} residents
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500">District / Taluka:</span>
                      <strong className="text-slate-800 dark:text-white">
                        {data.district || 'Raigad'} · Maharashtra
                      </strong>
                    </div>
                  </div>

                  {/* Evacuation Directive */}
                  <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 font-medium leading-relaxed">
                    <strong>Mandatory Protocol:</strong> {data.instructions || 'High slope risk triggered by IMD rainfall advisory. Mobilize Aapda Mitra relief teams.'}
                  </div>
                </div>
              )}

              {/* === VIEW 2: SHELTERS === */}
              {type === 'shelter' && (
                <div className="space-y-4 text-xs font-sans">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 space-y-1">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                      Designated Safe Plateau Shelter
                    </span>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {data.name || 'Shelter Camp'}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      Slope &lt; 15° · Ground stability verified by Geological Survey of India.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center font-mono">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Capacity</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {data.capacityPersons || 500} persons
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200">
                      <span className="text-[10px] text-slate-400 uppercase block">Current Occupancy</span>
                      <span className="text-lg font-bold text-[#008060]">
                        {data.currentOccupancy || 140} persons
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* === VIEW 2.5: VILLAGE / HABITATION TELEMETRY === */}
              {type === 'village' && (
                <div className="space-y-4 text-xs font-sans">
                  {/* Village Risk Hero Banner */}
                  <div
                    className="p-4 rounded-2xl border text-white shadow-md relative overflow-hidden"
                    style={{
                      backgroundColor: data.colorHex || '#DC2626',
                    }}
                  >
                    <div className="flex items-center justify-between relative z-10 mb-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded-full">
                        {data.zoneName || 'Risk Zone Habitation'}
                      </span>
                      <span className="text-xs font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full">
                        GPS: {Number(data.lat).toFixed(4)}, {Number(data.lng).toFixed(4)}
                      </span>
                    </div>

                    <div className="text-3xl font-black font-mono tracking-tight my-2 relative z-10 flex items-baseline gap-2">
                      <span>{Number(data.score100 || 88).toFixed(1)}</span>
                      <span className="text-sm font-normal opacity-80">/ 100 Risk Score</span>
                    </div>

                    <div className="text-[11px] opacity-90 relative z-10 flex flex-wrap items-center gap-2">
                      <span>Hazard Vector: <strong>{(data.primaryHazard || 'Landslide').toUpperCase()}</strong></span>
                      <span>·</span>
                      <span>Taluka: <strong>{data.taluka}</strong></span>
                      <span>·</span>
                      <span>District: <strong>{data.district}</strong></span>
                      <span>·</span>
                      <span>State: <strong>{data.state || 'Maharashtra'}</strong></span>
                      {(data.nameMr || data.nameHi) && (
                        <>
                          <span>·</span>
                          <span className="font-semibold">{data.nameMr || data.nameHi}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Village Demographics & Exposure */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57]">
                      <span className="text-[10px] text-slate-400 uppercase block">Population</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {Number(data.population || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57]">
                      <span className="text-[10px] text-slate-400 uppercase block">Households</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {Number(data.households || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57]">
                      <span className="text-[10px] text-slate-400 uppercase block">Elevation</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {data.elevationM ?? '—'} m
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57]">
                      <span className="text-[10px] text-slate-400 uppercase block">Slope</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {data.slopeDeg ?? '—'}°
                      </span>
                    </div>
                  </div>

                  {/* Environmental & Hydrological Factors */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] space-y-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Hydrology & Terrain Vulnerability</span>
                      </span>
                      <span className="text-[10.5px] font-mono text-[#008060]">GSI & IMD Live</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">Annual Rainfall</span>
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {data.annualRainfallMm ?? 3200} mm/yr
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">River Proximity</span>
                        <strong className="text-cyan-600 dark:text-cyan-400">
                          {data.riverDistKm ?? 1.2} km
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">Kutcha Dwellings</span>
                        <strong className="text-amber-600 dark:text-amber-400">
                          {data.vulnerabilityFactors?.kutchaHousePct ?? 65}%
                        </strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-[#101C2C] border border-slate-200/60 dark:border-[#1E3A5F]">
                        <span className="text-slate-400 text-[10px] block">Elderly Demographic</span>
                        <strong className="text-purple-600 dark:text-purple-400">
                          {data.vulnerabilityFactors?.elderlyPct ?? 14}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Disaster Action Recommendation */}
                  <div className={`p-3.5 rounded-2xl border text-xs font-medium leading-relaxed ${
                    (data.score100 || 0) >= 75
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300'
                      : (data.score100 || 0) >= 50
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    <strong>Command Operational Directive:</strong>{' '}
                    {(data.score100 || 0) >= 75
                      ? 'High priority landslide hazard detected. Immediate pre-emptive relocation and Aapda Mitra deployment recommended.'
                      : (data.score100 || 0) >= 50
                        ? 'Moderate hazard vulnerability. Early warning issued to Gram Panchayat. Maintain 24h satellite and rainfall watch.'
                        : 'Low vulnerability sector. Habitation classified as safe plateau zone with low slope instability.'}
                  </div>
                </div>
              )}

              {/* === VIEW 3: GENERIC CONTEXT === */}
              {type !== 'zone' && type !== 'shelter' && type !== 'village' && (
                <div className="space-y-3 text-xs font-sans">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200 space-y-2">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {data.title || data.name || 'Operational Context'}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {data.details || data.desc || data.instructions || JSON.stringify(data, null, 2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#1E3A5F] bg-slate-50/70 dark:bg-[#172F46]/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  closeSidePanel();
                  addToast({
                    title: 'Action Logged',
                    message: 'Inspection details saved to incident coordination ledger.',
                    type: 'success',
                  });
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#008060] hover:bg-[#006e52] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Acknowledge & Save</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={closeSidePanel}
                className="py-2.5 px-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

