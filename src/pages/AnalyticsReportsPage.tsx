import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Download,
  FileBarChart2,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import { useAppStore } from '../store/useAppStore';
import { carryingCapacity, greedyMatch } from '../utils/scoring';

const HISTORICAL_HAZARD_TREND = [
  { year: '2021', landslides: 28, floods: 34, relocatedHH: 190 },
  { year: '2022', landslides: 31, floods: 29, relocatedHH: 310 },
  { year: '2023', landslides: 42, floods: 38, relocatedHH: 485 },
  { year: '2024', landslides: 37, floods: 41, relocatedHH: 690 },
  { year: '2025', landslides: 46, floods: 44, relocatedHH: 940 },
  { year: '2026 (YTD)', landslides: 19, floods: 22, relocatedHH: 1280 },
];

export const AnalyticsReportsPage: React.FC = () => {
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const householdCases = useAppStore((s) => s.householdCases);
  const incidents = useAppStore((s) => s.incidents);
  const resourceStock = useAppStore((s) => s.resourceStock);
  const weights = useAppStore((s) => s.weights);
  const addToast = useAppStore((s) => s.addToast);

  const ranked = useMemo(
    () => greedyMatch(villages, sites, weights),
    [villages, sites, weights]
  );

  // District-by-District Risk & Capacity Comparison
  const districtComparisonData = useMemo(() => {
    const districts = ['Raigad', 'Ratnagiri', 'Pune', 'Satara', 'Kolhapur'] as const;
    return districts.map((dist) => {
      const distVillages = ranked.filter((r) => r.village.district === dist);
      const redCount = distVillages.filter((r) => r.riskLevel === 'Immediate').length;
      const orangeCount = distVillages.filter(
        (r) => r.riskLevel === 'Short-term'
      ).length;
      const riskHouseholds = distVillages
        .filter((r) => r.riskLevel === 'Immediate' || r.riskLevel === 'Short-term')
        .reduce((s, r) => s + r.village.households, 0);

      const distSites = sites.filter((s) => s.district === dist);
      const safeSlots = distSites.reduce((sum, s) => {
        const cap = carryingCapacity(
          s.usableAreaHa,
          s.landPerHouseholdHa,
          s.waterReliabilityScore,
          s.existingOccupiedHouseholds
        );
        return sum + cap.remainingCapacity;
      }, 0);

      return {
        district: dist,
        redZones: redCount,
        orangeZones: orangeCount,
        riskHouseholds,
        safeCapacitySlots: safeSlots,
      };
    });
  }, [ranked, sites]);

  // Relocation Stage Throughput
  const stageThroughputData = useMemo(() => {
    const stages = [
      'Identified',
      'Approved',
      'Compensation Paid',
      'Site Allotted',
      'Resettled',
    ] as const;
    const colors = ['#DC2626', '#F97316', '#EAB308', '#4F46E5', '#16A34A'];
    return stages.map((st, idx) => ({
      name: st,
      value: householdCases.filter((hc) => hc.status === st).length,
      color: colors[idx],
    }));
  }, [householdCases]);

  const handleDownloadSitRepPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 595, 76, 'F');
    doc.setTextColor(14, 159, 142);
    doc.setFontSize(9);
    doc.text('NIVARAN SEOC / NDMA — EXECUTIVE SITUATION REPORT (SITREP)', 40, 26);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('MONSOON MULTI-HAZARD, INCIDENT & RELOCATION SITUATION REPORT', 40, 46);
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')} • Scope: Western Ghats Division`, 40, 62);

    let y = 106;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('1. District-Wise Red Zone & Host Capacity Summary', 40, y);
    y += 18;
    districtComparisonData.forEach((d) => {
      doc.setFontSize(10);
      doc.text(
        `• ${d.district}: ${d.redZones} Red Zones | ${d.orangeZones} Orange Zones | ${d.riskHouseholds} Risk HH | ${d.safeCapacitySlots} Safe Host Slots`,
        48,
        y
      );
      y += 16;
    });

    y += 16;
    doc.setFontSize(11);
    doc.text('2. Active Incident Command Summary', 40, y);
    y += 18;
    incidents.forEach((inc) => {
      doc.setFontSize(9.5);
      doc.text(
        `• [${inc.code}] ${inc.title} (${inc.villageName}, ${inc.district}) — Status: ${inc.status} | Severity: ${inc.severity}`,
        48,
        y
      );
      y += 15;
    });

    y += 16;
    doc.setFontSize(11);
    doc.text('3. Relocation Pipeline Throughput', 40, y);
    y += 18;
    stageThroughputData.forEach((st) => {
      doc.setFontSize(10);
      doc.text(`• ${st.name}: ${st.value} Household Cases`, 48, y);
      y += 15;
    });

    doc.save(`Nivaran-SEOC-SitRep-${new Date().toISOString().slice(0, 10)}.pdf`);
    addToast({
      title: 'Executive Situation Report (PDF) Generated',
      message: 'Downloaded official SEOC SitRep PDF.',
      type: 'success',
    });
  };

  const handleExportRelocationProgressCsv = () => {
    const csv = Papa.unparse(
      householdCases.map((hc) => ({
        Case_Code: hc.caseCode,
        Head_Of_Household: hc.headOfHousehold,
        Village: hc.villageName,
        District: hc.district,
        Family_Size: hc.familySize,
        Risk_Level: hc.riskLevel,
        Current_Stage: hc.status,
        Assigned_Site: hc.assignedSiteName,
        Plot_Number: hc.plotNumber || 'Pending',
        Sanctioned_INR: hc.compensationSanctionedInr,
        Disbursed_INR: hc.compensationDisbursedInr,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nivaran_relocation_progress_report.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'Relocation Progress CSV Exported',
      message: `Exported ${householdCases.length} household ledger records.`,
      type: 'success',
    });
  };

  const handleExportResourceCsv = () => {
    const csv = Papa.unparse(
      resourceStock.map((r) => ({
        Equipment: r.name,
        Category: r.category,
        District: r.district,
        Warehouse: r.warehouseLocation,
        Available_Qty: r.availableQty,
        Deployed_Qty: r.deployedQty,
        Min_Threshold: r.minThresholdQty,
        Unit: r.unit,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nivaran_resource_utilization_report.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'Resource Utilization CSV Exported',
      message: 'Downloaded IDRN warehouse inventory & deployment report.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & One-Click Report Generators */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E9F8E]">
            <FileBarChart2 className="w-4 h-4" />
            <span>Executive Analytics, SitRep Generator & Audit Exports</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white mt-0.5">
            Multi-District Risk Analytics, Relocation Throughput & Situation Reports
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadSitRepPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white text-xs font-bold shadow-sm min-h-[42px]"
          >
            <FileText className="w-4 h-4" />
            <span>Situation Report (SitRep PDF)</span>
          </button>

          <button
            onClick={handleExportRelocationProgressCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-[#0E9F8E] min-h-[42px]"
          >
            <Download className="w-4 h-4 text-[#0E9F8E]" />
            <span>Relocation Report (CSV)</span>
          </button>

          <button
            onClick={handleExportResourceCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-[#0E9F8E] min-h-[42px]"
          >
            <Download className="w-4 h-4 text-[#4F46E5]" />
            <span>Resource Report (CSV)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0B1F33] text-white text-xs font-bold min-h-[42px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: District-by-District Risk Households vs Available Safe Capacity (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div>
            <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
              District Comparison: At-Risk Households vs. Safe Host Site Capacity
            </h2>
            <p className="text-xs text-slate-500">
              Compares Red + Orange Zone household demand against SPHERE-verified safe
              carrying capacity slots per district
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtComparisonData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="district" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="riskHouseholds"
                  name="At-Risk Households (Red + Orange)"
                  fill="#DC2626"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="safeCapacitySlots"
                  name="Verified Safe Host Slots"
                  fill="#0E9F8E"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Relocation Pipeline Throughput Donut (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div>
            <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
              Relocation Ledger Throughput by Stage
            </h2>
            <p className="text-xs text-slate-500">
              Distribution of tracked families across the 5-stage rehabilitation workflow
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stageThroughputData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={86}
                  paddingAngle={3}
                >
                  {stageThroughputData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3: 6-Year Historical Hazard Events vs Pre-Disaster Relocation Impact */}
      <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
              Multi-Year Western Ghats Hazard Trend vs. Pre-Disaster Households Relocated
            </h2>
            <p className="text-xs text-slate-500">
              Demonstrates how proactive pre-monsoon Red Zone resettlement reduces casualty
              exposure despite rising extreme rainfall events
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Fatalities in Resettled Cohorts (2024–2026)</span>
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={HISTORICAL_HAZARD_TREND}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <RechartsTooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="landslides"
                name="Landslide Events"
                stroke="#DC2626"
                strokeWidth={2.5}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="floods"
                name="Flash Flood Events"
                stroke="#F97316"
                strokeWidth={2.5}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="relocatedHH"
                name="Cumulative Households Safely Relocated"
                stroke="#0E9F8E"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
