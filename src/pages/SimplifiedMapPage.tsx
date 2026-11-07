import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Globe,
  History,
  Home,
  Info,
  Key,
  Layers,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Moon,
  Mountain,
  Navigation,
  Orbit,
  Phone,
  Plus,
  RotateCcw,
  Ruler,
  Search,
  ShieldAlert,
  Sliders,
  Sparkles,
  X,
  Camera,
  Maximize2,
  Minimize2,
  Minus,
  ArrowUpDown,
} from 'lucide-react';
import { generateVillageBoundaryPolygon } from '../utils/villageBoundaryGenerator';
import { predictVillageClimateRisks } from '../services/aiClimatePredictionEngine';
import { VillageAiDisasterForecastModal } from '../components/VillageAiDisasterForecastModal';
import { useAppStore } from '../store/useAppStore';
import { useAccurateGps, locateUserAccurately } from '../services/gpsService';
import { getAlertLevelMeta, getShelterStatusMeta } from '../utils/alertUtils';
import {
  fetchEvacuationRoute,
  fetchLiveWeather,
  fetchPointElevation,
  searchNominatim,
} from '../services/externalApis';
import {
  buildVillageExplainPayload,
  classifyHazard,
  classifyRiskScore,
  floodFill,
  formatLatLngToDms,
  formatLatLngToUtm,
  getRiskColor,
  weightedScore,
} from '../utils/scoring';
import {
  ActiveAlertZone,
  AlertDisasterType,
  AlertZoneLevel,
  ReliefCamp,
  Village,
  VolunteerMember,
} from '../types';
import { GisCommandDecisionDeck } from '../components/GisCommandDecisionDeck';
import {
  getStoredMapProvider,
  getStreetBasemapConfig,
  MapProviderType,
} from '../gis/mapTileConfig';
import { MapProviderSettingsModal } from '../components/MapProviderSettingsModal';
import {
  MAHARASHTRA_DISTRICTS_DATA,
  ALL_MAHARASHTRA_PLACES,
  MaharashtraDistrict,
  MaharashtraTaluka,
  MaharashtraVillage,
} from '../data/maharashtraRegionsData';

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

const TERRARIUM_TILES =
  'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

/**
 * Comprehensive directory of major cities, district headquarters, talukas, towns, and local nodes
 * so every small-to-small and big-to-big location is labeled and searchable on the map.
 */
interface ReferencePlace {
  name: string;
  category: 'City / Metro' | 'District HQ' | 'Taluka / Town' | 'Local Node / Village';
  district: string;
  lat: number;
  lng: number;
  zoom: number;
}

const INDIA_AND_REGIONAL_PLACES: ReferencePlace[] = [
  // Pune & Pimpri-Chinchwad Local Nodes
  { name: 'Akurdi / Nigdi (Pimpri-Chinchwad)', category: 'Local Node / Village', district: 'Pune', lat: 18.6517, lng: 73.7615, zoom: 14.5 },
  { name: 'Pimpri-Chinchwad Municipal Hub', category: 'City / Metro', district: 'Pune', lat: 18.6298, lng: 73.7997, zoom: 13.5 },
  { name: 'Pune City (Shivajinagar)', category: 'City / Metro', district: 'Pune', lat: 18.5204, lng: 73.8567, zoom: 13 },
  { name: 'Hinjawadi / Mulshi Corridor', category: 'Taluka / Town', district: 'Pune', lat: 18.5913, lng: 73.7389, zoom: 13.5 },
  { name: 'Lonavala / Khandala Ghat', category: 'Taluka / Town', district: 'Pune', lat: 18.7557, lng: 73.4091, zoom: 13.5 },
  { name: 'Maval (Vadgaon Maval)', category: 'Taluka / Town', district: 'Pune', lat: 18.7422, lng: 73.6418, zoom: 13.5 },
  { name: 'Ambegaon (Ghodegaon / Malin)', category: 'Taluka / Town', district: 'Pune', lat: 19.0445, lng: 73.8352, zoom: 13 },
  { name: 'Junnar / Malshej Ghat', category: 'Taluka / Town', district: 'Pune', lat: 19.2089, lng: 73.8745, zoom: 13 },
  { name: 'Bhor / Bhatghar Catchment', category: 'Taluka / Town', district: 'Pune', lat: 18.1462, lng: 73.8453, zoom: 13 },
  { name: 'Velhe (Torna / Panshet Valley)', category: 'Taluka / Town', district: 'Pune', lat: 18.2921, lng: 73.6334, zoom: 13 },

  // Raigad District Towns, Talukas & Hamlets
  { name: 'Khalapur / Irshalwadi Foothills', category: 'Local Node / Village', district: 'Raigad', lat: 18.8825, lng: 73.2852, zoom: 13.8 },
  { name: 'Karjat Town & Ulhas Basin', category: 'Taluka / Town', district: 'Raigad', lat: 18.9102, lng: 73.3283, zoom: 13.5 },
  { name: 'Matheran Hill Escarpment', category: 'Local Node / Village', district: 'Raigad', lat: 18.9848, lng: 73.2712, zoom: 14 },
  { name: 'Panvel / Navi Mumbai Node', category: 'Taluka / Town', district: 'Raigad', lat: 18.9894, lng: 73.1175, zoom: 13.5 },
  { name: 'Alibag (Raigad District HQ)', category: 'District HQ', district: 'Raigad', lat: 18.6414, lng: 72.8722, zoom: 13 },
  { name: 'Pen Town & Bhogeshwari Basin', category: 'Taluka / Town', district: 'Raigad', lat: 18.7376, lng: 73.0964, zoom: 13.5 },
  { name: 'Roha & Kundalika Riverbank', category: 'Taluka / Town', district: 'Raigad', lat: 18.4368, lng: 73.1196, zoom: 13.5 },
  { name: 'Mangaon Tehsil Center', category: 'Taluka / Town', district: 'Raigad', lat: 18.2345, lng: 73.2812, zoom: 13.5 },
  { name: 'Mahad & Savitri River Confluence', category: 'Taluka / Town', district: 'Raigad', lat: 18.0823, lng: 73.4184, zoom: 13.5 },
  { name: 'Poladpur & Ambenali Ghat', category: 'Taluka / Town', district: 'Raigad', lat: 17.9825, lng: 73.4651, zoom: 13.5 },
  { name: 'Shrivardhan Coastal Town', category: 'Taluka / Town', district: 'Raigad', lat: 18.0338, lng: 73.0156, zoom: 13.5 },
  { name: 'Murud-Janjira Coastal Belt', category: 'Taluka / Town', district: 'Raigad', lat: 18.3292, lng: 72.9614, zoom: 13.5 },

  // Ratnagiri District
  { name: 'Ratnagiri City (District HQ)', category: 'District HQ', district: 'Ratnagiri', lat: 16.9902, lng: 73.312, zoom: 13 },
  { name: 'Chiplun & Vashishti Floodplain', category: 'Taluka / Town', district: 'Ratnagiri', lat: 17.5324, lng: 73.5178, zoom: 13.8 },
  { name: 'Khed & Jagbudi River Basin', category: 'Taluka / Town', district: 'Ratnagiri', lat: 17.7176, lng: 73.3932, zoom: 13.5 },
  { name: 'Dapoli / Harnai Coast', category: 'Taluka / Town', district: 'Ratnagiri', lat: 17.7574, lng: 73.1856, zoom: 13.5 },
  { name: 'Sangameshwar & Shastri Basin', category: 'Taluka / Town', district: 'Ratnagiri', lat: 17.1872, lng: 73.5514, zoom: 13.5 },
  { name: 'Guhagar Coastal Tehsil', category: 'Taluka / Town', district: 'Ratnagiri', lat: 17.4812, lng: 73.1924, zoom: 13.5 },
  { name: 'Rajapur & Kodavali Bank', category: 'Taluka / Town', district: 'Ratnagiri', lat: 16.6572, lng: 73.5162, zoom: 13.5 },

  // Satara, Sangli, Kolhapur & Sindhudurg
  { name: 'Satara City (District HQ)', category: 'District HQ', district: 'Satara', lat: 17.6805, lng: 74.0183, zoom: 13 },
  { name: 'Koynanagar & Koyna Dam', category: 'Local Node / Village', district: 'Satara', lat: 17.3982, lng: 73.7524, zoom: 13.8 },
  { name: 'Patan Tehsil & Kera River', category: 'Taluka / Town', district: 'Satara', lat: 17.3752, lng: 73.9012, zoom: 13.5 },
  { name: 'Mahabaleshwar / Pratapgad', category: 'Taluka / Town', district: 'Satara', lat: 17.9307, lng: 73.6477, zoom: 13.5 },
  { name: 'Panchgani & Wai Valley', category: 'Taluka / Town', district: 'Satara', lat: 17.924, lng: 73.8005, zoom: 13.5 },
  { name: 'Karad (Krishna-Koyna Preeti Sangam)', category: 'Taluka / Town', district: 'Satara', lat: 17.2865, lng: 74.1814, zoom: 13.5 },
  { name: 'Kolhapur City & Panchganga Basin', category: 'District HQ', district: 'Kolhapur', lat: 16.705, lng: 74.2433, zoom: 13 },
  { name: 'Shirol / Kurundwad Confluence', category: 'Taluka / Town', district: 'Kolhapur', lat: 16.7318, lng: 74.5964, zoom: 13.5 },
  { name: 'Sangli City & Irwin Bridge Gauge', category: 'District HQ', district: 'Sangli', lat: 16.8524, lng: 74.5815, zoom: 13 },
  { name: 'Amboli Ghat & Sawantwadi', category: 'Taluka / Town', district: 'Sindhudurg', lat: 15.9612, lng: 74.0034, zoom: 13.5 },

  // Mumbai, Thane, Palghar, Nashik & Pan-India Metros
  { name: 'Mumbai Metropolitan Region', category: 'City / Metro', district: 'Mumbai', lat: 19.076, lng: 72.8777, zoom: 12 },
  { name: 'Thane / Kalyan-Dombivli', category: 'City / Metro', district: 'Thane', lat: 19.2183, lng: 72.9781, zoom: 12.5 },
  { name: 'Palghar / Jawhar / Dahanu', category: 'District HQ', district: 'Palghar', lat: 19.6967, lng: 72.7699, zoom: 12.5 },
  { name: 'Nashik / Igatpuri / Godavari Basin', category: 'City / Metro', district: 'Nashik', lat: 19.9975, lng: 73.7898, zoom: 12.5 },
  { name: 'Nagpur (Vidarbha HQ)', category: 'City / Metro', district: 'Nagpur', lat: 21.1458, lng: 79.0882, zoom: 12 },
  { name: 'New Delhi (NDMA HQ)', category: 'City / Metro', district: 'Delhi', lat: 28.6139, lng: 77.209, zoom: 11.5 },
];



const CWC_RIVER_HYDROLOGY_LINES: { name: string; coords: [number, number][] }[] = [
  {
    name: 'Savitri River (Mahabaleshwar → Poladpur → Mahad → Bankot)',
    coords: [
      [73.64, 17.93],
      [73.47, 17.98],
      [73.41, 18.08],
      [73.24, 18.06],
      [73.04, 17.98],
    ],
  },
  {
    name: 'Vashishti River (Koyna Tailrace → Chiplun → Dabhol)',
    coords: [
      [73.68, 17.42],
      [73.59, 17.47],
      [73.51, 17.53],
      [73.35, 17.56],
      [73.18, 17.58],
    ],
  },
  {
    name: 'Koyna & Krishna River Corridor (Koynanagar → Patan → Karad)',
    coords: [
      [73.76, 17.75],
      [73.75, 17.55],
      [73.76, 17.39],
      [73.90, 17.37],
      [74.18, 17.28],
    ],
  },
  {
    name: 'Ulhas & Pej River Basin (Lonavala → Karjat → Khalapur → Kalyan)',
    coords: [
      [73.40, 18.76],
      [73.33, 18.91],
      [73.28, 18.98],
      [73.19, 19.15],
      [73.12, 19.23],
    ],
  },
  {
    name: 'Pavana, Indrayani & Mula-Mutha (Maval → PCMC Akurdi → Pune)',
    coords: [
      [73.48, 18.74],
      [73.64, 18.72],
      [73.76, 18.65],
      [73.81, 18.61],
      [73.86, 18.53],
    ],
  },
  {
    name: 'Ghod & Dimbhe Catchment (Ambegaon → Malin → Ghodegaon)',
    coords: [
      [73.62, 19.18],
      [73.69, 19.15],
      [73.76, 19.10],
      [73.84, 19.04],
    ],
  },
  {
    name: 'Panchganga River (Kolhapur → Ichalkaranji → Shirol Confluence)',
    coords: [
      [74.08, 16.78],
      [74.24, 16.71],
      [74.44, 16.69],
      [74.60, 16.73],
    ],
  },
];

const GSI_SCARP_AND_FAULT_LINES: { name: string; type: string; coords: [number, number][] }[] = [
  {
    name: 'Western Ghats Sahyadri Main Escarpment Scarp (High Landslide Susceptibility)',
    type: 'GSI Landslide Scarp Lineament',
    coords: [
      [73.68, 19.22],
      [73.52, 19.02],
      [73.27, 18.96],
      [73.40, 18.75],
      [73.43, 18.45],
      [73.49, 18.12],
      [73.63, 17.92],
      [73.69, 17.42],
    ],
  },
  {
    name: 'Koyna-Warna Seismogenic Fault Zone (BIS Seismic Zone IV)',
    type: 'Active Tectonic Fault Line',
    coords: [
      [73.71, 17.68],
      [73.75, 17.40],
      [73.79, 17.18],
      [73.85, 17.02],
    ],
  },
];

/**
 * Generates a 48-point GeoJSON polygon representing a real-world circle in meters around [lng, lat].
 */
function createAccuracyCirclePolygon(
  lng: number,
  lat: number,
  radiusMeters: number
): [number, number][] {
  const points = 48;
  const coords: [number, number][] = [];
  const earthRadius = 6378137;
  const d = Math.max(8, radiusMeters) / earthRadius;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;

  for (let i = 0; i <= points; i++) {
    const bearing = (i * 2 * Math.PI) / points;
    const ptLat = Math.asin(
      Math.sin(latRad) * Math.cos(d) +
      Math.cos(latRad) * Math.sin(d) * Math.cos(bearing)
    );
    const ptLng =
      lngRad +
      Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(latRad),
        Math.cos(d) - Math.sin(latRad) * Math.sin(ptLat)
      );
    coords.push([(ptLng * 180) / Math.PI, (ptLat * 180) / Math.PI]);
  }
  return coords;
}

/**
 * Human-readable precise reverse geocoded location in words and hazard metadata
 * for all disaster monitoring alert zones across Maharashtra (Multilingual: EN / HI / MR).
 */
const ZONE_LOCATION_WORDS_MAP: Record<
  string,
  {
    wordsEn: string;
    wordsHi: string;
    wordsMr: string;
    taluka: string;
    district: string;
    hazardSummaryEn: string;
    hazardSummaryHi: string;
    hazardSummaryMr: string;
  }
