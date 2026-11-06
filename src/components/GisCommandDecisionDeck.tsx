import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Info,
  Layers,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Village } from '../types';
import {
  classifyHazard,
  computeVulnerability,
  weightedScore,
} from '../utils/scoring';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface GisLayerCatalogEntry {
  id: string;
  category:
    | 'A. Base Maps'
    | 'B. Hazard Layers'
    | 'C. Population & Habitation'
    | 'D. Transportation & Evacuation'
    | 'E. Relocation & Carrying Capacity'
    | 'F. Field Intelligence & Sensors';
  name: string;
  sourceAgency: string;
  freshness: string;
  provenance: 'LIVE' | 'VERIFIED' | 'IMPORTED' | 'ESTIMATED' | 'SIMULATED';
  resolution: string;
  enabled: boolean;
  onToggle: () => void;
}

interface GisCommandDecisionDeckProps {
  selectedVillage: Village | null;
  onSelectVillageAndFly: (village: Village) => void;
  onRouteToCoords: (label: string, lat: number, lng: number) => void;
  layerCatalog: GisLayerCatalogEntry[];
  gpsAccuracyMeters: number;
  gpsQualityBadge: string;
  gpsLat: number;
  gpsLng: number;
  onLocateMe: () => void;
}

export const GisCommandDecisionDeck: React.FC<GisCommandDecisionDeckProps> = ({
  selectedVillage,
  onSelectVillageAndFly,
  onRouteToCoords,
  layerCatalog,
  gpsAccuracyMeters,
  gpsQualityBadge,
  gpsLat,
  gpsLng,
  onLocateMe,
}) => {
  const navigate = useNavigate();
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const weights = useAppStore((s) => s.weights);
  const openExplainModal = useAppStore((s) => s.openExplainModal);
  const addHouseholdCase = useAppStore((s) => s.addHouseholdCase);
  const addToast = useAppStore((s) => s.addToast);
  const logAuditEvent = useAppStore((s) => s.logAuditEvent);

  // Hierarchical Geographic Filter State: India -> Maharashtra -> District -> Taluka -> Village
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('All');
  const [selectedTalukaFilter, setSelectedTalukaFilter] = useState<string>('All');
  const [layerSearchQuery, setLayerSearchQuery] = useState<string>('');
  const [safetyMarginPct, setSafetyMarginPct] = useState<number>(10);
  const [selectedCandidateSiteId, setSelectedCandidateSiteId] = useState<string>('');
  const [allocatedOverlayBySite, setAllocatedOverlayBySite] = useState<Record<string, number>>({});

  // Default to selectedVillage or highest-risk habitation (Irshalwadi)
  const activeVillage: Village = useMemo(() => {
    if (selectedVillage) return selectedVillage;
    return villages[0]!;
  }, [selectedVillage, villages]);

  const districtsList = useMemo(
    () => Array.from(new Set(villages.map((v) => v.district))),
    [villages]
  );

  const talukasList = useMemo(() => {
    const filtered =
      selectedDistrictFilter === 'All'
        ? villages
        : villages.filter((v) => v.district === selectedDistrictFilter);
    return Array.from(new Set(filtered.map((v) => v.taluka)));
  }, [villages, selectedDistrictFilter]);

  const filteredVillages = useMemo(() => {
    return villages.filter((v) => {
      if (selectedDistrictFilter !== 'All' && v.district !== selectedDistrictFilter) {
        return false;
      }
      if (selectedTalukaFilter !== 'All' && v.taluka !== selectedTalukaFilter) {
        return false;
      }
      return true;
    });
  }, [villages, selectedDistrictFilter, selectedTalukaFilter]);

  // Compute Hazard Score, Vulnerability Score & Priority Score for activeVillage (Sections 9, 10, 12)
  const villageAnalysis = useMemo(() => {
    const hRaw = weightedScore(
      activeVillage.hazardFactors,
      weights,
      activeVillage.verifiedReportsCount
    );
    const hScore100 = Math.round(hRaw * 100);
    const rLevel = classifyHazard(hRaw);
    const vRaw = computeVulnerability(activeVillage.vulnerabilityFactors);
    const vScore100 = Math.round(vRaw * 100);

    // Individual factor contributions
    const factorContributions = [
      {
        name: 'Rainfall Intensity & Accumulation',
        rawDisplay: `${activeVillage.annualRainfallMm} mm/yr`,
        normalizedValue: activeVillage.hazardFactors.rainfall,
        weight: weights.rainfall,
        contribution: Number((activeVillage.hazardFactors.rainfall * weights.rainfall * 100).toFixed(1)),
        percentageOfScore: Math.round(
          ((activeVillage.hazardFactors.rainfall * weights.rainfall) / Math.max(0.01, hRaw)) * 100
        ),
        color: '#DC2626',
      },
      {
        name: 'Slope & Terrain Steepness (DEM)',
        rawDisplay: `${activeVillage.slopeDeg}° (${activeVillage.elevationM} m ASL)`,
        normalizedValue: activeVillage.hazardFactors.slope,
        weight: weights.slope,
        contribution: Number((activeVillage.hazardFactors.slope * weights.slope * 100).toFixed(1)),
        percentageOfScore: Math.round(
          ((activeVillage.hazardFactors.slope * weights.slope) / Math.max(0.01, hRaw)) * 100
        ),
        color: '#EA580C',
      },
      {
        name: 'Historical Disaster Frequency (GSI/Revenue)',
        rawDisplay: activeVillage.lastIncidentSummary || 'Past landslide/flood record',
        normalizedValue: activeVillage.hazardFactors.history,
        weight: weights.history,
        contribution: Number((activeVillage.hazardFactors.history * weights.history * 100).toFixed(1)),
        percentageOfScore: Math.round(
          ((activeVillage.hazardFactors.history * weights.history) / Math.max(0.01, hRaw)) * 100
        ),
        color: '#CA8A04',
      },
      {
        name: 'River & Drainage Proximity (CWC)',
        rawDisplay: `${activeVillage.riverDistKm} km from channel`,
        normalizedValue: activeVillage.hazardFactors.riverProximity,
        weight: weights.riverProximity,
        contribution: Number(
          (activeVillage.hazardFactors.riverProximity * weights.riverProximity * 100).toFixed(1)
        ),
        percentageOfScore: Math.round(
          ((activeVillage.hazardFactors.riverProximity * weights.riverProximity) /
            Math.max(0.01, hRaw)) *
            100
        ),
        color: '#0284C7',
      },
    ];

    const alertCategory: 'Red' | 'Orange' | 'Yellow' | 'Green' =
      hScore100 >= 75
        ? 'Red'
        : hScore100 >= 55
        ? 'Orange'
        : hScore100 >= 35
        ? 'Yellow'
        : 'Green';

    return {
      hRaw,
      hScore100,
      rLevel,
      vRaw,
      vScore100,
      alertCategory,
      factorContributions,
    };
  }, [activeVillage, weights]);

  // Candidate Relocation Sites sorted by suitability & proximity to activeVillage (Sections 11 & 13)
  const candidateSitesWithCapacity = useMemo(() => {
    return sites
      .map((site) => {
        const distKm = Number(
          haversineKm(activeVillage.lat, activeVillage.lng, site.lat, site.lng).toFixed(1)
        );
        const usableHa = site.usableAreaHa || 4.5;
        const landPerHh = site.landPerHouseholdHa || 0.08;

        // Normalize waterReliabilityScore whether stored as 0-1 or 0-100
        const waterRatio =
          site.waterReliabilityScore <= 1
            ? site.waterReliabilityScore
            : site.waterReliabilityScore / 100;

        // Derive slope, road, and service scores from physical RelocationSite attributes
        const slopeSafetyPct = Math.max(40, Math.min(98, Math.round(100 - site.slopeDeg * 2.5)));
        const roadAccessPct = Math.max(45, Math.min(98, Math.round(100 - site.roadDistKm * 12)));
        const serviceAccessPct = Math.max(
          45,
          Math.min(98, Math.round(100 - (site.schoolDistKm + site.healthcareDistKm) * 5))
        );

        // 4 Physical Carrying Capacity Constraints (Section 11: Most restrictive validated constraint wins)
        const landCapHh = Math.floor(usableHa / Math.max(0.01, landPerHh));
        const waterCapHh = Math.floor(landCapHh * (0.72 + waterRatio * 0.35));
        const sanitationCapHh = Math.floor(landCapHh * (0.78 + (slopeSafetyPct / 100) * 0.22));
        const servicesCapHh = Math.floor(
          landCapHh * (0.74 + ((roadAccessPct + serviceAccessPct) / 200) * 0.28)
        );

        const rawBottleneckHh = Math.min(
          landCapHh,
          waterCapHh,
          sanitationCapHh,
          servicesCapHh
        );

        const bottleneckFactor =
          rawBottleneckHh === landCapHh
            ? 'Usable Land Area'
            : rawBottleneckHh === waterCapHh
            ? 'Potable Water Supply'
            : rawBottleneckHh === sanitationCapHh
            ? 'Sanitation & Drainage'
            : 'Road & Essential Services';

        const operationalMaxCapHh = Math.max(
          15,
          Math.floor(rawBottleneckHh * (1 - safetyMarginPct / 100))
        );

        const extraAllocated = allocatedOverlayBySite[site.id] || 0;
        const currentOccupiedHh = (site.existingOccupiedHouseholds || 0) + extraAllocated;
        const remainingCapHh = Math.max(0, operationalMaxCapHh - currentOccupiedHh);
        const utilizationPct = Math.min(
          100,
          Math.round((currentOccupiedHh / Math.max(1, operationalMaxCapHh)) * 100)
        );

        // MCDA Suitability Score (0-100)
        const suitabilityScore = Math.round(
          slopeSafetyPct * 0.3 +
            waterRatio * 100 * 0.25 +
            roadAccessPct * 0.25 +
            serviceAccessPct * 0.2
        );

        return {
          site,
          distKm,
          landCapHh,
          waterCapHh,
          sanitationCapHh,
          servicesCapHh,
          bottleneckFactor,
          operationalMaxCapHh,
          currentOccupiedHh,
          remainingCapHh,
          utilizationPct,
          suitabilityScore,
        };
      })
      .sort((a, b) => a.distKm - b.distKm);
  }, [sites, activeVillage, safetyMarginPct, allocatedOverlayBySite]);

  const activeSiteMatch = useMemo(() => {
    if (selectedCandidateSiteId) {
      const found = candidateSitesWithCapacity.find(
        (c) => c.site.id === selectedCandidateSiteId
      );
      if (found) return found;
    }
    return (
      candidateSitesWithCapacity.find((c) => c.remainingCapHh > 0) ||
      candidateSitesWithCapacity[0]!
    );
  }, [candidateSitesWithCapacity, selectedCandidateSiteId]);

  // Relocation Priority Score (Section 12: Combines Hazard, Vulnerability, Exposure & Safe Capacity with zero-division safeguards)
  const priorityMetrics = useMemo(() => {
    const safeRemaining = Math.max(1, activeSiteMatch?.remainingCapHh || 50);
    const capacityPressureRatio = Math.min(
      1.35,
      1 + activeVillage.households / Math.max(50, safeRemaining * 2)
    );
    const rawPriority = Math.min(
      99,
      Math.round(
        (villageAnalysis.hScore100 * 0.58 + villageAnalysis.vScore100 * 0.42) *
          (capacityPressureRatio * 0.85)
      )
    );
    const planningCategory: 'Immediate Relocation' | 'Short-Term (Pre-Monsoon)' | 'Medium-Term Mitigation' =
      rawPriority >= 72 || villageAnalysis.alertCategory === 'Red'
        ? 'Immediate Relocation'
        : rawPriority >= 50
        ? 'Short-Term (Pre-Monsoon)'
        : 'Medium-Term Mitigation';

    return {
      priorityScore: rawPriority,
      planningCategory,
      canFitEntireVillage: (activeSiteMatch?.remainingCapHh || 0) >= activeVillage.households,
      householdsFitted: Math.min(
        activeVillage.households,
        activeSiteMatch?.remainingCapHh || 0
      ),
      householdsOverflow: Math.max(
        0,
        activeVillage.households - (activeSiteMatch?.remainingCapHh || 0)
      ),
    };
  }, [villageAnalysis, activeSiteMatch, activeVillage]);

  const filteredLayers = useMemo(() => {
    if (!layerSearchQuery.trim()) return layerCatalog;
    const q = layerSearchQuery.toLowerCase();
    return layerCatalog.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.sourceAgency.toLowerCase().includes(q)
    );
  }, [layerCatalog, layerSearchQuery]);

  const handleAllocateToSafeSite = (siteEntry: typeof activeSiteMatch) => {
    if (!siteEntry) return;
    if (siteEntry.remainingCapHh <= 0) {
      addToast({
        title: 'Allocation Blocked — Zero Remaining Capacity',
        message: `${siteEntry.site.name} has reached its restrictive carrying capacity (${siteEntry.operationalMaxCapHh} HH). Overbooking is prevented.`,
        type: 'warning',
      });
      return;
    }

    const batchToAllocate = Math.min(25, activeVillage.households, siteEntry.remainingCapHh);
    setAllocatedOverlayBySite((prev) => ({
      ...prev,
      [siteEntry.site.id]: (prev[siteEntry.site.id] || 0) + batchToAllocate,
    }));

    addHouseholdCase({
      headName: `${activeVillage.name} Batch (${batchToAllocate} HH Rep)`,
      villageId: activeVillage.id,
      villageName: activeVillage.name,
      district: activeVillage.district,
      membersCount: batchToAllocate * 4,
      targetSiteName: siteEntry.site.name,
      compensationSanctionedInr: batchToAllocate * 450000,
    });

    logAuditEvent(
      'SAFE_SITE_CAPACITY_ALLOCATED',
      'Carrying Capacity & Relocation',
      `Allocated ${batchToAllocate} households from ${activeVillage.name} to ${siteEntry.site.name} (Remaining capacity: ${siteEntry.remainingCapHh - batchToAllocate} HH).`
    );
  };

  return (
    <div className="space-y-4">
      {/* =====================================================================
          REGION & HABITATION SELECTOR + HIGH-ACCURACY GPS STATUS
          ===================================================================== */}
      <div className="neu-raised p-3.5 rounded-[14px] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-[#0D1326] text-indigo-300 font-mono text-[10px] font-bold uppercase">
            Region
          </span>
          <span className="font-semibold text-[var(--text-secondary)]">Maharashtra ▸</span>

          {/* District Selector */}
          <select
            value={selectedDistrictFilter}
            onChange={(e) => {
              setSelectedDistrictFilter(e.target.value);
              setSelectedTalukaFilter('All');
            }}
            className="neu-input px-2.5 py-1 font-semibold"
            aria-label="Select District"
          >
            <option value="All">All Districts ({districtsList.length})</option>
            {districtsList.map((d) => (
              <option key={d} value={d}>
                {d} District
              </option>
            ))}
          </select>

          <span>▸</span>

          {/* Taluka Selector */}
          <select
            value={selectedTalukaFilter}
            onChange={(e) => setSelectedTalukaFilter(e.target.value)}
            className="neu-input px-2.5 py-1 font-semibold"
            aria-label="Select Taluka"
          >
            <option value="All">All Talukas ({talukasList.length})</option>
            {talukasList.map((t) => (
              <option key={t} value={t}>
                {t} Taluka
              </option>
            ))}
          </select>

          <span>▸</span>

          {/* Habitation / Village Selector */}
          <select
            value={activeVillage.id}
            onChange={(e) => {
              const found = villages.find((v) => v.id === e.target.value);
              if (found) onSelectVillageAndFly(found);
            }}
            className="neu-input px-3 py-1 font-bold text-[#4F46E5] dark:text-[#818CF8]"
            aria-label="Select Village or Habitation"
          >
            {filteredVillages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.taluka}, {v.district}) — {v.households} HH
              </option>
            ))}
          </select>
        </div>

        {/* High-Precision GPS Telemetry Pill */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="neu-flat px-2.5 py-1 rounded-[8px] font-mono text-[11px] flex items-center gap-1.5">
            <LocateFixed className="w-3.5 h-3.5 text-[#4F46E5] dark:text-[#818CF8]" />
            <span>
              GPS: {gpsLat.toFixed(5)}°N, {gpsLng.toFixed(5)}°E (±{Math.round(gpsAccuracyMeters)}m)
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                gpsQualityBadge === 'Good'
                  ? 'bg-[#15803D]'
                  : gpsQualityBadge === 'Fair'
                  ? 'bg-[#CA8A04]'
                  : 'bg-[#DC2626]'
              }`}
            >
              {gpsQualityBadge}
            </span>
          </div>
          <button
            type="button"
            onClick={onLocateMe}
            className="neu-btn px-2.5 py-1 font-bold text-[#4F46E5] dark:text-[#818CF8] text-[11px]"
          >
            Re-Lock GPS
          </button>
        </div>
      </div>

      {/* =====================================================================
          3-COLUMN INTEGRATED DECISION-SUPPORT WORKSPACE
          Col 1: Categorized Layer Catalog & Provenance Metadata
          Col 2: Hazard Intelligence, Red Zone Evidence & Vulnerability
          Col 3: Safe-Zone Carrying Capacity, Site Matching & Relocation Priority
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
        {/* COLUMN 1 (4 Cols): Categorized GIS Layer Explorer & Provenance */}
        <div className="lg:col-span-4 neu-raised p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#4F46E5] dark:text-[#818CF8]" strokeWidth={1.75} />
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Map Layers &amp; Provenance
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Live, verified, and simulated layer catalog
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/data-sources')}
                className="text-[11px] font-bold text-[#4F46E5] dark:text-[#818CF8] hover:underline"
              >
                Sources ↗
              </button>
            </div>

            {/* Layer Search */}
            <div className="neu-inset px-2.5 py-1.5 rounded-[8px] flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={layerSearchQuery}
                onChange={(e) => setLayerSearchQuery(e.target.value)}
                placeholder="Search layers by name, category or agency..."
                className="bg-transparent w-full text-xs focus:outline-none"
              />
            </div>

            {/* Layer List with Provenance & Source Metadata */}
            <div className="space-y-2 max-h-[410px] overflow-y-auto pr-1">
              {filteredLayers.map((layer) => (
                <div
                  key={layer.id}
                  className="neu-flat p-2.5 rounded-[10px] border border-[var(--border)] space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[var(--text-primary)]">
                      <input
                        type="checkbox"
                        checked={layer.enabled}
                        onChange={layer.onToggle}
                        className="accent-[#0B8F80] w-3.5 h-3.5"
                      />
                      <span>{layer.name}</span>
                    </label>
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold text-white ${
                        layer.provenance === 'LIVE'
                          ? 'bg-[#15803D]'
                          : layer.provenance === 'VERIFIED'
                          ? 'bg-[#0B8F80]'
                          : layer.provenance === 'SIMULATED'
                          ? 'bg-[#CA8A04]'
                          : 'bg-[#0284C7]'
                      }`}
                    >
                      {layer.provenance}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-[var(--text-secondary)] font-mono pl-5">
                    <span>{layer.category}</span>
                    <span>
                      {layer.sourceAgency} · {layer.freshness}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="neu-flat p-2.5 rounded-[8px] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
            <span>CRS: EPSG:4326 (WGS 84) / UTM 43N</span>
            <button
              type="button"
              onClick={() => navigate('/gis')}
              className="font-bold text-[#4F46E5] dark:text-[#818CF8] hover:underline"
            >
              Open Full Explorer →
            </button>
          </div>
        </div>

        {/* COLUMN 2 (4 Cols): Explainable Hazard Intelligence & Separate Vulnerability */}
        <div className="lg:col-span-4 neu-raised p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold text-white uppercase"
                    style={{
                      backgroundColor:
                        villageAnalysis.alertCategory === 'Red'
                          ? '#DC2626'
                          : villageAnalysis.alertCategory === 'Orange'
                          ? '#EA580C'
                          : villageAnalysis.alertCategory === 'Yellow'
                          ? '#CA8A04'
                          : '#15803D',
                    }}
                  >
                    {villageAnalysis.alertCategory} ZONE ({villageAnalysis.hScore100}/100)
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                    Calibrated Baseline
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1">
                  {activeVillage.name} ({activeVillage.taluka}, {activeVillage.district})
                </h3>
              </div>
              <button
                type="button"
                onClick={() =>
                  openExplainModal({
                    title: `${activeVillage.name} — Risk Classification`,
                    subtitle: `Primary Hazard: ${activeVillage.primaryHazard.toUpperCase()}`,
                    totalScore: villageAnalysis.hScore100,
                    riskLevel: villageAnalysis.rLevel,
                    scoreType: 'hazard',
                    villageName: activeVillage.name,
                    district: activeVillage.district,
                    factors: villageAnalysis.factorContributions,
                    contextNotes: [
                      `Verified Field Reports: ${activeVillage.verifiedReportsCount}`,
                      `Last Incident: ${activeVillage.lastIncidentSummary || 'Recorded in archive'}`,
                      `Classification is algorithmic advisory; ground verification applies.`,
                    ],
                  })
                }
                className="neu-btn px-2.5 py-1.5 text-[11px] font-bold text-[#4F46E5] dark:text-[#818CF8] flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Explain Score</span>
              </button>
            </div>

            {/* Hazard Factor Breakdown Bars */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                1. Hazard Breakdown ({activeVillage.primaryHazard.toUpperCase()})
              </div>
              {villageAnalysis.factorContributions.map((fc) => (
                <div key={fc.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--text-primary)]">{fc.name}</span>
                    <span className="font-mono font-bold">
                      {fc.rawDisplay} (+{fc.contribution} pts)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--surface-flat)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round(fc.normalizedValue * 100))}%`,
                        backgroundColor: fc.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Separate Vulnerability & Exposure Assessment */}
            <div className="pt-2 border-t border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  2. Social Vulnerability &amp; Exposure
                </span>
                <span className="px-2 py-0.5 rounded bg-[#0D1326] text-indigo-300 font-mono font-bold text-[10px]">
                  Score: {villageAnalysis.vScore100}/100
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="neu-flat p-2 rounded-[8px]">
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Exposed Population
                  </div>
                  <div className="font-mono font-bold text-xs text-[var(--text-primary)]">
                    {activeVillage.population.toLocaleString()} ({activeVillage.households} HH)
                  </div>
                </div>
                <div className="neu-flat p-2 rounded-[8px]">
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Elderly &amp; Disabled
                  </div>
                  <div className="font-mono font-bold text-xs text-[#EA580C]">
                    {(
                      activeVillage.vulnerabilityFactors.elderlyPct +
                      activeVillage.vulnerabilityFactors.disabledPct
                    ).toFixed(1)}
                    %
                  </div>
                </div>
                <div className="neu-flat p-2 rounded-[8px]">
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Kachha Structures
                  </div>
                  <div className="font-mono font-bold text-xs text-[var(--text-primary)]">
                    {activeVillage.vulnerabilityFactors.kutchaHousePct}%
                  </div>
                </div>
                <div className="neu-flat p-2 rounded-[8px]">
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    Healthcare Distance
                  </div>
                  <div className="font-mono font-bold text-xs text-[var(--text-primary)]">
                    {activeVillage.vulnerabilityFactors.healthcareDistKm} km
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => onSelectVillageAndFly(activeVillage)}
              className="neu-btn px-3 py-1.5 font-bold text-xs flex items-center gap-1 text-[#4F46E5] dark:text-[#818CF8]"
            >
              <MapPin className="w-3.5 h-3.5 text-[#4F46E5]" />
              <span>Zoom to Habitation</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/vulnerability')}
              className="text-[11px] font-bold text-[#4F46E5] dark:text-[#818CF8] hover:underline"
            >
              Full Vulnerability Matrix →
            </button>
          </div>
        </div>

        {/* COLUMN 3 (4 Cols): Safe-Zone Carrying Capacity, Site Matching & Relocation Priority (Sections 11, 12, 13) */}
        <div className="lg:col-span-4 neu-raised p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            {/* Priority Score Banner */}
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#B91C1C] text-white font-mono text-[10px] font-extrabold">
                    PRIORITY: {priorityMetrics.priorityScore}/100
                  </span>
                  <span className="px-2 py-0.5 rounded neu-flat font-bold text-[10px] text-[#4F46E5] dark:text-[#818CF8]">
                    {priorityMetrics.planningCategory}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1">
                  Safe-Zone Carrying Capacity &amp; Site Match
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/priority-ranking')}
                className="text-[11px] font-bold text-[#4F46E5] dark:text-[#818CF8] hover:underline"
              >
                Rankings ↗
              </button>
            </div>

            {/* Candidate Relocation Site Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[var(--text-secondary)]">
                  Candidate Safe Relocation Site:
                </span>
                <span className="font-mono text-[#4F46E5] dark:text-[#818CF8] font-bold">
                  Safety Margin: {safetyMarginPct}%
                </span>
              </div>
              <select
                value={activeSiteMatch?.site.id || ''}
                onChange={(e) => setSelectedCandidateSiteId(e.target.value)}
                className="neu-input w-full px-2.5 py-1.5 text-xs font-bold"
              >
                {candidateSitesWithCapacity.map((entry) => (
                  <option key={entry.site.id} value={entry.site.id}>
                    {entry.site.name} ({entry.distKm} km · Suitability {entry.suitabilityScore}% ·{' '}
                    {entry.remainingCapHh} HH free)
                  </option>
                ))}
              </select>
            </div>

            {/* Restrictive Carrying Capacity Breakdown (Section 11) */}
            {activeSiteMatch && (
              <div className="neu-flat p-3 rounded-[10px] space-y-2 border border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)]">
                    Restrictive Carrying Capacity (MCDA)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#15803D] text-white font-mono text-[10px] font-bold">
                    {activeSiteMatch.remainingCapHh} HH Remaining
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                  <div className="p-1.5 rounded bg-[var(--surface)]">
                    Land Cap: <strong>{activeSiteMatch.landCapHh} HH</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[var(--surface)]">
                    Water Cap: <strong>{activeSiteMatch.waterCapHh} HH</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[var(--surface)]">
                    Sanitation: <strong>{activeSiteMatch.sanitationCapHh} HH</strong>
                  </div>
                  <div className="p-1.5 rounded bg-[var(--surface)]">
                    Services: <strong>{activeSiteMatch.servicesCapHh} HH</strong>
                  </div>
                </div>

                <div className="text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
                  <span>
                    Bottleneck: <strong className="text-[#EA580C]">{activeSiteMatch.bottleneckFactor}</strong>
                  </span>
                  <span className="font-mono font-bold">
                    Occupied: {activeSiteMatch.currentOccupiedHh}/{activeSiteMatch.operationalMaxCapHh} HH (
                    {activeSiteMatch.utilizationPct}%)
                  </span>
                </div>

                {/* Safety Margin Slider */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-[var(--text-secondary)] shrink-0">
                    Safety Buffer ({safetyMarginPct}%):
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={5}
                    value={safetyMarginPct}
                    onChange={(e) => setSafetyMarginPct(Number(e.target.value))}
                    className="w-full accent-[#4F46E5]"
                  />
                </div>

                {/* Allocation Fit Notice */}
                <div className="text-[11px] pt-1 border-t border-[var(--border)]">
                  {priorityMetrics.canFitEntireVillage ? (
                    <span className="text-[#15803D] font-semibold">
                      ✓ Site can accommodate all {activeVillage.households} households from{' '}
                      {activeVillage.name}.
                    </span>
                  ) : (
                    <span className="text-[#EA580C] font-semibold">
                      ⚠ Multi-site split required: fits {priorityMetrics.householdsFitted} HH here;{' '}
                      {priorityMetrics.householdsOverflow} HH require secondary site.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {activeSiteMatch && (
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onRouteToCoords(
                      activeSiteMatch.site.name,
                      activeSiteMatch.site.lat,
                      activeSiteMatch.site.lng
                    )
                  }
                  className="flex-1 neu-btn px-2.5 py-2 font-bold text-[#4F46E5] dark:text-[#818CF8] flex items-center justify-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>OSRM Route ({activeSiteMatch.distKm} km)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAllocateToSafeSite(activeSiteMatch)}
                  className="flex-1 px-2.5 py-2 rounded-[8px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold flex items-center justify-center gap-1 shadow-sm"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Allocate &amp; Track Case</span>
                </button>
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                Advisory Note: Algorithmic priority is a decision-support recommendation, not an automatic legal relocation order.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
