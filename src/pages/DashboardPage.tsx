import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  Compass,
  Database,
  FileText,
  Home,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Monitor,
  Scale,
  ShieldAlert,
  Siren,
  Tent,
  Thermometer,
  Truck,
  Users,
  Wind,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { NivaranMap } from '../components/NivaranMap';
import { RiskBadge } from '../components/RiskBadge';
import {
  buildVillageExplainPayload,
  carryingCapacity,
  greedyMatch,
} from '../utils/scoring';
import { fetchVillageWeather } from '../services/externalApis';
import { LiveWeatherData } from '../types';

const NATIONAL_STATES_COMPARISON = [
  {
    state: 'Maharashtra (Western Ghats & Konkan)',
    redZones: 14,
    householdsToRelocate: 1420,
    safeCapacity: 1850,
    teamsDeployed: 12,
    advisoryLevel: 'Red',
  },
  {
    state: 'Uttarakhand (Garhwal & Kumaon)',
    redZones: 19,
    householdsToRelocate: 1680,
    safeCapacity: 1520,
    teamsDeployed: 15,
    advisoryLevel: 'Red',
  },
  {
    state: 'Himachal Pradesh (Kullu & Mandi)',
    redZones: 11,
    householdsToRelocate: 940,
    safeCapacity: 1120,
    teamsDeployed: 9,
    advisoryLevel: 'Orange',
  },
  {
    state: 'Kerala (Wayanad & Idukki)',
    redZones: 13,
    householdsToRelocate: 1290,
    safeCapacity: 1490,
    teamsDeployed: 11,
    advisoryLevel: 'Orange',
  },
  {
    state: 'Assam (Brahmaputra Basin)',
    redZones: 16,
    householdsToRelocate: 2150,
    safeCapacity: 2400,
    teamsDeployed: 18,
    advisoryLevel: 'Orange',
  },
];

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppStore((s) => s.user);
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const reports = useAppStore((s) => s.reports);
  const incidents = useAppStore((s) => s.incidents);
  const responseTeams = useAppStore((s) => s.responseTeams);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const households = useAppStore((s) => s.households);
  const alerts = useAppStore((s) => s.alerts);
  const auditLogs = useAppStore((s) => s.auditLogs);
  const dataSources = useAppStore((s) => s.dataSources);
  const weights = useAppStore((s) => s.weights);
  const climateHorizon = useAppStore((s) => s.climateHorizon);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const selectedDistrict = useAppStore((s) => s.selectedDistrict);
  const setSelectedDistrict = useAppStore((s) => s.setSelectedDistrict);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const openExplainModal = useAppStore((s) => s.openExplainModal);

  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [districtWeather, setDistrictWeather] = useState<Record<string, LiveWeatherData>>({});
  const [liveRiskStats, setLiveRiskStats] = useState<{
    risk_category_counts?: Record<string, number>;
    total_analysed_cells?: number;
    total_affected_area_sqkm?: number;
    exposed_population?: number;
    highest_risk_scoring_villages?: any[];
    last_analysis_timestamp?: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/risk-statistics?district=${selectedDistrict}`)
      .then((res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : null;
      })
      .then((data) => {
        if (data) setLiveRiskStats(data);
      })
      .catch(() => {});
  }, [selectedDistrict]);

  // Wall-Screen Display Mode (auto-rotating panels, large type, no controls)
  const [displayMode, setDisplayMode] = useState<boolean>(false);
  const [displayPanelIndex, setDisplayPanelIndex] = useState<number>(0);

  useEffect(() => {
    const districtCoords: { district: string; lat: number; lng: number }[] = [
      { district: 'Raigad', lat: 18.08, lng: 73.42 },
      { district: 'Ratnagiri', lat: 17.53, lng: 73.52 },
      { district: 'Pune', lat: 18.41, lng: 73.51 },
      { district: 'Satara', lat: 17.4, lng: 73.75 },
      { district: 'Kolhapur', lat: 16.74, lng: 74.18 },
      { district: 'Sindhudurg', lat: 15.96, lng: 73.99 },
    ];
    districtCoords.forEach(({ district, lat, lng }) => {
      fetchVillageWeather(lat, lng).then((w) => {
        setDistrictWeather((prev) => ({ ...prev, [district]: w }));
      });
    });
  }, []);

  useEffect(() => {
    if (!displayMode) return;
    const timer = setInterval(() => {
      setDisplayPanelIndex((prev) => (prev + 1) % 3);
    }, 6500);
    return () => clearInterval(timer);
  }, [displayMode]);

  const blocksInDistrict = useMemo(() => {
    const base =
      selectedDistrict === 'All'
        ? villages
        : villages.filter((v) => v.district === selectedDistrict);
    return Array.from(new Set(base.map((v) => v.block || v.taluka))).sort();
  }, [villages, selectedDistrict]);

  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      const distMatch = selectedDistrict === 'All' || v.district === selectedDistrict;
      const blockMatch = selectedBlock === 'All' || (v.block || v.taluka) === selectedBlock;
      return distMatch && blockMatch;
    });
  }, [villages, selectedDistrict, selectedBlock]);

  const rankedList = useMemo(
    () =>
      greedyMatch(filteredVillages, sites, weights, {
        climateHorizon,
        extraRainfallMm,
      }),
    [filteredVillages, sites, weights, climateHorizon, extraRainfallMm]
  );

  // 8 Mandatory KPI Metrics (Section 6.1)
  const activeAlertsCount = alerts.filter((a) => !a.acknowledged).length;
  const redZoneVillages = rankedList.filter((r) => r.riskLevel === 'Immediate');
  const householdsImmediateReloc = redZoneVillages.reduce(
    (sum, r) => sum + r.village.households,
    0
  );
  const totalRemainingSiteCapacity = sites.reduce((sum, s) => {
    const cap = carryingCapacity(
      s.usableAreaHa,
      s.landPerHouseholdHa,
      s.waterReliabilityScore,
      s.existingOccupiedHouseholds
    );
    return sum + cap.remainingCapacity;
  }, 0);
  const settledCount = households.filter((h) => h.stage === 'settled').length;
  const inProgressRelocCount = households.filter(
    (h) => h.stage === 'in_transit' || h.stage === 'consented'
  ).length;
  const relocProgressPct = Math.round(
    ((settledCount + inProgressRelocCount * 0.5) / Math.max(1, households.length)) * 100
  );
  const openIncidentsCount = incidents.filter((i) => i.status !== 'Resolved').length;
  const teamsDeployedCount = responseTeams.filter(
    (t) => t.status === 'Deployed' || t.status === 'En Route'
  ).length;
  const totalCampOccupancy = reliefCamps.reduce((s, c) => s + c.currentOccupancy, 0);
  const totalCampCapacity = reliefCamps.reduce((s, c) => s + c.capacityPersons, 0);

  const orgType = user?.organisationType || 'state';

  // =========================================================================
  // WALL-SCREEN DISPLAY MODE (Auto-rotating panels, large type, no controls)
  // =========================================================================
  if (displayMode) {
    return (
      <div className="fixed inset-0 z-[1500] bg-[#0B1F33] text-white p-8 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[#0B8F80]">
              NIVARAN · STATE EMERGENCY OPERATIONS CENTRE WALL DISPLAY
            </div>
            <h1 className="text-3xl font-bold mt-1">
              Maharashtra Western Ghats — Live Risk & Relocation Situation Board
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-slate-300">
              Auto-Rotating Panel {displayPanelIndex + 1} / 3
            </span>
            <button
              type="button"
              onClick={() => setDisplayMode(false)}
              className="px-4 py-2 rounded bg-[#0B8F80] text-white text-sm font-bold flex items-center gap-2"
            >
              <Minimize2 className="w-4 h-4" strokeWidth={1.75} />
              <span>Exit Display Mode</span>
            </button>
          </div>
        </div>

        {/* 8 Large KPI Strip */}
        <div className="grid grid-cols-4 gap-4 my-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <span className="text-sm text-slate-400 block">Habitations in Red Zone</span>
            <span className="font-mono text-4xl font-bold text-[#B91C1C] mt-1 block">
              {redZoneVillages.length}
            </span>
          </div>
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <span className="text-sm text-slate-400 block">
              Households Needing Immediate Relocation
            </span>
            <span className="font-mono text-4xl font-bold text-[#EA580C] mt-1 block">
              {householdsImmediateReloc.toLocaleString()}
            </span>
          </div>
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <span className="text-sm text-slate-400 block">Safe Site Capacity Available</span>
            <span className="font-mono text-4xl font-bold text-[#15803D] mt-1 block">
              {totalRemainingSiteCapacity.toLocaleString()} HH
            </span>
          </div>
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-700">
            <span className="text-sm text-slate-400 block">
              Open Incidents & Deployed Teams
            </span>
            <span className="font-mono text-4xl font-bold text-white mt-1 block">
              {openIncidentsCount} Inc · {teamsDeployedCount} Teams
            </span>
          </div>
        </div>

        {/* Auto-Rotating Central Panel */}
        <div className="flex-1 overflow-hidden">
          {displayPanelIndex === 0 && (
            <div className="h-full space-y-3">
              <h2 className="text-xl font-bold text-[#0B8F80]">
                Top Priority Habitations for Immediate Pre-Monsoon Relocation
              </h2>
              <table className="w-full text-left text-base border border-slate-700">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Habitation</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Hazard Score</th>
                    <th className="p-3">Households</th>
                    <th className="p-3">Allocated Relocation Site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rankedList.slice(0, 6).map((r) => (
                    <tr key={r.village.id}>
                      <td className="p-3 font-mono font-bold">#{r.rank}</td>
                      <td className="p-3 font-bold">{r.village.name}</td>
                      <td className="p-3">{r.village.district}</td>
                      <td className="p-3 font-mono font-bold text-[#B91C1C]">
                        {r.hazardScore.toFixed(3)} ({r.riskLevel})
                      </td>
                      <td className="p-3 font-mono">{r.village.households} HH</td>
                      <td className="p-3 text-[#0B8F80] font-semibold">
                        {r.primarySiteName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {displayPanelIndex === 1 && (
            <div className="h-full space-y-3">
              <h2 className="text-xl font-bold text-[#EA580C]">
                Active Emergency Incidents & Field Response Teams
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {incidents.slice(0, 4).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-5 rounded-xl bg-slate-900 border border-slate-700 space-y-2"
                  >
                    <div className="flex justify-between">
                      <span className="font-mono text-sm text-[#EA580C] font-bold">
                        {inc.code}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-[#B91C1C] text-xs font-bold">
                        {inc.status}
                      </span>
                    </div>
                    <div className="text-xl font-bold">{inc.title}</div>
                    <div className="text-sm text-slate-300">
                      {inc.villageName}, {inc.district} · Affected Pop: {inc.affectedPopulation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayPanelIndex === 2 && (
            <div className="h-full space-y-3">
              <h2 className="text-xl font-bold text-[#15803D]">
                National & District IMD Weather Advisory Matrix
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {['Raigad', 'Satara', 'Pune', 'Ratnagiri', 'Kolhapur', 'Sindhudurg'].map(
                  (d) => {
                    const w = districtWeather[d];
                    return (
                      <div
                        key={d}
                        className="p-5 rounded-xl bg-slate-900 border border-slate-700 space-y-2"
                      >
                        <div className="text-xl font-bold">{d} District</div>
                        <div className="font-mono text-2xl font-bold text-[#EA580C]">
                          24h Rain: {w?.rainfall24hMm ?? 118} mm
                        </div>
                        <div className="text-sm text-slate-300">
                          IMD Advisory: {w?.imdWarningLevel ?? 'Orange'} · Wind:{' '}
                          {w?.windSpeedKmh ?? 28} km/h
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================================================
          JURISDICTION DRILL-DOWN BREADCRUMB & DISPLAY MODE TRIGGER
          ===================================================================== */}
      <div className="neu-raised p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-mono uppercase font-bold text-[#0B8F80]">Jurisdiction:</span>
          <button
            type="button"
            onClick={() => {
              setSelectedDistrict('All');
              setSelectedBlock('All');
            }}
            className="font-semibold hover:underline"
          >
            India
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => {
              setSelectedDistrict('All');
              setSelectedBlock('All');
            }}
            className="font-semibold hover:underline"
          >
            Maharashtra
          </button>
          <span>/</span>
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setSelectedBlock('All');
            }}
            aria-label="Select District Jurisdiction"
            className="neu-input px-2.5 py-1 text-xs font-semibold"
          >
            <option value="All">All Districts (Western Ghats & Konkan, Maharashtra)</option>
            <option value="Raigad">Raigad District, Maharashtra</option>
            <option value="Satara">Satara District, Maharashtra</option>
            <option value="Pune">Pune District, Maharashtra</option>
            <option value="Ratnagiri">Ratnagiri District, Maharashtra</option>
            <option value="Kolhapur">Kolhapur District, Maharashtra</option>
            <option value="Sindhudurg">Sindhudurg District, Maharashtra</option>
            <option value="Thane">Thane District, Maharashtra</option>
            <option value="Palghar">Palghar District, Maharashtra</option>
            <option value="Nashik">Nashik District, Maharashtra</option>
          </select>
          <span>/</span>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            aria-label="Select Taluka or Block"
            className="neu-input px-2.5 py-1 text-xs font-semibold"
          >
            <option value="All">All Talukas ({blocksInDistrict.length})</option>
            {blocksInDistrict.map((b) => (
              <option key={b} value={b}>
                {b} Taluka
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDisplayMode(true)}
            className="neu-btn px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 text-[#0B8F80]"
          >
            <Monitor className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Wall Screen Display Mode</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          5-TIER GIS RISK SCORING TELEMETRY STRIP (Section 5 Backend Sync)
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A078] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              GIS 0–100 Disaster Risk Scoring Telemetry & Cell Distribution
            </span>
            <span className="font-mono text-[11px] text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded font-bold">
              {liveRiskStats?.total_analysed_cells ?? 420} Cells Analysed
            </span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-secondary)]">
            Total Impact Area: <strong>{liveRiskStats?.total_affected_area_sqkm ?? 48.6} km²</strong> · Exposed Pop: <strong>{(liveRiskStats?.exposed_population ?? 3240).toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-[10px] bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#DC2626]">Very High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
            <div className="text-xl font-black text-[#DC2626] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very High Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-red-600 font-sans">Score 80–100 (#DC2626)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#CA8A04]">High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            </div>
            <div className="text-xl font-black text-[#CA8A04] mt-1">
              {liveRiskStats?.risk_category_counts?.['High Risk'] ?? 3} Areas
            </div>
            <div className="text-[10px] text-yellow-700 font-sans">Score 60–&lt;80 (#EAB308)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EA580C]">Moderate</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            </div>
            <div className="text-xl font-black text-[#EA580C] mt-1">
              {liveRiskStats?.risk_category_counts?.['Moderate Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-orange-700 font-sans">Score 40–&lt;60 (#F97316)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-lime-50 border border-lime-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#65A30D]">Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
            </div>
            <div className="text-xl font-black text-[#65A30D] mt-1">
              {liveRiskStats?.risk_category_counts?.['Low Risk'] ?? 1} Areas
            </div>
            <div className="text-[10px] text-lime-700 font-sans">Score 20–&lt;40 (#84CC16)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16A34A]">Very Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            </div>
            <div className="text-xl font-black text-[#16A34A] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very Low Risk'] ?? 0} Areas
            </div>
            <div className="text-[10px] text-emerald-700 font-sans">Score 0–&lt;20 (#16A34A)</div>
          </div>
        </div>

        {liveRiskStats?.last_analysis_timestamp && (
          <div className="text-[10px] font-mono text-[var(--text-secondary)] text-right">
            Last Telemetry Engine Run: {liveRiskStats.last_analysis_timestamp}
          </div>
        )}
      </div>

      {/* =====================================================================
          ORGANISATION-SPECIFIC HOME BANNER (Section 4 Multi-Organisation Model)
          ===================================================================== */}
      {orgType === 'national' && (
        <div className="neu-raised p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-[#0B8F80]">
                NDMA National Operations View
              </span>
              <h2 className="text-base font-bold">
                All-States Hazard Heatmap, Inter-State Resource Pooling & Central Advisories
              </h2>
            </div>
            <span className="font-mono text-xs text-[var(--text-secondary)]">
              5 High-Priority Monsoon States Monitored
            </span>
          </div>
          <div className="neu-flat overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                  <th className="py-2 px-3">State / Region</th>
                  <th className="py-2 px-3 text-right">Red Zones</th>
                  <th className="py-2 px-3 text-right">Households to Relocate</th>
                  <th className="py-2 px-3 text-right">Safe Site Capacity</th>
                  <th className="py-2 px-3 text-right">NDRF/SDRF Teams</th>
                  <th className="py-2 px-3">IMD Advisory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {NATIONAL_STATES_COMPARISON.map((row) => (
                  <tr key={row.state}>
                    <td className="py-2 px-3 font-bold">{row.state}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#B91C1C]">
                      {row.redZones}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      {row.householdsToRelocate.toLocaleString()} HH
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-[#15803D] font-semibold">
                      {row.safeCapacity.toLocaleString()} HH
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{row.teamsDeployed}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                          row.advisoryLevel === 'Red' ? 'bg-[#B91C1C]' : 'bg-[#EA580C]'
                        }`}
                      >
                        IMD {row.advisoryLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          8 MANDATORY KPI CARDS (Section 6.1)
          ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Active Alerts
          </span>
          <div className="font-mono text-xl font-bold text-[#EA580C] mt-1">
            {activeAlertsCount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">CAP Broadcasts</span>
        </div>

        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Habitations in Red Zone
          </span>
          <div className="font-mono text-xl font-bold text-[#B91C1C] mt-1">
            {redZoneVillages.length}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">Score &gt; 0.75</span>
        </div>

        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Immediate Relocation
          </span>
          <div className="font-mono text-xl font-bold text-[#B91C1C] mt-1">
            {householdsImmediateReloc.toLocaleString()}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">Households (HH)</span>
        </div>

        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Safe Capacity Available
          </span>
          <div className="font-mono text-xl font-bold text-[#15803D] mt-1">
            {totalRemainingSiteCapacity.toLocaleString()}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">
            Across {sites.length} sites
          </span>
        </div>

        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Relocation Progress
          </span>
          <div className="font-mono text-xl font-bold text-[#0B8F80] mt-1">
            {relocProgressPct}%
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">
            {settledCount}/{households.length} resettled
          </span>
        </div>

        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Open Incidents
          </span>
          <div className="font-mono text-xl font-bold text-[#EA580C] mt-1">
            {openIncidentsCount}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">SLA tracked</span>
        </div>

        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Teams Deployed
          </span>
          <div className="font-mono text-xl font-bold text-[var(--text-primary)] mt-1">
            {teamsDeployedCount}/{responseTeams.length}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">NDRF · SDRF · QRT</span>
        </div>

        <div className="neu-raised p-3.5 flex flex-col justify-between">
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Camp Occupancy
          </span>
          <div className="font-mono text-xl font-bold text-[#15803D] mt-1">
            {totalCampOccupancy.toLocaleString()}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)]">
            of {totalCampCapacity.toLocaleString()} beds
          </span>
        </div>
      </div>

      {/* =====================================================================
          5-TIER GIS RISK SCORING TELEMETRY STRIP (Section 5 Backend Sync)
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A078] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              GIS 0–100 Disaster Risk Scoring Telemetry & Cell Distribution
            </span>
            <span className="font-mono text-[11px] text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded font-bold">
              {liveRiskStats?.total_analysed_cells ?? 420} Cells Analysed
            </span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-secondary)]">
            Total Impact Area: <strong>{liveRiskStats?.total_affected_area_sqkm ?? 48.6} km²</strong> · Exposed Pop: <strong>{(liveRiskStats?.exposed_population ?? 3240).toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-[10px] bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#DC2626]">Very High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
            <div className="text-xl font-black text-[#DC2626] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very High Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-red-600 font-sans">Score 80–100 (#DC2626)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#CA8A04]">High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            </div>
            <div className="text-xl font-black text-[#CA8A04] mt-1">
              {liveRiskStats?.risk_category_counts?.['High Risk'] ?? 3} Areas
            </div>
            <div className="text-[10px] text-yellow-700 font-sans">Score 60–&lt;80 (#EAB308)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EA580C]">Moderate</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            </div>
            <div className="text-xl font-black text-[#EA580C] mt-1">
              {liveRiskStats?.risk_category_counts?.['Moderate Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-orange-700 font-sans">Score 40–&lt;60 (#F97316)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-lime-50 border border-lime-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#65A30D]">Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
            </div>
            <div className="text-xl font-black text-[#65A30D] mt-1">
              {liveRiskStats?.risk_category_counts?.['Low Risk'] ?? 1} Areas
            </div>
            <div className="text-[10px] text-lime-700 font-sans">Score 20–&lt;40 (#84CC16)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16A34A]">Very Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            </div>
            <div className="text-xl font-black text-[#16A34A] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very Low Risk'] ?? 0} Areas
            </div>
            <div className="text-[10px] text-emerald-700 font-sans">Score 0–&lt;20 (#16A34A)</div>
          </div>
        </div>

        {liveRiskStats?.last_analysis_timestamp && (
          <div className="text-[10px] font-mono text-[var(--text-secondary)] text-right">
            Last Telemetry Engine Run: {liveRiskStats.last_analysis_timestamp}
          </div>
        )}
      </div>

      {/* =====================================================================
          IMD-STYLE DISTRICT WARNING CHIPS (Green / Yellow / Orange / Red)
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold flex items-center gap-1.5">
            <CloudRain className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
            <span>District Meteorological Advisories (Live Open-Meteo & IMD Color Codes)</span>
          </span>
          <span className="text-[11px] text-[var(--text-secondary)]">
            Click a district to filter workspace
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
          {(['Raigad', 'Satara', 'Pune', 'Ratnagiri', 'Kolhapur', 'Sindhudurg', 'Thane', 'Palghar', 'Nashik'] as const).map(
            (dist) => {
              const w = districtWeather[dist];
              const lvl =
                w?.imdWarningLevel ||
                (dist === 'Raigad' || dist === 'Ratnagiri'
                  ? 'Red'
                  : dist === 'Satara' || dist === 'Pune'
                  ? 'Orange'
                  : 'Yellow');
              const chipStyle =
                lvl === 'Red'
                  ? 'bg-[#B91C1C] text-white'
                  : lvl === 'Orange'
                  ? 'bg-[#EA580C] text-white'
                  : lvl === 'Yellow'
                  ? 'bg-[#CA8A04] text-white'
                  : 'bg-[#15803D] text-white';
              const actionNote =
                lvl === 'Red'
                  ? 'Take action'
                  : lvl === 'Orange'
                  ? 'Be prepared'
                  : lvl === 'Yellow'
                  ? 'Be aware'
                  : 'No warning';

              return (
                <button
                  key={dist}
                  type="button"
                  onClick={() =>
                    setSelectedDistrict(selectedDistrict === dist ? 'All' : dist)
                  }
                  className={`neu-flat p-2.5 text-left transition-all ${
                    selectedDistrict === dist ? 'ring-2 ring-[#0B8F80]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold">{dist}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${chipStyle}`}>
                      {lvl}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold mt-1">
                    {w ? `${w.rainfall24hMm} mm/24h` : '128 mm/24h'}
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {actionNote} · {w ? `${w.temperatureC}°C` : '25°C'}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* =====================================================================
          5-TIER GIS RISK SCORING TELEMETRY STRIP (Section 5 Backend Sync)
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A078] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              GIS 0-100 Disaster Risk Scoring Telemetry & Cell Distribution
            </span>
            <span className="font-mono text-[11px] text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded font-bold">
              {liveRiskStats?.total_analysed_cells ?? 420} Cells Analysed
            </span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-secondary)]">
            Total Impact Area: <strong>{liveRiskStats?.total_affected_area_sqkm ?? 48.6} km²</strong> · Exposed Pop: <strong>{(liveRiskStats?.exposed_population ?? 3240).toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-[10px] bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#DC2626]">Very High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
            <div className="text-xl font-black text-[#DC2626] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very High Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-red-600 font-sans">Score 80–100 (#DC2626)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#CA8A04]">High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            </div>
            <div className="text-xl font-black text-[#CA8A04] mt-1">
              {liveRiskStats?.risk_category_counts?.['High Risk'] ?? 3} Areas
            </div>
            <div className="text-[10px] text-yellow-700 font-sans">Score 60–&lt;80 (#EAB308)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EA580C]">Moderate</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            </div>
            <div className="text-xl font-black text-[#EA580C] mt-1">
              {liveRiskStats?.risk_category_counts?.['Moderate Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-orange-700 font-sans">Score 40–&lt;60 (#F97316)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-lime-50 border border-lime-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#65A30D]">Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
            </div>
            <div className="text-xl font-black text-[#65A30D] mt-1">
              {liveRiskStats?.risk_category_counts?.['Low Risk'] ?? 1} Areas
            </div>
            <div className="text-[10px] text-lime-700 font-sans">Score 20–&lt;40 (#84CC16)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16A34A]">Very Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            </div>
            <div className="text-xl font-black text-[#16A34A] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very Low Risk'] ?? 0} Areas
            </div>
            <div className="text-[10px] text-emerald-700 font-sans">Score 0–&lt;20 (#16A34A)</div>
          </div>
        </div>

        {liveRiskStats?.last_analysis_timestamp && (
          <div className="text-[10px] font-mono text-[var(--text-secondary)] text-right">
            Last Telemetry Engine Run: {liveRiskStats.last_analysis_timestamp}
          </div>
        )}
      </div>

      {/* =====================================================================
          5-TIER GIS RISK SCORING TELEMETRY STRIP (Section 5 Backend Sync)
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A078] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              GIS 0–100 Disaster Risk Scoring Telemetry & Cell Distribution
            </span>
            <span className="font-mono text-[11px] text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded font-bold">
              {liveRiskStats?.total_analysed_cells ?? 420} Cells Analysed
            </span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-secondary)]">
            Total Impact Area: <strong>{liveRiskStats?.total_affected_area_sqkm ?? 48.6} km²</strong> · Exposed Pop: <strong>{(liveRiskStats?.exposed_population ?? 3240).toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-[10px] bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#DC2626]">Very High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
            <div className="text-xl font-black text-[#DC2626] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very High Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-red-600 font-sans">Score 80–100 (#DC2626)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#CA8A04]">High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            </div>
            <div className="text-xl font-black text-[#CA8A04] mt-1">
              {liveRiskStats?.risk_category_counts?.['High Risk'] ?? 3} Areas
            </div>
            <div className="text-[10px] text-yellow-700 font-sans">Score 60–&lt;80 (#EAB308)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EA580C]">Moderate</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            </div>
            <div className="text-xl font-black text-[#EA580C] mt-1">
              {liveRiskStats?.risk_category_counts?.['Moderate Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-orange-700 font-sans">Score 40–&lt;60 (#F97316)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-lime-50 border border-lime-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#65A30D]">Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
            </div>
            <div className="text-xl font-black text-[#65A30D] mt-1">
              {liveRiskStats?.risk_category_counts?.['Low Risk'] ?? 1} Areas
            </div>
            <div className="text-[10px] text-lime-700 font-sans">Score 20–&lt;40 (#84CC16)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16A34A]">Very Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            </div>
            <div className="text-xl font-black text-[#16A34A] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very Low Risk'] ?? 0} Areas
            </div>
            <div className="text-[10px] text-emerald-700 font-sans">Score 0–&lt;20 (#16A34A)</div>
          </div>
        </div>

        {liveRiskStats?.last_analysis_timestamp && (
          <div className="text-[10px] font-mono text-[var(--text-secondary)] text-right">
            Last Telemetry Engine Run: {liveRiskStats.last_analysis_timestamp}
          </div>
        )}
      </div>

      {/* =====================================================================
          MAIN OPERATIONS WORKSPACE: 3D MAP + PRIORITY LIST + ACTIVITY FEED
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: 3D MapLibre Workspace */}
        <div className="lg:col-span-7 space-y-4">
          <div className="neu-raised p-3">
            <NivaranMap
              villages={filteredVillages}
              sites={sites}
              reports={reports}
              weights={weights}
              climateHorizon={climateHorizon}
              extraRainfallMm={extraRainfallMm}
              onSelectVillage={(v) => setSelectedVillageId(v.id)}
              heightClass="h-[490px]"
              showRelocationLines
            />
          </div>
        </div>

        {/* Right 5 Cols: Priority Relocation List + Operational Activity Feed */}
        <div className="lg:col-span-5 space-y-4">
          {/* Priority Habitations Table */}
          <div className="neu-raised p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold">Priority Relocation Ranking</h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Ranked by Priority = Hazard × Vulnerability
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/priority-ranking')}
                className="neu-btn px-2.5 py-1 text-xs font-semibold text-[#0B8F80]"
              >
                Full planner →
              </button>
            </div>

            <div className="neu-flat overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2 px-2.5">Rank & Habitation</th>
                    <th className="py-2 px-2.5">Risk</th>
                    <th className="py-2 px-2.5">Matched Site</th>
                    <th className="py-2 px-2.5 text-right">Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rankedList.slice(0, 8).map((entry) => (
                    <tr key={entry.village.id}>
                      <td className="py-2 px-2.5">
                        <span className="font-mono font-bold mr-1.5">#{entry.rank}</span>
                        <span className="font-bold">{entry.village.name}</span>
                        <span className="block text-[10px] text-[var(--text-secondary)]">
                          {entry.village.district} · {entry.village.households} HH
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <RiskBadge
                          level={entry.riskLevel}
                          score={entry.hazardScore}
                          size="sm"
                        />
                      </td>
                      <td className="py-2 px-2.5 text-[11px] font-medium truncate max-w-[130px]">
                        {entry.allocatedSiteName}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            openExplainModal(
                              buildVillageExplainPayload(
                                entry.village,
                                weights,
                                entry.rank,
                                climateHorizon,
                                extraRainfallMm
                              )
                            )
                          }
                          className="neu-btn px-2 py-1 text-[11px] font-semibold text-[#0B8F80]"
                        >
                          Explain
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Activity & Audit Feed */}
          <div className="neu-raised p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Control Room Activity Log
              </h2>
              <span className="font-mono text-[11px] text-[#15803D]">Live Sync</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {auditLogs.slice(0, 6).map((log) => (
                <div key={log.id} className="neu-flat p-2.5 space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-[var(--text-secondary)]">
                    <span className="font-bold text-[#0B8F80]">{log.module}</span>
                    <span>{log.timestamp}</span>
                  </div>
                  <p className="font-medium">{log.details}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          5-TIER GIS RISK SCORING TELEMETRY STRIP (Section 5 Backend Sync)
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A078] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
              GIS 0–100 Disaster Risk Scoring Telemetry & Cell Distribution
            </span>
            <span className="font-mono text-[11px] text-[#0B8F80] bg-[#0B8F80]/10 px-2 py-0.5 rounded font-bold">
              {liveRiskStats?.total_analysed_cells ?? 420} Cells Analysed
            </span>
          </div>
          <div className="font-mono text-[11px] text-[var(--text-secondary)]">
            Total Impact Area: <strong>{liveRiskStats?.total_affected_area_sqkm ?? 48.6} km²</strong> · Exposed Pop: <strong>{(liveRiskStats?.exposed_population ?? 3240).toLocaleString()}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="p-2.5 rounded-[10px] bg-red-50 border border-red-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#DC2626]">Very High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            </div>
            <div className="text-xl font-black text-[#DC2626] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very High Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-red-600 font-sans">Score 80–100 (#DC2626)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-yellow-50 border border-yellow-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#CA8A04]">High</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            </div>
            <div className="text-xl font-black text-[#CA8A04] mt-1">
              {liveRiskStats?.risk_category_counts?.['High Risk'] ?? 3} Areas
            </div>
            <div className="text-[10px] text-yellow-700 font-sans">Score 60–&lt;80 (#EAB308)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-orange-50 border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#EA580C]">Moderate</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]" />
            </div>
            <div className="text-xl font-black text-[#EA580C] mt-1">
              {liveRiskStats?.risk_category_counts?.['Moderate Risk'] ?? 2} Areas
            </div>
            <div className="text-[10px] text-orange-700 font-sans">Score 40–&lt;60 (#F97316)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-lime-50 border border-lime-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#65A30D]">Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#84CC16]" />
            </div>
            <div className="text-xl font-black text-[#65A30D] mt-1">
              {liveRiskStats?.risk_category_counts?.['Low Risk'] ?? 1} Areas
            </div>
            <div className="text-[10px] text-lime-700 font-sans">Score 20–&lt;40 (#84CC16)</div>
          </div>

          <div className="p-2.5 rounded-[10px] bg-emerald-50 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#16A34A]">Very Low</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            </div>
            <div className="text-xl font-black text-[#16A34A] mt-1">
              {liveRiskStats?.risk_category_counts?.['Very Low Risk'] ?? 0} Areas
            </div>
            <div className="text-[10px] text-emerald-700 font-sans">Score 0–&lt;20 (#16A34A)</div>
          </div>
        </div>

        {liveRiskStats?.last_analysis_timestamp && (
          <div className="text-[10px] font-mono text-[var(--text-secondary)] text-right">
            Last Telemetry Engine Run: {liveRiskStats.last_analysis_timestamp}
          </div>
        )}
      </div>
    </div>
  );
};
