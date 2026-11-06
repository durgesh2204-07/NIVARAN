import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Compass,
  Download,
  HeartHandshake,
  MapPin,
  MessageSquareWarning,
  PhoneCall,
  Route,
  ShieldAlert,
  Siren,
  Tent,
  Thermometer,
  Wind,
  XCircle,
} from 'lucide-react';
import distance from '@turf/distance';
import { point } from '@turf/helpers';
import jsPDF from 'jspdf';
import { useAppStore } from '../store/useAppStore';
import { RiskBadge } from '../components/RiskBadge';
import { classifyHazard, weightedScore } from '../utils/scoring';
import {
  fetchOpenMeteoWeather,
  fetchOsrmEvacuationRoute,
} from '../services/externalApis';
import { HazardType, LiveWeatherData } from '../types';

const DOS_AND_DONTS: Record<
  HazardType,
  { title: string; dos: string[]; donts: string[] }
> = {
  landslide: {
    title: 'Hillside Landslide & Slope Subsidence Safety',
    dos: [
      'Watch for new cracks in house walls, tilting trees/poles, or muddy spring seepage.',
      'Keep emergency go-bag ready with Aadhaar, ration card, medicines, and torch.',
      'Move immediately to the designated plateau shelter when IMD Red/Orange alert is issued.',
    ],
    donts: [
      'Do not stay in kutcha houses at the base of steep (>25°) scarps during heavy continuous rain.',
      'Do not cross active debris channels or blocked ghat culverts at night.',
      'Do not ignore acoustic village sirens or Gram Panchayat WhatsApp evacuation advisories.',
    ],
  },
  flood: {
    title: 'Riverine Flash Flood & Embankment Safety',
    dos: [
      'Move livestock and valuables to higher plinths before dam spillway releases.',
      'Boil or chlorinate drinking water and use ORS packets distributed at relief camps.',
      'Switch off main electrical MCB switches before evacuating flooded low-lying lanes.',
    ],
    donts: [
      'Never walk or drive through flowing floodwater over submerged causeways or bridges.',
      'Do not touch fallen power lines or wet electric poles.',
      'Do not return to river-bank homes until DDMA declares water levels safe.',
    ],
  },
  cloudburst: {
    title: 'Extreme Cloudburst & Hill Torrent Safety',
    dos: [
      'Ascend to higher stable ground laterally away from hill streams and nallahs.',
      'Listen to Sachet CAP cell broadcasts and help elderly and disabled neighbors evacuate first.',
      'Register your family arrival with the Relief Camp In-Charge for rations and medical care.',
    ],
    donts: [
      'Do not shelter under loose boulders, steep cuttings, or tin-roof sheds near streams.',
      'Do not wait for rainfall to stop if water turns suddenly muddy or carries uprooted trees.',
    ],
  },
  erosion: {
    title: 'Riverbank & Coastal Toe Erosion Safety',
    dos: [
      'Report bank undercutting or boundary wall cracks immediately via the Nivaran Field Report tool.',
      'Maintain a 50-meter setback from active river meanders during monsoon peak flow.',
      'Follow Tehsildar instructions for phased permanent plot allotment at safe host sites.',
    ],
    donts: [
      'Do not excavate sand, soil, or boulders from slope toes or river banks.',
      'Do not dump debris into storm drainage channels.',
    ],
  },
};

