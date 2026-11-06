import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  Info,
  RotateCcw,
  Satellite,
  Sliders,
  Scale,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  buildVillageExplainPayload,
  classifyHazard,
  weightedScore,
} from '../utils/scoring';
import { NivaranMap } from '../components/NivaranMap';
import { RiskBadge } from '../components/RiskBadge';
import { TermTooltip } from '../components/TermTooltip';
import { ClimateHorizon, HazardWeights, Village } from '../types';

export const HazardMapPage: React.FC = () => {
  const { openVillageDrawer } = useOutletContext<{
    openVillageDrawer: (v: Village) => void;
  }>();

  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const reports = useAppStore((s) => s.reports);
  const weights = useAppStore((s) => s.weights);
  const setWeights = useAppStore((s) => s.setWeights);
  const resetWeights = useAppStore((s) => s.resetWeights);
  const climateHorizon = useAppStore((s) => s.climateHorizon);
  const setClimateHorizon = useAppStore((s) => s.setClimateHorizon);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const openExplainModal = useAppStore((s) => s.openExplainModal);

  // Satellite Change-Detection Before/After Slider state (0..100%)
  const [satSliderPos, setSatSliderPos] = useState(55);

  // Auto-balance weights so they always sum to 1.00 (100%)
  const handleWeightChange = (key: keyof HazardWeights, newPct: number) => {
    const clampedPct = Math.max(5, Math.min(85, newPct));
    const targetVal = Number((clampedPct / 100).toFixed(2));
    const otherKeys = (Object.keys(weights) as (keyof HazardWeights)[]).filter(
      (k) => k !== key
    );
    const currentOthersSum = otherKeys.reduce((acc, k) => acc + weights[k], 0);
    const remaining = Math.max(0, Number((1 - targetVal).toFixed(2)));

    const nextWeights: HazardWeights = { ...weights, [key]: targetVal };
    if (currentOthersSum > 0) {
      let runningSum = targetVal;
      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          nextWeights[k] = Number(Math.max(0, 1 - runningSum).toFixed(2));
        } else {
          const share = Number(
            ((weights[k] / currentOthersSum) * remaining).toFixed(2)
          );
          nextWeights[k] = share;
          runningSum += share;
        }
      });
    }
    setWeights(nextWeights);
  };

  // Worked example village (Kondhavale v-06 has factors 0.9, 0.7, 0.4, 0.6)
  const kondhavale = villages.find((v) => v.id === 'v-06') || villages[0];
  const kondhavaleScore = weightedScore(
    kondhavale.hazardFactors,
    weights,
    kondhavale.verifiedReportsCount,
    climateHorizon,
    extraRainfallMm
  );

  const counts = villages.reduce(
    (acc, v) => {
      const s = weightedScore(
        v.hazardFactors,
        weights,
        v.verifiedReportsCount,
        climateHorizon,
        extraRainfallMm
      );
      const lvl = classifyHazard(s);
      acc[lvl] = (acc[lvl] || 0) + 1;
      return acc;
    },
    { Immediate: 0, 'Short-term': 0, 'Medium-term': 0, Safe: 0 } as Record<
      string,
      number
    >
  );

  return (
    <div className="space-y-6">
      {/* Header & Worked Formula Banner */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
              Live Multi-Hazard Red Zone Mapping & Weight Calibration
            </h1>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
              Normalized [0â€“1] linear combination with instant choropleth re-coloring and{' '}
              <TermTooltip
                term="Worked Benchmark Formula"
                explanation="Hazard = 0.35Ã—Rainfall + 0.30Ã—Slope + 0.20Ã—PastDisasterHistory + 0.15Ã—RiverProximity. Cutoffs: >0.75 Immediate (Red), 0.5â€“0.75 Short-term (Orange), 0.3â€“0.5 Medium-term (Watch), <0.3 Safe (Green)."
                example="0.9, 0.7, 0.4, 0.6 â†’ 0.315 + 0.21 + 0.08 + 0.09 = 0.695 â†’ Short-term"
              />
            </p>
          </div>

          {/* Live Cutoff Counters */}
          <div className="flex flex-wrap items-center gap-2 text-xs tabular-nums">
            <span className="px-3 py-1.5 rounded-xl bg-[#DC2626]/12 text-[#DC2626] font-bold border border-[#DC2626]/30">
              Red (&gt;0.75): {counts.Immediate}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#F97316]/12 text-[#C2410C] dark:text-orange-300 font-bold border border-[#F97316]/30">
              Short-Term (0.5â€“0.75): {counts['Short-term']}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#EAB308]/15 text-[#854D0E] dark:text-yellow-300 font-bold border border-[#EAB308]/30">
              Medium-Term (0.3â€“0.5): {counts['Medium-term']}
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-[#16A34A]/12 text-[#15803D] dark:text-green-300 font-bold border border-[#16A34A]/30">
              Safe (&lt;0.3): {counts.Safe}
            </span>
          </div>
        </div>

        {/* Formula Worked Example Strip */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0E9F8E] shrink-0" />
            <span className="font-mono text-[11px] sm:text-xs text-[#0F172A] dark:text-slate-200">
              <strong>Formula:</strong> Hazard = {(weights.rainfall * 100).toFixed(0)}%Ã—Rain +{' '}
              {(weights.slope * 100).toFixed(0)}%Ã—Slope + {(weights.history * 100).toFixed(0)}
              %Ã—History + {(weights.riverProximity * 100).toFixed(0)}%Ã—River
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
              Worked Ex (<strong>Kondhavale</strong>: 0.9, 0.7, 0.4, 0.6) â†’{' '}
              <strong>{kondhavaleScore.toFixed(3)}</strong>
            </span>
            <RiskBadge level={classifyHazard(kondhavaleScore)} size="sm" />
          </div>
        </div>
      </div>

      {/* Main Grid: Map (8 cols) + Weight Sliders & Climate Projection Panel (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8 space-y-6">
          <NivaranMap
            villages={villages}
            sites={sites}
            reports={reports}
            weights={weights}
            climateHorizon={climateHorizon}
            extraRainfallMm={extraRainfallMm}
            onSelectVillage={openVillageDrawer}
            heightClass="h-[520px]"
          />

          {/* Satellite Change-Detection Demo Card (Requirement K) */}
          <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Satellite className="w-5 h-5 text-[#0E9F8E]" />
                <div>
                  <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                    Satellite Change-Detection Demo â€” Irshalwadi Escarpment
                  </h2>
                  <p className="text-xs text-slate-500">
                    Drag slider to compare Pre-Monsoon Baseline vs Latest Cartosat-3 Pass
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DC2626]/15 text-[#DC2626] border border-[#DC2626]/30 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                New construction detected inside Red Zone
              </span>
            </div>

            {/* Interactive Before/After Visual Slider */}
            <div className="relative h-56 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 select-none bg-[#0B1F33]">
              {/* AFTER Layer (Full width underneath): 2026 Cartosat-3 with Red Zone encroachment */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-stone-900 p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded bg-black/60 text-white text-[11px] font-mono">
                    OCT 2026 â€¢ Cartosat-3 Ortho (0.25m)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#DC2626] text-white text-[11px] font-bold animate-pulse">
                    ALERT: 3 Unauthorized Roofs + 18m Scarp Crack Inside Red Polygon
                  </span>
                </div>

                {/* Simulated GIS vector overlay for AFTER */}
                <svg className="w-full h-32" viewBox="0 0 600 130">
                  <polygon
                    points="80,15 520,10 560,115 50,120"
                    fill="rgba(220,38,38,0.28)"
                    stroke="#DC2626"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                  {/* Scarp fracture line */}
                  <path
                    d="M 140 35 Q 290 15 440 42"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                    fill="none"
                  />
                  {/* Existing huts */}
                  <rect x="190" y="65" width="22" height="16" fill="#94A3B8" />
                  <rect x="230" y="70" width="24" height="16" fill="#94A3B8" />
                  {/* Newly detected illegal constructions in red/yellow */}
                  <rect
                    x="310"
                    y="52"
                    width="28"
                    height="20"
                    fill="#FACC15"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="355"
                    y="58"
                    width="26"
                    height="18"
                    fill="#FACC15"
                    stroke="#DC2626"
                    strokeWidth="2.5"
                  />
                  <text x="305" y="45" fill="#FDE047" fontSize="11" fontWeight="bold">
                    NEW TIN-ROOF ENCROACHMENT (18.9268Â°N)
                  </text>
                </svg>
              </div>

              {/* BEFORE Layer (Clipped by satSliderPos): 2023 Baseline */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 border-r-2 border-white"
                style={{ width: `${satSliderPos}%` }}
              >
                <div className="p-5 w-[700px] h-full flex flex-col justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded bg-black/60 text-teal-200 text-[11px] font-mono">
                      MAY 2023 â€¢ Baseline Ortho-Imagery (Pre-Encroachment)
                    </span>
                  </div>
                  <svg className="w-[600px] h-32" viewBox="0 0 600 130">
                    <polygon
                      points="80,15 520,10 560,115 50,120"
                      fill="rgba(14,159,142,0.18)"
                      stroke="#0E9F8E"
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <rect x="190" y="65" width="22" height="16" fill="#94A3B8" />
                    <rect x="230" y="70" width="24" height="16" fill="#94A3B8" />
                    <text x="185" y="55" fill="#A7F3D0" fontSize="11" fontWeight="bold">
                      2023 BASELINE VEGETATION BUFFER INTACT
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-slate-500">2023 Baseline</span>
              <input
                type="range"
                min={5}
                max={95}
                value={satSliderPos}
                onChange={(e) => setSatSliderPos(Number(e.target.value))}
                className="flex-1 accent-[#0E9F8E] cursor-pointer"
                aria-label="Satellite before and after comparison slider"
              />
              <span className="font-semibold text-[#DC2626]">2026 Change Detected</span>
            </div>
          </div>
        </div>

        {/* Right Column: Weight Sliders + Climate Projection + Live Village Score Table */}
        <div className="xl:col-span-4 space-y-5">
          {/* Editable Weights Panel (Sums to 100%) */}
          <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#0E9F8E]" />
                <h2 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
                  Expert Hazard Weights (Sum = 100%)
                </h2>
              </div>
              <button
                onClick={resetWeights}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0A1624] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#0E9F8E]"
              >
                <RotateCcw className="w-3 h-3" /> Reset (35/30/20/15)
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {(
                [
                  {
                    key: 'rainfall',
                    label: 'Rainfall Intensity Weight',
                    color: 'accent-[#0E9F8E]',
                  },
                  {
                    key: 'slope',
                    label: 'Terrain Slope Gradient Weight',
                    color: 'accent-[#F97316]',
                  },
                  {
                    key: 'history',
                    label: 'Past Disaster History Weight',
                    color: 'accent-[#DC2626]',
                  },
                  {
                    key: 'riverProximity',
                    label: 'River / Scarp Proximity Weight',
                    color: 'accent-[#4F46E5]',
                  },
                ] as const
              ).map((item) => {
                const pct = Math.round(weights[item.key] * 100);
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span>{item.label}</span>
                      <span className="tabular-nums font-bold text-[#0E9F8E]">
                        {pct}% ({weights[item.key].toFixed(2)})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={80}
                      value={pct}
                      onChange={(e) =>
                        handleWeightChange(item.key, Number(e.target.value))
                      }
                      className={`w-full cursor-pointer ${item.color}`}
                      aria-label={item.label}
                    />
                  </div>
                );
              })}
            </div>

            <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-[11px] text-teal-900 dark:text-teal-200 flex items-center justify-between font-semibold">
              <span>Total Normalized Weight Check:</span>
              <span className="font-mono font-bold">
                {Math.round(
                  (weights.rainfall +
                    weights.slope +
                    weights.history +
                    weights.riverProximity) *
                    100
                )}
                %
              </span>
            </div>
          </div>

          {/* Climate Projection Slider (Today / +10 yrs / +20 yrs) */}
          <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#4F46E5]" />
              <h2 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
                IPCC Monsoon Climate Projection Horizon
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Scales extreme Western Ghats rainfall factor to visualize future Red-Zone
              expansion.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {(
                [
                  { id: 'today', label: 'Today (2026)', sub: '1.00Ã— Rain' },
                  { id: 'plus10', label: '+10 Years', sub: '1.11Ã— Rain' },
                  { id: 'plus20', label: '+20 Years', sub: '1.22Ã— Rain' },
                ] as { id: ClimateHorizon; label: string; sub: string }[]
              ).map((h) => (
                <button
                  key={h.id}
                  onClick={() => setClimateHorizon(h.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    climateHorizon === h.id
                      ? 'bg-[#0B1F33] text-white border-[#0E9F8E] ring-2 ring-[#0E9F8E]/30'
                      : 'bg-slate-50 dark:bg-[#0A1624] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{h.label}</div>
                  <div className="text-[10px] opacity-80">{h.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Live Recolored Village Score Table */}
          <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-4">
            <h2 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white mb-3">
              Live Settlement Hazard Scores ({villages.length})
            </h2>
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {villages.map((v) => {
                const score = weightedScore(
                  v.hazardFactors,
                  weights,
                  v.verifiedReportsCount,
                  climateHorizon,
                  extraRainfallMm
                );
                const level = classifyHazard(score);
                return (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <button
                      onClick={() => openVillageDrawer(v)}
                      className="text-left hover:text-[#0E9F8E]"
                    >
                      <div className="font-bold">{v.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {v.district} â€¢ R:{v.hazardFactors.rainfall} S:{v.hazardFactors.slope}{' '}
                        H:{v.hazardFactors.history} Rv:{v.hazardFactors.riverProximity}
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5">
                      <RiskBadge level={level} score={score} size="sm" showLabel={false} />
                      <button
                        onClick={() =>
                          openExplainModal(
                            buildVillageExplainPayload(
                              v,
                              weights,
                              undefined,
                              climateHorizon,
                              extraRainfallMm
                            )
                          )
                        }
                        className="p-1.5 rounded-lg bg-[#0E9F8E]/10 text-[#0E9F8E] hover:bg-[#0E9F8E] hover:text-white"
                        title="Explain Score"
                      >
                        <Scale className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

