import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  AlertTriangle,
  Compass,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  ShieldCheck,
  Clock,
  X,
  RefreshCw,
  Navigation,
  Sparkles,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Village } from '../types';
import {
  DayDisasterForecast,
  VillageAiDisasterPrediction,
  getVillageAiForecast,
  fetchVillageLiveAiForecast,
} from '../services/aiDisasterPredictor';

interface Props {
  village: Village | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToShelter?: (village: Village) => void;
}

export const VillageAiDisasterForecastModal: React.FC<Props> = ({
  village,
  isOpen,
  onClose,
  onNavigateToShelter,
}) => {
  const [prediction, setPrediction] = useState<VillageAiDisasterPrediction | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!village) {
      setPrediction(null);
      return;
    }
    const pred = getVillageAiForecast(village);
    setPrediction(pred);
    setSelectedDayIndex(0);
  }, [village]);

  if (!isOpen || !village || !prediction) return null;

  const selectedDay: DayDisasterForecast = prediction.days[selectedDayIndex] || prediction.days[0];

  const handleRefreshLive = async () => {
    setIsRefreshing(true);
    try {
      const updated = await fetchVillageLiveAiForecast(village);
      setPrediction(updated);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getRiskBadgeColor = (level: 'Red' | 'Orange' | 'Yellow' | 'Green') => {
    switch (level) {
      case 'Red':
        return 'bg-red-600 text-white border-red-500';
      case 'Orange':
        return 'bg-amber-500 text-white border-amber-400';
      case 'Yellow':
        return 'bg-yellow-400 text-slate-900 border-yellow-300';
      case 'Green':
      default:
        return 'bg-emerald-600 text-white border-emerald-500';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div className="neu-raised bg-[var(--surface)] text-[var(--text-primary)] w-full max-w-4xl max-h-[92vh] rounded-2xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  AI 7-Day Weather & Disaster Forecast
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 font-bold uppercase">
                  Predictor Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {village.name} · {village.taluka} Taluka, {village.district} District ({village.state || 'Maharashtra'})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshLive}
              disabled={isRefreshing}
              className="neu-btn px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Sync latest satellite & weather models"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Sync Live</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Executive AI Prediction Banner */}
          <div className="neu-flat p-4 rounded-xl border border-[var(--border)] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-800/40">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${getRiskBadgeColor(
                    selectedDay.hazardLevel
                  )}`}
                >
                  {prediction.overallDisasterChancePct}% Disaster Probability
                </span>
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  Primary Threat: <strong className="text-emerald-700 dark:text-emerald-400">{prediction.primaryThreat}</strong>
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-3">
                <span>Peak Risk: <strong>{prediction.peakRiskDay}</strong></span>
                <span>Evacuation Lead: <strong>{prediction.recommendedEvacuationLeadHours}h</strong></span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
              {prediction.aiSummaryAdvisory}
            </p>
          </div>

          {/* Key Village Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="neu-raised p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">Elevation & Slope</div>
              <div className="font-mono font-bold text-sm mt-0.5 text-[var(--text-primary)]">
                {village.elevationM} m · {village.slopeDeg}°
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Topographic Scarp Grade</div>
            </div>
            <div className="neu-raised p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">Annual Rainfall</div>
              <div className="font-mono font-bold text-sm mt-0.5 text-[#16A078]">
                {village.annualRainfallMm} mm/yr
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Monsoon Precipitation Mean</div>
            </div>
            <div className="neu-raised p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">7-Day Cumulative</div>
              <div className="font-mono font-bold text-sm mt-0.5 text-blue-600 dark:text-blue-400">
                {prediction.cumulativeRainfallMm} mm
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Max 24h: {prediction.max7DayRainfallMm} mm</div>
            </div>
            <div className="neu-raised p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">Habitation Density</div>
              <div className="font-mono font-bold text-sm mt-0.5 text-amber-600 dark:text-amber-400">
                {village.population} pop ({village.households} HH)
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">River Dist: {village.riverDistKm} km</div>
            </div>
          </div>

          {/* 7-Day Daily Forecast Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                7-Day Daily Disaster Forecast Progression
              </h3>
              <span className="text-[11px] text-slate-400">Click any day to view detailed telemetry</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
              {prediction.days.map((day, idx) => {
                const isSelected = selectedDayIndex === idx;
                const badgeClass =
                  day.hazardLevel === 'Red'
                    ? 'border-red-500/80 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                    : day.hazardLevel === 'Orange'
                    ? 'border-amber-500/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                    : day.hazardLevel === 'Yellow'
                    ? 'border-yellow-400/80 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300'
                    : 'border-emerald-500/70 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300';

                return (
                  <button
                    key={day.dayIndex}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-[#16A078] shadow-md scale-[1.02] bg-white dark:bg-slate-800'
                        : 'neu-flat hover:scale-[1.01]'
                    } ${badgeClass}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{day.dayName}</span>
                        <span className="text-[10px] font-mono opacity-80">{day.dateStr}</span>
                      </div>
                      <div className="mt-2 text-center py-1">
                        <CloudRain className="w-5 h-5 mx-auto" />
                        <span className="font-mono font-bold text-xs block mt-1">
                          {day.rainfallMm} mm
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-current/20 flex items-center justify-between text-[10px]">
                      <span className="font-bold">{day.disasterChancePct}%</span>
                      <span className="uppercase font-mono text-[9px] font-bold">{day.hazardLevel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focused Day Detail View */}
          <div className="neu-flat p-4 rounded-xl border border-[var(--border)] bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
              <div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Detailed Parameters for {selectedDay.dayName} ({selectedDay.dateStr})
                </span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
                  Condition: {selectedDay.condition}
                </h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadgeColor(
                  selectedDay.hazardLevel
                )}`}
              >
                {selectedDay.hazardLevel} Level · {selectedDay.disasterChancePct}% Disaster Risk
              </span>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  <span>24h Rainfall</span>
                </div>
                <div className="font-mono font-bold text-base mt-1 text-[var(--text-primary)]">
                  {selectedDay.rainfallMm} mm
                </div>
                <div className="text-[10px] text-slate-400">IMD Alert Threshold: &gt;64.5mm</div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  <span>Temperature</span>
                </div>
                <div className="font-mono font-bold text-base mt-1 text-[var(--text-primary)]">
                  {selectedDay.tempMinC}°C / {selectedDay.tempMaxC}°C
                </div>
                <div className="text-[10px] text-slate-400">Relative Humidity: {selectedDay.humidityPct}%</div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Wind className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Wind Gusts</span>
                </div>
                <div className="font-mono font-bold text-base mt-1 text-[var(--text-primary)]">
                  {selectedDay.windGustKmh} km/h
                </div>
                <div className="text-[10px] text-slate-400">Directional Ghat Gale</div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border)]">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <Layers className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Soil Saturation</span>
                </div>
                <div className="font-mono font-bold text-base mt-1 text-[var(--text-primary)]">
                  {selectedDay.soilSaturationPct}%
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedDay.soilSaturationPct > 80
                        ? 'bg-red-500'
                        : selectedDay.soilSaturationPct > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedDay.soilSaturationPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Individual Hazard Probabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] uppercase font-bold text-slate-500">Landslide Probability</div>
                  <div className="font-mono font-bold text-sm text-red-600 dark:text-red-400">
                    {selectedDay.landslideRiskPct}%
                  </div>
                </div>
                <AlertTriangle className="w-5 h-5 text-red-500/60" />
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] uppercase font-bold text-slate-500">Flood Inundation Risk</div>
                  <div className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                    {selectedDay.floodRiskPct}%
                  </div>
                </div>
                <Droplets className="w-5 h-5 text-blue-500/60" />
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-[var(--border)] flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] uppercase font-bold text-slate-500">Cloudburst Alert</div>
                  <div className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                    {selectedDay.cloudburstRiskPct}% ({selectedDay.cloudburstRiskPct >= 50 ? 'Active' : 'Low'})
                  </div>
                </div>
                <CloudRain className="w-5 h-5 text-purple-500/60" />
              </div>
            </div>

            {/* AI Action Advisory Box */}
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/60 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  AI Operational Directive
                </span>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 mt-0.5 leading-relaxed font-medium">
                  {selectedDay.aiActionAdvisory}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[var(--border)] bg-slate-50 dark:bg-slate-900 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>Model: GSI / IMD Hydrological Neural Synthesis</span>
            <span>· Updated: {prediction.generatedAtIst}</span>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToShelter && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToShelter(village);
                  onClose();
                }}
                className="neu-btn px-4 py-2 rounded-xl text-xs font-bold bg-[#16A078] hover:bg-[#128865] text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>Compute Evacuation Route</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="neu-btn px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

