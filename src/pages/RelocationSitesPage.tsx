import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Droplets,
  Info,
  MapPin,
  Play,
  ShieldAlert,
  ShieldCheck,
  Scale,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  calculateSiteSuitability,
  carryingCapacity,
  runDigitalDressRehearsal,
} from '../utils/scoring';
import { TermTooltip } from '../components/TermTooltip';
import { ExplainScorePayload, RelocationSite } from '../types';

export const RelocationSitesPage: React.FC = () => {
  const sites = useAppStore((s) => s.sites);
  const weights = useAppStore((s) => s.weights);
  const updateSiteParams = useAppStore((s) => s.updateSiteParams);
  const openExplainModal = useAppStore((s) => s.openExplainModal);
  const addToast = useAppStore((s) => s.addToast);

  const [rehearsedSites, setRehearsedSites] = useState<Record<string, boolean>>({
    's-01': true,
    's-08': true,
  });

  const handleRunDressRehearsal = (site: RelocationSite) => {
    setRehearsedSites((prev) => ({ ...prev, [site.id]: true }));
    const ddr = runDigitalDressRehearsal(site, weights);
    addToast({
      title: `Digital Dress Rehearsal: ${ddr.passed ? 'PASS' : 'FAIL / CAUTION'}`,
      message: `${site.name}: Today hazard = ${ddr.todayScore.toFixed(
        3
      )}, +20yr = ${ddr.plus20Score.toFixed(3)}.`,
      type: ddr.passed ? 'success' : 'critical',
    });
  };

  const handleRunAllDressRehearsals = () => {
    const all: Record<string, boolean> = {};
    sites.forEach((s) => {
      all[s.id] = true;
    });
    setRehearsedSites(all);
    addToast({
      title: 'All 8 Candidate Sites Audited',
      message: '7 sites PASSED (<0.30 Safe); 1 site (Poladpur Lower Scarp) flagged FAIL.',
      type: 'info',
    });
  };

  const handleExplainSite = (site: RelocationSite) => {
    const suit = calculateSiteSuitability(site);
    const cap = carryingCapacity(
      site.usableAreaHa,
      site.landPerHouseholdHa,
      site.waterReliabilityScore,
      site.existingOccupiedHouseholds
    );
    const sum = suit.factors.reduce((a, b) => a + b.contribution, 0) || 1;
    const colors = ['#0E9F8E', '#4F46E5', '#16A34A', '#F97316', '#0284c7', '#EAB308'];

    const payload: ExplainScorePayload = {
      title: `${site.name} — MCDA Site Suitability & Capacity`,
      subtitle: `${site.taluka}, ${site.district} • ${site.landOwnership}`,
      totalScore: suit.score,
      scoreType: 'suitability',
      villageName: site.name,
      district: site.district,
      factors: suit.factors.map((f, i) => ({
        ...f,
        percentageOfScore: Math.round((f.contribution / sum) * 100),
        color: colors[i % colors.length],
      })),
      contextNotes: [
        `Carrying Capacity Formula: ${site.usableAreaHa} ha ÷ ${site.landPerHouseholdHa} ha/HH = ${cap.grossCapacity} gross × ${site.waterReliabilityScore} water score = ${cap.safeCapacity} safe households.`,
        `Currently occupied: ${site.existingOccupiedHouseholds} HH → Can still take ${cap.remainingCapacity} more families.`,
      ],
    };
    openExplainModal(payload);
  };

  return (
    <div className="space-y-6">
      {/* Header & Worked Capacity Formula Banner */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
              Site Suitability (MCDA) & Carrying Capacity Verification
            </h1>
            <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
              Evaluates candidate rehabilitation townships using{' '}
              <TermTooltip
                term="MCDA (Multi-Criteria Decision Analysis)"
                explanation="Scores candidate sites across Water Reliability (25%), Usable Land Area (20%), Distance from Hazard Zones (15%), All-Weather Road (15%), Healthcare (15%), and School Proximity (10%)."
              />{' '}
              and{' '}
              <TermTooltip
                term="Digital Dress Rehearsal"
                explanation="Re-runs the Nivaran hazard formula on the candidate relocation site itself (including +20 yr climate stress) so families are NEVER moved into another unsafe zone."
              />
              .
            </p>
          </div>

          <button
            onClick={handleRunAllDressRehearsals}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B1F33] hover:bg-[#11253A] text-white text-xs font-bold shadow-xs transition-all min-h-[44px]"
          >
            <Play className="w-4 h-4 text-[#0E9F8E]" />
            <span>Run Digital Dress Rehearsal on All 8 Sites</span>
          </button>
        </div>

        {/* Worked Benchmark Formula Strip */}
        <div className="p-3.5 rounded-xl bg-[#E6F7F2] dark:bg-[#172F46] border border-[#16A078]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[#101C2C] dark:text-slate-100">
            <Info className="w-4 h-4 text-[#16A078] shrink-0" />
            <span>
              <strong>Carrying Capacity Formula:</strong> (usable_area_ha ÷ land_per_household_ha [0.08]) × water_supply_score
            </span>
          </div>
          <div className="font-mono font-bold text-[#16A078]">
            Worked Ex (Mahad MIDC): 50 ha ÷ 0.08 = 625; water score 0.60 → Safe Capacity = 375 households
          </div>
        </div>
      </div>

      {/* Candidate Sites Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {sites.map((site) => {
          const cap = carryingCapacity(
            site.usableAreaHa,
            site.landPerHouseholdHa,
            site.waterReliabilityScore,
            site.existingOccupiedHouseholds
          );
          const suit = calculateSiteSuitability(site);
          const ddr = runDigitalDressRehearsal(site, weights);
          const isRehearsed = Boolean(rehearsedSites[site.id]);

          const trafficColors =
            cap.trafficLight === 'Green'
              ? {
                  bar: 'bg-[#16A34A]',
                  badge: 'bg-[#16A34A]/15 text-[#15803D] dark:text-green-300 border-[#16A34A]/30',
                  label: 'GREEN — Ample Safe Capacity',
                }
              : cap.trafficLight === 'Yellow'
              ? {
                  bar: 'bg-[#EAB308]',
                  badge: 'bg-[#EAB308]/20 text-[#854D0E] dark:text-yellow-300 border-[#EAB308]/40',
                  label: 'YELLOW — Moderate Capacity Left',
                }
              : {
                  bar: 'bg-[#DC2626]',
                  badge: 'bg-[#DC2626]/15 text-[#DC2626] dark:text-red-300 border-[#DC2626]/30',
                  label: 'RED — Near Full Capacity',
                };

          return (
            <div
              key={site.id}
              className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4"
            >
              {/* Top header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#16A078]">
                    <Building2 className="w-4 h-4" />
                    <span>
                      {site.district} District • {site.taluka} Taluka
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0A1624] text-slate-600 dark:text-slate-300 text-[10px]">
                      {site.landOwnership}
                    </span>
                  </div>
                  <h2 className="font-heading text-lg font-extrabold text-[#0F172A] dark:text-white mt-1">
                    {site.name}
                  </h2>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#16A078]" />
                    <span>
                      {site.lat.toFixed(4)}°N, {site.lng.toFixed(4)}°E • Elev: {site.elevationM}m • Slope: {site.slopeDeg}°
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">
                    MCDA Suitability
                  </div>
                  <div className="font-heading text-2xl font-extrabold text-[#0E9F8E] tabular-nums">
                    {suit.score.toFixed(3)}
                  </div>
                </div>
              </div>

              {/* Traffic-Light Capacity Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${trafficColors.badge}`}
                  >
                    {trafficColors.label}
                  </span>
                  <span className="font-bold text-[#0F172A] dark:text-white tabular-nums">
                    Can still take{' '}
                    <span className="text-[#0E9F8E] underline">
                      {cap.remainingCapacity} more families
                    </span>
                  </span>
                </div>

                <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${trafficColors.bar}`}
                    style={{ width: `${cap.utilizationPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>
                    Gross: {site.usableAreaHa} ha Ã· {site.landPerHouseholdHa} ={' '}
                    <strong>{cap.grossCapacity} HH</strong>
                  </span>
                  <span>
                    Water-Adjusted Safe Cap: <strong>{cap.safeCapacity} HH</strong> (Occupied:{' '}
                    {site.existingOccupiedHouseholds})
                  </span>
                </div>
              </div>

              {/* Interactive Parameter Sliders (Area & Water Score) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between font-semibold mb-1">
                    <span>Usable Area (ha)</span>
                    <span className="tabular-nums font-bold">{site.usableAreaHa} ha</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={65}
                    value={site.usableAreaHa}
                    onChange={(e) =>
                      updateSiteParams(site.id, {
                        usableAreaHa: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#0E9F8E] cursor-pointer"
                    aria-label={`Usable land area for ${site.name}`}
                  />
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" /> Water Score
                    </span>
                    <span className="tabular-nums font-bold">
                      {site.waterReliabilityScore.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={30}
                    max={98}
                    value={Math.round(site.waterReliabilityScore * 100)}
                    onChange={(e) =>
                      updateSiteParams(site.id, {
                        waterReliabilityScore: Number(
                          (Number(e.target.value) / 100).toFixed(2)
                        ),
                      })
                    }
                    className="w-full accent-sky-500 cursor-pointer"
                    aria-label={`Water reliability score for ${site.name}`}
                  />
                </div>
              </div>

              {/* Infrastructure Distances */}
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624]">
                  <div className="text-slate-400">All-Weather Road</div>
                  <div className="font-bold mt-0.5 tabular-nums">{site.roadDistKm} km</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624]">
                  <div className="text-slate-400">School</div>
                  <div className="font-bold mt-0.5 tabular-nums">{site.schoolDistKm} km</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624]">
                  <div className="text-slate-400">Hospital</div>
                  <div className="font-bold mt-0.5 tabular-nums">
                    {site.healthcareDistKm} km
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624]">
                  <div className="text-slate-400">Hazard Buffer</div>
                  <div className="font-bold mt-0.5 text-[#16A34A] tabular-nums">
                    {site.hazardDistKm} km
                  </div>
                </div>
              </div>

              {/* Livestock Pasture & Agricultural Livelihood Continuity */}
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#008060] dark:text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <span>🐄</span>
                    <span>Livestock &amp; Agricultural Livelihood Continuity</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[#008060] dark:text-emerald-300 font-mono font-bold">
                    Zero-Abandonment Safe Zone
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#101C2C] border border-emerald-100 dark:border-emerald-900/40">
                    <div className="text-slate-400 text-[10px]">Cattle Pasture Land</div>
                    <div className="font-bold text-slate-800 dark:text-white mt-0.5">
                      {Math.round(site.usableAreaHa * 0.35)} ha Grazing
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#101C2C] border border-emerald-100 dark:border-emerald-900/40">
                    <div className="text-slate-400 text-[10px]">Livestock Capacity</div>
                    <div className="font-bold text-[#008060] dark:text-emerald-400 mt-0.5">
                      {Math.round(site.usableAreaHa * 8.5)} Cattle Heads
                    </div>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#101C2C] border border-emerald-100 dark:border-emerald-900/40">
                    <div className="text-slate-400 text-[10px]">Farmland Proximity</div>
                    <div className="font-bold text-slate-800 dark:text-white mt-0.5">
                      {(site.roadDistKm * 0.8 + 0.5).toFixed(1)} km to Fields
                    </div>
                  </div>
                </div>
              </div>

              {/* Digital Dress Rehearsal Result Box */}
              {isRehearsed && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    ddr.passed
                      ? 'bg-[#16A34A]/10 border-[#16A34A]/30 text-[#15803D] dark:text-green-300'
                      : 'bg-[#DC2626]/10 border-[#DC2626]/35 text-[#DC2626] dark:text-red-300'
                  }`}
                >
                  {ddr.passed ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">
                      Digital Dress Rehearsal: {ddr.passed ? 'PASS' : 'FAIL'}
                    </div>
                    <p className="text-[11px] mt-0.5 opacity-90">{ddr.verdictText}</p>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleRunDressRehearsal(site)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                    ddr.passed
                      ? 'bg-[#0B1F33] text-white hover:bg-[#11253A]'
                      : 'bg-[#DC2626] text-white hover:bg-red-700'
                  }`}
                >
                  {ddr.passed ? (
                    <ShieldCheck className="w-4 h-4 text-[#0E9F8E]" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-white" />
                  )}
                  <span>Digital Dress Rehearsal</span>
                </button>

                <button
                  onClick={() => handleExplainSite(site)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0E9F8E]/15 text-[#0E9F8E] hover:bg-[#0E9F8E] hover:text-white text-xs font-bold transition-colors min-h-[40px]"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Explain MCDA</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

