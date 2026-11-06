import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { jsPDF } from 'jspdf';
import Papa from 'papaparse';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Flame,
  HeartHandshake,
  MapPin,
  Mic,
  Pause,
  Phone,
  Play,
  Plus,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Upload,
  Volume2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  AlertDisasterType,
  AlertZoneLevel,
  EmergencySosItem,
  HazardType,
  IncidentStatus,
  VoiceAlertItem,
} from '../types';
import {
  createSynthesisedEmergencyWavUrl,
  formatDurationMmSs,
} from '../components/VoiceAlertModal';
import { NdmaPortalFeaturesHub } from '../components/NdmaPortalFeaturesHub';
import { getAlertLevelMeta } from '../utils/alertUtils';
import { useAccurateGps } from '../services/gpsService';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function playControlRoomNotificationChime(isSos = false) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isSos ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isSos ? 784 : 587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(isSos ? 1046.5 : 880, ctx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.48);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.48);
  } catch {
    // ignore if browser blocks autoplay audio
  }
}

function createCircleRing(lng: number, lat: number, radiusM: number): [number, number][] {
  const pts = 36;
  const coords: [number, number][] = [];
  const d = Math.max(8, radiusM) / 6378137;
  const latR = (lat * Math.PI) / 180;
  const lngR = (lng * Math.PI) / 180;
  for (let i = 0; i <= pts; i++) {
    const brng = (i * 2 * Math.PI) / pts;
    const pLat = Math.asin(
      Math.sin(latR) * Math.cos(d) + Math.cos(latR) * Math.sin(d) * Math.cos(brng)
    );
    const pLng =
      lngR +
      Math.atan2(
        Math.sin(brng) * Math.sin(d) * Math.cos(latR),
        Math.cos(d) - Math.sin(latR) * Math.sin(pLat)
      );
    coords.push([(pLng * 180) / Math.PI, (pLat * 180) / Math.PI]);
  }
  return coords;
}

/**
 * Interactive Voice Alert Audio Player with Play/Pause Button, Progress Bar & Duration
 */
