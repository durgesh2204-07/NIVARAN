import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  CloudRain,
  IndianRupee,
  ShieldCheck,
  Sliders,
  TrendingDown,
  Wrench,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  classifyHazard,
  simulateIntervention,
  weightedScore,
} from '../utils/scoring';
import { RiskBadge } from '../components/RiskBadge';
import { InterventionId } from '../types';

export const SimulatorPage: React.FC = () => {
  const villages = useAppStore((s) => s.villages);
  const interventions = useAppStore((s) => s.interventions);
  const weights = useAppStore((s) => s.weights);
  const climateHorizon = useAppStore((s) => s.climateHorizon);
  const selectedVillageId = useAppStore((s) => s.selectedVillageId);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const setExtraRainfallMm = useAppStore((s) => s.setExtraRainfallMm);
  const addToast = useAppStore((s) => s.addToast);

  // Default to Kondhavale (v-06, score 0.695) + check_dam (-> ~0.580) to showcase the worked example immediately!
  const activeVillageId = selectedVillageId || 'v-06';
  const activeVillage =
    villages.find((v) => v.id === activeVillageId) ||
    villages.find((v) => v.id === 'v-06') ||
    villages[0];

  const [selectedIntvIds, setSelectedIntvIds] = useState<InterventionId[]>([
    'check_dam',
  ]);

  const toggleIntervention = (id: InterventionId) => {
    setSelectedIntvIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleLoadIrshalwadiBenchmark = () => {
    setSelectedVillageId('v-01');
    setExtraRainfallMm(280);
    setSelectedIntvIds(['check_dam', 'retaining_wall']);
    addToast({
      title: '⚡ Irshalwadi (Raigad) 48h Pre-Disaster Benchmark Loaded',
      message: 'Simulated 380mm rainfall on 29° scarp. Engineering interventions insufficient (Score remains >0.75). Relocation Mandatory.',
      type: 'warning',
    });
  };

  const handleLoadTaliyeBenchmark = () => {
    setSelectedVillageId('v-02');
    setExtraRainfallMm(260);
    setSelectedIntvIds(['drainage_channel']);
    addToast({
      title: '⚡ Taliye (Mahad) Eastern Scarp Benchmark Loaded',
      message: 'Simulated 320mm monsoon surge. Pore-water pressure exceeds critical threshold. Pre-emptive relocation required.',
      type: 'warning',
    });
  };

  const handleLoadChiplunBenchmark = () => {
    const v = villages.find((item) => item.taluka.toLowerCase().includes('chiplun')) || villages[0];
    setSelectedVillageId(v.id);
    setExtraRainfallMm(240);
    setSelectedIntvIds(['embankment', 'drainage_channel']);
    addToast({
      title: '⚡ Chiplun Vashishti River Basin Inundation Loaded',
      message: 'Simulated simultaneous cloudburst and tidal backwater surge.',
      type: 'info',
    });
  };

  const selectedInterventions = interventions.filter((i) =>
    selectedIntvIds.includes(i.id)
  );

  const simResult = useMemo(
    () =>
      simulateIntervention(
        activeVillage,
        selectedInterventions,
        weights,
        extraRainfallMm,
        climateHorizon
      ),
    [activeVillage, selectedInterventions, weights, extraRainfallMm, climateHorizon]
  );

  const factorChartData = [
    {
      name: 'Rainfall Factor',
      Before: activeVillage.hazardFactors.rainfall,
      After: simResult.modifiedFactors.rainfall,
    },
    {
      name: 'Slope Factor',
      Before: activeVillage.hazardFactors.slope,
      After: simResult.modifiedFactors.slope,
    },
    {
      name: 'History Factor',
      Before: activeVillage.hazardFactors.history,
      After: simResult.modifiedFactors.history,
    },
    {
      name: 'River Proximity',
      Before: activeVillage.hazardFactors.riverProximity,
      After: simResult.modifiedFactors.riverProximity,
    },
  ];

  // Compute how many villages flip to Red Zone under the 6-hour Extreme Rainfall Slider (100-300 mm)
  const rainfallStressSummary = useMemo(() => {
    const baselineRed: string[] = [];
    const flippedToRed: { name: string; district: string; before: number; after: number }[] =
      [];

    villages.forEach((v) => {
      const baseScore = weightedScore(
        v.hazardFactors,
        weights,
        v.verifiedReportsCount,
        climateHorizon,
        100
      );
      const stressedScore = weightedScore(
        v.hazardFactors,
        weights,
        v.verifiedReportsCount,
        climateHorizon,
        extraRainfallMm
      );
      if (classifyHazard(baseScore) === 'Immediate') {
        baselineRed.push(v.name);
      } else if (classifyHazard(stressedScore) === 'Immediate') {
        flippedToRed.push({
          name: v.name,
          district: v.district,
          before: baseScore,
          after: stressedScore,
        });
      }
    });

    return { baselineRed, flippedToRed };
  }, [villages, weights, climateHorizon, extraRainfallMm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
            What-If Engineering Mitigation & Cloudburst Stress Simulator
          </h1>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
            Test whether engineering interventions (check dams, retaining walls, drainage)
            can bring a village out of the Red/Orange zone, or if permanent relocation is
            mandatory.
          </p>
        </div>

        {/* Village Selector */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="sim-village-select"
            className="text-xs font-bold text-slate-500"
          >
            Target Village:
          </label>
          <select
            id="sim-village-select"
            value={activeVillage.id}
            onChange={(e) => setSelectedVillageId(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-heading font-bold text-xs text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
          >
            {villages.map((v) => {
              const s = weightedScore(
                v.hazardFactors,
                weights,
                v.verifiedReportsCount,
                climateHorizon,
                100
              );
              return (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.district}) — Baseline: {s.toFixed(3)} [{classifyHazard(s)}]
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Historical Disaster Benchmark Incident Playbacks */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0A1624] text-white border border-slate-700/60 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-xs font-bold tracking-tight text-white uppercase">
                Historical Disaster Benchmark Scenarios (Pre-Disaster Proof of Concept)
              </h2>
              <p className="text-[11px] text-slate-400">
                Load real 48-hour pre-disaster meteorological conditions to evaluate if engineering mitigations could have prevented tragedy or if permanent relocation was the only life-safety solution.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
            Validated Historical Case Studies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleLoadIrshalwadiBenchmark}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700 hover:border-red-500/50 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-red-300 group-hover:text-red-200 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Irshalwadi (Raigad) 2023</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800">
                Landslide
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
              420mm rain + 29° slope. Proves ₹8.4 Cr retaining wall fails &amp; relocation to Chowk was mandatory.
            </p>
          </button>

          <button
            type="button"
            onClick={handleLoadTaliyeBenchmark}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700 hover:border-amber-500/50 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-300 group-hover:text-amber-200 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Taliye (Mahad) 2021</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                Pore Pressure
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
              Eastern scarp turbid seepage &amp; liquefaction. Demonstrates pre-emptive village evacuation.
            </p>
          </button>

          <button
            type="button"
            onClick={handleLoadChiplunBenchmark}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-left border border-slate-700 hover:border-sky-500/50 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-sky-300 group-hover:text-sky-200 flex items-center gap-1.5">
                <span>⚡</span>
                <span>Chiplun Basin 2021</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800">
                Flash Flood
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
              Vashishti river tidal backwater + 240mm cloudburst inundation. High-ground evacuation matching.
            </p>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Intervention Picker (6 cols) + Right Before vs After Comparison (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Choose Interventions */}
        <div className="lg:col-span-6 bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#0E9F8E]" />
              <span>Select Engineering Interventions</span>
            </h2>
            <button
              onClick={() => {
                setSelectedVillageId('v-06');
                setSelectedIntvIds(['check_dam']);
                setExtraRainfallMm(100);
              }}
              className="text-xs font-semibold text-[#0E9F8E] hover:underline"
            >
              Load Worked Example (0.695 → 0.580)
            </button>
          </div>

          <div className="space-y-2.5">
            {interventions.map((intv) => {
              const checked = selectedIntvIds.includes(intv.id);
              return (
                <div
                  key={intv.id}
                  onClick={() => toggleIntervention(intv.id)}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') toggleIntervention(intv.id);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    checked
                      ? 'border-[#0E9F8E] bg-[#0E9F8E]/10 ring-2 ring-[#0E9F8E]/25'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0A1624] hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="rounded text-[#0E9F8E] focus:ring-[#0E9F8E] w-4 h-4"
                      />
                      <div>
                        <div className="font-heading font-bold text-xs text-[#0F172A] dark:text-white">
                          {intv.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {intv.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <span className="px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[11px] font-bold">
                        ₹{intv.estimatedCostLakhs} L
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {intv.durationMonths} mos
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Before vs After Comparison */}
        <div className="lg:col-span-6 bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between space-y-5">
          <div>
            <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
              Before vs. After Simulation — {activeVillage.name} ({activeVillage.district})
            </h2>
            <p className="text-xs text-slate-500">
              Instant deterministic recalculation of normalized hazard factors
            </p>
          </div>

          {/* Score Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-11 gap-3 items-center">
            {/* Before */}
            <div className="sm:col-span-5 p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400">
                BEFORE INTERVENTION
              </div>
              <div className="font-heading text-3xl font-extrabold text-[#0F172A] dark:text-white tabular-nums">
                {simResult.beforeScore.toFixed(3)}
              </div>
              <RiskBadge level={simResult.beforeLevel} size="md" />
            </div>

            <div className="sm:col-span-1 flex justify-center">
              <ArrowRight className="w-6 h-6 text-[#0E9F8E]" />
            </div>

            {/* After */}
            <div className="sm:col-span-5 p-4 rounded-2xl bg-[#0E9F8E]/10 border-2 border-[#0E9F8E] text-center space-y-2">
              <div className="text-xs font-bold uppercase text-[#0E9F8E]">
                AFTER INTERVENTION
              </div>
              <div className="font-heading text-3xl font-extrabold text-[#0F172A] dark:text-white tabular-nums flex items-center justify-center gap-2">
                <span>{simResult.afterScore.toFixed(3)}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#16A34A] text-white inline-flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  {simResult.delta.toFixed(3)}
                </span>
              </div>
              <RiskBadge level={simResult.afterLevel} size="md" />
            </div>
          </div>

          {/* Bar Chart comparing factors */}
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factorChartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Before" fill="#94A3B8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="After" fill="#0E9F8E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cost & Cost-Effectiveness Verdict */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold">
              <span className="flex items-center gap-1.5 text-[#0F172A] dark:text-white">
                <ShieldCheck className="w-4 h-4 text-[#0E9F8E]" />
                <span>Engineering Feasibility Verdict:</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[#4F46E5] tabular-nums">
                <IndianRupee className="w-3.5 h-3.5" /> Est. Capex: ₹
                {simResult.totalCostLakhs} Lakhs ({simResult.maxDurationMonths} months)
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {simResult.verdict}
            </p>
          </div>
        </div>
      </div>

      {/* Extreme 6-Hour Rainfall Cloudburst Stress Slider (100 - 300 mm in 6h) */}
      <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-600">
              <CloudRain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                Extreme 6-Hour Cloudburst Rainfall Simulator (100 mm → 300 mm / 6h)
              </h2>
              <p className="text-xs text-slate-500">
                Slide to simulate intense Western Ghats cloudburst and watch which
                Short-Term (Orange) villages flip into Immediate Red Zones (&gt;0.75)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl font-extrabold text-sky-600 tabular-nums">
              {extraRainfallMm} mm / 6h
            </span>
            <button
              onClick={() => setExtraRainfallMm(100)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#0A1624] text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Reset (100mm)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <span>100 mm (Normal Peak)</span>
          <input
            type="range"
            min={100}
            max={300}
            step={10}
            value={extraRainfallMm}
            onChange={(e) => setExtraRainfallMm(Number(e.target.value))}
            className="flex-1 accent-sky-600 cursor-pointer"
            aria-label="Extreme 6-hour rainfall slider in millimeters"
          />
          <span className="text-[#DC2626]">300 mm (Extreme Cloudburst)</span>
        </div>

        {/* Villages that flipped to Red Zone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800">
            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Baseline Red Zone Villages ({rainfallStressSummary.baselineRed.length}):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {rainfallStressSummary.baselineRed.map((name) => (
                <span
                  key={name}
                  className="px-2.5 py-1 rounded-lg bg-[#DC2626]/12 text-[#DC2626] font-semibold"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#DC2626]/8 border border-[#DC2626]/30">
            <div className="font-bold text-[#DC2626] mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>
                Newly Flipped to Red Zone at {extraRainfallMm} mm/6h (
                {rainfallStressSummary.flippedToRed.length}):
              </span>
            </div>
            {rainfallStressSummary.flippedToRed.length === 0 ? (
              <p className="text-slate-500">
                Increase rainfall slider above 160 mm/6h to see borderline Orange villages
                flip into the Red Zone.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {rainfallStressSummary.flippedToRed.map((f) => (
                  <span
                    key={f.name}
                    className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white font-bold tabular-nums"
                  >
                    {f.name} ({f.before.toFixed(2)} → {f.after.toFixed(2)})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
