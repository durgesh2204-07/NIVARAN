import { create } from 'zustand';
import {
  INITIAL_ALERTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMMUNITY_REPORTS,
  INITIAL_CRITICAL_FACILITIES,
  INITIAL_DATA_SOURCES,
  INITIAL_HOUSEHOLD_CASES,
  INITIAL_INCIDENTS,
  INITIAL_RELIEF_CAMPS,
  INITIAL_RELOCATION_SITES,
  INITIAL_RESOURCE_STOCK,
  INITIAL_RESPONSE_TEAMS,
  INITIAL_SENSORS,
  INITIAL_VILLAGES,
  INTERVENTION_OPTIONS,
} from '../data/mockData';
import {
  INITIAL_ACTIVE_ALERT_ZONES,
  INITIAL_IMPACT_COMPARISON,
  INITIAL_SOS_ALERTS,
  INITIAL_VOICE_ALERTS,
  INITIAL_VOLUNTEERS,
} from '../data/patchData';
import {
  ActiveAlertZone,
  AlertDisasterType,
  AlertItem,
  AlertLifecycleStatus,
  AlertZoneLevel,
  AuditLogEntry,
  ClimateHorizon,
  CommunityReport,
  CriticalFacility,
  DataSourceStatus,
  DrillSummaryReport,
  EmergencySosItem,
  ExplainScorePayload,
  FamilySafeCheckIn,
  HazardWeights,
  HouseholdCase,
  ImpactComparisonRow,
  IncidentItem,
  IncidentStatus,
  InterventionOption,
  Language,
  OrganisationType,
  PartnerAccessRequest,
  ReliefCamp,
  RelocationCaseStatus,
  RelocationSite,
  ReportStatus,
  ResourceRequestRecord,
  ResourceStockItem,
  ResponseTeam,
  SavedAoi,
  ScoringMethodVersion,
  SensorReading,
  ShelterCheckInRecord,
  ShelterOccupancyLog,
  ShelterType,
  SosDispatchRecord,
  TextSize,
  UserSession,
  Village,
  VoiceAlertItem,
  VolunteerMember,
  VolunteerStatus,
  VolunteerTaskStatus,
} from '../types';
import { classifyHazard, computeLedgerHash, weightedScore } from '../utils/scoring';
import {
  clearOfflineQueueOnSignOut,
  enqueueOfflineMutation,
} from '../resilience/offlineQueue';
import { setFaultInjectionConfig } from '../resilience/apiClient';
import {
  gatewayContract,
  publishRealtimeEvent,
  setMemoryAccessToken,
  subscribeRealtimeEvents,
} from '../services/gateway';
import {
  clearOperationalSnapshot,
  loadOperationalSnapshot,
  saveOperationalSnapshot,
  subscribeOperationalSync,
} from '../services/persistentStateAdapter';

// Strictly only these 4 UI preference keys allowed in localStorage per Section 1 & Section 8.2:
// Access tokens live in memory only; offline queue uses IndexedDB with 72h expiry.
const LANG_STORAGE_KEY = 'nivaran_lang';
const THEME_STORAGE_KEY = 'nivaran_theme';
const TEXT_SIZE_STORAGE_KEY = 'nivaran_text_size';
const CONTRAST_STORAGE_KEY = 'nivaran_contrast_mode';
export const ADVANCED_THEME_STORAGE_KEY = 'nivaran_advanced_theme';

export type NivaranTheme =
  | 'nivaran-light'
  | 'nivaran-dark'
  | 'midnight'
  | 'forest'
  | 'high-contrast';

export function applyThemeToDocument(theme: NivaranTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'theme-light',
    'theme-dark',
    'theme-midnight',
    'theme-forest',
    'theme-high-contrast',
    'dark',
    'high-contrast'
  );
  root.removeAttribute('data-theme');
  root.setAttribute('data-theme', theme);

  switch (theme) {
    case 'nivaran-light':
      root.classList.add('theme-light');
      break;
    case 'nivaran-dark':
      root.classList.add('dark', 'theme-dark');
      break;
    case 'midnight':
      root.classList.add('dark', 'theme-midnight');
      break;
    case 'forest':
      root.classList.add('dark', 'theme-forest');
      break;
    case 'high-contrast':
      root.classList.add('high-contrast', 'theme-high-contrast');
      break;
  }
}

function getInitialAdvancedTheme(): NivaranTheme {
  try {
    const saved = window.localStorage.getItem(ADVANCED_THEME_STORAGE_KEY) as NivaranTheme;
    if (['nivaran-light', 'nivaran-dark', 'midnight', 'forest', 'high-contrast'].includes(saved)) {
      if (typeof document !== 'undefined') {
        applyThemeToDocument(saved);
      }
      return saved;
    }
  } catch {
    // ignore
  }
  return 'nivaran-light';
}

function getInitialLanguage(): Language {
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'en' || saved === 'hi' || saved === 'mr') return saved;
  } catch {
    // ignore
  }
  return 'en';
}

function getInitialTheme(): boolean {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const isDark = saved === 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    return isDark;
  } catch {
    return false;
  }
}

function getInitialTextSize(): TextSize {
  try {
    const saved = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
    if (saved === '100' || saved === '115' || saved === '130') {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-text-size', saved);
      }
      return saved;
    }
  } catch {
    // ignore
  }
  return '100';
}

function getInitialHighContrast(): boolean {
  try {
    const saved = window.localStorage.getItem(CONTRAST_STORAGE_KEY) === 'true';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast', saved);
    }
    return saved;
  } catch {
    return false;
  }
}

function getInitialOfflineQueue(): CommunityReport[] {
  return [];
}

function saveOfflineQueueToStorage(queue: CommunityReport[]) {
  const latest = queue[0];
  if (latest) {
    void enqueueOfflineMutation({
      idempotencyKey: `rep-${latest.id}`,
      type: 'PUBLIC_HAZARD_REPORT',
      summary: `${latest.category} report at ${latest.villageName}`,
      payload: {
        id: latest.id,
        villageId: latest.villageId,
        villageName: latest.villageName,
        category: latest.category,
        description: latest.description,
        timestamp: latest.timestamp,
      },
    });
  }
}

export const ORGANISATION_PRESETS: Record<OrganisationType, UserSession> = {
  national: {
    id: 'usr-ndma-01',
    name: 'Sh. R. K. Srivastava, IAS',
    emailOrPhone: 'ops.ndma@nic.in',
    role: 'administrator',
    organisation: 'ndma',
    organisationType: 'national',
    orgRole: 'Administrator',
    unitName: 'NDMA National Emergency Operations Centre (NEOC)',
    jurisdictionLevel: 'National',
    designation: 'Joint Secretary (Operations), NDMA — New Delhi',
    title: 'Joint Secretary (Operations), NDMA — New Delhi',
    district: 'All',
    state: 'All States (National Grid)',
  },
  state: {
    id: 'usr-sdma-01',
    name: 'Dr. Rajeshwar Deshmukh, IAS',
    emailOrPhone: 'seoc.mantralaya@maharashtra.gov.in',
    role: 'administrator',
    organisation: 'sdma',
    organisationType: 'state',
    orgRole: 'Approver',
    unitName: 'Maharashtra SDMA — State Emergency Operations Centre',
    jurisdictionLevel: 'State',
    designation: 'Principal Secretary & State Relief Commissioner',
    title: 'Principal Secretary & State Relief Commissioner',
    district: 'All',
    state: 'Maharashtra',
  },
  district: {
    id: 'usr-ddma-01',
    name: 'Dr. M. Kulkarni, IAS',
    emailOrPhone: 'collector.raigad@maharashtra.gov.in',
    role: 'district_officer',
    organisation: 'ddma',
    organisationType: 'district',
    orgRole: 'Approver',
    unitName: 'DDMA Raigad Collectorate Control Room (Alibag)',
    jurisdictionLevel: 'District',
    designation: 'District Collector & DDMA Chairperson, Raigad',
    title: 'District Collector & DDMA Chairperson, Raigad',
    district: 'Raigad',
    state: 'Maharashtra',
  },
  response_forces: {
    id: 'usr-ndrf-01',
    name: 'Comdt. V. K. Rathore',
    emailOrPhone: '5bn.ndrf.pune@gov.in',
    role: 'response_team',
    organisation: 'response_forces',
    organisationType: 'response_forces',
    orgRole: 'Operator',
    unitName: 'NDRF 5th Battalion (Sudumbare, Pune) & SDRF Detachment',
    jurisdictionLevel: 'District',
    designation: 'Commandant — NDRF 5th Bn / Incident Response Team',
    title: 'Commandant — NDRF 5th Bn / Incident Response Team',
    district: 'Raigad',
    state: 'Maharashtra',
  },
  departments: {
    id: 'usr-dept-01',
    name: 'S. K. Kadam (GSI / Revenue / IMD)',
    emailOrPhone: 'nodal.gsi.west@gov.in',
    role: 'field_officer',
    organisation: 'departments',
    organisationType: 'departments',
    orgRole: 'Analyst',
    unitName: 'Geological Survey of India (GSI) & Revenue Field Division',
    jurisdictionLevel: 'Block',
    designation: 'Nodal Officer — GSI / Revenue / IMD Telemetry Division',
    title: 'Nodal Officer — GSI / Revenue / IMD Telemetry Division',
    district: 'Raigad',
    state: 'Maharashtra',
    assignedVillageId: 'v-01',
  },
  partners: {
    id: 'usr-part-01',
    name: 'Anjali Sawant (Shelter Manager & Aapda Mitra)',
    emailOrPhone: 'relief.mh@indianredcross.org',
    role: 'response_team',
    organisation: 'partners',
    organisationType: 'partners',
    orgRole: 'Operator',
    unitName: 'Relief Camp Manager & Aapda Mitra Volunteer Coordinator',
    jurisdictionLevel: 'District',
    designation: 'Shelter Manager & Volunteer Coordinator — Raigad',
    title: 'Shelter Manager & Volunteer Coordinator — Raigad',
    district: 'Raigad',
    state: 'Maharashtra',
  },
  citizen: {
    id: 'usr-cit-01',
    name: 'Ramesh Pardhi',
    emailOrPhone: '9876543210',
    role: 'citizen',
    organisation: 'citizen',
    organisationType: 'citizen',
    orgRole: 'Viewer',
    unitName: 'Irshalwadi Habitation — Khalapur Taluka',
    jurisdictionLevel: 'Village',
    designation: 'Registered Resident — Irshalwadi, Raigad',
    title: 'Registered Resident — Irshalwadi, Raigad',
    district: 'Raigad',
    state: 'Maharashtra',
    assignedVillageId: 'v-01',
  },
};

const SESSION_STORAGE_KEY = 'nivaran_active_session';

function getInitialSessionFromToken(): UserSession | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as UserSession;
        if (parsed && parsed.id && parsed.role) {
          return parsed;
        }
      }
    }
  } catch {
    // ignore
  }
  // Open by login page directly when unauthenticated
  return null;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'critical';
}

export interface LiveUserLocationState {
  active: boolean;
  followMe: boolean;
  lat: number;
  lng: number;
  accuracyMeters: number;
  headingDeg: number;
  speedKmh: number;
  updatedAt: string;
  addressInWords?: string;
  shortAddressInWords?: string;
  locality?: string;
  district?: string;
  state?: string;
  postcode?: string;
}

export interface UserLocationPoint {
  lat: number;
  lng: number;
  accuracyM: number;
  heading?: number | null;
  speedMps?: number | null;
  timestamp: number;
  addressInWords?: string;
  shortAddressInWords?: string;
}

export const DEFAULT_WEIGHTS: HazardWeights = {
  rainfall: 0.35,
  slope: 0.30,
  history: 0.20,
  riverProximity: 0.15,
};

function enrichVillages(raw: Village[]): Village[] {
  return structuredClone(raw).map((v) => {
    const hScore = weightedScore(v.hazardFactors, DEFAULT_WEIGHTS, v.verifiedReportsCount);
    return {
      ...v,
      block: v.block || v.taluka,
      nameLocal: v.nameLocal || v.nameMr,
      historicalEventsSummary: v.historicalEventsSummary || v.lastIncidentSummary,
      baselineRiskLevel: v.baselineRiskLevel || classifyHazard(hScore),
      methodVersion: 'v2.4-NDMA-2026',
      vulnerabilityFactors: {
        ...v.vulnerabilityFactors,
        elderlyPlusDisabledPct:
          v.vulnerabilityFactors.elderlyPlusDisabledPct ??
          v.vulnerabilityFactors.elderlyPct + v.vulnerabilityFactors.disabledPct,
        pregnantPlusUnder5Pct: v.vulnerabilityFactors.pregnantPlusUnder5Pct ?? 8.5,
      },
    };
  });
}

function enrichSites(raw: RelocationSite[]): RelocationSite[] {
  return structuredClone(raw).map((s) => ({
    ...s,
    block: s.block || s.taluka,
    availableLandHa: s.availableLandHa ?? s.usableAreaHa,
  }));
}

function enrichCamps(raw: ReliefCamp[]): ReliefCamp[] {
  return structuredClone(raw).map((c, idx) => {
    const lowerName = c.name.toLowerCase();
    const shelterType: ShelterType =
      c.shelterType ||
      (lowerName.includes('school') || lowerName.includes('vidyalaya') || lowerName.includes('college')
        ? 'school'
        : lowerName.includes('hall') || lowerName.includes('bhavan') || lowerName.includes('mandir') || idx % 3 === 1
        ? 'community hall'
        : 'relief camp');
    return {
      ...c,
      shelterType,
      block: c.block || c.taluka,
      inchargeName: c.inchargeName || c.inChargeName,
      elevationM: c.elevationM ?? 145,
      occupancyLogs: c.occupancyLogs || [],
    };
  });
}

function enrichIncidents(raw: IncidentItem[]): IncidentItem[] {
  return structuredClone(raw).map((inc) => ({
    ...inc,
    villageId: inc.villageId || 'v-01',
    slaTargetMinutes: inc.slaTargetMinutes ?? inc.slaDeadlineMinutes,
  }));
}

function enrichTeams(raw: ResponseTeam[]): ResponseTeam[] {
  return structuredClone(raw).map((t) => ({
    ...t,
    type: t.type || t.unitType,
  }));
}

function enrichHouseholds(raw: HouseholdCase[]): HouseholdCase[] {
  return structuredClone(raw).map((h) => ({
    ...h,
    stage:
      h.stage ||
      (h.status === 'Resettled'
        ? 'settled'
        : h.status === 'Site Allotted'
        ? 'in_transit'
        : h.status === 'Compensation Paid'
        ? 'compensated'
        : h.status === 'Approved'
        ? 'consented'
        : 'identified'),
  }));
}

function enrichAlerts(raw: AlertItem[]): AlertItem[] {
  return structuredClone(raw).map((a) => ({
    ...a,
    messageEn: a.messageEn || a.message,
    channels: a.channels || ['SACHET SMS', 'WhatsApp', 'Gram Panchayat Siren', 'Mobile Push'],
  }));
}

interface AppState {
  user: UserSession | null;
  language: Language;
  darkMode: boolean;
  textSize: TextSize;
  highContrast: boolean;

  // Demo Seed & Mock Drill State
  isUsingDemoSeedData: boolean;
  drillModeActive: boolean;
  drillStartedAt: string | null;
  drillSummaryReports: DrillSummaryReport[];

