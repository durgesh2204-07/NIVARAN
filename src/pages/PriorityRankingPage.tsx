import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Download,
  FileText,
  GitMerge,
  Info,
  SlidersHorizontal,
  Scale,
} from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import { useAppStore } from '../store/useAppStore';
import {
  buildVillageExplainPayload,
  carryingCapacity,
  greedyMatch,
} from '../utils/scoring';
import { RiskBadge } from '../components/RiskBadge';
import { TermTooltip } from '../components/TermTooltip';

export const PriorityRankingPage: React.FC = () => {
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const weights = useAppStore((s) => s.weights);
  const climateHorizon = useAppStore((s) => s.climateHorizon);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const divideBySafeCapacity = useAppStore((s) => s.divideBySafeCapacity);
  const setDivideBySafeCapacity = useAppStore((s) => s.setDivideBySafeCapacity);
  const customOrderIds = useAppStore((s) => s.customOrderIds);
  const moveVillagePriorityOrder = useAppStore((s) => s.moveVillagePriorityOrder);
  const manualSiteOverrides = useAppStore((s) => s.manualSiteOverrides);
  const setManualSiteOverride = useAppStore((s) => s.setManualSiteOverride);
  const planApprovedAt = useAppStore((s) => s.planApprovedAt);
  const approveRelocationPlan = useAppStore((s) => s.approveRelocationPlan);
  const openExplainModal = useAppStore((s) => s.openExplainModal);
  const addToast = useAppStore((s) => s.addToast);
  const user = useAppStore((s) => s.user);

  const [manualMode, setManualMode] = useState(false);

  const ranked = useMemo(
    () =>
      greedyMatch(villages, sites, weights, {
        divideBySafeCapacity,
        climateHorizon,
        extraRainfallMm,
        customOrderIds,
        manualSiteOverrides,
      }),
    [
      villages,
      sites,
      weights,
      divideBySafeCapacity,
      climateHorizon,
      extraRainfallMm,
      customOrderIds,
      manualSiteOverrides,
    ]
  );

  const relocationCandidates = ranked.filter(
    (r) => r.riskLevel === 'Immediate' || r.riskLevel === 'Short-term'
  );

  const handleExportCsv = () => {
    const data = ranked.map((r) => ({
      Rank: r.rank,
      Village: r.village.name,
      Block: r.village.block,
      District: r.village.district,
      Hazard_Score: r.hazardScore.toFixed(3),
      Vulnerability_Score: r.vulnerabilityScore.toFixed(3),
      Priority_Score: r.priorityScore.toFixed(3),
      Risk_Label: r.riskLevel,
      Households: r.village.households,
      Assigned_Relocation_Site: r.primarySiteName,
      Distance_Km: r.distanceKm ?? 0,
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nivaran_priority_relocation_plan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(
      `Exported ${ranked.length} ranked habitations with site allocations to CSV`,
      'success'
    );
  };

  const handleExportPdfOrder = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 595, 76, 'F');
    doc.setTextColor(14, 159, 142);
    doc.setFontSize(9);
    doc.text(
      'NIVARAN - NATIONAL DISASTER RISK, RED ZONE & RELOCATION MANAGEMENT SYSTEM',
      40,
      26
    );
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('OFFICIAL PRE-MONSOON RELOCATION PLAN & SITE ALLOCATION ORDER', 40, 46);
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Order Ref: SDMA/MH/2026/REL-01 • Issued: ${new Date().toLocaleString('en-IN')}`,
      40,
      62
    );

    let y = 104;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(
      `Priority Ranking Schedule (Top 18 Red & Orange Zone Habitations of ${ranked.length} Monitored)`,
      40,
      y
    );
    y += 18;

    ranked.slice(0, 18).forEach((r) => {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, y - 10, 515, 24, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `#${r.rank} ${r.village.name} (${r.village.district}) - ${r.village.households} HH | Priority: ${r.priorityScore.toFixed(
          3
        )} (${r.riskLevel})`,
        46,
        y + 4
      );
      doc.setTextColor(14, 159, 142);
      doc.text(`â†’ ${r.allocatedSiteName} (${r.distanceKm} km)`, 365, y + 4);
      y += 28;
    });

    y = Math.max(y + 24, 710);
    doc.setDrawColor(203, 213, 225);
    doc.line(40, y, 240, y);
    doc.line(335, y, 555, y);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Prepared By: ${user?.name ?? 'State GIS & Risk Cell'}`, 40, y + 14);
    doc.text(
      'Approved By: Relief Commissioner / District Magistrate (DDMA)',
      335,
      y + 14
    );

    doc.save('Nivaran-Official-Relocation-Plan-Order.pdf');
    addToast('Downloaded Official Relocation Plan PDF Order with Signature Block', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action Bar */}
      <div className="bg-white dark:bg-[#101C2C] p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-[#1E3A5F] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-[#172F46] text-[#16A078]">
                Official Relocation Framework
              </span>
              {planApprovedAt ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#16A078] border border-[#16A078]/40">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Officially Approved Government Order
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-[#172F46] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  AI Advisory Recommendation (Pending Approval)
                </span>
              )}
            </div>
            <h1 className="font-heading text-2xl font-extrabold text-[#101C2C] dark:text-white">
              Relocation Priority Planning & Capacity Matching
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Multi-criteria ranking algorithm evaluates hazard exposure and social vulnerability, automatically allocating high-risk households to verified safe-zone plateaus under strict carrying capacity limits.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setManualMode((m) => !m)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all min-h-[38px] cursor-pointer ${
                manualMode
                  ? 'bg-[#101C2C] text-white border-[#101C2C]'
                  : 'bg-slate-50 dark:bg-[#172F46] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#233C57] hover:border-[#16A078]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-[#16A078]" />
              <span>{manualMode ? 'Done Adjusting' : 'Adjust Manually'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-[#16A078] min-h-[38px] shadow-2xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#16A078]" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPdfOrder}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-[#16A078] min-h-[38px] shadow-2xs cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#16A078]" />
              <span>Export Official Order (PDF)</span>
            </button>

            <button
              onClick={() => {
                approveRelocationPlan();
                addToast(
                  'Official Relocation Order signed & logged to immutable audit ledger',
                  'success'
                );
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A078] hover:bg-[#128865] text-white text-xs font-bold shadow-xs transition-all min-h-[38px] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{planApprovedAt ? 'Order Executed ✓' : 'Approve Government Order'}</span>
            </button>
          </div>
        </div>

        {/* Formula & Optional Capacity Scarcity Toggle */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <label className="inline-flex items-center gap-2.5 cursor-pointer font-semibold text-[#0F172A] dark:text-slate-200">
            <input
              type="checkbox"
              checked={divideBySafeCapacity}
              onChange={(e) => setDivideBySafeCapacity(e.target.checked)}
              className="rounded text-[#0E9F8E] focus:ring-[#0E9F8E] w-4 h-4"
            />
            <span>
              Include Regional Safe-Capacity Scarcity Factor (Priority = Hazard ×
              Vulnerability ÷ District Safe Capacity)
            </span>
          </label>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
            <Info className="w-4 h-4 text-[#0E9F8E] shrink-0" />
            <span>
              Greedy Matching: Top-ranked Red Zone fills nearest suitable plateau first;
              overflow cascades to secondary site
            </span>
          </div>
        </div>

        {planApprovedAt && (
          <div className="p-3 rounded-xl bg-[#16A34A]/12 border border-[#16A34A]/35 text-xs text-[#15803D] dark:text-green-300 flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Official SDMA Pre-Monsoon Relocation Plan Approved & Signed on{' '}
              {new Date(planApprovedAt).toLocaleString('en-IN')}
            </span>
            <span className="font-mono text-[11px]">Order Ref: SDMA/MH/2026/REL-01</span>
          </div>
        )}
      </div>

      {/* Sankey-Style Flow Visual of Village -> Site Allocations */}
      <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-[#0E9F8E]" />
            <div>
              <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                Greedy Allocation Flow: High-Risk Habitations → Safe Rehabilitation Sites
              </h2>
              <p className="text-xs text-slate-500">
                Visualizes how top-ranked Red & Orange Zone households fill available safe
                carrying capacity across districts
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#0E9F8E]">
            {relocationCandidates.length} Settlements Matched to Safe Sites
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {relocationCandidates.slice(0, 9).map((item) => (
            <div
              key={item.village.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#0B1F33] text-white font-bold flex items-center justify-center tabular-nums">
                    #{item.rank}
                  </span>
                  <div>
                    <div className="font-bold text-[#0F172A] dark:text-white">
                      {item.village.name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.village.district} • {item.village.households} Households
                    </div>
                  </div>
                </div>
                <RiskBadge
                  level={item.riskLevel}
                  score={item.priorityScore}
                  size="sm"
                  showLabel={false}
                />
              </div>

              {/* Flow bar */}
              <div className="space-y-1.5">
                {item.allocations.map((alloc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#11253A] border border-[#0E9F8E]/30"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <ArrowRight className="w-3.5 h-3.5 text-[#0E9F8E] shrink-0" />
                      <span className="font-semibold text-[#0F172A] dark:text-slate-100 truncate">
                        {alloc.siteName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#0E9F8E]/15 text-[#0E9F8E] font-bold tabular-nums shrink-0">
                      {alloc.allocatedHouseholds} HH
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Ranked Relocation Table */}
      <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
            Complete Priority Ranking & Site Allocation Schedule ({ranked.length} Habitations)
          </h2>
          {manualMode && (
            <span className="text-xs font-semibold text-[#16A078]">
              Manual Adjustment Mode Active: Use ↑/↓ arrows to reorder rank or reassign target site
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0A1624] text-slate-500 uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Village & District</th>
                <th className="py-3.5 px-3">Hazard Score</th>
                <th className="py-3.5 px-3">Vulnerability</th>
                <th className="py-3.5 px-3">Priority Score</th>
                <th className="py-3.5 px-3">Risk Label</th>
                <th className="py-3.5 px-3">Households</th>
                <th className="py-3.5 px-4">Assigned Relocation Site (Greedy Match)</th>
                <th className="py-3.5 px-4 text-right">Explain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 tabular-nums">
              {ranked.map((row) => {
                const currentIdsOrder = ranked.map((r) => r.village.id);
                return (
                  <tr
                    key={row.village.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#0A1624]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-7 h-7 rounded-lg bg-[#0B1F33] text-white font-bold flex items-center justify-center">
                          #{row.rank}
                        </span>
                        {manualMode && (
                          <div className="flex flex-col">
                            <button
                              onClick={() =>
                                moveVillagePriorityOrder(
                                  row.village.id,
                                  'up',
                                  currentIdsOrder
                                )
                              }
                              className="p-0.5 hover:text-[#0E9F8E]"
                              title="Move rank up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                moveVillagePriorityOrder(
                                  row.village.id,
                                  'down',
                                  currentIdsOrder
                                )
                              }
                              className="p-0.5 hover:text-[#0E9F8E]"
                              title="Move rank down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F172A] dark:text-white">
                        {row.village.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {row.village.taluka}, {row.village.district}, {row.village.state || 'Maharashtra'} •{' '}
                        <span className="uppercase">{row.village.primaryHazard}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold">
                      {row.hazardScore.toFixed(3)}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-600 dark:text-slate-300">
                      {row.vulnerabilityScore.toFixed(3)}
                    </td>

                    <td className="py-3 px-3 font-extrabold text-[#4F46E5] text-sm">
                      {row.priorityScore.toFixed(3)}
                    </td>

                    <td className="py-3 px-3">
                      <RiskBadge level={row.riskLevel} size="sm" />
                    </td>

                    <td className="py-3 px-3 font-bold">
                      {row.village.households} HH
                    </td>

                    <td className="py-3 px-4">
                      {manualMode ? (
                        <select
                          value={manualSiteOverrides[row.village.id] || ''}
                          onChange={(e) =>
                            setManualSiteOverride(row.village.id, e.target.value)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                        >
                          <option value="">Auto Greedy Match ({row.primarySiteName})</option>
                          {sites.map((s) => {
                            const cap = carryingCapacity(
                              s.usableAreaHa,
                              s.landPerHouseholdHa,
                              s.waterReliabilityScore,
                              s.existingOccupiedHouseholds
                            );
                            return (
                              <option key={s.id} value={s.id}>
                                {s.name} ({cap.remainingCapacity} slots)
                              </option>
                            );
                          })}
                        </select>
                      ) : (
                        <span
                          className={`font-semibold ${
                            row.allocations.length > 0
                              ? 'text-[#0E9F8E]'
                              : 'text-slate-400'
                          }`}
                        >
                          {row.primarySiteName}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() =>
                          openExplainModal(
                            buildVillageExplainPayload(
                              row.village,
                              weights,
                              row.rank,
                              climateHorizon,
                              extraRainfallMm
                            )
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0E9F8E]/15 text-[#0E9F8E] hover:bg-[#0E9F8E] hover:text-white font-bold transition-colors"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Explain</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

