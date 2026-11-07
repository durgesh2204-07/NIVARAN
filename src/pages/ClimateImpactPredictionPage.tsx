import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Search,
  Filter,
  Globe,
  Waves,
  Sun,
  CloudRain,
  Flame,
  Sprout,
  Droplets,
  TreePine,
  Building,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Download,
  Activity,
  ArrowUpRight,
  Compass,
} from 'lucide-react';
import { MASTER_MAHARASHTRA_VILLAGES } from '../data/maharashtraMasterVillages';
import {
  IMPACT_CATEGORIES,
  ImpactCategory,
  PredictionHorizon,
  predictClimateImpact,
  ImpactPredictionResult,
} from '../services/climateIntelligenceModules';

export const ClimateImpactPredictionPage: React.FC = () => {
  const navigate = useNavigate();

  // Selections
  const [selectedVillageId, setSelectedVillageId] = useState<string>('v-001');
  const [selectedCategory, setSelectedCategory] = useState<ImpactCategory>('flood_impact');
  const [selectedHorizon, setSelectedHorizon] = useState<PredictionHorizon>('horizon_24_72h');

  // Filter for village picker
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [talukaFilter, setTalukaFilter] = useState<string>('All');
  const [villageSearch, setVillageSearch] = useState<string>('');

  // Extract districts
  const districts = useMemo(() => {
    const set = new Set<string>();
    MASTER_MAHARASHTRA_VILLAGES.forEach((v) => {
      if (v.district) set.add(v.district);
    });
    return Array.from(set).sort();
  }, []);

  // Extract talukas
  const talukas = useMemo(() => {
    const set = new Set<string>();
    MASTER_MAHARASHTRA_VILLAGES.forEach((v) => {
      if (districtFilter === 'All' || v.district === districtFilter) {
        if (v.taluka) set.add(v.taluka);
      }
    });
    return Array.from(set).sort();
  }, [districtFilter]);

  // Filtered village list
  const filteredVillages = useMemo(() => {
    return MASTER_MAHARASHTRA_VILLAGES.filter((v) => {
      if (districtFilter !== 'All' && v.district !== districtFilter) return false;
      if (talukaFilter !== 'All' && v.taluka !== talukaFilter) return false;
      if (villageSearch.trim()) {
        const q = villageSearch.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.district.toLowerCase().includes(q) ||
          v.taluka.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [districtFilter, talukaFilter, villageSearch]);

  // Selected village object
  const currentVillage = useMemo(() => {
    return (
      MASTER_MAHARASHTRA_VILLAGES.find((v) => v.id === selectedVillageId) ||
      filteredVillages[0] ||
      MASTER_MAHARASHTRA_VILLAGES[0]
    );
  }, [selectedVillageId, filteredVillages]);

  // Run AI Impact Prediction
  const prediction: ImpactPredictionResult = useMemo(() => {
    return predictClimateImpact(currentVillage, selectedCategory, selectedHorizon);
  }, [currentVillage, selectedCategory, selectedHorizon]);

  // Category Icon Mapper
  const getCategoryIcon = (id: ImpactCategory) => {
    switch (id) {
      case 'flood_impact':
        return <Waves className="w-5 h-5 text-blue-500" />;
      case 'drought_impact':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'extreme_rainfall_impact':
        return <CloudRain className="w-5 h-5 text-indigo-500" />;
      case 'heatwave_impact':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 'agricultural_stress':
        return <Sprout className="w-5 h-5 text-emerald-500" />;
      case 'water_scarcity':
        return <Droplets className="w-5 h-5 text-cyan-500" />;
      case 'vegetation_degradation':
        return <TreePine className="w-5 h-5 text-teal-500" />;
      case 'settlement_exposure':
        return <Building className="w-5 h-5 text-orange-500" />;
    }
  };

  // Navigate to GIS Map
  const handleInspectOnMap = () => {
    navigate(
      `/map?villageId=${currentVillage.id}&climateModule=impact&category=${selectedCategory}&horizon=${selectedHorizon}&lat=${currentVillage.lat}&lng=${currentVillage.lng}`
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 lg:p-8">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Copernicus & IMD Numerical Ensemble
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                8 Climate Impact Categories
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-[#008060]" />
              AI Climate Impact Prediction Engine
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Forecasting localized multi-hazard impacts on agriculture, water resources, human settlements, and civil infrastructure with baseline comparison and preventive directives.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInspectOnMap}
              className="px-4 py-2.5 rounded-lg bg-[#008060] hover:bg-[#006e52] text-white text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>View Impact Zones on GIS</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Directive</span>
            </button>
          </div>
        </div>

        {/* HORIZON SELECTOR PILLS */}
        <div className="flex flex-wrap items-center gap-3 mt-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#008060]" />
            Prediction Horizon:
          </span>
          <button
            onClick={() => setSelectedHorizon('horizon_24_72h')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              selectedHorizon === 'horizon_24_72h'
                ? 'bg-[#008060] text-white border-[#008060] shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#008060]'
            }`}
          >
            Immediate: 24 to 72 Hours (AWS Nowcast)
          </button>
          <button
            onClick={() => setSelectedHorizon('horizon_seasonal')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              selectedHorizon === 'horizon_seasonal'
                ? 'bg-[#008060] text-white border-[#008060] shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#008060]'
            }`}
          >
            Seasonal: 3-Month Monsoon Window
          </button>
          <button
            onClick={() => setSelectedHorizon('horizon_2030_2050')}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              selectedHorizon === 'horizon_2030_2050'
                ? 'bg-[#008060] text-white border-[#008060] shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-[#008060]'
            }`}
          >
            Decadal Scenario: 2030–2050 (+1.5°C Warming)
          </button>
        </div>
      </div>

      {/* 8 IMPACT CATEGORIES CAROUSEL/GRID */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Select Hazard & Impact Category:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {IMPACT_CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-28 group ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-[#008060] shadow-md ring-1 ring-[#008060]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>{getCategoryIcon(cat.id)}</div>
                <div>
                  <div
                    className={`text-xs font-bold leading-tight ${
                      isSelected
                        ? 'text-[#008060] dark:text-emerald-400'
                        : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900'
                    }`}
                  >
                    {cat.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                    {cat.unit}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* WORKSPACE GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: LOCATION SELECTOR (4 COLS) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Compass className="w-4 h-4 text-[#008060]" />
              Select Target Location
            </h2>

            {/* SEARCH */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search village name..."
                value={villageSearch}
                onChange={(e) => setVillageSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008060]"
              />
            </div>

            {/* DROPDOWNS */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">District</label>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    setDistrictFilter(e.target.value);
                    setTalukaFilter('All');
                  }}
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

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Taluka</label>
                <select
                  value={talukaFilter}
                  onChange={(e) => setTalukaFilter(e.target.value)}
                  className="w-full py-1.5 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="All">All Talukas</option>
                  {talukas.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* LIST */}
            <div className="h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
              {filteredVillages.map((v) => {
                const isSelected = v.id === currentVillage.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVillageId(v.id)}
                    className={`w-full text-left py-2.5 px-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#008060] font-bold border border-emerald-300 dark:border-emerald-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{v.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {v.taluka}, {v.district}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {v.population} pop
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREDICTION RESULTS & COMPARISON (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">
          {/* COMPARISON HERO CARD */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {prediction.categoryName}
                  </span>
                  <span className="text-xs text-slate-500">{prediction.horizonLabel}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {prediction.villageName}
                  <span className="text-sm font-normal text-slate-500 ml-2">
                    ({prediction.taluka}, {prediction.district})
                  </span>
                </h2>
              </div>

              {/* SEVERITY BADGE */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-500">
                    Severity Rating
                  </div>
                  <div
                    className="text-lg font-black"
                    style={{ color: prediction.severityColor }}
                  >
                    {prediction.severityLevel} Impact
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Confidence: {prediction.confidencePct}% (±{prediction.uncertaintyMarginPct}%)
                  </div>
                </div>
              </div>
            </div>

            {/* BASELINE VS FORECAST COMPARISON BANNER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* BASELINE CARD */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Baseline (30-Year Normal)
                </div>
                <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {prediction.baseline.value}{' '}
                  <span className="text-xs font-medium text-slate-500">
                    {prediction.baseline.unit}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{prediction.baseline.label}</div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Source: {prediction.baseline.source}
                </div>
              </div>

              {/* FORECAST CARD */}
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60">
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>AI Predicted Condition</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      prediction.forecast.deltaPct > 0
                        ? 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300'
                    }`}
                  >
                    {prediction.forecast.deltaPct > 0 ? '+' : ''}
                    {prediction.forecast.deltaPct}% vs normal
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {prediction.forecast.value}{' '}
                  <span className="text-xs font-medium text-slate-500">
                    {prediction.forecast.unit}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {prediction.forecast.label}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2">
                  Engine: {prediction.modelInfo.engine}
                </div>
              </div>
            </div>

            {/* ESTIMATED AFFECTED EXPOSURE METRICS */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Estimated Exposure & Impact Metrics
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-center">
                  <div className="text-xs text-slate-500">Exposed Population</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {prediction.estimates.exposedPopulation}
                  </div>
                  <div className="text-[10px] text-slate-400">habitations in danger zone</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-center">
                  <div className="text-xs text-slate-500">Vulnerable Dwellings</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {prediction.estimates.vulnerableHouseholds}
                  </div>
                  <div className="text-[10px] text-slate-400">kutcha structures at risk</div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-center">
                  <div className="text-xs text-slate-500">Cropland at Risk</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {prediction.estimates.croplandAtRiskHectares} ha
                  </div>
                  <div className="text-[10px] text-slate-400">fertile agricultural canopy</div>
                </div>
              </div>

              {/* INFRASTRUCTURE AT RISK */}
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                <div className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Key Infrastructure & Access Roads Exposed
                </div>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  {prediction.estimates.infrastructureAtRisk.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* PREVENTIVE DIRECTIVES & MITIGATION */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#008060]" />
              AI Preventive Directives & Civil Action Protocol
            </h3>

            {/* THREE PROTOCOL COLUMNS */}
            <div className="space-y-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  1. Immediate Operational Response (0–72 Hours)
                </div>
                <div className="space-y-1.5">
                  {prediction.mitigationMeasures.immediateActions.map((action, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-red-500 font-bold">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                  <Building className="w-4 h-4" />
                  2. Medium-Term Civil Engineering & Retrofit Directives
                </div>
                <div className="space-y-1.5">
                  {prediction.mitigationMeasures.mediumTermCivilDirectives.map((action, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <Sprout className="w-4 h-4" />
                  3. Agricultural & Livelihood Resilience Measures
                </div>
                <div className="space-y-1.5">
                  {prediction.mitigationMeasures.agriculturalDirectives.map((action, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Validated at {prediction.modelInfo.validatedTimestamp}
              </span>
              <button
                onClick={handleInspectOnMap}
                className="px-5 py-2.5 rounded-xl bg-[#008060] hover:bg-[#006e52] text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <Globe className="w-4 h-4" />
                Inspect Predicted Hazard Polygons on GIS
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

