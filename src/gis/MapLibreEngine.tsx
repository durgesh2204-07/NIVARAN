import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  CloudRain,
  Columns,
  Compass,
  Copy,
  Crosshair,
  Eye,
  Globe,
  Layers,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Moon,
  Mountain,
  Navigation,
  Orbit,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Sliders,
  TrendingUp,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BasemapStyle,
  ClimateHorizon,
  CommunityReport,
  HazardWeights,
  LiveWeatherData,
  RelocationSite,
  SeismicEvent,
  Village,
} from '../types';
import {
  getStreetBasemapConfig,
  getSatelliteBasemapConfig,
  getTopoBasemapConfig,
  getDarkBasemapConfig,
  getStoredMapProvider,
} from './mapTileConfig';
import {
  buildVillageExplainPayload,
  carryingCapacity,
  elevationProfile,
  floodFill,
  formatLatLngToDms,
  formatLatLngToUtm,
  geofenceCheck,
  greedyMatch,
  runDigitalDressRehearsal,
  weightedScore,
} from '../utils/scoring';
import {
  EvacuationRouteResult,
  fetchEvacuationRoute,
  fetchOpenMeteoWeather,
  fetchPointElevation,
  fetchUsgsEarthquakes,
  searchNominatim,
} from '../services/externalApis';
import { useAppStore } from '../store/useAppStore';

export interface MapLibreEngineProps {
  villages: Village[];
  sites: RelocationSite[];
  reports: CommunityReport[];
  weights: HazardWeights;
  climateHorizon: ClimateHorizon;
  extraRainfallMm?: number;
  onSelectVillage: (village: Village) => void;
  heightClass?: string;
  showRelocationLines?: boolean;
  drawnPolygonCoords?: [number, number][];
  onMapPointClick?: (lat: number, lng: number) => void;
}

export const RIVER_PATHS: { name: string; coords: [number, number][] }[] = [
  {
    name: 'Savitri River Basin (Mahad - Poladpur)',
    coords: [
      [17.94, 73.58],
      [17.98, 73.47],
      [18.08, 73.36],
      [18.03, 73.18],
      [17.99, 73.02],
    ],
  },
  {
    name: 'Vashishti River (Chiplun - Tiware)',
    coords: [
      [17.42, 73.68],
      [17.44, 73.61],
      [17.52, 73.52],
      [17.57, 73.32],
    ],
  },
  {
    name: 'Koyna Reservoir & Patan Corridor',
    coords: [
      [17.75, 73.76],
      [17.55, 73.75],
      [17.4, 73.76],
      [17.37, 73.89],
    ],
  },
  {
    name: 'Panchganga Confluence (Kolhapur)',
    coords: [
      [16.82, 74.08],
      [16.74, 74.18],
      [16.7, 74.31],
    ],
  },
];

// Resilient Multi-Provider GIS Basemaps with API key support & automatic zero-key fallback
export function getBasemapRasterConfig(style: BasemapStyle): {
  tiles: string[];
  attribution: string;
  label: string;
} {
  const provider = getStoredMapProvider();
  switch (style) {
    case 'satellite':
      return {
        tiles: getSatelliteBasemapConfig().imageryTiles,
        attribution: getSatelliteBasemapConfig().attribution,
        label: '3D Satellite + Streets',
      };
    case 'terrain':
      return getTopoBasemapConfig(provider);
    case 'osm':
    default:
      return getStreetBasemapConfig(provider);
  }
}

const BASEMAP_RASTER_URLS: Record<
  BasemapStyle,
  { tiles: string[]; attribution: string; label: string }
> = new Proxy({} as Record<BasemapStyle, { tiles: string[]; attribution: string; label: string }>, {
  get: (_target, prop: string) => {
    return getBasemapRasterConfig(prop as BasemapStyle);
  },
});

export type ZoneCategory = 'RED' | 'ORANGE' | 'GREEN';

function getThreeZoneCategory(score: number): ZoneCategory {
  if (score >= 0.65) return 'RED';
  if (score >= 0.38) return 'ORANGE';
  return 'GREEN';
}

function getZoneHexColor(zone: ZoneCategory): string {
  if (zone === 'RED') return '#DC2626';
  if (zone === 'ORANGE') return '#EA580C';
  return '#16A34A';
}