> = {
  'az-01': {
    wordsEn: 'Irshalwadi Village, Khalapur Taluka, Raigad District, Western Ghats, Maharashtra, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Khalapur',
    district: 'Raigad',
    hazardSummaryEn: 'Severe Debris Flow & Slope Tension Crack (>212 mm / 24h rainfall)',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
  'az-02': {
    wordsEn: 'Mahad City & Taliye Catchment, Savitri River Basin, Raigad District, Maharashtra, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Mahad',
    district: 'Raigad',
    hazardSummaryEn: 'Riverine Flash Inundation; Savitri River 0.8m above Danger Mark',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
  'az-03': {
    wordsEn: 'Ambenali Ghat Pass, Mahabaleshwar Taluka, Satara District, Western Ghats, Maharashtra, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Mahabaleshwar',
    district: 'Satara',
    hazardSummaryEn: 'Heavy Ghat Rainfall & Landslide Hazard (168 mm / 24h rainfall)',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
  'az-04': {
    wordsEn: 'Chiplun Town & Vashisthi River Floodplain Corridor, Ratnagiri District, Konkan, Maharashtra, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Chiplun',
    district: 'Ratnagiri',
    hazardSummaryEn: 'Tidal Inundation & Koyna Tailrace Water Release High Tide Coincidence',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
  'az-05': {
    wordsEn: 'Lonavala & Maval Valley, Tamhini Ghat Corridor, Pune District, Maharashtra, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Maval',
    district: 'Pune',
    hazardSummaryEn: 'Damini Lightning Watch & Indrayani River Causeway Watch (88 mm / 24h rainfall)',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
  'az-06': {
    wordsEn: 'Malin & Dimbhe Dam Sub-Basin, Ambegaon Taluka, Pune District, Maharashtra, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Ambegaon',
    district: 'Pune',
    hazardSummaryEn: 'Moderate-Heavy Precipitation Watch across Ghod River Catchment (74 mm rainfall)',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
  'az-07': {
    wordsEn: 'Pune District Emergency Operations Center (DEOC), Collector Office, Pune, Maharashtra 411001, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Shivajinagar / Haveli',
    district: 'Pune',
    hazardSummaryEn: 'District Emergency Operations Center & State Relief Logistics Command Hub (<18 mm rainfall)',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
  'az-08': {
    wordsEn: 'Panchganga Basin Monitor Zone, Karveer & Shirol Taluka, Kolhapur District, Maharashtra, India',
    wordsHi: '',
    wordsMr: '',
    taluka: 'Karveer / Shirol',
    district: 'Kolhapur',
    hazardSummaryEn: 'River level 2.4m below warning threshold at Rajaram Weir; Safe status',
    hazardSummaryHi: '',
    hazardSummaryMr: '',
  },
};

function getZoneLocationDetails(zone: ActiveAlertZone) {
  const mapped = ZONE_LOCATION_WORDS_MAP[zone.id];
  const words = mapped ? mapped.wordsEn : `${zone.areaName}, ${zone.district} District, Maharashtra, India`;
  const hazardSummary = mapped ? mapped.hazardSummaryEn : zone.instructions;

  const taluka = mapped?.taluka || zone.areaName.split(',')[1]?.trim() || zone.district;
  const district = zone.district;
  const coordsDD = `${zone.centerLat.toFixed(5)}°N, ${zone.centerLng.toFixed(5)}°E`;
  const coordsDMS = formatLatLngToDms(zone.centerLat, zone.centerLng);

  return {
    words,
    taluka,
    district,
    hazardSummary,
    coordsDD,
    coordsDMS,
  };
}

export const SimplifiedMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [disasterHistoryHighlight, setDisasterHistoryHighlight] = useState<{
    id: string;
    title: string;
    lat: number;
    lng: number;
    severity?: string;
  } | null>(null);

  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const activeAlertZones = useAppStore((s) => s.activeAlertZones);
  const upsertActiveAlertZone = useAppStore((s) => s.upsertActiveAlertZone);
  const volunteers = useAppStore((s) => s.volunteers);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const updateCampOccupancy = useAppStore((s) => s.updateCampOccupancy);
  const setCampOccupancyExact = useAppStore((s) => s.setCampOccupancyExact);
  const villages = useAppStore((s) => s.villages);
  const incidents = useAppStore((s) => s.incidents);
  const weights = useAppStore((s) => s.weights);
  const selectedVillageId = useAppStore((s) => s.selectedVillageId);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const addToast = useAppStore((s) => s.addToast);
  const openExplainModal = useAppStore((s) => s.openExplainModal);
  const openSidePanel = useAppStore((s) => s.openSidePanel);

  const { gps, locateMe, setManualPin } = useAccurateGps();
  const [isLiveTracking, setIsLiveTracking] = useState<boolean>(true);

  const isCitizen = !user || user.role === 'citizen' || user.role === 'villager';
  const canIssueAlerts =
    user?.role === 'administrator' ||
    user?.role === 'sdma' ||
    user?.role === 'national_authority' ||
    user?.role === 'district_officer';
  const canManageShelter = !isCitizen;

  // Map Layer Toggles: Alert Zones, Volunteers, Shelters, Incidents, My Location + All Habitations/Villages + GIS Vector Layers ON by default!
  const [showAlertZones, setShowAlertZones] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(!isCitizen);
  const [showShelters, setShowShelters] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showMyLocation, setShowMyLocation] = useState(true);
  const [showHabitations, setShowHabitations] = useState(true);
  const [villageSearchTerm, setVillageSearchTerm] = useState('');
  const [villageDirectoryOpen, setVillageDirectoryOpen] = useState(true);
  const [showVillageHazardBuffers, setShowVillageHazardBuffers] = useState(true);
  const [showRiverHydrology, setShowRiverHydrology] = useState(true);
  const [showGsiFaultLines, setShowGsiFaultLines] = useState(true);
  const [alertFilterLevel, setAlertFilterLevel] = useState<'ALL' | AlertZoneLevel>('ALL');
  const [basemapMode, setBasemapMode] = useState<'street' | 'satellite' | 'topo' | 'dark'>('street');
  const [is3D, setIs3D] = useState(false);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<MapProviderType>(getStoredMapProvider());

  // GIS Coordinate HUD & Spatial Buffer Radius
  const [coordDisplayFormat, setCoordDisplayFormat] = useState<'DD' | 'DMS' | 'UTM'>('DD');
  const [spatialBufferRadiusKm, setSpatialBufferRadiusKm] = useState<number>(5);
  const [cursorHud, setCursorHud] = useState<{
    lat: number;
    lng: number;
    zoom: number;
    pitch: number;
    bearing: number;
  }>({
    lat: 18.9265,
    lng: 73.2361,
    zoom: 10,
    pitch: 0,
    bearing: 0,
  });

  // Collapsed Advanced Tools Drawer
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [floodSimMeters, setFloodSimMeters] = useState(0);
  const [layerOpacityPct, setLayerOpacityPct] = useState(32);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);

  // Manual GPS pin placement mode
  const [placingManualPin, setPlacingManualPin] = useState(false);
  const [gpsHelpExpanded, setGpsHelpExpanded] = useState(false);

  // Floating Search Box & Quick Jump
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    {
      label: string;
      subLabel?: string;
      category: string;
      colorHex?: string;
      lat: number;
      lng: number;
      zoom?: number;
      village?: Village;
    }[]
  >([]);
  const [quickJumpPlace, setQuickJumpPlace] = useState<string>('');
  const [quickSearchText, setQuickSearchText] = useState('');
  const [isSearchingQuick, setIsSearchingQuick] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const hasAutoCenteredRef = useRef(false);

  // Maharashtra District, Taluka & Village/Gaon Quick Navigation State
  const [selectedMhDistrict, setSelectedMhDistrict] = useState<string>('Pune');
  const [selectedMhTaluka, setSelectedMhTaluka] = useState<string>('');
  const [selectedMhVillage, setSelectedMhVillage] = useState<string>('');
  const [mhDirectoryDivision, setMhDirectoryDivision] = useState<string>('All');

  // Selected entity for detail card (Zone, Shelter, Volunteer, Habitation, or Any Clicked Map Point)
  const [selectedZone, setSelectedZone] = useState<ActiveAlertZone | null>(null);
  const zonePopupRef = useRef<maplibregl.Popup | null>(null);
  const zoneHighlightMarkerRef = useRef<maplibregl.Marker | null>(null);
  const villagePopupRef = useRef<maplibregl.Popup | null>(null);
  const detectAndFocusZoneRef = useRef<((zone: ActiveAlertZone) => void) | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<ReliefCamp | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerMember | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
  const [inspectedPoint, setInspectedPoint] = useState<{
    lat: number;
    lng: number;
    label: string;
    elevationM: number | null;
    rainfall24hMm: number | null;
    temperatureC: number | null;
  } | null>(null);

  // AI 7-Day Weather & Disaster Forecast Modal state
  const [isAiForecastModalOpen, setIsAiForecastModalOpen] = useState(false);
  const [forecastModalVillage, setForecastModalVillage] = useState<Village | null>(null);

  useEffect(() => {
    const handlePlatformRefreshEvent = () => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    };
    window.addEventListener('nivaran:refresh', handlePlatformRefreshEvent);
    return () => window.removeEventListener('nivaran:refresh', handlePlatformRefreshEvent);
  }, []);

  // OSRM route state for "Get directions"
  const [routeInfo, setRouteInfo] = useState<{
    shelterName: string;
    distanceKm: number;
    durationMin: number;
    isFallback: boolean;
    coords: [number, number][];
  } | null>(null);

  // Issue / Change Alert Zone Form + Mandatory Confirmation Step
  const [issueFormOpen, setIssueFormOpen] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string>('');
  const [zoneAreaName, setZoneAreaName] = useState('Irshalwadi & Morbe Catchment Escarpment');
  const [zoneDistrict, setZoneDistrict] = useState('Raigad');
  const [zoneDisasterType, setZoneDisasterType] = useState<AlertDisasterType>('landslide');
  const [zoneLevel, setZoneLevel] = useState<AlertZoneLevel>('Orange');
  const [zoneSeverity, setZoneSeverity] = useState<'Minor' | 'Moderate' | 'Severe' | 'Extreme'>(
    'Severe'
  );
  const [zoneUrgency, setZoneUrgency] = useState<'Immediate' | 'Expected' | 'Future'>('Immediate');
  const [zoneMessageEn, setZoneMessageEn] = useState(
    'Heavy rainfall and slope instability detected. Stay alert and prepare for evacuation.'
  );
  const [zoneMessageHi, setZoneMessageHi] = useState(
    'Heavy rainfall and slope instability warning. Stay alert and prepare for evacuation.'
  );
  const [zoneInstructions, setZoneInstructions] = useState(
    'Warning / Be Prepared. Keep emergency kit ready and stay tuned to control room updates.'
  );
  const [zoneExpiresAt, setZoneExpiresAt] = useState('2026-10-13 18:00 IST');
  const [confirmZoneDialogOpen, setConfirmZoneDialogOpen] = useState(false);

  // Viewport & Map Controls State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareVillage1Id, setCompareVillage1Id] = useState<string>('mh_pune_001');
  const [compareVillage2Id, setCompareVillage2Id] = useState<string>('mh_raigad_001');

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: 300 });
  };

  const handleResetNorth = () => {
    mapRef.current?.resetNorthPitch({ duration: 400 });
  };

  const handleResetStatewideView = () => {
    mapRef.current?.flyTo({
      center: [75.7139, 19.7515],
      zoom: 6.8,
      pitch: 0,
      bearing: 0,
      duration: 800,
    });
  };

  const handleToggleFullscreen = () => {
    const el = mapContainerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleExportMapPng = () => {
    if (!mapRef.current) return;
    try {
      const canvas = mapRef.current.getCanvas();
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `NIVARAN-GIS-Intelligence-Map-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      useAppStore.getState().showSingleToast({
        title: '📸 Map PNG Exported',
        message: 'High-resolution GIS map canvas downloaded successfully.',
        type: 'success',
      });
    } catch (e) {
      console.warn('Map screenshot export failed:', e);
    }
  };

  // Live Open-Meteo rainfall threshold suggestion
  const [liveRainfall24h, setLiveRainfall24h] = useState<number>(84);
  useEffect(() => {
    let active = true;
    void fetchLiveWeather(gps.lat, gps.lng).then((w) => {
      if (active && w) {
        setLiveRainfall24h(w.rainfall24hMm);
      }
    });
    return () => {
      active = false;
    };
  }, [gps.lat, gps.lng]);

  // Load real synthesized GIS risk zones from MongoDB FastAPI Backend
  useEffect(() => {
    let isMounted = true;
    fetch('/api/gis/risk-zones')
      .then((res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        return ct.includes('application/json') ? res.json() : null;
      })
      .then((data) => {
        if (!isMounted || !data?.features) return;
        const mongoZones = data.features.map((f: any) => {
          const isMulti = f.geometry?.type === 'MultiPolygon';
          const ring = isMulti ? f.geometry.coordinates[0][0] : f.geometry.coordinates[0];
          const firstPt = ring?.[0] || [73.2361, 18.9265];
          const code = f.properties.category_code;
          const level: AlertZoneLevel =
            code === 'RED'
              ? 'Red'
              : code === 'YELLOW'
                ? 'Yellow'
                : code === 'ORANGE'
                  ? 'Orange'
                  : 'Green';

          return {
            id: f.id || f.properties.zone_id,
            level,
            category_code: code,
            category_name: f.properties.risk_category,
            color_hex: f.properties.color_hex || f.properties.map_colour,
            risk_score: f.properties.risk_score,
            hazard_score: f.properties.hazard_score,
            vulnerability_score: f.properties.vulnerability_score,
            exposure_score: f.properties.exposure_score,
            affected_area_sqkm: f.properties.affected_area_sqkm,
            exposed_population: f.properties.exposed_population,
            contributing_indicators: f.properties.contributing_indicators,
            source_datasets: f.properties.source_datasets,
            disasterType: (f.properties.disaster_type?.includes('landslide')
              ? 'landslide'
              : 'flood') as AlertDisasterType,
            areaName: f.properties.name,
            district: f.properties.district,
            issuedBy: 'Maharashtra SDMA & GSI Verified Spatial Model',
            issuedAt: f.properties.analysis_timestamp,
            expiresAt: '24h Operational Assessment',
            instructions: `${f.properties.risk_category} (Score: ${f.properties.risk_score}). Area: ${f.properties.affected_area_sqkm} sq km. Exposed Pop: ${f.properties.exposed_population}.`,
            centerLat: firstPt[1],
            centerLng: firstPt[0],
            polygon: ring,
            rawGeometry: f.geometry,
            properties: f.properties,
          };
        });
        if (mongoZones.length > 0) {
          useAppStore.setState((s) => ({
            activeAlertZones: [
              ...mongoZones,
              ...s.activeAlertZones.filter((z) => !mongoZones.some((mz: any) => mz.id === z.id)),
            ],
          }));
        }
      })
      .catch(() => { });
    return () => {
      isMounted = false;
    };
  }, []);

  const suggestedAlertLevel: { level: AlertZoneLevel; reason: string } = useMemo(() => {
    if (liveRainfall24h >= 115.6) {
      return {
        level: 'Orange',
        reason: `Open-Meteo 24h rainfall is ${liveRainfall24h} mm (>=115.6 mm IMD Very Heavy Rain threshold). Suggested: Orange Alert (Be Prepared) — Red Alert requires explicit authority confirmation.`,
      };
    }
    if (liveRainfall24h >= 64.5) {
      return {
        level: 'Yellow',
        reason: `Open-Meteo 24h rainfall is ${liveRainfall24h} mm (64.5–115.5 mm IMD Heavy Rain threshold). Suggested: Yellow Alert (Watch / Be Updated) — needs authority confirmation.`,
      };
    }
    return {
      level: 'Green',
      reason: `Open-Meteo 24h rainfall is ${liveRainfall24h} mm (<64.5 mm normal threshold). Suggested: Green (No Warning / Safe).`,
    };
  }, [liveRainfall24h]);

  // Nearest 3 available shelters for user's current location
  const nearestThreeAvailableShelters = useMemo(() => {
    return reliefCamps
      .filter((c) => c.currentOccupancy < c.capacityPersons)
      .map((c) => ({
        camp: c,
        distanceKm: Number(haversineKm(gps.lat, gps.lng, c.lat, c.lng).toFixed(1)),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [reliefCamps, gps.lat, gps.lng]);

  // Opted-in Volunteers for authorised roles
  const visibleVolunteers = useMemo(() => {
    if (isCitizen || !showVolunteers) return [];
    return volunteers.filter((v) => v.optedInLocationSharing);
  }, [volunteers, isCitizen, showVolunteers]);

  // Flood simulation calculation when floodSimMeters > 0
  const floodSimResult = useMemo(() => {
    return floodFill(floodSimMeters, villages, reliefCamps);
  }, [floodSimMeters, villages, reliefCamps]);

  // Village Zone & Hazard Tier Resolver
  const getVillageZoneMeta = (v: Village) => {
    const hScore = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
    const rLevel = classifyHazard(hScore);
    const colorHex = getRiskColor(rLevel);
    const score100 = Math.round(hScore * 100);
    const zoneName =
      rLevel === 'Immediate'
        ? 'Red Zone'
        : rLevel === 'Short-term'
          ? 'Orange Zone'
          : rLevel === 'Medium-term'
            ? 'Yellow Zone'
            : 'Green Safe';
    const tier: 'Red' | 'Orange' | 'Yellow' | 'Green' =
      rLevel === 'Immediate'
        ? 'Red'
        : rLevel === 'Short-term'
          ? 'Orange'
          : rLevel === 'Medium-term'
            ? 'Yellow'
            : 'Green';
    return { hScore, score100, rLevel, colorHex, zoneName, tier };
  };

  // MapLibre Instance Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const villageMarkersRef = useRef<maplibregl.Marker[]>([]);
  const shelterMarkersRef = useRef<maplibregl.Marker[]>([]);
  const volunteerMarkersRef = useRef<maplibregl.Marker[]>([]);
  const incidentMarkersRef = useRef<maplibregl.Marker[]>([]);
  const zoneBadgeMarkersRef = useRef<maplibregl.Marker[]>([]);
  const inspectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const selectedVillageMarkerRef = useRef<maplibregl.Marker | null>(null);

  const handleProviderChanged = (newProvider: MapProviderType) => {
    setActiveProvider(newProvider);
    if (mapRef.current && mapRef.current.isStyleLoaded()) {
      const src = mapRef.current.getSource('osm_street') as maplibregl.RasterTileSource;
      if (src && typeof src.setTiles === 'function') {
        const config = getStreetBasemapConfig(newProvider);
        src.setTiles(config.tiles);
      }
    }
  };

  // Initialize MapLibre Map with Street, Satellite + Hybrid Place/Road Labels, and Topo Basemaps
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [gps.lng || 73.2361, gps.lat || 18.9265],
      zoom: 10,
      pitch: 0,
      bearing: 0,
      maxPitch: 75,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          osm_street: {
            type: 'raster',
            tiles: getStreetBasemapConfig().tiles,
            tileSize: 256,
            maxzoom: 19,
          },
          esri_sat: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          esri_roads_overlay: {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          esri_labels_overlay: {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          open_topo: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          carto_dark: {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            maxzoom: 19,
          },
          terrarium_dem: {
            type: 'raster-dem',
            tiles: [TERRARIUM_TILES],
            tileSize: 256,
            maxzoom: 15,
            encoding: 'terrarium',
          },
        },
        layers: [
          {
            id: 'map-solid-background',
            type: 'background',
            paint: { 'background-color': '#0F1E2E' },
          },
          {
            id: 'basemap-street',
            type: 'raster',
            source: 'osm_street',
            layout: { visibility: 'visible' },
          },
          {
            id: 'basemap-satellite',
            type: 'raster',
            source: 'esri_sat',
            layout: { visibility: 'none' },
          },
          {
            id: 'basemap-satellite-roads',
            type: 'raster',
            source: 'esri_roads_overlay',
            layout: { visibility: 'none' },
          },
          {
            id: 'basemap-satellite-labels',
            type: 'raster',
            source: 'esri_labels_overlay',
            layout: { visibility: 'none' },
          },
          {
            id: 'basemap-topo',
            type: 'raster',
            source: 'open_topo',
            layout: { visibility: 'none' },
          },
          {
            id: 'basemap-dark',
            type: 'raster',
            source: 'carto_dark',
            layout: { visibility: 'none' },
          },
          {
            id: 'basemap-hillshade',
            type: 'hillshade',
            source: 'terrarium_dem',
            layout: { visibility: 'none' },
            paint: {
              'hillshade-exaggeration': 0.65,
              'hillshade-shadow-color': '#000000',
              'hillshade-highlight-color': '#FFFFFF',
              'hillshade-accent-color': '#0B8F80',
            },
          },
        ],
      },
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }), 'bottom-left');

    map.on('mousemove', (ev) => {
      setCursorHud({
        lat: Number(ev.lngLat.lat.toFixed(5)),
        lng: Number(ev.lngLat.lng.toFixed(5)),
        zoom: Number(map.getZoom().toFixed(2)),
        pitch: Math.round(map.getPitch()),
        bearing: Math.round(map.getBearing()),
      });
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      setCursorHud((prev) => ({
        ...prev,
        lat: Number(c.lat.toFixed(5)),
        lng: Number(c.lng.toFixed(5)),
        zoom: Number(map.getZoom().toFixed(2)),
        pitch: Math.round(map.getPitch()),
        bearing: Math.round(map.getBearing()),
      }));
    });

    map.on('load', () => {
      // 1. Active Disaster Alert Zones source & layers (Red / Orange / Yellow / Green)
      map.addSource('active-alert-zones', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'active-alert-zones-fill',
        type: 'fill',
        source: 'active-alert-zones',
        paint: {
          'fill-color': [
            'coalesce',
            ['get', 'color_hex'],
            [
              'match',
              ['get', 'category_code'],
              'RED',
              '#DC2626',
              'YELLOW',
              '#EAB308',
              'ORANGE',
              '#F97316',
              'LIGHT_GREEN',
              '#84CC16',
              'GREEN',
              '#16A34A',
              [
                'match',
                ['get', 'level'],
                'Red',
                '#DC2626',
                'Yellow',
                '#EAB308',
                'Orange',
                '#F97316',
                '#16A34A',
              ],
            ],
          ],
          'fill-opacity': 0.35,
        },
      });

      map.addLayer({
        id: 'active-alert-zones-outline',
        type: 'line',
        source: 'active-alert-zones',
        paint: {
          'line-color': [
            'coalesce',
            ['get', 'color_hex'],
            [
              'match',
              ['get', 'category_code'],
              'RED',
              '#DC2626',
              'YELLOW',
              '#EAB308',
              'ORANGE',
              '#F97316',
              'LIGHT_GREEN',
              '#84CC16',
              'GREEN',
              '#16A34A',
              [
                'match',
                ['get', 'level'],
                'Red',
                '#DC2626',
                'Yellow',
                '#EAB308',
                'Orange',
                '#F97316',
                '#16A34A',
              ],
            ],
          ],
          'line-width': 2.75,
        },
      });

      map.on('click', 'active-alert-zones-fill', (e) => {
        const feat = e.features?.[0];
        if (!feat || !feat.properties) return;
        const zoneId = feat.properties.id as string;
        const found = useAppStore
          .getState()
          .activeAlertZones.find((z) => z.id === zoneId);
        if (found) {
          detectAndFocusZoneRef.current?.(found);
        }
      });

      map.on('mouseenter', 'active-alert-zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'active-alert-zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // 1B. GIS Village Concentric Multi-Hazard Buffer Rings (1.5 km Radius)
      map.addSource('village-hazard-buffers', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'village-hazard-buffers-fill',
        type: 'fill',
        source: 'village-hazard-buffers',
        paint: {
          'fill-color': ['get', 'colorHex'],
          'fill-opacity': 0.18,
        },
      });

      map.addLayer({
        id: 'village-hazard-buffers-line',
        type: 'line',
        source: 'village-hazard-buffers',
        paint: {
          'line-color': ['get', 'colorHex'],
          'line-width': 1.5,
          'line-dasharray': [2, 1],
        },
      });

      // 1C. CWC River Hydrology Vector Network
      map.addSource('cwc-rivers-gis', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: CWC_RIVER_HYDROLOGY_LINES.map((rv, idx) => ({
            type: 'Feature' as const,
            properties: { id: `rv-${idx}`, name: rv.name },
            geometry: {
              type: 'LineString' as const,
              coordinates: rv.coords,
            },
          })),
        },
      });

      map.addLayer({
        id: 'cwc-rivers-gis-casing',
        type: 'line',
        source: 'cwc-rivers-gis',
        paint: {
          'line-color': '#0369A1',
          'line-width': 4.5,
          'line-opacity': 0.55,
        },
      });

      map.addLayer({
        id: 'cwc-rivers-gis-line',
        type: 'line',
        source: 'cwc-rivers-gis',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 2.5,
        },
      });

      // 1D. GSI Landslide Scarp & Tectonic Fault Lineaments
      map.addSource('gsi-faults-gis', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: GSI_SCARP_AND_FAULT_LINES.map((fl, idx) => ({
            type: 'Feature' as const,
            properties: { id: `fl-${idx}`, name: fl.name, type: fl.type },
            geometry: {
              type: 'LineString' as const,
              coordinates: fl.coords,
            },
          })),
        },
      });

      map.addLayer({
        id: 'gsi-faults-gis-line',
        type: 'line',
        source: 'gsi-faults-gis',
        paint: {
          'line-color': '#9333EA',
          'line-width': 2.5,
          'line-dasharray': [4, 2],
        },
      });

      // 1E. Interactive GIS Spatial Buffer Query Ring (2 km / 5 km / 10 km)
      map.addSource('gis-spatial-buffer', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'gis-spatial-buffer-fill',
        type: 'fill',
        source: 'gis-spatial-buffer',
        paint: {
          'fill-color': '#0B8F80',
          'fill-opacity': 0.14,
        },
      });

      map.addLayer({
        id: 'gis-spatial-buffer-line',
        type: 'line',
        source: 'gis-spatial-buffer',
        paint: {
          'line-color': '#0B8F80',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });

      // 2. Flood Simulation Inundation Polygons source & layers
      map.addSource('flood-sim-cells', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'flood-sim-fill',
        type: 'fill',
        source: 'flood-sim-cells',
        paint: {
          'fill-color': '#0284C7',
          'fill-opacity': 0.42,
        },
      });

      map.addLayer({
        id: 'flood-sim-outline',
        type: 'line',
        source: 'flood-sim-cells',
        paint: {
          'line-color': '#0369A1',
          'line-width': 1.5,
        },
      });

      // 3. User GPS Accuracy Circle Polygon source & layers
      map.addSource('user-gps-accuracy', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'user-gps-accuracy-fill',
        type: 'fill',
        source: 'user-gps-accuracy',
        paint: {
          'fill-color': '#059669',
          'fill-opacity': 0.16,
        },
      });

      map.addLayer({
        id: 'user-gps-accuracy-line',
        type: 'line',
        source: 'user-gps-accuracy',
        paint: {
          'line-color': '#059669',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      });

      // 4. OSRM Directions Route Line source & layer
      map.addSource('shelter-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'shelter-route-line',
        type: 'line',
        source: 'shelter-route',
        paint: {
          'line-color': '#0B8F80',
          'line-width': 4.5,
        },
      });

      // 5. Measure tool line
      map.addSource('measure-line', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'measure-line-layer',
        type: 'line',
        source: 'measure-line',
        paint: {
          'line-color': '#D97706',
          'line-width': 3,
          'line-dasharray': [2, 1],
        },
      });

      // 6. Selected Village Authentic Cadastral Boundary Polygon
      map.addSource('selected-village-boundary', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'selected-village-boundary-fill',
        type: 'fill',
        source: 'selected-village-boundary',
        paint: {
          'fill-color': [
            'coalesce',
            ['get', 'colorHex'],
            '#008060',
          ],
          'fill-opacity': 0.28,
        },
      });

      map.addLayer({
        id: 'selected-village-boundary-line',
        type: 'line',
        source: 'selected-village-boundary',
        paint: {
          'line-color': [
            'coalesce',
            ['get', 'colorHex'],
            '#008060',
          ],
          'line-width': 3.2,
        },
      });

      map.addLayer({
        id: 'selected-village-boundary-glow',
        type: 'line',
        source: 'selected-village-boundary',
        paint: {
          'line-color': '#FFFFFF',
          'line-width': 1.5,
          'line-dasharray': [3, 2],
        },
      });

      // Auto-request live location and fly to user's real GPS position on initial load
      void locateUserAccurately().then((res) => {
        if (res && res.ok && mapRef.current) {
          mapRef.current.flyTo({
            center: [res.lng, res.lat],
            zoom: 12.5,
            duration: 900,
            essential: true,
          });
        }
      });

      // Pause live follow when user manually drags or pans the map
      map.on('dragstart', () => {
        setIsLiveTracking(false);
      });
    });

    map.on('error', (e: any) => {
      if (e?.error?.status !== 404) {
        console.warn('SimplifiedMap map event:', e?.error?.message || e);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Handle Map Click for: (a) Manual Pin Placement, (b) Distance Measurement, or (c) Click-Anywhere Location Inspector
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const clickLat = Number(e.lngLat.lat.toFixed(5));
      const clickLng = Number(e.lngLat.lng.toFixed(5));

      if (placingManualPin) {
        setManualPin(clickLat, clickLng);
        setPlacingManualPin(false);
        addToast({
          title: 'Location pin updated manually',
          message: `Pinned at ${clickLat}°N, ${clickLng}°E.`,
          type: 'success',
        });
        return;
      }

      if (measureMode) {
        setMeasurePoints((prev) => [...prev, [clickLng, clickLat]]);
        return;
      }

      // Inspect any clicked coordinate (elevation + live weather)
      setInspectedPoint({
        lat: clickLat,
        lng: clickLng,
        label: `Clicked Location (${clickLat}°N, ${clickLng}°E)`,
        elevationM: null,
        rainfall24hMm: null,
        temperatureC: null,
      });

      void Promise.all([
        fetchPointElevation(clickLat, clickLng),
        fetchLiveWeather(clickLat, clickLng),
      ]).then(([elev, weather]) => {
        setInspectedPoint((prev) =>
          prev && prev.lat === clickLat && prev.lng === clickLng
            ? {
              ...prev,
              elevationM: elev,
              rainfall24hMm: weather.rainfall24hMm,
              temperatureC: weather.temperatureC,
            }
            : prev
        );
      });
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [placingManualPin, measureMode, setManualPin, addToast]);

  const prevIs3DRef = useRef<boolean>(false);

  // Sync Basemap (Street vs Satellite with Hybrid Labels vs Topo vs Dark) and 2D/3D Terrain + GIS Vector Layer Visibilities
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyBasemapConfig = () => {
      if (map.getLayer('basemap-street')) {
        map.setLayoutProperty(
          'basemap-street',
          'visibility',
          basemapMode === 'street' ? 'visible' : 'none'
        );
      }
      if (map.getLayer('basemap-satellite')) {
        map.setLayoutProperty(
          'basemap-satellite',
          'visibility',
          basemapMode === 'satellite' ? 'visible' : 'none'
        );
      }
      if (map.getLayer('basemap-satellite-roads')) {
        map.setLayoutProperty(
          'basemap-satellite-roads',
          'visibility',
          basemapMode === 'satellite' ? 'visible' : 'none'
        );
      }
      if (map.getLayer('basemap-satellite-labels')) {
        map.setLayoutProperty(
          'basemap-satellite-labels',
          'visibility',
          basemapMode === 'satellite' ? 'visible' : 'none'
        );
      }
      if (map.getLayer('basemap-topo')) {
        map.setLayoutProperty(
          'basemap-topo',
          'visibility',
          basemapMode === 'topo' ? 'visible' : 'none'
        );
      }
      if (map.getLayer('basemap-dark')) {
        map.setLayoutProperty(
          'basemap-dark',
          'visibility',
          basemapMode === 'dark' ? 'visible' : 'none'
        );
      }
      if (map.getLayer('basemap-hillshade')) {
        map.setLayoutProperty(
          'basemap-hillshade',
          'visibility',
          is3D || basemapMode === 'topo' ? 'visible' : 'none'
        );
        map.setPaintProperty(
          'basemap-hillshade',
          'hillshade-shadow-color',
          basemapMode === 'dark' ? '#000000' : '#334155'
        );
        map.setPaintProperty(
          'basemap-hillshade',
          'hillshade-highlight-color',
          basemapMode === 'dark' ? '#1E293B' : '#FFFFFF'
        );
      }
      if (map.getLayer('map-solid-background')) {
        map.setPaintProperty(
          'map-solid-background',
          'background-color',
          basemapMode === 'dark' ? '#090D14' : basemapMode === 'topo' ? '#EBF0E6' : '#0F1E2E'
        );
      }

      if (map.getLayer('cwc-rivers-gis-line')) {
        map.setLayoutProperty(
          'cwc-rivers-gis-line',
          'visibility',
          showRiverHydrology ? 'visible' : 'none'
        );
        map.setLayoutProperty(
          'cwc-rivers-gis-casing',
          'visibility',
          showRiverHydrology ? 'visible' : 'none'
        );
      }

      if (map.getLayer('gsi-faults-gis-line')) {
        map.setLayoutProperty(
          'gsi-faults-gis-line',
          'visibility',
          showGsiFaultLines ? 'visible' : 'none'
        );
      }

      const was3D = prevIs3DRef.current;
      prevIs3DRef.current = is3D;

      if (is3D) {
        try {
          map.setTerrain({ source: 'terrarium_dem', exaggeration: 1.5 });
          if (!was3D || map.getPitch() < 20) {
            map.easeTo({ pitch: 58, duration: 600 });
          }
        } catch {
          // Ignore if DEM source not ready
        }
      } else {
        try {
          map.setTerrain(null);
          if (was3D || map.getPitch() > 0) {
            map.easeTo({ pitch: 0, duration: 500 });
          }
        } catch {
          // Ignore
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyBasemapConfig();
    } else {
      map.once('load', applyBasemapConfig);
      map.once('styledata', applyBasemapConfig);
    }
  }, [basemapMode, is3D, showRiverHydrology, showGsiFaultLines]);

  // Sync Active Disaster Alert Zones GeoJSON (Filtered by alertFilterLevel)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateZones = () => {
      const src = map.getSource('active-alert-zones') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      if (!showAlertZones) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      const visibleZones = activeAlertZones.filter((z) => {
        if (alertFilterLevel !== 'ALL' && z.level !== alertFilterLevel) return false;
        return true;
      });
      src.setData({
        type: 'FeatureCollection',
        features: visibleZones.map((z) => ({
          type: 'Feature' as const,
          properties: {
            id: z.id,
            level: z.level,
            areaName: z.areaName,
            disasterType: z.disasterType,
            color_hex: (z as any).color_hex || (z.level === 'Red' ? '#DC2626' : z.level === 'Yellow' ? '#EAB308' : z.level === 'Orange' ? '#F97316' : (z.level as any) === 'Light Green' ? '#84CC16' : '#16A34A'),
            risk_score: (z as any).risk_score ?? (z.level === 'Red' ? 88.5 : z.level === 'Yellow' ? 68.0 : z.level === 'Orange' ? 48.0 : 15.0),
            category_code: (z as any).category_code,
            category_name: (z as any).category_name,
            affected_area_sqkm: (z as any).affected_area_sqkm,
            exposed_population: (z as any).exposed_population,
            hazard_score: (z as any).hazard_score,
            vulnerability_score: (z as any).vulnerability_score,
            exposure_score: (z as any).exposure_score,
            contributing_indicators: (z as any).contributing_indicators,
          },
          geometry: (z as any).rawGeometry || {
            type: 'Polygon' as const,
            coordinates: [z.polygon],
          },
        })),
      });
    };
    if (map.isStyleLoaded()) updateZones();
    else map.once('load', updateZones);
  }, [
    activeAlertZones,
    showAlertZones,
    alertFilterLevel,
  ]);

  // Sync GIS Village Concentric Hazard Buffer Rings (1.5 km radius around each habitation)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateVillageBuffers = () => {
      const src = map.getSource('village-hazard-buffers') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      if (!showVillageHazardBuffers || !showHabitations) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      const filteredVillages = villages.filter((v) => {
        if (alertFilterLevel === 'ALL') return true;
        const hScore = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
        const rLevel = classifyHazard(hScore);
        if (alertFilterLevel === 'Red') return rLevel === 'Immediate';
        if (alertFilterLevel === 'Orange') return rLevel === 'Short-term';
        if (alertFilterLevel === 'Yellow') return rLevel === 'Medium-term';
        return rLevel === 'Safe';
      });
      src.setData({
        type: 'FeatureCollection',
        features: filteredVillages.map((v) => {
          const hScore = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
          const rLevel = classifyHazard(hScore);
          const colorHex = getRiskColor(rLevel);
          const ring = createAccuracyCirclePolygon(v.lng, v.lat, 1500);
          return {
            type: 'Feature' as const,
            properties: {
              id: v.id,
              name: v.name,
              colorHex,
            },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [ring],
            },
          };
        }),
      });
    };
    if (map.isStyleLoaded()) updateVillageBuffers();
    else map.once('load', updateVillageBuffers);
  }, [villages, weights, showVillageHazardBuffers, showHabitations, alertFilterLevel]);

  // Sync Interactive GIS Spatial Buffer Query Ring around selectedVillage or inspectedPoint
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateSpatialBuffer = () => {
      const src = map.getSource('gis-spatial-buffer') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      const targetLat = selectedVillage?.lat ?? inspectedPoint?.lat ?? null;
      const targetLng = selectedVillage?.lng ?? inspectedPoint?.lng ?? null;
      if (targetLat === null || targetLng === null) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      const ring = createAccuracyCirclePolygon(
        targetLng,
        targetLat,
        spatialBufferRadiusKm * 1000
      );
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { radiusKm: spatialBufferRadiusKm },
            geometry: {
              type: 'Polygon',
              coordinates: [ring],
            },
          },
        ],
      });
    };
    if (map.isStyleLoaded()) updateSpatialBuffer();
    else map.once('load', updateSpatialBuffer);
  }, [selectedVillage, inspectedPoint, spatialBufferRadiusKm]);

  // Sync Flood Simulation Inundation Polygons GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateFloodCells = () => {
      const src = map.getSource('flood-sim-cells') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      src.setData({
        type: 'FeatureCollection',
        features: floodSimResult.cells.map((cell) => ({
          type: 'Feature' as const,
          properties: {
            id: cell.id,
            depthMeters: cell.depthMeters,
            riverName: cell.riverName,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [cell.polygon],
          },
        })),
      });
    };
    if (map.isStyleLoaded()) updateFloodCells();
    else map.once('load', updateFloodCells);
  }, [floodSimResult]);

  // Sync User GPS Accuracy Circle Polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateAccuracyCircle = () => {
      const src = map.getSource('user-gps-accuracy') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      if (!showMyLocation) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      const ring = createAccuracyCirclePolygon(gps.lng, gps.lat, gps.accuracyMeters);
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [ring],
            },
          },
        ],
      });
    };
    if (map.isStyleLoaded()) updateAccuracyCircle();
    else map.once('load', updateAccuracyCircle);
  }, [gps.lat, gps.lng, gps.accuracyMeters, showMyLocation]);

  // Continuous Live GPS Auto-centering (Follow Me) when tracking is active
  useEffect(() => {
    if (!isLiveTracking || !mapRef.current || gps.isManualPin || selectedVillage) return;
    mapRef.current.easeTo({
      center: [gps.lng, gps.lat],
      duration: 650,
      essential: true,
    });
  }, [gps.lat, gps.lng, isLiveTracking, gps.isManualPin, selectedVillage]);

  // Sync OSRM Shelter Directions Route Line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateRoute = () => {
      const src = map.getSource('shelter-route') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      if (!routeInfo || routeInfo.coords.length === 0) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      src.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeInfo.coords,
            },
          },
        ],
      });
    };
    if (map.isStyleLoaded()) updateRoute();
    else map.once('load', updateRoute);
  }, [routeInfo]);

  // Sync Measure Line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateMeasure = () => {
      const measSrc = map.getSource('measure-line') as maplibregl.GeoJSONSource | undefined;
      if (measSrc) {
        measSrc.setData({
          type: 'FeatureCollection',
          features:
            measurePoints.length >= 2
              ? [
                {
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'LineString', coordinates: measurePoints },
                },
              ]
              : [],
        });
      }
    };
    if (map.isStyleLoaded()) updateMeasure();
    else map.once('load', updateMeasure);
  }, [measurePoints]);

  // Sync Selected Village Authentic Cadastral Boundary Polygon
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateBoundary = () => {
      const src = map.getSource('selected-village-boundary') as maplibregl.GeoJSONSource | undefined;
      if (!src) return;
      if (!selectedVillage) {
        src.setData({ type: 'FeatureCollection', features: [] });
        return;
      }
      const feat = generateVillageBoundaryPolygon(selectedVillage, weights, selectedVillage.verifiedReportsCount);
      src.setData({
        type: 'FeatureCollection',
        features: [feat as any],
      });
    };
    if (map.isStyleLoaded()) updateBoundary();
    else map.once('load', updateBoundary);
  }, [selectedVillage, weights]);

  // Render Markers for:
  // (1) My Location Blue Dot + Heading Arrow
  // (2) All Habitations / Villages (with Red / Orange / Yellow / Green risk badges & village names)
  // (3) Shelters / Relief Camps (Available / Filling / Full)
  // (4) Opted-In Volunteers (Authorised roles)
  // 1. Dedicated Live User GPS Marker (Never recreates 370 village markers on GPS movement)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!showMyLocation || gps.lat === null || gps.lng === null) {
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      return;
    }

    const headingHtml =
      gps.headingDeg !== null
        ? `<div style="transform: rotate(${gps.headingDeg}deg)" class="text-[#059669] font-bold text-xs leading-none">▲</div>`
        : '';
    const labelText = gps.shortAddressInWords || 'My Live Location';
    const accuracyText = `±${Math.round(gps.accuracyMeters)}m`;

    if (!userLocationMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'flex flex-col items-center pointer-events-auto cursor-pointer';
      el.innerHTML = `
        <div class="relative flex flex-col items-center group">
          <div id="user-gps-heading">${headingHtml}</div>
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-emerald-500/35 animate-ping"></span>
            <span class="w-4 h-4 rounded-full bg-[#059669] border-2 border-white shadow-lg block z-10"></span>
          </div>
          <span class="mt-1 px-2.5 py-0.5 rounded-full bg-[#059669] text-white text-[10.5px] font-bold shadow-md whitespace-nowrap border border-white flex items-center gap-1">
            <span id="user-gps-label">🎯 ${labelText}</span>
            <span id="user-gps-acc" class="opacity-85 font-mono text-[9px]">(${accuracyText})</span>
          </span>
        </div>
      `;

      el.addEventListener('click', () => {
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [gps.lng, gps.lat],
            zoom: 15.5,
            duration: 600,
          });
        }
      });

      const popup = new maplibregl.Popup({ offset: 20, closeButton: true }).setHTML(`
        <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 220px; max-width: 300px;">
          <div style="font-weight: 800; font-size: 13px; color: #059669; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span>📍 Live GPS Location</span>
            <span style="font-size: 10px; background: #D1E7DD; color: #0F5132; padding: 1px 6px; border-radius: 9999px;">${gps.qualityBadge}</span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #0F291E; line-height: 1.35; margin-bottom: 6px;">
            ${gps.addressInWords || gps.shortAddressInWords || 'Live Position'}
          </div>
          <div style="font-family: monospace; font-size: 11px; color: #355344; background: #F0FDF4; padding: 4px 6px; border-radius: 6px; border: 1px solid #BBF7D0; margin-bottom: 4px;">
            <strong>Coordinates:</strong> ${gps.lat.toFixed(5)}°N, ${gps.lng.toFixed(5)}°E
          </div>
          <div style="font-size: 10.5px; color: #64748B; display: flex; justify-content: space-between;">
            <span>Accuracy: <strong>±${Math.round(gps.accuracyMeters)}m</strong></span>
            <span>Fix: <strong>${gps.updatedAtIst} IST</strong></span>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([gps.lng, gps.lat])
        .setPopup(popup)
        .addTo(map);

      userLocationMarkerRef.current = marker;
    } else {
      userLocationMarkerRef.current.setLngLat([gps.lng, gps.lat]);
      const headingEl = document.getElementById('user-gps-heading');
      if (headingEl) headingEl.innerHTML = headingHtml;
      const labelEl = document.getElementById('user-gps-label');
      if (labelEl) labelEl.textContent = `🎯 ${labelText}`;
      const accEl = document.getElementById('user-gps-acc');
      if (accEl) accEl.textContent = `(${accuracyText})`;
    }
  }, [
    showMyLocation,
    gps.lat,
    gps.lng,
    gps.headingDeg,
    gps.accuracyMeters,
    gps.shortAddressInWords,
    gps.addressInWords,
    gps.qualityBadge,
    gps.updatedAtIst,
  ]);

  // 1B. Active Alert Zone Centroid Badges on Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    zoneBadgeMarkersRef.current.forEach((m) => m.remove());
    zoneBadgeMarkersRef.current = [];

    if (!showAlertZones) return;

    const visibleZones =
      alertFilterLevel === 'ALL'
        ? activeAlertZones
        : activeAlertZones.filter((z) => z.level === alertFilterLevel);

    visibleZones.forEach((zone) => {
      const meta = getAlertLevelMeta(zone.level);
      const rawScore =
        (zone as any).risk_score ??
        (zone.level === 'Red' ? 88.5 : zone.level === 'Yellow' ? 68.0 : zone.level === 'Orange' ? 48.0 : 18.0);
      const score = Number(rawScore).toFixed(1);
      const shortName = zone.areaName.split(',')[0];

      const badge = document.createElement('button');
      badge.type = 'button';
      badge.className =
        'px-2.5 py-1 rounded-full text-[11px] font-sans font-bold text-white shadow-xl border-2 border-white flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-all';
      badge.style.backgroundColor = meta.bg;
      badge.innerHTML = `
        <span style="background: rgba(0,0,0,0.32); padding: 1px 6px; border-radius: 9999px; font-weight: 800; font-family: monospace;">Score: ${score}</span>
        <span>${shortName}</span>
      `;
      badge.title = `${zone.areaName} — Risk Score: ${score}/100 (${zone.level} Zone)`;
      badge.onclick = (ev) => {
        ev.stopPropagation();
        detectAndFocusZoneRef.current?.(zone);
      };
      const zm = new maplibregl.Marker({ element: badge })
        .setLngLat([zone.centerLng, zone.centerLat])
        .addTo(map);
      zoneBadgeMarkersRef.current.push(zm);
    });
  }, [showAlertZones, alertFilterLevel, activeAlertZones]);

  // 2. All Habitations / Villages with Name Labels & Risk Colour (Red / Orange / Yellow / Green)
  // Rebuilds ONLY when habitations list, showHabitations, alertFilterLevel, search, or weights change (Zero GPS coupling!)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    villageMarkersRef.current.forEach((m) => m.remove());
    villageMarkersRef.current = [];

    const activeSearchQuery = (villageSearchTerm.trim() || searchQuery.trim()).toLowerCase();
    const villagesToDisplay = showHabitations
      ? villages
      : activeSearchQuery
        ? villages.filter((v) => {
            return (
              v.name.toLowerCase().includes(activeSearchQuery) ||
              v.taluka.toLowerCase().includes(activeSearchQuery) ||
              v.district.toLowerCase().includes(activeSearchQuery) ||
              v.primaryHazard?.toLowerCase().includes(activeSearchQuery)
            );
          })
        : [];

    if (villagesToDisplay.length > 0) {
      villagesToDisplay.forEach((v) => {
        const meta = getVillageZoneMeta(v);
        if (alertFilterLevel !== 'ALL' && showHabitations) {
          if (alertFilterLevel === 'Red' && meta.tier !== 'Red') return;
          if (alertFilterLevel === 'Orange' && meta.tier !== 'Orange') return;
          if (alertFilterLevel === 'Yellow' && meta.tier !== 'Yellow') return;
          if (alertFilterLevel === 'Green' && meta.tier !== 'Green') return;
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className =
          'px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow border border-white flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform';
        btn.style.backgroundColor = meta.colorHex;
        btn.innerHTML = `<span class="w-2 h-2 rounded-full bg-white inline-block"></span><span>${v.name}</span><span class="opacity-90 font-mono text-[9px] bg-black/25 px-1 py-0.2 rounded">${meta.score100}</span>`;
        btn.title = `${v.name} (${v.taluka}, ${v.district}) · ${meta.zoneName} · Risk Score: ${meta.score100}/100`;
        btn.onclick = (ev) => {
          ev.stopPropagation();
          handleSelectVillageFromList(v);
        };

        const m = new maplibregl.Marker({ element: btn })
          .setLngLat([v.lng, v.lat])
          .addTo(map);
        villageMarkersRef.current.push(m);
      });
    }
  }, [
    showHabitations,
    alertFilterLevel,
    villages,
    weights,
    villageSearchTerm,
    searchQuery,
  ]);

  // 3. Shelters Markers with Name & Status
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    shelterMarkersRef.current.forEach((m) => m.remove());
    shelterMarkersRef.current = [];

    if (!showShelters) return;

    reliefCamps.forEach((camp) => {
      const meta = getShelterStatusMeta(camp);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'px-2 py-0.5 rounded-[6px] text-[10px] font-bold text-white shadow border border-white flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform';
      btn.style.backgroundColor = meta.colorHex;
      const shortName = camp.name.split(' ').slice(0, 2).join(' ');
      btn.innerHTML = `<span>⛺</span><span>${shortName} (${meta.statusText})</span>`;
      btn.title = `${camp.name} (${meta.statusText} · ${meta.freeBeds} free beds)`;
      btn.onclick = (ev) => {
        ev.stopPropagation();
        setSelectedZone(null);
        clearZoneHighlightAndPopup();
        setSelectedVolunteer(null);
        setSelectedVillage(null);
        setInspectedPoint(null);
        setSelectedShelter(camp);
      };
      const m = new maplibregl.Marker({ element: btn })
        .setLngLat([camp.lng, camp.lat])
        .addTo(map);
      shelterMarkersRef.current.push(m);
    });
  }, [reliefCamps, showShelters]);

  // 4. Volunteers Markers (Authorised roles + optedInLocationSharing === true)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    volunteerMarkersRef.current.forEach((m) => m.remove());
    volunteerMarkersRef.current = [];

    if (visibleVolunteers.length === 0) return;

    visibleVolunteers.forEach((vol) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow border border-white flex items-center gap-1 cursor-pointer';
      btn.style.backgroundColor =
        vol.status === 'Available'
          ? '#0B8F80'
          : vol.status === 'Busy'
            ? '#CA8A04'
            : '#475569';
      btn.innerHTML = `<span>✚</span><span>${vol.name.split(' ')[0]}</span>`;
      btn.title = `Volunteer: ${vol.name} (${vol.status})`;
      btn.onclick = (ev) => {
        ev.stopPropagation();
        setSelectedZone(null);
        clearZoneHighlightAndPopup();
        setSelectedShelter(null);
        setSelectedVillage(null);
        setInspectedPoint(null);
        setSelectedVolunteer(vol);
      };
      const m = new maplibregl.Marker({ element: btn })
        .setLngLat([vol.lng, vol.lat])
        .addTo(map);
      volunteerMarkersRef.current.push(m);
    });
  }, [visibleVolunteers]);

  // 4B. Active Field Incidents Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    incidentMarkersRef.current.forEach((m) => m.remove());
    incidentMarkersRef.current = [];

    if (!showIncidents || incidents.length === 0) return;

    incidents.forEach((inc) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'px-2 py-0.5 rounded-[6px] text-[10px] font-bold text-white shadow border border-white flex items-center gap-1 cursor-pointer hover:scale-105 transition-transform';
      btn.style.backgroundColor =
        inc.status === 'Resolved'
          ? '#15803D'
          : inc.severity === 'Critical'
            ? '#DC2626'
            : '#EA580C';
      btn.innerHTML = `<span>🔥</span><span>${inc.code}: ${inc.villageName}</span>`;
      btn.title = `${inc.code} — ${inc.title} (${inc.status})`;
      btn.onclick = (ev) => {
        ev.stopPropagation();
        flyToAndInspect(`${inc.code}: ${inc.title}`, inc.lat, inc.lng, 14.2);
      };
      const m = new maplibregl.Marker({ element: btn })
        .setLngLat([inc.lng, inc.lat])
        .addTo(map);
      incidentMarkersRef.current.push(m);
    });
  }, [incidents, showIncidents]);

  // 5. Inspected / Searched Location Pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!inspectedPoint) {
      if (inspectedMarkerRef.current) {
        inspectedMarkerRef.current.remove();
        inspectedMarkerRef.current = null;
      }
      return;
    }

    if (!inspectedMarkerRef.current) {
      const pinEl = document.createElement('div');
      pinEl.className =
        'px-2 py-1 rounded bg-[#0B1F33] text-white text-[10px] font-mono font-bold border-2 border-[#14B8A6] shadow-lg';
      pinEl.innerHTML = `📍 ${inspectedPoint.label.slice(0, 28)}`;
      const m = new maplibregl.Marker({ element: pinEl })
        .setLngLat([inspectedPoint.lng, inspectedPoint.lat])
        .addTo(map);
      inspectedMarkerRef.current = m;
    } else {
      inspectedMarkerRef.current.setLngLat([inspectedPoint.lng, inspectedPoint.lat]);
      const pinEl = inspectedMarkerRef.current.getElement();
      pinEl.innerHTML = `📍 ${inspectedPoint.label.slice(0, 28)}`;
    }
  }, [inspectedPoint]);

  // Sync Dedicated Focused Habitation / Village Pin

  // Sync Dedicated Focused Habitation / Village Pin (Lightweight, zero-rebuild on 370 background markers)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!selectedVillage) {
      if (selectedVillageMarkerRef.current) {
        selectedVillageMarkerRef.current.remove();
        selectedVillageMarkerRef.current = null;
      }
      return;
    }

    const meta = getVillageZoneMeta(selectedVillage);
    if (!selectedVillageMarkerRef.current) {
      const pinEl = document.createElement('div');
      pinEl.className = 'cursor-pointer select-none flex flex-col items-center group transition-transform hover:scale-110 z-30';
      pinEl.innerHTML = `
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs shadow-2xl border-2 border-white ring-2 ring-black/30 backdrop-blur-xs" style="background-color: ${meta.colorHex};">
          <span class="w-2 h-2 rounded-full bg-white"></span>
          <span>📍 ${selectedVillage.name}</span>
          <span class="px-1.5 py-0.5 rounded-sm bg-black/25 font-mono text-[10px] font-bold">${meta.score100}/100</span>
        </div>
        <div class="w-3.5 h-3.5 rotate-45 -mt-2 border-r-2 border-b-2 border-white shadow-md" style="background-color: ${meta.colorHex};"></div>
      `;
      pinEl.title = `${selectedVillage.name} (${selectedVillage.taluka}) · ${meta.zoneName} · Risk Score: ${meta.score100}/100`;
      pinEl.onclick = (ev) => {
        ev.stopPropagation();
        handleSelectVillageFromList(selectedVillage);
      };
      selectedVillageMarkerRef.current = new maplibregl.Marker({ element: pinEl, anchor: 'bottom' })
        .setLngLat([selectedVillage.lng, selectedVillage.lat])
        .addTo(map);
    } else {
      selectedVillageMarkerRef.current.setLngLat([selectedVillage.lng, selectedVillage.lat]);
      const pinEl = selectedVillageMarkerRef.current.getElement();
      pinEl.innerHTML = `
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white font-bold text-xs shadow-2xl border-2 border-white ring-2 ring-black/30 backdrop-blur-xs" style="background-color: ${meta.colorHex};">
          <span class="w-2 h-2 rounded-full bg-white"></span>
          <span>📍 ${selectedVillage.name}</span>
          <span class="px-1.5 py-0.5 rounded-sm bg-black/25 font-mono text-[10px] font-bold">${meta.score100}/100</span>
        </div>
        <div class="w-3.5 h-3.5 rotate-45 -mt-2 border-r-2 border-b-2 border-white shadow-md" style="background-color: ${meta.colorHex};"></div>
      `;
      pinEl.title = `${selectedVillage.name} (${selectedVillage.taluka}) · ${meta.zoneName} · Risk Score: ${meta.score100}/100`;
    }
  }, [selectedVillage]);

  // Adjust alert zone polygon opacity dynamically from Advanced GIS slider
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer('active-alert-zones-fill')) {
      map.setPaintProperty(
        'active-alert-zones-fill',
        'fill-opacity',
        Math.max(0.08, Math.min(0.85, layerOpacityPct / 100))
      );
    }
  }, [layerOpacityPct]);

  // Auto-center map to live location once on initial fix
  useEffect(() => {
    if (!mapRef.current || hasAutoCenteredRef.current) return;
    if (gps.lat && gps.lng && (gps.lat !== 18.9265 || gps.lng !== 73.2361)) {
      hasAutoCenteredRef.current = true;
      mapRef.current.flyTo({
        center: [gps.lng, gps.lat],
        zoom: 14.5,
        duration: 900,
      });
    }
  }, [gps.lat, gps.lng]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    hasAutoCenteredRef.current = true;
    addToast({
      title: 'Acquiring Live GPS Location...',
      message: 'Acquiring real live location coordinates and address in words...',
      type: 'info',
    });
    try {
      const res = await locateUserAccurately();
      if (res && res.ok) {
        setIsLiveTracking(true);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [res.lng, res.lat],
            zoom: 16.0,
            duration: 750,
            essential: true,
          });
        }
        addToast({
          title: '🎯 Live Location Locked',
          message: `${res.shortAddressInWords || res.addressInWords || 'Detected'} (${res.lat.toFixed(5)}°N, ${res.lng.toFixed(5)}°E · ±${Math.round(res.accuracy)}m)`,
          type: 'success',
        });
      } else if (mapRef.current) {
        mapRef.current.flyTo({
          center: [gps.lng, gps.lat],
          zoom: 15.5,
          duration: 700,
        });
      }
    } catch (err) {
      console.warn('Geolocation acquisition warning:', err);
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [gps.lng, gps.lat],
          zoom: 15.0,
          duration: 600,
        });
      }
    } finally {
      setIsLocating(false);
    }
  };

  const flyToAndInspect = (label: string, lat: number, lng: number, zoom = 14) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom, duration: 650 });
    }
    setInspectedPoint({
      lat,
      lng,
      label,
      elevationM: null,
      rainfall24hMm: null,
      temperatureC: null,
    });
    void Promise.all([fetchPointElevation(lat, lng), fetchLiveWeather(lat, lng)]).then(
      ([elev, weather]) => {
        setInspectedPoint((prev) =>
          prev && prev.lat === lat && prev.lng === lng
            ? {
              ...prev,
              elevationM: elev,
              rainfall24hMm: weather.rainfall24hMm,
              temperatureC: weather.temperatureC,
            }
            : prev
        );
      }
    );
  };

  const currentDistrictData = useMemo(() => {
    return (
      MAHARASHTRA_DISTRICTS_DATA.find((d) => d.name === selectedMhDistrict) ||
      MAHARASHTRA_DISTRICTS_DATA[0]
    );
  }, [selectedMhDistrict]);

  const currentTalukaData = useMemo(() => {
    if (!selectedMhTaluka || !currentDistrictData) return null;
    return currentDistrictData.talukas.find((t) => t.name === selectedMhTaluka) || null;
  }, [selectedMhTaluka, currentDistrictData]);

  const handleSelectMhDistrict = (districtName: string) => {
    setSelectedMhDistrict(districtName);
    setSelectedMhTaluka('');
    setSelectedMhVillage('');
    const d = MAHARASHTRA_DISTRICTS_DATA.find((item) => item.name === districtName);
    if (d) {
      flyToAndInspect(`${d.name} - District Center`, d.lat, d.lng, d.zoom);
      useAppStore.getState().showSingleToast({
        title: `📍 ${d.name}`,
        message: `District Center mapped on GIS view · ${d.talukas.length} Talukas available`,
        type: 'info',
      });
    }
  };

  const handleSelectMhTaluka = (talukaName: string) => {
    setSelectedMhTaluka(talukaName);
    setSelectedMhVillage('');
    if (!talukaName || !currentDistrictData) return;
    const t = currentDistrictData.talukas.find((item) => item.name === talukaName);
    if (t) {
      flyToAndInspect(`${t.name} - ${currentDistrictData.name} Taluka`, t.lat, t.lng, t.zoom || 13.5);
      useAppStore.getState().showSingleToast({
        title: `📍 ${t.name} Taluka`,
        message: `${currentDistrictData.name} District · ${t.villages.length} Monitored Gaons/Villages`,
        type: 'info',
      });
    }
  };

  const handleSelectMhVillage = (villageName: string) => {
    setSelectedMhVillage(villageName);
    if (!villageName) return;

    // Check if it exists in the main store villages
    const matchedStoreVillage = villages.find(
      (v) =>
        v.name.toLowerCase() === villageName.toLowerCase() ||
        v.nameMr?.toLowerCase() === villageName.toLowerCase()
    );
    if (matchedStoreVillage) {
      handleSelectVillageFromList(matchedStoreVillage);
      return;
    }

    // Check in current taluka or all districts
    const vilInTaluka = currentTalukaData?.villages.find((v) => v.name === villageName);
    if (vilInTaluka) {
      flyToAndInspect(
        `${vilInTaluka.name} · ${currentTalukaData?.name}, ${currentDistrictData?.name}`,
        vilInTaluka.lat,
        vilInTaluka.lng,
        15.2
      );
      useAppStore.getState().showSingleToast({
        title: `📍 ${vilInTaluka.name}`,
        message: `${currentTalukaData?.name} Taluka · ${vilInTaluka.hazardType || 'Gaon Mapped on GIS'}`,
        type: 'info',
      });
      return;
    }

    // Fallback across all places
    const foundPlace = ALL_MAHARASHTRA_PLACES.find((p) => p.name.includes(villageName));
    if (foundPlace) {
      flyToAndInspect(`${foundPlace.name} (${foundPlace.district})`, foundPlace.lat, foundPlace.lng, 15.2);
    }
  };

  // Universal Search: Local Habitations, Shelters, Alert Zones, Regional Towns + Live OpenStreetMap Nominatim India-Wide Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    setIsSearching(true);
    const matches: {
      label: string;
      subLabel?: string;
      category: string;
      colorHex?: string;
      lat: number;
      lng: number;
      zoom?: number;
      village?: Village;
    }[] = [];

    // 1. Check all Habitations / Villages
    const matchingVillages: Village[] = [];
    villages.forEach((v) => {
      if (
        v.name.toLowerCase().includes(q) ||
        v.nameHi?.toLowerCase().includes(q) ||
        v.nameMr?.toLowerCase().includes(q) ||
        v.taluka.toLowerCase().includes(q) ||
        v.district.toLowerCase().includes(q) ||
        v.primaryHazard?.toLowerCase().includes(q)
      ) {
        matchingVillages.push(v);
        const meta = getVillageZoneMeta(v);
        matches.push({
          label: `${v.name} (${v.taluka}, ${v.district})`,
          subLabel: `${meta.zoneName} · Risk Score: ${meta.score100}/100`,
          category: 'Habitation / Village',
          colorHex: meta.colorHex,
          lat: v.lat,
          lng: v.lng,
          zoom: 15.2,
          village: v,
        });
      }
    });

    // 2. Check All Maharashtra Districts, Talukas & Villages/Gaons
    ALL_MAHARASHTRA_PLACES.forEach((pl) => {
      if (
        pl.name.toLowerCase().includes(q) ||
        pl.nameMr?.toLowerCase().includes(q) ||
        pl.district.toLowerCase().includes(q) ||
        (pl.taluka && pl.taluka.toLowerCase().includes(q))
      ) {
        matches.push({
          label: `${pl.name} (${pl.district})`,
          category: pl.category,
          lat: pl.lat,
          lng: pl.lng,
          zoom: pl.zoom,
        });
      }
    });

    // 3. Check Reference Cities, District HQs, Talukas & Towns
    INDIA_AND_REGIONAL_PLACES.forEach((pl) => {
      if (
        pl.name.toLowerCase().includes(q) ||
        pl.district.toLowerCase().includes(q)
      ) {
        matches.push({
          label: `${pl.name} (${pl.district})`,
          category: pl.category,
          lat: pl.lat,
          lng: pl.lng,
          zoom: pl.zoom,
        });
      }
    });

    // 3. Check Shelters & Alert Zones
    reliefCamps.forEach((c) => {
      if (c.name.toLowerCase().includes(q) || c.district.toLowerCase().includes(q)) {
        matches.push({
          label: `${c.name} (${c.district})`,
          category: 'Relief Shelter',
          lat: c.lat,
          lng: c.lng,
          zoom: 14.5,
        });
      }
    });

    activeAlertZones.forEach((z) => {
      if (z.areaName.toLowerCase().includes(q) || z.district.toLowerCase().includes(q)) {
        matches.push({
          label: `${z.areaName} (${z.level} Zone)`,
          category: 'Active Alert Zone',
          lat: z.centerLat,
          lng: z.centerLng,
          zoom: 13,
        });
      }
    });

    // 4. Always query OpenStreetMap Nominatim so ANY small village, street, pin code, or landmark in India is found
    const nom = await searchNominatim(searchQuery);
    nom.forEach((item) => {
      matches.push({
        label: item.displayName,
        category: 'OpenStreetMap Gazetteer',
        lat: item.lat,
        lng: item.lng,
        zoom: 14.5,
      });
    });

    setIsSearching(false);
    setSearchResults(matches);

    // Show on the map!
    if (matchingVillages.length === 1) {
      handleSelectVillageFromList(matchingVillages[0]);
    } else if (matchingVillages.length > 1 && mapRef.current) {
      const bounds = new maplibregl.LngLatBounds();
      matchingVillages.forEach((v) => bounds.extend([v.lng, v.lat]));
      mapRef.current.fitBounds(bounds, { padding: 80, maxZoom: 15.0 });
      addToast({
        title: `🔍 Found ${matchingVillages.length} Villages`,
        message: `All ${matchingVillages.length} matching villages are now displayed on the map with their zone colors. Click any village marker to inspect.`,
        type: 'info',
      });
    } else if (matches[0]) {
      if (matches[0].village) {
        handleSelectVillageFromList(matches[0].village);
      } else {
        flyToAndInspect(
          matches[0].label,
          matches[0].lat,
          matches[0].lng,
          matches[0].zoom || 14
        );
      }
    }
  };

  // Get OSRM Directions from User GPS to any Shelter or Habitation
  const handleGetDirectionsToCoords = async (
    targetName: string,
    targetLat: number,
    targetLng: number
  ) => {
    const res = await fetchEvacuationRoute(gps.lat, gps.lng, targetLat, targetLng);
    setRouteInfo({
      shelterName: targetName,
      distanceKm: res.distanceKm,
      durationMin: res.durationMinutes,
      isFallback: res.source === 'direct-corridor',
      coords: res.coordinates.map(([lat, lng]) => [lng, lat]),
    });
    if (mapRef.current) {
      mapRef.current.fitBounds(
        [
          [Math.min(gps.lng, targetLng) - 0.02, Math.min(gps.lat, targetLat) - 0.02],
          [Math.max(gps.lng, targetLng) + 0.02, Math.max(gps.lat, targetLat) + 0.02],
        ],
        { padding: 55, duration: 600 }
      );
    }
  };

  const handleGetDirections = async (camp: ReliefCamp) => {
    await handleGetDirectionsToCoords(camp.name, camp.lat, camp.lng);
  };

  // Section 3.4 & Acceptance Test #9: Evacuation route from any Alert Zone to the nearest available shelter using OSRM
  const handleEvacuateZoneToNearestShelter = async (zone: ActiveAlertZone) => {
    const availableCamps = reliefCamps.filter((c) => c.currentOccupancy < c.capacityPersons);
    if (availableCamps.length === 0) return;

    const sorted = availableCamps
      .map((camp) => ({
        camp,
        dist: haversineKm(zone.centerLat, zone.centerLng, camp.lat, camp.lng),
      }))
      .sort((a, b) => a.dist - b.dist);

    const best = sorted[0]?.camp;
    if (!best) return;

    const res = await fetchEvacuationRoute(
      zone.centerLat,
      zone.centerLng,
      best.lat,
      best.lng
    );
    setRouteInfo({
      shelterName: `${zone.areaName.split(',')[0]} → ${best.name}`,
      distanceKm: res.distanceKm,
      durationMin: res.durationMinutes,
      isFallback: res.source === 'direct-corridor',
      coords: res.coordinates.map(([lat, lng]) => [lng, lat]),
    });

    if (mapRef.current) {
      mapRef.current.fitBounds(
        [
          [
            Math.min(zone.centerLng, best.lng) - 0.03,
            Math.min(zone.centerLat, best.lat) - 0.03,
          ],
          [
            Math.max(zone.centerLng, best.lng) + 0.03,
            Math.max(zone.centerLat, best.lat) + 0.03,
          ],
        ],
        { padding: 60, duration: 650 }
      );
    }

    addToast({
      title: `Evacuation Route Computed (${res.distanceKm} km)`,
      message: `OSRM route from ${zone.areaName} (${zone.level} Zone) to ${best.name} (~${res.durationMinutes} min).`,
      type: 'success',
    });
  };

  const clearZoneHighlightAndPopup = () => {
    if (zonePopupRef.current) {
      zonePopupRef.current.remove();
      zonePopupRef.current = null;
    }
    if (zoneHighlightMarkerRef.current) {
      zoneHighlightMarkerRef.current.remove();
      zoneHighlightMarkerRef.current = null;
    }
  };

  /**
   * Automatically flies the map camera to the clicked Geospatial Zone
   * and displays a single clean notification banner with its Risk Score.
   */
  const detectAndFocusZone = (zone: ActiveAlertZone) => {
    if (alertFilterLevel !== 'ALL' && alertFilterLevel !== zone.level) {
      setAlertFilterLevel(zone.level);
    }
    clearZoneHighlightAndPopup();
    setSelectedShelter(null);
    setSelectedVolunteer(null);
    setSelectedVillage(null);
    setInspectedPoint(null);
    setSelectedZone(zone);

    // 1. Smoothly fly map camera directly to exact zone coordinates
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [zone.centerLng, zone.centerLat],
        zoom: 12.8,
        duration: 750,
        essential: true,
      });
    }

    // 2. Single clean notification feedback (no cluttered popups or stacked messages)
    const rawScore =
      (zone as any).risk_score ??
      (zone.level === 'Red' ? 88.5 : zone.level === 'Yellow' ? 68.0 : zone.level === 'Orange' ? 48.0 : 18.0);
    const score = Number(rawScore).toFixed(1);
    const shortName = zone.areaName.split(',')[0];

    useAppStore.getState().showSingleToast({
      title: `🎯 ${zone.level.toUpperCase()} ZONE: ${shortName}`,
      message: `Risk Score: ${score}/100 · ${zone.district} District`,
      type: zone.level === 'Red' ? 'critical' : zone.level === 'Yellow' ? 'warning' : 'info',
    });
  };

  detectAndFocusZoneRef.current = detectAndFocusZone;

  /**
   * Handles user clicking one of the 4-Tier Alert Status buttons (or All Tiers).
   * Automatically focuses and detects the corresponding zone(s) on the map.
   */
  const handleSelectTier = (tier: 'ALL' | AlertZoneLevel) => {
    if (tier === 'ALL') {
      setAlertFilterLevel('ALL');
      setSelectedZone(null);
      clearZoneHighlightAndPopup();

      if (mapRef.current && activeAlertZones.length > 0) {
        let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;
        activeAlertZones.forEach((z) => {
          if (z.centerLng < minLng) minLng = z.centerLng;
          if (z.centerLng > maxLng) maxLng = z.centerLng;
          if (z.centerLat < minLat) minLat = z.centerLat;
          if (z.centerLat > maxLat) maxLat = z.centerLat;
        });
        mapRef.current.fitBounds(
          [
            [minLng - 0.2, minLat - 0.2],
            [maxLng + 0.2, maxLat + 0.2],
          ],
          { padding: 50, duration: 750 }
        );
      }
      useAppStore.getState().showSingleToast({
        title: 'All Alert Tiers Active',
        message: 'Displaying all active disaster & warning zones across Maharashtra',
        type: 'info',
      });
      return;
    }

    setAlertFilterLevel(tier);
    const matching = activeAlertZones.filter((z) => z.level === tier);
    if (matching.length === 0) {
      useAppStore.getState().showSingleToast({
        title: `${tier} Alert`,
        message: `No active zones currently in ${tier} status.`,
        type: 'info',
      });
      return;
    }

    // If currently selected zone belongs to this tier, cycle to the next zone in this tier
    let targetZone = matching[0];
    if (selectedZone && selectedZone.level === tier) {
      const idx = matching.findIndex((z) => z.id === selectedZone.id);
      if (idx !== -1 && idx + 1 < matching.length) {
        targetZone = matching[idx + 1];
      } else {
        targetZone = matching[0];
      }
    }

    detectAndFocusZone(targetZone);
  };

  // Confirm & Publish Alert Zone
  const handleConfirmPublishZone = () => {
    const existing = activeAlertZones.find((z) => z.id === editingZoneId);
    const centerLat = existing
      ? existing.centerLat
      : inspectedPoint
        ? inspectedPoint.lat
        : gps.lat;
    const centerLng = existing
      ? existing.centerLng
      : inspectedPoint
        ? inspectedPoint.lng
        : gps.lng;
    const polygon: [number, number][] = existing
      ? existing.polygon
      : [
        [centerLng - 0.04, centerLat - 0.03],
        [centerLng + 0.04, centerLat - 0.03],
        [centerLng + 0.04, centerLat + 0.03],
        [centerLng - 0.04, centerLat + 0.03],
        [centerLng - 0.04, centerLat - 0.03],
      ];

    upsertActiveAlertZone({
      id: editingZoneId || undefined,
      level: zoneLevel,
      disasterType: zoneDisasterType,
      areaName: zoneAreaName,
      district: zoneDistrict,
      expiresAt: zoneExpiresAt,
      instructions: zoneInstructions,
      messageEn: zoneMessageEn,
      messageHi: zoneMessageHi,
      severity: zoneSeverity,
      urgency: zoneUrgency,
      polygon,
      centerLat,
      centerLng,
    });

    setConfirmZoneDialogOpen(false);
    setIssueFormOpen(false);
  };

  const measuredDistanceKm = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      const p1 = measurePoints[i - 1];
      const p2 = measurePoints[i];
      if (p1 && p2) {
        total += haversineKm(p1[1], p1[0], p2[1], p2[0]);
      }
    }
    return Number(total.toFixed(2));
  }, [measurePoints]);

  // Summary counts for Red / Orange / Yellow / Green Alert Zones & Villages
  const alertLevelSummary = useMemo(() => {
    const counts: Record<AlertZoneLevel, { zones: number; villages: number }> = {
      Red: { zones: 0, villages: 0 },
      Orange: { zones: 0, villages: 0 },
      Yellow: { zones: 0, villages: 0 },
      Green: { zones: 0, villages: 0 },
    };
    activeAlertZones.forEach((z) => {
      counts[z.level].zones += 1;
    });
    villages.forEach((v) => {
      const score = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
      const rLevel = classifyHazard(score);
      const mapped: AlertZoneLevel =
        rLevel === 'Immediate'
          ? 'Red'
          : rLevel === 'Short-term'
            ? 'Orange'
            : rLevel === 'Medium-term'
              ? 'Yellow'
              : 'Green';
      counts[mapped].villages += 1;
    });
    return counts;
  }, [activeAlertZones, villages, weights]);

  const filteredVillagesForDirectory = useMemo(() => {
    return villages.filter((v) => {
      const meta = getVillageZoneMeta(v);
      if (alertFilterLevel !== 'ALL' && meta.tier !== alertFilterLevel) {
        return false;
      }
      if (villageSearchTerm.trim()) {
        const q = villageSearchTerm.trim().toLowerCase();
        const matchName = v.name.toLowerCase().includes(q);
        const matchHi = v.nameHi?.toLowerCase().includes(q);
        const matchMr = v.nameMr?.toLowerCase().includes(q);
        const matchTaluka = v.taluka?.toLowerCase().includes(q);
        const matchDist = v.district?.toLowerCase().includes(q);
        const matchHazard = v.primaryHazard?.toLowerCase().includes(q);
        const matchZone = meta.zoneName.toLowerCase().includes(q) || meta.tier.toLowerCase() === q;
        if (!(matchName || matchHi || matchMr || matchTaluka || matchDist || matchHazard || matchZone)) {
          return false;
        }
      }
      return true;
    });
  }, [villages, weights, alertFilterLevel, villageSearchTerm]);

  const handleReturnToLiveLocation = () => {
    setSelectedVillage(null);
    if (villagePopupRef.current) {
      villagePopupRef.current.remove();
      villagePopupRef.current = null;
    }
    setIsLiveTracking(true);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [gps.lng, gps.lat],
        zoom: 16.0,
        duration: 750,
        essential: true,
      });
    }
    useAppStore.getState().showSingleToast({
      title: '🎯 Live GPS Restored',
      message: 'Map is now tracking your live device GPS location.',
      type: 'info',
    });
  };

  const handleSelectVillageFromList = (v: Village) => {
    // 1. Lock map to village and freeze background GPS auto-centering
    setIsLiveTracking(false);
    setSelectedZone(null);
    clearZoneHighlightAndPopup();
    setSelectedShelter(null);
    setSelectedVolunteer(null);
    setInspectedPoint(null);
    setSelectedVillage(v);

    const meta = getVillageZoneMeta(v);

    // 2. Smoothly fly and anchor on village coordinates
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const distKm = haversineKm(center.lat, center.lng, v.lat, v.lng);
      // Adaptive cinematic flight: pull back camera for long distances, glide directly for nearby hops
      const flightZoom = distKm > 20 ? 13.5 : distKm > 5 ? 13.8 : Math.max(mapRef.current.getZoom(), 14.0);
      const flightSpeed = distKm > 30 ? 1.3 : 1.1;

      mapRef.current.flyTo({
        center: [v.lng, v.lat],
        zoom: flightZoom,
        speed: flightSpeed,
        curve: 1.42,
        essential: true,
      });

      // 3. Clear existing popup & mount prominent on-map popup card
      if (villagePopupRef.current) {
        villagePopupRef.current.remove();
        villagePopupRef.current = null;
      }

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 8px; min-width: 250px; max-width: 310px; color: #0F172A;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <span style="font-weight: 800; font-size: 14px; color: ${meta.colorHex};">📍 ${v.name}</span>
            <span style="background: ${meta.colorHex}; color: #FFFFFF; font-size: 9.5px; font-weight: 800; padding: 2px 7px; border-radius: 9999px;">${meta.zoneName}</span>
          </div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">${v.taluka} Taluka · ${v.district} District</div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 7px; margin-bottom: 8px; font-size: 11px;">
            <div>
              <span style="color: #64748B; font-size: 9px; display: block; text-transform: uppercase;">🌧️ Yearly Rain</span>
              <strong style="color: #0F766E;">${v.annualRainfallMm ?? 3200} mm/yr</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 9px; display: block; text-transform: uppercase;">🌊 River Distance</span>
              <strong style="color: #0284C7;">${Number(v.riverDistKm ?? 1.2) < 1 ? Math.round(Number(v.riverDistKm ?? 1.2) * 1000) + ' m' : Number(v.riverDistKm ?? 1.2).toFixed(2) + ' km'}</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 9px; display: block; text-transform: uppercase;">🛖 Mud Houses</span>
              <strong style="color: #D97706;">${v.vulnerabilityFactors?.kutchaHousePct ?? 65}% homes</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 9px; display: block; text-transform: uppercase;">👵 Elderly People</span>
              <strong style="color: #7C3AED;">${v.vulnerabilityFactors?.elderlyPct ?? 14}% people</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 9px; display: block; text-transform: uppercase;">⛰️ Hill Slope</span>
              <strong>${v.slopeDeg}° (${v.elevationM}m)</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 9px; display: block; text-transform: uppercase;">👥 Population</span>
              <strong>${v.population.toLocaleString()} (${v.households} HH)</strong>
            </div>
          </div>

          <div style="font-size: 10px; background: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
            <span>🔒</span><span>Pin Locked (Stays until Live GPS clicked)</span>
          </div>

          <div style="margin-bottom: 6px;">
            <button id="btn-village-forecast" style="width: 100%; background: #0F766E; color: #FFFFFF; font-size: 11px; font-weight: 800; padding: 7px 10px; border-radius: 7px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <span>⚡ AI 7-Day Weather & Disaster Forecast</span>
            </button>
          </div>

          <div style="display: flex; gap: 6px;">
            <button id="btn-village-shelter-dir" style="flex: 1; background: #008060; color: #FFFFFF; font-size: 10.5px; font-weight: 700; padding: 6px 8px; border-radius: 6px; border: none; cursor: pointer;">
              ⛺ Shelter Route
            </button>
            <button id="btn-village-live-return" style="flex: 1; background: #0B1F33; color: #FFFFFF; font-size: 10.5px; font-weight: 700; padding: 6px 8px; border-radius: 6px; border: none; cursor: pointer;">
              🎯 Live GPS
            </button>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 24,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '310px',
      })
        .setLngLat([v.lng, v.lat])
        .setHTML(popupHtml)
        .addTo(mapRef.current);

      popup.on('close', () => {
        setSelectedVillage(null);
        villagePopupRef.current = null;
      });

      setTimeout(() => {
        const forecastBtn = document.getElementById('btn-village-forecast');
        if (forecastBtn) {
          forecastBtn.onclick = () => {
            setForecastModalVillage(v);
            setIsAiForecastModalOpen(true);
          };
        }
        const shelterBtn = document.getElementById('btn-village-shelter-dir');
        if (shelterBtn) {
          shelterBtn.onclick = () => {
            void handleGetDirectionsToCoords(`${v.name} (${v.district})`, v.lat, v.lng);
          };
        }
        const liveGpsBtn = document.getElementById('btn-village-live-return');
        if (liveGpsBtn) {
          liveGpsBtn.onclick = () => {
            handleReturnToLiveLocation();
          };
        }
      }, 50);

      villagePopupRef.current = popup;
    }

    // Open detailed contextual SlidePanel with village & zone breakdown
    openSidePanel(
      'village',
      { ...v, ...meta },
      `${v.name} · ${meta.zoneName} (${meta.score100}/100)`
    );

    // Scroll to map gently only if not already in view
    const mapEl = mapContainerRef.current;
    if (mapEl) {
      const rect = mapEl.getBoundingClientRect();
      const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!isInView && (rect.top < -120 || rect.top > window.innerHeight * 0.7)) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    useAppStore.getState().showSingleToast({
      title: `📍 ${v.name} (${v.taluka}, ${v.district})`,
      message: `${meta.zoneName} · Risk Score: ${meta.score100}/100. Pin locked on map until Live GPS is clicked.`,
      type: 'info',
    });
  };

  // Respond to global village selection (from Command Palette or External Navigation)
  useEffect(() => {
    if (!selectedVillageId || villages.length === 0) return;
    const found = villages.find((v) => v.id === selectedVillageId);
    if (found) {
      handleSelectVillageFromList(found);
      setSelectedVillageId(null);
    }
  }, [selectedVillageId, villages]);

  // Bidirectional Integration: Handle "View on Live GIS" from India Disaster History Tab
  useEffect(() => {
    const incId = searchParams.get('incidentId');
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const title = searchParams.get('title');
    const severity = searchParams.get('severity') || undefined;

    if (incId && latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        const fullTitle = title ? decodeURIComponent(title) : incId;
        setDisasterHistoryHighlight({
          id: incId,
          title: fullTitle,
          lat,
          lng,
          severity,
        });

        const timer = setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [lng, lat],
              zoom: 13.5,
              duration: 1400,
              essential: true,
            });

            addToast({
              title: `📍 National Incident Focus: ${incId}`,
              message: `${fullTitle} · Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
              type: 'info',
            });
          }
        }, 600);

        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  // Bidirectional Integration: Handle "Inspect on GIS Map" from 3 AI Climate Modules
  useEffect(() => {
    const vId = searchParams.get('villageId');
    const climateModule = searchParams.get('climateModule');
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const anomalyId = searchParams.get('anomalyId');
    const category = searchParams.get('category');

    if (vId) {
      const found = villages.find((v) => v.id === vId || v.name.toLowerCase() === vId.toLowerCase());
      if (found) {
        handleSelectVillageFromList(found);

        if (climateModule === 'vulnerability') {
          addToast({
            title: `📍 GIS Climate Vulnerability Focus: ${found.name}`,
            message: `Cadastral boundary activated for ${found.name}, ${found.district}. Evaluated under IPCC AR6 framework.`,
            type: 'info',
          });
        } else if (climateModule === 'impact') {
          addToast({
            title: `📍 GIS Climate Impact Prediction: ${found.name}`,
            message: `Visualizing predicted hazard envelope (${category || 'Multi-Hazard Risk'}) across ${found.name}.`,
            type: 'warning',
          });
        } else if (climateModule === 'anomaly') {
          addToast({
            title: `📍 GIS Climate Anomaly Identified: ${found.name}`,
            message: `Anomaly ID: ${anomalyId || 'Detected'}. 30-year IMD statistical baseline deviation active.`,
            type: 'critical',
          });
        }
      } else if (latStr && lngStr) {
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng) && mapRef.current) {
          mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 14.0,
            duration: 1200,
            essential: true,
          });
        }
      }
    }
  }, [searchParams, villages]);

  // GIS Spatial Buffer Query Analysis around active point (selectedVillage || inspectedPoint || gps)
  const spatialBufferAnalysis = useMemo(() => {
    const centerLat = selectedVillage
      ? selectedVillage.lat
      : inspectedPoint
        ? inspectedPoint.lat
        : gps.lat;
    const centerLng = selectedVillage
      ? selectedVillage.lng
      : inspectedPoint
        ? inspectedPoint.lng
        : gps.lng;
    const centerLabel = selectedVillage
      ? `${selectedVillage.name} (${selectedVillage.district})`
      : inspectedPoint
        ? inspectedPoint.label
        : 'My GPS Position';

    const villagesInRing = villages.filter(
      (v) => haversineKm(centerLat, centerLng, v.lat, v.lng) <= spatialBufferRadiusKm
    );
    const populationInRing = villagesInRing.reduce((acc, v) => acc + v.population, 0);
    const householdsInRing = villagesInRing.reduce((acc, v) => acc + v.households, 0);
    const sheltersInRing = reliefCamps.filter(
      (c) => haversineKm(centerLat, centerLng, c.lat, c.lng) <= spatialBufferRadiusKm
    );
    const freeBedsInRing = sheltersInRing.reduce(
      (acc, c) => acc + Math.max(0, c.capacityPersons - c.currentOccupancy),
      0
    );

    return {
      centerLat,
      centerLng,
      centerLabel,
      villagesCount: villagesInRing.length,
      populationInRing,
      householdsInRing,
      sheltersCount: sheltersInRing.length,
      freeBedsInRing,
    };
  }, [
    selectedVillage,
    inspectedPoint,
    gps.lat,
    gps.lng,
    villages,
    reliefCamps,
    spatialBufferRadiusKm,
  ]);

  // Export RFC 7946 GeoJSON of all GIS layers (Alert Polygons, Habitations, Shelters, CWC Rivers, GSI Faults)
  const handleExportGisGeoJson = () => {
    const features: GeoJSON.Feature[] = [
      ...activeAlertZones.map((z) => ({
        type: 'Feature' as const,
        properties: {
          layer: 'NDMA_SACHET_Alert_Polygon',
          id: z.id,
          areaName: z.areaName,
          district: z.district,
          alertLevel: z.level,
          disasterType: z.disasterType,
          instructions: z.instructions,
          expiresAt: z.expiresAt,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [z.polygon],
        },
      })),
      ...villages.map((v) => {
        const hScore = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
        const rLevel = classifyHazard(hScore);
        const alertTier: AlertZoneLevel =
          rLevel === 'Immediate'
            ? 'Red'
            : rLevel === 'Short-term'
              ? 'Orange'
              : rLevel === 'Medium-term'
                ? 'Yellow'
                : 'Green';
        return {
          type: 'Feature' as const,
          properties: {
            layer: 'Monitored_Habitation',
            id: v.id,
            name: v.name,
            taluka: v.taluka,
            district: v.district,
            population: v.population,
            elevationM: v.elevationM,
            slopeDeg: v.slopeDeg,
            riskLevel: rLevel,
            imdAlertTier: alertTier,
            compositeScore: Number((hScore * 100).toFixed(1)),
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [v.lng, v.lat],
          },
        };
      }),
      ...CWC_RIVER_HYDROLOGY_LINES.map((rv, idx) => ({
        type: 'Feature' as const,
        properties: {
          layer: 'CWC_River_Hydrology',
          id: `cwc-river-${idx + 1}`,
          name: rv.name,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: rv.coords,
        },
      })),
      ...GSI_SCARP_AND_FAULT_LINES.map((fl, idx) => ({
        type: 'Feature' as const,
        properties: {
          layer: 'GSI_Fault_And_Landslide_Scarp',
          id: `gsi-fault-${idx + 1}`,
          name: fl.name,
          type: fl.type,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: fl.coords,
        },
      })),
    ];

    const geojson = {
      type: 'FeatureCollection',
      crs: {
        type: 'name',
        properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
      },
      generatedAt: new Date().toISOString(),
      features,
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nivaran-ndma-gis-layers-${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({
      title: 'GIS GeoJSON Exported (EPSG:4326)',
      message: `Exported ${features.length} multi-layer GIS features (Red/Orange/Yellow/Green polygons, villages, CWC rivers & GSI faults).`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-4">
      {/* BIDIRECTIONAL NATIONAL DISASTER HISTORY FOCUS BANNER */}
      {disasterHistoryHighlight && (
        <div className="neu-raised p-3.5 rounded-[14px] border-2 border-[#0B8F80] bg-[#0B8F80]/10 flex flex-wrap items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DC2626]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold bg-[var(--bg-sunken)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">
                  {disasterHistoryHighlight.id}
                </span>
                <span className="text-xs font-black text-[var(--text-primary)]">
                  National Disaster Incident: {disasterHistoryHighlight.title}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Centering Live GIS at Latitude {disasterHistoryHighlight.lat.toFixed(4)}°N, Longitude {disasterHistoryHighlight.lng.toFixed(4)}°E
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/disaster-history?incidentId=${disasterHistoryHighlight.id}`)}
              className="neu-btn-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow"
              title="Return to India Disaster History Tab"
            >
              <History className="w-3.5 h-3.5" />
              <span>← Return to India Disaster History</span>
            </button>
            <button
              type="button"
              onClick={() => setDisasterHistoryHighlight(null)}
              className="neu-btn p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="Dismiss Incident Highlight"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          COMMAND DECK: REAL-TIME TELEMETRY, SMART SEARCH & JUMP CONTROLS
          ===================================================================== */}
      <div className="neu-raised p-4 rounded-[14px] border border-[var(--border)] space-y-3.5 bg-white dark:bg-emerald-950/20 shadow-xs">
        {/* ROW 1: Real-time Live Location Telemetry Card & Primary Action Cluster */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          {/* Left: GPS Live Location & Telemetry Badge */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0 mt-1 sm:mt-0">
              <span className={`w-3.5 h-3.5 rounded-full ${gps.isManualPin ? 'bg-blue-500' : 'bg-[#059669]'} animate-ping absolute`} />
              <span className={`w-3 h-3 rounded-full ${gps.isManualPin ? 'bg-blue-600' : 'bg-[#059669]'} relative`} />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[#0F291E] dark:text-emerald-100 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#059669] shrink-0" strokeWidth={2.2} />
                  <span className="break-words">
                    {gps.addressInWords || gps.shortAddressInWords || 'District Emergency Operations Centre (DEOC), Collector Office, Pune, Maharashtra 411001'}
                  </span>
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold text-white shrink-0 shadow-2xs ${gps.qualityBadge === 'Good'
                      ? 'bg-[#059669]'
                      : gps.qualityBadge === 'Fair'
                        ? 'bg-[#CA8A04]'
                        : 'bg-[#B91C1C]'
                    }`}
                >
                  ±{Math.round(gps.accuracyMeters)}m · {gps.qualityBadge}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#E8F5E9] dark:bg-emerald-900/40 text-[#059669] dark:text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                  Fix: {gps.updatedAtIst} IST
                </span>
              </div>

              {/* Coordinates, DMS & Movement Stats */}
              <div className="text-[11px] font-mono text-[#355344] dark:text-emerald-400 flex flex-wrap items-center gap-2">
                <span className="font-semibold">{gps.lat.toFixed(5)}°N, {gps.lng.toFixed(5)}°E</span>
                <span className="opacity-50">·</span>
                <span>{formatLatLngToDms(gps.lat, gps.lng)}</span>
                {gps.speedMps !== null && gps.speedMps > 0.3 && (
                  <>
                    <span className="opacity-50">·</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                      🏃 {(gps.speedMps * 3.6).toFixed(1)} km/h
                    </span>
                  </>
                )}
                {gps.headingDeg !== null && gps.headingDeg > 0 && (
                  <>
                    <span className="opacity-50">·</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                      🧭 {gps.headingDeg}°
                    </span>
                  </>
                )}
                <span className="opacity-50">·</span>
                <span className="opacity-80 text-[10px]">({gps.sourceLabel})</span>
              </div>
            </div>
          </div>

          {/* Right: Primary Emergency Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Locate Me Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className={`px-3.5 py-2 text-xs font-bold rounded-[10px] bg-[#059669] hover:bg-[#047857] text-white flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md cursor-pointer shrink-0 ${isLocating ? 'opacity-80 cursor-wait' : ''
                }`}
              title="Detect and fly to your real live GPS coordinates and address in words"
            >
              <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : 'animate-pulse'}`} strokeWidth={2} />
              <span>
                {isLocating
                  ? 'Locating...'
                  : '🎯 Locate Live GPS'}
              </span>
            </button>

            {/* Live GPS Tracking (Follow Me) Mode Toggle */}
            <button
              type="button"
              onClick={handleReturnToLiveLocation}
              className={`px-3 py-2 text-xs font-bold rounded-[10px] border flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 ${isLiveTracking && !selectedVillage
                  ? 'bg-[#E8F5E9] border-[#A7F3D0] text-[#059669] hover:bg-[#D1FAE5]'
                  : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                }`}
              title={
                isLiveTracking && !selectedVillage
                  ? 'Continuous GPS auto-follow is active. Click to unlock map panning.'
                  : 'Click to center map on your live GPS position and release village lock.'
              }
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isLiveTracking && !selectedVillage ? 'bg-[#059669] animate-ping' : 'bg-amber-500'}`} />
              <span>
                {isLiveTracking && !selectedVillage
                  ? '🟢 Live Tracking: ON'
                  : '🎯 Follow Live GPS'}
              </span>
            </button>

            {/* Place Pin Manually */}
            <button
              type="button"
              onClick={() => setPlacingManualPin((v) => !v)}
              className={`neu-btn px-3 py-2 text-xs font-semibold flex items-center gap-1.5 ${placingManualPin ? 'bg-[#059669] text-white font-bold' : 'text-[#355344]'
                }`}
              title="Click anywhere on the map to inspect elevation, weather and nearest relief camp"
            >
              <Crosshair className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>
                {placingManualPin
                  ? 'Tap map to place pin...'
                  : 'Place pin manually'}
              </span>
            </button>

            {/* Officer Issue Alert Zone */}
            {canIssueAlerts && (
              <button
                type="button"
                onClick={() => {
                  setEditingZoneId('');
                  setIssueFormOpen((v) => !v);
                }}
                className="neu-btn px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 text-[#059669] shrink-0"
              >
                <Plus className="w-4 h-4" strokeWidth={1.75} />
                <span>'Issue Alert Zone'</span>
              </button>
            )}
          </div>
        </div>

        {/* ROW 2: Address Search, Rapid Habitation Jump, and Portal Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Direct Address / Locality Instant Search */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const q = quickSearchText.trim();
                if (!q) return;

                // Priority 1: Match local disaster-monitored villages directly!
                const localMatch = villages.find(
                  (v) =>
                    v.name.toLowerCase().includes(q.toLowerCase()) ||
                    v.nameHi?.toLowerCase().includes(q.toLowerCase()) ||
                    v.nameMr?.toLowerCase().includes(q.toLowerCase()) ||
                    v.taluka.toLowerCase().includes(q.toLowerCase())
                );
                if (localMatch) {
                  handleSelectVillageFromList(localMatch);
                  return;
                }

                setIsSearchingQuick(true);
                try {
                  const results = await searchNominatim(q);
                  if (results.length > 0) {
                    const top = results[0];
                    setManualPin(top.lat, top.lng);
                    if (mapRef.current) {
                      mapRef.current.flyTo({
                        center: [top.lng, top.lat],
                        zoom: 15.5,
                        duration: 900,
                      });
                    }
                    addToast({
                      title: 'Location Found',
                      message: `${top.displayName} (${top.lat.toFixed(5)}°N, ${top.lng.toFixed(5)}°E)`,
                      type: 'success',
                    });
                  } else {
                    addToast({
                      title: 'Not Found',
                      message: `No matching location found for "${q}". Try another locality or village.`,
                      type: 'warning',
                    });
                  }
                } finally {
                  setIsSearchingQuick(false);
                }
              }}
              className="flex items-center gap-1.5 bg-[#F4F9F5] dark:bg-emerald-950/40 border border-[#D1E7DD] dark:border-emerald-800 rounded-[10px] px-3 py-1.5 shadow-2xs hover:border-[#059669] transition-all flex-1 max-w-[340px]"
            >
              <Search className="w-4 h-4 text-[#059669] shrink-0" strokeWidth={2} />
              <input
                type="text"
                value={quickSearchText}
                onChange={(e) => setQuickSearchText(e.target.value)}
                placeholder="Search street / area / village..."
                className="text-xs bg-transparent border-none outline-none text-[#0F291E] dark:text-emerald-100 placeholder:text-gray-400 w-full"
              />
              {quickSearchText && (
                <button
                  type="button"
                  onClick={() => setQuickSearchText('')}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs px-1"
                >
                  ✕
                </button>
              )}
              <button
                type="submit"
                disabled={isSearchingQuick || !quickSearchText.trim()}
                className="px-2.5 py-1 rounded-[6px] bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold disabled:opacity-50 cursor-pointer shrink-0 transition-colors"
              >
                {isSearchingQuick ? '...' : 'Go'}
              </button>
            </form>

            {/* Maharashtra Live GIS Region Selector (District -> Taluka -> Village / Gaon) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* 1. District Dropdown */}
              <select
                value={selectedMhDistrict}
                onChange={(e) => handleSelectMhDistrict(e.target.value)}
                className="bg-[#F4F9F5] dark:bg-emerald-950/40 border border-[#D1E7DD] dark:border-emerald-800 text-[#0F291E] dark:text-emerald-100 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer hover:border-[#059669] transition-all"
                aria-label="Select Maharashtra District"
                title="Select Maharashtra District"
              >
                <option value="">-- Select District --</option>
                {MAHARASHTRA_DISTRICTS_DATA.map((d) => (
                  <option key={d.id} value={d.name}>
                    📍 {d.name}
                  </option>
                ))}
              </select>

              {/* 2. Taluka Dropdown */}
              <select
                value={selectedMhTaluka}
                onChange={(e) => handleSelectMhTaluka(e.target.value)}
                disabled={!selectedMhDistrict || !currentDistrictData}
                className="bg-[#F4F9F5] dark:bg-emerald-950/40 border border-[#D1E7DD] dark:border-emerald-800 text-[#0F291E] dark:text-emerald-100 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer hover:border-[#059669] transition-all disabled:opacity-50"
                aria-label="Select Taluka"
                title="Select Taluka"
              >
                <option value="">-- Select Taluka --</option>
                {currentDistrictData?.talukas.map((t) => (
                  <option key={t.name} value={t.name}>
                    🏛️ {t.name}
                  </option>
                ))}
              </select>

              {/* 3. Village / Gaon Dropdown */}
              <select
                value={selectedMhVillage}
                onChange={(e) => handleSelectMhVillage(e.target.value)}
                disabled={!selectedMhTaluka || !currentTalukaData || currentTalukaData.villages.length === 0}
                className="bg-[#F4F9F5] dark:bg-emerald-950/40 border border-[#D1E7DD] dark:border-emerald-800 text-[#0F291E] dark:text-emerald-100 rounded-[10px] px-2.5 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer hover:border-[#059669] transition-all disabled:opacity-50 max-w-[200px]"
                aria-label="Select Village / Gaon"
                title="Select Village or Gaon"
              >
                <option value="">-- Select Village / Gaon --</option>
                {currentTalukaData?.villages.map((v) => (
                  <option key={v.name} value={v.name}>
                    🏡 {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: GPS Guide Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setGpsHelpExpanded((v) => !v)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#355344] hover:text-[#0F291E] dark:text-emerald-300 hover:bg-[#F4F9F5] dark:hover:bg-emerald-950 transition-colors"
            >
              ℹ️ GPS Guide
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          4-TIER ALERT SYSTEM & GIS FILTER BAR
          (RED ALERT · ORANGE ALERT · YELLOW ALERT · GREEN SAFE)
          ===================================================================== */}
      <div className="neu-raised p-3.5 rounded-[14px] border border-[var(--border)] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#E8F5E9] text-[#059669] border border-[#D1E7DD] font-mono text-[10px] font-bold uppercase tracking-wider">
              Early Warning Tiers
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              'Alert Status (Red · Orange · Yellow · Green)'
            </h2>
          </div>
          <div className="text-[11px] font-mono text-[var(--text-secondary)]">
            Click any tier below to filter active zones &amp; habitations on the map
          </div>
        </div>

        {/* 4-Tier Interactive Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleSelectTier('ALL')}
            className={`p-2.5 rounded-[10px] text-left border transition-all ${alertFilterLevel === 'ALL'
                ? 'bg-[#059669] text-white border-[#047857] shadow-sm ring-2 ring-[#059669]/30'
                : 'bg-white text-[#0F291E] border-[#D1E7DD] hover:bg-[#F4F9F5]'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wider">All Tiers</span>
              <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${alertFilterLevel === 'ALL' ? 'bg-white/20 text-white' : 'bg-[#E8F5E9] text-[#059669]'
                }`}>
                {activeAlertZones.length} Zones
              </span>
            </div>
            <div className={`text-[11px] mt-1 ${alertFilterLevel === 'ALL' ? 'text-emerald-50' : 'text-[#355344]'}`}>
              {villages.length} Monitored Villages
            </div>
          </button>

          {/* RED ALERT */}
          <button
            type="button"
            onClick={() => handleSelectTier('Red')}
            className={`p-2.5 rounded-[10px] text-left border-2 transition-all relative ${alertFilterLevel === 'Red'
                ? 'bg-[#DC2626] text-white border-[#7F1D1D] shadow-md ring-2 ring-red-400/40'
                : 'bg-[#DC2626]/10 text-[var(--text-primary)] border-[#DC2626]/50 hover:bg-[#DC2626]/20'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] border border-white inline-block animate-pulse" />
                <span>RED ALERT</span>
              </span>
              <span className="font-mono text-[11px] font-bold">
                {alertLevelSummary.Red.zones}Z · {alertLevelSummary.Red.villages}V
              </span>
            </div>
            <div className="text-[10px] font-semibold mt-0.5 opacity-90">
              Take Action / Evacuate (&gt;204.4 mm)
            </div>
            {selectedZone?.level === 'Red' && (
              <div className="mt-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-black/25 flex items-center gap-1 truncate text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                <span className="truncate">🎯 Focused: {selectedZone.areaName.split(',')[0]}</span>
              </div>
            )}
          </button>

          {/* ORANGE ALERT */}
          <button
            type="button"
            onClick={() => handleSelectTier('Orange')}
            className={`p-2.5 rounded-[10px] text-left border-2 transition-all relative ${alertFilterLevel === 'Orange'
                ? 'bg-[#EA580C] text-white border-[#7C2D12] shadow-md ring-2 ring-orange-400/40'
                : 'bg-[#EA580C]/10 text-[var(--text-primary)] border-[#EA580C]/50 hover:bg-[#EA580C]/20'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] border border-white inline-block animate-pulse" />
                <span>ORANGE ALERT</span>
              </span>
              <span className="font-mono text-[11px] font-bold">
                {alertLevelSummary.Orange.zones}Z · {alertLevelSummary.Orange.villages}V
              </span>
            </div>
            <div className="text-[10px] font-semibold mt-0.5 opacity-90">
              Be Prepared / Warning (115.6–204.4 mm)
            </div>
            {selectedZone?.level === 'Orange' && (
              <div className="mt-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-black/25 flex items-center gap-1 truncate text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                <span className="truncate">🎯 Focused: {selectedZone.areaName.split(',')[0]}</span>
              </div>
            )}
          </button>

          {/* YELLOW ALERT */}
          <button
            type="button"
            onClick={() => handleSelectTier('Yellow')}
            className={`p-2.5 rounded-[10px] text-left border-2 transition-all relative ${alertFilterLevel === 'Yellow'
                ? 'bg-[#CA8A04] text-white border-[#713F12] shadow-md ring-2 ring-amber-400/40'
                : 'bg-[#EAB308]/15 text-[var(--text-primary)] border-[#CA8A04]/60 hover:bg-[#EAB308]/25'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308] border border-white inline-block animate-pulse" />
                <span>YELLOW ALERT</span>
              </span>
              <span className="font-mono text-[11px] font-bold">
                {alertLevelSummary.Yellow.zones}Z · {alertLevelSummary.Yellow.villages}V
              </span>
            </div>
            <div className="text-[10px] font-semibold mt-0.5 opacity-90">
              Watch / Be Updated (64.5–115.5 mm)
            </div>
            {selectedZone?.level === 'Yellow' && (
              <div className="mt-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-black/25 flex items-center gap-1 truncate text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                <span className="truncate">🎯 Focused: {selectedZone.areaName.split(',')[0]}</span>
              </div>
            )}
          </button>

          {/* GREEN SAFE */}
          <button
            type="button"
            onClick={() => handleSelectTier('Green')}
            className={`p-2.5 rounded-[10px] text-left border-2 transition-all relative ${alertFilterLevel === 'Green'
                ? 'bg-[#15803D] text-white border-[#14532D] shadow-md ring-2 ring-green-400/40'
                : 'bg-[#15803D]/10 text-[var(--text-primary)] border-[#15803D]/50 hover:bg-[#15803D]/20'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#15803D] border border-white inline-block" />
                <span>GREEN SAFE</span>
              </span>
              <span className="font-mono text-[11px] font-bold">
                {alertLevelSummary.Green.zones}Z · {alertLevelSummary.Green.villages}V
              </span>
            </div>
            <div className="text-[10px] font-semibold mt-0.5 opacity-90">
              No Warning / Normal (&lt;64.4 mm)
            </div>
            {selectedZone?.level === 'Green' && (
              <div className="mt-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-black/25 flex items-center gap-1 truncate text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                <span className="truncate">🎯 Focused: {selectedZone.areaName.split(',')[0]}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Geolocation Diagnostic / Hardware Note Banner */}
      {(Boolean(gps.errorPlainMessage) || gpsHelpExpanded) && (
        <div className="neu-flat p-3 rounded-[10px] text-xs space-y-1.5 border border-[var(--border)]">
          {gps.errorPlainMessage && (
            <div className="font-bold text-[#B91C1C] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span>{gps.errorPlainMessage}</span>
            </div>
          )}
          {gpsHelpExpanded && (
            <div className="space-y-1">
              <div className="font-semibold text-[#059669]">
                GPS & Wi-Fi Location Info:
              </div>
              <div className="text-[var(--text-secondary)]">
                {gps.honestHardwareNote}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Authorised Officer Form: Issue or Change Active Disaster Alert Zone */}
      {canIssueAlerts && issueFormOpen && (
        <div className="neu-raised p-4 space-y-3 border-2 border-[#0B8F80]">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Issue or Change Active Disaster Alert Zone (Official 4-Tier Red / Orange / Yellow / Green)
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Updates GIS alert polygon color and bilingual CAP messages in real time across the map and SACHET feed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIssueFormOpen(false)}
              className="neu-btn p-1"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="neu-flat p-2.5 rounded-[8px] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#CA8A04]/20 text-[#CA8A04] font-bold text-[11px]">
                Suggested - needs authority confirmation
              </span>
              <span className="text-[var(--text-secondary)]">{suggestedAlertLevel.reason}</span>
            </div>
            <button
              type="button"
              onClick={() => setZoneLevel(suggestedAlertLevel.level)}
              className="neu-btn px-2.5 py-1 text-[11px] font-semibold"
            >
              Apply Suggested ({suggestedAlertLevel.level})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Select Area / Existing Zone
              </label>
              <select
                value={editingZoneId}
                onChange={(e) => {
                  const id = e.target.value;
                  setEditingZoneId(id);
                  const found = activeAlertZones.find((z) => z.id === id);
                  if (found) {
                    setZoneAreaName(found.areaName);
                    setZoneDistrict(found.district);
                    setZoneDisasterType(found.disasterType);
                    setZoneLevel(found.level);
                    setZoneInstructions(found.instructions);
                    setZoneExpiresAt(found.expiresAt);
                  }
                }}
                className="neu-input w-full px-2.5 py-1.5 text-xs"
              >
                <option value="">+ New Zone around current map pin</option>
                {activeAlertZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.areaName} ({z.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Area Name
              </label>
              <input
                type="text"
                value={zoneAreaName}
                onChange={(e) => setZoneAreaName(e.target.value)}
                className="neu-input w-full px-2.5 py-1.5 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Disaster Type
              </label>
              <select
                value={zoneDisasterType}
                onChange={(e) => setZoneDisasterType(e.target.value as AlertDisasterType)}
                className="neu-input w-full px-2.5 py-1.5 text-xs"
              >
                <option value="flood">Flood</option>
                <option value="landslide">Landslide</option>
                <option value="cyclone">Cyclone</option>
                <option value="earthquake">Earthquake</option>
                <option value="fire">Fire</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Alert Severity Level (4 Tiers)
              </label>
              <select
                value={zoneLevel}
                onChange={(e) => setZoneLevel(e.target.value as AlertZoneLevel)}
                className="neu-input w-full px-2.5 py-1.5 text-xs font-bold"
              >
                <option value="Green">Green — No Warning / Safe (&lt;64.4 mm)</option>
                <option value="Yellow">Yellow — Watch / Be Updated (64.5–115.5 mm)</option>
                <option value="Orange">Orange — Warning / Be Prepared (115.6–204.4 mm)</option>
                <option value="Red">Red — Danger / Evacuate (&gt;204.4 mm)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Expires At
              </label>
              <input
                type="text"
                value={zoneExpiresAt}
                onChange={(e) => setZoneExpiresAt(e.target.value)}
                className="neu-input w-full px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Bilingual CAP Message (English + Hindi) & Severity / Urgency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                CAP Message (English)
              </label>
              <input
                type="text"
                value={zoneMessageEn}
                onChange={(e) => setZoneMessageEn(e.target.value)}
                className="neu-input w-full px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                Secondary Advisory (English)
              </label>
              <input
                type="text"
                value={zoneMessageHi}
                onChange={(e) => setZoneMessageHi(e.target.value)}
                className="neu-input w-full px-2.5 py-1.5 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Severity
                </label>
                <select
                  value={zoneSeverity}
                  onChange={(e) =>
                    setZoneSeverity(
                      e.target.value as 'Minor' | 'Moderate' | 'Severe' | 'Extreme'
                    )
                  }
                  className="neu-input w-full px-2 py-1.5 text-xs"
                >
                  <option value="Extreme">Extreme</option>
                  <option value="Severe">Severe</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Urgency
                </label>
                <select
                  value={zoneUrgency}
                  onChange={(e) =>
                    setZoneUrgency(
                      e.target.value as 'Immediate' | 'Expected' | 'Future'
                    )
                  }
                  className="neu-input w-full px-2 py-1.5 text-xs"
                >
                  <option value="Immediate">Immediate</option>
                  <option value="Expected">Expected</option>
                  <option value="Future">Future</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Short Public Instructions
              </label>
              <input
                type="text"
                value={zoneInstructions}
                onChange={(e) => setZoneInstructions(e.target.value)}
                className="neu-input w-full px-3 py-1.5 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setConfirmZoneDialogOpen(true)}
              className="px-4 py-2 rounded-[10px] bg-[#0B8F80] hover:bg-[#097569] text-white text-xs font-bold"
            >
              Review & Confirm Alert Level
            </button>
          </div>

          {confirmZoneDialogOpen && (
            <div className="neu-flat p-4 rounded-[10px] border-2 border-[#B91C1C] space-y-2.5">
              <div className="text-xs font-bold text-[var(--text-primary)]">
                Mandatory Authority Confirmation: Publish {getAlertLevelMeta(zoneLevel).labelEn}?
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Area: <strong>{zoneAreaName}</strong> · Type:{' '}
                <strong>{zoneDisasterType.toUpperCase()}</strong> · Expires:{' '}
                <strong>{zoneExpiresAt}</strong>. Instructions: &quot;{zoneInstructions}&quot;
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmZoneDialogOpen(false)}
                  className="neu-btn px-3 py-1.5 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublishZone}
                  className="px-4 py-1.5 rounded-[8px] bg-[#B91C1C] text-white text-xs font-bold"
                >
                  Confirm & Broadcast to Map
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          SIMPLE & SOPHISTICATED ACTIVE ZONE STATUS
          ===================================================================== */}
      {selectedZone && (
        <div className="p-2.5 px-4 rounded-xl border border-slate-200 dark:border-[#1E3A5F] bg-white dark:bg-[#101C2C] shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
              style={{ backgroundColor: getAlertLevelMeta(selectedZone.level).bg }}
            />
            <span className="font-bold text-slate-800 dark:text-slate-100">
              Active Focus: <span className="font-extrabold text-[#008060]">{selectedZone.areaName}</span> ({selectedZone.district}, Maharashtra)
            </span>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase"
              style={{ backgroundColor: getAlertLevelMeta(selectedZone.level).bg }}
            >
              {selectedZone.level} Alert
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [selectedZone.centerLng, selectedZone.centerLat],
                    zoom: 14.2,
                    duration: 600,
                  });
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#172F46] hover:bg-[#E8F5E9] text-[#008060] font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Re-center Map
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedZone(null);
                clearZoneHighlightAndPopup();
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#172F46] hover:bg-red-50 text-slate-600 dark:text-slate-300 hover:text-red-600 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Clear Focus
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          MONITORED HABITATIONS & VILLAGES DIRECTORY (BY RISK ZONE)
          Allows user to select any village by risk zone to fly directly to it on the map.
          Prevents map overcrowding by showing only the targeted village marker on the map.
          ===================================================================== */}
      <div className="neu-raised p-3.5 sm:p-4 rounded-[14px] border border-slate-200 dark:border-[#1E3A5F] space-y-3 bg-white dark:bg-[#101C2C]">
        {/* Directory Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F7F2] dark:bg-[#008060]/20 text-[#008060] flex items-center justify-center font-bold shadow-xs">
              <Home className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <span>Monitored Habitations & Villages Directory</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#E6F7F2] dark:bg-[#008060]/30 text-[#008060] dark:text-emerald-300">
                  {villages.length} Monitored
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                'Click any village to fly directly to its place on the map without overcrowding all markers'
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Show all village pins toggle */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1E3A5F] transition-colors">
              <input
                type="checkbox"
                checked={showHabitations}
                onChange={(e) => setShowHabitations(e.target.checked)}
                className="accent-[#008060] rounded cursor-pointer"
              />
              <span>Show All Pins on Map</span>
            </label>

            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => setVillageDirectoryOpen((v) => !v)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={villageDirectoryOpen ? 'Collapse Directory' : 'Expand Directory'}
            >
              {villageDirectoryOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {villageDirectoryOpen && (
          <>
            {/* Unified Alert Tier Filter Indicator & Village Search */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-[var(--text-secondary)]">Filtered by Alert Status:</span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    alertFilterLevel === 'Red'
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : alertFilterLevel === 'Orange'
                        ? 'bg-[#EA580C] text-white shadow-xs'
                        : alertFilterLevel === 'Yellow'
                          ? 'bg-[#CA8A04] text-white shadow-xs'
                          : alertFilterLevel === 'Green'
                            ? 'bg-[#15803D] text-white shadow-xs'
                            : 'bg-[#008060] text-white shadow-xs'
                  }`}
                >
                  {alertFilterLevel !== 'ALL' && (
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                  <span>
                    {alertFilterLevel === 'ALL'
                      ? `All Monitored Villages (${villages.length})`
                      : `${alertFilterLevel} Zone (${filteredVillagesForDirectory.length} of ${villages.length})`}
                  </span>
                </span>
                {alertFilterLevel !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => handleSelectTier('ALL')}
                    className="text-[11px] text-[#008060] hover:underline font-semibold cursor-pointer"
                    title="Reset to All Tiers"
                  >
                    Reset Filter ✕
                  </button>
                )}
              </div>

              {/* Search input */}
              <div className="relative flex items-center min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={villageSearchTerm}
                  onChange={(e) => setVillageSearchTerm(e.target.value)}
                  placeholder="Filter village, taluka, hazard..."
                  className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50 dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#008060]"
                />
                {villageSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setVillageSearchTerm('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Village Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredVillagesForDirectory.map((v) => {
                const meta = getVillageZoneMeta(v);
                const isSelected = selectedVillage?.id === v.id;

                return (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVillageFromList(v)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-2 border-[#008060] bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-[#008060]/20 shadow-sm'
                        : 'border-slate-200 dark:border-[#233C57] bg-slate-50/50 dark:bg-[#172F46]/50 hover:bg-white dark:hover:bg-[#172F46] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                    }`}
                  >
                    <div>
                      {/* Top Row: Name + Risk Badge */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <div>
                          <div className="font-bold text-xs sm:text-[13px] text-[#0F172A] dark:text-white leading-tight">
                            {v.name}
                          </div>
                          
                        </div>

                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: meta.colorHex }}
                        >
                          {meta.score100}/100
                        </span>
                      </div>

                      {/* Middle: Taluka + District + State + Hazard */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 mb-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{v.taluka}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{v.district}</span>
                        <span>·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{v.state || 'Maharashtra'}</span>
                        <span>·</span>
                        <span className="capitalize font-semibold text-amber-600 dark:text-amber-400">
                          {v.primaryHazard}
                        </span>
                      </div>

                      {/* Bottom Metrics: Population, Elevation, Slope */}
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-white dark:bg-[#101C2C] p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                        <div>
                          👥 {v.population.toLocaleString()} pop ({v.households} HH)
                        </div>
                        <div className="text-right">
                          ⛰️ {v.elevationM}m · {v.slopeDeg}°
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10.5px] font-bold" style={{ color: meta.colorHex }}>
                        {meta.zoneName}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectVillageFromList(v);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-[#008060] text-white shadow-xs'
                            : 'bg-white dark:bg-[#172F46] text-[#008060] border border-[#008060]/40 hover:bg-[#E6F7F2]'
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        <span>{isSelected ? 'Focused 🎯' : 'Fly to Map →'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* MAIN MAP CONTAINER */}
      <div className="relative neu-raised overflow-hidden rounded-[14px] border border-[var(--border)] h-[640px] md:h-[720px]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Dedicated 4-Type Accurate Basemap Switcher (Street · Satellite · Topo · Dark GIS) */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center p-1 rounded-2xl bg-white/95 dark:bg-[#101C2C]/95 backdrop-blur-md border border-slate-200/90 dark:border-[#1E3A5F] shadow-lg gap-1">
          <button
            type="button"
            onClick={() => setBasemapMode('street')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemapMode === 'street'
                ? 'bg-[#008060] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172F46]'
            }`}
            title="Street Map — Accurate Roads & Administrative Settlements (OpenStreetMap)"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Street</span>
          </button>

          <button
            type="button"
            onClick={() => setBasemapMode('satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemapMode === 'satellite'
                ? 'bg-[#008060] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172F46]'
            }`}
            title="Satellite Map — High-Resolution Aerial Imagery with Roads & Place Labels"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setBasemapMode('topo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemapMode === 'topo'
                ? 'bg-[#008060] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172F46]'
            }`}
            title="Topographic Map — Contours, Mountain Relief & Elevation Terrain (Esri Topo)"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Topo</span>
          </button>

          <button
            type="button"
            onClick={() => setBasemapMode('dark')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemapMode === 'dark'
                ? 'bg-[#0B1F33] text-[#14B8A6] border border-[#14B8A6]/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172F46]'
            }`}
            title="Dark GIS Map — High-Contrast Mission Control Basemap (CartoDB Dark Matter)"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark GIS</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-[#1E3A5F] mx-0.5" />

          {/* Explicit 2D View Button */}
          <button
            type="button"
            onClick={() => setIs3D(false)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              !is3D
                ? 'bg-[#008060] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172F46]'
            }`}
            title="2D Standard Planar View (Flat Pitch 0°)"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>2D</span>
          </button>

          {/* Explicit 3D DEM Terrain Button */}
          <button
            type="button"
            onClick={() => setIs3D(true)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              is3D
                ? 'bg-[#0B1F33] text-[#38BDF8] border border-[#38BDF8]/40 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172F46]'
            }`}
            title="3D Elevation Terrain Model (AWS Terrarium DEM)"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>3D DEM</span>
          </button>

          {is3D && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.easeTo({
                      bearing: (mapRef.current.getBearing() + 45) % 360,
                      duration: 350,
                    });
                  }
                }}
                className="px-2 py-1.5 rounded-xl text-xs font-bold text-[#0B8F80] hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-1 cursor-pointer transition-all"
                title="Rotate 3D camera 45°"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Rotate 45°</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.easeTo({
                      pitch: 58,
                      bearing: 0,
                      duration: 350,
                    });
                  }
                }}
                className="px-2 py-1.5 rounded-xl text-xs font-bold text-[#0B8F80] hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-1 cursor-pointer transition-all"
                title="Reset to North facing 3D view"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>North</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile 4-Basemap + 2D/3D Quick Bar */}
        <div className="absolute top-14 left-3 z-10 md:hidden flex items-center p-0.5 rounded-xl bg-white/95 dark:bg-[#101C2C]/95 backdrop-blur-md border border-slate-200 dark:border-[#1E3A5F] shadow-md gap-0.5 text-[10px]">
          <button
            type="button"
            onClick={() => setBasemapMode('street')}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
              basemapMode === 'street' ? 'bg-[#008060] text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <MapIcon className="w-3 h-3" />
            <span>Street</span>
          </button>
          <button
            type="button"
            onClick={() => setBasemapMode('satellite')}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
              basemapMode === 'satellite' ? 'bg-[#008060] text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Sat</span>
          </button>
          <button
            type="button"
            onClick={() => setBasemapMode('topo')}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
              basemapMode === 'topo' ? 'bg-[#008060] text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Mountain className="w-3 h-3" />
            <span>Topo</span>
          </button>
          <button
            type="button"
            onClick={() => setBasemapMode('dark')}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
              basemapMode === 'dark' ? 'bg-[#0B1F33] text-[#14B8A6]' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>Dark</span>
          </button>
          <div className="h-3 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />
          <button
            type="button"
            onClick={() => setIs3D(false)}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
              !is3D ? 'bg-[#008060] text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="2D Standard View"
          >
            <span>2D</span>
          </button>
          <button
            type="button"
            onClick={() => setIs3D(true)}
            className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 ${
              is3D ? 'bg-[#0B1F33] text-[#38BDF8] border border-[#38BDF8]/40' : 'text-slate-600 dark:text-slate-300'
            }`}
            title="3D Elevation Terrain Model (AWS Terrarium DEM)"
          >
            <Orbit className="w-3 h-3" />
            <span>3D</span>
          </button>
        </div>

        {/* 1. Universal Search Box (Top-Left) — Searches every small village, street, pin code, taluka & city */}
        <div className="absolute top-3 left-3 z-10 w-72 sm:w-88">
          <form onSubmit={handleSearch} className="neu-raised p-1.5 flex items-center gap-1.5">
            <Search className="w-4 h-4 text-[#0B8F80] ml-1.5 shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val.trim()) {
                  setSearchResults([]);
                  return;
                }
                const q = val.trim().toLowerCase();
                const liveMatches: {
                  label: string;
                  subLabel?: string;
                  category: string;
                  colorHex?: string;
                  lat: number;
                  lng: number;
                  zoom?: number;
                  village?: Village;
                }[] = [];

                villages.forEach((v) => {
                  if (
                    v.name.toLowerCase().includes(q) ||
                    v.nameHi?.toLowerCase().includes(q) ||
                    v.nameMr?.toLowerCase().includes(q) ||
                    v.taluka.toLowerCase().includes(q) ||
                    v.district.toLowerCase().includes(q) ||
                    v.primaryHazard?.toLowerCase().includes(q)
                  ) {
                    const meta = getVillageZoneMeta(v);
                    liveMatches.push({
                      label: `${v.name} (${v.taluka}, ${v.district})`,
                      subLabel: `${meta.zoneName} · Risk Score: ${meta.score100}/100`,
                      category: 'Village',
                      colorHex: meta.colorHex,
                      lat: v.lat,
                      lng: v.lng,
                      zoom: 15.2,
                      village: v,
                    });
                  }
                });

                INDIA_AND_REGIONAL_PLACES.forEach((pl) => {
                  if (
                    pl.name.toLowerCase().includes(q) ||
                    pl.district.toLowerCase().includes(q)
                  ) {
                    liveMatches.push({
                      label: `${pl.name} (${pl.district})`,
                      category: pl.category,
                      lat: pl.lat,
                      lng: pl.lng,
                      zoom: pl.zoom,
                    });
                  }
                });

                setSearchResults(liveMatches);
              }}
              placeholder="Search any village, taluka, hazard, or place..."
              className="bg-transparent text-xs flex-1 focus:outline-none text-[var(--text-primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1 text-[var(--text-secondary)] hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
            <button
              type="submit"
              className="px-2.5 py-1 rounded-[6px] bg-[#0B8F80] hover:bg-[#097b6e] text-white text-[11px] font-bold cursor-pointer transition-colors"
            >
              {isSearching ? '...' : 'Go'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-1.5 neu-raised p-2 space-y-1.5 max-h-72 overflow-y-auto text-xs rounded-xl bg-white/95 dark:bg-[#101C2C]/95 backdrop-blur-md shadow-2xl border border-slate-200 dark:border-[#1E3A5F]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span>Matching Results ({searchResults.length})</span>
                <span className="text-[#008060] font-semibold">Click to fly & show on map</span>
              </div>
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (r.village) {
                      handleSelectVillageFromList(r.village);
                    } else {
                      flyToAndInspect(r.label, r.lat, r.lng, r.zoom || 14.5);
                    }
                    setSearchResults([]);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-[#172F46] flex items-center justify-between gap-2 transition-all cursor-pointer border border-transparent hover:border-[#008060]/30"
                >
                  <div className="truncate flex-1">
                    <div className="font-bold text-slate-900 dark:text-white truncate text-xs flex items-center gap-1.5">
                      <span>{r.label}</span>
                    </div>
                    {r.subLabel && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {r.subLabel}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {r.colorHex && (
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: r.colorHex }}
                      />
                    )}
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#233C57] text-slate-700 dark:text-slate-300 font-semibold">
                      {r.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Multi-Layer GIS & Basemap Control Panel (Top-Right) */}
        <div className="absolute top-3 right-3 z-10 neu-raised p-3 space-y-2.5 text-xs max-w-[285px]">
          <div className="font-bold text-[11px] uppercase tracking-wider text-[var(--text-secondary)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
              <span>GIS Vector Layers</span>
            </span>
            <span className="font-mono text-[10px] text-[#0B8F80]">EPSG:4326</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={showAlertZones}
                onChange={(e) => setShowAlertZones(e.target.checked)}
                className="accent-[#0B8F80]"
              />
              <span>Alert Zones (R/O/Y/G)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={showVillageHazardBuffers}
                onChange={(e) => setShowVillageHazardBuffers(e.target.checked)}
                className="accent-[#0B8F80]"
              />
              <span>1.5km Risk Buffers</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[#0284C7] font-semibold">
              <input
                type="checkbox"
                checked={showRiverHydrology}
                onChange={(e) => setShowRiverHydrology(e.target.checked)}
                className="accent-[#0284C7]"
              />
              <span>CWC Rivers GIS</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[#9333EA] font-semibold">
              <input
                type="checkbox"
                checked={showGsiFaultLines}
                onChange={(e) => setShowGsiFaultLines(e.target.checked)}
                className="accent-[#9333EA]"
              />
              <span>GSI Faults/Scarps</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[#008060] font-semibold col-span-2">
              <input
                type="checkbox"
                checked={!!selectedVillage}
                readOnly
                className="accent-[#008060]"
              />
              <span>Authentic Cadastral Boundary (Auto-Active)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showShelters}
                onChange={(e) => setShowShelters(e.target.checked)}
                className="accent-[#0B8F80]"
              />
              <span>Shelters ({reliefCamps.length})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showMyLocation}
                onChange={(e) => setShowMyLocation(e.target.checked)}
                className="accent-[#0B8F80]"
              />
              <span>My GPS + Ring</span>
            </label>
            <label
              className={`flex items-center gap-1.5 ${isCitizen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              title={
                isCitizen
                  ? 'Live volunteer locations are restricted to authorised roles'
                  : 'Show opted-in volunteers'
              }
            >
              <input
                type="checkbox"
                disabled={isCitizen}
                checked={!isCitizen && showVolunteers}
                onChange={(e) => setShowVolunteers(e.target.checked)}
                className="accent-[#0B8F80]"
              />
              <span>Volunteers</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showHabitations}
                onChange={(e) => setShowHabitations(e.target.checked)}
                className="accent-[#0B8F80]"
              />
              <span className="font-semibold">Villages ({villages.length})</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer col-span-2 text-[#EA580C] font-semibold">
              <input
                type="checkbox"
                checked={showIncidents}
                onChange={(e) => setShowIncidents(e.target.checked)}
                className="accent-[#EA580C]"
              />
              <span>Incidents ({incidents.length})</span>
            </label>
          </div>

          {/* National Spatial GIS Cartography Status */}
          <div className="pt-1.5 border-t border-[var(--border)] flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1 font-semibold text-[#059669] dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>National Spatial Cartography</span>
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Survey of India / GSI Verified
            </span>
          </div>

          {/* AI Climate Intelligence Modules Quick Jump */}
          <div className="pt-1.5 border-t border-[var(--border)]">
            <div className="font-bold text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1 flex items-center justify-between">
              <span>AI Climate Intelligence</span>
              <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-[#008060] font-bold">LIVE ML</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => navigate(selectedVillage ? `/climate-vulnerability?villageId=${selectedVillage.id}` : '/climate-vulnerability')}
                className="py-1 px-1 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors text-center truncate"
                title="Village Climate Vulnerability"
              >
                Vulnerability
              </button>
              <button
                type="button"
                onClick={() => navigate(selectedVillage ? `/climate-impact-prediction?villageId=${selectedVillage.id}` : '/climate-impact-prediction')}
                className="py-1 px-1 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 hover:bg-blue-100 transition-colors text-center truncate"
                title="AI Climate Impact Prediction"
              >
                Impact
              </button>
              <button
                type="button"
                onClick={() => navigate(selectedVillage ? `/climate-anomaly-detection?villageId=${selectedVillage.id}` : '/climate-anomaly-detection')}
                className="py-1 px-1 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 hover:bg-purple-100 transition-colors text-center truncate"
                title="AI Climate Anomaly Detection"
              >
                Anomalies
              </button>
            </div>
          </div>

          {/* Collapsed "Advanced tools" drawer */}
          {!isCitizen && (
            <div className="pt-1 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-0.5"
              >
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-[#0B8F80]" strokeWidth={1.75} />
                  <span>Advanced GIS (Flood Sim, Opacity & Measure)</span>
                </span>
                {advancedOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={1.75} />
                )}
              </button>

              {advancedOpen && (
                <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-2 text-[11px]">
                  <div>
                    <div className="flex justify-between">
                      <span>Flood water rise sim</span>
                      <span className="font-mono font-bold text-[#0284C7]">
                        +{floodSimMeters} m
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={1}
                      value={floodSimMeters}
                      onChange={(e) => setFloodSimMeters(Number(e.target.value))}
                      className="w-full accent-[#0B8F80]"
                    />
                    {floodSimMeters > 0 && (
                      <div className="text-[10px] font-mono text-[#0284C7] font-semibold">
                        Inundated: {floodSimResult.affectedHabitations.length} villages ·{' '}
                        {floodSimResult.affectedPopulation.toLocaleString()} pop ·{' '}
                        {floodSimResult.roadsCutCount} roads cut
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between">
                      <span>Alert polygon opacity</span>
                      <span className="font-mono font-bold text-[#0B8F80]">
                        {layerOpacityPct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={80}
                      step={5}
                      value={layerOpacityPct}
                      onChange={(e) => setLayerOpacityPct(Number(e.target.value))}
                      className="w-full accent-[#0B8F80]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMeasureMode((v) => !v);
                        setMeasurePoints([]);
                      }}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 ${measureMode ? 'bg-[#D97706] text-white' : 'neu-btn'
                        }`}
                    >
                      <Ruler className="w-3 h-3" strokeWidth={1.75} />
                      <span>{measureMode ? 'Stop Measure' : 'Measure Dist'}</span>
                    </button>
                    {measurePoints.length >= 2 && (
                      <span className="font-mono font-bold text-[#D97706]">
                        {measuredDistanceKm} km
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Corner GIS Legend (Bottom-Left above scale) - Standardized 5-Tier 0-100 Classification */}
        <div className="absolute bottom-10 left-3 z-10 neu-raised p-2.5 text-[11px] space-y-1.5 max-w-xs">
          <div className="font-bold text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
            NIVARAN 5-Tier GIS Risk Scoring Legend
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#DC2626] border border-white shrink-0" />
              <span className="font-semibold text-[#DC2626]">VERY HIGH RISK (80–100) #DC2626</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#EAB308] border border-white shrink-0" />
              <span className="font-semibold text-[#CA8A04]">HIGH RISK (60–&lt;80) #EAB308</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#F97316] border border-white shrink-0" />
              <span className="font-semibold text-[#EA580C]">MODERATE RISK (40–&lt;60) #F97316</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#84CC16] border border-white shrink-0" />
              <span className="font-semibold text-[#65A30D]">LOW RISK (20–&lt;40) #84CC16</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-sm bg-[#16A34A] border border-white shrink-0" />
              <span className="font-semibold text-[#16A34A]">VERY LOW RISK (0–&lt;20) #16A34A</span>
            </div>
            <div className="flex items-center gap-3 pt-1 border-t border-[var(--border)] text-[10px]">
              <span className="flex items-center gap-1 font-semibold text-[#0284C7]">
                <span className="w-4 h-0.5 bg-[#0284C7] inline-block" /> CWC River
              </span>
              <span className="flex items-center gap-1 font-semibold text-[#9333EA]">
                <span className="w-4 h-0.5 border-b-2 border-dashed border-[#9333EA] inline-block" /> GSI Fault/Scarp
              </span>
            </div>
          </div>
        </div>

        {/* 4. Active Route Banner when "Get directions" is clicked */}
        {routeInfo && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 neu-raised px-4 py-2 border-2 border-[#0B8F80] flex items-center gap-3 text-xs">
            <Navigation className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
            <div>
              <div className="font-bold text-[var(--text-primary)]">
                Route to {routeInfo.shelterName}
              </div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                {routeInfo.distanceKm} km · ~{routeInfo.durationMin} mins (
                {routeInfo.isFallback ? 'Straight-line fallback' : 'OSRM Road Route'})
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRouteInfo(null)}
              className="neu-btn p-1"
              aria-label="Clear route"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        )}

        {/* 5. Detected Zone Floating Map Pill (Bottom-Center when zone is selected and route is not blocking) */}
        {selectedZone && !routeInfo && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 neu-raised px-3.5 py-1.5 border-2 border-[#059669] bg-white/95 backdrop-blur-xs flex items-center gap-2.5 text-xs shadow-md">
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
              style={{ backgroundColor: getAlertLevelMeta(selectedZone.level).bg }}
            />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[var(--text-primary)]">
                {selectedZone.level.toUpperCase()} ALERT:
              </span>
              <span className="font-semibold text-[#059669]">
                {selectedZone.areaName.split(',')[0]}
              </span>
              <span className="font-mono text-[10.5px] text-[var(--text-secondary)]">
                ({selectedZone.centerLat.toFixed(4)}°N, {selectedZone.centerLng.toFixed(4)}°E)
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [selectedZone.centerLng, selectedZone.centerLat],
                    zoom: 14.2,
                    duration: 600,
                  });
                }
              }}
              className="px-2 py-0.5 rounded bg-[#E8F5E9] text-[#059669] hover:bg-[#D1E7DD] font-bold text-[10.5px] cursor-pointer"
              title="Center camera on detected zone"
            >
              Focus
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedZone(null);
                clearZoneHighlightAndPopup();
              }}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Dismiss detected zone pill"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Floating Professional GIS Quick Control Toolbar (Right Edge) */}
        <div className="absolute right-3 top-72 z-10 hidden sm:flex flex-col items-center p-1 rounded-xl bg-white/95 dark:bg-[#101C2C]/95 backdrop-blur-md border border-slate-200 dark:border-[#1E3A5F] shadow-xl gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Zoom In (+)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Zoom Out (-)"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-5 h-px bg-slate-200 dark:bg-[#1E3A5F] my-0.5" />
          <button
            type="button"
            onClick={handleResetNorth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Reset North & Planar Pitch"
          >
            <Compass className="w-4 h-4 text-emerald-700" />
          </button>
          <button
            type="button"
            onClick={handleResetStatewideView}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Statewide View (Maharashtra Overview)"
          >
            <RotateCcw className="w-4 h-4 text-sky-700" />
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Locate My GPS Position"
          >
            <LocateFixed className="w-4 h-4 text-emerald-600" />
          </button>
          <div className="w-5 h-px bg-slate-200 dark:bg-[#1E3A5F] my-0.5" />
          <button
            type="button"
            onClick={handleExportMapPng}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Export High-Resolution Map Screenshot (PNG)"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
          </button>
          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Compare Villages Side-by-Side"
          >
            <ArrowUpDown className="w-4 h-4 text-amber-600" />
          </button>
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-[#008060] transition-colors"
            title="Toggle Map Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =====================================================================
          GIS TELEMETRY HUD, COORDINATE PROJECTION (DD / DMS / UTM),
          SPATIAL BUFFER PROXIMITY ANALYSIS & GEOJSON EXPORT BAR
          ===================================================================== */}
      <div className="neu-raised p-3.5 rounded-[14px] border border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Coordinate Projection Switcher & Live Cursor HUD */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="neu-inset p-0.5 rounded-[8px] flex items-center gap-0.5">
            {(['DD', 'DMS', 'UTM'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setCoordDisplayFormat(fmt)}
                className={`px-2 py-1 rounded-[6px] text-[10px] font-mono font-bold ${coordDisplayFormat === fmt
                    ? 'bg-[#0B8F80] text-white'
                    : 'text-[var(--text-secondary)]'
                  }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <div className="font-mono text-xs font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-[8px] border border-[var(--border)]">
            {coordDisplayFormat === 'DD' &&
              `${cursorHud.lat.toFixed(5)}° N, ${cursorHud.lng.toFixed(5)}° E (WGS84)`}
            {coordDisplayFormat === 'DMS' &&
              formatLatLngToDms(cursorHud.lat, cursorHud.lng)}
            {coordDisplayFormat === 'UTM' &&
              formatLatLngToUtm(cursorHud.lat, cursorHud.lng)}
          </div>

          <span className="font-mono text-[11px] text-[var(--text-secondary)]">
            Zoom: <strong>{cursorHud.zoom}x</strong> · Pitch: <strong>{cursorHud.pitch}°</strong> · Bearing:{' '}
            <strong>{cursorHud.bearing}°</strong>
          </span>

          {/* Live Location in Words Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
            <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            <span className="font-bold text-[#059669] text-[11px]">
              'Location (In Words):'
            </span>
            <span className="font-semibold text-[var(--text-primary)] text-xs">
              {gps.shortAddressInWords || gps.addressInWords}
            </span>
          </div>
        </div>

        {/* Interactive GIS Spatial Buffer Analysis & GeoJSON Export */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#0D9488]">
              GIS Spatial Buffer ({spatialBufferAnalysis.centerLabel.split(' ')[0]}):
            </span>
            {([2, 5, 10, 15] as const).map((rKm) => (
              <button
                key={rKm}
                type="button"
                onClick={() => setSpatialBufferRadiusKm(rKm)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${spatialBufferRadiusKm === rKm
                    ? 'bg-[#0B8F80] text-white'
                    : 'neu-btn text-[var(--text-secondary)]'
                  }`}
              >
                {rKm} km
              </button>
            ))}
          </div>

          <div className="px-2.5 py-1 rounded-[8px] neu-flat font-mono text-[11px] text-[var(--text-primary)]">
            In {spatialBufferRadiusKm}km ring:{' '}
            <strong className="text-[#DC2626]">{spatialBufferAnalysis.villagesCount} villages</strong> (
            {spatialBufferAnalysis.populationInRing.toLocaleString()} pop) ·{' '}
            <strong className="text-[#15803D]">{spatialBufferAnalysis.sheltersCount} shelters</strong> (
            {spatialBufferAnalysis.freeBedsInRing} free beds)
          </div>

          <button
            type="button"
            onClick={handleExportGisGeoJson}
            className="neu-btn px-3 py-1.5 text-[11px] font-bold text-[#0B8F80] flex items-center gap-1"
            title="Download RFC 7946 GeoJSON of all Alert Zones, Villages, CWC Rivers & GSI Faults"
          >
            <span>⬇ Export GIS GeoJSON</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          NATIONAL DISASTER RESILIENCE PLATFORM — INTEGRATED GIS COMMAND DECISION DECK
          (Hierarchical Geographic Selector · Categorized Layer Provenance ·
           Explainable Red Zone Classification · Restrictive Carrying Capacity ·
           MCDA Safe-Site Matching & Relocation Priority)
          ===================================================================== */}
      <GisCommandDecisionDeck
        selectedVillage={selectedVillage}
        onSelectVillageAndFly={(v) => {
          setSelectedVillage(v);
          flyToAndInspect(`${v.name} (${v.taluka}, ${v.district})`, v.lat, v.lng, 14.5);
        }}
        onRouteToCoords={(label, lat, lng) => {
          void handleGetDirectionsToCoords(label, lat, lng);
        }}
        layerCatalog={[
          {
            id: 'lyr-alert-zones',
            category: 'B. Hazard Layers',
            name: 'NDMA / SACHET CAP 4-Tier Alert Polygons',
            sourceAgency: 'IMD / NDMA / SDMA',
            freshness: 'Live Sync',
            provenance: 'LIVE',
            resolution: 'Vector Polygon (EPSG:4326)',
            enabled: showAlertZones,
            onToggle: () => setShowAlertZones((v) => !v),
          },
          {
            id: 'lyr-village-buffers',
            category: 'B. Hazard Layers',
            name: 'Habitation Hazard Buffer Rings (1.6 km)',
            sourceAgency: 'NIVARAN Spatial Engine',
            freshness: 'Real-Time Computed',
            provenance: 'VERIFIED',
            resolution: '1.6 km Geodesic Buffer',
            enabled: showVillageHazardBuffers,
            onToggle: () => setShowVillageHazardBuffers((v) => !v),
          },
          {
            id: 'lyr-cwc-rivers',
            category: 'B. Hazard Layers',
            name: 'CWC River Hydrology & Floodplain Channels',
            sourceAgency: 'Central Water Commission (CWC)',
            freshness: '2026 Monsoon Hydro-Network',
            provenance: 'VERIFIED',
            resolution: '1:50,000 Hydrography',
            enabled: showRiverHydrology,
            onToggle: () => setShowRiverHydrology((v) => !v),
          },
          {
            id: 'lyr-gsi-faults',
            category: 'B. Hazard Layers',
            name: 'GSI Landslide Scarps & Structural Lineaments',
            sourceAgency: 'Geological Survey of India (GSI)',
            freshness: 'Bhukosh Verified Archive',
            provenance: 'VERIFIED',
            resolution: '1:25,000 Escarpment Trace',
            enabled: showGsiFaultLines,
            onToggle: () => setShowGsiFaultLines((v) => !v),
          },
          {
            id: 'lyr-habitations',
            category: 'C. Population & Habitation',
            name: 'Monitored Vulnerable Habitations & Villages',
            sourceAgency: 'Census / District Revenue Dept',
            freshness: 'Verified Survey 2026',
            provenance: 'VERIFIED',
            resolution: 'Settlement Centroid + Bounds',
            enabled: showHabitations,
            onToggle: () => setShowHabitations((v) => !v),
          },
          {
            id: 'lyr-shelters',
            category: 'E. Relocation & Carrying Capacity',
            name: 'Relief Shelters & Safe-Zone Capacity Nodes',
            sourceAgency: 'DDMA / Relief Commissioner',
            freshness: 'Live Occupancy Feed',
            provenance: 'LIVE',
            resolution: 'Facility Point Precision',
            enabled: showShelters,
            onToggle: () => setShowShelters((v) => !v),
          },
          {
            id: 'lyr-incidents',
            category: 'F. Field Intelligence & Sensors',
            name: 'Verified Field Incidents & Citizen Reports',
            sourceAgency: 'SEOC / Tahsildar Field Verification',
            freshness: 'Real-Time Stream',
            provenance: 'LIVE',
            resolution: 'GPS Incident Pin',
            enabled: showIncidents,
            onToggle: () => setShowIncidents((v) => !v),
          },
          {
            id: 'lyr-volunteers',
            category: 'F. Field Intelligence & Sensors',
            name: 'Aapda Mitra & NDRF/SDRF Responder Telemetry',
            sourceAgency: 'NDMA Aapda Mitra / 5 Bn NDRF',
            freshness: 'Opt-In Live GPS',
            provenance: 'LIVE',
            resolution: '±15m GNSS',
            enabled: showVolunteers,
            onToggle: () => setShowVolunteers((v) => !v),
          },
          {
            id: 'lyr-3d-dem',
            category: 'A. Base Maps',
            name: '3D Terrain DEM Elevation Mesh (Terrarium)',
            sourceAgency: 'SRTM / AWS Terrain Tiles',
            freshness: '30m DEM Grid',
            provenance: 'IMPORTED',
            resolution: '30m Vertical DEM',
            enabled: is3D,
            onToggle: () => setIs3D((v) => !v),
          },
          {
            id: 'lyr-my-gps',
            category: 'D. Transportation & Evacuation',
            name: 'High-Precision User GNSS Location & Accuracy Ring',
            sourceAgency: 'Browser Geolocation API (WGS 84)',
            freshness: 'Continuous Watch',
            provenance: 'LIVE',
            resolution: `±${Math.round(gps.accuracyMeters)}m`,
            enabled: showMyLocation,
            onToggle: () => setShowMyLocation((v) => !v),
          },
        ]}
        gpsAccuracyMeters={gps.accuracyMeters}
        gpsQualityBadge={gps.qualityBadge}
        gpsLat={gps.lat}
        gpsLng={gps.lng}
        onLocateMe={handleLocateMe}
      />

      {/* =====================================================================
          CLICKED / SEARCHED LOCATION INSPECTOR CARD
          ===================================================================== */}
      {inspectedPoint && (
        <div className="neu-raised p-4 rounded-[14px] border-2 border-[#0B8F80] space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {inspectedPoint.label}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setInspectedPoint(null)}
              className="neu-btn p-1"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="neu-flat p-2.5 rounded-[8px]">
              <div className="text-[11px] text-[var(--text-secondary)]">Coordinates</div>
              <div className="font-mono font-bold text-[var(--text-primary)]">
                {inspectedPoint.lat.toFixed(5)}°N, {inspectedPoint.lng.toFixed(5)}°E
              </div>
            </div>
            <div className="neu-flat p-2.5 rounded-[8px]">
              <div className="text-[11px] text-[var(--text-secondary)]">Terrain Elevation</div>
              <div className="font-mono font-bold text-[#0B8F80]">
                {inspectedPoint.elevationM !== null
                  ? `${inspectedPoint.elevationM} m ASL`
                  : 'Fetching DEM...'}
              </div>
            </div>
            <div className="neu-flat p-2.5 rounded-[8px]">
              <div className="text-[11px] text-[var(--text-secondary)]">Live 24h Rainfall</div>
              <div className="font-mono font-bold text-[var(--text-primary)]">
                {inspectedPoint.rainfall24hMm !== null
                  ? `${inspectedPoint.rainfall24hMm} mm (${inspectedPoint.temperatureC}°C)`
                  : 'Loading Open-Meteo...'}
              </div>
            </div>
            <div className="neu-flat p-2.5 rounded-[8px] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setManualPin(inspectedPoint.lat, inspectedPoint.lng);
                  addToast({
                    title: 'My GPS Location set here',
                    message: `Updated your pin to ${inspectedPoint.lat.toFixed(5)}°N, ${inspectedPoint.lng.toFixed(5)}°E.`,
                    type: 'success',
                  });
                }}
                className="neu-btn px-2.5 py-1.5 font-bold text-[#0B8F80] w-full text-center"
              >
                Set My GPS Pin Here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SELECTED HABITATION / VILLAGE DETAIL CARD
          ===================================================================== */}
      {selectedVillage && (
        <div className="neu-raised p-4 rounded-[14px] border-2 border-[#0B8F80] space-y-3 text-xs">
          {(() => {
            const hScore = weightedScore(
              selectedVillage.hazardFactors,
              weights,
              selectedVillage.verifiedReportsCount
            );
            const rLevel = classifyHazard(hScore);
            const rColor = getRiskColor(rLevel);
            const nearestShelter = nearestThreeAvailableShelters[0]?.camp;

            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded text-xs font-bold text-white shadow-2xs"
                      style={{ backgroundColor: rColor }}
                    >
                      {rLevel} Risk ({(hScore * 100).toFixed(0)}/100)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-[11px] uppercase font-bold border border-slate-200 dark:border-slate-700">
                      Primary: {selectedVillage.primaryHazard}
                    </span>
                    {hScore > 0.75 ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-[#DC2626] font-bold text-[10.5px] border border-red-200 dark:border-red-900/60 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        AI Advisory: Immediate Relocation Recommended
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#16A078] font-bold text-[10.5px] border border-blue-200 dark:border-blue-900/60">
                        AI Advisory: Continuous Monitored Habitation
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-[#101C2C] dark:text-white flex items-center gap-1.5 pl-1">
                      <Home className="w-4 h-4 text-[#16A078]" strokeWidth={2} />
                      <span>
                        {selectedVillage.name} ({selectedVillage.taluka} Taluka,{' '}
                        {selectedVillage.district} District,{' '}
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{selectedVillage.state || 'Maharashtra'}</span>)
                      </span>
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedVillage(null);
                      if (villagePopupRef.current) {
                        villagePopupRef.current.remove();
                        villagePopupRef.current = null;
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Close details and release pin lock"
                  >
                    <X className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F]">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🌧️ Yearly Monsoon Rain</div>
                    <div className="font-bold text-[#16A078] text-xs mt-0.5">
                      {selectedVillage.annualRainfallMm ?? 3200} mm/yr
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">Extremely heavy rains</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F]">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🌊 River / Stream Distance</div>
                    <div className="font-bold text-[#0284C7] text-xs mt-0.5">
                      {Number(selectedVillage.riverDistKm ?? 1.2) < 1
                        ? `${Math.round(Number(selectedVillage.riverDistKm ?? 1.2) * 1000)} meters away`
                        : `${Number(selectedVillage.riverDistKm ?? 1.2).toFixed(2)} km away`}
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">
                      {Number(selectedVillage.riverDistKm ?? 1.2) < 0.5 ? 'High flash flood risk' : 'Safe flood buffer'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F]">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">🛖 Mud & Clay Houses at Risk</div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                      {selectedVillage.vulnerabilityFactors?.kutchaHousePct ?? 65}% of homes
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">Vulnerable to collapse</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F]">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">👵 Senior Citizens Needing Help</div>
                    <div className="font-bold text-purple-600 dark:text-purple-400 text-xs mt-0.5">
                      {selectedVillage.vulnerabilityFactors?.elderlyPct ?? 14}% elderly
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">Priority rescue assistance</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F]">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">⛰️ Hill Elevation & Slope</div>
                    <div className="font-bold text-[#101C2C] dark:text-white text-xs mt-0.5">
                      {selectedVillage.elevationM}m high · {selectedVillage.slopeDeg}°
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">Steep mountain slope</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F]">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">👥 Total People & Families</div>
                    <div className="font-bold text-[#101C2C] dark:text-white text-xs mt-0.5">
                      {selectedVillage.population.toLocaleString()} ({selectedVillage.households} HH)
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">Taluka PWD Road Access</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForecastModalVillage(selectedVillage);
                        setIsAiForecastModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer hover:scale-105"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI 7-Day Weather & Disaster Forecast</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleGetDirectionsToCoords(
                          selectedVillage.name,
                          selectedVillage.lat,
                          selectedVillage.lng
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-[#16A078] hover:bg-[#128865] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" strokeWidth={2} />
                      <span>Route from My GPS to {selectedVillage.name}</span>
                    </button>

                    {nearestShelter && (
                      <button
                        type="button"
                        onClick={() => void handleGetDirections(nearestShelter)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-[#16A078] hover:bg-slate-50 dark:hover:bg-[#1E3A5F] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" strokeWidth={2} />
                        <span>Route to Nearest Shelter ({nearestShelter.name})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleReturnToLiveLocation}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Crosshair className="w-3.5 h-3.5 text-[#14B8A6]" strokeWidth={2} />
                      <span>Return to Live GPS</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const payload = buildVillageExplainPayload(selectedVillage, weights);
                      openExplainModal(payload);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-[#172F46] border border-blue-200 dark:border-[#233C57] text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Explain Risk Scoring & Formula</span>
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          SELECTED SHELTER DETAIL CARD
          ===================================================================== */}
      {selectedShelter && (
        <div className="neu-raised p-4 rounded-[14px] border-2 border-[#0B8F80] space-y-3">
          {(() => {
            const meta = getShelterStatusMeta(selectedShelter);
            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-1 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: meta.colorHex }}
                    >
                      {meta.statusText} ({meta.pct}% full)
                    </span>
                    <span className="px-2 py-0.5 rounded neu-flat text-xs font-semibold capitalize">
                      {selectedShelter.shelterType || 'relief camp'}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {selectedShelter.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedShelter(null)}
                    className="neu-btn p-1"
                  >
                    <X className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="neu-flat p-2.5 rounded-[10px]">
                    <div className="text-[11px] text-[var(--text-secondary)]">Free Beds</div>
                    <div className="text-base font-mono font-bold text-[#15803D]">
                      {meta.freeBeds} / {selectedShelter.capacityPersons}
                    </div>
                  </div>
                  <div className="neu-flat p-2.5 rounded-[10px]">
                    <div className="text-[11px] text-[var(--text-secondary)]">Water & Food</div>
                    <div className="font-semibold">
                      Water: {selectedShelter.facilities.drinkingWater ? 'Yes' : 'No'} · Food:{' '}
                      {selectedShelter.facilities.communityKitchen ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="neu-flat p-2.5 rounded-[10px]">
                    <div className="text-[11px] text-[var(--text-secondary)]">Medical & Power</div>
                    <div className="font-semibold">
                      Medical: {selectedShelter.facilities.medicalDesk ? 'Yes' : 'No'} · Power:{' '}
                      {selectedShelter.facilities.generatorPower ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="neu-flat p-2.5 rounded-[10px]">
                    <div className="text-[11px] text-[var(--text-secondary)]">Contact In-Charge</div>
                    <a
                      href={`tel:${selectedShelter.contactPhone}`}
                      className="font-mono font-bold text-[#0B8F80] hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" strokeWidth={1.75} />
                      <span>{selectedShelter.contactPhone}</span>
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => void handleGetDirections(selectedShelter)}
                    className="neu-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" strokeWidth={1.75} />
                    <span>Get directions (OSRM route)</span>
                  </button>

                  {canManageShelter && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-secondary)] font-semibold">
                        Update occupancy:
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCampOccupancy(selectedShelter.id, -5)}
                        className="neu-btn px-2.5 py-1 font-mono font-bold"
                      >
                        -5
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={selectedShelter.capacityPersons}
                        value={selectedShelter.currentOccupancy}
                        onChange={(e) =>
                          setCampOccupancyExact(selectedShelter.id, Number(e.target.value))
                        }
                        className="neu-input w-20 px-2 py-1 text-center font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => updateCampOccupancy(selectedShelter.id, 5)}
                        className="neu-btn px-2.5 py-1 font-mono font-bold"
                      >
                        +5
                      </button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          SELECTED VOLUNTEER DETAIL CARD
          ===================================================================== */}
      {selectedVolunteer && !isCitizen && (
        <div className="neu-raised p-4 rounded-[14px] border-2 border-[#0B8F80] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#0B8F80] text-white text-xs font-bold">
                {selectedVolunteer.status}
              </span>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {selectedVolunteer.name} ({selectedVolunteer.district})
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedVolunteer(null)}
              className="neu-btn p-1"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="text-xs flex flex-wrap items-center gap-3">
            <span>
              <strong>Skills:</strong> {selectedVolunteer.skills.join(', ')}
            </span>
            <span>
              <strong>Last seen:</strong> {selectedVolunteer.lastSeen}
            </span>
            <a
              href={`tel:${selectedVolunteer.phone}`}
              className="font-mono font-bold text-[#0B8F80] underline"
            >
              {selectedVolunteer.phone}
            </a>
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Privacy Note: Live volunteer location is visible only to authorised roles and only while this volunteer has opted in to location sharing.
          </div>
        </div>
      )}

      {/* =====================================================================
          NEAREST 3 AVAILABLE SHELTERS FOR CURRENT LOCATION
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              'Nearest 3 Available Shelters for Your Current Location'
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Sorted by distance from your GPS coordinate ({gps.lat.toFixed(4)}°N, {gps.lng.toFixed(4)}°E)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {nearestThreeAvailableShelters.map(({ camp, distanceKm }) => {
            const meta = getShelterStatusMeta(camp);
            return (
              <div
                key={camp.id}
                className="neu-flat p-3.5 rounded-[12px] border border-[var(--border)] flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: meta.colorHex }}
                    >
                      {meta.statusText} · {meta.freeBeds} free beds
                    </span>
                    <span className="font-mono text-xs font-bold text-[#0B8F80]">
                      {distanceKm} km away
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{camp.name}</div>
                  <div className="text-[11px] text-[var(--text-secondary)] capitalize">
                    Type: {camp.shelterType || 'relief camp'} · {camp.district} ({camp.taluka})
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Water: {camp.facilities.drinkingWater ? 'Yes' : 'No'} · Food:{' '}
                    {camp.facilities.communityKitchen ? 'Yes' : 'No'} · Medical:{' '}
                    {camp.facilities.medicalDesk ? 'Yes' : 'No'} · Power:{' '}
                    {camp.facilities.generatorPower ? 'Yes' : 'No'}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
                  <a
                    href={`tel:${camp.contactPhone}`}
                    className="text-xs font-mono font-bold text-[var(--text-primary)] hover:text-[#0B8F80] flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                    <span>{camp.contactPhone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedShelter(camp);
                      void handleGetDirections(camp);
                    }}
                    className="neu-btn px-3 py-1.5 text-xs font-bold text-[#0B8F80] flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Get directions</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          ALL 360+ MAHARASHTRA MONITORED VILLAGES & HABITATIONS DIRECTORY
          ===================================================================== */}
      <div className="neu-raised p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Maharashtra Monitored Habitations & Villages Directory (370+ Mapped Villages)
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono text-[10.5px] font-bold">
                {villages.length} Villages Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              All 36 Districts and Talukas across Maharashtra. Click any village to fly and lock on map, inspect elevation, rainfall, slope, disaster probability %, and launch AI 7-day weather predictions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.flyTo({
                  center: [75.71, 19.75],
                  zoom: 7.2,
                  pitch: 0,
                  bearing: 0,
                  duration: 600,
                });
              }
            }}
            className="neu-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Reset Maharashtra Map View</span>
          </button>
        </div>

        {/* Division Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--border)]">
          <span className="text-[11px] font-bold text-slate-500 mr-1 uppercase tracking-wider">Division:</span>
          {['All', 'Pune', 'Konkan', 'Nashik', 'Chhatrapati Sambhajinagar', 'Amravati', 'Nagpur'].map((div) => (
            <button
              key={div}
              type="button"
              onClick={() => setMhDirectoryDivision(div)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                mhDirectoryDivision === div
                  ? 'bg-[#008060] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {div === 'All' ? `All Maharashtra (${villages.length})` : div}
            </button>
          ))}
        </div>

        {/* Directory Container: Scrollable List of All Villages */}
        <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-200/60 dark:border-slate-800 custom-scrollbar">
          {villages
            .filter((v) => {
              if (mhDirectoryDivision === 'Pune') return ['Pune', 'Satara', 'Kolhapur', 'Sangli', 'Solapur'].includes(v.district);
              if (mhDirectoryDivision === 'Konkan') return ['Raigad', 'Ratnagiri', 'Sindhudurg', 'Thane', 'Palghar', 'Mumbai City', 'Mumbai Suburban'].includes(v.district);
              if (mhDirectoryDivision === 'Nashik') return ['Nashik', 'Ahmednagar', 'Dhule', 'Nandurbar', 'Jalgaon'].includes(v.district);
              if (mhDirectoryDivision === 'Chhatrapati Sambhajinagar') return ['Chhatrapati Sambhajinagar', 'Jalna', 'Parbhani', 'Hingoli', 'Nanded', 'Beed', 'Latur', 'Dharashiv'].includes(v.district);
              if (mhDirectoryDivision === 'Amravati') return ['Amravati', 'Akola', 'Yavatmal', 'Buldhana', 'Washim'].includes(v.district);
              if (mhDirectoryDivision === 'Nagpur') return ['Nagpur', 'Wardha', 'Bhandara', 'Gondia', 'Chandrapur', 'Gadchiroli'].includes(v.district);
              return true;
            })
            .filter((v) => {
              const q = (villageSearchTerm.trim() || searchQuery.trim()).toLowerCase();
              if (!q) return true;
              return (
                v.name.toLowerCase().includes(q) ||
                v.taluka.toLowerCase().includes(q) ||
                v.district.toLowerCase().includes(q) ||
                v.primaryHazard?.toLowerCase().includes(q)
              );
            })
            .map((v) => {
              const hScore = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
              const rLevel = classifyHazard(hScore);
              const rColor = getRiskColor(rLevel);
              const isSelected = selectedVillage?.id === v.id;
              const disasterPct = Math.round(hScore * 100);

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    handleSelectVillageFromList(v);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-2xs hover:scale-105 transition-all cursor-pointer ${
                    isSelected ? 'ring-2 ring-white ring-offset-2 scale-105' : ''
                  }`}
                  style={{ backgroundColor: rColor }}
                  title={`Village: ${v.name} (${v.taluka}, ${v.district}) · Elevation: ${v.elevationM}m · Rainfall: ${v.annualRainfallMm}mm · Disaster Risk: ${disasterPct}%`}
                >
                  <span>🏡 {v.name}</span>
                  <span className="opacity-95 font-mono text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-bold">
                    {disasterPct}%
                  </span>
                  <span className="opacity-80 font-normal text-[10.5px]">({v.taluka})</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Map Provider & API Key Modal */}
      <MapProviderSettingsModal
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        onProviderChanged={handleProviderChanged}
      />

      {/* AI 7-Day Weather & Disaster Forecast Modal */}
      <VillageAiDisasterForecastModal
        village={forecastModalVillage}
        isOpen={isAiForecastModalOpen}
        onClose={() => setIsAiForecastModalOpen(false)}
        onNavigateToShelter={(v) => {
          void handleGetDirectionsToCoords(`${v.name} (${v.district})`, v.lat, v.lng);
        }}
      />

      {/* Multi-Village Geospatial & Climate Comparison Modal */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Village Multi-Hazard Geospatial Comparison
                  </h3>
                  <p className="text-xs text-slate-500">
                    Side-by-side AI climate susceptibility, terrain exposure, and relocation ranking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {/* Village Selector Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Village 1 (Baseline):</label>
                <select
                  value={compareVillage1Id}
                  onChange={(e) => setCompareVillage1Id(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.taluka}, {v.district})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Village 2 (Comparison):</label>
                <select
                  value={compareVillage2Id}
                  onChange={(e) => setCompareVillage2Id(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.taluka}, {v.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-Side Comparison Cards */}
            {(() => {
              const v1 = villages.find((v) => v.id === compareVillage1Id) || villages[0];
              const v2 = villages.find((v) => v.id === compareVillage2Id) || villages[1] || villages[0];
              const p1 = predictVillageClimateRisks(v1);
              const p2 = predictVillageClimateRisks(v2);

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Village 1 Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{v1.name}</h4>
                        <div className="text-xs text-slate-500">{v1.taluka} Taluka · {v1.district}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        p1.overallClimateVulnerability.tier === 'Red'
                          ? 'bg-rose-600 text-white'
                          : p1.overallClimateVulnerability.tier === 'Orange'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        CVI: {p1.overallClimateVulnerability.score}/100
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Flood Risk (FSI):</span>
                        <strong className="text-sky-700">{p1.flood.riskScore}/100 ({p1.flood.category})</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Landslide Risk (LSI):</span>
                        <strong className="text-rose-700">{p1.landslide.riskScore}/100 ({p1.landslide.category})</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Drought Vulnerability (DVI):</span>
                        <strong className="text-amber-700">{p1.drought.riskScore}/100 ({p1.drought.category})</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Terrain Elevation & Slope:</span>
                        <strong>{v1.elevationM}m MSL · {v1.slopeDeg}° slope</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Population & Kutcha %:</span>
                        <strong>{v1.population} pop · {v1.vulnerabilityFactors?.kutchaHousePct || 40}% kutcha</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Relocation Urgency:</span>
                        <strong className="text-purple-700">{p1.relocationPriority.priorityLevel}</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Safe Plateau Distance:</span>
                        <strong>{p1.relocationPriority.distanceToSafeZoneKm} km</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        handleSelectVillageFromList(v1);
                      }}
                      className="w-full neu-btn-primary py-2 text-xs font-semibold bg-[#008060] text-white flex items-center justify-center gap-1.5"
                    >
                      <span>Fly to {v1.name} on Map</span>
                    </button>
                  </div>

                  {/* Village 2 Card */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-base text-slate-900">{v2.name}</h4>
                        <div className="text-xs text-slate-500">{v2.taluka} Taluka · {v2.district}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        p2.overallClimateVulnerability.tier === 'Red'
                          ? 'bg-rose-600 text-white'
                          : p2.overallClimateVulnerability.tier === 'Orange'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        CVI: {p2.overallClimateVulnerability.score}/100
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Flood Risk (FSI):</span>
                        <strong className="text-sky-700">{p2.flood.riskScore}/100 ({p2.flood.category})</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Landslide Risk (LSI):</span>
                        <strong className="text-rose-700">{p2.landslide.riskScore}/100 ({p2.landslide.category})</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Drought Vulnerability (DVI):</span>
                        <strong className="text-amber-700">{p2.drought.riskScore}/100 ({p2.drought.category})</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Terrain Elevation & Slope:</span>
                        <strong>{v2.elevationM}m MSL · {v2.slopeDeg}° slope</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Population & Kutcha %:</span>
                        <strong>{v2.population} pop · {v2.vulnerabilityFactors?.kutchaHousePct || 40}% kutcha</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-200">
                        <span className="text-slate-600">Relocation Urgency:</span>
                        <strong className="text-purple-700">{p2.relocationPriority.priorityLevel}</strong>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Safe Plateau Distance:</span>
                        <strong>{p2.relocationPriority.distanceToSafeZoneKm} km</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsCompareModalOpen(false);
                        handleSelectVillageFromList(v2);
                      }}
                      className="w-full neu-btn-primary py-2 text-xs font-semibold bg-[#008060] text-white flex items-center justify-center gap-1.5"
                    >
                      <span>Fly to {v2.name} on Map</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
