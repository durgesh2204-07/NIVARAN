import React, { useEffect, useState } from 'react';
import {
  Clock,
  CloudRain,
  Download,
  FileText,
  FolderOpen,
  Globe,
  Layers,
  MapPin,
  Pentagon,
  Play,
  RotateCcw,
  Ruler,
  Save,
  Search,
  ShieldAlert,
  Tent,
  Trash2,
  Users,
  Wind,
} from 'lucide-react';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import turfArea from '@turf/area';
import { point as turfPoint, polygon as turfPolygon } from '@turf/helpers';
import jsPDF from 'jspdf';
import { useAppStore } from '../store/useAppStore';
import { NivaranMap } from '../components/NivaranMap';
import { RiskBadge } from '../components/RiskBadge';
import {
  fetchVillageWeather,
  NominatimPlace,
  searchNominatim,
} from '../services/externalApis';
import { LiveWeatherData, SavedAoi } from '../types';

export const GisWorkspacePage: React.FC = () => {
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const reports = useAppStore((s) => s.reports);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const weights = useAppStore((s) => s.weights);
  const climateHorizon = useAppStore((s) => s.climateHorizon);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);
  const setExtraRainfallMm = useAppStore((s) => s.setExtraRainfallMm);
  const selectedDistrict = useAppStore((s) => s.selectedDistrict);
  const selectedVillageId = useAppStore((s) => s.selectedVillageId);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const savedAois = useAppStore((s) => s.savedAois);
  const saveAoi = useAppStore((s) => s.saveAoi);
  const deleteAoi = useAppStore((s) => s.deleteAoi);
  const addToast = useAppStore((s) => s.addToast);

  // Spatial Drawing & AOI state
  const [drawingMode, setDrawingMode] = useState<'none' | 'polygon' | 'buffer'>('none');
  const [aoiCoords, setAoiCoords] = useState<[number, number][]>([
    [18.18, 73.24],
    [18.18, 73.65],
    [17.82, 73.65],
    [17.82, 73.24],
  ]);
  const [bufferRadiusKm, setBufferRadiusKm] = useState<number>(12);
  const [aoiNameInput, setAoiNameInput] = useState<string>('');

  // Replay Time Slider (-168h to 0h live)
  const [replayHoursAgo, setReplayHoursAgo] = useState<number>(0);
  const [isReplaying, setIsReplaying] = useState<boolean>(false);

  // Nominatim place search
  const [placeQuery, setPlaceQuery] = useState<string>('');
  const [placeResults, setPlaceResults] = useState<NominatimPlace[]>([]);

  // Live Open-Meteo weather for selected village
  const selectedVillage =
    villages.find((v) => v.id === selectedVillageId) ?? villages[0];
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);

  useEffect(() => {
    if (!selectedVillage) return;
    fetchVillageWeather(selectedVillage.lat, selectedVillage.lng).then(setLiveWeather);
  }, [selectedVillage]);

  // Replay animation loop
  useEffect(() => {
    if (!isReplaying) return;
    const timer = setInterval(() => {
      setReplayHoursAgo((prev) => {
        if (prev >= 0) {
          setIsReplaying(false);
          return 0;
        }
        const next = Math.min(0, prev + 6);
        setExtraRainfallMm(Math.round(140 + next * 0.6));
        return next;
      });
    }, 650);
    return () => clearInterval(timer);
  }, [isReplaying, setExtraRainfallMm]);

  const filteredVillages =
    selectedDistrict === 'All'
      ? villages
      : villages.filter((v) => v.district === selectedDistrict);

  const handleMapClickForAoi = (lat: number, lng: number) => {
    if (drawingMode === 'polygon') {
      setAoiCoords((prev) => [...prev, [Number(lat.toFixed(4)), Number(lng.toFixed(4))]]);
    } else if (drawingMode === 'buffer') {
      // Create 12-vertex circular polygon around clicked point using bufferRadiusKm
      const degLat = bufferRadiusKm / 111;
      const degLng = bufferRadiusKm / (111 * Math.cos((lat * Math.PI) / 180));
      const pts: [number, number][] = [];
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2;
        pts.push([
          Number((lat + Math.sin(angle) * degLat).toFixed(4)),
          Number((lng + Math.cos(angle) * degLng).toFixed(4)),
        ]);
      }
      setAoiCoords(pts);
      setDrawingMode('none');
      addToast(`Created ${bufferRadiusKm} km spatial buffer around clicked coordinate`, 'success');
    }
  };

  // Turf.js Spatial Analysis inside active AOI polygon
  const spatialSummary = React.useMemo(() => {
    if (aoiCoords.length < 3) {
      return {
        areaSqKm: 0,
        villagesInside: [],
        householdsInside: 0,
        populationInside: 0,
        vulnerablePeopleInside: 0,
        sheltersInside: [],
      };
    }

    try {
      const ring = aoiCoords.map(([lat, lng]) => [lng, lat]);
      if (
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1]
      ) {
        ring.push([...ring[0]]);
      }
      const poly = turfPolygon([ring]);
      const areaSqKm = Number((turfArea(poly) / 1_000_000).toFixed(2));

      const villagesInside = villages.filter((v) =>
        booleanPointInPolygon(turfPoint([v.lng, v.lat]), poly)
      );
      const sheltersInside = reliefCamps.filter((c) =>
        booleanPointInPolygon(turfPoint([c.lng, c.lat]), poly)
      );

      const householdsInside = villagesInside.reduce((acc, v) => acc + v.households, 0);
      const populationInside = villagesInside.reduce((acc, v) => acc + v.population, 0);
      const vulnerablePeopleInside = villagesInside.reduce((acc, v) => {
        const vulnShare =
          ((v.vulnerabilityFactors.elderlyPlusDisabledPct ??
            v.vulnerabilityFactors.elderlyPct + v.vulnerabilityFactors.disabledPct) +
            (v.vulnerabilityFactors.pregnantPlusUnder5Pct ?? 8.5)) /
          100;
        return acc + Math.round(v.population * Math.min(0.45, vulnShare));
      }, 0);

      return {
        areaSqKm,
        villagesInside,
        householdsInside,
        populationInside,
        vulnerablePeopleInside,
        sheltersInside,
      };
    } catch {
      return {
        areaSqKm: 0,
        villagesInside: [],
        householdsInside: 0,
        populationInside: 0,
        vulnerablePeopleInside: 0,
        sheltersInside: [],
      };
    }
  }, [aoiCoords, villages, reliefCamps]);

  const handleSaveCurrentAoi = () => {
    if (aoiCoords.length < 3) {
      addToast('Draw at least 3 vertices to save an Area of Interest', 'warning');
      return;
    }
    const newAoi: SavedAoi = {
      id: `aoi-${Date.now()}`,
      name: aoiNameInput.trim() || `Custom Hazard Corridor (${spatialSummary.areaSqKm} km²)`,
      createdAt: new Date().toISOString(),
      coordinates: aoiCoords,
      affectedVillagesCount: spatialSummary.villagesInside.length,
      affectedHouseholds: spatialSummary.householdsInside,
      sheltersInside: spatialSummary.sheltersInside.length,
    };
    saveAoi(newAoi);
    setAoiNameInput('');
    addToast(`Saved AOI "${newAoi.name}" to workspace`, 'success');
  };

  const handleExportGeoJson = () => {
    const geojson = {
      type: 'FeatureCollection',
      metadata: {
        system: 'Nivaran National Disaster Risk & Relocation GIS',
        exportedAt: new Date().toISOString(),
        crs: 'EPSG:4326',
      },
      features: [
        ...(aoiCoords.length >= 3
          ? [
              {
                type: 'Feature',
                properties: {
                  featureType: 'AOI_Polygon',
                  areaSqKm: spatialSummary.areaSqKm,
                  affectedHouseholds: spatialSummary.householdsInside,
                },
                geometry: {
                  type: 'Polygon',
                  coordinates: [
                    [
                      ...aoiCoords.map(([lat, lng]) => [lng, lat]),
                      [aoiCoords[0][1], aoiCoords[0][0]],
                    ],
                  ],
                },
              },
            ]
          : []),
        ...spatialSummary.villagesInside.map((v) => ({
          type: 'Feature',
          properties: {
            id: v.id,
            name: v.name,
            district: v.district,
            households: v.households,
            population: v.population,
            riskLevel: v.baselineRiskLevel,
            slopeDeg: v.slopeDeg,
          },
          geometry: {
            type: 'Point',
            coordinates: [v.lng, v.lat],
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nivaran-spatial-analysis-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported GeoJSON feature collection (EPSG:4326)', 'success');
  };

  const handleExportPdfMapSheet = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 595, 74, 'F');
    doc.setTextColor(14, 159, 142);
    doc.setFontSize(9);
    doc.text('NIVARAN GIS ENGINE — SPATIAL HAZARD & AOI ANALYSIS SHEET', 40, 26);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`District Scope: ${selectedDistrict} • Area: ${spatialSummary.areaSqKm} sq.km`, 40, 46);
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')} • CRS: EPSG:4326 (WGS 84)`, 40, 62);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text('1. Turf.js Spatial Query Summary Inside Active AOI Polygon', 40, 105);
    doc.setFontSize(10);
    doc.text(
      `• Habitations Inside AOI: ${spatialSummary.villagesInside.length} villages (${spatialSummary.householdsInside} households / ${spatialSummary.populationInside} citizens)`,
      48,
      125
    );
    doc.text(
      `• High-Priority Vulnerable Citizens (Elderly/Disabled/Pregnant): ${spatialSummary.vulnerablePeopleInside} persons`,
      48,
      142
    );
    doc.text(
      `• Emergency Relief Shelters Inside AOI: ${spatialSummary.sheltersInside.length} verified camps`,
      48,
      159
    );

    let y = 192;
    doc.setFontSize(11);
    doc.text('2. Habitations Identified Within Spatial Boundary', 40, y);
    y += 18;
    spatialSummary.villagesInside.slice(0, 18).forEach((v, idx) => {
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(
        `${idx + 1}. ${v.name} (${v.block || v.taluka}, ${v.district}) — ${v.households} HH | Slope ${
          v.slopeDeg
        }° | Risk: ${(v.baselineRiskLevel || 'Immediate').toUpperCase()}`,
        48,
        y
      );
      y += 15;
    });

    doc.save(`Nivaran-GIS-Map-Sheet-${new Date().toISOString().slice(0, 10)}.pdf`);
    addToast('Downloaded Official GIS Map Sheet PDF', 'success');
  };

  const handleNominatimSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeQuery.trim()) return;
    const results = await searchNominatim(placeQuery);
    setPlaceResults(results);
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E9F8E]">
            <Globe className="w-4 h-4" />
            <span>Full-Screen GIS Engine & Spatial Decision Support</span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white mt-0.5">
            Interactive Multi-Hazard GIS Workspace
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch basemaps, track live GPS geofences, inspect DEM elevation anywhere, draw Turf.js
            spatial polygons, and replay 7-day hydrometeorological telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportGeoJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#0A1624] hover:border-[#0E9F8E] border border-slate-200 dark:border-slate-700 text-xs font-bold text-[#0F172A] dark:text-white min-h-[40px]"
          >
            <Download className="w-4 h-4 text-[#0E9F8E]" />
            <span>Export GeoJSON</span>
          </button>
          <button
            onClick={handleExportPdfMapSheet}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F33] hover:bg-slate-800 text-white text-xs font-bold min-h-[40px]"
          >
            <FileText className="w-4 h-4 text-[#0E9F8E]" />
            <span>Export PDF Map Sheet</span>
          </button>
        </div>
      </div>

      {/* Main GIS Grid: Map (8 cols) + Spatial Analysis & Telemetry Toolbox (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left 8 Cols: Map + 7-Day Replay Slider */}
        <div className="xl:col-span-8 space-y-4">
          <NivaranMap
            villages={filteredVillages}
            sites={sites}
            reports={reports}
            weights={weights}
            climateHorizon={climateHorizon}
            extraRainfallMm={extraRainfallMm}
            onSelectVillage={(v) => setSelectedVillageId(v.id)}
            heightClass="h-[600px]"
            showRelocationLines={true}
            drawnPolygonCoords={aoiCoords}
            onMapPointClick={handleMapClickForAoi}
          />

          {/* 7-Day / 24h Storm & Alert Replay Time Slider */}
          <div className="bg-white dark:bg-[#11253A] rounded-card p-4 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (replayHoursAgo === 0) setReplayHoursAgo(-168);
                  setIsReplaying(!isReplaying);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isReplaying ? 'Pause Replay' : 'Replay 7-Day Monsoon Surge'}</span>
              </button>
              <div className="text-xs">
                <div className="font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0E9F8E]" />
                  <span>
                    Temporal Window:{' '}
                    {replayHoursAgo === 0
                      ? 'LIVE NOW (Current Telemetry)'
                      : `${Math.abs(replayHoursAgo)} hours ago`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Simulated Surge Intensity: +{extraRainfallMm} mm/24h
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-[220px] flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400">-7d</span>
              <input
                type="range"
                min={-168}
                max={0}
                step={6}
                value={replayHoursAgo}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setReplayHoursAgo(val);
                  setExtraRainfallMm(Math.max(0, Math.round(140 + val * 0.6)));
                }}
                className="flex-1 accent-[#0E9F8E]"
                aria-label="Replay temporal slider"
              />
              <span className="text-[11px] font-mono font-bold text-[#0E9F8E]">LIVE</span>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Turf.js Spatial Toolbox, Saved AOIs, Nominatim Search, Live Open-Meteo */}
        <div className="xl:col-span-4 space-y-4">
          {/* Turf.js Drawing & Spatial Query Toolbox */}
          <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pentagon className="w-4 h-4 text-[#4F46E5]" />
                <h2 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
                  Turf.js Spatial Analysis & AOI
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                {spatialSummary.areaSqKm} km²
              </span>
            </div>

            {/* Drawing Mode Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  if (drawingMode === 'polygon') {
                    setDrawingMode('none');
                  } else {
                    setAoiCoords([]);
                    setDrawingMode('polygon');
                    addToast('Click points on the map to draw a custom AOI polygon', 'info');
                  }
                }}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${
                  drawingMode === 'polygon'
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-slate-50 dark:bg-[#0A1624] border-slate-200 dark:border-slate-700'
                }`}
              >
                <Pentagon className="w-4 h-4" />
                <span>{drawingMode === 'polygon' ? 'Finish Draw' : 'Draw Polygon'}</span>
              </button>

              <button
                onClick={() => {
                  setDrawingMode(drawingMode === 'buffer' ? 'none' : 'buffer');
                  addToast(
                    `Click any point on the map to generate a ${bufferRadiusKm} km radial buffer`,
                    'info'
                  );
                }}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 ${
                  drawingMode === 'buffer'
                    ? 'bg-[#0E9F8E] text-white border-[#0E9F8E]'
                    : 'bg-slate-50 dark:bg-[#0A1624] border-slate-200 dark:border-slate-700'
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span>Point Buffer ({bufferRadiusKm}km)</span>
              </button>

              <button
                onClick={() => {
                  setAoiCoords([
                    [18.18, 73.24],
                    [18.18, 73.65],
                    [17.82, 73.65],
                    [17.82, 73.24],
                  ]);
                  setDrawingMode('none');
                }}
                className="p-2 rounded-xl border bg-slate-50 dark:bg-[#0A1624] border-slate-200 dark:border-slate-700 text-xs font-bold flex flex-col items-center gap-1 hover:border-[#0E9F8E]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset AOI</span>
              </button>
            </div>

            {/* Buffer radius slider when buffer mode active */}
            {drawingMode === 'buffer' && (
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-teal-800 dark:text-teal-200">
                  Buffer Radius: {bufferRadiusKm} km
                </span>
                <input
                  type="range"
                  min={3}
                  max={35}
                  value={bufferRadiusKm}
                  onChange={(e) => setBufferRadiusKm(Number(e.target.value))}
                  className="w-28 accent-[#0E9F8E]"
                />
              </div>
            )}

            {/* Turf Query Results Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Habitations Inside</span>
                </div>
                <div className="font-heading text-xl font-extrabold text-[#0F172A] dark:text-white mt-0.5 tabular-nums">
                  {spatialSummary.villagesInside.length}
                </div>
                <div className="text-[10px] text-slate-500">
                  {spatialSummary.householdsInside.toLocaleString()} households
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#4F46E5]" />
                  <span>Vulnerable Citizens</span>
                </div>
                <div className="font-heading text-xl font-extrabold text-[#0F172A] dark:text-white mt-0.5 tabular-nums">
                  {spatialSummary.vulnerablePeopleInside.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  Of {spatialSummary.populationInside.toLocaleString()} total pop
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Tent className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>Shelters Inside</span>
                </div>
                <div className="font-heading text-xl font-extrabold text-[#0F172A] dark:text-white mt-0.5 tabular-nums">
                  {spatialSummary.sheltersInside.length}
                </div>
                <div className="text-[10px] text-slate-500">Verified relief camps</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800">
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-[#0E9F8E]" />
                  <span>Polygon Area</span>
                </div>
                <div className="font-heading text-xl font-extrabold text-[#0F172A] dark:text-white mt-0.5 tabular-nums">
                  {spatialSummary.areaSqKm}
                </div>
                <div className="text-[10px] text-slate-500">Square kilometers</div>
              </div>
            </div>

            {/* Save & Load Named AOIs */}
            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aoiNameInput}
                  onChange={(e) => setAoiNameInput(e.target.value)}
                  placeholder="Name this Area of Interest..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  onClick={handleSaveCurrentAoi}
                  className="px-3 py-1.5 rounded-xl bg-[#0E9F8E] text-white text-xs font-bold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>

              <div className="space-y-1 max-h-28 overflow-y-auto">
                {savedAois.map((aoi) => (
                  <div
                    key={aoi.id}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0A1624] border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <button
                      onClick={() => {
                        setAoiCoords(aoi.coordinates || aoi.polygonCoords || []);
                        addToast(`Loaded AOI "${aoi.name}"`, 'info');
                      }}
                      className="font-semibold text-left text-[#0F172A] dark:text-slate-200 hover:text-[#0E9F8E] flex items-center gap-1.5 truncate"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-[#0E9F8E] shrink-0" />
                      <span className="truncate">{aoi.name}</span>
                    </button>
                    <button
                      onClick={() => deleteAoi(aoi.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                      aria-label={`Delete ${aoi.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Open-Meteo Weather Telemetry for Selected Village */}
          {selectedVillage && (
            <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0E9F8E]">
                    Open-Meteo Live Telemetry
                  </div>
                  <h3 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
                    {selectedVillage.name} ({selectedVillage.district})
                  </h3>
                </div>
                <RiskBadge level={selectedVillage.baselineRiskLevel} size="sm" />
              </div>

              {liveWeather ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <CloudRain className="w-3 h-3 text-sky-500" /> 24h Rain
                      </div>
                      <div className="font-heading font-extrabold text-sm mt-0.5 tabular-nums">
                        {liveWeather.rainfall24hMm} mm
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Wind className="w-3 h-3 text-teal-500" /> Wind
                      </div>
                      <div className="font-heading font-extrabold text-sm mt-0.5 tabular-nums">
                        {liveWeather.windSpeedKmh} km/h
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-500" /> IMD Alert
                      </div>
                      <div className="font-heading font-extrabold text-sm mt-0.5">
                        {liveWeather.imdWarningLevel}
                      </div>
                    </div>
                  </div>

                  {/* 7-Day Forecast Mini Strip */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500">
                      7-Day Precipitation Forecast (mm/day):
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {liveWeather.forecast7d.map((day) => (
                        <div
                          key={day.date}
                          className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#0A1624] border border-slate-200/60 dark:border-slate-800 text-[10px]"
                        >
                          <div className="text-slate-400">
                            {day.date.slice(5)}
                          </div>
                          <div className="font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-0.5">
                            {Math.round(day.precipitationMm)}mm
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-400 py-3">
                  Loading Open-Meteo hydrometeorological stream...
                </div>
              )}
            </div>
          )}

          {/* Nominatim Place & Coordinate Finder */}
          <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
            <h3 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-[#0E9F8E]" />
              <span>Nominatim Gazetteer & Place Search</span>
            </h3>
            <form onSubmit={handleNominatimSearch} className="flex gap-2">
              <input
                type="text"
                value={placeQuery}
                onChange={(e) => setPlaceQuery(e.target.value)}
                placeholder="Search town, river, valley, dam..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-bold"
              >
                Locate
              </button>
            </form>
            {placeResults.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {placeResults.map((p) => (
                  <div
                    key={p.placeId}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-[#0A1624] text-xs flex items-center justify-between gap-2"
                  >
                    <span className="truncate text-slate-700 dark:text-slate-200">
                      {p.displayName}
                    </span>
                    <span className="font-mono text-[10px] text-[#0E9F8E] shrink-0">
                      {p.lat.toFixed(2)}°N, {p.lng.toFixed(2)}°E
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