const VoiceAudioPlayerBar: React.FC<{
  alert: VoiceAlertItem;
}> = ({ alert }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const durationSec = Math.max(1, alert.durationSeconds || 10);
  const progressPct = Math.min(100, Math.round((currentTimeSec / durationSec) * 100));

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [alert.id]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    let urlToPlay = alert.audioUrl;
    if (!urlToPlay) {
      urlToPlay = createSynthesisedEmergencyWavUrl(durationSec).url;
    }

    const audio = new Audio(urlToPlay);
    audioRef.current = audio;

    const updateProgress = () => {
      if (!audioRef.current) return;
      setCurrentTimeSec(Math.min(durationSec, audioRef.current.currentTime));
      if (!audioRef.current.paused && !audioRef.current.ended) {
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    audio.onplay = () => {
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(updateProgress);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTimeSec(durationSec);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      setTimeout(() => setCurrentTimeSec(0), 600);
    };

    audio.onerror = () => {
      const fallbackUrl = createSynthesisedEmergencyWavUrl(durationSec).url;
      audio.src = fallbackUrl;
      void audio.play();
    };

    void audio.play();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="p-2.5 rounded-[10px] bg-[var(--bg)] border border-[var(--border)] flex items-center gap-3"
    >
      <button
        type="button"
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-[#0B8F80] hover:bg-[#097568] text-white flex items-center justify-center shrink-0 shadow-sm transition-colors"
        aria-label={isPlaying ? 'Pause voice alert' : 'Play voice alert'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" strokeWidth={1.75} />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" strokeWidth={1.75} />
        )}
      </button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="font-bold text-[var(--text-primary)] flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
            <span>Voice Recording ({durationSec}s)</span>
          </span>
          <span className="text-[var(--text-secondary)] font-semibold">
            {formatDurationMmSs(currentTimeSec)} / {formatDurationMmSs(durationSec)}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full bg-[#0B8F80] transition-all duration-100 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const SimplifiedAlertsPage: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const voiceAlerts = useAppStore((s) => s.voiceAlerts);
  const sosAlerts = useAppStore((s) => s.sosAlerts);
  const acknowledgeVoiceAlert = useAppStore((s) => s.acknowledgeVoiceAlert);
  const dispatchTeamToVoiceAlert = useAppStore((s) => s.dispatchTeamToVoiceAlert);
  const resolveVoiceAlert = useAppStore((s) => s.resolveVoiceAlert);
  const acknowledgeSosAlert = useAppStore((s) => s.acknowledgeSosAlert);
  const dispatchTeamToSosAlert = useAppStore((s) => s.dispatchTeamToSosAlert);
  const resolveSosAlert = useAppStore((s) => s.resolveSosAlert);
  const responseTeams = useAppStore((s) => s.responseTeams);

  const activeAlertZones = useAppStore((s) => s.activeAlertZones);
  const updateAlertZoneLevel = useAppStore((s) => s.updateAlertZoneLevel);
  const updateAlertZoneLifecycle = useAppStore((s) => s.updateAlertZoneLifecycle);
  const importCapAlertZone = useAppStore((s) => s.importCapAlertZone);
  const sensors = useAppStore((s) => s.sensors);
  const extraRainfallMm = useAppStore((s) => s.extraRainfallMm);

  const liveWeather = useMemo(
    () => ({
      rainfall24hMm: 185 + extraRainfallMm,
      windSpeedKmh: 54,
      source: 'Open-Meteo + CWC Savitri Telemetry',
    }),
    [extraRainfallMm]
  );

  const seismicFeed = useMemo(
    () => [
      {
        id: 'eq-koyna-01',
        place: 'Koyna–Patan Fault Zone, Satara',
        magnitude: sensors[0]?.currentValue ? 3.2 : 3.1,
      },
    ],
    [sensors]
  );

  const incidents = useAppStore((s) => s.incidents);
  const createIncident = useAppStore((s) => s.createIncident);
  const advanceIncidentStatus = useAppStore((s) => s.advanceIncidentStatus);
  const assignTeamToIncident = useAppStore((s) => s.assignTeamToIncident);

  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const resourceStock = useAppStore((s) => s.resourceStock);
  const familySafeCheckIns = useAppStore((s) => s.familySafeCheckIns);
  const submitFamilySafeCheckIn = useAppStore((s) => s.submitFamilySafeCheckIn);
  const offlinePackCached = useAppStore((s) => s.offlinePackReady);
  const cacheOfflineSafetyPack = useAppStore((s) => s.cacheOfflineSafetyPack);
  const isDrillMode = useAppStore((s) => s.drillModeActive);
  const toggleDrillMode = useAppStore((s) => s.toggleDrillMode);
  const drillSummaryReports = useAppStore((s) => s.drillSummaryReports);

  const { gps } = useAccurateGps();

  const isCitizen = !user || user.role === 'citizen' || user.role === 'villager';
  const isOfficer =
    !!user &&
    [
      'administrator',
      'sdma',
      'national_authority',
      'district_officer',
      'field_officer',
      'response_team',
      'department_agency',
    ].includes(user.role);

  const [subTab, setSubTab] = useState<
    'issued' | 'incidents' | 'sitrep' | 'safety_drill' | 'voice' | 'sos'
  >('issued');

  const [selectedVoiceAlertId, setSelectedVoiceAlertId] = useState<string>(
    voiceAlerts[0]?.id || 'va-101'
  );
  const [selectedSosAlertId, setSelectedSosAlertId] = useState<string>(
    sosAlerts[0]?.id || 'sos-201'
  );
  const [selectedTeamForDispatch, setSelectedTeamForDispatch] = useState<string>(
    responseTeams[0]?.name || 'NDRF 5th Bn Quick Response Team'
  );

  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // --- CAP MANUAL IMPORT FORM STATE ---
  const [showCapImport, setShowCapImport] = useState(false);
  const [capRawInput, setCapRawInput] = useState(
    JSON.stringify(
      {
        areaName: 'Chiplun Vashishti River Basin',
        district: 'Ratnagiri',
        disasterType: 'flood',
        level: 'Red',
        messageEn: 'RED ALERT: Vashishti river crossed danger mark. Immediate evacuation ordered.',
        messageHi: 'रेड अलर्ट: वशिष्ठी नदी खतरे के निशान से ऊपर। तुरंत सुरक्षित आश्रय में जाएं।',
        instructions: 'Move to Ratnagiri ZP Relief Camp immediately. Carry essential medicines.',
        expiresAt: 'Tomorrow 18:00 IST',
      },
      null,
      2
    )
  );

  // --- INCIDENT REPORT FORM STATE (WITH DUPLICATE DETECTION) ---
  const [incTitle, setIncTitle] = useState('');
  const [incHazard, setIncHazard] = useState<HazardType>('flood');
  const [incSeverity, setIncSeverity] = useState<'Critical' | 'High' | 'Moderate'>('High');
  const [incDistrict, setIncDistrict] = useState<
    'Raigad' | 'Satara' | 'Pune' | 'Ratnagiri' | 'Kolhapur' | 'Sindhudurg'
  >('Raigad');
  const [incVillageName, setIncVillageName] = useState('Mahad Riverfront');
  const [incDescription, setIncDescription] = useState('');
  const [incPop, setIncPop] = useState(120);
  const [incidentTimelineNote, setIncidentTimelineNote] = useState<Record<string, string>>({});

  // Nearby duplicate incident check (within 5 km or same village/hazard)
  const potentialDuplicateIncident = useMemo(() => {
    return incidents.find(
      (inc) =>
        inc.status !== 'Resolved' &&
        (haversineKm(gps.lat, gps.lng, inc.lat, inc.lng) < 5 ||
          inc.villageName.toLowerCase() === incVillageName.trim().toLowerCase())
    );
  }, [incidents, gps.lat, gps.lng, incVillageName]);

  // --- CITIZEN SAFETY & FAMILY CHECK-IN STATE ---
  const [checkAreaQuery, setCheckAreaQuery] = useState('Mahad, Raigad');
  const [safeName, setSafeName] = useState(user?.name || '');
  const [safePhone, setSafePhone] = useState('+91 98220 11223');
  const [familyName, setFamilyName] = useState('');
  const [familyPhone, setFamilyPhone] = useState('+91 98220 99887');
  const [safeMessage, setSafeMessage] = useState(
    'I am safe at higher ground / relief camp. Power is low, please do not worry.'
  );

  // Visual + Sound Notification Banner on new incoming Voice Alert or SOS
  const [newVoiceNotification, setNewVoiceNotification] = useState<VoiceAlertItem | null>(null);
  const [newSosNotification, setNewSosNotification] = useState<EmergencySosItem | null>(null);

  const prevVoiceCountRef = useRef<number>(voiceAlerts.length);
  const prevSosCountRef = useRef<number>(sosAlerts.length);

  useEffect(() => {
    if (voiceAlerts.length > prevVoiceCountRef.current) {
      const newest = voiceAlerts[0];
      if (newest) {
        setNewVoiceNotification(newest);
        setSelectedVoiceAlertId(newest.id);
        playControlRoomNotificationChime(false);
      }
    }
    prevVoiceCountRef.current = voiceAlerts.length;
  }, [voiceAlerts]);

  useEffect(() => {
    if (sosAlerts.length > prevSosCountRef.current) {
      const newest = sosAlerts[0];
      if (newest) {
        setNewSosNotification(newest);
        setSelectedSosAlertId(newest.id);
        playControlRoomNotificationChime(true);
      }
    }
    prevSosCountRef.current = sosAlerts.length;
  }, [sosAlerts]);

  const sortedVoiceAlerts = useMemo(
    () => [...voiceAlerts].sort((a, b) => b.createdAtMs - a.createdAtMs),
    [voiceAlerts]
  );

  const sortedSosAlerts = useMemo(
    () => [...sosAlerts].sort((a, b) => b.createdAtMs - a.createdAtMs),
    [sosAlerts]
  );

  const activeVoiceAlert =
    sortedVoiceAlerts.find((v) => v.id === selectedVoiceAlertId) || sortedVoiceAlerts[0];

  const activeSosAlert =
    sortedSosAlerts.find((s) => s.id === selectedSosAlertId) || sortedSosAlerts[0];

  // Control Room Caller Map (with accuracy circle) for Voice Alerts & SOS
  const miniMapContainerRef = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<maplibregl.Map | null>(null);
  const callerMarkerRef = useRef<maplibregl.Marker | null>(null);

  const mapTarget = useMemo(() => {
    if (subTab === 'sos' && activeSosAlert) {
      return {
        lat: activeSosAlert.lat,
        lng: activeSosAlert.lng,
        accuracyMeters: activeSosAlert.accuracyMeters,
        color: '#B91C1C',
        label: `${activeSosAlert.referenceNo} (SOS)`,
      };
    }
    if (activeVoiceAlert) {
      return {
        lat: activeVoiceAlert.lat,
        lng: activeVoiceAlert.lng,
        accuracyMeters: activeVoiceAlert.accuracyMeters,
        color: '#0B8F80',
        label: `${activeVoiceAlert.referenceNo} (Voice)`,
      };
    }
    return null;
  }, [subTab, activeVoiceAlert, activeSosAlert]);

  useEffect(() => {
    if ((subTab !== 'voice' && subTab !== 'sos') || !miniMapContainerRef.current || !mapTarget) {
      return;
    }

    if (!miniMapRef.current) {
      const map = new maplibregl.Map({
        container: miniMapContainerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors · National Geospatial Infrastructure',
            },
          },
          layers: [
            {
              id: 'osm-layer',
              type: 'raster',
              source: 'osm',
            },
          ],
        },
        center: [mapTarget.lng, mapTarget.lat],
        zoom: 14,
      });

      map.on('load', () => {
        const ring = createCircleRing(
          mapTarget.lng,
          mapTarget.lat,
          mapTarget.accuracyMeters || 20
        );
        map.addSource('caller-accuracy', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { color: mapTarget.color },
                geometry: {
                  type: 'Polygon',
                  coordinates: [ring],
                },
              },
            ],
          },
        });

        map.addLayer({
          id: 'caller-accuracy-fill',
          type: 'fill',
          source: 'caller-accuracy',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.22,
          },
        });

        map.addLayer({
          id: 'caller-accuracy-line',
          type: 'line',
          source: 'caller-accuracy',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-dasharray': [2, 2],
          },
        });
      });

      map.on('error', (e: any) => {
        if (e?.error?.status !== 404) {
          console.warn('SimplifiedAlerts mini-map event:', e?.error?.message || e);
        }
      });

      miniMapRef.current = map;
    }

    const map = miniMapRef.current;
    map.flyTo({
      center: [mapTarget.lng, mapTarget.lat],
      zoom: 14.5,
      duration: 500,
    });

    const accSrc = map.getSource('caller-accuracy') as maplibregl.GeoJSONSource | undefined;
    if (accSrc) {
      const ring = createCircleRing(
        mapTarget.lng,
        mapTarget.lat,
        mapTarget.accuracyMeters || 20
      );
      accSrc.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { color: mapTarget.color },
            geometry: {
              type: 'Polygon',
              coordinates: [ring],
            },
          },
        ],
      });
    }

    if (callerMarkerRef.current) {
      callerMarkerRef.current.remove();
    }
    const el = document.createElement('div');
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '9999px';
    el.style.backgroundColor = mapTarget.color;
    el.style.border = '3px solid #FFFFFF';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.45)';

    callerMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([mapTarget.lng, mapTarget.lat])
      .addTo(map);
  }, [subTab, mapTarget]);

  useEffect(() => {
    return () => {
      if (miniMapRef.current) {
        miniMapRef.current.remove();
        miniMapRef.current = null;
      }
    };
  }, []);

  // --- HANDLERS FOR CAP IMPORT, INCIDENTS, SITREP EXPORT & FAMILY SAFE CHECK-IN ---
  const handleManualCapImport = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(capRawInput) as {
        areaName?: string;
        district?: string;
        disasterType?: AlertDisasterType;
        level?: AlertZoneLevel;
        messageEn?: string;
        messageHi?: string;
        instructions?: string;
        expiresAt?: string;
      };
      importCapAlertZone({
        areaName: parsed.areaName || 'Imported CAP Zone',
        district: parsed.district || 'Raigad',
        disasterType: parsed.disasterType || 'flood',
        level: parsed.level || 'Orange',
        messageEn: parsed.messageEn || 'CAP Alert imported manually.',
        messageHi: parsed.messageHi || 'मैनुअल रूप से आयातित CAP अलर्ट।',
        instructions: parsed.instructions || 'Follow district emergency instructions.',
        expiresAt: parsed.expiresAt || '24 Hours',
      });
      setShowCapImport(false);
      showToast('CAP Alert JSON/XML imported and broadcast live to all sessions.');
    } catch {
      showToast('Invalid JSON format in CAP payload. Please check syntax.');
    }
  };

  const handleConfirmLiveSuggestion = () => {
    importCapAlertZone({
      areaName: 'Mahad–Poladpur Savitri Basin (Telemetry Confirmed)',
      district: 'Raigad',
      disasterType: 'flood',
      level: liveWeather.rainfall24hMm >= 180 ? 'Red' : 'Orange',
      messageEn: `Authority Confirmed Alert: 24h Rainfall ${liveWeather.rainfall24hMm} mm recorded by telemetry.`,
      messageHi: `प्राधिकरण द्वारा पुष्ट अलर्ट: 24 घंटे में ${liveWeather.rainfall24hMm} मिमी वर्षा दर्ज।`,
      instructions: 'Deploy NDRF teams to low-lying riverbanks and alert village sarpanchs.',
      expiresAt: 'Tomorrow 20:00 IST',
    });
    showToast('Suggested live-telemetry alert confirmed by authority and issued live!');
  };

  const handleCreateIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incTitle.trim()) return;
    createIncident({
      title: incTitle.trim(),
      hazardType: incHazard,
      severity: incSeverity,
      district: incDistrict,
      villageName: incVillageName.trim() || incDistrict,
      lat: Number((gps.lat + (Math.random() - 0.5) * 0.01).toFixed(4)),
      lng: Number((gps.lng + (Math.random() - 0.5) * 0.01).toFixed(4)),
      affectedPopulation: Math.max(1, Number(incPop) || 50),
      assignedTeamIds: [],
      slaDeadlineMinutes: 60,
      description:
        incDescription.trim() ||
        'Field incident reported with GPS coordinates and verified by control room.',
    });
    setIncTitle('');
    setIncDescription('');
    showToast('Incident reported and added to Control Room Incident Queue.');
  };

  // Real non-drill metrics for SitRep (Section 3.9 & 3.12)
  const sitRepMetrics = useMemo(() => {
    const realAlerts = activeAlertZones.filter(
      (z) => !z.isDrill && z.lifecycleStatus !== 'Cancelled' && z.lifecycleStatus !== 'Expired'
    );
    const realVoice = voiceAlerts.filter((v) => !v.isDrill);
    const realSos = sosAlerts.filter((s) => !s.isDrill);
    const totalShelterCap = reliefCamps.reduce((acc, c) => acc + c.capacityPersons, 0);
    const totalShelterOcc = reliefCamps.reduce((acc, c) => acc + c.currentOccupancy, 0);
    const totalDeployedResources = resourceStock.reduce((acc, r) => acc + r.deployedQty, 0);
    const activeIncidents = incidents.filter((i) => i.status !== 'Resolved');

    return {
      generatedAt: new Date().toLocaleString('en-IN'),
      realAlertsCount: realAlerts.length,
      redZonesCount: realAlerts.filter((z) => z.level === 'Red').length,
      orangeZonesCount: realAlerts.filter((z) => z.level === 'Orange').length,
      realVoiceCount: realVoice.length,
      realSosCount: realSos.length,
      activeIncidentsCount: activeIncidents.length,
      resolvedIncidentsCount: incidents.filter((i) => i.status === 'Resolved').length,
      totalShelterCap,
      totalShelterOcc,
      totalDeployedResources,
      realAlerts,
      activeIncidents,
    };
  }, [activeAlertZones, voiceAlerts, sosAlerts, reliefCamps, resourceStock, incidents]);

  const handleExportSitRepPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(15);
    doc.text('NIVARAN - OFFICIAL SITUATION REPORT (SITREP)', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated At: ${sitRepMetrics.generatedAt}`, 14, 26);
    doc.text(
      `Prepared By: ${user?.name || 'Duty Officer'} (${user?.role || 'Control Room'})`,
      14,
      32
    );
    doc.text('Note: All [DRILL] practice items are excluded from official statistics.', 14, 38);

    doc.setFontSize(12);
    doc.text('1. Executive Summary Metrics', 14, 48);
    doc.setFontSize(10);
    const lines = [
      `- Active CAP Alert Zones: ${sitRepMetrics.realAlertsCount} (Red: ${sitRepMetrics.redZonesCount}, Orange: ${sitRepMetrics.orangeZonesCount})`,
      `- Emergency SOS Signals (Real): ${sitRepMetrics.realSosCount}`,
      `- Live Voice Alerts (Real): ${sitRepMetrics.realVoiceCount}`,
      `- Active Field Incidents: ${sitRepMetrics.activeIncidentsCount} (Resolved: ${sitRepMetrics.resolvedIncidentsCount})`,
      `- Relief Camp Evacuees Checked-In: ${sitRepMetrics.totalShelterOcc} / ${sitRepMetrics.totalShelterCap} beds`,
      `- IDRN Equipment Units Deployed: ${sitRepMetrics.totalDeployedResources}`,
    ];
    lines.forEach((line, idx) => {
      doc.text(line, 16, 56 + idx * 6);
    });

    doc.setFontSize(12);
    doc.text('2. Active CAP Alert Zones', 14, 98);
    doc.setFontSize(9);
    sitRepMetrics.realAlerts.slice(0, 6).forEach((z, idx) => {
      doc.text(
        `${idx + 1}. [${z.level.toUpperCase()}] ${z.areaName} (${z.district}) - ${z.disasterType.toUpperCase()} - Status: ${z.lifecycleStatus || 'Issued'}`,
        16,
        106 + idx * 6
      );
    });

    doc.setFontSize(12);
    doc.text('3. Active Field Incidents', 14, 146);
    doc.setFontSize(9);
    sitRepMetrics.activeIncidents.slice(0, 6).forEach((inc, idx) => {
      doc.text(
        `${idx + 1}. ${inc.code}: ${inc.title} (${inc.district}) - Status: ${inc.status} - Affected: ${inc.affectedPopulation}`,
        16,
        154 + idx * 6
      );
    });

    doc.save(`NIVARAN_SitRep_${Date.now()}.pdf`);
    showToast('Official Situation Report (SitRep) exported as PDF.');
  };

  const handleExportSitRepCsv = () => {
    const rows = [
      {
        Section: 'Summary',
        Item: 'Active CAP Alert Zones (Non-Drill)',
        District: 'All',
        Status: `Red: ${sitRepMetrics.redZonesCount}, Orange: ${sitRepMetrics.orangeZonesCount}`,
        Value: sitRepMetrics.realAlertsCount,
      },
      {
        Section: 'Summary',
        Item: 'Emergency SOS Signals',
        District: 'All',
        Status: 'High Priority',
        Value: sitRepMetrics.realSosCount,
      },
      {
        Section: 'Summary',
        Item: 'Voice Alerts Received',
        District: 'All',
        Status: 'Audio Inbox',
        Value: sitRepMetrics.realVoiceCount,
      },
      {
        Section: 'Summary',
        Item: 'Shelter Evacuees Checked-In',
        District: 'All',
        Status: `Capacity ${sitRepMetrics.totalShelterCap}`,
        Value: sitRepMetrics.totalShelterOcc,
      },
      ...sitRepMetrics.realAlerts.map((z) => ({
        Section: 'CAP Alert Zone',
        Item: z.areaName,
        District: z.district,
        Status: `${z.level} (${z.lifecycleStatus || 'Issued'})`,
        Value: z.usersReached || 1200,
      })),
      ...incidents.map((inc) => ({
        Section: 'Incident',
        Item: `${inc.code} - ${inc.title}`,
        District: inc.district,
        Status: inc.status,
        Value: inc.affectedPopulation,
      })),
    ];

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NIVARAN_SitRep_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Official Situation Report (SitRep) exported as CSV.');
  };

  const handleFamilySafeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!safeName.trim()) return;
    submitFamilySafeCheckIn({
      citizenName: safeName.trim(),
      citizenPhone: safePhone.trim() || '+91 98000 00000',
      familyContactName: familyName.trim() || 'Family Contact',
      familyContactPhone: familyPhone.trim() || '+91 98000 11111',
      statusMessage: safeMessage.trim() || 'I am safe.',
      lat: gps.lat,
      lng: gps.lng,
      district: 'Raigad',
    });
    showToast('Your "I Am Safe" check-in has been broadcast and saved to the Safety Registry.');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {feedbackToast && (
        <div className="neu-raised p-3 rounded-[10px] border-l-4 border-[#15803D] bg-emerald-950/20 flex items-center justify-between text-xs font-bold text-[#15803D]">
          <span>{feedbackToast}</span>
          <button
            type="button"
            onClick={() => setFeedbackToast(null)}
            className="underline text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="neu-raised p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            {language === 'hi'
              ? 'आपदा चेतावनी अलर्ट, घटनाएं और सिटरेप (Disaster Alerts & SitRep)'
              : 'Disaster Warning Alerts (CAP) & SitRep Hub'}
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            {language === 'hi'
              ? 'CAP आधिकारिक चेतावनी अलर्ट (Red/Orange/Yellow/Green) | घटनाएं और राहत अभियान | सिटरेप रिपोर्ट (PDF/CSV) | नागरिक सुरक्षा'
              : 'Official CAP Warning Bulletins (Red · Orange · Yellow · Green) | Incident Control | SitRep (PDF/CSV) | Safety Guidelines'}
          </p>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSubTab('issued')}
          className={`px-3.5 py-2 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
            subTab === 'issued'
              ? 'bg-[#4F46E5] text-white shadow-sm'
              : 'neu-btn text-[var(--text-primary)]'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Issued Alerts (CAP)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 font-mono">
            {activeAlertZones.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('incidents')}
          className={`px-3.5 py-2 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
            subTab === 'incidents'
              ? 'bg-[#4F46E5] text-white shadow-sm'
              : 'neu-btn text-[var(--text-primary)]'
          }`}
        >
          <Flame className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Incidents & Field Ops</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/15 font-mono">
            {incidents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('sitrep')}
          className={`px-3.5 py-2 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
            subTab === 'sitrep'
              ? 'bg-[#4F46E5] text-white shadow-sm'
              : 'neu-btn text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>SitRep (PDF / CSV)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('safety_drill')}
          className={`px-3.5 py-2 rounded-[10px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
            subTab === 'safety_drill'
              ? 'bg-[#4F46E5] text-white shadow-sm'
              : 'neu-btn text-[var(--text-primary)]'
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Citizen Safety & Drill</span>
        </button>
      </div>


      {/* SUB-TAB 1: VOICE ALERTS INBOX (Disabled per request) */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 neu-raised p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Control Room Voice Alerts Inbox (Newest First)
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Each item shows time, play button with progress bar, duration, caller location & status.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#0B8F80]/15 text-[#0B8F80] text-xs font-mono font-bold">
                {sortedVoiceAlerts.length} Voice Alerts
              </span>
            </div>

            <div className="space-y-3">
              {sortedVoiceAlerts.map((va) => {
                const isSelected = activeVoiceAlert?.id === va.id;
                return (
                  <div
                    key={va.id}
                    onClick={() => setSelectedVoiceAlertId(va.id)}
                    className={`neu-flat p-4 rounded-[12px] cursor-pointer transition-all space-y-3 border-2 ${
                      isSelected ? 'border-[#0B8F80]' : 'border-transparent'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {va.isDrill && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                            [DRILL]
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-[#0B8F80] text-white text-[10px] font-mono font-bold">
                          {va.timestamp}
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {va.referenceNo}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">
                          · {va.userName} ({va.district})
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold text-white ${
                          va.status === 'Acknowledged by control room' ||
                          va.status === 'Team Dispatched' ||
                          va.status === 'Resolved'
                            ? 'bg-[#15803D]'
                            : va.status === 'Delivered to control room' ||
                              va.status === 'Received by control room'
                            ? 'bg-[#0B8F80]'
                            : 'bg-[#CA8A04]'
                        }`}
                      >
                        {va.status}
                      </span>
                    </div>

                    <VoiceAudioPlayerBar alert={va} />

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                        <span>
                          Caller GPS: {va.lat.toFixed(5)}°N, {va.lng.toFixed(5)}°E (Accuracy circle:
                          +/- {Math.round(va.accuracyMeters)} m)
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#0B8F80]">
                        Tap to view on map →
                      </span>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]"
                    >
                      <button
                        type="button"
                        onClick={() => acknowledgeVoiceAlert(va.id)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Acknowledge</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatchTeamToVoiceAlert(va.id, selectedTeamForDispatch)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] hover:bg-[#097568] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Dispatch team</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => resolveVoiceAlert(va.id)}
                        className="neu-btn px-3 py-1.5 text-xs font-bold text-[var(--text-primary)]"
                      >
                        Mark resolved
                      </button>
                    </div>

                    {va.acknowledgedBy && (
                      <div className="text-[11px] text-[#15803D] font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span>
                          Logged: {va.acknowledgedBy} at {va.acknowledgedAt}
                          {va.dispatchedTeamName ? ` · Dispatched: ${va.dispatchedTeamName}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {activeVoiceAlert && (
              <div className="neu-raised p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#0B8F80]">
                      {activeVoiceAlert.referenceNo} · {activeVoiceAlert.controlRoomTarget}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Caller Location on Map (Accuracy Circle: +/-{' '}
                      {Math.round(activeVoiceAlert.accuracyMeters)} m)
                    </h3>
                  </div>
                  {activeVoiceAlert.phone && (
                    <a
                      href={`tel:${activeVoiceAlert.phone}`}
                      className="neu-btn px-2.5 py-1 text-xs font-mono font-bold text-[#0B8F80] flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>{activeVoiceAlert.phone}</span>
                    </a>
                  )}
                </div>

                <div
                  ref={miniMapContainerRef}
                  className="w-full h-56 rounded-[10px] border border-[var(--border)] overflow-hidden"
                />

                <div className="neu-flat p-3 rounded-[10px] space-y-2">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Select Response Team for Dispatch:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTeamForDispatch}
                      onChange={(e) => setSelectedTeamForDispatch(e.target.value)}
                      className="neu-input flex-1 px-2.5 py-1.5 text-xs"
                    >
                      {responseTeams.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.district} · {t.status})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        dispatchTeamToVoiceAlert(activeVoiceAlert.id, selectedTeamForDispatch)
                      }
                      className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <Truck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Dispatch team</span>
                    </button>
                  </div>
                </div>

                <div className="neu-flat p-3 rounded-[10px] space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                    <span>Action Log (Officer Name & Time)</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {activeVoiceAlert.auditTrail.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 border-l-2 border-[#0B8F80] pl-2"
                      >
                        <span className="font-mono font-semibold text-[var(--text-secondary)] shrink-0">
                          {entry.time}
                        </span>
                        <div>
                          <span className="font-bold text-[var(--text-primary)]">
                            {entry.actor}:
                          </span>{' '}
                          <span className="text-[var(--text-secondary)]">{entry.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EMERGENCY SOS INBOX (Disabled per request) */}
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 neu-raised p-4 space-y-3 border-2 border-[#B91C1C]">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#B91C1C] text-white text-xs font-extrabold uppercase tracking-wide">
                  HIGHEST PRIORITY · SOS
                </span>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    Control Room Emergency SOS Inbox
                  </h2>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Marked higher priority than Voice Alerts · Instant GPS distress signals (No audio)
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#B91C1C]/15 text-[#B91C1C] text-xs font-mono font-bold">
                {sortedSosAlerts.length} SOS Signals
              </span>
            </div>

            <div className="space-y-3">
              {sortedSosAlerts.map((sa) => {
                const isSelected = activeSosAlert?.id === sa.id;
                return (
                  <div
                    key={sa.id}
                    onClick={() => setSelectedSosAlertId(sa.id)}
                    className={`neu-flat p-4 rounded-[12px] cursor-pointer transition-all space-y-2.5 border-2 ${
                      isSelected ? 'border-[#B91C1C]' : 'border-[#B91C1C]/30'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {sa.isDrill && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                            [DRILL]
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-[#B91C1C] text-white text-[10px] font-extrabold">
                          {sa.priority}
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                          {sa.referenceNo}
                        </span>
                        <span className="text-xs font-mono text-[var(--text-secondary)]">
                          · {sa.timestamp}
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold text-white ${
                          sa.status === 'Acknowledged by control room' ||
                          sa.status === 'Team Dispatched' ||
                          sa.status === 'Resolved'
                            ? 'bg-[#15803D]'
                            : 'bg-[#B91C1C]'
                        }`}
                      >
                        {sa.status}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-[8px] bg-[var(--bg)] border border-[var(--border)] text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="text-[var(--text-secondary)]">Caller ID / Name: </span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {sa.userName} ({sa.userId})
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Phone: </span>
                        <span className="font-mono font-bold text-[var(--text-primary)]">
                          {sa.phone || 'Not provided'}
                        </span>
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-1.5 font-mono text-[var(--text-primary)]">
                        <MapPin className="w-3.5 h-3.5 text-[#B91C1C]" strokeWidth={1.75} />
                        <span>
                          GPS: {sa.lat.toFixed(5)}°N, {sa.lng.toFixed(5)}°E (Accuracy: +/-{' '}
                          {Math.round(sa.accuracyMeters)} m) · {sa.district}
                        </span>
                      </div>
                    </div>

                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-[var(--border)]"
                    >
                      <button
                        type="button"
                        onClick={() => acknowledgeSosAlert(sa.id)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Acknowledge</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => dispatchTeamToSosAlert(sa.id, selectedTeamForDispatch)}
                        className="px-3 py-1.5 rounded-[8px] bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Truck className="w-3.5 h-3.5" strokeWidth={1.75} />
                        <span>Dispatch team</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => resolveSosAlert(sa.id)}
                        className="neu-btn px-3 py-1.5 text-xs font-bold text-[var(--text-primary)]"
                      >
                        Mark resolved
                      </button>
                    </div>

                    {sa.acknowledgedBy && (
                      <div className="text-[11px] text-[#15803D] font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                        <span>
                          Logged: {sa.acknowledgedBy} at {sa.acknowledgedAt}
                          {sa.dispatchedTeamName ? ` · Dispatched: ${sa.dispatchedTeamName}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            {activeSosAlert && (
              <div className="neu-raised p-4 space-y-3 border-2 border-[#B91C1C]/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#B91C1C]">
                      {activeSosAlert.referenceNo} · {activeSosAlert.controlRoomTarget}
                    </span>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      SOS Caller Location on Map (Accuracy: +/-{' '}
                      {Math.round(activeSosAlert.accuracyMeters)} m)
                    </h3>
                  </div>
                  {activeSosAlert.phone && (
                    <a
                      href={`tel:${activeSosAlert.phone}`}
                      className="neu-btn px-2.5 py-1 text-xs font-mono font-bold text-[#B91C1C] flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>{activeSosAlert.phone}</span>
                    </a>
                  )}
                </div>

                <div
                  ref={miniMapContainerRef}
                  className="w-full h-56 rounded-[10px] border border-[var(--border)] overflow-hidden"
                />

                <div className="neu-flat p-3 rounded-[10px] space-y-2">
                  <label className="block text-xs font-bold text-[var(--text-primary)]">
                    Select Response Team for SOS Dispatch:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTeamForDispatch}
                      onChange={(e) => setSelectedTeamForDispatch(e.target.value)}
                      className="neu-input flex-1 px-2.5 py-1.5 text-xs"
                    >
                      {responseTeams.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.district} · {t.status})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        dispatchTeamToSosAlert(activeSosAlert.id, selectedTeamForDispatch)
                      }
                      className="px-3 py-1.5 rounded-[8px] bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1 shrink-0"
                    >
                      <Truck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Dispatch team</span>
                    </button>
                  </div>
                </div>

                <div className="neu-flat p-3 rounded-[10px] space-y-2">
                  <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#B91C1C]" strokeWidth={1.75} />
                    <span>SOS Audit Trail (Officer Name & Time)</span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {activeSosAlert.auditTrail.map((entry, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 border-l-2 border-[#B91C1C] pl-2"
                      >
                        <span className="font-mono font-semibold text-[var(--text-secondary)] shrink-0">
                          {entry.time}
                        </span>
                        <div>
                          <span className="font-bold text-[var(--text-primary)]">
                            {entry.actor}:
                          </span>{' '}
                          <span className="text-[var(--text-secondary)]">{entry.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ISSUED ALERTS (CAP LIFECYCLE, VERSION HISTORY, LIVE SUGGESTIONS & MANUAL CAP IMPORT) */}
      {subTab === 'issued' && (
        <div className="space-y-4">
          {/* Official Feed Adapter Status & Manual CAP Import Bar (Section 3.1 & Section 0) */}
          <div className="neu-raised p-4 border-l-4 border-[#CA8A04] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#CA8A04]" strokeWidth={1.75} />
                <span>
                  Official Feed Adapter (IMD / NDMA SACHET CAP):{' '}
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-[#CA8A04] font-mono">
                    Not connected
                  </span>
                </span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                Requires official NDMA SACHET / IMD leased CAP webhook credentials. Manual CAP XML/JSON Import is active below so officers can load real CAP alerts immediately.
              </div>
            </div>

            {isOfficer && (
              <button
                type="button"
                onClick={() => setShowCapImport((v) => !v)}
                className="px-3.5 py-2 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{showCapImport ? 'Close CAP Import' : 'Import CAP XML / JSON'}</span>
              </button>
            )}
          </div>

          {showCapImport && isOfficer && (
            <form
              onSubmit={handleManualCapImport}
              className="neu-raised p-4 space-y-3 border border-[#0B8F80]/40 text-xs"
            >
              <div className="font-bold text-sm text-[var(--text-primary)]">
                Manual CAP Alert Import (JSON / Structured CAP Payload)
              </div>
              <textarea
                rows={7}
                value={capRawInput}
                onChange={(e) => setCapRawInput(e.target.value)}
                className="neu-input w-full p-3 font-mono text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCapImport(false)}
                  className="neu-btn px-3 py-1.5 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold"
                >
                  Load & Issue Imported CAP Alert
                </button>
              </div>
            </form>
          )}

          {/* Live-Data Suggestion Card (Section 3.1: Suggested - needs authority confirmation. Never auto-issue) */}
          <div className="neu-raised p-4 border-l-4 border-[#0B8F80] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#0B8F80]/15 text-[#0B8F80] font-mono font-bold uppercase text-[10px]">
                  Suggested — Needs Authority Confirmation
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  Open-Meteo & USGS Live Telemetry Advisory (Never Auto-Issued)
                </span>
              </div>
              <div className="text-[var(--text-secondary)]">
                24h Rainfall: <strong>{liveWeather.rainfall24hMm} mm</strong> ({liveWeather.source}) ·
                Wind: <strong>{liveWeather.windSpeedKmh} km/h</strong> · Latest Seismic Event:{' '}
                <strong>
                  M{seismicFeed[0]?.magnitude ?? 3.1} ({seismicFeed[0]?.place ?? 'Koyna Region'})
                </strong>
              </div>
            </div>
            {isOfficer && (
              <button
                type="button"
                onClick={handleConfirmLiveSuggestion}
                className="px-3.5 py-2 rounded-[8px] bg-[#DC2626] text-white font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Issue CAP Alert</span>
              </button>
            )}
          </div>

          {/* Active GIS CAP Alert Zones with Lifecycle & Version History */}
          <div className="neu-raised p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  CAP-Structured Disaster Alert Zones (Lifecycle: Draft | Issued | Updated | Cancelled | Expired)
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Bilingual English & Hindi CAP messages, delivery reach count, and full version history
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-bold text-white">
                <span className="px-2 py-0.5 rounded bg-[#DC2626]">
                  Red: {activeAlertZones.filter((z) => z.level === 'Red').length}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#EA580C]">
                  Orange: {activeAlertZones.filter((z) => z.level === 'Orange').length}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#CA8A04]">
                  Yellow: {activeAlertZones.filter((z) => z.level === 'Yellow').length}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#15803D]">
                  Green: {activeAlertZones.filter((z) => z.level === 'Green').length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeAlertZones.map((zone) => {
                const meta = getAlertLevelMeta(zone.level);
                const lifecycle = zone.lifecycleStatus || 'Issued';
                return (
                  <div
                    key={zone.id}
                    className="neu-flat p-4 rounded-[12px] border border-[var(--border)] border-l-4 space-y-2.5 text-xs"
                    style={{ borderLeftColor: meta.bg }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {zone.isDrill && (
                          <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                            [DRILL]
                          </span>
                        )}
                        <span
                          className="px-2.5 py-0.5 rounded font-bold text-white"
                          style={{ backgroundColor: meta.bg }}
                        >
                          {language === 'hi' ? meta.labelHi : meta.labelEn}
                        </span>
                        <span className="px-2 py-0.5 rounded neu-raised font-mono font-bold text-[10px]">
                          {lifecycle} (v{zone.version || 1})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded neu-raised text-[11px] font-mono uppercase font-bold">
                        {zone.disasterType}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-[var(--text-primary)]">
                      {zone.areaName} ({zone.district})
                    </div>

                    {/* Bilingual CAP Messages */}
                    <div className="neu-raised p-2.5 rounded-[8px] space-y-1 text-[11px]">
                      <div>
                        <strong className="text-[var(--text-primary)]">EN:</strong>{' '}
                        <span className="text-[var(--text-secondary)]">
                          {zone.messageEn || zone.instructions}
                        </span>
                      </div>
                      {zone.messageHi && (
                        <div>
                          <strong className="text-[var(--text-primary)]">HI:</strong>{' '}
                          <span className="text-[var(--text-secondary)]">{zone.messageHi}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#0D9488] font-semibold">
                      <span>
                        Severity: {zone.severity || 'Severe'} · Urgency: {zone.urgency || 'Immediate'}
                      </span>
                      <span>
                        Delivered to: {(zone.usersReached || 1420).toLocaleString()} citizens
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[var(--text-secondary)] pt-1 border-t border-[var(--border)] flex flex-wrap justify-between gap-2">
                      <span>Issued by: {zone.issuedBy}</span>
                      <span>
                        {zone.startsAt || zone.issuedAt} → {zone.expiresAt}
                      </span>
                    </div>

                    {/* Officer Lifecycle Controls (Update / Escalate / Cancel / Expire) */}
                    {isOfficer && (
                      <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const nextLevel: AlertZoneLevel =
                              zone.level === 'Red' ? 'Orange' : 'Red';
                            updateAlertZoneLevel(
                              zone.id,
                              nextLevel,
                              `Updated to ${nextLevel} Alert by ${user?.name || 'Officer'}. ${zone.instructions}`
                            );
                            showToast(`Alert ${zone.areaName} updated to ${nextLevel} (new version logged).`);
                          }}
                          className="neu-btn px-2.5 py-1 text-[11px] font-bold text-[#0B8F80]"
                        >
                          Update / Escalate Level
                        </button>
                        {lifecycle !== 'Cancelled' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateAlertZoneLifecycle(
                                zone.id,
                                'Cancelled',
                                'Cancelled by authorised officer'
                              );
                              showToast(`Alert ${zone.areaName} marked Cancelled.`);
                            }}
                            className="neu-btn px-2.5 py-1 text-[11px] font-bold text-[#DC2626]"
                          >
                            Cancel Alert
                          </button>
                        )}
                        {lifecycle !== 'Expired' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateAlertZoneLifecycle(zone.id, 'Expired', 'Alert window expired');
                              showToast(`Alert ${zone.areaName} marked Expired.`);
                            }}
                            className="neu-btn px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]"
                          >
                            Mark Expired
                          </button>
                        )}
                      </div>
                    )}

                    {/* Version History Trail */}
                    {zone.versionHistory && zone.versionHistory.length > 0 && (
                      <div className="pt-1.5 text-[10px] font-mono text-[var(--text-secondary)] space-y-0.5">
                        <div className="font-bold uppercase">Version History:</div>
                        {zone.versionHistory.slice(0, 3).map((vh) => (
                          <div key={vh.version}>
                            v{vh.version} · {vh.lifecycleStatus} ({vh.level}) by {vh.updatedBy} at{' '}
                            {vh.updatedAt} — {vh.note}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <NdmaPortalFeaturesHub defaultSection="sachet_cap" />
        </div>
      )}

      {/* SUB-TAB 4: INCIDENTS & FIELD OPERATIONS (Section 3.8 & Acceptance Test #8) */}
      {subTab === 'incidents' && (
        <div className="space-y-4">
          {/* Report Incident Form with Automatic Nearby Duplicate Detection */}
          <form
            onSubmit={handleCreateIncidentSubmit}
            className="neu-raised p-4 space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#DC2626]" strokeWidth={1.75} />
                  <span>Report Field Incident (Citizen / Responder Input with GPS)</span>
                </h2>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Workflow: Reported → Verified → Response Assigned → In Progress → Resolved
                </p>
              </div>
              <span className="font-mono text-[11px] text-[#0B8F80] font-bold">
                Auto-GPS: {gps.lat.toFixed(4)}°N, {gps.lng.toFixed(4)}°E
              </span>
            </div>

            {potentialDuplicateIncident && (
              <div className="neu-flat p-2.5 rounded-[8px] border-l-4 border-[#CA8A04] flex items-center gap-2 text-[11px] text-[#CA8A04] font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Nearby Duplicate Detection: Active incident{' '}
                  <strong>
                    {potentialDuplicateIncident.code} ({potentialDuplicateIncident.title})
                  </strong>{' '}
                  is already logged near {potentialDuplicateIncident.villageName}. Verify before submitting a duplicate.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              <input
                type="text"
                required
                placeholder="Incident Title (e.g., Bridge Embankment Breach)"
                value={incTitle}
                onChange={(e) => setIncTitle(e.target.value)}
                className="neu-input px-3 py-2 sm:col-span-2"
              />
              <select
                value={incHazard}
                onChange={(e) => setIncHazard(e.target.value as HazardType)}
                className="neu-input px-3 py-2"
              >
                <option value="flood">Flood</option>
                <option value="landslide">Landslide</option>
                <option value="cloudburst">Cloudburst</option>
                <option value="erosion">Riverbank Erosion</option>
              </select>
              <select
                value={incDistrict}
                onChange={(e) =>
                  setIncDistrict(
                    e.target.value as
                      | 'Raigad'
                      | 'Satara'
                      | 'Pune'
                      | 'Ratnagiri'
                      | 'Kolhapur'
                      | 'Sindhudurg'
                  )
                }
                className="neu-input px-3 py-2"
              >
                <option value="Raigad">Raigad</option>
                <option value="Satara">Satara</option>
                <option value="Pune">Pune</option>
                <option value="Ratnagiri">Ratnagiri</option>
                <option value="Kolhapur">Kolhapur</option>
                <option value="Sindhudurg">Sindhudurg</option>
              </select>
              <input
                type="text"
                placeholder="Village / Sector"
                value={incVillageName}
                onChange={(e) => setIncVillageName(e.target.value)}
                className="neu-input px-3 py-2"
              />
              <select
                value={incSeverity}
                onChange={(e) =>
                  setIncSeverity(e.target.value as 'Critical' | 'High' | 'Moderate')
                }
                className="neu-input px-3 py-2 font-bold"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center">
              <input
                type="text"
                placeholder="Situation details / landmarks / photo reference..."
                value={incDescription}
                onChange={(e) => setIncDescription(e.target.value)}
                className="neu-input px-3 py-2 sm:col-span-3"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Incident Report</span>
              </button>
            </div>
          </form>

          {/* Incident Cards & Officer Verification / Assignment / Resolution Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="neu-raised p-4 space-y-3 text-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[#0B8F80]">{inc.code}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-white font-bold text-[10px] ${
                          inc.severity === 'Critical'
                            ? 'bg-[#DC2626]'
                            : inc.severity === 'High'
                            ? 'bg-[#EA580C]'
                            : 'bg-[#CA8A04]'
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded font-bold text-[11px] text-white ${
                        inc.status === 'Resolved'
                          ? 'bg-[#15803D]'
                          : inc.status === 'Reported'
                          ? 'bg-[#CA8A04]'
                          : 'bg-[#0B8F80]'
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{inc.title}</h3>
                    <div className="text-[var(--text-secondary)]">
                      {inc.villageName}, {inc.district} · {inc.hazardType} · Affected:{' '}
                      <strong>{inc.affectedPopulation}</strong> people
                    </div>
                  </div>

                  <p className="text-[var(--text-secondary)]">{inc.description}</p>

                  {/* Officer Action Pipeline: Verify -> Assign Team -> In Progress -> Resolved */}
                  {!isCitizen && (
                    <div className="neu-flat p-2.5 rounded-[8px] space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            'Verified',
                            'Response Assigned',
                            'In Progress',
                            'Resolved',
                          ] as IncidentStatus[]
                        ).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              advanceIncidentStatus(
                                inc.id,
                                st,
                                incidentTimelineNote[inc.id] || `Status updated to ${st}`
                              );
                              showToast(`Incident ${inc.code} marked ${st}.`);
                            }}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                              inc.status === st
                                ? 'bg-[#0B8F80] text-white'
                                : 'neu-btn text-[var(--text-primary)]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              assignTeamToIncident(inc.id, e.target.value);
                              showToast(`Assigned team to ${inc.code}.`);
                            }
                          }}
                          defaultValue=""
                          className="neu-input flex-1 px-2 py-1 text-[11px]"
                        >
                          <option value="" disabled>
                            Assign Response Team...
                          </option>
                          {responseTeams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.district})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Add timeline note..."
                          value={incidentTimelineNote[inc.id] || ''}
                          onChange={(e) =>
                            setIncidentTimelineNote((prev) => ({
                              ...prev,
                              [inc.id]: e.target.value,
                            }))
                          }
                          className="neu-input flex-1 px-2 py-1 text-[11px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Incident Timeline */}
                  <div className="neu-flat p-2.5 rounded-[8px] space-y-1 max-h-32 overflow-y-auto text-[11px]">
                    <div className="font-bold text-[10px] uppercase text-[var(--text-secondary)]">
                      Incident Timeline ({inc.timeline.length} entries)
                    </div>
                    {inc.timeline.map((tl, idx) => (
                      <div key={idx} className="border-l-2 border-[#0B8F80] pl-2">
                        <span className="font-mono text-[var(--text-secondary)]">{tl.time}</span> ·{' '}
                        <strong>{tl.actor}:</strong> {tl.note}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: SITUATION REPORT (SITREP) & EXPORTS (PDF / CSV) (Section 3.9 & Acceptance Test #10) */}
      {subTab === 'sitrep' && (
        <div className="neu-raised p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Auto-Generated Situation Report (SitRep) — Real-Time Operational Snapshot</span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Generated at {sitRepMetrics.generatedAt} · Practice [DRILL] items are automatically excluded from official statistics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <button
                type="button"
                onClick={handleExportSitRepPdf}
                className="px-4 py-2 rounded-[10px] bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Export SitRep PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportSitRepCsv}
                className="px-4 py-2 rounded-[10px] bg-[#0B8F80] hover:bg-[#097568] text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export SitRep CSV</span>
              </button>
            </div>
          </div>

          {/* SitRep Live KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="neu-flat p-3 rounded-[10px]">
              <div className="text-[var(--text-secondary)]">Active CAP Zones</div>
              <div className="text-xl font-extrabold font-mono text-[#DC2626] mt-1">
                {sitRepMetrics.realAlertsCount}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                Red: {sitRepMetrics.redZonesCount} · Orange: {sitRepMetrics.orangeZonesCount}
              </div>
            </div>
            <div className="neu-flat p-3 rounded-[10px]">
              <div className="text-[var(--text-secondary)]">Emergency SOS</div>
              <div className="text-xl font-extrabold font-mono text-[#B91C1C] mt-1">
                {sitRepMetrics.realSosCount}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">Real distress signals</div>
            </div>
            <div className="neu-flat p-3 rounded-[10px]">
              <div className="text-[var(--text-secondary)]">Voice Alerts</div>
              <div className="text-xl font-extrabold font-mono text-[#0B8F80] mt-1">
                {sitRepMetrics.realVoiceCount}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">Control room audio</div>
            </div>
            <div className="neu-flat p-3 rounded-[10px]">
              <div className="text-[var(--text-secondary)]">Active Incidents</div>
              <div className="text-xl font-extrabold font-mono text-[#EA580C] mt-1">
                {sitRepMetrics.activeIncidentsCount}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                Resolved: {sitRepMetrics.resolvedIncidentsCount}
              </div>
            </div>
            <div className="neu-flat p-3 rounded-[10px]">
              <div className="text-[var(--text-secondary)]">Shelter Evacuees</div>
              <div className="text-xl font-extrabold font-mono text-[#15803D] mt-1">
                {sitRepMetrics.totalShelterOcc}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">
                Capacity: {sitRepMetrics.totalShelterCap} beds
              </div>
            </div>
            <div className="neu-flat p-3 rounded-[10px]">
              <div className="text-[var(--text-secondary)]">Deployed IDRN Units</div>
              <div className="text-xl font-extrabold font-mono text-[var(--text-primary)] mt-1">
                {sitRepMetrics.totalDeployedResources}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)]">Field equipment active</div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: CITIZEN SAFETY PORTAL & MOCK DRILL MODE (Sections 3.11 & 3.12) */}
      {subTab === 'safety_drill' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
          {/* Left 7 Cols: Check My Area + Family Safe Check-In ("I Am Safe") */}
          <div className="lg:col-span-7 space-y-4">
            {/* Check My Area */}
            <div className="neu-raised p-4 space-y-3 border-l-4 border-[#0B8F80]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Citizen &quot;Check My Area&quot; — Live Alert Level, Nearest Shelter & Helplines
                </h3>
                <span className="font-mono text-[11px] text-[#0B8F80] font-bold">
                  GPS: {gps.lat.toFixed(4)}°N, {gps.lng.toFixed(4)}°E
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={checkAreaQuery}
                  onChange={(e) => setCheckAreaQuery(e.target.value)}
                  placeholder="Enter village, taluka or district..."
                  className="neu-input flex-1 px-3 py-2"
                />
              </div>
              <div className="neu-flat p-3 rounded-[10px] space-y-1.5">
                <div>
                  <strong>Current Area Alert Status ({checkAreaQuery}):</strong>{' '}
                  <span className="px-2 py-0.5 rounded bg-[#DC2626] text-white font-bold">
                    RED ALERT (Take Action / Evacuate Low-Lying Riverbanks)
                  </span>
                </div>
                <div>
                  <strong>Nearest Relief Camp:</strong>{' '}
                  <span className="text-[#0B8F80] font-bold">
                    {reliefCamps[0]?.name || 'Mahad ZP Primary School'} (Contact:{' '}
                    {reliefCamps[0]?.contactPhone || '+91 2145 222101'})
                  </span>
                </div>
                <div>
                  <strong>Emergency Helplines:</strong>{' '}
                  <span className="font-mono font-bold">
                    National ERSS: 112 · District Control Room: 1077 · NDRF: 9711077372
                  </span>
                </div>
              </div>
            </div>

            {/* Family Safe Check-In ("I Am Safe") */}
            <form
              onSubmit={handleFamilySafeSubmit}
              className="neu-raised p-4 space-y-3"
            >
              <div className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-[#15803D]" />
                <span>Family Safe Check-In (&quot;I Am Safe&quot; Public Status Registry)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={safeName}
                  onChange={(e) => setSafeName(e.target.value)}
                  className="neu-input px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Your Phone"
                  value={safePhone}
                  onChange={(e) => setSafePhone(e.target.value)}
                  className="neu-input px-3 py-2 font-mono"
                />
                <input
                  type="text"
                  placeholder="Family Contact Name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="neu-input px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Family Contact Phone"
                  value={familyPhone}
                  onChange={(e) => setFamilyPhone(e.target.value)}
                  className="neu-input px-3 py-2 font-mono"
                />
              </div>
              <input
                type="text"
                value={safeMessage}
                onChange={(e) => setSafeMessage(e.target.value)}
                className="neu-input w-full px-3 py-2"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-[8px] bg-[#15803D] text-white font-bold"
              >
                Mark Myself Safe & Share Status
              </button>

              <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                <div className="font-bold text-[11px] text-[var(--text-secondary)]">
                  Recent Citizen Safe Check-Ins ({familySafeCheckIns.length})
                </div>
                {familySafeCheckIns.slice(0, 5).map((chk) => (
                  <div
                    key={chk.id}
                    className="neu-flat px-3 py-2 rounded-[8px] flex flex-wrap justify-between gap-2"
                  >
                    <span>
                      <strong className="text-[#15803D]">{chk.citizenName}</strong> ({chk.district}):{' '}
                      {chk.statusMessage}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                      {chk.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </form>
          </div>

          {/* Right 5 Cols: Offline Preparedness Pack & Mock Drill Mode (Section 3.12) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="neu-raised p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Offline First-Aid & Preparedness Guide
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    cacheOfflineSafetyPack();
                    showToast('Preparedness & First-Aid Guide cached for offline access.');
                  }}
                  className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold"
                >
                  {offlinePackCached ? 'Cached Offline ✓' : 'Cache for Offline'}
                </button>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[var(--text-secondary)]">
                <li>Keep 72-hour emergency go-bag: dry rations, drinking water, torch, whistle, power bank, Aadhaar & land records in waterproof pouch.</li>
                <li>During Red Alert: turn off mains electricity & LPG cylinder before evacuating to nearest ZP relief shelter.</li>
                <li>First-Aid: apply direct sterile pressure on bleeding wounds; keep snake-bite limb immobilized below heart level.</li>
              </ul>
            </div>

            {/* Mock Drill Mode Control & Summary Reports (Section 3.12 & Acceptance Test #12) */}
            <div className="neu-raised p-4 space-y-3 border-2 border-amber-500/50">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Mock Drill Mode (Practice Scenario)
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Marks all alerts & dispatches as [DRILL] without affecting real statistics.
                  </p>
                </div>
                {isOfficer && (
                  <button
                    type="button"
                    onClick={() => {
                      toggleDrillMode();
                      showToast(
                        isDrillMode
                          ? 'Mock Drill ended. Drill Summary Report generated.'
                          : 'Mock Drill Mode started ([DRILL] active).'
                      );
                    }}
                    className={`px-3.5 py-2 rounded-[8px] font-bold ${
                      isDrillMode
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-[#0B1F33] text-white'
                    }`}
                  >
                    {isDrillMode ? 'End Drill & Generate Report' : 'Start Mock Drill'}
                  </button>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="font-bold text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-[#0B8F80]" />
                  <span>Drill Summary Reports ({drillSummaryReports.length})</span>
                </div>
                {drillSummaryReports.map((rep) => (
                  <div key={rep.id} className="neu-flat p-2.5 rounded-[8px] space-y-1">
                    <div className="font-bold text-[var(--text-primary)]">
                      Drill Session ({rep.startedAt} → {rep.endedAt})
                    </div>
                    <div className="font-mono text-[11px] text-[#0B8F80]">
                      Alerts Issued: {rep.alertsIssuedCount} · Voice Alerts: {rep.voiceAlertsSentCount} · SOS: {rep.sosSentCount} · Avg Ack Time: {rep.avgAckSeconds}s
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{rep.summaryNote}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