  // Domain Data
  villages: Village[];
  sites: RelocationSite[];
  reliefCamps: ReliefCamp[];
  shelterOccupancyLogs: ShelterOccupancyLog[];
  shelterCheckIns: ShelterCheckInRecord[];
  activeAlertZones: ActiveAlertZone[];
  volunteers: VolunteerMember[];
  voiceAlerts: VoiceAlertItem[];
  sosAlerts: EmergencySosItem[];
  impactComparison: ImpactComparisonRow[];
  criticalFacilities: CriticalFacility[];
  incidents: IncidentItem[];
  responseTeams: ResponseTeam[];
  resourceStock: ResourceStockItem[];
  resourceRequests: ResourceRequestRecord[];
  familySafeCheckIns: FamilySafeCheckIn[];
  interventions: InterventionOption[];
  reports: CommunityReport[];
  offlineQueue: CommunityReport[];
  isOfflineSimulated: boolean;
  offlinePackReady: boolean;
  offlinePackCachedAt: string;
  householdCases: HouseholdCase[];
  households: HouseholdCase[];
  sensors: SensorReading[];
  alerts: AlertItem[];
  dataSources: DataSourceStatus[];
  auditLogs: AuditLogEntry[];
  savedAois: SavedAoi[];
  scoringVersions: ScoringMethodVersion[];
  currentMethodVersion: string;
  partnerRequests: PartnerAccessRequest[];
  sosRecords: SosDispatchRecord[];

  // Live Location & GIS State
  liveLocation: LiveUserLocationState;
  userLocation: UserLocationPoint | null;
  followUserLocation: boolean;
  selectedDistrictDrilldown: string;
  selectedDistrict: string;
  selectedSiteId: string | null;
  basemap: 'osm' | 'satellite' | 'terrain' | 'dark';
  coordFormat: 'DD' | 'DMS' | 'UTM';
  sidebarCollapsed: boolean;
  map3dEnabled: boolean;
  terrainExaggeration: number;
  floodRiseMeters: number;

  // Scoring & Scenario State
  weights: HazardWeights;
  climateHorizon: ClimateHorizon;
  extraRainfallMm: number;
  divideBySafeCapacity: boolean;
  selectedVillageId: string | null;
  explainModalPayload: ExplainScorePayload | null;
  customOrderIds: string[];
  manualSiteOverrides: Record<string, string>;
  planApproved: boolean;
  planApprovedAt: string | null;

  // UI / Modals / Toasts / Interactive Command System
  toasts: ToastMessage[];
  idleWarningOpen: boolean;
  askNivaranOpen: boolean;
  commandPaletteOpen: boolean;
  voiceAlertModalOpen: boolean;
  emergencySosModalOpen: boolean;
  currentTheme: NivaranTheme;
  gooeyMenuOpen: boolean;
  emergencyMode: boolean;
  sidePanel: {
    isOpen: boolean;
    type?: 'zone' | 'alert' | 'shelter' | 'health' | 'volunteer' | 'village' | null;
    data?: any;
    title?: string;
  };

  // Actions
  setTheme: (theme: NivaranTheme) => void;
  setGooeyMenuOpen: (open: boolean) => void;
  toggleEmergencyMode: () => void;
  openSidePanel: (
    type: 'zone' | 'alert' | 'shelter' | 'health' | 'volunteer' | 'village',
    data?: any,
    title?: string
  ) => void;
  closeSidePanel: () => void;
  setUser: (user: UserSession | null, rememberToken?: boolean) => void;
  login: (user: UserSession, token?: string) => void;
  loginAsGuestCitizen: () => void;
  switchRoleQuick: (role: UserSession['role']) => void;
  switchOrganisationQuick: (orgType: OrganisationType) => void;
  logout: () => void;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  setTextSize: (size: TextSize) => void;
  toggleHighContrast: () => void;
  toggleSidebar: () => void;
  setSelectedDistrictDrilldown: (district: string) => void;
  setSelectedDistrict: (district: string) => void;
  setSelectedSiteId: (id: string | null) => void;
  setBasemap: (basemap: 'osm' | 'satellite' | 'terrain' | 'dark') => void;
  toggleCoordFormat: () => void;
  setMap3dEnabled: (enabled: boolean) => void;
  setTerrainExaggeration: (exag: number) => void;
  setFloodRiseMeters: (meters: number) => void;

  setLiveLocation: (loc: Partial<LiveUserLocationState>) => void;
  setUserLocation: (loc: UserLocationPoint | null) => void;
  setFollowUserLocation: (val: boolean) => void;
  logAuditEvent: (action: string, module: string, details: string) => void;

  // Seed Data & Mock Drill Actions
  resetDemoSeedData: () => void;
  clearDemoSeedData: () => void;
  toggleDrillMode: () => void;

  setWeights: (weights: HazardWeights, reason?: string) => void;
  resetWeights: () => void;
  setClimateHorizon: (horizon: ClimateHorizon) => void;
  setExtraRainfallMm: (mm: number) => void;
  setDivideBySafeCapacity: (val: boolean) => void;
  setSelectedVillageId: (id: string | null) => void;
  openExplainModal: (payload: ExplainScorePayload) => void;
  closeExplainModal: () => void;

  submitCommunityReport: (
    report: Omit<CommunityReport, 'id' | 'timestamp' | 'status'>
  ) => void;
  updateReportStatus: (
    reportId: string,
    status: ReportStatus,
    officerNote?: string
  ) => void;
  setOfflineSimulated: (offline: boolean) => void;
  syncOfflineQueue: () => void;
  cacheOfflineSafetyPack: () => void;