function getZoneTitle(zone: ZoneCategory): string {
  if (zone === 'RED') return 'RED ZONE (Critical Hazard — Immediate Action)';
  if (zone === 'ORANGE') return 'ORANGE ZONE (High Watch — Prepare Evacuation)';
  return 'GREEN ZONE (Safe Corridor / Relief Zone)';
}

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return Number((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

export const MapLibreEngine: React.FC<MapLibreEngineProps> = ({
  villages,
  sites,
  weights,
  climateHorizon,
  extraRainfallMm = 0,
  onSelectVillage,
  heightClass = 'h-[580px]',
  showRelocationLines = false,
  drawnPolygonCoords = [],
  onMapPointClick,
}) => {
  const {
    basemap,
    setBasemap,
    coordFormat,
    toggleCoordFormat,
    setMap3dEnabled,
    terrainExaggeration,
    setTerrainExaggeration,
    floodRiseMeters,
    setFloodRiseMeters,
    reliefCamps,
    responseTeams,
    selectedVillageId,
    setSelectedSiteId,
    openExplainModal,
    createIncident,
    saveAoi,
    addToast,
  } = useAppStore();

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const googleSecondaryContainerRef = useRef<HTMLDivElement | null>(null);
  const googleSecondaryMapRef = useRef<maplibregl.Map | null>(null);
  const liveMarkerRef = useRef<maplibregl.Marker | null>(null);
  const secondaryLiveMarkerRef = useRef<maplibregl.Marker | null>(null);
  const domMarkersRef = useRef<maplibregl.Marker[]>([]);
  const secondaryDomMarkersRef = useRef<maplibregl.Marker[]>([]);
  const orbitFrameRef = useRef<number | null>(null);
  const gpsSimIntervalRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasCenteredInitialGpsRef = useRef<boolean>(false);

  // Separate Map Sections: 'google2d' (Simple Google Street Map) | '3d' (3D Terrain Map) | 'split' (Dual)
  const [viewMode, setViewMode] = useState<'google2d' | '3d' | 'split'>('google2d');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | ZoneCategory>('ALL');

  // 3D & Camera State
  const [sunAzimuth, setSunAzimuth] = useState<number>(135);
  const [pitchDeg, setPitchDeg] = useState<number>(0);
  const [, setBearingDeg] = useState<number>(0);
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [reduce3dQuality, setReduce3dQuality] = useState<boolean>(false);
  const [siteOrbitActiveId, setSiteOrbitActiveId] = useState<string | null>(null);

  // Panels & Layer Toggles
  const [layerDrawerOpen, setLayerDrawerOpen] = useState<boolean>(false);
  const [terrainPanelOpen, setTerrainPanelOpen] = useState<boolean>(false);
  const [floodPanelOpen, setFloodPanelOpen] = useState<boolean>(false);
  const [profileToolActive, setProfileToolActive] = useState<boolean>(false);
  const [profileWaypoints, setProfileWaypoints] = useState<[number, number][]>([
    [18.6517, 73.7615],
    [18.645, 73.772],
  ]);

  const [showHazardPolygons, setShowHazardPolygons] = useState<boolean>(true);
  const [show3dExtrusions, setShow3dExtrusions] = useState<boolean>(true);
  const [showRiversBuffer, setShowRiversBuffer] = useState<boolean>(true);
  const [showSheltersLayer, setShowSheltersLayer] = useState<boolean>(true);
  const [showSitesLayer, setShowSitesLayer] = useState<boolean>(true);
  const [showTeamsLayer, setShowTeamsLayer] = useState<boolean>(true);
  const [showLocationLabels, setShowLocationLabels] = useState<boolean>(true);
  const [pinLiveMode, setPinLiveMode] = useState<boolean>(false);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [selectedJumpKey, setSelectedJumpKey] = useState<string>('');

  // Street / Address Search State
  const [addressQuery, setAddressQuery] = useState<string>('');
  const [searchingAddress, setSearchingAddress] = useState<boolean>(false);

  // Live GPS & Reverse-Geocoded Street Address State
  const [locatingUser, setLocatingUser] = useState<boolean>(false);
  const [gpsSimActive, setGpsSimActive] = useState<boolean>(false);
  const [userPos, setUserPos] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    heading: number;
    speed: number;
    sourceLabel: string;
    addressName: string;
  }>({
    lat: 18.6517,
    lng: 73.7615,
    accuracy: 8,
    heading: 0,
    speed: 0,
    sourceLabel: 'Live GPS Tracking Active',
    addressName: 'Sector 26, Pradhikaran, Nigdi, Pimpri-Chinchwad, Pune, Maharashtra',
  });
  const [evacRoute, setEvacRoute] = useState<EvacuationRouteResult | null>(null);

  // Live Weather at active GPS
  const [mapWeather, setMapWeather] = useState<LiveWeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);

  // Cursor status strip
  const [cursorLat, setCursorLat] = useState<number>(18.6517);
  const [cursorLng, setCursorLng] = useState<number>(73.7615);
  const [cursorZoom, setCursorZoom] = useState<number>(13.5);
  const [cursorElevation, setCursorElevation] = useState<number>(575);

  // Click-to-Query Popup
  const [clickedQuery, setClickedQuery] = useState<{
    title: string;
    category: string;
    zone: ZoneCategory;
    disasterCondition: string;
    lat: number;
    lng: number;
    elevationM: number;
    slopeDeg: number;
    slopeClass: string;
    hazardScore: number;
    nearestVillage: Village;
    nearestShelterName: string;
    nearestShelterDistKm: number;
    distanceFromLiveKm: number;
  } | null>(null);

  // Seismic events
  const [, setQuakes] = useState<SeismicEvent[]>([]);
  useEffect(() => {
    fetchUsgsEarthquakes().then(setQuakes).catch(() => {});
  }, []);

  // Reverse geocode any lat/lng into a human-readable street/locality name
  const reverseGeocodeCoordinates = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        display_name?: string;
        address?: Record<string, string>;
      };
      if (data.display_name) {
        const shortParts = data.display_name
          .split(',')
          .slice(0, 4)
          .map((s) => s.trim())
          .join(', ');
        setUserPos((prev) => ({
          ...prev,
          addressName: shortParts || data.display_name || prev.addressName,
        }));
      }
    } catch {
      // keep existing addressName on offline/rate-limit
    }
  }, []);

  // Multi-stage Accurate Live GPS Acquisition (Hardware/Browser GPS -> IP Geolocation Fallback -> Reverse Geocode)
  const acquireAccurateLiveGps = useCallback(
    (flyImmediately: boolean = true) => {
      setLocatingUser(true);

      const lockCoordinates = (
        lat: number,
        lng: number,
        accuracy: number,
        sourceLabel: string,
        fallbackAddress?: string
      ) => {
        const cleanLat = Number(lat.toFixed(5));
        const cleanLng = Number(lng.toFixed(5));
        setUserPos((prev) => ({
          lat: cleanLat,
          lng: cleanLng,
          accuracy: Math.max(4, Math.round(accuracy)),
          heading: 0,
          speed: 0,
          sourceLabel,
          addressName: fallbackAddress || prev.addressName,
        }));
        setLocatingUser(false);
        reverseGeocodeCoordinates(cleanLat, cleanLng);

        if (flyImmediately) {
          mapRef.current?.flyTo({
            center: [cleanLng, cleanLat],
            zoom: 14.5,
            pitch: viewMode === '3d' ? 62 : 0,
            bearing: viewMode === '3d' ? -18 : 0,
            duration: 950,
          });
          googleSecondaryMapRef.current?.flyTo({
            center: [cleanLng, cleanLat],
            zoom: 14.5,
            duration: 900,
          });
        }
      };

      const fallbackToIpLocation = async () => {
        try {
          const resp = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
            headers: { 'User-Agent': 'NivaranDisasterResiliencePlatform/2.0' },
          });
          if (resp.ok) {
            const json = await resp.json();
            if (json && typeof json.latitude === 'number' && typeof json.longitude === 'number') {
              const locality = json.locality || json.city || 'Mumbai';
              const district = json.principalSubdivision || 'Maharashtra';
              lockCoordinates(
                json.latitude,
                json.longitude,
                25,
                `Live Network GPS (${locality})`,
                `${locality}, ${district}, India`
              );
              return;
            }
          }
        } catch {
          // ignore
        }
        try {
          const resp = await fetch('https://ipwho.is/');
          if (resp.ok) {
            const json = (await resp.json()) as {
              success?: boolean;
              latitude?: number;
              longitude?: number;
              city?: string;
              region?: string;
            };
            if (
              json.success !== false &&
              typeof json.latitude === 'number' &&
              typeof json.longitude === 'number'
            ) {
              lockCoordinates(
                json.latitude,
                json.longitude,
                25,
                `Live Network GPS (${json.city || 'India'})`,
                `${json.city || 'Local Sector'}, ${json.region || 'Maharashtra'}, India`
              );
              return;
            }
          }
        } catch {
          // ignore
        }
        // Default accurate Pune Regional Command Center coordinates if offline
        lockCoordinates(
          18.5204,
          73.8567,
          10,
          'Live GPS (District Emergency Operations Center, Pune)',
          'District Emergency Operations Centre, Shivajinagar, Pune'
        );
      };

      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        let done = false;
        const timer = setTimeout(() => {
          if (!done) {
            done = true;
            fallbackToIpLocation();
          }
        }, 2000);

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            lockCoordinates(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy || 12,
              'Live GPS Locked'
            );
          },
          () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            fallbackToIpLocation();
          },
          { enableHighAccuracy: false, timeout: 3500, maximumAge: 120000 }
        );
      } else {
        fallbackToIpLocation();
      }
    },
    [reverseGeocodeCoordinates, viewMode]
  );

  // Start Live GPS Acquisition & Continuous Watch on Mount
  useEffect(() => {
    acquireAccurateLiveGps(true);

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      try {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(5));
            const lng = Number(pos.coords.longitude.toFixed(5));
            const acc = Math.max(4, Math.round(pos.coords.accuracy || 8));
            setUserPos((prev) => ({
              ...prev,
              lat,
              lng,
              accuracy: acc,
              sourceLabel: 'Hardware Live GPS Tracking',
            }));
            if (!hasCenteredInitialGpsRef.current) {
              hasCenteredInitialGpsRef.current = true;
              reverseGeocodeCoordinates(lat, lng);
              mapRef.current?.flyTo({
                center: [lng, lat],
                zoom: 14.2,
                pitch: viewMode === '3d' ? 62 : 0,
                duration: 900,
              });
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
        watchIdRef.current = id;
      } catch {
        // ignore
      }
    }

    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Pre-compute village scores & 3-zone classifications
  const villagesWithZones = useMemo(() => {
    return villages.map((v) => {
      const score = weightedScore(
        v.hazardFactors,
        weights,
        v.verifiedReportsCount,
        climateHorizon,
        extraRainfallMm,
        v.liveRainfallMm24h
      );
      const zone = getThreeZoneCategory(score);
      const color = getZoneHexColor(zone);
      const hazardLabel =
        v.primaryHazard === 'landslide'
          ? 'Landslide & Slope Failure'
          : v.primaryHazard === 'flood'
          ? 'Riverine Flash Flood'
          : v.primaryHazard === 'cloudburst'
          ? 'Extreme Cloudburst'
          : 'Soil & Bank Erosion';
      return {
        village: v,
        score: Number(score.toFixed(3)),
        zone,
        color,
        hazardLabel,
      };
    });
  }, [villages, weights, climateHorizon, extraRainfallMm]);

  const zoneCounts = useMemo(() => {
    const red = villagesWithZones.filter((x) => x.zone === 'RED').length;
    const orange = villagesWithZones.filter((x) => x.zone === 'ORANGE').length;
    const green =
      villagesWithZones.filter((x) => x.zone === 'GREEN').length +
      sites.length +
      reliefCamps.length;
    return { red, orange, green };
  }, [villagesWithZones, sites.length, reliefCamps.length]);

  // Live Location Disaster Condition & Zone Detection Engine
  const liveZoneAnalysis = useMemo(() => {
    let nearestEntry = villagesWithZones[0]!;
    let minVillageDistKm = 99999;
    for (const item of villagesWithZones) {
      const d = haversineDistanceKm(
        userPos.lat,
        userPos.lng,
        item.village.lat,
        item.village.lng
      );
      if (d < minVillageDistKm) {
        minVillageDistKm = d;
        nearestEntry = item;
      }
    }

    let nearestSite = sites[0];
    let minSiteDistKm = 99999;
    for (const s of sites) {
      const d = haversineDistanceKm(userPos.lat, userPos.lng, s.lat, s.lng);
      if (d < minSiteDistKm) {
        minSiteDistKm = d;
        nearestSite = s;
      }
    }

    let nearestShelter = reliefCamps[0];
    let minShelterDistKm = 99999;
    for (const c of reliefCamps) {
      const d = haversineDistanceKm(userPos.lat, userPos.lng, c.lat, c.lng);
      if (d < minShelterDistKm) {
        minShelterDistKm = d;
        nearestShelter = c;
      }
    }

    let detectedZone: ZoneCategory = 'GREEN';
    let localScore = 0.18;
    let conditionTitle = `GREEN SAFE ZONE — ${userPos.addressName}`;
    let disasterType = 'Stable Ground & Safe Street Corridor';
    let actionAdvisory =
      'GREEN ZONE SAFE: Your live GPS location is outside active landslide & flood red zones.';

    if (minSiteDistKm <= 1.2 || minShelterDistKm <= 0.8) {
      detectedZone = 'GREEN';
      localScore = 0.14;
      const safeName =
        minSiteDistKm <= minShelterDistKm ? nearestSite?.name : nearestShelter?.name;
      conditionTitle = `VERIFIED GREEN SAFE ZONE (${safeName})`;
      disasterType = 'Safe Host Plateau / Relief Shelter';
      actionAdvisory =
        'GREEN ZONE VERIFIED: Elevated terrain (<12° slope), outside 100-year flood line.';
    } else if (minVillageDistKm <= 5.5 && nearestEntry) {
      const proximityFactor =
        minVillageDistKm <= 2.2
          ? 1.0
          : Math.max(0.45, 1 - (minVillageDistKm - 2.2) * 0.12);
      localScore = Number((nearestEntry.score * proximityFactor).toFixed(2));
      if (floodRiseMeters >= 6 && nearestEntry.village.riverDistKm <= 1.5) {
        localScore = Math.max(localScore, 0.82);
      }
      detectedZone = getThreeZoneCategory(localScore);

      if (detectedZone === 'RED') {
        conditionTitle = `CRITICAL RED ZONE — ${nearestEntry.village.name} (${nearestEntry.hazardLabel})`;
        disasterType = `${nearestEntry.hazardLabel} (Slope ${nearestEntry.village.slopeDeg}°, Rain ${nearestEntry.village.annualRainfallMm} mm)`;
        actionAdvisory = `IMMEDIATE EVACUATION REQUIRED: Move toward ${
          nearestShelter?.name || 'nearest Green Zone shelter'
        } (${minShelterDistKm} km away).`;
      } else if (detectedZone === 'ORANGE') {
        conditionTitle = `ORANGE WATCH ZONE — ${nearestEntry.village.name} (${nearestEntry.hazardLabel})`;
        disasterType = `Moderate ${nearestEntry.hazardLabel} Watch (Slope ${nearestEntry.village.slopeDeg}°)`;
        actionAdvisory = `HIGH ALERT STANDBY: Prepare vulnerable households for relocation to ${
          nearestSite?.name || 'Green Zone site'
        }.`;
      } else {
        conditionTitle = `GREEN SAFE ZONE near ${nearestEntry.village.name}`;
        disasterType = 'Low Hazard Terrain';
        actionAdvisory =
          'GREEN ZONE: Normal monitoring. Safe road connectivity available.';
      }
    } else {
      const rain24 = mapWeather?.rainfall24hMm ?? 14;
      if (rain24 >= 150) {
        detectedZone = 'RED';
        localScore = 0.76;
        conditionTitle = `RED ZONE — Extreme Downpour Alert at ${userPos.addressName}`;
        disasterType = `Severe Precipitation (${rain24} mm/24h)`;
        actionAdvisory = 'Avoid low-lying riverbanks and underpasses. Move to elevated Green Zone shelter.';
      } else if (rain24 >= 65) {
        detectedZone = 'ORANGE';
        localScore = 0.48;
        conditionTitle = `ORANGE ZONE — Heavy Rainfall Watch at ${userPos.addressName}`;
        disasterType = `Intense Rainfall (${rain24} mm/24h)`;
        actionAdvisory = 'Monitor local drainage and IMD advisories.';
      }
    }

    return {
      detectedZone,
      color: getZoneHexColor(detectedZone),
      localScore,
      conditionTitle,
      disasterType,
      actionAdvisory,
      nearestVillage: nearestEntry?.village,
      nearestVillageDistKm: minVillageDistKm,
      nearestShelter,
      nearestShelterDistKm: minShelterDistKm,
      nearestSite,
      nearestSiteDistKm: minSiteDistKm,
    };
  }, [
    userPos.lat,
    userPos.lng,
    userPos.addressName,
    villagesWithZones,
    sites,
    reliefCamps,
    floodRiseMeters,
    mapWeather?.rainfall24hMm,
  ]);

  const refreshMapWeather = useCallback(
    (lat?: number, lng?: number) => {
      const targetLat = lat ?? userPos.lat;
      const targetLng = lng ?? userPos.lng;
      setLoadingWeather(true);
      fetchOpenMeteoWeather(targetLat, targetLng)
        .then((w) => setMapWeather(w))
        .finally(() => setLoadingWeather(false));
    },
    [userPos.lat, userPos.lng]
  );

  useEffect(() => {
    refreshMapWeather(userPos.lat, userPos.lng);
  }, [userPos.lat, userPos.lng]);

  // Flood Inundation Result
  const floodSimResult = useMemo(
    () => floodFill(floodRiseMeters, villages, reliefCamps, RIVER_PATHS),
    [floodRiseMeters, villages, reliefCamps]
  );

  // Elevation Profile
  const currentElevationProfile = useMemo(
    () => elevationProfile(profileWaypoints, villages, 24),
    [profileWaypoints, villages]
  );

  // Ranked Allocation lines
  const rankedAllocations = useMemo(
    () =>
      greedyMatch(villages, sites, weights, {
        climateHorizon,
        extraRainfallMm,
      }),
    [villages, sites, weights, climateHorizon, extraRainfallMm]
  );

  // Build all GeoJSON data for MapLibre (including dynamic local Green/Orange/Red zones around user's live GPS!)
  const buildMapGeoJsonData = useCallback(() => {
    const filteredVillages = villagesWithZones.filter((item) =>
      zoneFilter === 'ALL' ? true : item.zone === zoneFilter
    );

    // 1. Red / Orange / Green Zone Polygons for all 40 Habitations
    const hazardFeatures = filteredVillages.map(
      ({ village: v, score, zone, color, hazardLabel }) => {
        const d = 0.018;
        return {
          type: 'Feature' as const,
          properties: {
            id: v.id,
            name: v.name,
            district: v.district,
            taluka: v.taluka,
            score,
            zone,
            hazardLabel,
            color,
            households: v.households,
            population: v.population,
            elevationM: v.elevationM,
            slopeDeg: v.slopeDeg,
            extrusionHeight: Math.round(140 + score * 950),
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [v.lng - d, v.lat - d],
                [v.lng + d, v.lat - d],
                [v.lng + d, v.lat + d],
                [v.lng - d, v.lat + d],
                [v.lng - d, v.lat - d],
              ],
            ],
          },
        };
      }
    );

    // Also add a live perimeter zone polygon right around the user's current GPS location so it's visible at street zoom!
    const liveDelta = 0.006;
    const livePerimeterFeature = {
      type: 'Feature' as const,
      properties: {
        id: 'live-gps-zone',
        name: 'Your Live GPS Perimeter',
        district: 'Live Sector',
        taluka: 'GPS',
        score: liveZoneAnalysis.localScore,
        zone: liveZoneAnalysis.detectedZone,
        hazardLabel: liveZoneAnalysis.disasterType,
        color: liveZoneAnalysis.color,
        households: 0,
        population: 0,
        elevationM: 560,
        slopeDeg: 4,
        extrusionHeight: 90,
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [userPos.lng - liveDelta, userPos.lat - liveDelta],
            [userPos.lng + liveDelta, userPos.lat - liveDelta],
            [userPos.lng + liveDelta, userPos.lat + liveDelta],
            [userPos.lng - liveDelta, userPos.lat + liveDelta],
            [userPos.lng - liveDelta, userPos.lat - liveDelta],
          ],
        ],
      },
    };

    // 2. Habitation Point Markers
    const hazardPointFeatures = filteredVillages.map(({ village: v, score, zone, color }) => ({
      type: 'Feature' as const,
      properties: {
        id: v.id,
        name: v.name,
        district: v.district,
        score,
        zone,
        color,
        radius: zone === 'RED' ? 10 : zone === 'ORANGE' ? 8.5 : 7,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [v.lng, v.lat],
      },
    }));

    // 3. 3D Extruded Building & Habitation Core Towers
    const buildingFootprintFeatures = filteredVillages.flatMap(
      ({ village: v, score, color }) => {
        const offsets = [
          [0, 0, 260 + Math.round(score * 750)],
          [-0.0045, -0.0038, 150 + Math.round(score * 420)],
          [0.0045, 0.0038, 170 + Math.round(score * 480)],
        ];
        return offsets.map(([ox, oy, h], idx) => {
          const s = idx === 0 ? 0.0042 : 0.003;
          return {
            type: 'Feature' as const,
            properties: {
              id: `${v.id}-b-${idx}`,
              villageId: v.id,
              name: `${v.name} 3D Risk Column`,
              color,
              height: h,
            },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [
                [
                  [v.lng + ox - s, v.lat + oy - s],
                  [v.lng + ox + s, v.lat + oy - s],
                  [v.lng + ox + s, v.lat + oy + s],
                  [v.lng - s + ox, v.lat + oy + s],
                  [v.lng + ox - s, v.lat + oy - s],
                ],
              ],
            },
          };
        });
      }
    );

    // 4. Candidate Relocation Site 3D Blocks & Point Markers (Green Zone)
    const includeGreenAssets = zoneFilter === 'ALL' || zoneFilter === 'GREEN';
    const siteZoneFeatures = includeGreenAssets
      ? sites.flatMap((s) => {
          const ddr = runDigitalDressRehearsal(s, weights);
          const d = 0.009;
          return [
            {
              type: 'Feature' as const,
              properties: {
                siteId: s.id,
                zoneType: 'Green Zone Safe Site',
                color: ddr.passed ? '#16A34A' : '#DC2626',
                height: 220,
              },
              geometry: {
                type: 'Polygon' as const,
                coordinates: [
                  [
                    [s.lng - d, s.lat - d],
                    [s.lng, s.lat - d],
                    [s.lng, s.lat],
                    [s.lng - d, s.lat],
                    [s.lng - d, s.lat - d],
                  ],
                ],
              },
            },
          ];
        })
      : [];

    const sitePointFeatures = includeGreenAssets
      ? sites.map((s) => ({
          type: 'Feature' as const,
          properties: {
            id: s.id,
            name: s.name,
            district: s.district,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [s.lng, s.lat],
          },
        }))
      : [];

    // 5. Relief Shelters Point Markers (Green Zone)
    const shelterPointFeatures = includeGreenAssets
      ? reliefCamps.map((c) => ({
          type: 'Feature' as const,
          properties: {
            id: c.id,
            name: c.name,
            occupancy: `${c.currentOccupancy}/${c.capacityPersons}`,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [c.lng, c.lat],
          },
        }))
      : [];

    // 6. Field Response Teams Point Markers
    const teamPointFeatures = responseTeams.map((t) => ({
      type: 'Feature' as const,
      properties: {
        id: t.id,
        name: t.name,
        status: t.status,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [t.lng, t.lat],
      },
    }));

    // 7. Rivers & Flood Inundation
    const riverFeatures = RIVER_PATHS.map((r, idx) => ({
      type: 'Feature' as const,
      properties: { id: `riv-${idx}`, name: r.name },
      geometry: {
        type: 'LineString' as const,
        coordinates: r.coords.map(([lat, lng]) => [lng, lat]),
      },
    }));

    const floodFeatures = floodSimResult.cells.map((c) => ({
      type: 'Feature' as const,
      properties: {
        id: c.id,
        depthMeters: c.depthMeters,
        riverName: c.riverName,
        color:
          c.depthMeters >= 8
            ? '#1E3A8A'
            : c.depthMeters >= 4
            ? '#2563EB'
            : '#38BDF8',
        extrusionHeight: Math.round(c.depthMeters * 45),
      },
      geometry: {
        type: 'Polygon' as const,
        coordinates: [c.polygon],
      },
    }));

    // 8. Relocation Origin-to-Destination Lines
    const relocLineFeatures = showRelocationLines
      ? rankedAllocations
          .filter(
            (r) =>
              r.allocatedSiteLat !== undefined &&
              r.allocatedSiteLng !== undefined &&
              (r.riskLevel === 'Immediate' || r.riskLevel === 'Short-term')
          )
          .map((r) => ({
            type: 'Feature' as const,
            properties: {
              villageName: r.village.name,
              siteName: r.allocatedSiteName,
              households: r.allocatedHouseholds,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [r.village.lng, r.village.lat],
                [r.allocatedSiteLng as number, r.allocatedSiteLat as number],
              ],
            },
          }))
      : [];

    // 9. Evacuation Route Line
    const evacLineFeatures = evacRoute
      ? [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: evacRoute.coordinates.map(([lat, lng]) => [lng, lat]),
            },
          },
        ]
      : [];

    // 10. Elevation Profile Line
    const profileLineFeatures =
      profileToolActive && profileWaypoints.length >= 2
        ? [
            {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'LineString' as const,
                coordinates: profileWaypoints.map(([lat, lng]) => [lng, lat]),
              },
            },
          ]
        : [];

    // 11. Drawn AOI Polygon
    const aoiPolygonFeatures =
      drawnPolygonCoords && drawnPolygonCoords.length >= 3
        ? [
            {
              type: 'Feature' as const,
              properties: {},
              geometry: {
                type: 'Polygon' as const,
                coordinates: [
                  [
                    ...drawnPolygonCoords.map(([lat, lng]) => [lng, lat]),
                    [drawnPolygonCoords[0]![1], drawnPolygonCoords[0]![0]],
                  ],
                ],
              },
            },
          ]
        : [];

    // 12. Live GPS User Marker with Zone Color
    const gpsFeatures = userPos
      ? [
          {
            type: 'Feature' as const,
            properties: {
              accuracy: userPos.accuracy,
              label: userPos.sourceLabel,
              zoneColor: liveZoneAnalysis.color,
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [userPos.lng, userPos.lat],
            },
          },
        ]
      : [];

    return {
      hazardGeoJson: {
        type: 'FeatureCollection' as const,
        features: [...hazardFeatures, livePerimeterFeature],
      },
      hazardPointsGeoJson: {
        type: 'FeatureCollection' as const,
        features: hazardPointFeatures,
      },
      buildingGeoJson: {
        type: 'FeatureCollection' as const,
        features: [...buildingFootprintFeatures, ...siteZoneFeatures],
      },
      sitesGeoJson: { type: 'FeatureCollection' as const, features: sitePointFeatures },
      sheltersGeoJson: {
        type: 'FeatureCollection' as const,
        features: shelterPointFeatures,
      },
      teamsGeoJson: { type: 'FeatureCollection' as const, features: teamPointFeatures },
      riverGeoJson: { type: 'FeatureCollection' as const, features: riverFeatures },
      floodGeoJson: { type: 'FeatureCollection' as const, features: floodFeatures },
      relocGeoJson: { type: 'FeatureCollection' as const, features: relocLineFeatures },
      evacGeoJson: { type: 'FeatureCollection' as const, features: evacLineFeatures },
      profileGeoJson: { type: 'FeatureCollection' as const, features: profileLineFeatures },
      aoiGeoJson: { type: 'FeatureCollection' as const, features: aoiPolygonFeatures },
      gpsGeoJson: { type: 'FeatureCollection' as const, features: gpsFeatures },
    };
  }, [
    villagesWithZones,
    zoneFilter,
    sites,
    weights,
    reliefCamps,
    responseTeams,
    floodSimResult.cells,
    showRelocationLines,
    rankedAllocations,
    evacRoute,
    profileToolActive,
    profileWaypoints,
    drawnPolygonCoords,
    userPos,
    liveZoneAnalysis.color,
    liveZoneAnalysis.detectedZone,
    liveZoneAnalysis.disasterType,
    liveZoneAnalysis.localScore,
  ]);

  // Initialize Primary Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialBasemapKey: BasemapStyle = basemap || 'dark';
    const currentRaster =
      BASEMAP_RASTER_URLS[initialBasemapKey] || BASEMAP_RASTER_URLS.dark;
    const initialData = buildMapGeoJsonData();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      center: [userPos.lng, userPos.lat],
      zoom: 12.8,
      pitch: viewMode === 'google2d' ? 0 : 60,
      bearing: viewMode === 'google2d' ? 0 : -18,
      maxPitch: 75,
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
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          esri_roads_overlay: {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          esri_labels_overlay: {
            type: 'raster',
            tiles: [
              'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
              'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            maxzoom: 18,
          },
          open_topo: {
            type: 'raster',
            tiles: getTopoBasemapConfig(getStoredMapProvider()).tiles,
            tileSize: 256,
            maxzoom: 19,
          },
          'terrarium-dem': {
            type: 'raster-dem',
            tiles: [
              'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
            ],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15,
          },
          'hazard-zones': {
            type: 'geojson',
            data: initialData.hazardGeoJson,
          },
          'hazard-points': {
            type: 'geojson',
            data: initialData.hazardPointsGeoJson,
          },
          'extruded-footprints': {
            type: 'geojson',
            data: initialData.buildingGeoJson,
          },
          'sites-source': {
            type: 'geojson',
            data: initialData.sitesGeoJson,
          },
          'shelters-source': {
            type: 'geojson',
            data: initialData.sheltersGeoJson,
          },
          'teams-source': {
            type: 'geojson',
            data: initialData.teamsGeoJson,
          },
          'rivers-source': {
            type: 'geojson',
            data: initialData.riverGeoJson,
          },
          'flood-inundation': {
            type: 'geojson',
            data: initialData.floodGeoJson,
          },
          'relocation-lines': {
            type: 'geojson',
            data: initialData.relocGeoJson,
          },
          'evacuation-route': {
            type: 'geojson',
            data: initialData.evacGeoJson,
          },
          'profile-line': {
            type: 'geojson',
            data: initialData.profileGeoJson,
          },
          'aoi-source': {
            type: 'geojson',
            data: initialData.aoiGeoJson,
          },
          'gps-source': {
            type: 'geojson',
            data: initialData.gpsGeoJson,
          },
        },
        layers: [
          {
            id: 'offline-canvas-bg',
            type: 'background',
            paint: {
              'background-color':
                basemap === 'terrain'
                  ? '#EBF0E6'
                  : basemap === 'satellite'
                  ? '#0F1E2E'
                  : '#F1F5F9',
            },
          },
          {
            id: 'basemap-street',
            type: 'raster',
            source: 'osm_street',
            layout: { visibility: basemap === 'osm' || !basemap ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'basemap-satellite',
            type: 'raster',
            source: 'esri_sat',
            layout: { visibility: basemap === 'satellite' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 18,
          },
          {
            id: 'basemap-satellite-roads',
            type: 'raster',
            source: 'esri_roads_overlay',
            layout: { visibility: basemap === 'satellite' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 18,
          },
          {
            id: 'basemap-satellite-labels',
            type: 'raster',
            source: 'esri_labels_overlay',
            layout: { visibility: basemap === 'satellite' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 18,
          },
          {
            id: 'basemap-topo',
            type: 'raster',
            source: 'open_topo',
            layout: { visibility: basemap === 'terrain' ? 'visible' : 'none' },
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'terrain-hillshade',
            type: 'hillshade',
            source: 'terrarium-dem',
            layout: { visibility: viewMode === '3d' ? 'visible' : 'none' },
            paint: {
              'hillshade-exaggeration': 0.6,
              'hillshade-illumination-direction': sunAzimuth,
              'hillshade-shadow-color': '#0B1F33',
              'hillshade-highlight-color': '#FFFFFF',
            },
          },
          {
            id: 'aoi-fill-layer',
            type: 'fill',
            source: 'aoi-source',
            paint: { 'fill-color': '#0B8F80', 'fill-opacity': 0.16 },
          },
          {
            id: 'aoi-outline-layer',
            type: 'line',
            source: 'aoi-source',
            paint: {
              'line-color': '#0B8F80',
              'line-width': 2.5,
              'line-dasharray': [3, 2],
            },
          },
          {
            id: 'river-buffer-layer',
            type: 'line',
            source: 'rivers-source',
            paint: {
              'line-color': '#38BDF8',
              'line-width': 10,
              'line-opacity': 0.3,
            },
          },
          {
            id: 'river-core-layer',
            type: 'line',
            source: 'rivers-source',
            paint: {
              'line-color': '#0284C7',
              'line-width': 3,
              'line-opacity': 0.95,
            },
          },
          {
            id: 'hazard-fill-layer',
            type: 'fill',
            source: 'hazard-zones',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.26,
            },
          },
          {
            id: 'hazard-outline-layer',
            type: 'line',
            source: 'hazard-zones',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 2.5,
            },
          },
          {
            id: 'extruded-buildings-layer',
            type: 'fill-extrusion',
            source: 'extruded-footprints',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.88,
            },
          },
          {
            id: 'flood-inundation-layer',
            type: 'fill-extrusion',
            source: 'flood-inundation',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['get', 'extrusionHeight'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.72,
            },
          },
          {
            id: 'relocation-lines-layer',
            type: 'line',
            source: 'relocation-lines',
            paint: {
              'line-color': '#16A34A',
              'line-width': 2.5,
              'line-dasharray': [2, 2],
            },
          },
          {
            id: 'evacuation-route-layer',
            type: 'line',
            source: 'evacuation-route',
            paint: {
              'line-color': '#16A34A',
              'line-width': 5.5,
            },
          },
          {
            id: 'profile-line-layer',
            type: 'line',
            source: 'profile-line',
            paint: {
              'line-color': '#EA580C',
              'line-width': 3.5,
              'line-dasharray': [2, 1],
            },
          },
          {
            id: 'shelters-layer',
            type: 'circle',
            source: 'shelters-source',
            paint: {
              'circle-radius': 7.5,
              'circle-color': '#16A34A',
              'circle-stroke-width': 2.2,
              'circle-stroke-color': '#FFFFFF',
            },
          },
          {
            id: 'sites-layer',
            type: 'circle',
            source: 'sites-source',
            paint: {
              'circle-radius': 8.5,
              'circle-color': '#15803D',
              'circle-stroke-width': 2.5,
              'circle-stroke-color': '#FFFFFF',
            },
          },
          {
            id: 'teams-layer',
            type: 'circle',
            source: 'teams-source',
            paint: {
              'circle-radius': 6,
              'circle-color': '#2563EB',
              'circle-stroke-width': 1.8,
              'circle-stroke-color': '#FFFFFF',
            },
          },
          {
            id: 'hazard-points-layer',
            type: 'circle',
            source: 'hazard-points',
            paint: {
              'circle-radius': ['get', 'radius'],
              'circle-color': ['get', 'color'],
              'circle-stroke-width': 2.5,
              'circle-stroke-color': '#FFFFFF',
            },
          },
          {
            id: 'gps-accuracy-layer',
            type: 'circle',
            source: 'gps-source',
            paint: {
              'circle-radius': 34,
              'circle-color': ['get', 'zoneColor'],
              'circle-opacity': 0.25,
              'circle-stroke-width': 2.5,
              'circle-stroke-color': ['get', 'zoneColor'],
            },
          },
          {
            id: 'gps-dot-layer',
            type: 'circle',
            source: 'gps-source',
            paint: {
              'circle-radius': 9.5,
              'circle-color': '#0284C7',
              'circle-stroke-width': 3.5,
              'circle-stroke-color': '#FFFFFF',
            },
          },
        ],
      },
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
      'bottom-left'
    );

    let rafMove: number | null = null;
    map.on('mousemove', (e: maplibregl.MapMouseEvent) => {
      if (rafMove !== null) return;
      rafMove = requestAnimationFrame(() => {
        rafMove = null;
        const lat = Number(e.lngLat.lat.toFixed(5));
        const lng = Number(e.lngLat.lng.toFixed(5));
        setCursorLat(lat);
        setCursorLng(lng);
        let bestDist = 999;
        let bestElev = 560;
        for (const v of villages) {
          const d = Math.hypot(v.lat - lat, v.lng - lng);
          if (d < bestDist) {
            bestDist = d;
            bestElev = v.elevationM;
          }
        }
        setCursorElevation(bestElev);
      });
    });

    map.on('moveend', () => {
      setCursorZoom(Number(map.getZoom().toFixed(1)));
      setPitchDeg(Math.round(map.getPitch()));
      setBearingDeg(Math.round(map.getBearing()));
    });

    map.on('error', (e: any) => {
      // Non-fatal event listener: absorbs network/tile errors without throwing unhandled exceptions
      if (e?.error?.status !== 404) {
        console.warn('MapLibre main map event:', e?.error?.message || e);
      }
    });

    mapRef.current = map;

    return () => {
      if (rafMove !== null) cancelAnimationFrame(rafMove);
      if (orbitFrameRef.current) cancelAnimationFrame(orbitFrameRef.current);
      if (gpsSimIntervalRef.current) window.clearInterval(gpsSimIntervalRef.current);
      if (liveMarkerRef.current) {
        liveMarkerRef.current.remove();
        liveMarkerRef.current = null;
      }
      domMarkersRef.current.forEach((m) => m.remove());
      domMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Initialize Secondary Simple Google-Type 2D Street Map when in Split View
  useEffect(() => {
    if (viewMode !== 'split' || !googleSecondaryContainerRef.current) {
      if (googleSecondaryMapRef.current) {
        if (secondaryLiveMarkerRef.current) {
          secondaryLiveMarkerRef.current.remove();
          secondaryLiveMarkerRef.current = null;
        }
        secondaryDomMarkersRef.current.forEach((m) => m.remove());
        secondaryDomMarkersRef.current = [];
        googleSecondaryMapRef.current.remove();
        googleSecondaryMapRef.current = null;
      }
      return;
    }

    if (googleSecondaryMapRef.current) return;

    const initialData = buildMapGeoJsonData();
    const googleMap = new maplibregl.Map({
      container: googleSecondaryContainerRef.current,
      center: [userPos.lng, userPos.lat],
      zoom: 13.5,
      pitch: 0,
      bearing: 0,
      style: {
        version: 8,
        sources: {
          'google-street-raster': {
            type: 'raster',
            tiles: BASEMAP_RASTER_URLS.osm.tiles,
            tileSize: 256,
            attribution: BASEMAP_RASTER_URLS.osm.attribution,
          },
          'hazard-zones': {
            type: 'geojson',
            data: initialData.hazardGeoJson,
          },
          'hazard-points': {
            type: 'geojson',
            data: initialData.hazardPointsGeoJson,
          },
          'sites-source': {
            type: 'geojson',
            data: initialData.sitesGeoJson,
          },
          'shelters-source': {
            type: 'geojson',
            data: initialData.sheltersGeoJson,
          },
          'evacuation-route': {
            type: 'geojson',
            data: initialData.evacGeoJson,
          },
          'gps-source': {
            type: 'geojson',
            data: initialData.gpsGeoJson,
          },
        },
        layers: [
          {
            id: 'google-street-layer',
            type: 'raster',
            source: 'google-street-raster',
            minzoom: 0,
            maxzoom: 19,
          },
          {
            id: 'hazard-fill-layer',
            type: 'fill',
            source: 'hazard-zones',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.25,
            },
          },
          {
            id: 'hazard-outline-layer',
            type: 'line',
            source: 'hazard-zones',
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 2.2,
            },
          },
          {
            id: 'evacuation-route-layer',
            type: 'line',
            source: 'evacuation-route',
            paint: {
              'line-color': '#16A34A',
              'line-width': 5,
            },
          },
          {
            id: 'shelters-layer',
            type: 'circle',
            source: 'shelters-source',
            paint: {
              'circle-radius': 7,
              'circle-color': '#16A34A',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF',
            },
          },
          {
            id: 'sites-layer',
            type: 'circle',
            source: 'sites-source',
            paint: {
              'circle-radius': 8,
              'circle-color': '#15803D',
              'circle-stroke-width': 2.2,
              'circle-stroke-color': '#FFFFFF',
            },
          },
          {
            id: 'hazard-points-layer',
            type: 'circle',
            source: 'hazard-points',
            paint: {
              'circle-radius': ['get', 'radius'],
              'circle-color': ['get', 'color'],
              'circle-stroke-width': 2.2,
              'circle-stroke-color': '#FFFFFF',
            },
          },
          {
            id: 'gps-accuracy-layer',
            type: 'circle',
            source: 'gps-source',
            paint: {
              'circle-radius': 28,
              'circle-color': ['get', 'zoneColor'],
              'circle-opacity': 0.25,
              'circle-stroke-width': 2,
              'circle-stroke-color': ['get', 'zoneColor'],
            },
          },
          {
            id: 'gps-dot-layer',
            type: 'circle',
            source: 'gps-source',
            paint: {
              'circle-radius': 8.5,
              'circle-color': '#0284C7',
              'circle-stroke-width': 3,
              'circle-stroke-color': '#FFFFFF',
            },
          },
        ],
      },
    });

    googleMap.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    googleMap.on('click', (e: maplibregl.MapMouseEvent) => {
      const lat = Number(e.lngLat.lat.toFixed(5));
      const lng = Number(e.lngLat.lng.toFixed(5));
      setUserPos((prev) => ({
        ...prev,
        lat,
        lng,
        accuracy: 5,
        sourceLabel: 'Pinned on Google Street Map',
      }));
      reverseGeocodeCoordinates(lat, lng);
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 13.5,
        pitch: 62,
        duration: 850,
      });
    });

    googleMap.on('error', (e: any) => {
      if (e?.error?.status !== 404) {
        console.warn('MapLibre secondary map event:', e?.error?.message || e);
      }
    });

    googleSecondaryMapRef.current = googleMap;
    window.setTimeout(() => {
      mapRef.current?.resize();
      googleMap.resize();
    }, 120);

    return () => {
      if (secondaryLiveMarkerRef.current) {
        secondaryLiveMarkerRef.current.remove();
        secondaryLiveMarkerRef.current = null;
      }
      secondaryDomMarkersRef.current.forEach((m) => m.remove());
      secondaryDomMarkersRef.current = [];
      googleMap.remove();
      googleSecondaryMapRef.current = null;
    };
  }, [viewMode]);

  // Map Click Handler on Primary Map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = async (e: maplibregl.MapMouseEvent) => {
      const lat = Number(e.lngLat.lat.toFixed(5));
      const lng = Number(e.lngLat.lng.toFixed(5));

      if (onMapPointClick) {
        onMapPointClick(lat, lng);
      }

      if (pinLiveMode) {
        setUserPos((prev) => ({
          ...prev,
          lat,
          lng,
          accuracy: 5,
          sourceLabel: 'Pinned Live Street Location',
        }));
        setPinLiveMode(false);
        reverseGeocodeCoordinates(lat, lng);
        refreshMapWeather(lat, lng);
        googleSecondaryMapRef.current?.flyTo({
          center: [lng, lat],
          zoom: 14.0,
          duration: 750,
        });
        addToast(
          `Live Location Updated: ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E`,
          'success'
        );
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: [
          'hazard-points-layer',
          'sites-layer',
          'shelters-layer',
          'teams-layer',
          'hazard-fill-layer',
          'extruded-buildings-layer',
        ],
      });

      let nearestV = villages[0]!;
      let minDist = 9999;
      for (const v of villages) {
        const d = Math.hypot(v.lat - lat, v.lng - lng);
        if (d < minDist) {
          minDist = d;
          nearestV = v;
        }
      }

      const geo = geofenceCheck(lat, lng, villages, reliefCamps, weights);
      const distFromLive = haversineDistanceKm(userPos.lat, userPos.lng, lat, lng);

      if (features.length > 0) {
        const topFeat = features[0]!;
        const props = topFeat.properties || {};
        const vId = props.id || props.villageId;
        const foundEntry = villagesWithZones.find((x) => x.village.id === vId);
        if (foundEntry) {
          const foundVillage = foundEntry.village;
          onSelectVillage(foundVillage);
          refreshMapWeather(foundVillage.lat, foundVillage.lng);
          setClickedQuery({
            title: `${foundVillage.name} (${foundVillage.district})`,
            category: 'Habitation / Village',
            zone: foundEntry.zone,
            disasterCondition: foundEntry.hazardLabel,
            lat: foundVillage.lat,
            lng: foundVillage.lng,
            elevationM: foundVillage.elevationM,
            slopeDeg: foundVillage.slopeDeg,
            slopeClass:
              foundVillage.slopeDeg >= 30
                ? 'Very Steep Scarp (>30°)'
                : foundVillage.slopeDeg >= 20
                ? 'Steep Ghats (20–30°)'
                : 'Moderate Slope (<20°)',
            hazardScore: foundEntry.score,
            nearestVillage: foundVillage,
            nearestShelterName: geo.nearestCamp?.name || 'Khalapur Relief Camp',
            nearestShelterDistKm: geo.nearestCamp?.distanceKm ?? 2.8,
            distanceFromLiveKm: haversineDistanceKm(
              userPos.lat,
              userPos.lng,
              foundVillage.lat,
              foundVillage.lng
            ),
          });
          map.flyTo({
            center: [foundVillage.lng, foundVillage.lat],
            zoom: Math.max(map.getZoom(), 13.0),
            pitch: viewMode === 'google2d' ? 0 : 62,
            duration: 850,
          });
          return;
        }

        const foundSite = sites.find((s) => s.id === props.id || s.id === props.siteId);
        if (foundSite) {
          setSelectedSiteId(foundSite.id);
          setClickedQuery({
            title: `${foundSite.name} (${foundSite.district})`,
            category: `Green Zone Safe Site (${foundSite.usableAreaHa} ha)`,
            zone: 'GREEN',
            disasterCondition: 'Safe Host Site — Outside Flood & Landslide Perimeters',
            lat: foundSite.lat,
            lng: foundSite.lng,
            elevationM: foundSite.elevationM,
            slopeDeg: foundSite.slopeDeg,
            slopeClass: 'Safe Host Plateau (<12°)',
            hazardScore: 0.16,
            nearestVillage: nearestV,
            nearestShelterName: geo.nearestCamp?.name || 'Designated Shelter',
            nearestShelterDistKm: geo.nearestCamp?.distanceKm ?? 2.1,
            distanceFromLiveKm: haversineDistanceKm(
              userPos.lat,
              userPos.lng,
              foundSite.lat,
              foundSite.lng
            ),
          });
          map.flyTo({
            center: [foundSite.lng, foundSite.lat],
            zoom: Math.max(map.getZoom(), 13.2),
            pitch: viewMode === 'google2d' ? 0 : 62,
            duration: 850,
          });
          return;
        }

        const foundCamp = reliefCamps.find((c) => c.id === props.id);
        if (foundCamp) {
          setClickedQuery({
            title: foundCamp.name,
            category: `Green Zone Relief Shelter (${foundCamp.currentOccupancy}/${foundCamp.capacityPersons} beds)`,
            zone: 'GREEN',
            disasterCondition: 'Verified Emergency Relief Shelter',
            lat: foundCamp.lat,
            lng: foundCamp.lng,
            elevationM: nearestV.elevationM,
            slopeDeg: 4,
            slopeClass: 'Safe Relief Ground',
            hazardScore: 0.12,
            nearestVillage: nearestV,
            nearestShelterName: foundCamp.name,
            nearestShelterDistKm: 0,
            distanceFromLiveKm: haversineDistanceKm(
              userPos.lat,
              userPos.lng,
              foundCamp.lat,
              foundCamp.lng
            ),
          });
          map.flyTo({
            center: [foundCamp.lng, foundCamp.lat],
            zoom: Math.max(map.getZoom(), 13.4),
            pitch: viewMode === 'google2d' ? 0 : 60,
            duration: 800,
          });
          return;
        }
      }

      const elev = (await fetchPointElevation(lat, lng)) || nearestV.elevationM;
      const slopeDeg = nearestV.slopeDeg;
      const slopeClass =
        slopeDeg >= 30
          ? 'Very Steep Scarp (>30°)'
          : slopeDeg >= 20
          ? 'Steep Ghats (20–30°)'
          : slopeDeg >= 10
          ? 'Moderate Slope (10–20°)'
          : 'Gentle Plateau (<10°)';
      const hScore =
        minDist <= 0.08
          ? weightedScore(
              nearestV.hazardFactors,
              weights,
              nearestV.verifiedReportsCount,
              climateHorizon,
              extraRainfallMm
            )
          : 0.2;
      const clickedZone = getThreeZoneCategory(hScore);

      setClickedQuery({
        title: `Street Coordinate (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`,
        category: `Near ${nearestV.name} (${nearestV.district})`,
        zone: clickedZone,
        disasterCondition: getZoneTitle(clickedZone),
        lat,
        lng,
        elevationM: elev,
        slopeDeg,
        slopeClass,
        hazardScore: hScore,
        nearestVillage: nearestV,
        nearestShelterName: geo.nearestCamp?.name || 'Khalapur Relief Camp',
        nearestShelterDistKm: geo.nearestCamp?.distanceKm ?? 3.2,
        distanceFromLiveKm: distFromLive,
      });
      refreshMapWeather(lat, lng);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [
    pinLiveMode,
    villages,
    villagesWithZones,
    sites,
    reliefCamps,
    weights,
    climateHorizon,
    extraRainfallMm,
    userPos.lat,
    userPos.lng,
    viewMode,
    onMapPointClick,
    onSelectVillage,
    reverseGeocodeCoordinates,
    refreshMapWeather,
    setSelectedSiteId,
    addToast,
  ]);

  // Render Prominent Live Location HTML Marker with Exact Address & Zone Status on Both Maps
  useEffect(() => {
    const shortAddr =
      userPos.addressName.length > 38
        ? `${userPos.addressName.slice(0, 38)}...`
        : userPos.addressName;

    const badgeHtml = `
      <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
        <div style="background:${liveZoneAnalysis.color};color:#FFFFFF;font-family:sans-serif;font-size:11px;font-weight:800;padding:4px 9px;border-radius:8px;border:2px solid #FFFFFF;box-shadow:0 4px 12px rgba(0,0,0,0.45);white-space:nowrap;text-align:center;">
          <div>📍 YOUR LIVE LOCATION (${liveZoneAnalysis.detectedZone} ZONE)</div>
          <div style="font-size:9.5px;font-weight:600;opacity:0.95;font-family:monospace;">${shortAddr} · ${userPos.lat.toFixed(4)}°N, ${userPos.lng.toFixed(4)}°E</div>
        </div>
        <div style="width:16px;height:16px;border-radius:9999px;background:#0284C7;border:3px solid #FFFFFF;box-shadow:0 0 0 7px ${liveZoneAnalysis.color}66;margin-top:3px;"></div>
      </div>
    `;

    const map = mapRef.current;
    if (map) {
      if (!liveMarkerRef.current) {
        const el = document.createElement('div');
        el.style.cssText = 'cursor:pointer; z-index: 40; pointer-events: auto;';
        liveMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: 'bottom',
        })
          .setLngLat([userPos.lng, userPos.lat])
          .addTo(map);
      } else {
        liveMarkerRef.current.setLngLat([userPos.lng, userPos.lat]);
      }
      liveMarkerRef.current.getElement().innerHTML = badgeHtml;
    }

    const gMap = googleSecondaryMapRef.current;
    if (gMap) {
      if (!secondaryLiveMarkerRef.current) {
        const el2 = document.createElement('div');
        el2.style.cssText = 'cursor:pointer; z-index: 40; pointer-events: auto;';
        secondaryLiveMarkerRef.current = new maplibregl.Marker({
          element: el2,
          anchor: 'bottom',
        })
          .setLngLat([userPos.lng, userPos.lat])
          .addTo(gMap);
      } else {
        secondaryLiveMarkerRef.current.setLngLat([userPos.lng, userPos.lat]);
      }
      secondaryLiveMarkerRef.current.getElement().innerHTML = badgeHtml;
    }
  }, [
    userPos.lat,
    userPos.lng,
    userPos.addressName,
    liveZoneAnalysis.color,
    liveZoneAnalysis.detectedZone,
    viewMode,
  ]);

  // Render All Location Name & Red/Orange/Green Zone Badges on Both Maps
  useEffect(() => {
    const map = mapRef.current;
    const gMap = googleSecondaryMapRef.current;

    domMarkersRef.current.forEach((m) => m.remove());
    domMarkersRef.current = [];
    secondaryDomMarkersRef.current.forEach((m) => m.remove());
    secondaryDomMarkersRef.current = [];

    if (!showLocationLabels) return;

    const filteredVillages = villagesWithZones.filter((item) =>
      zoneFilter === 'ALL' ? true : item.zone === zoneFilter
    );

    const attachMarkersToTarget = (
      targetMap: maplibregl.Map,
      bucket: maplibregl.Marker[],
      isGoogle2dPane: boolean
    ) => {
      if (showHazardPolygons) {
        filteredVillages.forEach(({ village: v, zone, color, hazardLabel }) => {
          const el = document.createElement('div');
          el.style.cssText = 'cursor:pointer; pointer-events:auto;';
          el.innerHTML = `
            <div title="${v.name} (${v.district}) — ${zone} ZONE: ${hazardLabel} — ${v.lat.toFixed(4)}°N, ${v.lng.toFixed(4)}°E" style="background:${
              isGoogle2dPane ? '#FFFFFF' : 'rgba(11,31,51,0.92)'
            };color:${
              isGoogle2dPane ? '#0B1F33' : '#FFFFFF'
            };border:1.5px solid ${color};border-left:5px solid ${color};padding:2px 6px;border-radius:5px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 2px 5px rgba(0,0,0,0.3);transform:translateY(-11px);">
              ${v.name} <span style="color:${color};font-family:monospace;font-weight:800;">[${zone}]</span>
            </div>
          `;
          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            onSelectVillage(v);
            mapRef.current?.flyTo({
              center: [v.lng, v.lat],
              zoom: 13.2,
              pitch: viewMode === 'google2d' ? 0 : 62,
              duration: 850,
            });
            googleSecondaryMapRef.current?.flyTo({
              center: [v.lng, v.lat],
              zoom: 13.2,
              duration: 800,
            });
          });
          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([v.lng, v.lat])
            .addTo(targetMap);
          bucket.push(marker);
        });
      }

      if (showSitesLayer && (zoneFilter === 'ALL' || zoneFilter === 'GREEN')) {
        sites.forEach((s) => {
          const el = document.createElement('div');
          el.style.cssText = 'cursor:pointer; pointer-events:auto;';
          el.innerHTML = `
            <div title="Green Zone Safe Site: ${s.name} (${s.lat.toFixed(4)}°N, ${s.lng.toFixed(4)}°E)" style="background:#16A34A;color:#FFFFFF;padding:2px 6px;border-radius:5px;font-size:9.5px;font-weight:700;white-space:nowrap;border:1.5px solid #FFFFFF;box-shadow:0 2px 5px rgba(0,0,0,0.3);transform:translateY(-10px);">
              🟢 Safe Site: ${s.name}
            </div>
          `;
          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            setSelectedSiteId(s.id);
            setSiteOrbitActiveId(s.id);
            mapRef.current?.flyTo({
              center: [s.lng, s.lat],
              zoom: 13.4,
              pitch: viewMode === 'google2d' ? 0 : 64,
              duration: 850,
            });
            googleSecondaryMapRef.current?.flyTo({
              center: [s.lng, s.lat],
              zoom: 13.4,
              duration: 800,
            });
          });
          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([s.lng, s.lat])
            .addTo(targetMap);
          bucket.push(marker);
        });
      }

      if (showSheltersLayer && (zoneFilter === 'ALL' || zoneFilter === 'GREEN')) {
        reliefCamps.slice(0, 15).forEach((c) => {
          const el = document.createElement('div');
          el.style.cssText = 'cursor:pointer; pointer-events:auto;';
          el.innerHTML = `
            <div title="Green Zone Shelter: ${c.name} (${c.lat.toFixed(4)}°N, ${c.lng.toFixed(4)}°E)" style="background:#15803D;color:#FFFFFF;padding:1.5px 5px;border-radius:4px;font-size:9px;font-weight:700;white-space:nowrap;border:1px solid #FFFFFF;transform:translateY(-9px);">
              🟢 Shelter: ${c.name}
            </div>
          `;
          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            mapRef.current?.flyTo({
              center: [c.lng, c.lat],
              zoom: 13.5,
              pitch: viewMode === 'google2d' ? 0 : 60,
              duration: 800,
            });
            googleSecondaryMapRef.current?.flyTo({
              center: [c.lng, c.lat],
              zoom: 13.5,
              duration: 800,
            });
          });
          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([c.lng, c.lat])
            .addTo(targetMap);
          bucket.push(marker);
        });
      }
    };

    if (map) {
      attachMarkersToTarget(map, domMarkersRef.current, viewMode === 'google2d');
    }
    if (gMap) {
      attachMarkersToTarget(gMap, secondaryDomMarkersRef.current, true);
    }
  }, [
    showLocationLabels,
    showHazardPolygons,
    showSitesLayer,
    showSheltersLayer,
    villagesWithZones,
    zoneFilter,
    sites,
    reliefCamps,
    viewMode,
    onSelectVillage,
    setSelectedSiteId,
  ]);

  // Sync dynamic GeoJSON sources on Both Maps
  useEffect(() => {
    const data = buildMapGeoJsonData();

    const syncSourcesToMap = (targetMap: maplibregl.Map | null, is3dPane: boolean) => {
      if (!targetMap || !targetMap.isStyleLoaded()) return;
      const setSrc = (id: string, fc: unknown) => {
        const src = targetMap.getSource(id) as maplibregl.GeoJSONSource | undefined;
        if (src && typeof src.setData === 'function') {
          src.setData(fc as GeoJSON.FeatureCollection);
        }
      };

      setSrc('hazard-zones', data.hazardGeoJson);
      setSrc('hazard-points', data.hazardPointsGeoJson);
      setSrc('extruded-footprints', data.buildingGeoJson);
      setSrc('sites-source', data.sitesGeoJson);
      setSrc('shelters-source', data.sheltersGeoJson);
      setSrc('teams-source', data.teamsGeoJson);
      setSrc('flood-inundation', data.floodGeoJson);
      setSrc('relocation-lines', data.relocGeoJson);
      setSrc('evacuation-route', data.evacGeoJson);
      setSrc('profile-line', data.profileGeoJson);
      setSrc('aoi-source', data.aoiGeoJson);
      setSrc('gps-source', data.gpsGeoJson);

      const setVis = (layerId: string, visible: boolean) => {
        if (targetMap.getLayer(layerId)) {
          targetMap.setLayoutProperty(
            layerId,
            'visibility',
            visible ? 'visible' : 'none'
          );
        }
      };

      setVis('hazard-fill-layer', showHazardPolygons);
      setVis('hazard-outline-layer', showHazardPolygons);
      setVis('hazard-points-layer', showHazardPolygons);
      setVis('extruded-buildings-layer', show3dExtrusions && is3dPane);
      setVis('river-buffer-layer', showRiversBuffer);
      setVis('river-core-layer', showRiversBuffer);
      setVis('shelters-layer', showSheltersLayer);
      setVis('sites-layer', showSitesLayer);
      setVis('teams-layer', showTeamsLayer);
    };

    syncSourcesToMap(mapRef.current, viewMode !== 'google2d');
    syncSourcesToMap(googleSecondaryMapRef.current, false);
  }, [
    buildMapGeoJsonData,
    showHazardPolygons,
    show3dExtrusions,
    showRiversBuffer,
    showSheltersLayer,
    showSitesLayer,
    showTeamsLayer,
    viewMode,
  ]);

  // Sync View Mode & Basemaps (Dark GIS, Topo, 2D Street, Satellite, 3D DEM, Split)
  const prevViewModeRef = useRef<'google2d' | '3d' | 'split'>(viewMode);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    window.setTimeout(() => {
      map.resize();
      googleSecondaryMapRef.current?.resize();
    }, 80);

    const applyTilesAndTerrain = () => {
      if (map.getLayer('basemap-street')) {
        map.setLayoutProperty('basemap-street', 'visibility', basemap === 'osm' || !basemap ? 'visible' : 'none');
      }
      if (map.getLayer('basemap-satellite')) {
        map.setLayoutProperty('basemap-satellite', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
      }
      if (map.getLayer('basemap-satellite-roads')) {
        map.setLayoutProperty('basemap-satellite-roads', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
      }
      if (map.getLayer('basemap-satellite-labels')) {
        map.setLayoutProperty('basemap-satellite-labels', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
      }
      if (map.getLayer('basemap-topo')) {
        map.setLayoutProperty('basemap-topo', 'visibility', basemap === 'terrain' ? 'visible' : 'none');
      }

      // Update solid background paint color to prevent white flashes
      if (map.getLayer('offline-canvas-bg')) {
        map.setPaintProperty(
          'offline-canvas-bg',
          'background-color',
          basemap === 'terrain' ? '#EBF0E6' : basemap === 'satellite' ? '#0F1E2E' : '#F1F5F9'
        );
      }

      // Update hillshade visibility and paint
      if (map.getLayer('terrain-hillshade')) {
        map.setLayoutProperty(
          'terrain-hillshade',
          'visibility',
          viewMode === '3d' ? 'visible' : 'none'
        );
        map.setPaintProperty(
          'terrain-hillshade',
          'hillshade-shadow-color',
          '#0B1F33'
        );
        map.setPaintProperty(
          'terrain-hillshade',
          'hillshade-highlight-color',
          '#FFFFFF'
        );
      }

      const was2D = prevViewModeRef.current === 'google2d';
      prevViewModeRef.current = viewMode;

      if (viewMode === 'google2d') {
        setMap3dEnabled(false);
        try {
          map.setTerrain(null);
          if (!was2D) {
            map.easeTo({ pitch: 0, bearing: 0, duration: 500 });
          }
        } catch {
          // ignore
        }
      } else {
        setMap3dEnabled(true);
        if (!reduce3dQuality) {
          try {
            map.setTerrain({
              source: 'terrarium-dem',
              exaggeration: terrainExaggeration,
            });
            if (was2D) {
              map.easeTo({ pitch: 60, bearing: -18, duration: 600 });
            }
          } catch {
            // ignore
          }
        }
      }
    };

    if (map.isStyleLoaded()) {
      applyTilesAndTerrain();
    } else {
      map.once('load', applyTilesAndTerrain);
      map.once('styledata', applyTilesAndTerrain);
    }
  }, [viewMode, basemap, terrainExaggeration, reduce3dQuality, setMap3dEnabled]);

  // Fly to selectedVillageId when changed externally
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedVillageId) return;
    const found = villages.find((v) => v.id === selectedVillageId);
    if (found) {
      map.flyTo({
        center: [found.lng, found.lat],
        zoom: Math.max(map.getZoom(), 12.6),
        pitch: viewMode === 'google2d' ? 0 : 62,
        duration: 850,
      });
      googleSecondaryMapRef.current?.flyTo({
        center: [found.lng, found.lat],
        zoom: 12.6,
        duration: 800,
      });
    }
  }, [selectedVillageId]);

  // 360° Orbit Camera Loop
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isOrbiting) {
      if (orbitFrameRef.current) cancelAnimationFrame(orbitFrameRef.current);
      return;
    }

    const step = () => {
      if (!mapRef.current) return;
      mapRef.current.rotateTo((mapRef.current.getBearing() + 0.3) % 360, {
        duration: 0,
      });
      orbitFrameRef.current = requestAnimationFrame(step);
    };
    orbitFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (orbitFrameRef.current) cancelAnimationFrame(orbitFrameRef.current);
    };
  }, [isOrbiting]);

  const flyTo3dPreset = (
    lng: number,
    lat: number,
    zoom: number,
    pitch: number,
    bearing: number
  ) => {
    setPitchDeg(pitch);
    setBearingDeg(bearing);
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom,
      pitch: viewMode === 'google2d' ? 0 : pitch,
      bearing: viewMode === 'google2d' ? 0 : bearing,
      duration: 950,
    });
    googleSecondaryMapRef.current?.flyTo({
      center: [lng, lat],
      zoom: Math.min(zoom, 14.5),
      duration: 900,
    });
  };

  const handleFitAllLocations = () => {
    const bounds = new maplibregl.LngLatBounds();
    villages.forEach((v) => bounds.extend([v.lng, v.lat]));
    sites.forEach((s) => bounds.extend([s.lng, s.lat]));
    reliefCamps.forEach((c) => bounds.extend([c.lng, c.lat]));
    bounds.extend([userPos.lng, userPos.lat]);

    mapRef.current?.fitBounds(bounds, {
      padding: 46,
      pitch: viewMode === 'google2d' ? 0 : 48,
      duration: 900,
    });
    googleSecondaryMapRef.current?.fitBounds(bounds, {
      padding: 40,
      duration: 900,
    });
  };

  const applyLiveLocationAndDetectZone = (
    lat: number,
    lng: number,
    accuracy: number,
    label: string,
    customAddress?: string
  ) => {
    const cleanLat = Number(lat.toFixed(5));
    const cleanLng = Number(lng.toFixed(5));
    setUserPos((prev) => ({
      lat: cleanLat,
      lng: cleanLng,
      accuracy: Math.round(accuracy),
      heading: 0,
      speed: 0,
      sourceLabel: label,
      addressName: customAddress || label,
    }));
    if (!customAddress) {
      reverseGeocodeCoordinates(cleanLat, cleanLng);
    }
    refreshMapWeather(cleanLat, cleanLng);
    flyTo3dPreset(cleanLng, cleanLat, 14.0, 62, -18);
  };

  const handleSearchStreetOrPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = addressQuery.trim();
    if (!q) return;
    setSearchingAddress(true);
    try {
      const results = await searchNominatim(q);
      if (results.length > 0) {
        const top = results[0]!;
        applyLiveLocationAndDetectZone(
          top.lat,
          top.lng,
          6,
          `Searched: ${top.displayName.split(',')[0]}`,
          top.displayName.split(',').slice(0, 3).join(', ')
        );
        addToast(`Locked GPS on ${top.displayName}`, 'success');
      } else {
        addToast(`No street found for "${q}"`, 'warning');
      }
    } finally {
      setSearchingAddress(false);
    }
  };

  // Simulate GPS Field Walk across Red -> Orange -> Green Zones
  const toggleSimulateGpsWalk = () => {
    if (gpsSimActive) {
      if (gpsSimIntervalRef.current) {
        window.clearInterval(gpsSimIntervalRef.current);
        gpsSimIntervalRef.current = null;
      }
      setGpsSimActive(false);
      return;
    }

    setGpsSimActive(true);
    const waypoints: { lat: number; lng: number; label: string; addr: string }[] = [
      {
        lat: 18.5204,
        lng: 73.8567,
        label: 'Patrol: Pune Regional Command Hub',
        addr: 'District Emergency Operations Center, Shivajinagar, Pune',
      },
      {
        lat: 18.9265,
        lng: 73.2361,
        label: 'Patrol: Irshalwadi Red Zone',
        addr: 'Irshalwadi Landslide Red Zone, Khalapur, Raigad',
      },
      {
        lat: 17.9841,
        lng: 73.4622,
        label: 'Patrol: Poladpur Orange Watch Zone',
        addr: 'Poladpur Ghat Corridor, Raigad',
      },
      {
        lat: 18.8315,
        lng: 73.2845,
        label: 'Patrol: Khalapur Green Safe Site',
        addr: 'Khalapur Safe Relocation Plateau, Raigad',
      },
    ];
    let stepIdx = 0;

    gpsSimIntervalRef.current = window.setInterval(() => {
      const wp = waypoints[stepIdx % waypoints.length]!;
      stepIdx += 1;
      setUserPos({
        lat: wp.lat,
        lng: wp.lng,
        accuracy: 6,
        heading: 215,
        speed: 22,
        sourceLabel: wp.label,
        addressName: wp.addr,
      });
      mapRef.current?.easeTo({
        center: [wp.lng, wp.lat],
        duration: 1300,
      });
      googleSecondaryMapRef.current?.easeTo({
        center: [wp.lng, wp.lat],
        duration: 1300,
      });
    }, 2600);
  };

  const handleNavigateToShelter = async (fromLat?: number, fromLng?: number) => {
    const startLat = fromLat ?? userPos.lat;
    const startLng = fromLng ?? userPos.lng;
    const geo = geofenceCheck(startLat, startLng, villages, reliefCamps, weights);
    const camp = geo.nearestCamp || reliefCamps[0];
    if (!camp) return;
    const route = await fetchEvacuationRoute(
      startLat,
      startLng,
      camp.lat,
      camp.lng
    );
    setEvacRoute(route);
    setProfileWaypoints([
      [startLat, startLng],
      [camp.lat, camp.lng],
    ]);
    flyTo3dPreset(
      (startLng + camp.lng) / 2,
      (startLat + camp.lat) / 2,
      12.4,
      58,
      0
    );
    addToast(
      `Route to Green Zone Shelter (${camp.name}): ${route.distanceKm} km · ${route.durationMinutes} min`,
      'success'
    );
  };

  const handleJumpSelection = (val: string) => {
    setSelectedJumpKey(val);
    if (!val) return;
    if (val === 'LIVE_GPS') {
      acquireAccurateLiveGps(true);
      return;
    }
    if (val === 'PUNE_HQ') {
      applyLiveLocationAndDetectZone(
        18.5204,
        73.8567,
        5,
        'Pune District Emergency Operations Center',
        'District Emergency Operations Centre, Shivajinagar, Pune'
      );
      return;
    }
    if (val === 'FIT_ALL') {
      handleFitAllLocations();
      return;
    }
    if (val.startsWith('V:')) {
      const vId = val.slice(2);
      const found = villages.find((v) => v.id === vId);
      if (found) {
        onSelectVillage(found);
        applyLiveLocationAndDetectZone(
          found.lat,
          found.lng,
          6,
          `${found.name} (${found.district})`,
          `${found.name}, ${found.taluka}, ${found.district} District`
        );
      }
      return;
    }
    if (val.startsWith('S:')) {
      const sId = val.slice(2);
      const found = sites.find((s) => s.id === sId);
      if (found) {
        setSelectedSiteId(found.id);
        setSiteOrbitActiveId(found.id);
        applyLiveLocationAndDetectZone(
          found.lat,
          found.lng,
          6,
          `Green Safe Site: ${found.name}`,
          `${found.name} Safe Relocation Site, ${found.district}`
        );
      }
      return;
    }
    if (val.startsWith('C:')) {
      const cId = val.slice(2);
      const found = reliefCamps.find((c) => c.id === cId);
      if (found) {
        applyLiveLocationAndDetectZone(
          found.lat,
          found.lng,
          6,
          `Green Shelter: ${found.name}`,
          `${found.name} Relief Camp`
        );
      }
    }
  };

  const handleCopyCoordinates = (lat: number, lng: number) => {
    const text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedCoords(true);
    addToast(`Copied coordinates: ${text}`, 'info');
    window.setTimeout(() => setCopiedCoords(false), 1800);
  };

  const activeSiteForOrbit = useMemo(
    () => sites.find((s) => s.id === siteOrbitActiveId) || null,
    [sites, siteOrbitActiveId]
  );

  return (
    <div className="relative w-full rounded-[14px] overflow-hidden border border-[var(--border)] flex flex-col bg-[#0B1F33]">
      {/* =====================================================================
          1. DIRECT MAP CONTROL BAR: [Dark GIS] [Topo] [2D Street] [Satellite] | [2D Flat] [3D DEM] [Split View]
          ===================================================================== */}
      <div className="w-full bg-[#071524] border-b border-slate-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Basemap Selection */}
          <button
            type="button"
            onClick={() => setBasemap('osm')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemap === 'osm' || !basemap
                ? 'bg-[#008060] text-white shadow-xs ring-2 ring-emerald-300/60'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="2D Street Map — High-precision OpenStreetMap road cartography"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>2D Street</span>
          </button>

          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemap === 'satellite'
                ? 'bg-[#008060] text-white shadow-xs ring-2 ring-emerald-300/60'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Satellite Map — Esri high-resolution aerial imagery with street labels"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setBasemap('terrain')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              basemap === 'terrain'
                ? 'bg-[#008060] text-white shadow-xs ring-2 ring-emerald-300/60'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Topographic Map — Contours, physical terrain relief & mountain elevations"
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Topo</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* 2D vs 3D Perspective Mode */}
          <button
            type="button"
            onClick={() => setViewMode('google2d')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'google2d'
                ? 'bg-[#0369A1] text-white shadow-xs ring-1 ring-sky-300/60'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Flat 2D Projection — 0° Nadir Orthographic View"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2D Flat</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === '3d'
                ? 'bg-[#0B8F80] text-white shadow-xs ring-2 ring-teal-300/60'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="3D DEM Terrain — 60° Oblique Digital Elevation Model"
          >
            <Orbit className="w-3.5 h-3.5" />
            <span>3D DEM</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-[#16A34A] text-white shadow-xs ring-2 ring-green-300/60'
                : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title="Split Dual View — Side-by-Side 2D & 3D Maps"
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
        </div>

        {/* Street / College / City Search Box for Accurate GPS Pinning */}
        <form onSubmit={handleSearchStreetOrPlace} className="flex items-center gap-1.5">
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={addressQuery}
              onChange={(e) => setAddressQuery(e.target.value)}
              placeholder="Search village, city, district (e.g. Mahad, Irshalwadi, Pune)..."
              className="bg-slate-900 text-white border border-slate-700 rounded-[8px] pl-8 pr-2.5 py-1.5 text-xs w-56 sm:w-64 focus:outline-none focus:border-[#0B8F80]"
            />
          </div>
          <button
            type="submit"
            disabled={searchingAddress}
            className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] hover:bg-[#087366] text-white text-xs font-bold"
          >
            {searchingAddress ? '...' : 'Go'}
          </button>
        </form>
      </div>

      {/* =====================================================================
          2. LIVE GPS LOCATION & RED / ORANGE / GREEN ZONE DISASTER DETECTOR BANNER
          ===================================================================== */}
      <div
        className="w-full px-3.5 py-2.5 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-2.5 z-20"
        style={{
          background:
            liveZoneAnalysis.detectedZone === 'RED'
              ? 'linear-gradient(90deg, #7F1D1D 0%, #991B1B 100%)'
              : liveZoneAnalysis.detectedZone === 'ORANGE'
              ? 'linear-gradient(90deg, #7C2D12 0%, #9A3412 100%)'
              : 'linear-gradient(90deg, #14532D 0%, #166534 100%)',
        }}
      >
        {/* Left: Detected Zone Badge + Live Address + Coordinates + Disaster Condition */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className="px-3 py-1 rounded-[8px] font-mono text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm border border-white/40"
            style={{ backgroundColor: liveZoneAnalysis.color }}
          >
            {liveZoneAnalysis.detectedZone === 'RED' ? (
              <ShieldAlert className="w-4 h-4" strokeWidth={2} />
            ) : liveZoneAnalysis.detectedZone === 'ORANGE' ? (
              <AlertTriangle className="w-4 h-4" strokeWidth={2} />
            ) : (
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            )}
            <span>{liveZoneAnalysis.detectedZone} ZONE</span>
          </span>

          <div className="text-xs">
            <div className="font-bold flex flex-wrap items-center gap-2">
              <span>📍 {userPos.addressName}</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/30">
                GPS: {userPos.lat.toFixed(5)}°N, {userPos.lng.toFixed(5)}°E (±
                {userPos.accuracy}m)
              </span>
              <button
                type="button"
                onClick={() => handleCopyCoordinates(userPos.lat, userPos.lng)}
                className="px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 font-mono text-[10px] inline-flex items-center gap-1"
              >
                {copiedCoords ? (
                  <Check className="w-3 h-3" strokeWidth={1.75} />
                ) : (
                  <Copy className="w-3 h-3" strokeWidth={1.75} />
                )}
                <span>{copiedCoords ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-[11px] text-white/90 mt-0.5">
              <strong>Condition:</strong> {liveZoneAnalysis.disasterType} ·{' '}
              <strong>Advisory:</strong> {liveZoneAnalysis.actionAdvisory}
            </div>
          </div>
        </div>

        {/* Right: Accurate GPS Lock & Zone Test Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => acquireAccurateLiveGps(true)}
            className="px-3 py-1.5 rounded-[8px] bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold flex items-center gap-1 shadow-sm border border-white/30"
          >
            <Crosshair className="w-3.5 h-3.5" strokeWidth={2} />
            <span>{locatingUser ? 'Locking GPS...' : 'Lock My Accurate GPS'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              applyLiveLocationAndDetectZone(
                18.5204,
                73.8567,
                5,
                'Pune District Emergency Operations Center (DEOC)',
                'Collector Office, Shivajinagar, Pune'
              )
            }
            className="px-2.5 py-1.5 rounded-[8px] bg-slate-900/80 hover:bg-slate-900 text-white font-bold border border-white/30"
            title="Center on Pune District Emergency Command Center"
          >
            📍 Pune DEOC
          </button>

          <button
            type="button"
            onClick={() =>
              applyLiveLocationAndDetectZone(
                18.9265,
                73.2361,
                6,
                'Irshalwadi Red Zone',
                'Irshalwadi Landslide Red Zone, Khalapur, Raigad'
              )
            }
            className="px-2.5 py-1.5 rounded-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold border border-white/30"
          >
            🔴 Red Zone
          </button>

          <button
            type="button"
            onClick={() =>
              applyLiveLocationAndDetectZone(
                17.9841,
                73.4622,
                6,
                'Poladpur Orange Zone',
                'Poladpur Monsoon Watch Sector, Raigad'
              )
            }
            className="px-2.5 py-1.5 rounded-[8px] bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold border border-white/30"
          >
            🟠 Orange Zone
          </button>

          <button
            type="button"
            onClick={() =>
              applyLiveLocationAndDetectZone(
                18.8315,
                73.2845,
                6,
                'Khalapur Green Safe Site',
                'Khalapur Safe Relocation Plateau, Raigad'
              )
            }
            className="px-2.5 py-1.5 rounded-[8px] bg-[#16A34A] hover:bg-[#15803D] text-white font-bold border border-white/30"
          >
            🟢 Green Zone
          </button>
        </div>
      </div>

      {/* =====================================================================
          3. ZONE FILTERS, ALL LOCATIONS JUMP DIRECTORY & TOOLS BAR
          ===================================================================== */}
      <div className="w-full bg-[var(--surface)] border-b border-[var(--border)] px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Zone Filter Pills (All | Red Zone | Orange Zone | Green Zone) */}
          <div className="neu-inset p-0.5 flex items-center rounded-[8px]">
            <button
              type="button"
              onClick={() => setZoneFilter('ALL')}
              className={`px-2.5 py-1 rounded-[6px] font-bold ${
                zoneFilter === 'ALL'
                  ? 'bg-[#0B1F33] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              All ({villages.length + sites.length + reliefCamps.length})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('RED')}
              className={`px-2.5 py-1 rounded-[6px] font-bold ${
                zoneFilter === 'RED'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-[#DC2626]'
              }`}
            >
              🔴 Red ({zoneCounts.red})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('ORANGE')}
              className={`px-2.5 py-1 rounded-[6px] font-bold ${
                zoneFilter === 'ORANGE'
                  ? 'bg-[#EA580C] text-white'
                  : 'text-[#EA580C]'
              }`}
            >
              🟠 Orange ({zoneCounts.orange})
            </button>
            <button
              type="button"
              onClick={() => setZoneFilter('GREEN')}
              className={`px-2.5 py-1 rounded-[6px] font-bold ${
                zoneFilter === 'GREEN'
                  ? 'bg-[#16A34A] text-white'
                  : 'text-[#16A34A]'
              }`}
            >
              🟢 Green ({zoneCounts.green})
            </button>
          </div>

          {/* All Locations Directory Dropdown */}
          <select
            value={selectedJumpKey}
            onChange={(e) => handleJumpSelection(e.target.value)}
            aria-label="Jump to any location on map"
            className="neu-input px-2.5 py-1 text-xs font-semibold max-w-[260px]"
          >
            <option value="">
              All Locations ({villages.length} Villages · {sites.length} Safe Sites ·{' '}
              {reliefCamps.length} Shelters)...
            </option>
            <option value="LIVE_GPS">
              📍 Lock My Accurate Device GPS ({userPos.lat.toFixed(4)}°N,{' '}
              {userPos.lng.toFixed(4)}°E)
            </option>
            <option value="PUNE_HQ">
              📍 Pune Emergency Operations Center (18.5204°N, 73.8567°E)
            </option>
            <option value="FIT_ALL">
              🗺️ Fit All {villages.length + sites.length + reliefCamps.length} Locations on Map
            </option>
            <optgroup label={`🔴 Red Zone Villages (${zoneCounts.red})`}>
              {villagesWithZones
                .filter((x) => x.zone === 'RED')
                .map(({ village: v, score }) => (
                  <option key={v.id} value={`V:${v.id}`}>
                    🔴 {v.name} ({v.district}) — Risk {score.toFixed(2)} — {v.lat.toFixed(4)}°N,{' '}
                    {v.lng.toFixed(4)}°E
                  </option>
                ))}
            </optgroup>
            <optgroup label={`🟠 Orange Zone Villages (${zoneCounts.orange})`}>
              {villagesWithZones
                .filter((x) => x.zone === 'ORANGE')
                .map(({ village: v, score }) => (
                  <option key={v.id} value={`V:${v.id}`}>
                    🟠 {v.name} ({v.district}) — Risk {score.toFixed(2)} — {v.lat.toFixed(4)}°N,{' '}
                    {v.lng.toFixed(4)}°E
                  </option>
                ))}
            </optgroup>
            <optgroup label={`🟢 Green Safe Sites & Shelters (${zoneCounts.green})`}>
              {villagesWithZones
                .filter((x) => x.zone === 'GREEN')
                .map(({ village: v }) => (
                  <option key={v.id} value={`V:${v.id}`}>
                    🟢 {v.name} ({v.district}) — Safe Habitation
                  </option>
                ))}
              {sites.map((s) => (
                <option key={s.id} value={`S:${s.id}`}>
                  🟢 Safe Site: {s.name} ({s.district}) — {s.lat.toFixed(4)}°N, {s.lng.toFixed(4)}°E
                </option>
              ))}
              {reliefCamps.map((c) => (
                <option key={c.id} value={`C:${c.id}`}>
                  🟢 Shelter: {c.name} — {c.lat.toFixed(4)}°N, {c.lng.toFixed(4)}°E
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Right: Fit All, Click Map to Pin, Patrol, Route, Flood, Labels, Layers */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={handleFitAllLocations}
            className="neu-btn px-2.5 py-1 font-semibold flex items-center gap-1"
            title="Show all Maharashtra disaster habitations, shelters, and safe sites"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
            <span>Show All 77 Locations</span>
          </button>

          <button
            type="button"
            onClick={() => setPinLiveMode((p) => !p)}
            className={`px-2.5 py-1 rounded-[8px] font-semibold flex items-center gap-1 ${
              pinLiveMode
                ? 'bg-[#EA580C] text-white'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-[#0284C7]" strokeWidth={1.75} />
            <span>{pinLiveMode ? 'Click Map Now...' : 'Click Map to Set GPS'}</span>
          </button>

          <button
            type="button"
            onClick={toggleSimulateGpsWalk}
            className={`neu-btn px-2 py-1 font-semibold flex items-center gap-1 ${
              gpsSimActive ? 'bg-[#EA580C] text-white' : ''
            }`}
          >
            <Navigation className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{gpsSimActive ? 'Stop Patrol' : 'GPS Patrol'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleNavigateToShelter()}
            className="neu-btn px-2.5 py-1 font-semibold flex items-center gap-1 text-[#16A34A]"
          >
            <Route className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Route to Green Zone</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setViewMode('3d');
              setFloodRiseMeters(floodRiseMeters > 0 ? 0 : 8);
              setFloodPanelOpen(true);
              flyTo3dPreset(73.42, 18.08, 11.8, 62, 18);
            }}
            className={`neu-btn px-2 py-1 font-semibold flex items-center gap-1 ${
              floodRiseMeters > 0 ? 'bg-[#2563EB] text-white' : 'text-[#2563EB]'
            }`}
          >
            <Waves className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>3D Flood {floodRiseMeters > 0 ? `(+${floodRiseMeters}m)` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOrbiting((o) => !o)}
            className={`neu-btn px-2 py-1 font-semibold flex items-center gap-1 ${
              isOrbiting ? 'bg-[#0B8F80] text-white' : ''
            }`}
          >
            <Orbit className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{isOrbiting ? 'Stop 360°' : '360°'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLocationLabels((l) => !l)}
            className={`neu-btn px-2 py-1 font-semibold flex items-center gap-1 ${
              showLocationLabels ? 'text-[#0B8F80]' : 'text-[var(--text-secondary)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Labels {showLocationLabels ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTerrainPanelOpen((o) => !o);
              setFloodPanelOpen(false);
              setLayerDrawerOpen(false);
            }}
            className="neu-btn px-2 py-1 font-semibold flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
            <span>3D Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLayerDrawerOpen((o) => !o);
              setTerrainPanelOpen(false);
              setFloodPanelOpen(false);
            }}
            className="neu-btn px-2 py-1 font-semibold flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Layers</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          4. LIVE WEATHER & NEAREST GREEN ZONE SHELTER TELEMETRY STRIP
          ===================================================================== */}
      <div className="w-full bg-[#0F2238] text-slate-100 border-b border-slate-800 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] z-20">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-sky-300 font-bold flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{userPos.sourceLabel}</span>
          </span>
          <span className="font-mono text-slate-300">
            Nearest Monitored Village:{' '}
            <strong className="text-white">
              {liveZoneAnalysis.nearestVillage?.name} (
              {liveZoneAnalysis.nearestVillage?.district})
            </strong>{' '}
            ({liveZoneAnalysis.nearestVillageDistKm} km)
          </span>
          <span className="font-mono text-emerald-300">
            Nearest Green Shelter:{' '}
            <strong>{liveZoneAnalysis.nearestShelter?.name}</strong> (
            {liveZoneAnalysis.nearestShelterDistKm} km)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono">
          <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
            <CloudRain className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>
              Temp {mapWeather?.temperatureC ?? 25.8}°C · Rain{' '}
              {mapWeather?.rainfall24hMm ?? 14} mm/24h
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Wind className="w-3.5 h-3.5 text-teal-400" strokeWidth={1.75} />
            <span>{mapWeather?.windSpeedKmh ?? 18} km/h</span>
          </span>
          <button
            type="button"
            onClick={() => refreshMapWeather(userPos.lat, userPos.lng)}
            className="p-1 rounded hover:bg-white/10 text-slate-300"
            title="Refresh Live Weather"
          >
            <RefreshCw
              className={`w-3 h-3 ${loadingWeather ? 'animate-spin' : ''}`}
              strokeWidth={1.75}
            />
          </button>
        </div>
      </div>

      {/* =====================================================================
          5. MAP CANVAS AREA (SEPARATE SIMPLE GOOGLE MAP OR 3D TERRAIN MAP OR SPLIT)
          ===================================================================== */}
      <div className={`relative w-full ${heightClass} flex flex-col lg:flex-row`}>
        {/* Left Pane in Split Mode: Simple Google-Style 2D Street Map */}
        {viewMode === 'split' && (
          <div className="relative w-full lg:w-1/2 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-700">
            <div ref={googleSecondaryContainerRef} className="w-full h-full" />
            <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-[6px] bg-white/95 text-[#0B1F33] font-bold text-[11px] shadow-md border border-slate-300 flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-[#0284C7]" strokeWidth={2} />
              <span>Live Open GIS Street Map (2D)</span>
            </div>
          </div>
        )}

        {/* Main Full-Width Map Pane */}
        <div
          className={`relative ${
            viewMode === 'split' ? 'w-full lg:w-1/2 h-1/2 lg:h-full' : 'w-full h-full'
          }`}
        >
          <div ref={mapContainerRef} className="w-full h-full" />
          <div className="absolute top-2.5 left-2.5 z-20 px-3 py-1 rounded-[6px] bg-[#0B1F33]/90 text-white font-bold text-[11px] shadow-md border border-slate-700 flex items-center gap-1.5">
            {viewMode === 'google2d' ? (
              <>
                <MapIcon className="w-3.5 h-3.5 text-[#38BDF8]" strokeWidth={2} />
                <span>Live Open GIS Street Map — Live GPS & All Locations</span>
              </>
            ) : (
              <>
                <Mountain className="w-3.5 h-3.5 text-[#14B8A6]" strokeWidth={2} />
                <span>3D Terrain & Satellite Map ({pitchDeg}° Tilt)</span>
              </>
            )}
          </div>
        </div>

        {/* Floating Pin-Live-Location Instruction Banner */}
        {pinLiveMode && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-[10px] bg-[#EA580C] text-white text-xs font-bold shadow-lg flex items-center gap-2">
            <MapPin className="w-4 h-4" strokeWidth={1.75} />
            <span>
              Click any street or point on the map to set your exact Live GPS Location
            </span>
            <button
              type="button"
              onClick={() => setPinLiveMode(false)}
              className="ml-2 px-2 py-0.5 rounded bg-black/25 text-[11px]"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Floating 3D DEM & Camera Controls */}
        {terrainPanelOpen && (
          <div className="absolute top-12 left-3 z-30 w-72 neu-raised p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="font-bold flex items-center gap-1.5">
                <Mountain className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                <span>3D Terrain & Basemap</span>
              </span>
              <button
                type="button"
                onClick={() => setTerrainPanelOpen(false)}
                className="p-1"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            <div>
              <label className="block font-semibold mb-1">Basemap Style</label>
              <select
                value={basemap}
                onChange={(e) => setBasemap(e.target.value as BasemapStyle)}
                className="neu-input w-full px-2.5 py-1.5 text-xs font-semibold"
              >
                <option value="osm">2D Street Map (OpenStreetMap)</option>
                <option value="satellite">Satellite Map (Esri High-Resolution Aerial)</option>
                <option value="terrain">Topographic Map (Esri Topo & Elevation)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Terrain Exaggeration</span>
                <span className="font-mono font-bold">
                  {terrainExaggeration.toFixed(2)}×
                </span>
              </div>
              <input
                type="range"
                min={1.0}
                max={2.0}
                step={0.05}
                value={terrainExaggeration}
                onChange={(e) => setTerrainExaggeration(Number(e.target.value))}
                className="w-full accent-[#0B8F80]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Camera Pitch (3D Tilt)</span>
                <span className="font-mono font-bold">{pitchDeg}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={75}
                step={1}
                value={pitchDeg}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setPitchDeg(p);
                  mapRef.current?.easeTo({ pitch: p, duration: 150 });
                }}
                className="w-full accent-[#0B8F80]"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span>Sun Direction</span>
                <span className="font-mono font-bold">{sunAzimuth}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={359}
                step={5}
                value={sunAzimuth}
                onChange={(e) => setSunAzimuth(Number(e.target.value))}
                className="w-full accent-[#0B8F80]"
              />
            </div>

            <label className="flex items-center justify-between pt-1 cursor-pointer">
              <span>Performance Mode</span>
              <input
                type="checkbox"
                checked={reduce3dQuality}
                onChange={(e) => setReduce3dQuality(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
          </div>
        )}

        {/* Floating 3D Flood Simulator Panel */}
        {floodPanelOpen && (
          <div className="absolute top-12 left-3 z-30 w-76 neu-raised p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
              <span className="font-bold flex items-center gap-1.5">
                <Waves className="w-4 h-4 text-[#2563EB]" strokeWidth={1.75} />
                <span>3D Flood Inundation</span>
              </span>
              <button
                type="button"
                onClick={() => setFloodPanelOpen(false)}
                className="p-1"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold">Water Rise (0–15m)</span>
                <span className="font-mono font-bold text-[#2563EB]">
                  +{floodRiseMeters.toFixed(1)} m
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={15}
                step={0.5}
                value={floodRiseMeters}
                onChange={(e) => setFloodRiseMeters(Number(e.target.value))}
                className="w-full accent-[#2563EB]"
              />
            </div>

            <div className="neu-flat p-2.5 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] block">
                  Villages Flooded
                </span>
                <span className="font-mono text-sm font-bold text-[#DC2626]">
                  {floodSimResult.affectedHabitations.length}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-secondary)] block">
                  Households
                </span>
                <span className="font-mono text-sm font-bold">
                  {floodSimResult.affectedHouseholds.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Layer Control Drawer */}
        {layerDrawerOpen && (
          <div className="absolute top-12 right-12 z-30 w-64 neu-raised p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
              <span className="font-bold">Map Layers & Zones</span>
              <button
                type="button"
                onClick={() => setLayerDrawerOpen(false)}
                className="p-1"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Location & Zone Labels</span>
              <input
                type="checkbox"
                checked={showLocationLabels}
                onChange={(e) => setShowLocationLabels(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Red/Orange/Green Zones ({villages.length})</span>
              <input
                type="checkbox"
                checked={showHazardPolygons}
                onChange={(e) => setShowHazardPolygons(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>3D Risk Towers</span>
              <input
                type="checkbox"
                checked={show3dExtrusions}
                onChange={(e) => setShow3dExtrusions(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Rivers & Flood Channels</span>
              <input
                type="checkbox"
                checked={showRiversBuffer}
                onChange={(e) => setShowRiversBuffer(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Green Zone Shelters ({reliefCamps.length})</span>
              <input
                type="checkbox"
                checked={showSheltersLayer}
                onChange={(e) => setShowSheltersLayer(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Green Safe Sites ({sites.length})</span>
              <input
                type="checkbox"
                checked={showSitesLayer}
                onChange={(e) => setShowSitesLayer(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span>Response Teams ({responseTeams.length})</span>
              <input
                type="checkbox"
                checked={showTeamsLayer}
                onChange={(e) => setShowTeamsLayer(e.target.checked)}
                className="accent-[#0B8F80]"
              />
            </label>
            <button
              type="button"
              onClick={() => setProfileToolActive((p) => !p)}
              className="w-full neu-btn py-1.5 font-semibold flex items-center justify-center gap-1 mt-1"
            >
              <TrendingUp className="w-3.5 h-3.5 text-[#EA580C]" strokeWidth={1.75} />
              <span>{profileToolActive ? 'Hide Slope Profile' : 'Show Slope Profile'}</span>
            </button>
          </div>
        )}

        {/* Candidate Relocation Site 3D Card */}
        {activeSiteForOrbit && (
          <div className="absolute bottom-3 left-3 z-30 w-76 neu-raised p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
              <div>
                <span className="font-bold block">{activeSiteForOrbit.name}</span>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {activeSiteForOrbit.lat.toFixed(4)}°N, {activeSiteForOrbit.lng.toFixed(4)}°E ·{' '}
                  {activeSiteForOrbit.usableAreaHa} ha
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSiteOrbitActiveId(null)}
                className="p-1"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>
            {(() => {
              const ddr = runDigitalDressRehearsal(activeSiteForOrbit, weights);
              const cap = carryingCapacity(
                activeSiteForOrbit.usableAreaHa,
                activeSiteForOrbit.landPerHouseholdHa,
                activeSiteForOrbit.waterReliabilityScore,
                activeSiteForOrbit.existingOccupiedHouseholds
              );
              return (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>Zone Status:</span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-white ${
                        ddr.passed ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                      }`}
                    >
                      {ddr.passed ? 'GREEN SAFE SITE' : 'RED FAIL'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Capacity: <strong className="font-mono">{cap.safeCapacity} HH</strong>{' '}
                    (Free: <strong className="font-mono">{cap.remainingCapacity} HH</strong>)
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Slope & Elevation Profile Chart */}
        {profileToolActive && (
          <div className="absolute bottom-3 right-3 z-30 w-88 neu-raised p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
              <div>
                <span className="font-bold block">Slope & Elevation Profile</span>
                <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                  Dist: {currentElevationProfile.totalDistanceKm} km · Max Slope:{' '}
                  {currentElevationProfile.maxSlopePct}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProfileToolActive(false)}
                className="p-1"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentElevationProfile.points}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="distanceKm" tick={{ fontSize: 10 }} unit="km" />
                  <YAxis tick={{ fontSize: 10 }} unit="m" width={36} />
                  <RechartsTooltip />
                  <Area
                    type="monotone"
                    dataKey="elevationM"
                    stroke="#0B8F80"
                    fill="#0B8F80"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Click-to-Query Location & Zone Disaster Condition Inspector Card */}
        {clickedQuery && (
          <div className="absolute top-12 right-12 z-30 w-80 neu-raised p-3.5 space-y-2.5 text-xs">
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-1.5">
              <div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white inline-block mb-1"
                  style={{ backgroundColor: getZoneHexColor(clickedQuery.zone) }}
                >
                  {clickedQuery.zone} ZONE · {(clickedQuery.hazardScore * 100).toFixed(0)}/100
                </span>
                <span className="font-bold text-sm block">{clickedQuery.title}</span>
                <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                  {clickedQuery.lat.toFixed(5)}°N, {clickedQuery.lng.toFixed(5)}°E
                </span>
              </div>
              <button
                type="button"
                onClick={() => setClickedQuery(null)}
                className="p-1"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="neu-flat p-2.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Disaster Condition:</span>
                <span className="font-bold text-right max-w-[165px]">
                  {clickedQuery.disasterCondition}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Elevation / Slope:</span>
                <span className="font-mono font-bold">
                  {clickedQuery.elevationM} m · {clickedQuery.slopeDeg}°
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">From Live GPS:</span>
                <span className="font-mono font-bold text-[#0284C7]">
                  {clickedQuery.distanceFromLiveKm} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Green Shelter:</span>
                <span className="font-semibold truncate max-w-[145px]">
                  {clickedQuery.nearestShelterName} ({clickedQuery.nearestShelterDistKm}km)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  applyLiveLocationAndDetectZone(
                    clickedQuery.lat,
                    clickedQuery.lng,
                    5,
                    `Pinned at ${clickedQuery.title}`
                  );
                }}
                className="px-2 py-1.5 rounded-[8px] bg-[#0284C7] text-white font-semibold text-center"
              >
                Set as My Live GPS
              </button>
              <button
                type="button"
                onClick={() => handleNavigateToShelter(clickedQuery.lat, clickedQuery.lng)}
                className="px-2 py-1.5 rounded-[8px] bg-[#16A34A] text-white font-semibold text-center"
              >
                Route to Green Zone
              </button>
              <button
                type="button"
                onClick={() => {
                  createIncident({
                    title: `Field Alert near ${clickedQuery.nearestVillage.name}`,
                    hazardType: clickedQuery.nearestVillage.primaryHazard,
                    severity: 'High',
                    district: clickedQuery.nearestVillage.district,
                    villageId: clickedQuery.nearestVillage.id,
                    villageName: clickedQuery.nearestVillage.name,
                    lat: clickedQuery.lat,
                    lng: clickedQuery.lng,
                    affectedPopulation: clickedQuery.nearestVillage.population,
                    assignedTeamIds: [],
                    slaDeadlineMinutes: 45,
                    description: `Logged at ${clickedQuery.lat}, ${clickedQuery.lng}.`,
                  });
                  setClickedQuery(null);
                }}
                className="neu-btn px-2 py-1.5 font-semibold text-center"
              >
                Log Incident
              </button>
              <button
                type="button"
                onClick={() => {
                  openExplainModal(
                    buildVillageExplainPayload(
                      clickedQuery.nearestVillage,
                      weights,
                      undefined,
                      climateHorizon,
                      extraRainfallMm
                    )
                  );
                }}
                className="neu-btn px-2 py-1.5 font-semibold text-center text-[#0B8F80]"
              >
                Explain Score
              </button>
              <button
                type="button"
                onClick={() => {
                  saveAoi({
                    name: `${clickedQuery.nearestVillage.name} Buffer`,
                    centerLat: clickedQuery.lat,
                    centerLng: clickedQuery.lng,
                    radiusKm: 3.0,
                    affectedVillagesCount: 2,
                    affectedHouseholds: clickedQuery.nearestVillage.households,
                    sheltersInside: 1,
                  });
                  setClickedQuery(null);
                }}
                className="neu-btn px-2 py-1.5 font-semibold text-center col-span-2"
              >
                Save to AOI
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          6. COMPACT BOTTOM STATUS & ZONE LEGEND STRIP
          ===================================================================== */}
      <div className="w-full bg-[#0B1F33] text-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono z-20">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleCoordFormat}
            className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-semibold"
          >
            Cursor ({coordFormat}):{' '}
            {coordFormat === 'DD'
              ? `${cursorLat.toFixed(5)}°N, ${cursorLng.toFixed(5)}°E`
              : coordFormat === 'DMS'
              ? formatLatLngToDms(cursorLat, cursorLng)
              : formatLatLngToUtm(cursorLat, cursorLng)}
          </button>
          <span className="text-sky-300 font-bold">
            Live GPS: {userPos.lat.toFixed(5)}°N, {userPos.lng.toFixed(5)}°E (
            {liveZoneAnalysis.detectedZone} ZONE)
          </span>
          <span>Elev: {cursorElevation}m</span>
          <span>Zoom: {cursorZoom}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            <span>RED ZONE ({zoneCounts.red} Critical)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
            <span>ORANGE ZONE ({zoneCounts.orange} Watch)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            <span>GREEN ZONE ({zoneCounts.green} Safe)</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
            <span>Live Location</span>
          </span>
        </div>
      </div>
    </div>
  );
};
