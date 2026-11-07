import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowRight,
  Building2,
  Compass,
  FileWarning,
  Home,
  Mountain,
  Sliders,
  Scale,
  Users,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Village } from '../types';
import { useAppStore } from '../store/useAppStore';
import {
  buildVillageExplainPayload,
  calculateVulnerabilityScore,
  classifyHazard,
  classifyQuadrant,
  weightedScore,
} from '../utils/scoring';
import { RiskBadge } from './RiskBadge';

interface VillageDetailDrawerProps {
  village: Village | null;
  onClose: () => void;
}

export const VillageDetailDrawer: React.FC<VillageDetailDrawerProps> = ({
  village,
  onClose,
}) => {
  const navigate = useNavigate();
  const weights = useAppStore((s) => s.weights);
  const climateHorizon = useAppStore((s) => s.climateHorizon);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const openExplainModal = useAppStore((s) => s.openExplainModal);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);

  if (!village) return null;

  const hScore = weightedScore(
    village.hazardFactors,
    weights,
    village.verifiedReportsCount,
    climateHorizon,
    extraRainfallMm
  );
  const vScore = calculateVulnerabilityScore(village.vulnerabilityFactors);
  const pScore = Number((hScore * vScore).toFixed(3));
  const riskLevel = classifyHazard(hScore);
  const quadrant = classifyQuadrant(hScore, vScore);

  const radarData = [
    {
      metric: 'Elderly %',
      value: Math.min(100, village.vulnerabilityFactors.elderlyPct * 2),
      raw: `${village.vulnerabilityFactors.elderlyPct}%`,
    },
    {
      metric: 'BPL %',
      value: village.vulnerabilityFactors.bplPct,
      raw: `${village.vulnerabilityFactors.bplPct}%`,
    },
    {
      metric: 'Disabled %',
      value: Math.min(100, village.vulnerabilityFactors.disabledPct * 6),
      raw: `${village.vulnerabilityFactors.disabledPct}%`,
    },
    {
      metric: 'Hospital Dist',
      value: Math.min(100, village.vulnerabilityFactors.healthcareDistKm * 3.5),
      raw: `${village.vulnerabilityFactors.healthcareDistKm} km`,
    },
    {
      metric: 'Kutcha Houses',
      value: village.vulnerabilityFactors.kutchaHousePct,
      raw: `${village.vulnerabilityFactors.kutchaHousePct}%`,
    },
  ];

  return (
    <div
      className="fixed inset-y-0 right-0 z-[850] w-full max-w-md bg-white dark:bg-[#11253A] shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200"
      role="dialog"
      aria-label={`Details for ${village.name}`}
    >
      {/* Header */}
      <div className="bg-[#0B1F33] text-white p-5 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#0E9F8E] font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>
              {village.taluka} Taluka â€¢ {village.district} District
            </span>
          </div>
          <h3 className="font-heading text-xl font-bold mt-0.5">
            {village.name}
          </h3>
          <div className="text-[11px] text-slate-300 font-mono mt-1">
            GPS: {village.lat.toFixed(4)}Â°N, {village.lng.toFixed(4)}Â°E â€¢ Elev:{' '}
            {village.elevationM}m
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close village drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Risk status banner */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800">
          <div>
            <div className="text-[11px] text-slate-500">Current Risk Classification</div>
            <div className="mt-1">
              <RiskBadge level={riskLevel} score={hScore} size="md" />
            </div>
          </div>
          <button
            onClick={() =>
              openExplainModal(
                buildVillageExplainPayload(
                  village,
                  weights,
                  undefined,
                  climateHorizon,
                  extraRainfallMm
                )
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white text-xs font-semibold shadow-xs min-h-[40px]"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Explain</span>
          </button>
        </div>

        {/* Satellite alert if applicable */}
        {village.satelliteChangeDetected && (
          <div className="p-3.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/30 text-xs text-[#DC2626] dark:text-red-300 flex items-start gap-2.5">
            <FileWarning className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">
                Satellite Change-Detection Flag (Cartosat-3):
              </span>
              <span>{village.satelliteNote}</span>
            </div>
          </div>
        )}

        {/* Key metrics grid */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800">
            <Users className="w-4 h-4 text-[#0E9F8E] mx-auto mb-1" />
            <div className="font-heading text-base font-bold tabular-nums">
              {village.population}
            </div>
            <div className="text-[11px] text-slate-500">Population</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800">
            <Home className="w-4 h-4 text-[#4F46E5] mx-auto mb-1" />
            <div className="font-heading text-base font-bold tabular-nums">
              {village.households}
            </div>
            <div className="text-[11px] text-slate-500">Households</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800">
            <Mountain className="w-4 h-4 text-[#F97316] mx-auto mb-1" />
            <div className="font-heading text-base font-bold tabular-nums">
              {village.slopeDeg}Â°
            </div>
            <div className="text-[11px] text-slate-500">Slope Angle</div>
          </div>
        </div>

        {/* Scores Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Composite Priority (Hazard Ã— Vulnerability)
            </span>
            <span className="font-bold text-sm text-[#4F46E5] tabular-nums">
              {pScore.toFixed(3)} ({quadrant})
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">
                  Rainfall ({village.annualRainfallMm} mm/yr)
                </span>
                <span className="font-semibold tabular-nums">
                  {village.hazardFactors.rainfall.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-[#0E9F8E]"
                  style={{ width: `${village.hazardFactors.rainfall * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Slope Gradient ({village.slopeDeg}Â°)</span>
                <span className="font-semibold tabular-nums">
                  {village.hazardFactors.slope.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-[#F97316]"
                  style={{ width: `${village.hazardFactors.slope * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">
                  Disaster History ({village.pastIncidentsCount} events +{' '}
                  {village.verifiedReportsCount} reports)
                </span>
                <span className="font-semibold tabular-nums">
                  {village.hazardFactors.history.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-[#DC2626]"
                  style={{ width: `${village.hazardFactors.history * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">
                  River/Scarp Proximity ({village.riverDistKm} km)
                </span>
                <span className="font-semibold tabular-nums">
                  {village.hazardFactors.riverProximity.toFixed(2)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-[#4F46E5]"
                  style={{ width: `${village.hazardFactors.riverProximity * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vulnerability Radar Chart */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#0F172A] dark:text-white">
              Socio-Economic Vulnerability Profile
            </span>
            <span className="text-xs font-bold text-[#F97316] tabular-nums">
              Score: {vScore.toFixed(3)}
            </span>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#94a3b8" strokeOpacity={0.3} />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Radar
                  name={village.name}
                  dataKey="value"
                  stroke="#0E9F8E"
                  fill="#0E9F8E"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {village.lastIncidentSummary}
          </p>
        </div>
      </div>

      {/* 3 AI Climate Intelligence Module Shortcuts */}
      <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A1624]/60">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
          <span>AI Climate Intelligence</span>
          <span className="text-[9px] px-1 rounded bg-[#008060]/10 text-[#008060] font-bold">LIVE ML</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => {
              setSelectedVillageId(village.id);
              onClose();
              navigate(`/climate-vulnerability?villageId=${village.id}`);
            }}
            className="py-1.5 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold text-center hover:bg-emerald-100 transition-colors truncate"
            title="Village Climate Vulnerability Score"
          >
            Vulnerability
          </button>
          <button
            onClick={() => {
              setSelectedVillageId(village.id);
              onClose();
              navigate(`/climate-impact-prediction?villageId=${village.id}`);
            }}
            className="py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px] font-semibold text-center hover:bg-blue-100 transition-colors truncate"
            title="AI Climate Impact Prediction"
          >
            Impact
          </button>
          <button
            onClick={() => {
              setSelectedVillageId(village.id);
              onClose();
              navigate(`/climate-anomaly-detection?villageId=${village.id}`);
            }}
            className="py-1.5 px-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 text-[11px] font-semibold text-center hover:bg-purple-100 transition-colors truncate"
            title="AI Climate Anomaly Detection"
          >
            Anomalies
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0A1624] grid grid-cols-2 gap-2.5">
        <button
          onClick={() => {
            setSelectedVillageId(village.id);
            onClose();
            navigate('/simulator');
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#11253A] text-xs font-semibold text-[#0F172A] dark:text-white hover:border-[#0E9F8E] min-h-[44px]"
        >
          <Sliders className="w-3.5 h-3.5 text-[#0E9F8E]" />
          <span>What-If Simulator</span>
        </button>
        <button
          onClick={() => {
            setSelectedVillageId(village.id);
            onClose();
            navigate('/priority-ranking');
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-[#11253A] text-white text-xs font-semibold min-h-[44px]"
        >
          <Building2 className="w-3.5 h-3.5 text-[#0E9F8E]" />
          <span>Relocation Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

