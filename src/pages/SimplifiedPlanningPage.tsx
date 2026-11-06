import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  HelpCircle,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Users,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  buildVillageExplainPayload,
  calculateSiteSuitability,
  capacityFromConstraints,
  greedyMatch,
  validateAllocation,
} from '../utils/scoring';
import { RelocationCaseStatus, Village } from '../types';

const CASE_STAGES: RelocationCaseStatus[] = [
  'Identified',
  'Approved',
  'Compensation Paid',
  'Site Allotted',
  'Resettled',
];

export const SimplifiedPlanningPage: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const weights = useAppStore((s) => s.weights);
  const setWeights = useAppStore((s) => s.setWeights);
  const resetWeights = useAppStore((s) => s.resetWeights);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const setExtraRainfallMm = useAppStore((s) => s.setExtraRainfallMm);
  const openExplainModal = useAppStore((s) => s.openExplainModal);
  const manualSiteOverrides = useAppStore((s) => s.manualSiteOverrides);
  const setManualSiteOverride = useAppStore((s) => s.setManualSiteOverride);
  const planApproved = useAppStore((s) => s.planApproved);
  const planApprovedAt = useAppStore((s) => s.planApprovedAt);
  const approvePlan = useAppStore((s) => s.approvePlan);

  const householdCases = useAppStore((s) => s.householdCases);
  const advanceHouseholdStage = useAppStore((s) => s.advanceHouseholdStage);
  const addHouseholdCase = useAppStore((s) => s.addHouseholdCase);

  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'allocation' | 'sites' | 'cases' | 'ml_model'>(
    'allocation'
  );
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [scenarioEnabled, setScenarioEnabled] = useState(false);

  // Add Household Case Form state
  const [showAddCaseForm, setShowAddCaseForm] = useState(false);
  const [newHeadName, setNewHeadName] = useState('');
  const [newVillageId, setNewVillageId] = useState(villages[0]?.id || 'v1');
  const [newMembersCount, setNewMembersCount] = useState(5);
  const [newTargetSite, setNewTargetSite] = useState(
    sites[0]?.name || 'MIDC Dasgaon Safe Plateau'
  );
  const [newCompensationInr, setNewCompensationInr] = useState(500000);

  const canApprove =
    user?.role === 'administrator' ||
    user?.role === 'sdma' ||
    user?.role === 'national_authority' ||
    user?.role === 'district_officer';

  // Apply scenario rainfall delta when scenario toggle is active
  const effectiveVillages: Village[] = useMemo(() => {
    if (!scenarioEnabled || extraRainfallMm <= 0) return villages;
    const rainBoost = Math.min(0.35, extraRainfallMm / 1000);
    return villages.map((v) => ({
      ...v,
      hazardFactors: {
        ...v.hazardFactors,
        rainfall: Math.min(1, Number((v.hazardFactors.rainfall + rainBoost).toFixed(3))),
      },
    }));
  }, [villages, scenarioEnabled, extraRainfallMm]);

  const rankedEntries = useMemo(() => {
    return greedyMatch(effectiveVillages, sites, weights, { manualSiteOverrides });
  }, [effectiveVillages, sites, weights, manualSiteOverrides]);

  const validation = useMemo(() => {
    return validateAllocation(rankedEntries, sites, weights);
  }, [rankedEntries, sites, weights]);

  const filteredRanked = useMemo(() => {
    return rankedEntries.filter(
      (r) => districtFilter === 'All' || r.village.district === districtFilter
    );
  }, [rankedEntries, districtFilter]);

  const filteredCases = useMemo(() => {
    return householdCases.filter(
      (c) => districtFilter === 'All' || c.district === districtFilter
    );
  }, [householdCases, districtFilter]);

  const immediateCount = rankedEntries.filter((r) => r.riskLevel === 'Immediate').length;
  const totalAllocatedHouseholds = rankedEntries.reduce(
    (sum, r) => sum + r.allocatedHouseholds,
    0
  );

  const handleAddHouseholdCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHeadName.trim()) return;
    const v = villages.find((item) => item.id === newVillageId) || villages[0];
    addHouseholdCase({
      headName: newHeadName.trim(),
      villageId: v?.id || 'v1',
      villageName: v?.name || 'Irshalwadi',
      district: v?.district || 'Raigad',
      membersCount: Math.max(1, Number(newMembersCount) || 4),
      targetSiteName: newTargetSite,
      compensationSanctionedInr: Math.max(50000, Number(newCompensationInr) || 500000),
    });
    setNewHeadName('');
    setShowAddCaseForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Separation Notice + Method Integrity Badge */}
      <div className="neu-raised p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              {language === 'hi'
                ? 'पुनर्वास और क्षमता योजना (Planning)'
                : 'Relocation & Capacity Decision Engine (Planning)'}
            </h1>
            <span className="px-2 py-0.5 rounded neu-flat text-[11px] font-mono font-semibold text-[#0B8F80]">
              Transparent Weighted Index v2.4 (Active)
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-[#CA8A04] text-[10px] font-mono font-bold">
              Trained ML Model: Not connected
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Method-Integrity Rule: Current risk scores use a transparent, deterministic weighted index (not a black-box ML model). Includes Candidate Site Allocation &amp; Tamper-Evident Relocation Case Tracker.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="neu-input px-3 py-1.5 text-xs font-semibold"
          >
            <option value="All">All Districts ({rankedEntries.length})</option>
            <option value="Raigad">Raigad</option>
            <option value="Satara">Satara</option>
            <option value="Pune">Pune</option>
            <option value="Ratnagiri">Ratnagiri</option>
            <option value="Kolhapur">Kolhapur</option>
            <option value="Sindhudurg">Sindhudurg</option>
          </select>

          <div className="neu-inset p-1 rounded-[10px] flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode('allocation')}
              className={`px-3 py-1.5 rounded-[8px] font-bold ${
                viewMode === 'allocation'
                  ? 'bg-[#0B8F80] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Priority &amp; Allocation
            </button>
            <button
              type="button"
              onClick={() => setViewMode('sites')}
              className={`px-3 py-1.5 rounded-[8px] font-bold ${
                viewMode === 'sites'
                  ? 'bg-[#0B8F80] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Candidate Sites ({sites.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cases')}
              className={`px-3 py-1.5 rounded-[8px] font-bold flex items-center gap-1 ${
                viewMode === 'cases'
                  ? 'bg-[#0B8F80] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Relocation Cases ({householdCases.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('ml_model')}
              className={`px-3 py-1.5 rounded-[8px] font-bold flex items-center gap-1 ${
                viewMode === 'ml_model'
                  ? 'bg-[#CA8A04] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Trained ML Model (Not Connected)</span>
            </button>
          </div>

          {canApprove && (
            <button
              type="button"
              onClick={approvePlan}
              className={`px-3.5 py-2 rounded-[10px] text-xs font-bold flex items-center gap-1.5 ${
                planApproved
                  ? 'bg-[#15803D] text-white'
                  : 'bg-[#0B8F80] hover:bg-[#097569] text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={1.75} />
              <span>
                {planApproved ? `Approved (${planApprovedAt})` : 'Approve Relocation Plan'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="neu-raised p-3.5">
          <div className="text-xs text-[var(--text-secondary)]">
            Immediate Relocation Priority
          </div>
          <div className="text-xl font-mono font-extrabold text-[#B91C1C] mt-1">
            {immediateCount} Habitations
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Static Hazard Score &gt; 0.75
          </div>
        </div>

        <div className="neu-raised p-3.5">
          <div className="text-xs text-[var(--text-secondary)]">
            Households Allocated to Safe Sites
          </div>
          <div className="text-xl font-mono font-extrabold text-[#15803D] mt-1">
            {totalAllocatedHouseholds.toLocaleString('en-IN')} HH
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Capacity-constrained greedy match
          </div>
        </div>

        <div className="neu-raised p-3.5">
          <div className="text-xs text-[var(--text-secondary)]">
            Unassigned Households (Overflow)
          </div>
          <div className="text-xl font-mono font-extrabold text-[#EA580C] mt-1">
            {validation.totalUnassignedHouseholds.toLocaleString('en-IN')} HH
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Zero site capacity overflow violations
          </div>
        </div>

        <div className="neu-raised p-3.5">
          <div className="text-xs text-[var(--text-secondary)]">
            Tracked Household Relocation Cases
          </div>
          <div className="text-xl font-mono font-extrabold text-[#0B8F80] mt-1">
            {householdCases.length} Cases
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Hash-chain verified audit trail
          </div>
        </div>
      </div>

      {/* COLLAPSED ADVANCED OPTIONS & WHAT-IF SCENARIOS */}
      <div className="neu-raised p-4">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--text-primary)]"
        >
          <span className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
            <span>
              Advanced Options: Factor Weights &amp; What-If Rainfall Scenario Simulator
            </span>
          </span>
          {advancedOpen ? (
            <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <ChevronDown className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>

        {advancedOpen && (
          <div className="mt-4 pt-3 border-t border-[var(--border)] grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* Factor Weights */}
            <div className="neu-flat p-3.5 rounded-[10px] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-primary)]">
                  Hazard Index Factor Weights (Normalized to 100%)
                </span>
                <button
                  type="button"
                  onClick={resetWeights}
                  className="neu-btn px-2 py-1 text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
                  <span>Reset</span>
                </button>
              </div>

              {(
                [
                  ['rainfall', 'Rainfall Intensity'],
                  ['slope', 'Slope Gradient'],
                  ['history', 'Past Disaster Events'],
                  ['riverProximity', 'River Proximity'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between">
                    <span>{label}</span>
                    <span className="font-mono font-bold">
                      {Math.round(weights[key] * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.7}
                    step={0.05}
                    value={weights[key]}
                    onChange={(e) =>
                      setWeights({
                        ...weights,
                        [key]: Number(e.target.value),
                      })
                    }
                    className="w-full accent-[#0B8F80]"
                  />
                </div>
              ))}
            </div>

            {/* What-If Rainfall Scenario */}
            <div className="neu-flat p-3.5 rounded-[10px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--text-primary)]">
                  What-If Extreme Rainfall Scenario
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-[#0B8F80]">
                  <input
                    type="checkbox"
                    checked={scenarioEnabled}
                    onChange={(e) => setScenarioEnabled(e.target.checked)}
                    className="accent-[#0B8F80]"
                  />
                  <span>Enable What-If Simulation</span>
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Extra 24-Hour Rainfall Surge</span>
                  <span className="font-mono font-bold text-[#EA580C]">
                    +{extraRainfallMm} mm
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={300}
                  step={25}
                  disabled={!scenarioEnabled}
                  value={extraRainfallMm}
                  onChange={(e) => setExtraRainfallMm(Number(e.target.value))}
                  className="w-full accent-[#0B8F80]"
                />
              </div>

              <p className="text-[11px] text-[var(--text-secondary)]">
                Simulates how an additional +{extraRainfallMm} mm cloudburst shifts static habitation priority rankings and shelter site demand.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: PRIORITY RANKING & SITE ALLOCATION TABLE */}
      {viewMode === 'allocation' && (
        <div className="neu-raised p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase font-mono text-[var(--text-secondary)]">
                <th className="py-2.5 px-2">Rank</th>
                <th className="py-2.5 px-2">Habitation</th>
                <th className="py-2.5 px-2">Static Risk Level</th>
                <th className="py-2.5 px-2">Priority Score</th>
                <th className="py-2.5 px-2">Households</th>
                <th className="py-2.5 px-2">Allocated Safe Site</th>
                <th className="py-2.5 px-2">Allocated / Unassigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredRanked.map((entry) => {
                const riskBg =
                  entry.riskLevel === 'Immediate'
                    ? '#B91C1C'
                    : entry.riskLevel === 'Short-term'
                    ? '#EA580C'
                    : entry.riskLevel === 'Medium-term'
                    ? '#CA8A04'
                    : '#15803D';

                return (
                  <tr key={entry.village.id} className="hover:bg-black/5">
                    <td className="py-2.5 px-2 font-mono font-bold">#{entry.rank}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-[var(--text-primary)]">
                        {entry.village.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {entry.village.district} · {entry.village.taluka} ·{' '}
                        {entry.village.primaryHazard}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-white inline-block"
                        style={{ backgroundColor: riskBg }}
                      >
                        {entry.riskLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm">
                          {(entry.priorityScore * 100).toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            openExplainModal(
                              buildVillageExplainPayload(
                                entry.village,
                                weights,
                                entry.rank
                              )
                            )
                          }
                          className="neu-btn px-1.5 py-0.5 text-[10px] font-semibold text-[#0B8F80] flex items-center gap-0.5"
                          title="Explain deterministic factor breakdown"
                        >
                          <HelpCircle className="w-3 h-3" strokeWidth={1.75} />
                          <span>Why?</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      {entry.village.households} HH ({entry.village.population} pop)
                    </td>
                    <td className="py-2.5 px-2">
                      <select
                        value={manualSiteOverrides[entry.village.id] || ''}
                        onChange={(e) =>
                          setManualSiteOverride(entry.village.id, e.target.value)
                        }
                        className="neu-input px-2 py-1 text-xs"
                      >
                        <option value="">
                          Auto: {entry.allocatedSiteName} ({entry.distanceKm.toFixed(1)} km)
                        </option>
                        {sites.map((s) => (
                          <option key={s.id} value={s.id}>
                            Override: {s.name} ({s.district})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      <span className="text-[#15803D] font-bold">
                        {entry.allocatedHouseholds} allocated
                      </span>
                      {entry.unallocatedHouseholds > 0 && (
                        <span className="ml-2 text-[#B91C1C] font-bold">
                          ({entry.unallocatedHouseholds} unassigned)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: CANDIDATE RELOCATION SITES & CAPACITY CONSTRAINTS */}
      {viewMode === 'sites' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sites.map((site) => {
            const sScore = calculateSiteSuitability(site).score;
            const landPeople = Math.round(
              (site.usableAreaHa / site.landPerHouseholdHa) * 4.5
            );
            const waterPeople = Math.round(landPeople * site.waterReliabilityScore);
            const infraPeople = Math.round(landPeople * 0.92);
            const cap = capacityFromConstraints(
              landPeople,
              waterPeople,
              infraPeople,
              site.existingOccupiedHouseholds * 4.5
            );

            return (
              <div key={site.id} className="neu-raised p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-[#0B8F80] text-white font-mono font-bold">
                    Suitability: {(sScore * 100).toFixed(0)} / 100
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                    {site.landOwnership}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                    <span>{site.name}</span>
                  </h3>
                  <div className="text-[var(--text-secondary)]">
                    {site.district} · {site.taluka} · Elev {site.elevationM} m · Slope{' '}
                    {site.slopeDeg}°
                  </div>
                </div>

                <div className="neu-flat p-2.5 rounded-[8px] space-y-1">
                  <div className="flex justify-between">
                    <span>Net Safe Capacity:</span>
                    <span className="font-mono font-bold text-[#15803D]">
                      {Math.round(cap.remainingCapacity / 4.5)} Households ({cap.remainingCapacity} people)
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)]">
                    <span>Limiting Constraint:</span>
                    <span className="font-mono font-semibold text-[#EA580C]">
                      {cap.bindingLabel}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  <div>Usable: {site.usableAreaHa} ha</div>
                  <div>Road: {site.roadDistKm} km</div>
                  <div>Water: {Math.round(site.waterReliabilityScore * 100)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: RELOCATION CASE TRACKER (SURVEYED -> APPROVED -> COMPENSATION PAID -> SITE ALLOTTED -> RESETTLED) */}
      {viewMode === 'cases' && (
        <div className="space-y-4">
          <div className="neu-raised p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0B8F80]" />
                <span>
                  Relocation Case Tracker (Stages: Surveyed / Identified → Approved → Compensation Paid → Site Allotted → Resettled)
                </span>
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Every stage transition is recorded in a tamper-evident SHA-256 hash chain and immutable Audit Log.
              </p>
            </div>
            {canApprove && (
              <button
                type="button"
                onClick={() => setShowAddCaseForm((v) => !v)}
                className="px-3.5 py-2 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddCaseForm ? 'Close Form' : '+ Register Household Case'}</span>
              </button>
            )}
          </div>

          {showAddCaseForm && canApprove && (
            <form
              onSubmit={handleAddHouseholdCaseSubmit}
              className="neu-raised p-4 space-y-3 border border-[#0B8F80]/40 text-xs"
            >
              <div className="font-bold text-sm text-[var(--text-primary)]">
                Register New Household Relocation Case
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Head of Household Name"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  className="neu-input px-3 py-2"
                />
                <select
                  value={newVillageId}
                  onChange={(e) => setNewVillageId(e.target.value)}
                  className="neu-input px-3 py-2"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.district})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={25}
                  placeholder="Family Size"
                  value={newMembersCount}
                  onChange={(e) => setNewMembersCount(Number(e.target.value))}
                  className="neu-input px-3 py-2 font-mono"
                />
                <select
                  value={newTargetSite}
                  onChange={(e) => setNewTargetSite(e.target.value)}
                  className="neu-input px-3 py-2"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.district})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step={25000}
                  placeholder="Sanctioned Compensation (INR)"
                  value={newCompensationInr}
                  onChange={(e) => setNewCompensationInr(Number(e.target.value))}
                  className="neu-input px-3 py-2 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCaseForm(false)}
                  className="neu-btn px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold"
                >
                  Save Case &amp; Generate Genesis Hash
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredCases.map((hc) => {
              const currentIdx = CASE_STAGES.indexOf(hc.status);
              const nextStage =
                currentIdx >= 0 && currentIdx < CASE_STAGES.length - 1
                  ? CASE_STAGES[currentIdx + 1]
                  : null;
              const latestLedger = hc.timeline[hc.timeline.length - 1];

              return (
                <div
                  key={hc.id}
                  className="neu-raised p-4 space-y-3 text-xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[#0B8F80]">{hc.caseCode}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded font-bold text-white text-[11px] ${
                          hc.status === 'Resettled'
                            ? 'bg-[#15803D]'
                            : hc.status === 'Identified'
                            ? 'bg-[#CA8A04]'
                            : 'bg-[#0B8F80]'
                        }`}
                      >
                        {hc.status === 'Identified' ? 'Surveyed / Identified' : hc.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">
                        {hc.headOfHousehold} ({hc.familySize} members)
                      </h3>
                      <div className="text-[var(--text-secondary)]">
                        Origin: <strong>{hc.villageName}</strong> ({hc.district}) → Allotted Site:{' '}
                        <strong className="text-[#0B8F80]">{hc.assignedSiteName}</strong>
                      </div>
                    </div>

                    {/* 5-Stage Visual Pipeline */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {CASE_STAGES.map((stg, idx) => {
                        const done = idx <= currentIdx;
                        return (
                          <div
                            key={stg}
                            className={`px-1.5 py-1 rounded text-[9px] font-bold text-center truncate ${
                              done
                                ? 'bg-[#0B8F80] text-white'
                                : 'neu-flat text-[var(--text-secondary)]'
                            }`}
                          >
                            {idx + 1}. {stg === 'Identified' ? 'Surveyed' : stg}
                          </div>
                        );
                      })}
                    </div>

                    <div className="neu-flat p-2.5 rounded-[8px] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                      <span>
                        Sanctioned: ₹{hc.compensationSanctionedInr.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[#15803D] font-bold">
                        Disbursed: ₹{hc.compensationDisbursedInr.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Tamper-Evident Hash Chain Box */}
                    {latestLedger && (
                      <div className="neu-inset p-2.5 rounded-[8px] space-y-1 font-mono text-[10px]">
                        <div className="flex items-center justify-between text-[#0B8F80] font-bold">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Tamper-Evident Hash Chain ({hc.timeline.length} blocks)</span>
                          </span>
                          <span>{latestLedger.timestamp}</span>
                        </div>
                        <div className="truncate text-[var(--text-secondary)]">
                          prevHash: {latestLedger.prevHash}
                        </div>
                        <div className="truncate text-[var(--text-primary)] font-bold">
                          currHash: {latestLedger.currHash}
                        </div>
                      </div>
                    )}
                  </div>

                  {canApprove && nextStage && (
                    <div className="pt-2 border-t border-[var(--border)] flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          advanceHouseholdStage(
                            hc.id,
                            nextStage,
                            `Advanced to ${nextStage} by ${user?.name || 'District Officer'}`
                          )
                        }
                        className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] hover:bg-[#097568] text-white font-bold flex items-center gap-1.5"
                      >
                        <span>Advance to {nextStage}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: METHOD-INTEGRITY RULE — TRAINED ML MODEL STATUS ("NOT CONNECTED") */}
      {viewMode === 'ml_model' && (
        <div className="neu-raised p-6 space-y-4 border-l-4 border-[#CA8A04] text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-[#CA8A04]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Trained Machine Learning Landslide Susceptibility Model
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-[#CA8A04] font-mono font-bold">
              Status: Not connected — requires labelled historical landslide inventory
            </span>
          </div>

          <p className="text-[var(--text-secondary)] leading-relaxed">
            <strong>Method-Integrity Standard:</strong> NIVARAN never fakes a machine-learning prediction when no trained model is connected. The active production decision engine uses the{' '}
            <strong>Transparent Weighted Multi-Hazard Index v2.4</strong> (Rainfall + Slope + Historical Events + River Proximity + Vulnerability), where every factor weight is inspectable and adjustable by domain officers.
          </p>

          <div className="neu-flat p-4 rounded-[10px] space-y-2">
            <div className="font-bold text-[var(--text-primary)]">
              What is required to connect the Trained ML Model:
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
              <li>
                GSI (Geological Survey of India) Bhukosh labelled historical landslide inventory polygons (minimum 1,500 verified crown/runout samples across Western Ghats).
              </li>
              <li>
                10m resolution lithology, soil thickness, and antecedent soil-moisture rasters coupled with IMD 15-minute AWS rain-gauge archives.
              </li>
              <li>
                Out-of-fold spatial cross-validation report approved by NDMA / GSI technical committee before enabling ML inference in production.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