export const CitizenPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const villages = useAppStore((s) => s.villages);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const alerts = useAppStore((s) => s.alerts);
  const weights = useAppStore((s) => s.weights);
  const selectedVillageId = useAppStore((s) => s.selectedVillageId);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const createIncident = useAppStore((s) => s.createIncident);
  const addToast = useAppStore((s) => s.addToast);

  const selectedVillage =
    villages.find((v) => v.id === selectedVillageId) ?? villages[0];

  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [selectedHazardGuide, setSelectedHazardGuide] = useState<HazardType>(
    selectedVillage?.primaryHazard || 'landslide'
  );
  const [sosTriggered, setSosTriggered] = useState(false);
  const [activeRouteInfo, setActiveRouteInfo] = useState<{
    campName: string;
    distanceKm: number;
    durationMinutes: number;
    source: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedVillage) return;
    setSelectedHazardGuide(selectedVillage.primaryHazard);
    fetchOpenMeteoWeather(selectedVillage.lat, selectedVillage.lng).then(setWeather);
  }, [selectedVillage]);

  const hazardScore = selectedVillage
    ? weightedScore(
        selectedVillage.hazardFactors,
        weights,
        selectedVillage.verifiedReportsCount
      )
    : 0;
  const riskLevel = classifyHazard(hazardScore);

  // Compute 3 nearest shelters using Turf distance
  const nearestShelters = useMemo(() => {
    if (!selectedVillage) return [];
    const fromPt = point([selectedVillage.lng, selectedVillage.lat]);
    return reliefCamps
      .map((c) => {
        const distKm = Number(
          distance(fromPt, point([c.lng, c.lat]), { units: 'kilometers' }).toFixed(2)
        );
        return { ...c, distanceKm: distKm };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [selectedVillage, reliefCamps]);

  const handleTriggerSos = () => {
    setSosTriggered(true);
    if (selectedVillage) {
      createIncident({
        title: `CITIZEN SOS DISTRESS BEACON — ${selectedVillage.name}`,
        hazardType: selectedVillage.primaryHazard,
        severity: 'Critical',
        district: selectedVillage.district,
        villageName: selectedVillage.name,
        lat: selectedVillage.lat,
        lng: selectedVillage.lng,
        affectedPopulation: 5,
        assignedTeamIds: [],
        slaDeadlineMinutes: 15,
        description: `Emergency SOS distress beacon triggered from Citizen Safety Portal at ${selectedVillage.name} (${selectedVillage.lat.toFixed(
          4
        )}°N, ${selectedVillage.lng.toFixed(4)}°E). Immediate QRT verification requested.`,
      });
    }
    addToast({
      title: 'SOS Distress Beacon Transmitted to SEOC & 112 ERSS',
      message: `GPS coordinates (${selectedVillage.lat.toFixed(4)}°N, ${selectedVillage.lng.toFixed(
        4
      )}°E) shared with District Control Room.`,
      type: 'critical',
    });
  };

  const handleGetDirections = async (
    campName: string,
    toLat: number,
    toLng: number
  ) => {
    const res = await fetchOsrmEvacuationRoute(
      selectedVillage.lat,
      selectedVillage.lng,
      toLat,
      toLng
    );
    setActiveRouteInfo({
      campName,
      distanceKm: res.distanceKm,
      durationMinutes: res.durationMinutes,
      source: res.source,
    });
    addToast({
      title: `Evacuation Route to ${campName}`,
      message: `Distance: ${res.distanceKm} km • Estimated travel time: ${res.durationMinutes} mins.`,
      type: 'success',
    });
  };

  const handleDownloadFamilyPlanPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFillColor(11, 31, 51);
    doc.rect(0, 0, 595, 76, 'F');
    doc.setTextColor(14, 159, 142);
    doc.setFontSize(9);
    doc.text('NIVARAN CITIZEN SAFETY PORTAL — HOUSEHOLD PREPAREDNESS', 40, 26);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.text('FAMILY MONSOON EMERGENCY & EVACUATION CHECKLIST', 40, 48);
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Habitation: ${selectedVillage.name} (${selectedVillage.district}) • Nearest Shelter: ${
        nearestShelters[0]?.name || 'Designated Camp'
      }`,
      40,
      64
    );

    let y = 108;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text('1. Emergency Helpline Numbers (24x7 Toll-Free)', 40, y);
    y += 18;
    doc.setFontSize(10);
    doc.text(
      '• National Emergency Number: 112   |   Ambulance: 108   |   State Control Room: 1070   |   District Control: 1077',
      48,
      y
    );

    y += 30;
    doc.setFontSize(12);
    doc.text('2. Essential Go-Bag Items (Keep Packed in Waterproof Bag)', 40, y);
    y += 18;
    const checklistItems = [
      '[ ] Aadhaar Cards, Ration Card, Land 7/12 Extract & Bank Passbooks in waterproof pouch',
      '[ ] 3-day supply of essential prescription medicines, ORS packets, and first-aid kit',
      '[ ] Dry non-perishable food (chana, jaggery, biscuits) and 3 liters drinking water per person',
      '[ ] Flashlight / Torch with extra batteries, whistle, and fully charged mobile power bank',
      '[ ] Warm clothes, raincoats/plastic sheets for elderly members and infants',
    ];
    doc.setFontSize(10);
    checklistItems.forEach((item) => {
      doc.text(item, 48, y);
      y += 18;
    });

    y += 16;
    doc.setFontSize(12);
    doc.text(
      `3. Designated Safe Relief Shelters Near ${selectedVillage.name}`,
      40,
      y
    );
    y += 18;
    doc.setFontSize(10);
    nearestShelters.forEach((s, idx) => {
      doc.text(
        `${idx + 1}. ${s.name} (${s.taluka}) — ${s.distanceKm} km away | Contact: ${
          s.inChargeName
        } (${s.contactPhone})`,
        48,
        y
      );
      y += 18;
    });

    doc.save(`Nivaran-Family-Emergency-Plan-${selectedVillage.name}.pdf`);
    addToast({
      title: 'Family Emergency Plan PDF Downloaded',
      message: 'Keep a printed copy and offline digital copy on your phone.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner + Village Selector */}
      <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E9F8E]">
            <HeartHandshake className="w-4 h-4" />
            <span>Citizen Safety, Live Early Warning & Nearest Shelter Portal</span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#0F172A] dark:text-white mt-0.5">
            Public Hazard Status, Evacuation Routes & Emergency SOS
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Select Your Village:</span>
          <select
            value={selectedVillage.id}
            onChange={(e) => setSelectedVillageId(e.target.value)}
            aria-label="Select Village"
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-bold text-[#0F172A] dark:text-white"
          >
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.taluka}, {v.district}, {v.state || 'Maharashtra'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Emergency SOS Banner Card ("I am in danger / Request Help") */}
      <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#0B1F33] text-white rounded-card p-5 shadow-lg border border-red-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-red-200 text-[11px] font-bold uppercase">
            <Siren className="w-3.5 h-3.5 animate-pulse" />
            <span>24×7 Emergency Distress & Rescue Dispatch</span>
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-extrabold">
            Facing Immediate Landslide, Flood, or Structural Danger?
          </h2>
          <p className="text-xs text-red-100 max-w-xl">
            Pressing the SOS button transmits your village GPS coordinates directly to the
            District Emergency Operations Center (DEOC) and nearest NDRF/SDRF Quick Response Team.
          </p>

          {/* Toll-free Helpline Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-bold">
            <a
              href="tel:112"
              className="px-3 py-1.5 rounded-xl bg-white text-[#991B1B] flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> 112 (National ERSS)
            </a>
            <a
              href="tel:108"
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> 108 (Ambulance)
            </a>
            <a
              href="tel:1070"
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> 1070 (State SDMA)
            </a>
            <a
              href="tel:1078"
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> 1078 (NDMA Helpline)
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={handleTriggerSos}
            className="px-6 py-4 rounded-2xl bg-[#DC2626] hover:bg-red-500 text-white font-heading font-extrabold text-sm shadow-xl border-2 border-white flex items-center justify-center gap-2 min-h-[52px]"
          >
            <Siren className="w-5 h-5 animate-bounce" />
            <span>
              {sosTriggered
                ? 'SOS Sent to Control Room ✓'
                : 'I AM IN DANGER — SEND SOS'}
            </span>
          </button>
          <button
            onClick={() => navigate('/community-reports')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-white/20"
          >
            <MessageSquareWarning className="w-4 h-4 text-teal-300" />
            <span>Report Ground Crack / Seepage</span>
          </button>
        </div>
      </div>

      {/* Village Risk Card + Live Open-Meteo Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Current Village Risk Status (5 cols) */}
        <div className="md:col-span-5 bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Your Habitation Risk Status
              </div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F172A] dark:text-white mt-0.5">
                {selectedVillage.name} ({selectedVillage.nameMr})
              </h2>
              <div className="text-xs text-slate-500">
                {selectedVillage.taluka} Taluka, {selectedVillage.district} District, {selectedVillage.state || 'Maharashtra'}
              </div>
            </div>
            <RiskBadge level={riskLevel} size="lg" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
            <div className="font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#0E9F8E]" />
              <span>
                Primary Hazard: {selectedVillage.primaryHazard.toUpperCase()} (Score:{' '}
                {hazardScore.toFixed(3)})
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {riskLevel === 'Immediate'
                ? 'Your village is in an active Red Zone. Keep your emergency kit ready and move to the nearest shelter during heavy rainfall warnings.'
                : riskLevel === 'Short-term'
                ? 'Your village is in an Orange Watch Zone. Stay alert to Gram Panchayat sirens and avoid steep slopes during intense rain.'
                : 'Your village is currently in a Moderate/Safe zone. Continue standard monsoon precautions.'}
            </p>
          </div>

          {/* Active Local Alerts */}
          {alerts.length > 0 && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-1">
              <div className="font-bold text-[#DC2626] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Latest Official Advisory:</span>
              </div>
              <div className="font-semibold text-[#0F172A] dark:text-white">
                {alerts[0].title}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                {alerts[0].message}
              </p>
            </div>
          )}
        </div>

        {/* Live Open-Meteo Weather & 7-Day Forecast (7 cols) */}
        <div className="md:col-span-7 bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#0E9F8E]">
                Open-Meteo Live Weather & 7-Day Forecast
              </div>
              <h2 className="font-heading text-base font-extrabold text-[#0F172A] dark:text-white">
                Local Monsoon Conditions — {selectedVillage.name}
              </h2>
            </div>
            <button
              onClick={handleDownloadFamilyPlanPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0B1F33] text-white text-xs font-bold"
            >
              <Download className="w-3.5 h-3.5 text-[#0E9F8E]" />
              <span>Family Emergency Plan (PDF)</span>
            </button>
          </div>

          {weather ? (
            <>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                  <div className="text-slate-500 flex items-center gap-1">
                    <CloudRain className="w-4 h-4 text-sky-500" /> Current Rain
                  </div>
                  <div className="font-heading text-xl font-extrabold mt-1 tabular-nums">
                    {weather.precipitationMm} mm
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Thermometer className="w-4 h-4 text-amber-500" /> Temperature
                  </div>
                  <div className="font-heading text-xl font-extrabold mt-1 tabular-nums">
                    {weather.temperatureC} °C
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Wind className="w-4 h-4 text-teal-500" /> Wind Speed
                  </div>
                  <div className="font-heading text-xl font-extrabold mt-1 tabular-nums">
                    {weather.windSpeedKmh} km/h
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-500">
                  7-Day Rainfall Outlook:
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {weather.dailyForecast.map((d) => (
                    <div
                      key={d.date}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800 text-xs"
                    >
                      <div className="text-[10px] text-slate-400">
                        {d.date.slice(-5)}
                      </div>
                      <div className="font-bold text-sky-600 dark:text-sky-400 tabular-nums mt-1">
                        {d.rainMm}mm
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {d.maxTempC}°C
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-400 py-6">
              Fetching live Open-Meteo weather forecast...
            </div>
          )}
        </div>
      </div>

      {/* Nearest 3 Emergency Shelters with One-Tap OSRM Route */}
      <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Tent className="w-5 h-5 text-[#16A34A]" />
            <div>
              <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                Nearest Verified Emergency Shelters & Relief Camps
              </h2>
              <p className="text-xs text-slate-500">
                Equipped with drinking water, medical desk, sanitation, and emergency
                kitchen
              </p>
            </div>
          </div>

          {activeRouteInfo && (
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>
                Active Route to {activeRouteInfo.campName}: {activeRouteInfo.distanceKm}{' '}
                km ({activeRouteInfo.durationMinutes} min ETA)
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nearestShelters.map((camp, i) => (
            <div
              key={camp.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[#16A34A] text-white font-bold text-[10px]">
                    #{i + 1} Nearest ({camp.distanceKm} km)
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {camp.capacityPersons - camp.currentOccupancy} slots free
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-[#0F172A] dark:text-white mt-2">
                  {camp.name}
                </h3>
                <div className="text-slate-500 mt-0.5">
                  {camp.taluka}, {camp.district} • In-Charge: {camp.inChargeName} (
                  {camp.contactPhone})
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleGetDirections(camp.name, camp.lat, camp.lng)
                  }
                  className="flex-1 py-2 px-3 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white font-bold flex items-center justify-center gap-1.5"
                >
                  <Route className="w-3.5 h-3.5" />
                  <span>Evacuation Route</span>
                </button>
                <button
                  onClick={() => navigate('/gis')}
                  className="py-2 px-3 rounded-xl bg-[#0B1F33] text-white font-bold flex items-center justify-center gap-1"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Map</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Do's and Don'ts Per Hazard Type */}
      <div className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
            NDMA Citizen Safety Guidelines: Do&apos;s &amp; Don&apos;ts
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {(['landslide', 'flood', 'cloudburst', 'erosion'] as HazardType[]).map(
              (h) => (
                <button
                  key={h}
                  onClick={() => setSelectedHazardGuide(h)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ${
                    selectedHazardGuide === h
                      ? 'bg-[#0E9F8E] text-white'
                      : 'bg-slate-100 dark:bg-[#0A1624] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {h}
                </button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="font-heading font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>DO&apos;S — Protective Actions</span>
            </div>
            {DOS_AND_DONTS[selectedHazardGuide].dos.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                <span>{d}</span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 space-y-2">
            <div className="font-heading font-bold text-sm text-red-800 dark:text-red-300 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-[#DC2626]" />
              <span>DON&apos;TS — High-Risk Actions to Avoid</span>
            </div>
            {DOS_AND_DONTS[selectedHazardGuide].donts.map((d, i) => (
              <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                <XCircle className="w-3.5 h-3.5 text-[#DC2626] shrink-0 mt-0.5" />
                <span>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
