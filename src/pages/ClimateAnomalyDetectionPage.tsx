import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Search,
  Filter,
  Globe,
  TrendingUp,
  Zap,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  Flame,
  Droplets,
  CloudLightning,
  TreePine,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  getAllDetectedClimateAnomalies,
  getClimateAnomalyById,
  DetectedClimateAnomaly,
  ANOMALY_TYPES,
  AnomalyType,
  AnomalySeverity,
} from '../services/climateIntelligenceModules';

export const ClimateAnomalyDetectionPage: React.FC = () => {
  const navigate = useNavigate();

  // Load all detected anomalies
  const allAnomalies = useMemo(() => getAllDetectedClimateAnomalies(), []);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

  // Currently inspected anomaly
  const [activeAnomalyId, setActiveAnomalyId] = useState<string>(
    allAnomalies[0]?.id || ''
  );

  // Extract unique districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    allAnomalies.forEach((a) => {
      if (a.district) set.add(a.district);
    });
    return Array.from(set).sort();
  }, [allAnomalies]);

  // Filtered List
  const filteredAnomalies = useMemo(() => {
    return allAnomalies.filter((a) => {
      if (selectedCategory !== 'All' && a.anomalyType !== selectedCategory) return false;
      if (selectedSeverity !== 'All' && a.severity !== selectedSeverity) return false;
      if (selectedDistrict !== 'All' && a.district !== selectedDistrict) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.villageName.toLowerCase().includes(q);
        const matchesDist = a.district.toLowerCase().includes(q);
        const matchesTal = a.taluka.toLowerCase().includes(q);
        const matchesType = a.anomalyTypeName.toLowerCase().includes(q);
        if (!matchesName && !matchesDist && !matchesTal && !matchesType) return false;
      }
      return true;
    });
  }, [allAnomalies, selectedCategory, selectedSeverity, selectedDistrict, searchQuery]);

  // Selected Anomaly Detail
  const activeAnomaly: DetectedClimateAnomaly = useMemo(() => {
    return (
      allAnomalies.find((a) => a.id === activeAnomalyId) ||
      filteredAnomalies[0] ||
      allAnomalies[0]
    );
  }, [allAnomalies, activeAnomalyId, filteredAnomalies]);

  // Anomaly summary metrics
  const summaryMetrics = useMemo(() => {
    const critical = allAnomalies.filter((a) => a.severity === 'Critical').length;
    const high = allAnomalies.filter((a) => a.severity === 'High').length;
    const moderate = allAnomalies.filter((a) => a.severity === 'Moderate').length;
    const low = allAnomalies.filter((a) => a.severity === 'Low').length;
    const avgZ = (
      allAnomalies.reduce((sum, a) => sum + Math.abs(a.zScore), 0) /
      Math.max(1, allAnomalies.length)
    ).toFixed(2);

    return { total: allAnomalies.length, critical, high, moderate, low, avgZ };
  }, [allAnomalies]);

  // Navigate to GIS Map
  const handleInspectOnMap = (anomaly: DetectedClimateAnomaly) => {
    navigate(
      `/map?villageId=${anomaly.villageId}&climateModule=anomaly&anomalyId=${anomaly.id}&anomalyType=${anomaly.anomalyType}&lat=${anomaly.coordinates.lat}&lng=${anomaly.coordinates.lng}`
    );
  };

  const getSeverityBadge = (sev: AnomalySeverity) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500/15 text-red-600 border-red-500/30';
      case 'High':
        return 'bg-orange-500/15 text-orange-600 border-orange-500/30';
      case 'Moderate':
        return 'bg-amber-500/15 text-amber-600 border-amber-500/30';
      case 'Low':
        return 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                Z-Score & Isolation Forest Statistical Baseline
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                1991–2020 IMD 30-Year Normal
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-[#008060]" />
              AI Climate Anomaly Detection
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Real-time geospatial surveillance identifying severe meteorological, hydrological, and vegetative deviations against 30-year climatological normal thresholds across Maharashtra.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeAnomaly && (
              <button
                onClick={() => handleInspectOnMap(activeAnomaly)}
                className="px-4 py-2.5 rounded-lg bg-[#008060] hover:bg-[#006e52] text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Locate Anomaly on GIS</span>
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Log</span>
            </button>
          </div>
        </div>

        {/* METRIC CARDS BANNER */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Active Detected Anomalies</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {summaryMetrics.total}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Automated AWS Telemetry</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Critical (&gt; 3.0σ)</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
              {summaryMetrics.critical}
            </div>
            <div className="text-xs text-red-600/80 mt-0.5">Immediate Warning Trigger</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-500">High (2.0–3.0σ)</div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
              {summaryMetrics.high}
            </div>
            <div className="text-xs text-orange-600/80 mt-0.5">Elevated Field Advisory</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs font-medium text-slate-500">Moderate (1.2–2.0σ)</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {summaryMetrics.moderate}
            </div>
            <div className="text-xs text-amber-600/80 mt-0.5">Surveillance Watchlist</div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 md:col-span-1">
            <div className="text-xs font-medium text-slate-500">Mean Anomaly Magnitude</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {summaryMetrics.avgZ}σ
            </div>
            <div className="text-xs text-purple-600/80 mt-0.5">Statistical Standard Deviation</div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: FILTERS & ANOMALY FEED (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* FILTER PANEL */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#008060]" />
                Filter Detected Anomalies
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {filteredAnomalies.length} active
              </span>
            </div>

            {/* SEARCH */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by village, district, or anomaly type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>

            {/* DROPDOWNS */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="All">All Types</option>
                  {ANOMALY_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Severity</label>
                <select
                  value={selectedSeverity}
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="All">All Levels</option>
                  <option value="Critical">Critical (&gt;3σ)</option>
                  <option value="High">High (2–3σ)</option>
                  <option value="Moderate">Moderate (1.2–2σ)</option>
                  <option value="Low">Low (&lt;1.2σ)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="All">All Districts</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ANOMALY FEED LIST */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[540px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Anomaly Type & Habitation
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Deviation / Z-Score
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1 mt-2">
              {filteredAnomalies.map((anomaly) => {
                const isSelected = anomaly.id === activeAnomaly?.id;
                return (
                  <button
                    key={anomaly.id}
                    onClick={() => setActiveAnomalyId(anomaly.id)}
                    className={`w-full text-left py-3 px-3 rounded-xl transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-700/60'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getSeverityBadge(
                            anomaly.severity
                          )}`}
                        >
                          {anomaly.severity}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {anomaly.taluka}, {anomaly.district}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-[#008060] transition-colors">
                        {anomaly.villageName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {anomaly.anomalyTypeName}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-sm font-bold ${
                          anomaly.deviationPct > 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {anomaly.deviationPct > 0 ? '+' : ''}
                        {anomaly.deviationPct}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        |Z| = {Math.abs(anomaly.zScore).toFixed(2)}σ
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 ml-auto mt-1 transition-transform ${
                          isSelected
                            ? 'text-[#008060] translate-x-1'
                            : 'text-slate-400 group-hover:translate-x-0.5'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}

              {filteredAnomalies.length === 0 && (
                <div className="py-12 text-center text-sm text-slate-500">
                  No climate anomalies found matching active criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED ANOMALY DIAGNOSTIC & FIELD ACTIONS (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {activeAnomaly ? (
            <>
              {/* PRIMARY ANOMALY HERO CARD */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getSeverityBadge(
                          activeAnomaly.severity
                        )}`}
                      >
                        {activeAnomaly.severity} Anomaly
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Active for {activeAnomaly.durationDays} days
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {activeAnomaly.anomalyTypeName}
                    </h2>
                    <div className="text-xs text-slate-500 mt-1">
                      Detected at: <strong>{activeAnomaly.villageName}</strong> ({activeAnomaly.taluka}, {activeAnomaly.district}) • {activeAnomaly.coordinates.lat.toFixed(4)}°N, {activeAnomaly.coordinates.lng.toFixed(4)}°E
                    </div>
                  </div>

                  {/* Z-SCORE METRIC BADGE */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-right self-start sm:self-center">
                    <div className="text-[10px] uppercase font-bold text-slate-500">
                      Z-Score Significance
                    </div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
                      {activeAnomaly.zScore > 0 ? '+' : ''}
                      {activeAnomaly.zScore.toFixed(2)}σ
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Normal Range: ±1.00σ
                    </div>
                  </div>
                </div>

                {/* STATISTICAL DEVIATION BREAKDOWN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* BASELINE CARD */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Historical Climatological Baseline
                    </div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      {activeAnomaly.baselineValue}{' '}
                      <span className="text-xs font-medium text-slate-500">
                        {activeAnomaly.unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {activeAnomaly.baselinePeriod}
                    </div>
                  </div>

                  {/* OBSERVED REAL-TIME TELEMETRY CARD */}
                  <div className="p-4 rounded-xl bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                    <div className="text-xs font-semibold text-red-800 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Observed Real-Time Telemetry</span>
                      <span className="font-bold">
                        {activeAnomaly.deviationPct > 0 ? '+' : ''}
                        {activeAnomaly.deviationPct}%
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {activeAnomaly.observedValue}{' '}
                      <span className="text-xs font-medium text-slate-500">
                        {activeAnomaly.unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-red-600/80 dark:text-red-400/80 mt-1">
                      Standard Deviation: {Math.abs(activeAnomaly.zScore).toFixed(2)}σ beyond mean
                    </div>
                  </div>
                </div>

                {/* PROBABLE CAUSE & SCIENTIFIC SUMMARY */}
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#008060]" />
                      Scientific Diagnostic & Synoptic Cause
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {activeAnomaly.explanation.probableCause}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                      {activeAnomaly.explanation.impactSummary}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Verified by: {activeAnomaly.explanation.verificationSource}
                    </div>
                  </div>
                </div>
              </div>

              {/* RECOMMENDED EMERGENCY FIELD ACTIONS */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Recommended SOP & Field Intervention Directives
                  </h3>
                </div>

                <div className="space-y-2">
                  {activeAnomaly.explanation.recommendedFieldActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{action}</span>
                    </div>
                  ))}
                </div>

                {/* ACTION FOOTER */}
                <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Incident ID: <strong className="text-slate-600 dark:text-slate-300">{activeAnomaly.id}</strong>
                  </span>
                  <button
                    onClick={() => handleInspectOnMap(activeAnomaly)}
                    className="px-5 py-2.5 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Inspect Anomaly on Live GIS Map
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Select an anomaly to inspect diagnostic details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