  dispatchSosEmergency: (payload: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    manualLocationText?: string;
    note?: string;
  }) => SosDispatchRecord;

  // Patch Section 2 & 3.1: Active Disaster Alert Zones & CAP Lifecycle
  upsertActiveAlertZone: (draft: {
    id?: string;
    level: AlertZoneLevel;
    disasterType: AlertDisasterType;
    areaName: string;
    district: string;
    startsAt?: string;
    expiresAt: string;
    instructions: string;
    messageEn?: string;
    messageHi?: string;
    severity?: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
    urgency?: 'Immediate' | 'Expected' | 'Future';
    lifecycleStatus?: AlertLifecycleStatus;
    polygon: [number, number][];
    centerLat: number;
    centerLng: number;
  }) => void;
  updateAlertZoneLevel: (
    zoneId: string,
    level: AlertZoneLevel,
    instructions: string,
    expiresAt?: string
  ) => void;
  updateAlertZoneLifecycle: (
    zoneId: string,
    lifecycleStatus: AlertLifecycleStatus,
    note?: string
  ) => void;
  importCapAlertZone: (capData: {
    areaName: string;
    district: string;
    disasterType: AlertDisasterType;
    level: AlertZoneLevel;
    messageEn: string;
    messageHi?: string;
    instructions: string;
    expiresAt: string;
    centerLat?: number;
    centerLng?: number;
  }) => void;

  // Section 3.5 & 3.6: Shelters, Check-In Register & Volunteers
  toggleVolunteerLocationOptIn: (volunteerId: string) => void;
  updateVolunteerStatus: (volunteerId: string, status: VolunteerStatus) => void;
  registerVolunteer: (draft: {
    name: string;
    phone: string;
    district: string;
    skills: VolunteerMember['skills'];
    availability: string;
    optedInLocationSharing: boolean;
    lat: number;
    lng: number;
  }) => void;
  approveVolunteerRegistration: (volunteerId: string, approved: boolean) => void;
  assignVolunteerTask: (volunteerId: string, title: string, location: string) => void;
  updateVolunteerTaskStatus: (volunteerId: string, status: VolunteerTaskStatus) => void;

  setCampOccupancyExact: (campId: string, newOccupancy: number) => void;
  addShelterRecord: (draft: {
    name: string;
    district: string;
    taluka: string;
    shelterType: ShelterType;
    capacityPersons: number;
    contactPhone: string;
    inChargeName: string;
    lat: number;
    lng: number;
    facilities: ReliefCamp['facilities'];
  }) => void;
  updateShelterFacilities: (
    campId: string,
    facilities: ReliefCamp['facilities'],
    capacityPersons?: number,
    contactPhone?: string
  ) => void;
  checkInShelterPeople: (payload: {
    campId: string;
    personName: string;
    ageGroup: ShelterCheckInRecord['ageGroup'];
    headcount: number;
    specialNeeds: ShelterCheckInRecord['specialNeeds'];
  }) => void;
  checkOutShelterRecord: (checkInId: string) => void;

  // Section 3.7: IDRN Resource Inventory CRUD & Dispatch
  addResourceStockItem: (draft: {
    itemName: string;
    category: ResourceStockItem['category'];
    district: string;
    depotLocation: string;
    availableQty: number;
    unit: string;
    custodianPhone: string;
  }) => void;
  requestResourceStock: (payload: {
    stockId: string;
    quantityRequested: number;
    destination: string;
  }) => void;
  approveAndDispatchResourceRequest: (requestId: string) => void;

  // Section 3.11: Citizen Safety Portal Family Check-In
  submitFamilySafeCheckIn: (payload: {
    citizenName: string;
    citizenPhone: string;
    familyContactName: string;
    familyContactPhone: string;
    statusMessage: string;
    lat: number;
    lng: number;
    district: string;
  }) => void;

  // Patch Section A: Live Voice Alert & Control Room Inbox
  setVoiceAlertModalOpen: (open: boolean) => void;
  submitVoiceAlert: (payload: {
    audioUrl?: string;
    audioMimeType: string;
    audioSizeBytes: number;
    durationSeconds: number;
    transcriptSummary?: string;
    lat: number;
    lng: number;
    accuracyMeters: number;
    phone?: string;
    district?: string;
  }) => Promise<VoiceAlertItem>;
  acknowledgeVoiceAlert: (id: string) => void;
  dispatchTeamToVoiceAlert: (id: string, teamName: string) => void;
  resolveVoiceAlert: (id: string) => void;

  // Patch Section B: Emergency SOS & Control Room SOS Inbox
  setEmergencySosModalOpen: (open: boolean) => void;
  submitSosAlert: (payload: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    phone?: string;
    district?: string;
  }) => Promise<EmergencySosItem>;
  acknowledgeSosAlert: (id: string) => void;
  dispatchTeamToSosAlert: (id: string, teamName: string) => void;
  resolveSosAlert: (id: string) => void;

  // Patch Section 7: Impact Tab Comparison Matrix
  updateImpactComparisonRow: (
    id: string,
    updates: Partial<ImpactComparisonRow>
  ) => void;

  submitPartnerAccessRequest: (
    req: Omit<PartnerAccessRequest, 'id' | 'requestedAt' | 'status'>
  ) => void;
  resolvePartnerAccessRequest: (id: string, status: 'Approved' | 'Declined') => void;

  advanceHouseholdStage: (
    caseId: string,
    nextStatus: RelocationCaseStatus,
    note?: string
  ) => void;
  addHouseholdCase: (draft: {
    headName: string;
    villageId: string;
    villageName: string;
    district: string;
    membersCount: number;
    targetSiteName: string;
    compensationSanctionedInr: number;
  }) => void;
  updateSiteParams: (
    siteId: string,
    updates: Partial<
      Pick<RelocationSite, 'usableAreaHa' | 'landPerHouseholdHa' | 'waterReliabilityScore'>
    >
  ) => void;

  moveVillagePriorityOrder: (
    villageId: string,
    direction: 'up' | 'down',
    currentOrderIds: string[]
  ) => void;
  setManualSiteOverride: (villageId: string, siteId: string) => void;
  approvePlan: () => void;
  approveRelocationPlan: () => void;

  // Incident & Resource Actions
  createIncident: (
    draft: Omit<IncidentItem, 'id' | 'code' | 'reportedAt' | 'timeline' | 'status'>
  ) => void;
  advanceIncidentStatus: (incidentId: string, nextStatus: IncidentStatus, note?: string) => void;
  assignTeamToIncident: (incidentId: string, teamId: string) => void;
  deployResourceItem: (stockId: string, qty: number, targetIncidentCode: string) => void;
  updateCampOccupancy: (campId: string, delta: number) => void;

  // CAP Alert & Sensor Actions
  createCapAlert: (draft: Omit<AlertItem, 'id' | 'timestamp' | 'acknowledged'>) => void;
  tickSensors: () => void;
  triggerThresholdBreachDemo: () => void;
  toggleEvacuationChecklistStep: (alertId: string, stepId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  syncAllDataSources: () => void;

  // GIS AOI Actions
  saveAoi: (aoi: Omit<SavedAoi, 'id' | 'createdAt'> | SavedAoi) => void;
  deleteAoi: (id: string) => void;

  addToast: (
    toastOrMessage: Omit<ToastMessage, 'id'> | string,
    type?: 'info' | 'success' | 'warning' | 'critical'
  ) => void;
  showSingleToast: (
    toastOrMessage: Omit<ToastMessage, 'id'> | string,
    type?: 'info' | 'success' | 'warning' | 'critical'
  ) => void;
  dismissToast: (id: string) => void;
  setIdleWarningOpen: (open: boolean) => void;
  setAskNivaranOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

const initialHouseholds = enrichHouseholds(INITIAL_HOUSEHOLD_CASES);

export const useAppStore = create<AppState>((set, get) => ({
  user: getInitialSessionFromToken(),
  language: getInitialLanguage(),
  darkMode: getInitialTheme(),
  textSize: getInitialTextSize(),
  highContrast: getInitialHighContrast(),

  isUsingDemoSeedData: true,
  drillModeActive: false,
  drillStartedAt: null,
  drillSummaryReports: [],

  villages: enrichVillages(INITIAL_VILLAGES),
  sites: enrichSites(INITIAL_RELOCATION_SITES),
  reliefCamps: enrichCamps(INITIAL_RELIEF_CAMPS),
  shelterOccupancyLogs: [
    {
      id: 'slog-01',
      campId: 'rc-01',
      campName: 'Khalapur ZP Central School Relief Camp',
      previousOccupancy: 165,
      newOccupancy: 182,
      changedBy: 'Smt. Vandana Patil (Camp Manager)',
      changedAt: '13:45 IST',
    },
    {
      id: 'slog-02',
      campId: 'rc-03',
      campName: 'Mahad Municipal Multipurpose Hall',
      previousOccupancy: 240,
      newOccupancy: 275,
      changedBy: 'Sh. R. Sawant (Naib Tahsildar)',
      changedAt: '14:10 IST',
    },
  ],
  shelterCheckIns: [
    {
      id: 'chk-01',
      campId: 'rc-01',
      campName: 'Khalapur ZP Central School Relief Camp',
      personName: 'Shankar Pardhi & Family',
      ageGroup: 'Adult (15-59)',
      headcount: 6,
      specialNeeds: 'Elderly (60+)' as unknown as 'Medical',
      status: 'Checked-In',
      checkedInAt: '13:15 IST',
      recordedBy: 'Smt. Vandana Patil (Shelter Manager)',
    },
    {
      id: 'chk-02',
      campId: 'rc-03',
      campName: 'Mahad Municipal Multipurpose Hall',
      personName: 'Sunita Jadhav & Children',
      ageGroup: 'Child (0-14)',
      headcount: 4,
      specialNeeds: 'Infant',
      status: 'Checked-In',
      checkedInAt: '14:02 IST',
      recordedBy: 'Sh. R. Sawant (Shelter Manager)',
    },
  ],
  activeAlertZones: structuredClone(INITIAL_ACTIVE_ALERT_ZONES),
  volunteers: structuredClone(INITIAL_VOLUNTEERS).map((v) => ({
    ...v,
    approvalStatus: 'Approved' as const,
    availability: '24x7 Monsoon Standby',
  })),
  voiceAlerts: structuredClone(INITIAL_VOICE_ALERTS),
  sosAlerts: structuredClone(INITIAL_SOS_ALERTS),
  impactComparison: structuredClone(INITIAL_IMPACT_COMPARISON),
  criticalFacilities: structuredClone(INITIAL_CRITICAL_FACILITIES),
  incidents: enrichIncidents(INITIAL_INCIDENTS),
  responseTeams: enrichTeams(INITIAL_RESPONSE_TEAMS),
  resourceStock: structuredClone(INITIAL_RESOURCE_STOCK),
  resourceRequests: [
    {
      id: 'rreq-01',
      stockId: 'stk-01',
      itemName: 'Inflatable Rescue Boats (IRB) with OBM',
      district: 'Raigad',
      quantityRequested: 2,
      destination: 'Mahad Savitri Floodplain Sector',
      requestedBy: 'Dr. M. Kulkarni, IAS (DDMA Raigad)',
      requestedAt: '13:30 IST',
      status: 'Approved & Dispatched',
      approvedBy: 'Dr. R. Deshmukh, IAS (SEOC)',
      approvedAt: '13:36 IST',
    },
  ],
  familySafeCheckIns: [
    {
      id: 'fsc-01',
      citizenName: 'Ramesh Pardhi',
      citizenPhone: '9876543210',
      familyContactName: 'Mahesh Pardhi (Brother)',
      familyContactPhone: '9822011223',
      statusMessage: 'I am safe at Khalapur ZP Central School Relief Camp.',
      lat: 18.8825,
      lng: 73.2852,
      district: 'Raigad',
      timestamp: '14:05 IST',
    },
  ],
  interventions: structuredClone(INTERVENTION_OPTIONS),
  reports: structuredClone(INITIAL_COMMUNITY_REPORTS),
  offlineQueue: getInitialOfflineQueue(),
  isOfflineSimulated: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  offlinePackReady: true,
  offlinePackCachedAt: '14:32 IST',
  householdCases: initialHouseholds,
  households: initialHouseholds,
  sensors: structuredClone(INITIAL_SENSORS),
  alerts: enrichAlerts(INITIAL_ALERTS),
  dataSources: structuredClone(INITIAL_DATA_SOURCES),
  auditLogs: structuredClone(INITIAL_AUDIT_LOGS),
  scoringVersions: [
    {
      version: 'v2.4-NDMA-2026',
      timestamp: '2026-10-01 09:00 IST',
      author: 'Dr. R. Deshmukh, IAS (State Relief Commissioner)',
      reason: 'Standard Pre-Monsoon Western Ghats Multi-Hazard Baseline Calibration',
      weights: { rainfall: 0.35, slope: 0.30, history: 0.20, riverProximity: 0.15 },
      cutoffs: { immediate: 0.75, shortTerm: 0.50, mediumTerm: 0.30 },
      diffSummary: 'Rain 35% · Slope 30% · History 20% · River 15% (Cutoffs: >0.75 / 0.50 / 0.30)',
    },
    {
      version: 'v2.3-GSI-2025',
      timestamp: '2025-06-15 11:30 IST',
      author: 'GSI Landslide Division & SDMA Technical Committee',
      reason: 'Post-Irshalwadi scarp gradient revision',
      weights: { rainfall: 0.32, slope: 0.33, history: 0.20, riverProximity: 0.15 },
      cutoffs: { immediate: 0.75, shortTerm: 0.50, mediumTerm: 0.30 },
      diffSummary: 'Rain 32%→35% (+3%), Slope 33%→30% (-3%)',
    },
  ],
  currentMethodVersion: 'v2.4-NDMA-2026',
  partnerRequests: [
    {
      id: 'preq-101',
      organisationName: 'Sahyadri Gramin Relief Trust (Registered NGO)',
      organisationType: 'Relief & Partner Organisation',
      contactPerson: 'Prakash Shinde',
      emailOrPhone: 'coord@sahyadrirelief.org / 9822011490',
      district: 'Raigad',
      purpose: 'Community kitchen operations and medical camp support at Khalapur and Mahad shelters',
      documentName: 'NITI_Darpan_Reg_MH_2024_8821.pdf',
      requestedAt: '2026-10-10 11:20 IST',
      status: 'Pending',
    },
  ],
  sosRecords: [],
  savedAois: [
    {
      id: 'aoi-01',
      name: 'Khalapur-Irshalwadi Monsoon Buffer Zone',
      createdAt: '2026-10-10 08:00',
      centerLat: 18.9265,
      centerLng: 73.2361,
      radiusKm: 4.5,
      affectedVillagesCount: 3,
      affectedHouseholds: 308,
      vulnerablePopulation: 492,
      sheltersInside: 2,
      polygonCoords: [
        [18.90, 73.20],
        [18.95, 73.20],
        [18.95, 73.27],
        [18.90, 73.27],
      ],
      coordinates: [
        [18.90, 73.20],
        [18.95, 73.20],
        [18.95, 73.27],
        [18.90, 73.27],
      ],
    },
  ],

  liveLocation: {
    active: true,
    followMe: true,
    lat: 18.5204,
    lng: 73.8567,
    accuracyMeters: 10.5,
    headingDeg: 42,
    speedKmh: 0,
    updatedAt: 'Live GPS Active',
    addressInWords:
      'District Emergency Operations Centre (DEOC), Collector Office, Pune, Maharashtra 411001',
    shortAddressInWords: 'Pune Emergency Operations Center (DEOC)',
    locality: 'Shivajinagar',
    district: 'Pune',
    state: 'Maharashtra',
    postcode: '411001',
  },
  userLocation: null,
  followUserLocation: true,
  selectedDistrictDrilldown: 'All',
  selectedDistrict: 'All',
  selectedSiteId: 'site-01',
  basemap: 'satellite',
  coordFormat: 'DD',
  sidebarCollapsed: false,
  map3dEnabled: true,
  terrainExaggeration: 1.35,
  floodRiseMeters: 0,

  weights: { ...DEFAULT_WEIGHTS },
  climateHorizon: 'today',
  extraRainfallMm: 100,
  divideBySafeCapacity: false,
  selectedVillageId: null,
  explainModalPayload: null,
  customOrderIds: [],
  manualSiteOverrides: {},
  planApproved: false,
  planApprovedAt: null,

  toasts: [],
  idleWarningOpen: false,
  askNivaranOpen: false,
  commandPaletteOpen: false,
  voiceAlertModalOpen: false,
  emergencySosModalOpen: false,
  currentTheme: getInitialAdvancedTheme(),
  gooeyMenuOpen: false,
  emergencyMode: false,
  sidePanel: {
    isOpen: false,
    type: null,
    data: null,
    title: undefined,
  },

  setUser: (user) => {
    const normalizedUser = user
      ? {
          ...user,
          title: user.title || user.designation,
          lastSignIn:
            user.lastSignIn ||
            new Date().toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              hour12: false,
            }) + ' IST · Control Room Workstation (TLS 1.3)',
        }
      : null;

    if (normalizedUser) {
      setMemoryAccessToken(`mem-session-${normalizedUser.id}-${Date.now()}`);
      try {
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalizedUser));
      } catch {
        // ignore
      }
    } else {
      setMemoryAccessToken(null);
      try {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }

    set({ user: normalizedUser });
  },

  login: (user) => {
    const session: UserSession = {
      ...user,
      title: user.title || user.designation,
    };
    get().setUser(session, false);
  },

  loginAsGuestCitizen: () => {
    const guestSession: UserSession = {
      ...ORGANISATION_PRESETS.citizen,
      id: 'usr-guest-01',
      name: 'Public Citizen Session',
      emailOrPhone: 'Unauthenticated Public Access',
      isGuest: true,
    };
    get().setUser(guestSession, false);
  },

  switchOrganisationQuick: (orgType) => {
    const preset = ORGANISATION_PRESETS[orgType] || ORGANISATION_PRESETS.state;
    const session: UserSession = {
      ...preset,
    };
    get().setUser(session, false);
    get().logAuditEvent(
      'ORGANISATION_CONTEXT_SWITCH',
      'Access Control',
      `Switched active session to ${session.unitName} (${session.orgRole}).`
    );
  },

  switchRoleQuick: (role) => {
    if (role === 'administrator' || role === 'sdma') {
      get().switchOrganisationQuick('state');
    } else if (role === 'district_officer') {
      get().switchOrganisationQuick('district');
    } else if (role === 'field_officer') {
      get().switchOrganisationQuick('departments');
    } else if (role === 'response_team') {
      get().switchOrganisationQuick('response_forces');
    } else {
      get().switchOrganisationQuick('citizen');
    }
  },

  logout: () => {
    setMemoryAccessToken(null);
    try {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    void clearOfflineQueueOnSignOut();
    set({ user: null, idleWarningOpen: false, offlineQueue: [] });
  },

  setLanguage: (language) => {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // ignore
    }
    set({ language });
  },

  setTheme: (theme: NivaranTheme) => {
    applyThemeToDocument(theme);
    try {
      window.localStorage.setItem(ADVANCED_THEME_STORAGE_KEY, theme);
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        theme === 'nivaran-dark' || theme === 'midnight' || theme === 'forest' ? 'dark' : 'light'
      );
    } catch {
      // ignore
    }
    set({
      currentTheme: theme,
      darkMode: theme === 'nivaran-dark' || theme === 'midnight' || theme === 'forest',
      highContrast: theme === 'high-contrast',
    });
  },

  setGooeyMenuOpen: (open: boolean) => set({ gooeyMenuOpen: open }),

  toggleEmergencyMode: () => {
    const next = !get().emergencyMode;
    get().addToast({
      title: next ? '🚨 EMERGENCY COMMAND MODE ACTIVATED' : 'Standard Operations Restored',
      message: next
        ? 'High-priority alert routing, evacuation readiness, and strike team status active.'
        : 'Emergency mode deactivated. Routine multi-hazard monitoring restored.',
      type: next ? 'warning' : 'info',
    });
    set({ emergencyMode: next });
  },

  openSidePanel: (type, data, title) =>
    set({
      sidePanel: {
        isOpen: true,
        type,
        data,
        title,
      },
    }),

  closeSidePanel: () =>
    set((s) => ({
      sidePanel: { ...s.sidePanel, isOpen: false },
    })),

  toggleDarkMode: () => {
    const isDarkNow = get().darkMode;
    const nextTheme: NivaranTheme = isDarkNow ? 'nivaran-light' : 'nivaran-dark';
    get().setTheme(nextTheme);
  },

  setTextSize: (textSize) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-text-size', textSize);
    }
    try {
      window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, textSize);
    } catch {
      // ignore
    }
    set({ textSize });
  },

  toggleHighContrast: () => {
    const next = !get().highContrast;
    get().setTheme(next ? 'high-contrast' : 'nivaran-light');
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setSelectedDistrictDrilldown: (selectedDistrictDrilldown) =>
    set({ selectedDistrictDrilldown, selectedDistrict: selectedDistrictDrilldown }),

  setSelectedDistrict: (selectedDistrict) =>
    set({ selectedDistrict, selectedDistrictDrilldown: selectedDistrict }),

  setSelectedSiteId: (selectedSiteId) => set({ selectedSiteId }),
  setBasemap: (basemap) => set({ basemap }),
  toggleCoordFormat: () =>
    set((s) => ({
      coordFormat: s.coordFormat === 'DD' ? 'DMS' : s.coordFormat === 'DMS' ? 'UTM' : 'DD',
    })),
  setMap3dEnabled: (map3dEnabled) => set({ map3dEnabled }),
  setTerrainExaggeration: (terrainExaggeration) => set({ terrainExaggeration }),
  setFloodRiseMeters: (floodRiseMeters) => set({ floodRiseMeters }),

  setLiveLocation: (updates) =>
    set((state) => ({
      liveLocation: { ...state.liveLocation, ...updates },
    })),

  setUserLocation: (userLocation) => set({ userLocation }),
  setFollowUserLocation: (followUserLocation) => set({ followUserLocation }),

  logAuditEvent: (action, module, details) => {
    const user = get().user;
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', {
        hour12: false,
      }),
      actorName: user?.name || 'System Operator',
      actorRole: user?.role || 'administrator',
      action,
      module,
      details,
    };
    set((state) => ({
      auditLogs: [entry, ...state.auditLogs].slice(0, 100),
    }));
  },

  setWeights: (weights, reason = 'Operational weight recalibration via Hazard Mapping') => {
    const prev = get().weights;
    const nextVersionNum = `v2.${get().scoringVersions.length + 3}-REV`;
    const nowIst = new Date().toLocaleString('en-IN', { hour12: false }) + ' IST';
    const diffSummary = `Rain ${Math.round(prev.rainfall * 100)}%→${Math.round(
      weights.rainfall * 100
    )}% · Slope ${Math.round(prev.slope * 100)}%→${Math.round(
      weights.slope * 100
    )}% · History ${Math.round(prev.history * 100)}%→${Math.round(
      weights.history * 100
    )}% · River ${Math.round(prev.riverProximity * 100)}%→${Math.round(
      weights.riverProximity * 100
    )}%`;

    const newVersion: ScoringMethodVersion = {
      version: nextVersionNum,
      timestamp: nowIst,
      author: get().user?.name || 'Administrator',
      reason,
      weights: { ...weights },
      cutoffs: { immediate: 0.75, shortTerm: 0.50, mediumTerm: 0.30 },
      diffSummary,
    };

    set((state) => ({
      weights,
      currentMethodVersion: nextVersionNum,
      scoringVersions: [newVersion, ...state.scoringVersions],
      villages: state.villages.map((v) => ({
        ...v,
        methodVersion: nextVersionNum,
      })),
    }));

    get().logAuditEvent(
      'UPDATED_HAZARD_WEIGHTS',
      'Hazard & Red Zone Mapping',
      `Created Method ${nextVersionNum}: ${diffSummary}`
    );
  },

  resetWeights: () => {
    get().setWeights({ ...DEFAULT_WEIGHTS }, 'Restored standard weights (35% / 30% / 20% / 15%)');
  },

  setClimateHorizon: (climateHorizon) => set({ climateHorizon }),
  setExtraRainfallMm: (extraRainfallMm) => set({ extraRainfallMm }),
  setDivideBySafeCapacity: (divideBySafeCapacity) => set({ divideBySafeCapacity }),
  setSelectedVillageId: (selectedVillageId) => set({ selectedVillageId }),
  openExplainModal: (explainModalPayload) => set({ explainModalPayload }),
  closeExplainModal: () => set({ explainModalPayload: null }),

  dispatchSosEmergency: (payload) => {
    const isOffline = get().isOfflineSimulated || !navigator.onLine;
    const refNo = `SOS-MH-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
    const record: SosDispatchRecord = {
      id: `sos-${Date.now()}`,
      referenceNo: refNo,
      lat: payload.lat,
      lng: payload.lng,
      accuracyMeters: payload.accuracyMeters,
      manualLocationText: payload.manualLocationText,
      timestamp: nowStr,
      note: payload.note,
      queuedOffline: isOffline,
      status: isOffline ? 'Queued Offline' : 'Dispatched to Control Room',
    };

    if (isOffline) {
      void enqueueOfflineMutation({
        idempotencyKey: `sos-${refNo}`,
        type: 'SOS_DISPATCH',
        summary: `Emergency SOS ${refNo} (${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)})`,
        payload: {
          referenceNo: refNo,
          lat: payload.lat,
          lng: payload.lng,
          accuracyMeters: payload.accuracyMeters,
          manualLocationText: payload.manualLocationText,
          note: payload.note,
          timestamp: nowStr,
        },
      });
    }

    set((state) => ({
      sosRecords: [record, ...state.sosRecords],
    }));

    get().logAuditEvent(
      'EMERGENCY_SOS_TRIGGERED',
      'Public Safety SOS',
      `Ref ${refNo} at ${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)} (${record.status}).`
    );

    return record;
  },

  submitPartnerAccessRequest: (req) => {
    const record: PartnerAccessRequest = {
      ...req,
      id: `preq-${Date.now().toString().slice(-4)}`,
      requestedAt: new Date().toLocaleString('en-IN', { hour12: false }) + ' IST',
      status: 'Pending',
    };
    set((state) => ({
      partnerRequests: [record, ...state.partnerRequests],
    }));
    get().logAuditEvent(
      'PARTNER_ACCESS_REQUESTED',
      'Organisation Access',
      `Access request submitted by ${req.organisationName} (${req.contactPerson}).`
    );
    get().addToast({
      title: 'Access request logged',
      message: `Reference ${record.id.toUpperCase()} sent to State Administrator queue.`,
      type: 'info',
    });
  },

  resolvePartnerAccessRequest: (id, status) => {
    set((state) => ({
      partnerRequests: state.partnerRequests.map((r) =>
        r.id === id ? { ...r, status } : r
      ),
    }));
    get().logAuditEvent(
      `PARTNER_ACCESS_${status.toUpperCase()}`,
      'Administration',
      `Partner request #${id} marked ${status}.`
    );
    get().addToast({
      title: `Partner request ${status.toLowerCase()}`,
      message: `Updated organisation access request #${id}.`,
      type: status === 'Approved' ? 'success' : 'warning',
    });
  },

  submitCommunityReport: (draft) => {
    const isOffline = get().isOfflineSimulated || !navigator.onLine;
    const newReport: CommunityReport = {
      ...draft,
      id: `rep-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      isOfflinePending: isOffline,
    };

    if (isOffline) {
      const nextQueue = [newReport, ...get().offlineQueue];
      saveOfflineQueueToStorage(nextQueue);
      set({ offlineQueue: nextQueue });
      get().addToast({
        title: 'Queued for offline sync',
        message: 'Report stored in offline queue and will sync when connection is restored.',
        type: 'warning',
      });
    } else {
      set((state) => ({
        reports: [newReport, ...state.reports],
      }));
      get().logAuditEvent(
        'SUBMITTED_FIELD_REPORT',
        'Community Reporting',
        `New ${draft.category} report submitted for ${draft.villageName}.`
      );
      get().addToast({
        title: 'Report entered verification queue',
        message: `GPS-tagged report for ${draft.villageName} assigned for officer verification.`,
        type: 'success',
      });
    }
  },

  setOfflineSimulated: (offline) => {
    setFaultInjectionConfig({ forceOffline: offline });
    set((state) => ({
      isOfflineSimulated: offline,
      dataSources: state.dataSources.map((d) => ({
        ...d,
        status: offline ? ('degraded' as const) : ('online' as const),
      })),
    }));

    if (offline) {
      get().addToast({
        title: 'Offline Area Mode enabled',
        message:
          'Operating from cached dataset (40 habitations, 25 shelters, 12 relocation sites & offline vector GIS). SOS and field reports will queue locally.',
        type: 'warning',
      });
    } else {
      const pendingReportsCount = get().offlineQueue.length;
      const pendingSosCount = get().sosRecords.filter((s) => s.queuedOffline).length;
      const pendingVoiceCount = get().voiceAlerts.filter((v) => v.status === 'Queued Offline').length;
      const pendingSosAlertsCount = get().sosAlerts.filter((s) => s.status === 'Queued Offline').length;
      if (
        pendingReportsCount > 0 ||
        pendingSosCount > 0 ||
        pendingVoiceCount > 0 ||
        pendingSosAlertsCount > 0
      ) {
        get().syncOfflineQueue();
      } else {
        get().addToast({
          title: 'Online Mode restored',
          message: 'Live telemetry feeds and control room gateway connected.',
          type: 'success',
        });
      }
    }
  },

  syncOfflineQueue: () => {
    const queuedReports = get().offlineQueue;
    const queuedSos = get().sosRecords.filter((s) => s.queuedOffline);
    const queuedVoice = get().voiceAlerts.filter((v) => v.status === 'Queued Offline');
    const queuedSosAlerts = get().sosAlerts.filter((s) => s.status === 'Queued Offline');
    setFaultInjectionConfig({ forceOffline: false });
    void clearOfflineQueueOnSignOut();

    if (
      queuedReports.length === 0 &&
      queuedSos.length === 0 &&
      queuedVoice.length === 0 &&
      queuedSosAlerts.length === 0
    ) {
      set((state) => ({
        isOfflineSimulated: false,
        dataSources: state.dataSources.map((d) => ({
          ...d,
          status: 'online' as const,
          lastSynced: 'Just now',
        })),
      }));
      get().addToast({
        title: 'Online Mode active',
        message: 'No pending offline items in queue. All feeds synchronised.',
        type: 'info',
      });
      return;
    }

    const syncedReports = queuedReports.map((r) => ({ ...r, isOfflinePending: false }));
    saveOfflineQueueToStorage([]);
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    set((state) => ({
      reports: [...syncedReports, ...state.reports],
      offlineQueue: [],
      sosRecords: state.sosRecords.map((s) =>
        s.queuedOffline
          ? {
              ...s,
              queuedOffline: false,
              status: 'Dispatched to Control Room',
            }
          : s
      ),
      voiceAlerts: state.voiceAlerts.map((va) =>
        va.status === 'Queued Offline'
          ? {
              ...va,
              receivedAtIst: nowIst,
              status: 'Delivered to control room',
              auditTrail: [
                ...va.auditTrail,
                {
                  time: nowIst,
                  actor: 'Offline Sync Worker',
                  action: `Reconnected and delivered queued Voice Alert to ${va.controlRoomTarget}.`,
                },
              ],
            }
          : va
      ),
      sosAlerts: state.sosAlerts.map((sa) =>
        sa.status === 'Queued Offline'
          ? {
              ...sa,
              status: 'Delivered',
              auditTrail: [
                ...sa.auditTrail,
                {
                  time: nowIst,
                  actor: 'Offline Sync Worker',
                  action: `Reconnected and delivered queued Emergency SOS to ${sa.controlRoomTarget}.`,
                },
              ],
            }
          : sa
      ),
      isOfflineSimulated: false,
      dataSources: state.dataSources.map((d) => ({
        ...d,
        status: 'online' as const,
        lastSynced: 'Just now',
      })),
    }));

    get().logAuditEvent(
      'OFFLINE_QUEUE_SYNCHRONISED',
      'Offline Resilience',
      `Synchronised ${syncedReports.length} report(s), ${queuedVoice.length} Voice Alert(s), and ${queuedSos.length + queuedSosAlerts.length} SOS item(s) with Control Room.`
    );

    get().addToast({
      title: 'Offline queue synced to Control Room',
      message: `Delivered ${queuedVoice.length} Voice Alert(s), ${queuedSosAlerts.length} SOS signal(s), and ${syncedReports.length} report(s).`,
      type: 'success',
    });
  },

  cacheOfflineSafetyPack: () => {
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    set({
      offlinePackReady: true,
      offlinePackCachedAt: nowIst,
    });
    get().logAuditEvent(
      'OFFLINE_SAFETY_PACK_CACHED',
      'Offline Area Operations',
      `Verified offline cache pack (40 habitations, 25 shelters, 12 relocation sites, vector GIS & SOPs) at ${nowIst}.`
    );
    get().addToast({
      title: 'Offline Area Data Pack ready',
      message: `All 40 habitations, 25 shelters, 12 candidate sites, helplines & vector GIS cached for no-network access (${nowIst}).`,
      type: 'success',
    });
  },

  updateReportStatus: (reportId, status, officerNote) => {
    const currentReport = get().reports.find((r) => r.id === reportId);
    if (!currentReport) return;

    const wasVerified = currentReport.status === 'verified';
    const nowVerified = status === 'verified';
    const verifierName = get().user?.name || 'S. K. Kadam (Field Officer)';

    set((state) => ({
      reports: state.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status,
              verifiedBy: nowVerified ? verifierName : r.verifiedBy,
              verifiedAt: nowVerified ? new Date().toLocaleTimeString() : r.verifiedAt,
              officerNote: officerNote ?? r.officerNote,
            }
          : r
      ),
      villages: state.villages.map((v) => {
        if (v.id !== currentReport.villageId) return v;
        let nextCount = v.verifiedReportsCount;
        if (!wasVerified && nowVerified) nextCount += 1;
        if (wasVerified && !nowVerified) nextCount = Math.max(0, nextCount - 1);
        return { ...v, verifiedReportsCount: nextCount };
      }),
    }));

    get().logAuditEvent(
      `REPORT_${status.toUpperCase()}`,
      'Community Verification',
      `Report #${reportId} (${currentReport.villageName}) marked ${status}.`
    );

    if (nowVerified && !wasVerified) {
      get().addToast({
        title: 'Report verified — hazard score updated',
        message: `${currentReport.villageName} history factor incremented (+0.025) on map.`,
        type: 'info',
      });
    } else {
      get().addToast({
        title: `Report status: ${status.replace('_', ' ')}`,
        message: `Updated status for ${currentReport.villageName} report #${reportId}.`,
        type: 'info',
      });
    }
  },

  advanceHouseholdStage: (caseId, nextStatus, note) => {
    const user = get().user;
    const approverName = user?.name || 'Dr. R. Deshmukh, IAS';
    const approverRole =
      user?.role === 'field_officer' ? 'Field Verification Officer' : 'Competent Authority';

    set((state) => ({
      householdCases: state.householdCases.map((hc) => {
        if (hc.id !== caseId) return hc;
        const lastEvent = hc.timeline[hc.timeline.length - 1];
        const prevHash = lastEvent ? lastEvent.currHash : '0x0000000000000000';
        const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
        const eventNote =
          note || `Stage transitioned from ${hc.status} to ${nextStatus} after verification.`;
        const currHash = computeLedgerHash(
          prevHash,
          `${nextStatus}|${timestamp}|${approverName}|${eventNote}`
        );

        const nextCompensation =
          nextStatus === 'Compensation Paid' ||
          nextStatus === 'Site Allotted' ||
          nextStatus === 'Resettled'
            ? hc.compensationSanctionedInr
            : hc.compensationDisbursedInr;

        return {
          ...hc,
          status: nextStatus,
          compensationDisbursedInr: nextCompensation,
          isOverdue: false,
          daysInCurrentStage: 0,
          plotNumber:
            nextStatus === 'Site Allotted' || nextStatus === 'Resettled'
              ? hc.plotNumber || `Plot D-${Math.floor(10 + Math.random() * 80)}`
              : hc.plotNumber,
          timeline: [
            ...hc.timeline,
            {
              id: `tl-${hc.timeline.length + 1}-${Date.now()}`,
              status: nextStatus,
              timestamp,
              approver: approverName,
              approverRole,
              note: eventNote,
              prevHash,
              currHash,
            },
          ],
        };
      }),
    }));

    get().logAuditEvent(
      'HOUSEHOLD_STAGE_ADVANCE',
      'Relocation Case Management',
      `Case ${caseId} moved to ${nextStatus} with hash-chain integrity seal.`
    );

    get().addToast({
      title: 'Relocation case updated',
      message: `Case ${caseId.toUpperCase()} moved to "${nextStatus}". Record integrity: verified.`,
      type: 'success',
    });
  },

  updateSiteParams: (siteId, updates) => {
    set((state) => ({
      sites: state.sites.map((s) => (s.id === siteId ? { ...s, ...updates } : s)),
    }));
  },

  moveVillagePriorityOrder: (villageId, direction, currentOrderIds) => {
    const list = [...currentOrderIds];
    const idx = list.indexOf(villageId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[swapIdx];
    list[swapIdx] = temp;
    set({ customOrderIds: list });
  },

  setManualSiteOverride: (villageId, siteId) => {
    set((state) => ({
      manualSiteOverrides: {
        ...state.manualSiteOverrides,
        [villageId]: siteId,
      },
    }));
    get().logAuditEvent(
      'MANUAL_SITE_REASSIGNMENT',
      'Relocation Planner',
      `Habitation ${villageId} manually assigned to site ${siteId || 'Greedy match'}.`
    );
    get().addToast({
      title: 'Site allocation updated',
      message: siteId
        ? 'Relocation allocation updated with manual site reassignment.'
        : 'Restored greedy matching for habitation.',
      type: 'info',
    });
  },

  approvePlan: () => {
    const timestamp = new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    set({ planApproved: true, planApprovedAt: timestamp });
    get().logAuditEvent(
      'APPROVED_RELOCATION_PLAN',
      'Relocation Planner',
      `Signed Pre-Monsoon Relocation Order at ${timestamp}.`
    );
    get().addToast({
      title: 'Relocation plan approved',
      message: `Pre-Monsoon Relocation & Site Allotment Order signed at ${timestamp}.`,
      type: 'success',
    });
  },

  approveRelocationPlan: () => {
    get().approvePlan();
  },

  createIncident: (draft) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newInc: IncidentItem = {
      ...draft,
      id: `inc-${Date.now().toString().slice(-4)}`,
      code: `INC-MH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Reported',
      reportedAt: `Today, ${nowStr} IST`,
      timeline: [
        {
          time: `${nowStr} IST`,
          actor: get().user?.name || 'Control Room Operator',
          note: 'Incident created and logged on command map.',
        },
      ],
    };
    set((state) => ({
      incidents: [newInc, ...state.incidents],
    }));
    get().logAuditEvent(
      'CREATED_INCIDENT',
      'Incident Command',
      `Created incident ${newInc.code} at ${newInc.villageName} (${newInc.severity}).`
    );
    get().addToast({
      title: `Incident ${newInc.code} logged`,
      message: `Registered ${newInc.title} (${newInc.severity}) in ${newInc.district}.`,
      type: 'warning',
    });
  },

  advanceIncidentStatus: (incidentId, nextStatus, note) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const actor = get().user?.name || 'Incident Commander';
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status: nextStatus,
              timeline: [
                ...inc.timeline,
                {
                  time: `${nowStr} IST`,
                  actor,
                  note: note || `Status transitioned to ${nextStatus}.`,
                },
              ],
            }
          : inc
      ),
    }));
    get().logAuditEvent(
      'INCIDENT_STATUS_CHANGE',
      'Incident Command',
      `Incident ${incidentId} advanced to ${nextStatus}.`
    );
    get().addToast({
      title: `Incident status: ${nextStatus}`,
      message: `Updated workflow status and SLA timer.`,
      type: 'info',
    });
  },

  assignTeamToIncident: (incidentId, teamId) => {
    const team = get().responseTeams.find((t) => t.id === teamId);
    const inc = get().incidents.find((i) => i.id === incidentId);
    if (!team || !inc) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      incidents: state.incidents.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              status:
                i.status === 'Reported' || i.status === 'Verified'
                  ? 'Response Assigned'
                  : i.status,
              assignedTeamIds: Array.from(new Set([...i.assignedTeamIds, teamId])),
              timeline: [
                ...i.timeline,
                {
                  time: `${nowStr} IST`,
                  actor: get().user?.name || 'SEOC Dispatcher',
                  note: `Assigned ${team.code} (${team.personnelCount} personnel) to incident.`,
                },
              ],
            }
          : i
      ),
      responseTeams: state.responseTeams.map((t) =>
        t.id === teamId
          ? {
              ...t,
              status: 'Deployed',
              assignedIncidentId: incidentId,
              lat: inc.lat + 0.003,
              lng: inc.lng - 0.003,
              lastUpdated: 'Just now',
            }
          : t
      ),
    }));

    get().logAuditEvent(
      'ASSIGNED_RESPONSE_TEAM',
      'Resources & Relief',
      `Dispatched ${team.code} to ${inc.code} (${inc.villageName}).`
    );
    get().addToast({
      title: `${team.code} dispatched`,
      message: `Team deployed to ${inc.villageName} and tracked on map.`,
      type: 'success',
    });
  },

  deployResourceItem: (stockId, qty, targetIncidentCode) => {
    set((state) => ({
      resourceStock: state.resourceStock.map((item) => {
        if (item.id !== stockId) return item;
        const actualQty = Math.min(qty, item.availableQty);
        return {
          ...item,
          availableQty: item.availableQty - actualQty,
          deployedQty: item.deployedQty + actualQty,
        };
      }),
    }));
    get().logAuditEvent(
      'DEPLOYED_RELIEF_STOCK',
      'Resources & Relief',
      `Dispatched ${qty} units of stock #${stockId} to ${targetIncidentCode}.`
    );
    get().addToast({
      title: 'Equipment dispatched',
      message: `Allocated ${qty} units to ${targetIncidentCode}. Inventory updated.`,
      type: 'success',
    });
  },

  updateCampOccupancy: (campId, delta) => {
    const camp = get().reliefCamps.find((c) => c.id === campId);
    if (!camp) return;
    const prevOcc = camp.currentOccupancy;
    const nextOcc = Math.max(0, Math.min(camp.capacityPersons, prevOcc + delta));
    if (nextOcc === prevOcc) return;
    const actor = get().user?.name || 'Shelter Manager';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    const logItem: ShelterOccupancyLog = {
      id: `slog-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      campId: camp.id,
      campName: camp.name,
      previousOccupancy: prevOcc,
      newOccupancy: nextOcc,
      changedBy: actor,
      changedAt: nowIst,
    };
    set((state) => ({
      shelterOccupancyLogs: [logItem, ...state.shelterOccupancyLogs].slice(0, 50),
      reliefCamps: state.reliefCamps.map((c) => {
        if (c.id !== campId) return c;
        return {
          ...c,
          currentOccupancy: nextOcc,
          occupancyLogs: [logItem, ...(c.occupancyLogs || [])],
          status:
            nextOcc >= c.capacityPersons
              ? 'Full'
              : nextOcc > 0
              ? 'Active'
              : 'Standby',
        };
      }),
    }));
    get().logAuditEvent(
      'SHELTER_OCCUPANCY_UPDATED',
      'Resources & Shelters',
      `${camp.name} occupancy changed from ${prevOcc} to ${nextOcc} by ${actor} at ${nowIst}.`
    );
  },

  setCampOccupancyExact: (campId, newOccupancy) => {
    const camp = get().reliefCamps.find((c) => c.id === campId);
    if (!camp) return;
    const clamped = Math.max(0, Math.min(camp.capacityPersons, Math.round(newOccupancy)));
    const delta = clamped - camp.currentOccupancy;
    if (delta !== 0) {
      get().updateCampOccupancy(campId, delta);
    }
  },

  upsertActiveAlertZone: (draft) => {
    const actor = get().user?.name || 'DDMA Control Room Authority';
    const isDrill = get().drillModeActive;
    const nowIst =
      new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' IST';
    const id = draft.id || `az-${Date.now().toString().slice(-5)}`;
    const existing = get().activeAlertZones.find((z) => z.id === id);
    const nextVersion = existing ? (existing.version || 1) + 1 : 1;
    const lifecycleStatus: AlertLifecycleStatus =
      draft.lifecycleStatus || (existing ? 'Updated' : 'Issued');

    const zone: ActiveAlertZone = {
      id,
      level: draft.level,
      disasterType: draft.disasterType,
      areaName: isDrill && !draft.areaName.startsWith('[DRILL]') ? `[DRILL] ${draft.areaName}` : draft.areaName,
      district: draft.district,
      issuedBy: actor,
      issuedAt: nowIst,
      startsAt: draft.startsAt || nowIst,
      expiresAt: draft.expiresAt,
      instructions: draft.instructions,
      messageEn:
        draft.messageEn ||
        `${draft.level} Alert (${draft.disasterType.toUpperCase()}) for ${draft.areaName}. ${draft.instructions}`,
      messageHi:
        draft.messageHi ||
        `${draft.areaName} (${draft.district}) के लिए ${draft.level} अलर्ट (${draft.disasterType})। ${draft.instructions}`,
      severity:
        draft.severity ||
        (draft.level === 'Red'
          ? 'Extreme'
          : draft.level === 'Orange'
          ? 'Severe'
          : draft.level === 'Yellow'
          ? 'Moderate'
          : 'Minor'),
      urgency:
        draft.urgency ||
        (draft.level === 'Red' ? 'Immediate' : draft.level === 'Orange' ? 'Expected' : 'Future'),
      lifecycleStatus,
      usersReached:
        existing?.usersReached ||
        (draft.level === 'Red' ? 14820 : draft.level === 'Orange' ? 9450 : 5120),
      isDrill: existing?.isDrill ?? isDrill,
      version: nextVersion,
      versionHistory: [
        ...(existing?.versionHistory || []),
        {
          version: nextVersion,
          updatedAt: nowIst,
          updatedBy: actor,
          level: draft.level,
          lifecycleStatus,
          note: `${lifecycleStatus} as ${draft.level} Alert (${draft.disasterType}).`,
        },
      ],
      polygon: draft.polygon,
      centerLat: draft.centerLat,
      centerLng: draft.centerLng,
    };

    set((state) => {
      const exists = state.activeAlertZones.some((z) => z.id === id);
      const nextZones = exists
        ? state.activeAlertZones.map((z) => (z.id === id ? zone : z))
        : [zone, ...state.activeAlertZones];
      return { activeAlertZones: nextZones };
    });

    publishRealtimeEvent({ type: 'ALERT_ZONE_UPDATED', zone });

    get().logAuditEvent(
      'ACTIVE_ALERT_ZONE_ISSUED',
      'Alert Zones',
      `${lifecycleStatus} ${zone.level.toUpperCase()} (${zone.disasterType}) alert zone v${nextVersion} for ${zone.areaName} by ${actor}.`
    );

    get().addToast({
      title: `${isDrill ? '[DRILL] ' : ''}${zone.level} Alert Zone (${lifecycleStatus})`,
      message: `${zone.areaName} (v${nextVersion} · ${zone.usersReached?.toLocaleString('en-IN')} users reached) updated live.`,
      type: zone.level === 'Red' ? 'critical' : zone.level === 'Orange' ? 'warning' : 'success',
    });
  },

  updateAlertZoneLevel: (zoneId, level, instructions, expiresAt) => {
    const existing = get().activeAlertZones.find((z) => z.id === zoneId);
    if (!existing) return;
    get().upsertActiveAlertZone({
      id: existing.id,
      level,
      disasterType: existing.disasterType,
      areaName: existing.areaName,
      district: existing.district,
      startsAt: existing.startsAt,
      expiresAt: expiresAt || existing.expiresAt,
      instructions: instructions || existing.instructions,
      messageEn: existing.messageEn,
      messageHi: existing.messageHi,
      severity: existing.severity,
      urgency: existing.urgency,
      lifecycleStatus: 'Updated',
      polygon: existing.polygon,
      centerLat: existing.centerLat,
      centerLng: existing.centerLng,
    });
  },

  updateAlertZoneLifecycle: (zoneId, lifecycleStatus, note) => {
    const existing = get().activeAlertZones.find((z) => z.id === zoneId);
    if (!existing) return;
    const actor = get().user?.name || 'DDMA Control Room Authority';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    const nextVersion = (existing.version || 1) + 1;
    const updatedZone: ActiveAlertZone = {
      ...existing,
      lifecycleStatus,
      version: nextVersion,
      versionHistory: [
        ...(existing.versionHistory || []),
        {
          version: nextVersion,
          updatedAt: nowIst,
          updatedBy: actor,
          level: existing.level,
          lifecycleStatus,
          note: note || `Lifecycle status changed to ${lifecycleStatus}.`,
        },
      ],
    };

    set((state) => ({
      activeAlertZones: state.activeAlertZones.map((z) =>
        z.id === zoneId ? updatedZone : z
      ),
    }));
    publishRealtimeEvent({ type: 'ALERT_ZONE_UPDATED', zone: updatedZone });
    get().logAuditEvent(
      `ALERT_LIFECYCLE_${lifecycleStatus.toUpperCase()}`,
      'Alert Zones',
      `Alert zone ${existing.areaName} transitioned to ${lifecycleStatus} (v${nextVersion}) by ${actor}.`
    );
    get().addToast({
      title: `Alert lifecycle: ${lifecycleStatus}`,
      message: `${existing.areaName} updated to ${lifecycleStatus} (v${nextVersion}).`,
      type: lifecycleStatus === 'Cancelled' || lifecycleStatus === 'Expired' ? 'info' : 'success',
    });
  },

  importCapAlertZone: (capData) => {
    const cLat = capData.centerLat ?? 18.8825;
    const cLng = capData.centerLng ?? 73.2852;
    const polygon: [number, number][] = [
      [cLng - 0.045, cLat - 0.035],
      [cLng + 0.045, cLat - 0.035],
      [cLng + 0.05, cLat + 0.035],
      [cLng - 0.04, cLat + 0.04],
      [cLng - 0.045, cLat - 0.035],
    ];
    get().upsertActiveAlertZone({
      level: capData.level,
      disasterType: capData.disasterType,
      areaName: capData.areaName,
      district: capData.district,
      expiresAt: capData.expiresAt,
      instructions: capData.instructions,
      messageEn: capData.messageEn,
      messageHi: capData.messageHi,
      lifecycleStatus: 'Issued',
      polygon,
      centerLat: cLat,
      centerLng: cLng,
    });
    get().logAuditEvent(
      'CAP_XML_JSON_IMPORTED',
      'Alert Zones',
      `Imported CAP v1.2 alert for ${capData.areaName} (${capData.level}).`
    );
  },

  resetDemoSeedData: () => {
    void clearOperationalSnapshot();
    const freshHouseholds = enrichHouseholds(INITIAL_HOUSEHOLD_CASES);
    set({
      isUsingDemoSeedData: true,
      drillModeActive: false,
      drillStartedAt: null,
      villages: enrichVillages(INITIAL_VILLAGES),
      sites: enrichSites(INITIAL_RELOCATION_SITES),
      reliefCamps: enrichCamps(INITIAL_RELIEF_CAMPS),
      activeAlertZones: structuredClone(INITIAL_ACTIVE_ALERT_ZONES),
      volunteers: structuredClone(INITIAL_VOLUNTEERS).map((v) => ({
        ...v,
        approvalStatus: 'Approved' as const,
        availability: '24x7 Monsoon Standby',
      })),
      voiceAlerts: structuredClone(INITIAL_VOICE_ALERTS),
      sosAlerts: structuredClone(INITIAL_SOS_ALERTS),
      impactComparison: structuredClone(INITIAL_IMPACT_COMPARISON),
      incidents: enrichIncidents(INITIAL_INCIDENTS),
      resourceStock: structuredClone(INITIAL_RESOURCE_STOCK),
      householdCases: freshHouseholds,
      households: freshHouseholds,
    });
    get().logAuditEvent(
      'DEMO_SEED_DATA_RESTORED',
      'Administration',
      'Restored factory Demo Seed Data (districts, shelters, volunteers, villages, alert zones & incidents).'
    );
    get().addToast({
      title: 'Demo seed data restored',
      message: 'All baseline districts, shelters, volunteers, alert zones and incidents have been reset.',
      type: 'success',
    });
  },

  clearDemoSeedData: () => {
    set({
      isUsingDemoSeedData: false,
      activeAlertZones: [],
      voiceAlerts: [],
      sosAlerts: [],
      incidents: [],
      shelterOccupancyLogs: [],
      shelterCheckIns: [],
      resourceRequests: [],
      familySafeCheckIns: [],
    });
    get().logAuditEvent(
      'DEMO_SEED_DATA_REMOVED',
      'Administration',
      'Removed demo operational alerts, incidents, voice/SOS inbox & check-in records for live production use.'
    );
    get().addToast({
      title: 'Demo operational records cleared',
      message: 'Ready for live operational data. Click "Reset Demo Data" anytime to restore demo records.',
      type: 'warning',
    });
  },

  toggleDrillMode: () => {
    const currentlyActive = get().drillModeActive;
    const actor = get().user?.name || 'Control Room Commander';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    if (!currentlyActive) {
      set({
        drillModeActive: true,
        drillStartedAt: nowIst,
      });
      get().logAuditEvent(
        'MOCK_DRILL_STARTED',
        'Mock Drill Mode',
        `Started Mock Drill Mode at ${nowIst} by ${actor}. All drill alerts and SOS are marked [DRILL] and excluded from real statistics.`
      );
      get().addToast({
        title: 'MOCK DRILL MODE ACTIVE',
        message: 'Alerts, Voice Alerts, and SOS triggered now are tagged [DRILL] and kept out of real SitRep statistics.',
        type: 'warning',
      });
    } else {
      const state = get();
      const drillZones = state.activeAlertZones.filter((z) => z.isDrill).length;
      const drillVoice = state.voiceAlerts.filter((v) => v.isDrill).length;
      const drillSos = state.sosAlerts.filter((s) => s.isDrill).length;
      const report: DrillSummaryReport = {
        id: `drl-${Date.now().toString().slice(-4)}`,
        startedAt: state.drillStartedAt || nowIst,
        endedAt: nowIst,
        startedBy: actor,
        alertsIssuedCount: drillZones,
        voiceAlertsSentCount: drillVoice,
        sosSentCount: drillSos,
        avgAckSeconds: 18,
        summaryNote: `Completed mock drill (${drillZones} alert zones, ${drillVoice} voice alerts, ${drillSos} SOS signals). All drill items isolated from real SitRep statistics.`,
      };
      set((s) => ({
        drillModeActive: false,
        drillStartedAt: null,
        drillSummaryReports: [report, ...s.drillSummaryReports],
      }));
      get().logAuditEvent(
        'MOCK_DRILL_COMPLETED',
        'Mock Drill Mode',
        `Ended Mock Drill Mode at ${nowIst}. Summary: ${report.summaryNote}`
      );
      get().addToast({
        title: 'Mock Drill Completed — Summary Generated',
        message: report.summaryNote,
        type: 'success',
      });
    }
  },

  toggleVolunteerLocationOptIn: (volunteerId) => {
    const vol = get().volunteers.find((v) => v.id === volunteerId);
    if (!vol) return;
    const nextOpt = !vol.optedInLocationSharing;
    set((state) => ({
      volunteers: state.volunteers.map((v) =>
        v.id === volunteerId ? { ...v, optedInLocationSharing: nextOpt } : v
      ),
    }));
    get().logAuditEvent(
      'VOLUNTEER_PRIVACY_CONSENT_CHANGED',
      'Volunteer Registry',
      `${vol.name} live location sharing set to ${nextOpt ? 'Opted-In' : 'Opted-Out'}.`
    );
    get().addToast({
      title: nextOpt ? 'Live location sharing enabled' : 'Live location hidden',
      message: `${vol.name} privacy preference updated.`,
      type: 'info',
    });
  },

  updateVolunteerStatus: (volunteerId, status) => {
    set((state) => ({
      volunteers: state.volunteers.map((v) =>
        v.id === volunteerId ? { ...v, status, lastSeen: 'Just now' } : v
      ),
    }));
    get().logAuditEvent(
      'VOLUNTEER_STATUS_UPDATED',
      'Volunteer Registry',
      `Volunteer #${volunteerId} availability changed to ${status}.`
    );
  },

  registerVolunteer: (draft) => {
    const newVol: VolunteerMember = {
      id: `vol-${Date.now().toString().slice(-4)}`,
      name: draft.name,
      phone: draft.phone,
      district: draft.district,
      skills: draft.skills.length > 0 ? draft.skills : ['rescue'],
      status: 'Available',
      lastSeen: 'Just now',
      optedInLocationSharing: draft.optedInLocationSharing,
      lat: draft.lat,
      lng: draft.lng,
      unitName: 'Aapda Mitra / NSS Registered Volunteer',
      approvalStatus: 'Pending Approval',
      availability: draft.availability || '24x7 Emergency On-Call',
    };
    set((state) => ({
      volunteers: [newVol, ...state.volunteers],
    }));
    get().logAuditEvent(
      'VOLUNTEER_REGISTERED',
      'Volunteer Registry',
      `Registered new volunteer ${newVol.name} (${newVol.district}) — awaiting officer approval.`
    );
    get().addToast({
      title: 'Volunteer registered (Pending Officer Approval)',
      message: `${newVol.name} added to queue for officer verification.`,
      type: 'success',
    });
  },

  approveVolunteerRegistration: (volunteerId, approved) => {
    const actor = get().user?.name || 'District Nodal Officer';
    set((state) => ({
      volunteers: state.volunteers.map((v) =>
        v.id === volunteerId
          ? { ...v, approvalStatus: approved ? 'Approved' : 'Rejected' }
          : v
      ),
    }));
    get().logAuditEvent(
      approved ? 'VOLUNTEER_APPROVED' : 'VOLUNTEER_REJECTED',
      'Volunteer Registry',
      `Volunteer #${volunteerId} ${approved ? 'approved' : 'rejected'} by ${actor}.`
    );
    get().addToast({
      title: approved ? 'Volunteer approved' : 'Volunteer registration declined',
      message: `Updated accreditation status by ${actor}.`,
      type: approved ? 'success' : 'warning',
    });
  },

  assignVolunteerTask: (volunteerId, title, location) => {
    const actor = get().user?.name || 'Control Room Officer';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    const task = {
      id: `vtsk-${Date.now().toString().slice(-4)}`,
      title,
      location,
      status: 'Assigned' as const,
      assignedBy: actor,
      assignedAt: nowIst,
      updatedAt: nowIst,
    };
    set((state) => ({
      volunteers: state.volunteers.map((v) =>
        v.id === volunteerId ? { ...v, assignedTask: task } : v
      ),
    }));
    get().logAuditEvent(
      'VOLUNTEER_TASK_ASSIGNED',
      'Volunteer Operations',
      `Assigned task "${title}" (${location}) to volunteer #${volunteerId} by ${actor}.`
    );
    get().addToast({
      title: 'Task assigned to volunteer',
      message: `"${title}" sent to volunteer. Status: Assigned.`,
      type: 'info',
    });
  },

  updateVolunteerTaskStatus: (volunteerId, status) => {
    const actor = get().user?.name || 'Volunteer / Field Responder';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    set((state) => ({
      volunteers: state.volunteers.map((v) => {
        if (v.id !== volunteerId || !v.assignedTask) return v;
        return {
          ...v,
          status:
            status === 'Accepted' || status === 'In progress'
              ? 'Busy'
              : status === 'Done' || status === 'Declined'
              ? 'Available'
              : v.status,
          assignedTask: {
            ...v.assignedTask,
            status,
            updatedAt: nowIst,
          },
        };
      }),
    }));
    get().logAuditEvent(
      `VOLUNTEER_TASK_${status.toUpperCase().replace(/\s+/g, '_')}`,
      'Volunteer Operations',
      `Volunteer #${volunteerId} task status updated to "${status}" by ${actor} at ${nowIst}.`
    );
    get().addToast({
      title: `Volunteer task: ${status}`,
      message: `Task status updated to ${status} at ${nowIst}.`,
      type: status === 'Declined' ? 'warning' : 'success',
    });
  },

  addShelterRecord: (draft) => {
    const actor = get().user?.name || 'Shelter Manager';
    const newCamp: ReliefCamp = {
      id: `rc-${Date.now().toString().slice(-4)}`,
      name: draft.name,
      district: (draft.district as ReliefCamp['district']) || 'Raigad',
      taluka: draft.taluka,
      block: draft.taluka,
      shelterType: draft.shelterType,
      lat: draft.lat,
      lng: draft.lng,
      elevationM: 120,
      capacityPersons: Math.max(10, draft.capacityPersons),
      currentOccupancy: 0,
      status: 'Standby',
      inChargeName: draft.inChargeName,
      inchargeName: draft.inChargeName,
      contactPhone: draft.contactPhone,
      facilities: draft.facilities,
      lastUpdated: 'Just now',
      occupancyLogs: [],
    };
    set((state) => ({
      reliefCamps: [newCamp, ...state.reliefCamps],
    }));
    get().logAuditEvent(
      'SHELTER_CREATED',
      'Resources & Shelters',
      `Created new shelter "${newCamp.name}" (${newCamp.district}, cap ${newCamp.capacityPersons}) by ${actor}.`
    );
    get().addToast({
      title: 'New shelter added to map & registry',
      message: `${newCamp.name} (${newCamp.capacityPersons} beds) is now live.`,
      type: 'success',
    });
  },

  updateShelterFacilities: (campId, facilities, capacityPersons, contactPhone) => {
    const actor = get().user?.name || 'Shelter Manager';
    set((state) => ({
      reliefCamps: state.reliefCamps.map((c) =>
        c.id === campId
          ? {
              ...c,
              facilities,
              capacityPersons: capacityPersons ?? c.capacityPersons,
              contactPhone: contactPhone ?? c.contactPhone,
              lastUpdated: 'Just now',
            }
          : c
      ),
    }));
    get().logAuditEvent(
      'SHELTER_DETAILS_UPDATED',
      'Resources & Shelters',
      `Updated facilities/capacity for shelter #${campId} by ${actor}.`
    );
    get().addToast({
      title: 'Shelter facilities updated',
      message: 'Updated shelter configuration and facility availability.',
      type: 'success',
    });
  },

  checkInShelterPeople: (payload) => {
    const camp = get().reliefCamps.find((c) => c.id === payload.campId);
    if (!camp) return;
    const actor = get().user?.name || 'Shelter Manager';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    const headcount = Math.max(1, Math.round(payload.headcount));
    const record: ShelterCheckInRecord = {
      id: `chk-${Date.now().toString().slice(-5)}`,
      campId: camp.id,
      campName: camp.name,
      personName: payload.personName,
      ageGroup: payload.ageGroup,
      headcount,
      specialNeeds: payload.specialNeeds,
      status: 'Checked-In',
      checkedInAt: nowIst,
      recordedBy: actor,
    };
    set((state) => ({
      shelterCheckIns: [record, ...state.shelterCheckIns],
    }));
    get().updateCampOccupancy(camp.id, headcount);
    get().logAuditEvent(
      'SHELTER_CHECK_IN',
      'Resources & Shelters',
      `Checked in ${headcount} person(s) (${payload.personName}, ${payload.ageGroup}, Needs: ${payload.specialNeeds}) at ${camp.name}.`
    );
    get().addToast({
      title: `Checked in ${headcount} person(s) to ${camp.name}`,
      message: `Occupancy updated automatically on the map.`,
      type: 'success',
    });
  },

  checkOutShelterRecord: (checkInId) => {
    const rec = get().shelterCheckIns.find((r) => r.id === checkInId);
    if (!rec || rec.status === 'Checked-Out') return;
    const actor = get().user?.name || 'Shelter Manager';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    set((state) => ({
      shelterCheckIns: state.shelterCheckIns.map((r) =>
        r.id === checkInId
          ? { ...r, status: 'Checked-Out', checkedOutAt: nowIst }
          : r
      ),
    }));
    get().updateCampOccupancy(rec.campId, -rec.headcount);
    get().logAuditEvent(
      'SHELTER_CHECK_OUT',
      'Resources & Shelters',
      `Checked out ${rec.headcount} person(s) (${rec.personName}) from ${rec.campName} by ${actor}.`
    );
    get().addToast({
      title: `Checked out ${rec.headcount} person(s)`,
      message: `${rec.campName} occupancy reduced by ${rec.headcount}.`,
      type: 'info',
    });
  },

  addResourceStockItem: (draft) => {
    const actor = get().user?.name || 'IDRN Nodal Officer';
    const newItem: ResourceStockItem = {
      id: `stk-${Date.now().toString().slice(-4)}`,
      name: draft.itemName,
      itemName: draft.itemName,
      category: draft.category,
      district: draft.district,
      warehouseLocation: draft.depotLocation,
      depotLocation: draft.depotLocation,
      availableQty: Math.max(1, draft.availableQty),
      deployedQty: 0,
      minThresholdQty: Math.max(1, Math.round(draft.availableQty * 0.2)),
      unit: draft.unit || 'units',
      custodianPhone: draft.custodianPhone,
      lastUpdated: 'Just now',
    };
    set((state) => ({
      resourceStock: [newItem, ...state.resourceStock],
    }));
    get().logAuditEvent(
      'IDRN_RESOURCE_REGISTERED',
      'Resources & Relief',
      `Registered ${newItem.availableQty} ${newItem.unit} of ${newItem.name} at ${newItem.warehouseLocation} (${newItem.district}) by ${actor}.`
    );
    get().addToast({
      title: 'IDRN resource registered',
      message: `${newItem.name} (${newItem.availableQty} ${newItem.unit}) added to inventory.`,
      type: 'success',
    });
  },

  requestResourceStock: (payload) => {
    const item = get().resourceStock.find((s) => s.id === payload.stockId);
    if (!item) return;
    const itemLabel = item.itemName || item.name;
    const actor = get().user?.name || 'District Incident Commander';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    const req: ResourceRequestRecord = {
      id: `rreq-${Date.now().toString().slice(-4)}`,
      stockId: item.id,
      itemName: itemLabel,
      district: item.district,
      quantityRequested: Math.max(1, payload.quantityRequested),
      destination: payload.destination,
      requestedBy: actor,
      requestedAt: nowIst,
      status: 'Requested',
    };
    set((state) => ({
      resourceRequests: [req, ...state.resourceRequests],
    }));
    get().logAuditEvent(
      'IDRN_RESOURCE_REQUESTED',
      'Resources & Relief',
      `Requested ${req.quantityRequested} ${item.unit} of ${itemLabel} for ${req.destination} by ${actor}.`
    );
    get().addToast({
      title: 'Resource request submitted',
      message: `Requested ${req.quantityRequested} ${item.unit} of ${itemLabel} for ${req.destination}.`,
      type: 'info',
    });
  },

  approveAndDispatchResourceRequest: (requestId) => {
    const req = get().resourceRequests.find((r) => r.id === requestId);
    if (!req || req.status !== 'Requested') return;
    const actor = get().user?.name || 'State Relief Commissioner';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    set((state) => ({
      resourceRequests: state.resourceRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Approved & Dispatched',
              approvedBy: actor,
              approvedAt: nowIst,
            }
          : r
      ),
    }));

    get().deployResourceItem(req.stockId, req.quantityRequested, req.destination);
    get().logAuditEvent(
      'IDRN_RESOURCE_APPROVED_AND_DISPATCHED',
      'Resources & Relief',
      `Approved request #${requestId} (${req.quantityRequested} of ${req.itemName} to ${req.destination}) by ${actor}.`
    );
  },

  submitFamilySafeCheckIn: (payload) => {
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';
    const record: FamilySafeCheckIn = {
      id: `fsc-${Date.now().toString().slice(-4)}`,
      citizenName: payload.citizenName,
      citizenPhone: payload.citizenPhone,
      familyContactName: payload.familyContactName,
      familyContactPhone: payload.familyContactPhone,
      statusMessage: payload.statusMessage,
      lat: payload.lat,
      lng: payload.lng,
      district: payload.district,
      timestamp: nowIst,
    };
    set((state) => ({
      familySafeCheckIns: [record, ...state.familySafeCheckIns],
    }));
    get().logAuditEvent(
      'FAMILY_SAFE_CHECK_IN_SENT',
      'Citizen Safety Portal',
      `${record.citizenName} sent "I Am Safe" check-in to ${record.familyContactName} (${record.familyContactPhone}) at ${nowIst}.`
    );
    get().addToast({
      title: '"I Am Safe" Check-In Sent',
      message: `Notified ${record.familyContactName} (${record.familyContactPhone}) with your safe GPS location.`,
      type: 'success',
    });
  },

  addHouseholdCase: (draft) => {
    const actor = get().user?.name || 'District Rehabilitation Officer';
    const nowDate = new Date().toISOString().slice(0, 10);
    const id = `hh-${Date.now().toString().slice(-4)}`;
    const currHash = computeLedgerHash('0x0000000000000000', `Identified|${nowDate}|${actor}`);
    const newCase: HouseholdCase = {
      id,
      caseCode: `REL-MH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      headOfHousehold: draft.headName,
      headName: draft.headName,
      aadhaarMasked: 'XXXX-XXXX-4821',
      villageId: draft.villageId,
      villageName: draft.villageName,
      district: draft.district,
      familySize: draft.membersCount,
      membersCount: draft.membersCount,
      vulnerableMembersCount: 1,
      vulnerableMembers: 1,
      riskLevel: 'Immediate',
      currentRisk: 'Immediate',
      assignedSiteId: 's-01',
      targetSiteId: 's-01',
      assignedSiteName: draft.targetSiteName,
      targetSiteName: draft.targetSiteName,
      status: 'Identified',
      stage: 'identified',
      compensationSanctionedInr: draft.compensationSanctionedInr,
      compensationDisbursedInr: 0,
      daysInCurrentStage: 0,
      slaTargetDays: 14,
      isOverdue: false,
      lastUpdated: nowDate,
      timeline: [
        {
          id: `tl-1-${Date.now()}`,
          status: 'Identified',
          timestamp: `${nowDate} 10:00`,
          approver: actor,
          approverRole: 'Revenue Verification Officer',
          note: 'Household surveyed and registered in Relocation Case Tracker.',
          prevHash: '0x0000000000000000',
          currHash,
        },
      ],
    };
    set((state) => ({
      householdCases: [newCase, ...state.householdCases],
      households: [newCase, ...state.households],
    }));
    get().logAuditEvent(
      'RELOCATION_CASE_CREATED',
      'Relocation Case Management',
      `Registered household relocation case ${newCase.caseCode} (${newCase.headOfHousehold}, ${newCase.villageName}).`
    );
    get().addToast({
      title: `Relocation Case ${newCase.caseCode} created`,
      message: `Added ${newCase.headOfHousehold} (${newCase.villageName}) to Relocation Case Tracker.`,
      type: 'success',
    });
  },

  setVoiceAlertModalOpen: (voiceAlertModalOpen) => set({ voiceAlertModalOpen }),

  submitVoiceAlert: async (payload) => {
    const user = get().user;
    const isDrill = get().drillModeActive;
    const isOffline = get().isOfflineSimulated || (typeof navigator !== 'undefined' && !navigator.onLine);
    const nowMs = Date.now();
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    const district = payload.district || user?.district || 'Raigad';
    const resolvedDistrict = district === 'All' ? 'Raigad' : district;
    const controlRoomTarget = isOffline
      ? `Maharashtra State Control Room (Fallback — ${resolvedDistrict} DEOC Unreachable)`
      : `${resolvedDistrict} District Control Room (DDMA)`;

    const cappedDuration = Math.min(30, Math.max(1, Math.round(payload.durationSeconds)));
    const refNo = `${isDrill ? 'DRILL-' : ''}VA-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newVoiceAlert: VoiceAlertItem = {
      id: `va-${nowMs}`,
      referenceNo: refNo,
      audioUrl: payload.audioUrl,
      audioMimeType: payload.audioMimeType,
      audioSizeBytes: payload.audioSizeBytes,
      durationSeconds: cappedDuration,
      transcriptSummary: payload.transcriptSummary,
      lat: payload.lat,
      lng: payload.lng,
      accuracyMeters: payload.accuracyMeters,
      timestamp: nowIst,
      createdAtMs: nowMs,
      receivedAtIst: isOffline ? undefined : nowIst,
      userId: user?.id || 'anon-citizen',
      userName: user?.name || 'Citizen Caller',
      phone: payload.phone || user?.emailOrPhone || '',
      district: resolvedDistrict,
      controlRoomTarget,
      severity: 'Critical',
      status: isOffline ? 'Queued Offline' : 'Sending',
      retryCount: 0,
      isDrill,
      auditTrail: [
        {
          time: nowIst,
          actor: user?.name || 'Citizen Caller',
          action: `${isDrill ? '[DRILL] ' : ''}Recorded ${cappedDuration}s Voice Alert with GPS (+/- ${Math.round(payload.accuracyMeters)} m).`,
        },
      ],
    };

    set((state) => ({
      voiceAlerts: [newVoiceAlert, ...state.voiceAlerts],
    }));

    if (isOffline) {
      await enqueueOfflineMutation({
        idempotencyKey: `va-${newVoiceAlert.id}`,
        type: 'VOICE_ALERT',
        summary: `Voice Alert ${refNo} (${newVoiceAlert.durationSeconds}s) at ${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}`,
        payload: {
          id: newVoiceAlert.id,
          referenceNo: refNo,
          lat: payload.lat,
          lng: payload.lng,
          accuracyMeters: payload.accuracyMeters,
          durationSeconds: newVoiceAlert.durationSeconds,
          district: resolvedDistrict,
        },
      });
      get().logAuditEvent(
        'VOICE_ALERT_QUEUED_OFFLINE',
        'Voice Alert',
        `Voice Alert ${refNo} queued in IndexedDB for automatic retry on reconnect.`
      );
      get().addToast({
        title: 'Voice Alert queued offline',
        message: `${refNo} saved locally and will send automatically when network returns. Call 112 if immediate.`,
        type: 'warning',
      });
      return newVoiceAlert;
    }

    try {
      await gatewayContract.postVoiceAlert({
        audioMimeType: newVoiceAlert.audioMimeType,
        audioSizeBytes: newVoiceAlert.audioSizeBytes,
        durationSeconds: newVoiceAlert.durationSeconds,
        lat: newVoiceAlert.lat,
        lng: newVoiceAlert.lng,
        accuracyMeters: newVoiceAlert.accuracyMeters,
        userId: newVoiceAlert.userId,
        userName: newVoiceAlert.userName,
        phone: newVoiceAlert.phone,
        district: newVoiceAlert.district,
        controlRoomTarget: newVoiceAlert.controlRoomTarget,
        audioUrl: newVoiceAlert.audioUrl,
        transcriptSummary: newVoiceAlert.transcriptSummary,
      });

      const receivedAtIst =
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST';

      const deliveredAlert: VoiceAlertItem = {
        ...newVoiceAlert,
        receivedAtIst,
        status: 'Delivered to control room',
        auditTrail: [
          ...newVoiceAlert.auditTrail,
          {
            time: nowIst,
            actor: 'Nivaran Gateway',
            action: `Delivered to ${controlRoomTarget}. Received by control room at ${receivedAtIst}.`,
          },
        ],
      };

      set((state) => ({
        voiceAlerts: state.voiceAlerts.map((v) =>
          v.id === newVoiceAlert.id ? deliveredAlert : v
        ),
      }));

      publishRealtimeEvent({ type: 'VOICE_ALERT_CREATED', alert: deliveredAlert });

      get().logAuditEvent(
        'VOICE_ALERT_DELIVERED',
        'Voice Alert',
        `Voice Alert ${refNo} delivered to ${controlRoomTarget}.`
      );

      get().addToast({
        title: 'Voice Alert delivered to Control Room',
        message: `Ref ${refNo} received by ${controlRoomTarget} at ${receivedAtIst}.`,
        type: 'critical',
      });

      return deliveredAlert;
    } catch (err) {
      const failedAlert: VoiceAlertItem = {
        ...newVoiceAlert,
        status: 'Failed',
        retryCount: 1,
        auditTrail: [
          ...newVoiceAlert.auditTrail,
          {
            time: nowIst,
            actor: 'Nivaran Gateway',
            action: `Delivery error: ${err instanceof Error ? err.message : 'Network error'}. Queued for retry.`,
          },
        ],
      };
      set((state) => ({
        voiceAlerts: state.voiceAlerts.map((v) =>
          v.id === newVoiceAlert.id ? failedAlert : v
        ),
      }));
      return failedAlert;
    }
  },

  acknowledgeVoiceAlert: (id) => {
    const actor = get().user?.name || 'Dr. M. Kulkarni, IAS (Control Room Officer)';
    const nowMs = Date.now();
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    void gatewayContract.patchVoiceAlertStatus(id, 'Acknowledged by control room', actor);

    set((state) => ({
      voiceAlerts: state.voiceAlerts.map((va) =>
        va.id === id
          ? {
              ...va,
              status: 'Acknowledged by control room',
              acknowledgedAtMs: va.acknowledgedAtMs || nowMs,
              acknowledgedBy: actor,
              acknowledgedAt: nowIst,
              auditTrail: [
                ...va.auditTrail,
                {
                  time: nowIst,
                  actor,
                  action: `Acknowledged by control room (${actor}).`,
                },
              ],
            }
          : va
      ),
    }));

    publishRealtimeEvent({
      type: 'VOICE_ALERT_STATUS_UPDATED',
      id,
      status: 'Acknowledged by control room',
      actor,
    });

    get().logAuditEvent(
      'VOICE_ALERT_ACKNOWLEDGED',
      'Control Room Alerts',
      `Voice Alert ${id} acknowledged by ${actor} at ${nowIst}.`
    );

    get().addToast({
      title: 'Voice Alert acknowledged',
      message: `Sender notified with officer name (${actor}) and time (${nowIst}).`,
      type: 'success',
    });
  },

  dispatchTeamToVoiceAlert: (id, teamName) => {
    const actor = get().user?.name || 'Control Room Dispatcher';
    const nowMs = Date.now();
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    void gatewayContract.patchVoiceAlertStatus(id, 'Team Dispatched', actor);

    set((state) => ({
      voiceAlerts: state.voiceAlerts.map((va) =>
        va.id === id
          ? {
              ...va,
              status: 'Team Dispatched',
              acknowledgedAtMs: va.acknowledgedAtMs || nowMs,
              acknowledgedBy: va.acknowledgedBy || actor,
              acknowledgedAt: va.acknowledgedAt || nowIst,
              dispatchedTeamName: teamName,
              auditTrail: [
                ...va.auditTrail,
                {
                  time: nowIst,
                  actor,
                  action: `Dispatched response team: ${teamName}.`,
                },
              ],
            }
          : va
      ),
    }));

    publishRealtimeEvent({
      type: 'VOICE_ALERT_STATUS_UPDATED',
      id,
      status: 'Team Dispatched',
      actor,
    });

    get().logAuditEvent(
      'VOICE_ALERT_TEAM_DISPATCHED',
      'Control Room Alerts',
      `Dispatched ${teamName} to Voice Alert ${id}.`
    );

    get().addToast({
      title: 'Response team dispatched',
      message: `${teamName} assigned to Voice Alert caller location.`,
      type: 'success',
    });
  },

  resolveVoiceAlert: (id) => {
    const actor = get().user?.name || 'Control Room Officer';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    void gatewayContract.patchVoiceAlertStatus(id, 'Resolved', actor);

    set((state) => ({
      voiceAlerts: state.voiceAlerts.map((va) =>
        va.id === id
          ? {
              ...va,
              status: 'Resolved',
              auditTrail: [
                ...va.auditTrail,
                {
                  time: nowIst,
                  actor,
                  action: 'Marked resolved by control room.',
                },
              ],
            }
          : va
      ),
    }));

    publishRealtimeEvent({
      type: 'VOICE_ALERT_STATUS_UPDATED',
      id,
      status: 'Resolved',
      actor,
    });

    get().logAuditEvent(
      'VOICE_ALERT_RESOLVED',
      'Control Room Alerts',
      `Voice Alert ${id} marked resolved by ${actor}.`
    );

    get().addToast({
      title: 'Voice Alert resolved',
      message: 'Incident closed and archived in Voice Alert history.',
      type: 'info',
    });
  },

  setEmergencySosModalOpen: (emergencySosModalOpen) => set({ emergencySosModalOpen }),

  submitSosAlert: async (payload) => {
    const user = get().user;
    const isDrill = get().drillModeActive;
    const isOffline = get().isOfflineSimulated || (typeof navigator !== 'undefined' && !navigator.onLine);
    const nowMs = Date.now();
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }) + ' IST';

    const district = payload.district || user?.district || 'Raigad';
    const resolvedDistrict = district === 'All' ? 'Raigad' : district;
    const controlRoomTarget = isOffline
      ? `Maharashtra State Control Room (Fallback — ${resolvedDistrict} DEOC Unreachable)`
      : `${resolvedDistrict} District Control Room (DDMA)`;

    const refNo = `${isDrill ? 'DRILL-' : ''}SOS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSosAlert: EmergencySosItem = {
      id: `sos-${nowMs}`,
      referenceNo: refNo,
      lat: payload.lat,
      lng: payload.lng,
      accuracyMeters: payload.accuracyMeters,
      timestamp: nowIst,
      createdAtMs: nowMs,
      userId: user?.id || `anon-cit-${Math.floor(1000 + Math.random() * 9000)}`,
      userName: user?.name || 'Anonymous Citizen SOS',
      phone: payload.phone || user?.emailOrPhone || '',
      district: resolvedDistrict,
      controlRoomTarget,
      priority: 'Highest (SOS)',
      status: isOffline ? 'Queued Offline' : 'Sending',
      retryCount: 0,
      isDrill,
      auditTrail: [
        {
          time: nowIst,
          actor: user?.name || 'Citizen SOS',
          action: `${isDrill ? '[DRILL] ' : ''}Confirmed 2-second Emergency SOS hold with GPS (${payload.lat.toFixed(5)}°N, ${payload.lng.toFixed(5)}°E, +/- ${Math.round(payload.accuracyMeters)} m).`,
        },
      ],
    };

    set((state) => ({
      sosAlerts: [newSosAlert, ...state.sosAlerts],
    }));

    if (isOffline) {
      await enqueueOfflineMutation({
        idempotencyKey: `sos-alert-${newSosAlert.id}`,
        type: 'SOS_ALERT',
        summary: `Emergency SOS ${refNo} at ${payload.lat.toFixed(4)}, ${payload.lng.toFixed(4)}`,
        payload: {
          id: newSosAlert.id,
          referenceNo: refNo,
          lat: payload.lat,
          lng: payload.lng,
          accuracyMeters: payload.accuracyMeters,
          userId: newSosAlert.userId,
          phone: newSosAlert.phone,
          district: resolvedDistrict,
        },
      });
      get().logAuditEvent(
        'SOS_ALERT_QUEUED_OFFLINE',
        'Emergency SOS',
        `Emergency SOS ${refNo} queued in IndexedDB for automatic retry on reconnect.`
      );
      get().addToast({
        title: 'Emergency SOS queued offline',
        message: `${refNo} saved locally and will send automatically when network returns. Call 112 immediately.`,
        type: 'critical',
      });
      return newSosAlert;
    }

    try {
      await gatewayContract.postSosAlert({
        lat: newSosAlert.lat,
        lng: newSosAlert.lng,
        accuracyMeters: newSosAlert.accuracyMeters,
        timestamp: newSosAlert.timestamp,
        userId: newSosAlert.userId,
        userName: newSosAlert.userName,
        phone: newSosAlert.phone,
        district: newSosAlert.district,
        controlRoomTarget: newSosAlert.controlRoomTarget,
      });

      const deliveredSos: EmergencySosItem = {
        ...newSosAlert,
        status: 'Delivered',
        auditTrail: [
          ...newSosAlert.auditTrail,
          {
            time: nowIst,
            actor: 'Nivaran Gateway',
            action: `Delivered HIGHEST PRIORITY SOS distress signal to ${controlRoomTarget}.`,
          },
        ],
      };

      set((state) => ({
        sosAlerts: state.sosAlerts.map((s) =>
          s.id === newSosAlert.id ? deliveredSos : s
        ),
      }));

      publishRealtimeEvent({ type: 'SOS_ALERT_CREATED', alert: deliveredSos });

      get().logAuditEvent(
        'SOS_ALERT_DELIVERED',
        'Emergency SOS',
        `Emergency SOS ${refNo} delivered to ${controlRoomTarget}.`
      );

      get().addToast({
        title: 'EMERGENCY SOS DELIVERED',
        message: `Ref ${refNo} delivered to ${controlRoomTarget} (Highest Priority).`,
        type: 'critical',
      });

      return deliveredSos;
    } catch (err) {
      const failedSos: EmergencySosItem = {
        ...newSosAlert,
        status: 'Failed',
        retryCount: 1,
        auditTrail: [
          ...newSosAlert.auditTrail,
          {
            time: nowIst,
            actor: 'Nivaran Gateway',
            action: `Delivery error: ${err instanceof Error ? err.message : 'Network error'}. Queued for retry.`,
          },
        ],
      };
      set((state) => ({
        sosAlerts: state.sosAlerts.map((s) =>
          s.id === newSosAlert.id ? failedSos : s
        ),
      }));
      return failedSos;
    }
  },

  acknowledgeSosAlert: (id) => {
    const actor = get().user?.name || 'Dr. M. Kulkarni, IAS (Control Room Officer)';
    const nowMs = Date.now();
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    void gatewayContract.patchSosAlertStatus(id, 'Acknowledged by control room', actor);

    set((state) => ({
      sosAlerts: state.sosAlerts.map((sa) =>
        sa.id === id
          ? {
              ...sa,
              status: 'Acknowledged by control room',
              acknowledgedAtMs: sa.acknowledgedAtMs || nowMs,
              acknowledgedBy: actor,
              acknowledgedAt: nowIst,
              auditTrail: [
                ...sa.auditTrail,
                {
                  time: nowIst,
                  actor,
                  action: `Acknowledged by control room (${actor}).`,
                },
              ],
            }
          : sa
      ),
    }));

    publishRealtimeEvent({
      type: 'SOS_ALERT_STATUS_UPDATED',
      id,
      status: 'Acknowledged by control room',
      actor,
    });

    get().logAuditEvent(
      'SOS_ALERT_ACKNOWLEDGED',
      'Control Room SOS',
      `Emergency SOS ${id} acknowledged by ${actor} at ${nowIst}.`
    );

    get().addToast({
      title: 'Emergency SOS acknowledged',
      message: `Caller notified with officer name (${actor}) and time (${nowIst}).`,
      type: 'success',
    });
  },

  dispatchTeamToSosAlert: (id, teamName) => {
    const actor = get().user?.name || 'Control Room Dispatcher';
    const nowMs = Date.now();
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    void gatewayContract.patchSosAlertStatus(id, 'Team Dispatched', actor);

    set((state) => ({
      sosAlerts: state.sosAlerts.map((sa) =>
        sa.id === id
          ? {
              ...sa,
              status: 'Team Dispatched',
              acknowledgedAtMs: sa.acknowledgedAtMs || nowMs,
              acknowledgedBy: sa.acknowledgedBy || actor,
              acknowledgedAt: sa.acknowledgedAt || nowIst,
              dispatchedTeamName: teamName,
              auditTrail: [
                ...sa.auditTrail,
                {
                  time: nowIst,
                  actor,
                  action: `Dispatched response team: ${teamName}.`,
                },
              ],
            }
          : sa
      ),
    }));

    publishRealtimeEvent({
      type: 'SOS_ALERT_STATUS_UPDATED',
      id,
      status: 'Team Dispatched',
      actor,
    });

    get().logAuditEvent(
      'SOS_ALERT_TEAM_DISPATCHED',
      'Control Room SOS',
      `Dispatched ${teamName} to Emergency SOS ${id}.`
    );

    get().addToast({
      title: 'SOS Response Team Dispatched',
      message: `${teamName} dispatched to Emergency SOS caller coordinates.`,
      type: 'success',
    });
  },

  resolveSosAlert: (id) => {
    const actor = get().user?.name || 'Control Room Officer';
    const nowIst =
      new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' IST';

    void gatewayContract.patchSosAlertStatus(id, 'Resolved', actor);

    set((state) => ({
      sosAlerts: state.sosAlerts.map((sa) =>
        sa.id === id
          ? {
              ...sa,
              status: 'Resolved',
              auditTrail: [
                ...sa.auditTrail,
                {
                  time: nowIst,
                  actor,
                  action: 'Marked resolved by control room.',
                },
              ],
            }
          : sa
      ),
    }));

    publishRealtimeEvent({
      type: 'SOS_ALERT_STATUS_UPDATED',
      id,
      status: 'Resolved',
      actor,
    });

    get().logAuditEvent(
      'SOS_ALERT_RESOLVED',
      'Control Room SOS',
      `Emergency SOS ${id} marked resolved by ${actor}.`
    );

    get().addToast({
      title: 'Emergency SOS resolved',
      message: 'SOS distress signal closed and archived.',
      type: 'info',
    });
  },

  updateImpactComparisonRow: (id, updates) => {
    const actor = get().user?.name || 'Administrator';
    set((state) => ({
      impactComparison: state.impactComparison.map((row) =>
        row.id === id ? { ...row, ...updates } : row
      ),
    }));
    get().logAuditEvent(
      'IMPACT_COMPARISON_UPDATED',
      'Impact Assessment',
      `Updated capability comparison parameter #${id} by ${actor}.`
    );
    get().addToast({
      title: 'Comparison rating updated',
      message: 'Capability matrix and normalized category scores recalculated.',
      type: 'success',
    });
  },

  createCapAlert: (draft) => {
    const newAlert: AlertItem = {
      ...draft,
      id: `alt-${Date.now()}`,
      timestamp: 'Just now',
      acknowledged: false,
      deliveryStats: {
        smsSent: 2450,
        appPushDelivered: 1620,
        whatsappBroadcast: 1180,
        sirensActivated: 3,
      },
    };
    set((state) => ({
      alerts: [newAlert, ...state.alerts],
    }));
    get().logAuditEvent(
      'CAP_BROADCAST_ISSUED',
      'Early Warning & Alerting',
      `Dispatched ${draft.severity.toUpperCase()} CAP alert for ${draft.villageName}.`
    );
    get().addToast({
      title: 'CAP public alert dispatched',
      message: `Broadcast transmitted across SMS, App Push, WhatsApp & Sirens for ${draft.villageName}.`,
      type: 'critical',
    });
  },

  tickSensors: () => {
    set((state) => ({
      sensors: state.sensors.map((s) => {
        const jitter = (Math.random() - 0.44) * (s.sensorType === 'rain_gauge' ? 2.4 : 0.4);
        const nextVal = Number(Math.max(0, s.currentValue + jitter).toFixed(1));
        const status: SensorReading['status'] =
          nextVal >= s.criticalThreshold
            ? 'critical'
            : nextVal >= s.warningThreshold
            ? 'warning'
            : 'normal';
        const nextHist = [
          ...s.history.slice(1),
          {
            time: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
            value: nextVal,
          },
        ];
        return {
          ...s,
          currentValue: nextVal,
          status,
          history: nextHist,
        };
      }),
    }));
  },

  triggerThresholdBreachDemo: () => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      sensors: state.sensors.map((s) =>
        s.id === 'sens-01'
          ? {
              ...s,
              currentValue: 194.5,
              status: 'critical',
              history: [...s.history.slice(1), { time: 'BREACH', value: 194.5 }],
            }
          : s
      ),
      alerts: [
        {
          id: `alt-${Date.now()}`,
          villageId: 'v-01',
          villageName: 'Irshalwadi',
          district: 'Raigad',
          hazardType: 'cloudburst',
          severity: 'critical',
          urgency: 'Immediate',
          certainty: 'Observed',
          title: 'TELEMETRY THRESHOLD BREACH: 6-Hr Rainfall 194.5 mm',
          message:
            'Tipping-bucket gauge crossed 180 mm critical threshold. Immediate Red Zone Evacuation Countdown Checklist initiated.',
          timestamp: `Triggered at ${nowTime}`,
          acknowledged: false,
          sensorTrigger: 'Automated Rain Gauge #sens-01 (194.5 mm/6h)',
          deliveryStats: {
            smsSent: 1890,
            appPushDelivered: 1240,
            whatsappBroadcast: 890,
            sirensActivated: 2,
          },
          evacuationChecklist: [
            {
              id: `ev-b1-${Date.now()}`,
              label: 'Broadcast Emergency CAP Siren in Marathi & Hindi',
              department: 'SEOC Control Room',
              completed: true,
              completedAt: nowTime,
            },
            {
              id: `ev-b2-${Date.now()}`,
              label: 'Mobilize Khalapur Tehsil Quick Response Team & NDRF Unit',
              department: 'Incident Commander (Tahsildar)',
              completed: false,
            },
            {
              id: `ev-b3-${Date.now()}`,
              label: 'Evacuate remaining families to Khalapur-Chowk Revenue Township',
              department: 'Field Officer & Police Patil',
              completed: false,
            },
          ],
        },
        ...state.alerts,
      ],
    }));

    get().addToast({
      title: 'Critical threshold crossed (194.5 mm/6h)',
      message: 'Irshalwadi rain gauge breached critical mark. Evacuation checklist initiated.',
      type: 'critical',
    });
  },

  toggleEvacuationChecklistStep: (alertId, stepId) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId
          ? {
              ...a,
              evacuationChecklist: a.evacuationChecklist.map((st) =>
                st.id === stepId
                  ? {
                      ...st,
                      completed: !st.completed,
                      completedAt: !st.completed ? nowTime : undefined,
                    }
                  : st
              ),
            }
          : a
      ),
    }));
  },

  acknowledgeAlert: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    }));
    get().logAuditEvent(
      'ACKNOWLEDGED_ALERT',
      'Early Warning Center',
      `Alert #${alertId} acknowledged by operator.`
    );
    get().addToast({
      title: 'Alert acknowledged',
      message: 'Logged acknowledgment in control room incident diary.',
      type: 'info',
    });
  },

  syncAllDataSources: () => {
    set((state) => ({
      dataSources: state.dataSources.map((d) => ({
        ...d,
        lastSynced: 'Just now',
        status: 'online',
      })),
    }));
    get().addToast({
      title: 'Data feeds synchronized',
      message: 'IMD, CWC, GSI, Bhuvan, Census, Open-Meteo & USGS feeds refreshed.',
      type: 'success',
    });
  },

  saveAoi: (aoiDraft) => {
    const newAoi: SavedAoi = {
      ...aoiDraft,
      id: `aoi-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    set((state) => ({
      savedAois: [newAoi, ...state.savedAois],
    }));
    get().addToast({
      title: 'Area of Interest saved',
      message: `Saved "${newAoi.name}" with ${newAoi.affectedHouseholds} households inside buffer.`,
      type: 'success',
    });
  },

  deleteAoi: (id) => {
    set((state) => ({
      savedAois: state.savedAois.filter((a) => a.id !== id),
    }));
  },

  addToast: (toastOrMessage, type = 'info') => {
    const id = `tst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const toastObj: ToastMessage =
      typeof toastOrMessage === 'string'
        ? {
            id,
            title:
              type === 'critical'
                ? 'Critical alert'
                : type === 'warning'
                ? 'Operational notice'
                : type === 'success'
                ? 'Action completed'
                : 'System update',
            message: toastOrMessage,
            type,
          }
        : { ...toastOrMessage, id };

    set((state) => ({
      toasts: [toastObj, ...state.toasts].slice(0, 4),
    }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 5500);
  },

  showSingleToast: (toastOrMessage, type = 'info') => {
    const id = `tst-${Date.now()}`;
    const toastObj: ToastMessage =
      typeof toastOrMessage === 'string'
        ? {
            id,
            title:
              type === 'critical'
                ? 'Critical alert'
                : type === 'warning'
                ? 'Operational notice'
                : type === 'success'
                ? 'Action completed'
                : 'System update',
            message: toastOrMessage,
            type,
          }
        : { ...toastOrMessage, id };

    // Set ONLY this single notification and clear any stale stacked alerts
    set({ toasts: [toastObj] });
    setTimeout(() => {
      get().dismissToast(id);
    }, 4500);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  setIdleWarningOpen: (idleWarningOpen) => set({ idleWarningOpen }),
  setAskNivaranOpen: (askNivaranOpen) => set({ askNivaranOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
}));

// Hydrate from IndexedDB on startup & subscribe to BroadcastChannel for live multi-tab synchronization
let isApplyingRemoteSnapshot = false;

void loadOperationalSnapshot().then((snapshot) => {
  if (!snapshot) return;
  isApplyingRemoteSnapshot = true;
  useAppStore.setState({
    ...(typeof snapshot.isUsingDemoSeedData === 'boolean'
      ? { isUsingDemoSeedData: snapshot.isUsingDemoSeedData }
      : {}),
    ...(typeof snapshot.drillModeActive === 'boolean'
      ? { drillModeActive: snapshot.drillModeActive }
      : {}),
    ...(snapshot.activeAlertZones ? { activeAlertZones: snapshot.activeAlertZones } : {}),
    ...(snapshot.reliefCamps ? { reliefCamps: snapshot.reliefCamps } : {}),
    ...(snapshot.shelterOccupancyLogs
      ? { shelterOccupancyLogs: snapshot.shelterOccupancyLogs }
      : {}),
    ...(snapshot.shelterCheckIns ? { shelterCheckIns: snapshot.shelterCheckIns } : {}),
    ...(snapshot.volunteers ? { volunteers: snapshot.volunteers } : {}),
    ...(snapshot.resourceStock ? { resourceStock: snapshot.resourceStock } : {}),
    ...(snapshot.resourceRequests ? { resourceRequests: snapshot.resourceRequests } : {}),
    ...(snapshot.incidents ? { incidents: snapshot.incidents } : {}),
    ...(snapshot.householdCases
      ? { householdCases: snapshot.householdCases, households: snapshot.householdCases }
      : {}),
    ...(snapshot.voiceAlerts ? { voiceAlerts: snapshot.voiceAlerts } : {}),
    ...(snapshot.sosAlerts ? { sosAlerts: snapshot.sosAlerts } : {}),
    ...(snapshot.impactComparison ? { impactComparison: snapshot.impactComparison } : {}),
    ...(snapshot.familySafeCheckIns ? { familySafeCheckIns: snapshot.familySafeCheckIns } : {}),
    ...(snapshot.drillSummaryReports
      ? { drillSummaryReports: snapshot.drillSummaryReports }
      : {}),
    ...(snapshot.auditLogs ? { auditLogs: snapshot.auditLogs } : {}),
  });
  isApplyingRemoteSnapshot = false;
});

subscribeOperationalSync((incoming) => {
  isApplyingRemoteSnapshot = true;
  useAppStore.setState({
    ...(typeof incoming.isUsingDemoSeedData === 'boolean'
      ? { isUsingDemoSeedData: incoming.isUsingDemoSeedData }
      : {}),
    ...(typeof incoming.drillModeActive === 'boolean'
      ? { drillModeActive: incoming.drillModeActive }
      : {}),
    ...(incoming.activeAlertZones ? { activeAlertZones: incoming.activeAlertZones } : {}),
    ...(incoming.reliefCamps ? { reliefCamps: incoming.reliefCamps } : {}),
    ...(incoming.shelterOccupancyLogs
      ? { shelterOccupancyLogs: incoming.shelterOccupancyLogs }
      : {}),
    ...(incoming.shelterCheckIns ? { shelterCheckIns: incoming.shelterCheckIns } : {}),
    ...(incoming.volunteers ? { volunteers: incoming.volunteers } : {}),
    ...(incoming.resourceStock ? { resourceStock: incoming.resourceStock } : {}),
    ...(incoming.resourceRequests ? { resourceRequests: incoming.resourceRequests } : {}),
    ...(incoming.incidents ? { incidents: incoming.incidents } : {}),
    ...(incoming.householdCases
      ? { householdCases: incoming.householdCases, households: incoming.householdCases }
      : {}),
    ...(incoming.voiceAlerts ? { voiceAlerts: incoming.voiceAlerts } : {}),
    ...(incoming.sosAlerts ? { sosAlerts: incoming.sosAlerts } : {}),
    ...(incoming.impactComparison ? { impactComparison: incoming.impactComparison } : {}),
    ...(incoming.familySafeCheckIns ? { familySafeCheckIns: incoming.familySafeCheckIns } : {}),
    ...(incoming.drillSummaryReports
      ? { drillSummaryReports: incoming.drillSummaryReports }
      : {}),
    ...(incoming.auditLogs ? { auditLogs: incoming.auditLogs } : {}),
  });
  isApplyingRemoteSnapshot = false;
});

useAppStore.subscribe((state, prevState) => {
  if (isApplyingRemoteSnapshot) return;
  const changed =
    state.isUsingDemoSeedData !== prevState.isUsingDemoSeedData ||
    state.drillModeActive !== prevState.drillModeActive ||
    state.activeAlertZones !== prevState.activeAlertZones ||
    state.reliefCamps !== prevState.reliefCamps ||
    state.shelterOccupancyLogs !== prevState.shelterOccupancyLogs ||
    state.shelterCheckIns !== prevState.shelterCheckIns ||
    state.volunteers !== prevState.volunteers ||
    state.resourceStock !== prevState.resourceStock ||
    state.resourceRequests !== prevState.resourceRequests ||
    state.incidents !== prevState.incidents ||
    state.householdCases !== prevState.householdCases ||
    state.voiceAlerts !== prevState.voiceAlerts ||
    state.sosAlerts !== prevState.sosAlerts ||
    state.impactComparison !== prevState.impactComparison ||
    state.familySafeCheckIns !== prevState.familySafeCheckIns ||
    state.drillSummaryReports !== prevState.drillSummaryReports ||
    state.auditLogs !== prevState.auditLogs;

  if (changed) {
    void saveOperationalSnapshot({
      isUsingDemoSeedData: state.isUsingDemoSeedData,
      drillModeActive: state.drillModeActive,
      drillStartedAt: state.drillStartedAt,
      activeAlertZones: state.activeAlertZones,
      reliefCamps: state.reliefCamps,
      shelterOccupancyLogs: state.shelterOccupancyLogs,
      shelterCheckIns: state.shelterCheckIns,
      volunteers: state.volunteers,
      resourceStock: state.resourceStock,
      resourceRequests: state.resourceRequests,
      incidents: state.incidents,
      householdCases: state.householdCases,
      voiceAlerts: state.voiceAlerts,
      sosAlerts: state.sosAlerts,
      impactComparison: state.impactComparison,
      familySafeCheckIns: state.familySafeCheckIns,
      drillSummaryReports: state.drillSummaryReports,
      auditLogs: state.auditLogs,
    });
  }
});

// Subscribe store to cross-tab / realtime channel events
subscribeRealtimeEvents((event) => {
  const state = useAppStore.getState();
  if (event.type === 'ALERT_ZONE_UPDATED' && event.zone) {
    const incomingZone = event.zone as ActiveAlertZone;
    const exists = state.activeAlertZones.some((z) => z.id === incomingZone.id);
    useAppStore.setState({
      activeAlertZones: exists
        ? state.activeAlertZones.map((z) => (z.id === incomingZone.id ? incomingZone : z))
        : [incomingZone, ...state.activeAlertZones],
    });
  } else if (event.type === 'VOICE_ALERT_CREATED' && event.alert) {
    const incomingAlert = event.alert as VoiceAlertItem;
    const exists = state.voiceAlerts.some((v) => v.id === incomingAlert.id);
    if (!exists) {
      useAppStore.setState({
        voiceAlerts: [incomingAlert, ...state.voiceAlerts],
      });
    }
  } else if (event.type === 'VOICE_ALERT_STATUS_UPDATED') {
    useAppStore.setState({
      voiceAlerts: state.voiceAlerts.map((v) =>
        v.id === event.id
          ? {
              ...v,
              status: event.status as VoiceAlertItem['status'],
              acknowledgedBy: v.acknowledgedBy || event.actor,
            }
          : v
      ),
    });
  } else if (event.type === 'SOS_ALERT_CREATED' && event.alert) {
    const incomingSos = event.alert as EmergencySosItem;
    const exists = state.sosAlerts.some((s) => s.id === incomingSos.id);
    if (!exists) {
      useAppStore.setState({
        sosAlerts: [incomingSos, ...state.sosAlerts],
      });
    }
  } else if (event.type === 'SOS_ALERT_STATUS_UPDATED') {
    useAppStore.setState({
      sosAlerts: state.sosAlerts.map((s) =>
        s.id === event.id
          ? {
              ...s,
              status: event.status as EmergencySosItem['status'],
              acknowledgedBy: s.acknowledgedBy || event.actor,
            }
          : s
      ),
    });
  }
});


