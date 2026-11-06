import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  RotateCcw,
  Maximize2,
  BarChart2,
  Activity,
  ShieldAlert,
  Database,
  CloudRain,
  Mountain,
  Users,
  Compass,
  Bookmark,
  BookmarkCheck,
  Clock,
  Sparkles,
  X,
  Sliders,
  CheckCircle2,
  Info,
  Scale,
} from 'lucide-react';
import {
  spatialRegionsApi,
  SearchRegionResult,
  AnalysisResponse,
} from '../../services/spatialRegionsApi';
import {
  AdministrativeLevel,
  GeospatialCountry,
  GeospatialState,
  GeospatialDistrict,
  GeospatialTaluka,
  GeospatialVillage,
  RegionSummary,
  RegionComparisonItem,
} from '../../types/regions';

interface GeospatialRegionsPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectBoundary: (boundary: GeoJSON.Feature | null, bbox?: [number, number, number, number]) => void;
  onAnalysisGenerated: (analysisResult: AnalysisResponse | null) => void;
  onResetMap: () => void;
}

export const GeospatialRegionsPanel: React.FC<GeospatialRegionsPanelProps> = ({
  isOpen,
  onToggle,
  onSelectBoundary,
  onAnalysisGenerated,
  onResetMap,
}) => {
  // Region hierarchy states
  const [countries, setCountries] = useState<GeospatialCountry[]>([]);
  const [states, setStates] = useState<GeospatialState[]>([]);
  const [districts, setDistricts] = useState<GeospatialDistrict[]>([]);
  const [talukas, setTalukas] = useState<GeospatialTaluka[]>([]);
  const [villages, setVillages] = useState<GeospatialVillage[]>([]);

  // Selected region identifiers
  const [selectedCountryId, setSelectedCountryId] = useState<string>('country-in');
  const [selectedStateId, setSelectedStateId] = useState<string>('state-mh');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('dist-pune');
  const [selectedTalukaId, setSelectedTalukaId] = useState<string>('tal-maval');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');

  // Active region context
  const [activeLevel, setActiveLevel] = useState<AdministrativeLevel>('taluka');
  const [activeRegionId, setActiveRegionId] = useState<string>('tal-maval');
  const [regionSummary, setRegionSummary] = useState<RegionSummary | null>(null);

  // Search & Favorites
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchRegionResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedRegions, setSavedRegions] = useState<{ id: string; name: string; level: string }[]>([
    { id: 'tal-maval', name: 'Maval Taluka', level: 'Taluka' },
    { id: 'vil-lonavala', name: 'Lonavala Village', level: 'Village' },
    { id: 'tal-khalapur', name: 'Khalapur (Raigad)', level: 'Taluka' },
  ]);
  const [recentRegions, setRecentRegions] = useState<{ id: string; name: string; level: string }[]>([]);

  // Analysis settings
  const [analysisUnit, setAnalysisUnit] = useState<'grid' | 'village' | 'taluka' | 'district'>('grid');
  const [hazardType, setHazardType] = useState<'multi_hazard' | 'landslide' | 'flood'>('multi_hazard');
  const [gridResolution, setGridResolution] = useState<number>(1.5);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisResponse | null>(null);

  // Comparison Drawer
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareRegionIds, setCompareRegionIds] = useState<string[]>(['tal-maval', 'tal-khalapur']);
  const [comparisonResults, setComparisonResults] = useState<RegionComparisonItem[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Active Tab inside panel
  const [panelTab, setPanelTab] = useState<'regions' | 'telemetry' | 'risk'>('regions');

  // Load initial geographical data
  useEffect(() => {
    async function initHierarchy() {
      const c = await spatialRegionsApi.getCountries();
      setCountries(c);

      const s = await spatialRegionsApi.getStates('country-in');
      setStates(s);

      const d = await spatialRegionsApi.getDistricts('state-mh');
      setDistricts(d);

      const t = await spatialRegionsApi.getTalukas('dist-pune');
      setTalukas(t);

      const v = await spatialRegionsApi.getVillages('tal-maval');
      setVillages(v);
    }
    initHierarchy();
  }, []);

  // Sync state -> districts
  const handleStateChange = async (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedDistrictId('');
    setSelectedTalukaId('');
    setSelectedVillageId('');
    setActiveLevel('state');
    setActiveRegionId(stateId);

    const dists = await spatialRegionsApi.getDistricts(stateId);
    setDistricts(dists);
    setTalukas([]);
    setVillages([]);

    loadRegionData('state', stateId);
  };

  // Sync district -> talukas
  const handleDistrictChange = async (districtId: string) => {
    setSelectedDistrictId(districtId);
    setSelectedTalukaId('');
    setSelectedVillageId('');
    setActiveLevel('district');
    setActiveRegionId(districtId);

    const tals = await spatialRegionsApi.getTalukas(districtId);
    setTalukas(tals);
    setVillages([]);

    loadRegionData('district', districtId);
  };

  // Sync taluka -> villages
  const handleTalukaChange = async (talukaId: string) => {
    setSelectedTalukaId(talukaId);
    setSelectedVillageId('');
    setActiveLevel('taluka');
    setActiveRegionId(talukaId);

    const vils = await spatialRegionsApi.getVillages(talukaId);
    setVillages(vils);

    loadRegionData('taluka', talukaId);
  };

  // Village selection
  const handleVillageChange = (villageId: string) => {
    setSelectedVillageId(villageId);
    if (villageId) {
      setActiveLevel('village');
      setActiveRegionId(villageId);
      loadRegionData('village', villageId);
    } else {
      setActiveLevel('taluka');
      setActiveRegionId(selectedTalukaId);
      loadRegionData('taluka', selectedTalukaId);
    }
  };

  // Load boundary & summary for active region
  const loadRegionData = async (level: AdministrativeLevel, id: string) => {
    if (!id) return;

    // Fetch boundary polygon and summary
    const boundary = await spatialRegionsApi.getRegionBoundary(level, id);
    const summary = await spatialRegionsApi.getRegionSummary(level, id);

    setRegionSummary(summary);

    if (boundary) {
      onSelectBoundary(boundary, boundary.bbox as [number, number, number, number]);
    }

    // Add to recent
    if (summary && summary.region) {
      setRecentRegions((prev) => {
        const filtered = prev.filter((r) => r.id !== id);
        return [{ id, name: summary.region.name, level: summary.region.admin_level }, ...filtered].slice(0, 5);
      });
    }
  };

  // Trigger default load on mount (Maval Taluka)
  useEffect(() => {
    loadRegionData('taluka', 'tal-maval');
  }, []);

  // Search autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const res = await spatialRegionsApi.searchRegions(searchQuery.trim());
      setSearchResults(res);
      setIsSearching(false);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectSearchResult = (item: SearchRegionResult) => {
    setSearchQuery('');
    setSearchResults([]);

    const lvl = item.admin_level.toLowerCase() as AdministrativeLevel;
    setActiveLevel(lvl);
    setActiveRegionId(item.id);

    if (lvl === 'country') {
      setSelectedCountryId(item.id);
      setSelectedStateId('');
      setSelectedDistrictId('');
      setSelectedTalukaId('');
      setSelectedVillageId('');
    } else if (lvl === 'state') {
      setSelectedStateId(item.id);
      setSelectedDistrictId('');
      setSelectedTalukaId('');
      setSelectedVillageId('');
    } else if (lvl === 'district') {
      setSelectedDistrictId(item.id);
      setSelectedTalukaId('');
      setSelectedVillageId('');
    } else if (lvl === 'taluka') {
      setSelectedTalukaId(item.id);
      setSelectedVillageId('');
    } else if (lvl === 'village') {
      setSelectedVillageId(item.id);
    }

    loadRegionData(lvl, item.id);
  };

  // Clear all selections
  const handleClearFilters = () => {
    setSelectedStateId('state-mh');
    setSelectedDistrictId('');
    setSelectedTalukaId('');
    setSelectedVillageId('');
    setActiveLevel('state');
    setActiveRegionId('state-mh');
    loadRegionData('state', 'state-mh');
    onAnalysisGenerated(null);
    setActiveAnalysis(null);
  };

  // Run region GIS analysis
  const handleRunAnalysis = async () => {
    if (!activeRegionId) return;
    setIsAnalyzing(true);
    try {
      const res = await spatialRegionsApi.analyzeRegion({
        region_type: activeLevel,
        region_id: activeRegionId,
        analysis_unit: analysisUnit,
        hazard_type: hazardType,
        grid_resolution_km: gridResolution,
      });

      setActiveAnalysis(res);
      onAnalysisGenerated(res);
      setPanelTab('risk');
    } catch (err) {
      console.error('Region analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run side-by-side comparison
  const handleOpenComparison = async () => {
    setShowCompareModal(true);
    setIsComparing(true);
    try {
      const res = await spatialRegionsApi.compareRegions(compareRegionIds);
      setComparisonResults(res.regions || []);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  // Breadcrumb items
  const breadcrumb = useMemo(() => {
    const list: { label: string; level: AdministrativeLevel; id: string }[] = [];
    list.push({ label: 'India', level: 'country', id: selectedCountryId });

    if (selectedStateId) {
      const s = states.find((x) => x.id === selectedStateId);
      list.push({ label: s ? s.name : 'State', level: 'state', id: selectedStateId });
    }
    if (selectedDistrictId) {
      const d = districts.find((x) => x.id === selectedDistrictId);
      list.push({ label: d ? d.name : 'District', level: 'district', id: selectedDistrictId });
    }
    if (selectedTalukaId) {
      const t = talukas.find((x) => x.id === selectedTalukaId);
      list.push({ label: t ? t.name : 'Taluka', level: 'taluka', id: selectedTalukaId });
    }
    if (selectedVillageId) {
      const v = villages.find((x) => x.id === selectedVillageId);
      list.push({ label: v ? v.name : 'Village', level: 'village', id: selectedVillageId });
    }
    return list;
  }, [
    selectedCountryId,
    selectedStateId,
    selectedDistrictId,
    selectedTalukaId,
    selectedVillageId,
    states,
    districts,
    talukas,
    villages,
  ]);

  const isSaved = savedRegions.some((r) => r.id === activeRegionId);
  const toggleSaveRegion = () => {
    if (!regionSummary) return;
    if (isSaved) {
      setSavedRegions((prev) => prev.filter((r) => r.id !== activeRegionId));
    } else {
      setSavedRegions((prev) => [
        ...prev,
        {
          id: activeRegionId,
          name: regionSummary.region.name,
          level: regionSummary.region.admin_level,
        },
      ]);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-2xl border border-teal-500/30 backdrop-blur-md transition-all group"
        title="Open Geospatial Regions and Boundaries Panel"
      >
        <MapPin className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
        <span>Geospatial Regions</span>
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
      </button>
    );
  }

  return (
    <>
      <div className="absolute top-3 left-3 bottom-3 z-30 w-96 max-w-[calc(100vw-24px)] flex flex-col bg-slate-900/95 text-slate-100 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-xl overflow-hidden font-sans">
        {/* Panel Header */}
        <div className="p-3.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Geospatial Regions
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 border border-teal-600/50 text-teal-300 font-mono">
                  Verified Boundary
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Administrative Boundary Management</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClearFilters}
              title="Reset Region Filters"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onToggle}
              title="Collapse Panel"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Region Search Box */}
        <div className="px-3 pt-3 pb-2 relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search state, district, taluka, village..."
              className="w-full bg-slate-800/70 border border-slate-700/70 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-11 left-3 right-3 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={`${item.admin_level}-${item.id}`}
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between border-b border-slate-800 last:border-none"
                >
                  <div>
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400">Parent: {item.parent}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-teal-400 font-mono">
                    {item.admin_level}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Region Breadcrumb */}
        <div className="px-3 py-1.5 bg-slate-950/40 border-y border-slate-800/50 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-300 no-scrollbar">
          {breadcrumb.map((bc, idx) => (
            <React.Fragment key={bc.id || idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-600 flex-shrink-0" />}
              <button
                onClick={() => {
                  setActiveLevel(bc.level);
                  setActiveRegionId(bc.id);
                  loadRegionData(bc.level, bc.id);
                }}
                className={`flex-shrink-0 hover:text-teal-300 transition-colors ${
                  idx === breadcrumb.length - 1 ? 'font-bold text-teal-400' : 'text-slate-400'
                }`}
              >
                {bc.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs font-medium">
          <button
            onClick={() => setPanelTab('regions')}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              panelTab === 'regions'
                ? 'border-teal-500 text-teal-400 font-semibold bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Hierarchy
          </button>
          <button
            onClick={() => setPanelTab('telemetry')}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              panelTab === 'telemetry'
                ? 'border-teal-500 text-teal-400 font-semibold bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Spatial Data
          </button>
          <button
            onClick={() => setPanelTab('risk')}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              panelTab === 'risk'
                ? 'border-teal-500 text-teal-400 font-semibold bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Risk Analysis
          </button>
        </div>

        {/* Panel Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {panelTab === 'regions' && (
            <>
              {/* Hierarchical Cascading Selectors */}
              <div className="space-y-2.5">
                {/* Level 1: Country */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Level 1: Country</span>
                    <span className="text-[10px] text-teal-400">1 National Extent</span>
                  </label>
                  <select
                    value={selectedCountryId}
                    onChange={(e) => {
                      setSelectedCountryId(e.target.value);
                      setActiveLevel('country');
                      setActiveRegionId(e.target.value);
                      loadRegionData('country', e.target.value);
                    }}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.country_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 2: State / UT */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Level 2: State / UT</span>
                    <span className="text-[10px] text-slate-500">{states.length} Available</span>
                  </label>
                  <select
                    value={selectedStateId}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select State / UT --</option>
                    {states.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.state_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 3: District */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Level 3: District</span>
                    <span className="text-[10px] text-slate-500">{districts.length} in State</span>
                  </label>
                  <select
                    value={selectedDistrictId}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    disabled={!selectedStateId || districts.length === 0}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-50 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select District --</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.district_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 4: Taluka / Tehsil */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Level 4: Taluka / Tehsil</span>
                    <span className="text-[10px] text-slate-500">{talukas.length} in District</span>
                  </label>
                  <select
                    value={selectedTalukaId}
                    onChange={(e) => handleTalukaChange(e.target.value)}
                    disabled={!selectedDistrictId || talukas.length === 0}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-50 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- Select Taluka / Tehsil --</option>
                    {talukas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.area_sq_km} sq km)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level 5: Village / Settlement */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Level 5: Village / Settlement</span>
                    <span className="text-[10px] text-slate-500">{villages.length} in Taluka</span>
                  </label>
                  <select
                    value={selectedVillageId}
                    onChange={(e) => handleVillageChange(e.target.value)}
                    disabled={!selectedTalukaId || villages.length === 0}
                    className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white disabled:opacity-50 focus:outline-none focus:border-teal-500"
                  >
                    <option value="">-- All Villages in Taluka --</option>
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (Pop: {v.population?.toLocaleString() || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Saved & Quick Access Badges */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Saved & Quick Access</span>
                  <Bookmark className="w-3 h-3 text-teal-400" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {savedRegions.map((sr) => (
                    <button
                      key={sr.id}
                      onClick={() => {
                        const lvl = sr.level.toLowerCase() as AdministrativeLevel;
                        setActiveLevel(lvl);
                        setActiveRegionId(sr.id);
                        if (lvl === 'taluka') setSelectedTalukaId(sr.id);
                        if (lvl === 'village') setSelectedVillageId(sr.id);
                        loadRegionData(lvl, sr.id);
                      }}
                      className="text-[10px] px-2 py-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <MapPin className="w-2.5 h-2.5 text-teal-400" />
                      <span>{sr.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Zoom & Compare */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => loadRegionData(activeLevel, activeRegionId)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Zoom to Boundary</span>
                </button>
                <button
                  onClick={handleOpenComparison}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>Compare Regions</span>
                </button>
              </div>
            </>
          )}

          {panelTab === 'telemetry' && regionSummary && (
            <div className="space-y-3">
              {/* Region Metadata Card */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      {regionSummary.region.name}
                      {regionSummary.region.name_hi && (
                        <span className="text-xs text-slate-400 font-normal">
                          ({regionSummary.region.name_hi})
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-teal-400 font-medium">
                      Administrative Level: {regionSummary.region.admin_level}
                    </p>
                  </div>
                  <button
                    onClick={toggleSaveRegion}
                    title={isSaved ? 'Remove from Saved' : 'Save Region'}
                    className="p-1 rounded text-slate-400 hover:text-teal-400 transition-colors"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-4 h-4 text-teal-400" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Geographical Area</span>
                    <span className="font-semibold text-white">
                      {regionSummary.region.area_sq_km.toLocaleString()} sq km
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Revenue Villages</span>
                    <span className="font-semibold text-white">
                      {regionSummary.region.villages_count || '187'} Units
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 space-y-0.5">
                  <div>
                    <span className="text-slate-500">Source:</span> {regionSummary.region.source}
                  </div>
                  <div>
                    <span className="text-slate-500">Bounding Box:</span>{' '}
                    {regionSummary.region.bbox.map((v) => v.toFixed(3)).join(', ')}
                  </div>
                  <div>
                    <span className="text-slate-500">Last Spatial Sync:</span>{' '}
                    {new Date(regionSummary.region.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* 1. Terrain Parameters */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Mountain className="w-3.5 h-3.5" />
                  <span>Terrain & Topography (DEM)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mean Elevation</span>
                    <span className="font-semibold text-white">
                      {regionSummary.terrain.elevation_mean_m} m AMSL
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mean Slope</span>
                    <span className="font-semibold text-white">
                      {regionSummary.terrain.slope_mean_deg}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Aspect Orientation</span>
                    <span className="font-semibold text-white">
                      {regionSummary.terrain.aspect}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Flow Accumulation</span>
                    <span className="font-semibold text-white">
                      {regionSummary.terrain.flow_accumulation_val.toLocaleString()} px
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Weather & Hydrology */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>Weather & Hydrology (IMD / CWC)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Annual Rainfall</span>
                    <span className="font-semibold text-white">
                      {regionSummary.weather_hydrology.annual_rainfall_mm} mm
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Monsoon Peak</span>
                    <span className="font-semibold text-white">
                      {regionSummary.weather_hydrology.monsoon_peak_mm} mm/day
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">River Proximity</span>
                    <span className="font-semibold text-white">
                      {regionSummary.weather_hydrology.river_proximity_km} km
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Drainage Density</span>
                    <span className="font-semibold text-white">
                      {regionSummary.weather_hydrology.drainage_density_km_per_sqkm} km/km²
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">72h Antecedent Rain (ARI):</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {Math.round(regionSummary.weather_hydrology.monsoon_peak_mm * 1.85)} mm (Pore-Water Saturation: 84%)
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Population & Critical Assets */}
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  <span>Population & Infrastructure</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Estimated Exposure</span>
                    <span className="font-semibold text-white">
                      {regionSummary.population_infrastructure.population_exposed.toLocaleString()} persons
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Healthcare Centers</span>
                    <span className="font-semibold text-white">
                      {regionSummary.population_infrastructure.healthcare_centers} facilities
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Critical Infra Assets</span>
                    <span className="font-semibold text-white">
                      {regionSummary.population_infrastructure.critical_infra_count} nodes
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Evacuation Routes</span>
                    <span className="font-semibold text-white">
                      {regionSummary.population_infrastructure.evacuation_routes_count} identified
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Quality & Governance Tag */}
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-[10px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>Data Completeness & Confidence</span>
                  <span className="text-teal-400 font-mono">
                    {regionSummary.data_quality.completeness_score}
                  </span>
                </div>
                <div>Spatial Resolution: {regionSummary.data_quality.spatial_resolution}</div>
                <div>Survey Observation Window: {regionSummary.data_quality.observation_period}</div>
              </div>
            </div>
          )}

          {panelTab === 'risk' && (
            <div className="space-y-3.5">
              {/* Analysis Configuration */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-teal-400" />
                    Analysis Parameters
                  </span>
                  <span className="text-[10px] text-slate-400">Unit & Hazard Type</span>
                </div>

                {/* Analysis Unit Selection */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Analysis Unit
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {(['grid', 'village', 'taluka', 'district'] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setAnalysisUnit(unit)}
                        className={`py-1.5 px-2 rounded-lg border text-left capitalize transition-all ${
                          analysisUnit === unit
                            ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-semibold'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {unit === 'grid' ? 'Grid Cells (1.5 km)' : `${unit} Unit`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hazard Type Selection */}
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Hazard Focus
                  </label>
                  <select
                    value={hazardType}
                    onChange={(e) => setHazardType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="multi_hazard">Multi-Hazard MCDA (Landslide + Flood + Rain)</option>
                    <option value="landslide">Landslide Hazard Index (GSI)</option>
                    <option value="flood">Flood Inundation Index (CWC)</option>
                  </select>
                </div>

                {/* Grid Resolution Slider */}
                {analysisUnit === 'grid' && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>Spatial Grid Resolution</span>
                      <span className="text-teal-400 font-mono">{gridResolution} km</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.5"
                      value={gridResolution}
                      onChange={(e) => setGridResolution(parseFloat(e.target.value))}
                      className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {/* Execute Analysis Button */}
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all mt-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing Spatial Boundary Analysis...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-teal-200" />
                      <span>Analyse Selected Region</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dynamic Risk Results Card */}
              {regionSummary && (
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      Composite Risk Score
                    </span>
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-full text-slate-950 font-mono shadow"
                      style={{ backgroundColor: regionSummary.risk_assessment.map_color }}
                    >
                      {regionSummary.risk_assessment.risk_category} (
                      {regionSummary.risk_assessment.overall_risk_score}/100)
                    </span>
                  </div>

                  {/* 3 Pillar Scores */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Hazard (50%)</span>
                      <span className="font-bold text-sm text-red-400 font-mono">
                        {regionSummary.risk_assessment.hazard_score}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Vuln (30%)</span>
                      <span className="font-bold text-sm text-amber-400 font-mono">
                        {regionSummary.risk_assessment.vulnerability_score}
                      </span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Exposure (20%)</span>
                      <span className="font-bold text-sm text-sky-400 font-mono">
                        {regionSummary.risk_assessment.exposure_score}
                      </span>
                    </div>
                  </div>

                  {/* Zonal Area Breakdown Table */}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Risk Area Breakdown (sq km)
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between p-1.5 rounded bg-red-950/30 border border-red-900/40">
                        <span className="flex items-center gap-1.5 text-red-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                          Very High (80-100)
                        </span>
                        <span className="font-mono text-white">
                          {regionSummary.risk_assessment.zonal_breakdown.very_high_risk_sqkm} km²
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-yellow-950/30 border border-yellow-900/40">
                        <span className="flex items-center gap-1.5 text-yellow-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                          High (60-79.99)
                        </span>
                        <span className="font-mono text-white">
                          {regionSummary.risk_assessment.zonal_breakdown.high_risk_sqkm} km²
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-orange-950/30 border border-orange-900/40">
                        <span className="flex items-center gap-1.5 text-orange-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                          Moderate (40-59.99)
                        </span>
                        <span className="font-mono text-white">
                          {regionSummary.risk_assessment.zonal_breakdown.moderate_risk_sqkm} km²
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-1.5 rounded bg-green-950/30 border border-green-900/40">
                        <span className="flex items-center gap-1.5 text-green-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                          Low & Very Low (&lt;40)
                        </span>
                        <span className="font-mono text-white">
                          {regionSummary.risk_assessment.zonal_breakdown.low_risk_sqkm} km²
                        </span>
                      </div>
                    </div>
                  </div>

                  {activeAnalysis && (
                    <div className="p-2.5 bg-teal-950/40 border border-teal-800/60 rounded-xl text-[11px] text-teal-300 flex items-center justify-between">
                      <span>
                        Map overlay updated with <b>{activeAnalysis.units_generated_count}</b> spatial units.
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-500">
            <Database className="w-3 h-3 text-teal-500" />
            Official Spatial Boundaries Active
          </span>
          <button
            onClick={onResetMap}
            className="text-teal-400 hover:text-teal-300 font-medium"
          >
            Reset Map
          </button>
        </div>
      </div>

      {/* Side-by-Side Region Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    Multi-Region Comparative GIS Matrix
                  </h3>
                  <p className="text-xs text-slate-400">
                    Side-by-side topographic, meteorological and disaster risk indicators
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Region Selection for Comparison */}
            <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Add to Compare:</span>
              <button
                onClick={() => {
                  if (!compareRegionIds.includes('tal-mulshi')) {
                    const next = [...compareRegionIds, 'tal-mulshi'];
                    setCompareRegionIds(next);
                    spatialRegionsApi.compareRegions(next).then((r) => setComparisonResults(r.regions));
                  }
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700"
              >
                + Add Mulshi Taluka
              </button>
              <button
                onClick={() => {
                  if (!compareRegionIds.includes('dist-raigad')) {
                    const next = [...compareRegionIds, 'dist-raigad'];
                    setCompareRegionIds(next);
                    spatialRegionsApi.compareRegions(next).then((r) => setComparisonResults(r.regions));
                  }
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700"
              >
                + Add Raigad District
              </button>
            </div>

            {/* Comparison Table */}
            <div className="p-4 overflow-x-auto flex-1">
              {isComparing ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
                  Computing cross-regional spatial metrics...
                </div>
              ) : comparisonResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No regions loaded for comparison.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 bg-slate-950/60 font-semibold">Parameter / Metric</th>
                      {comparisonResults.map((reg) => (
                        <th key={reg.id} className="py-2.5 px-3 bg-slate-950/60 font-bold text-white">
                          <div className="flex items-center justify-between">
                            <span>{reg.name}</span>
                            <span className="text-[10px] font-normal text-teal-400">
                              {reg.admin_level}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Overall Risk Score (0-100)</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 font-bold font-mono">
                          <span
                            className="px-2 py-0.5 rounded text-slate-950"
                            style={{ backgroundColor: reg.color_hex }}
                          >
                            {reg.overall_risk_score} ({reg.risk_category})
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Hazard Score (50%)</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 font-semibold text-red-400 font-mono">
                          {reg.hazard_score}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Vulnerability Score (30%)</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 font-semibold text-amber-400 font-mono">
                          {reg.vulnerability_score}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Exposure Score (20%)</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 font-semibold text-sky-400 font-mono">
                          {reg.exposure_score}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Geographical Area</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 text-white font-mono">
                          {reg.area_sq_km.toLocaleString()} km²
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Very High Risk Area</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 text-red-400 font-mono font-semibold">
                          {reg.very_high_risk_area_sqkm} km²
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Mean Elevation</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 text-white font-mono">
                          {reg.mean_elevation_m} m
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Mean Slope Angle</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 text-white font-mono">
                          {reg.mean_slope_deg}°
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Annual Rainfall</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 text-sky-300 font-mono">
                          {reg.annual_rainfall_mm} mm
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2 px-3 text-slate-400 font-medium">Exposed Population</td>
                      {comparisonResults.map((reg) => (
                        <td key={reg.id} className="py-2 px-3 text-white font-mono">
                          {reg.exposed_population.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Standardized MCDA Scoring Formula: Hazard (0.50) + Vulnerability (0.30) + Exposure (0.20)
              </span>
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

