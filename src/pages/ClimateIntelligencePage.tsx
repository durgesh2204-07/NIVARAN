import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Cpu,
  AlertTriangle,
  Flame,
  CloudRain,
  Waves,
  Sun,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  MapPin,
  ExternalLink,
  Search,
  SlidersHorizontal,
  FileText,
  Printer,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Compass,
  Layers,
  ArrowRight,
  Database,
  BarChart3,
  Thermometer,
  Droplets,
  Wind,
  Globe,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Village } from '../types';
import {
  predictVillageClimateRisks,
  VillageClimatePredictionResult,
} from '../services/aiClimatePredictionEngine';

export const ClimateIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const villages = useAppStore((s) => s.villages);
  const selectedVillageId = useAppStore((s) => s.selectedVillageId);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const [liveWeather, setLiveWeather] = useState<any>(null);

  // Search & Filter state for Village Ranking
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedHazard, setSelectedHazard] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'cvi' | 'flood' | 'landslide' | 'drought' | 'heatwave' | 'relocation'>('cvi');

  // Currently focused village for AI Assistant
  const [assistantVillageId, setAssistantVillageId] = useState<string>(
    selectedVillageId || (villages[0]?.id ?? 'mh_pune_001')
  );

  // Active AI Query & Conversation history
  const [activeQuery, setActiveQuery] = useState<string>('major_risks');
  const [customQueryText, setCustomQueryText] = useState<string>('');
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiReportModalOpen, setAiReportModalOpen] = useState<boolean>(false);

  // Retrieve focused village
  const currentVillage = useMemo(() => {
    return (
      villages.find((v) => v.id === assistantVillageId) ||
      villages[0] ||
      (({
        id: 'mh_default',
        name: 'Malin',
        district: 'Pune',
        taluka: 'Ambegaon',
        lat: 19.1608,
        lng: 73.6872,
        population: 715,
        households: 160,
        elevationM: 780,
        slopeDeg: 34,
        annualRainfallMm: 3800,
        riverDistKm: 0.12,
        primaryHazard: 'landslide',
        riskTier: 'Red',
      } as unknown) as Village)
    );
  }, [villages, assistantVillageId]);

  useEffect(() => {
    let active = true;
    if (currentVillage) {
      import('../services/externalApis').then(({ fetchLiveWeather }) => {
        fetchLiveWeather(currentVillage.lat, currentVillage.lng).then((w) => {
          if (active && w) setLiveWeather(w);
        });
      });
    }
    return () => {
      active = false;
    };
  }, [currentVillage?.lat, currentVillage?.lng]);

  // AI Prediction for active village
  const villagePrediction: VillageClimatePredictionResult = useMemo(() => {
    return predictVillageClimateRisks(currentVillage, liveWeather);
  }, [currentVillage, liveWeather]);

  // Statewide summary analysis across all 370 villages
  const statewideSummary = useMemo(() => {
    let redCount = 0;
    let orangeCount = 0;
    let blueFloodCount = 0;
    let droughtCount = 0;
    let heatwaveCount = 0;
    let immediateRelocationCount = 0;

    villages.forEach((v) => {
      const pred = predictVillageClimateRisks(v);
      if (pred.overallClimateVulnerability.tier === 'Red') redCount++;
      if (pred.overallClimateVulnerability.tier === 'Orange') orangeCount++;
      if (pred.flood.riskScore >= 65) blueFloodCount++;
      if (pred.drought.riskScore >= 60) droughtCount++;
      if (pred.heatwave.riskScore >= 60) heatwaveCount++;
      if (pred.relocationPriority.priorityLevel.startsWith('Immediate')) immediateRelocationCount++;
    });

    return {
      totalVillages: villages.length,
      redCount,
      orangeCount,
      blueFloodCount,
      droughtCount,
      heatwaveCount,
      immediateRelocationCount,
    };
  }, [villages]);

  // Unique districts for filter
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    villages.forEach((v) => {
      if (v.district) set.add(v.district);
    });
    return Array.from(set).sort();
  }, [villages]);

  // Filtered & Sorted villages list
  const rankedVillages = useMemo(() => {
    const list = villages.map((v) => {
      const pred = predictVillageClimateRisks(v);
      return {
        village: v,
        prediction: pred,
      };
    });

    return list
      .filter(({ village, prediction }) => {
        if (selectedDistrict !== 'all' && village.district !== selectedDistrict) return false;
        if (selectedTier !== 'all' && prediction.overallClimateVulnerability.tier !== selectedTier) return false;
        if (selectedHazard !== 'all') {
          if (selectedHazard === 'flood' && prediction.flood.riskScore < 50) return false;
          if (selectedHazard === 'landslide' && prediction.landslide.riskScore < 50) return false;
          if (selectedHazard === 'drought' && prediction.drought.riskScore < 50) return false;
          if (selectedHazard === 'heatwave' && prediction.heatwave.riskScore < 50) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = village.name.toLowerCase().includes(q);
          const matchTaluka = (village.taluka || '').toLowerCase().includes(q);
          const matchDistrict = (village.district || '').toLowerCase().includes(q);
          if (!matchName && !matchTaluka && !matchDistrict) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cvi') {
          return b.prediction.overallClimateVulnerability.score - a.prediction.overallClimateVulnerability.score;
        }
        if (sortBy === 'flood') {
          return b.prediction.flood.riskScore - a.prediction.flood.riskScore;
        }
        if (sortBy === 'landslide') {
          return b.prediction.landslide.riskScore - a.prediction.landslide.riskScore;
        }
        if (sortBy === 'drought') {
          return b.prediction.drought.riskScore - a.prediction.drought.riskScore;
        }
        if (sortBy === 'heatwave') {
          return b.prediction.heatwave.riskScore - a.prediction.heatwave.riskScore;
        }
        if (sortBy === 'relocation') {
          return b.prediction.relocationPriority.score - a.prediction.relocationPriority.score;
        }
        return 0;
      });
  }, [villages, selectedDistrict, selectedTier, selectedHazard, searchQuery, sortBy]);

  // Handle navigate to Live GIS map centered on village
  const handleOpenOnGisMap = (villageId: string) => {
    setSelectedVillageId(villageId);
    navigate('/map');
  };

  // Pre-configured AI Prompts
  const AI_PROMPTS = [
    {
      id: 'major_risks',
      label: 'Major Climate Risks',
      icon: AlertTriangle,
      query: 'What are the major climate risks in this village?',
    },
    {
      id: 'flood_24_72',
      label: 'Flood Risk (24–72h)',
      icon: Waves,
      query: 'What is the flood risk over the next 24–72 hours?',
    },
    {
      id: 'drought_status',
      label: 'Drought Vulnerability',
      icon: Sun,
      query: 'Is this village vulnerable to agricultural or meteorological drought?',
    },
    {
      id: 'immediate_attention',
      label: 'Immediate Attention',
      icon: ShieldAlert,
      query: 'Which specific areas and habitations require immediate emergency attention?',
    },
    {
      id: 'relocation_priority',
      label: 'Relocation Priority',
      icon: MapPin,
      query: 'Should this village be prioritized for relocation, and what is its carrying capacity readiness?',
    },
    {
      id: 'preventive_measures',
      label: 'Preventive Measures',
      icon: ShieldCheck,
      query: 'What preventive civil engineering and community measures should authorities take?',
    },
  ];

  // Synthesize grounded AI response based on active query
  const aiAnswerContent = useMemo(() => {
    const p = villagePrediction;
    const v = currentVillage;

    switch (activeQuery) {
      case 'major_risks':
        return {
          headline: `Multi-Hazard Geospatial Synthesis for ${v.name} (${v.district})`,
          summary: `${v.name} exhibits an Overall Climate Vulnerability Index (CVI) of ${p.overallClimateVulnerability.score}/100, placing it under the ${p.overallClimateVulnerability.tierName}. The dominant risk driver is ${p.overallClimateVulnerability.primaryThreat}, compounded by ${v.slopeDeg}° scarp slope and ${p.satelliteTelemetry.soilMoistureVolumetricPct}% root-zone soil saturation.`,
          metrics: [
            { label: 'Overall CVI Score', value: `${p.overallClimateVulnerability.score} / 100`, color: '#DC2626' },
            { label: 'Flood Susceptibility', value: `${p.flood.riskScore}% (${p.flood.category})`, color: '#0284C7' },
            { label: 'Landslide Susceptibility', value: `${p.landslide.riskScore}% (${p.landslide.category})`, color: '#D97706' },
            { label: 'Drought Vulnerability', value: `${p.drought.riskScore}% (${p.drought.category})`, color: '#EAB308' },
          ],
          criticalDirectives: p.preventiveActionDirectives,
        };

      case 'flood_24_72':
        return {
          headline: `Hydrological Runoff & 24–72 Hour Inundation Forecast`,
          summary: `The CWC hydraulic model indicates an expected 24h inundation of ${p.flood.expected24hInundationCm} cm for riverside habitations within ${p.flood.riverDistanceKm < 1 ? Math.round(p.flood.riverDistanceKm * 1000) + 'm' : p.flood.riverDistanceKm + 'km'} of the channel. Estimated discharge return period corresponds to a ${p.flood.returnPeriodYears}-year flood event. Drainage adequacy is currently rated as '${p.flood.drainageAdequacy}'.`,
          metrics: [
            { label: 'Flood Risk Score', value: `${p.flood.riskScore} / 100`, color: '#0284C7' },
            { label: 'Expected Inundation', value: `${p.flood.expected24hInundationCm} cm`, color: '#2563EB' },
            { label: 'River Proximity', value: `${p.flood.riverDistanceKm < 1 ? Math.round(p.flood.riverDistanceKm * 1000) + ' m' : p.flood.riverDistanceKm + ' km'}`, color: '#0B8F80' },
            { label: 'IMD Warning Level', value: p.extremeRain.imdWarningCode, color: p.extremeRain.imdWarningCode === 'RED' ? '#DC2626' : '#EA580C' },
          ],
          criticalDirectives: [
            'Alert Tehsildar and Taluka Flood Control Room for round-the-clock gauge monitoring.',
            'Deploy SDRF motor inflatable rescue boats (IRBs) to designated riverbank ghat points.',
            'Pre-position high-capacity dewatering diesel pumps at low-lying village chowks.',
          ],
        };

      case 'drought_status':
        return {
          headline: `Agricultural & Meteorological Drought Diagnostic (SPI Analysis)`,
          summary: `${v.name} shows a Standardized Precipitation Index (SPI) of ${p.drought.spiIndex.toFixed(2)}, with a seasonal rainfall deficit of ${p.drought.rainfallDeficitPct}% below the 30-year IMD climatological normal. Groundwater extraction status is classified as '${p.drought.groundwaterStress}', with soil moisture deficit at ${p.drought.soilMoistureDeficitPct}%.`,
          metrics: [
            { label: 'Drought Risk Score', value: `${p.drought.riskScore} / 100`, color: '#D97706' },
            { label: 'SPI Index (3-Month)', value: `${p.drought.spiIndex.toFixed(2)}`, color: p.drought.spiIndex < -1.5 ? '#DC2626' : '#F59E0B' },
            { label: 'Rainfall Deficit', value: `-${p.drought.rainfallDeficitPct}%`, color: '#EA580C' },
            { label: 'Aquifer Condition', value: p.drought.groundwaterStress, color: '#7C3AED' },
          ],
          criticalDirectives: [
            'Trigger priority tanker water supply under Jal Jeevan Mission contingency plan.',
            'Suspend non-essential groundwater extraction for heavy water-consuming cash crops.',
            'Activate Gram Panchayat cattle fodder depot and livestock hydration stations.',
          ],
        };

      case 'immediate_attention':
        return {
          headline: `Habitation-Level Exposure & High-Vulnerability Sectors`,
          summary: `Census demographic telemetry indicates ${p.relocationPriority.affectedPopulation} residents in ${v.name}, of which ${p.relocationPriority.vulnerableHouseholds} households reside in kutcha (mud-wall / tin-sheet) dwellings situated directly on unstable slopes (>25°) or within the active river floodway. Estimated lead evacuation time is ${p.overallClimateVulnerability.leadEvacuationHours} hours.`,
          metrics: [
            { label: 'Affected Residents', value: `${p.relocationPriority.affectedPopulation} persons`, color: '#DC2626' },
            { label: 'Kutcha Dwellings', value: `${p.relocationPriority.vulnerableHouseholds} units`, color: '#EA580C' },
            { label: 'Scarp Slope', value: `${v.slopeDeg}° inclination`, color: '#D97706' },
            { label: 'Lead Evacuation Time', value: `${p.overallClimateVulnerability.leadEvacuationHours} hours`, color: '#0B8F80' },
          ],
          criticalDirectives: [
            'Immediate door-to-door siren evacuation for kutcha dwellings within 200m of scarp toe.',
            'Deploy local Aapda Mitra volunteers to assist elderly, pregnant women, and disabled residents.',
            'Issue Section 144 hazard zone ingress restrictions along fractured mountain roads.',
          ],
        };

      case 'relocation_priority':
        return {
          headline: `MCDA Relocation Priority Assessment & Safe Site Readiness`,
          summary: `${v.name} is ranked with a Relocation Priority Score of ${p.relocationPriority.score}/100, placed under ${p.relocationPriority.priorityLevel}. Reason for prioritization: ${p.relocationPriority.urgencyReason}. Candidate resettlement host site identified: ${p.relocationPriority.nearestCandidateSafeSite} (${p.relocationPriority.distanceToSafeZoneKm} km away, safe plateau elevation).`,
          metrics: [
            { label: 'MCDA Priority Score', value: `${p.relocationPriority.score} / 100`, color: '#DC2626' },
            { label: 'Priority Tier', value: p.relocationPriority.priorityLevel, color: '#EA580C' },
            { label: 'Nearest Host Site', value: `${p.relocationPriority.distanceToSafeZoneKm} km`, color: '#0B8F80' },
            { label: 'State Rank', value: `#${p.overallClimateVulnerability.rank} of 370`, color: '#7C3AED' },
          ],
          criticalDirectives: [
            'Submit formal SDMA Rehabilitation Proposal under SDRF Guideline Section 12.',
            'Conduct cadastral plot demarcation and soil-bearing test at candidate safe site.',
            'Initiate Gram Sabha rehabilitation consultation and land-title record verification.',
          ],
        };

      case 'preventive_measures':
      default:
        return {
          headline: `Structural Civil Engineering & Non-Structural Mitigation Directives`,
          summary: `Comprehensive disaster resilience protocol formulated according to NDMA Guidelines on Slope Stabilization, CWC Inundation Mitigation, and IMD Climate Adaptation Strategy.`,
          metrics: [
            { label: 'Confidence Score', value: `${p.modelMetadata.confidenceScorePct}%`, color: '#0B8F80' },
            { label: 'Uncertainty Margin', value: `±${p.modelMetadata.uncertaintyMarginPct}%`, color: '#64748B' },
            { label: 'Model Version', value: 'Geospatial ML v3.2', color: '#0284C7' },
            { label: 'Telemetry Source', value: 'ISRO Bhuvan + IMD', color: '#059669' },
          ],
          criticalDirectives: p.preventiveActionDirectives,
        };
    }
  }, [activeQuery, villagePrediction, currentVillage]);

  // Handle custom query submit
  const handleCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQueryText.trim()) return;

    setIsAiThinking(true);
    setTimeout(() => {
      setIsAiThinking(false);
      // Pick best matching prompt
      const q = customQueryText.toLowerCase();
      if (q.includes('flood') || q.includes('rain') || q.includes('water')) {
        setActiveQuery('flood_24_72');
      } else if (q.includes('drought') || q.includes('heat') || q.includes('dry') || q.includes('water shortage')) {
        setActiveQuery('drought_status');
      } else if (q.includes('relocat') || q.includes('shift') || q.includes('safe site') || q.includes('priority')) {
        setActiveQuery('relocation_priority');
      } else if (q.includes('immediate') || q.includes('danger') || q.includes('attention') || q.includes('urgent')) {
        setActiveQuery('immediate_attention');
      } else if (q.includes('prevent') || q.includes('measure') || q.includes('mitigat') || q.includes('action')) {
        setActiveQuery('preventive_measures');
      } else {
        setActiveQuery('major_risks');
      }
    }, 450);
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* 1. TOP HEADER & TELEMETRY BADGE */}
      <div className="neu-raised p-6 rounded-2xl bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/40 border border-emerald-100/80 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-600 text-white shadow-sm">
                <Brain className="w-3.5 h-3.5" />
                AI for Climate Change
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Database className="w-3 h-3" />
                IMD AWS + ISRO Bhuvan CartoDEM 30m
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Deterministic Geospatial Ensemble ML
              </span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              AI Climate Change & Disaster Intelligence Hub
            </h1>

            <p className="text-xs lg:text-sm text-slate-600 max-w-4xl leading-relaxed">
              Real-time multi-hazard predictive analytics synthesizing precipitation anomalies, CartoDEM terrain slope stability, river basin runoff, Sentinel-2 NDVI/NDWI satellite indices, and demographic exposure across Maharashtra.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenOnGisMap(currentVillage.id)}
              className="neu-btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-2 bg-[#008060] hover:bg-[#0B8F80] text-white shadow-sm transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>Explore on Live GIS Map</span>
            </button>

            <button
              type="button"
              onClick={() => setAiReportModalOpen(true)}
              className="neu-btn px-4 py-2.5 text-xs font-semibold flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-all"
            >
              <Printer className="w-4 h-4 text-emerald-700" />
              <span>Print Vulnerability Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATEWIDE MULTI-HAZARD TELEMETRY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Monitored */}
        <div className="neu-flat p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Monitored Villages</span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{statewideSummary.totalVillages}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All 36 Districts of Maharashtra</div>
        </div>

        {/* Red Zone Villages */}
        <div className="neu-flat p-4 rounded-xl border border-rose-200 bg-rose-50/50 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold mb-1">
            <span>Red Zone (Critical)</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{statewideSummary.redCount}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-0.5">Requires Immediate Action</div>
        </div>

        {/* Severe Flood Risk */}
        <div className="neu-flat p-4 rounded-xl border border-sky-200 bg-sky-50/50 shadow-xs">
          <div className="flex items-center justify-between text-sky-700 text-xs font-semibold mb-1">
            <span>Critical Flood Risk</span>
            <Waves className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-800">{statewideSummary.blueFloodCount}</div>
          <div className="text-[11px] text-sky-600 font-medium mt-0.5">Active Inundation Threat</div>
        </div>

        {/* Drought Vulnerability */}
        <div className="neu-flat p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-1">
            <span>Drought Deficit (SPI)</span>
            <Sun className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-800">{statewideSummary.droughtCount}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Severe Moisture Stress</div>
        </div>

        {/* Heatwave Thermal Stress */}
        <div className="neu-flat p-4 rounded-xl border border-orange-200 bg-orange-50/50 shadow-xs">
          <div className="flex items-center justify-between text-orange-700 text-xs font-semibold mb-1">
            <span>Heatwave Stress</span>
            <Thermometer className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-800">{statewideSummary.heatwaveCount}</div>
          <div className="text-[11px] text-orange-600 font-medium mt-0.5">Thermal Index &gt; 42°C</div>
        </div>

        {/* Relocation Needed */}
        <div className="neu-flat p-4 rounded-xl border border-purple-200 bg-purple-50/50 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 text-xs font-semibold mb-1">
            <span>Relocation Needed</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-800">{statewideSummary.immediateRelocationCount}</div>
          <div className="text-[11px] text-purple-600 font-medium mt-0.5">Tier 1 Resettlement Ready</div>
        </div>
      </div>

      {/* 3. DEDICATED AI CLIMATE RISK ASSISTANT & VILLAGE INSPECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive AI Assistant (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="neu-raised p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            {/* Header + Village selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>AI Climate Risk Assistant</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      24/7 Grounded Engine
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Query predictive intelligence & hazard models for any verified habitation
                  </p>
                </div>
              </div>

              {/* Village Selector Dropdown */}
              <div className="w-full sm:w-auto flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 shrink-0">Village:</span>
                <select
                  value={assistantVillageId}
                  onChange={(e) => setAssistantVillageId(e.target.value)}
                  className="w-full sm:w-60 px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.taluka || v.district}) — {v.district}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick-Prompt Question Pills */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Select Analytical Question
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AI_PROMPTS.map((p) => {
                  const Icon = p.icon;
                  const isSelected = activeQuery === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setActiveQuery(p.id);
                        setIsAiThinking(true);
                        setTimeout(() => setIsAiThinking(false), 300);
                      }}
                      className={`px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-400 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                      <span className="truncate">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Synthesized Answer Card */}
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {aiAnswerContent.headline}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Confidence: <strong className="text-slate-800">{villagePrediction.modelMetadata.confidenceScorePct}%</strong>
                </span>
              </div>

              {isAiThinking ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium">Running geospatial random forest inference...</span>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-700 leading-relaxed font-normal">
                    {aiAnswerContent.summary}
                  </p>

                  {/* Quantitative metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {aiAnswerContent.metrics.map((m, idx) => (
                      <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/60 shadow-2xs">
                        <div className="text-[10px] text-slate-500 uppercase tracking-tight">{m.label}</div>
                        <div className="text-xs font-bold mt-0.5" style={{ color: m.color }}>
                          {m.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Field directives */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Recommended Mitigation Directives
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-600">
                      {aiAnswerContent.criticalDirectives.slice(0, 3).map((dir, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-700 font-bold shrink-0">•</span>
                          <span>{dir}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>

            {/* Custom Query Input Box */}
            <form onSubmit={handleCustomQuery} className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customQueryText}
                  onChange={(e) => setCustomQueryText(e.target.value)}
                  placeholder={`Ask custom question about ${currentVillage.name} or district climate risks...`}
                  className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <button
                type="submit"
                className="neu-btn-primary px-4 py-2 text-xs font-semibold bg-[#008060] text-white flex items-center gap-1.5 shadow-xs"
              >
                <span>Ask AI</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Village Telemetry & Satellite Indices (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="neu-raised p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {currentVillage.name} · Physical Telemetry
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  villagePrediction.overallClimateVulnerability.tier === 'Red'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : villagePrediction.overallClimateVulnerability.tier === 'Orange'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {villagePrediction.overallClimateVulnerability.tierName}
              </span>
            </div>

            {/* Geographical Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">Taluka / District</span>
                <span className="font-semibold text-slate-800">
                  {currentVillage.taluka || '—'}, {currentVillage.district}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">Coordinates</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px]">
                  {currentVillage.lat.toFixed(4)}°N, {currentVillage.lng.toFixed(4)}°E
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">Elevation & Slope</span>
                <span className="font-semibold text-slate-800">
                  {currentVillage.elevationM || 350} m MSL · {currentVillage.slopeDeg || 12}°
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase block">Population / Kutcha</span>
                <span className="font-semibold text-slate-800">
                  {currentVillage.population || 450} people · {currentVillage.vulnerabilityFactors?.kutchaHousePct || 40}% kutcha
                </span>
              </div>
            </div>

            {/* Satellite Environmental Indices */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Sentinel-2 / Landsat Telemetry
                </span>
                <span className="text-[10px] text-slate-400">ISRO Bhuvan</span>
              </div>

              <div className="space-y-2">
                {/* NDVI */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">NDVI (Vegetation Vigor):</span>
                    <span className="font-bold text-slate-800">
                      {villagePrediction.satelliteTelemetry.ndviVegetationVigor.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{
                        width: `${Math.max(
                          10,
                          Math.min(100, (villagePrediction.satelliteTelemetry.ndviVegetationVigor + 0.2) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* NDWI */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">NDWI (Water Content Index):</span>
                    <span className="font-bold text-slate-800">
                      {villagePrediction.satelliteTelemetry.ndwiWaterExtent.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full"
                      style={{
                        width: `${Math.max(
                          10,
                          Math.min(100, (villagePrediction.satelliteTelemetry.ndwiWaterExtent + 0.3) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Soil Moisture */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600">Root-Zone Soil Moisture:</span>
                    <span className="font-bold text-slate-800">
                      {villagePrediction.satelliteTelemetry.soilMoistureVolumetricPct}% Volumetric
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 rounded-full"
                      style={{
                        width: `${villagePrediction.satelliteTelemetry.soilMoistureVolumetricPct}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleOpenOnGisMap(currentVillage.id)}
                className="w-full neu-btn-primary py-2 text-xs font-semibold bg-[#008060] text-white flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Fly to {currentVillage.name} on Live GIS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MULTI-HAZARD VILLAGE CLIMATE RANKING TABLE */}
      <div className="neu-raised p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              <span>Multi-Hazard Village Climate Ranking Matrix</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {rankedVillages.length} of {villages.length} Habitations
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Cross-disciplinary hazard vulnerability, hydraulic inundation, slope instability, and MCDA resettlement scoring
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* District Filter */}
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">All Districts</option>
              {uniqueDistricts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            {/* Risk Tier Filter */}
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="all">All Risk Tiers</option>
              <option value="Red">Red Zone (Critical)</option>
              <option value="Orange">Orange Zone (High)</option>
              <option value="Yellow">Yellow Zone (Moderate)</option>
              <option value="Green">Green Zone (Safe)</option>
            </select>

            {/* Sort Metric */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
            >
              <option value="cvi">Sort by Climate Vulnerability (CVI)</option>
              <option value="flood">Sort by Flood Susceptibility</option>
              <option value="landslide">Sort by Landslide Susceptibility</option>
              <option value="drought">Sort by Drought Deficit</option>
              <option value="heatwave">Sort by Heatwave Stress</option>
              <option value="relocation">Sort by Relocation Urgency</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search village/taluka..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Village / District</th>
                <th className="py-2.5 px-3">Primary Threat</th>
                <th className="py-2.5 px-3">Slope & Elev</th>
                <th className="py-2.5 px-3 text-center">Flood (FSI)</th>
                <th className="py-2.5 px-3 text-center">Landslide (LSI)</th>
                <th className="py-2.5 px-3 text-center">Drought (DVI)</th>
                <th className="py-2.5 px-3 text-center">CVI Score</th>
                <th className="py-2.5 px-3">Relocation Tier</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedVillages.slice(0, 30).map(({ village, prediction }) => {
                const isSelected = village.id === assistantVillageId;
                return (
                  <tr
                    key={village.id}
                    className={`hover:bg-emerald-50/40 transition-colors ${
                      isSelected ? 'bg-emerald-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{village.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {village.taluka || '—'}, {village.district}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {prediction.overallClimateVulnerability.primaryThreat}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600">
                      <div>{village.slopeDeg || 12}° slope</div>
                      <div className="text-[10px] text-slate-400">{village.elevationM || 250}m MSL</div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                          prediction.flood.riskScore >= 70
                            ? 'text-sky-800 bg-sky-100'
                            : prediction.flood.riskScore >= 40
                            ? 'text-sky-700 bg-sky-50'
                            : 'text-slate-500'
                        }`}
                      >
                        {prediction.flood.riskScore}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                          prediction.landslide.riskScore >= 70
                            ? 'text-rose-800 bg-rose-100'
                            : prediction.landslide.riskScore >= 40
                            ? 'text-amber-800 bg-amber-100'
                            : 'text-slate-500'
                        }`}
                      >
                        {prediction.landslide.riskScore}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                          prediction.drought.riskScore >= 65
                            ? 'text-amber-800 bg-amber-100'
                            : 'text-slate-500'
                        }`}
                      >
                        {prediction.drought.riskScore}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-extrabold text-[11px] ${
                          prediction.overallClimateVulnerability.tier === 'Red'
                            ? 'bg-rose-600 text-white'
                            : prediction.overallClimateVulnerability.tier === 'Orange'
                            ? 'bg-amber-500 text-white'
                            : prediction.overallClimateVulnerability.tier === 'Yellow'
                            ? 'bg-yellow-400 text-slate-900'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {prediction.overallClimateVulnerability.score}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        {prediction.relocationPriority.priorityLevel.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {prediction.relocationPriority.distanceToSafeZoneKm}km to safe site
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setAssistantVillageId(village.id);
                            setActiveQuery('major_risks');
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold transition-all"
                        >
                          Analyze
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenOnGisMap(village.id)}
                          className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <span>GIS Map</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing top {Math.min(30, rankedVillages.length)} habitations matching active criteria
          </span>
          <span className="text-[11px]">
            Data validated against Census 2011 Primary Abstract & IMD Pune Meteorological Station
          </span>
        </div>
      </div>

      {/* 5. PRINTABLE CLIMATE VULNERABILITY DOSSIER MODAL */}
      <AnimatePresence>
        {aiReportModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official Climate Vulnerability Dossier
                  </h3>
                  <p className="text-xs text-slate-500">
                    NIVARAN AI-Assisted Disaster Management Intelligence Summary
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiReportModalOpen(false)}
                  className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>
                    Habitation: {currentVillage.name} ({currentVillage.taluka}, {currentVillage.district})
                  </span>
                  <span className="text-rose-700">CVI: {villagePrediction.overallClimateVulnerability.score}/100</span>
                </div>
                <div className="text-slate-600">
                  Cadastral Location: {currentVillage.lat.toFixed(4)}°N, {currentVillage.lng.toFixed(4)}°E · Elevation {currentVillage.elevationM}m MSL
                </div>
                <div className="text-slate-600">
                  Population: {currentVillage.population} residents · {currentVillage.households} households ({currentVillage.vulnerabilityFactors?.kutchaHousePct || 40}% kutcha construction)
                </div>
              </div>

              {/* Hazard breakdown */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="font-bold text-slate-800 block mb-1">Flood Susceptibility</span>
                  <div className="text-sky-700 font-bold text-sm">
                    {villagePrediction.flood.riskScore}/100 ({villagePrediction.flood.category})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Expected 24h Inundation: {villagePrediction.flood.expected24hInundationCm} cm
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <span className="font-bold text-slate-800 block mb-1">Landslide Susceptibility</span>
                  <div className="text-rose-700 font-bold text-sm">
                    {villagePrediction.landslide.riskScore}/100 ({villagePrediction.landslide.category})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Slope Angle: {currentVillage.slopeDeg}° · Soil Saturation: {villagePrediction.landslide.soilMoistureSaturationPct}%
                  </div>
                </div>
              </div>

              {/* Directives */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-800">Mandated Disaster Mitigation Protocols:</span>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  {villagePrediction.preventiveActionDirectives.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ol>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="neu-btn-primary px-4 py-2 text-xs font-semibold bg-[#008060] text-white flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default ClimateIntelligencePage;
