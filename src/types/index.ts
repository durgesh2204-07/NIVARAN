export type UserRole =
  | 'administrator'
  | 'district_officer'
  | 'field_officer'
  | 'response_team'
  | 'citizen'
  | 'sdma'
  | 'villager'
  | 'national_authority'
  | 'department_agency'
  | 'partner_org';

export type OrganisationType =
  | 'national'
  | 'state'
  | 'district'
  | 'response_forces'
  | 'departments'
  | 'partners'
  | 'citizen';

export type OrgRole = 'Administrator' | 'Approver' | 'Operator' | 'Analyst' | 'Viewer';

export type TextSize = '100' | '115' | '130';

export type Language = 'en' | 'hi' | 'mr';

export type HazardType = 'landslide' | 'flood' | 'erosion' | 'cloudburst';

export type RiskLevel = 'Immediate' | 'Short-term' | 'Medium-term' | 'Safe';

export type ImdWarningLevel = 'Green' | 'Yellow' | 'Orange' | 'Red';

export type ClimateHorizon = 'today' | 'plus10' | 'plus20';

export type BasemapType = 'osm' | 'satellite' | 'terrain' | 'dark';

export type BasemapStyle = BasemapType;

export interface UserSession {
  id: string;
  name: string;
  emailOrPhone: string;
  role: UserRole;
  organisation?: OrganisationType | 'ndma' | 'sdma' | 'ddma';
  organisationType?: OrganisationType;
  orgRole?: OrgRole;
  unitName?: string;
  jurisdictionLevel?: 'National' | 'State' | 'District' | 'Block' | 'Village';
  designation: string;
  title?: string;
  district: string;
  state?: string;
  assignedVillageId?: string;
  token?: string;
  isGuest?: boolean;
  lastSignIn?: string;
  activeDevice?: string;
}

export type UserProfile = UserSession;

export interface ScoringMethodVersion {
  version: string;
  timestamp: string;
  author: string;
  reason: string;
  weights: HazardWeights;
  cutoffs: {
    immediate: number;
    shortTerm: number;
    mediumTerm: number;
  };
  diffSummary: string;
}

export interface PartnerAccessRequest {
  id: string;
  organisationName: string;
  organisationType: string;
  contactPerson: string;
  emailOrPhone: string;
  district: string;
  purpose: string;
  documentName: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Declined';
}

export interface SosDispatchRecord {
  id: string;
  referenceNo: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  manualLocationText?: string;
  timestamp: string;
  note?: string;
  queuedOffline: boolean;
  status: 'Dispatched to Control Room' | 'Queued Offline';
}

export interface FloodInundationCell {
  id: string;
  polygon: [number, number][]; // [lng, lat][]
  depthMeters: number;
  riverName: string;
}

export interface FloodSimulationResult {
  waterLevelRiseM: number;
  cells: FloodInundationCell[];
  affectedHabitations: Village[];
  affectedHouseholds: number;
  affectedPopulation: number;
  affectedShelters: ReliefCamp[];
  roadsCutCount: number;
}

export interface ElevationProfilePoint {
  distanceKm: number;
  lat: number;
  lng: number;
  elevationM: number;
  slopePct: number;
  slopeClass: 'Gentle (<10%)' | 'Moderate (10-25%)' | 'Steep (25-45%)' | 'Very Steep (>45%)';
  losLineElevationM: number;
  obstructed: boolean;
}

export interface ElevationProfileSummary {
  points: ElevationProfilePoint[];
  totalDistanceKm: number;
  totalAscentM: number;
  totalDescentM: number;
  maxSlopePct: number;
  avgSlopePct: number;
  hasLineOfSight: boolean;
  obstructionDistanceKm: number | null;
}

export interface HazardWeights {
  rainfall: number;       // default 0.35
  slope: number;          // default 0.30
  history: number;        // default 0.20
  riverProximity: number; // default 0.15
}

export interface HazardFactors {
  rainfall: number;       // normalized 0-1
  slope: number;          // normalized 0-1
  history: number;        // normalized 0-1
  riverProximity: number; // normalized 0-1
}

export interface VulnerabilityFactors {
  elderlyPct: number;       // 0 - 100 (%)
  bplPct: number;           // 0 - 100 (%)
  disabledPct: number;      // 0 - 100 (%)
  healthcareDistKm: number; // 0 - 50 (km)
  kutchaHousePct: number;   // 0 - 100 (%)
  elderlyPlusDisabledPct?: number;
  pregnantPlusUnder5Pct?: number;
}

export interface Village {
  id: string;
  name: string;
  nameHi: string;
  nameMr: string;
  nameLocal?: string;
  state?: string;
  district: 'Raigad' | 'Satara' | 'Pune' | 'Ratnagiri' | 'Kolhapur' | 'Sindhudurg' | 'Thane' | 'Palghar' | 'Nashik';
  taluka: string;
  block?: string;
  lat: number;
  lng: number;
  population: number;
  households: number;
  elevationM: number;
  slopeDeg: number;
  annualRainfallMm: number;
  liveRainfallMm24h?: number;
  riverDistKm: number;
  pastIncidentsCount: number;
  lastIncidentSummary: string;
  historicalEventsSummary?: string;
  primaryHazard: HazardType;
  multiHazards: HazardType[];
  hazardFactors: HazardFactors;
  vulnerabilityFactors: VulnerabilityFactors;
  verifiedReportsCount: number;
  baselineRiskLevel?: RiskLevel;
  methodVersion?: string;
  satelliteChangeDetected?: boolean;
  satelliteNote?: string;
}

export interface RelocationSite {
  id: string;
  name: string;
  nameHi: string;
  nameMr: string;
  district: 'Raigad' | 'Satara' | 'Pune' | 'Ratnagiri' | 'Kolhapur' | 'Sindhudurg' | 'Thane' | 'Palghar' | 'Nashik';
  taluka: string;
  block?: string;
  lat: number;
  lng: number;
  usableAreaHa: number;
  availableLandHa?: number;
  landPerHouseholdHa: number; // default 0.08
  waterReliabilityScore: number; // 0-1
  roadDistKm: number;
  schoolDistKm: number;
  healthcareDistKm: number;
  hazardDistKm: number;
  existingOccupiedHouseholds: number;
  siteHazardFactors: HazardFactors;
  elevationM: number;
  slopeDeg: number;
  landOwnership:
    | 'Government Revenue'
    | 'MIDC Surplus'
    | 'Forest Fringe (De-reserved)'
    | 'Gram Panchayat';
}

export type ShelterType = 'school' | 'community hall' | 'relief camp';

export interface ShelterOccupancyLog {
  id: string;
  campId: string;
  campName: string;
  previousOccupancy: number;
  newOccupancy: number;
  changedBy: string;
  changedAt: string;
}

export interface ReliefCamp {
  id: string;
  name: string;
  shelterType?: ShelterType;
  district: 'Raigad' | 'Satara' | 'Pune' | 'Ratnagiri' | 'Kolhapur' | 'Sindhudurg' | 'Thane' | 'Palghar' | 'Nashik';
  taluka: string;
  block?: string;
  lat: number;
  lng: number;
  elevationM?: number;
  capacityPersons: number;
  currentOccupancy: number;
  inChargeName: string;
  inchargeName?: string;
  contactPhone: string;
  facilities: {
    drinkingWater: boolean;
    medicalDesk: boolean;
    sanitationToilets: boolean;
    generatorPower: boolean;
    communityKitchen: boolean;
  };
  status: 'Active' | 'Standby' | 'Full';
  lastUpdated?: string;
  occupancyLogs?: ShelterOccupancyLog[];
}

export interface CriticalFacility {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire_station' | 'helipad';
  district: string;
  lat: number;
  lng: number;
  contact: string;
  capacityNote: string;
}

export type IncidentStatus =
  | 'Reported'
  | 'Verified'
  | 'Response Assigned'
  | 'In Progress'
  | 'Resolved';

export interface IncidentItem {
  id: string;
  code: string;
  title: string;
  hazardType: HazardType;
  severity: 'Critical' | 'High' | 'Moderate';
  status: IncidentStatus;
  district: 'Raigad' | 'Satara' | 'Pune' | 'Ratnagiri' | 'Kolhapur' | 'Sindhudurg' | 'Thane' | 'Palghar' | 'Nashik';
  villageId?: string;
  villageName: string;
  lat: number;
  lng: number;
  affectedPopulation: number;
  assignedTeamIds: string[];
  reportedAt: string;
  slaDeadlineMinutes: number;
  slaTargetMinutes?: number;
  description: string;
  timeline: { time: string; actor: string; note: string }[];
}

export interface ResponseTeam {
  id: string;
  code: string;
  name: string;
  unitType: 'NDRF' | 'SDRF' | 'Fire & Rescue' | 'Medical QRT' | 'Aapda Mitra Volunteers';
  type?: string;
  district: string;
  personnelCount: number;
  status: 'Available' | 'Deployed' | 'En Route' | 'Standby';
  assignedIncidentId?: string;
  lat: number;
  lng: number;
  commanderName: string;
  contactPhone: string;
  lastUpdated: string;
}

export interface ResourceStockItem {
  id: string;
  name: string;
  itemName?: string;
  category:
    | 'Rescue Boats'
    | 'Earthmovers (JCB)'
    | 'Relief Tents'
    | 'Food Packets'
    | 'Medical Trauma Kits'
    | 'Satellite Phones'
    | string;
  district: string;
  availableQty: number;
  deployedQty: number;
  minThresholdQty: number;
  unit: string;
  warehouseLocation: string;
  depotLocation?: string;
  custodianPhone?: string;
  lastUpdated?: string;
}

export interface AllocationSlice {
  siteId: string;
  siteName: string;
  allocatedHouseholds: number;
  suitabilityScore: number;
  siteLat?: number;
  siteLng?: number;
}

export interface RankedVillageEntry {
  rank: number;
  village: Village;
  hazardScore: number;
  vulnerabilityScore: number;
  priorityScore: number;
  riskLevel: RiskLevel;
  quadrant: 'Relocate' | 'Engineering fix' | 'Monitor' | 'Low concern';
  allocations: AllocationSlice[];
  unallocatedHouseholds: number;
  primarySiteName: string;
  allocatedSiteName: string;
  allocatedHouseholds: number;
  allocatedSiteLat?: number;
  allocatedSiteLng?: number;
  distanceKm: number;
}

export type InterventionId =
  | 'check_dam'
  | 'retaining_wall'
  | 'afforestation'
  | 'drainage_channel'
  | 'embankment';

export interface InterventionOption {
  id: InterventionId;
  name: string;
  nameHi: string;
  nameMr: string;
  description: string;
  estimatedCostLakhs: number;
  durationMonths: number;
  targetHazards: HazardType[];
  factorDeltas: Partial<HazardFactors>;
  effectivenessNote: string;
}

export type ReportCategory =
  | 'ground_crack'
  | 'water_logging'
  | 'seepage'
  | 'erosion'
  | 'tilting_house'
  | 'other';

export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'info_requested';

export interface CommunityReport {
  id: string;
  villageId: string;
  villageName: string;
  district: string;
  category: ReportCategory;
  description: string;
  reporterName: string;
  reporterPhone: string;
  lat: number;
  lng: number;
  gpsAccuracyMeters?: number;
  timestamp: string;
  photoUrl: string;
  hasVoiceNote?: boolean;
  voiceNoteTranscript?: string;
  status: ReportStatus;
  isOfflinePending?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  officerNote?: string;
}

export type RelocationCaseStatus =
  | 'Identified'
  | 'Approved'
  | 'Compensation Paid'
  | 'Site Allotted'
  | 'Resettled';

export interface LedgerTimelineEvent {
  id: string;
  status: RelocationCaseStatus;
  timestamp: string;
  approver: string;
  approverRole: string;
  note: string;
  prevHash: string;
  currHash: string;
}

export interface HouseholdCase {
  id: string;
  caseCode: string;
  headOfHousehold: string;
  headName?: string;
  aadhaarMasked: string;
  villageId: string;
  villageName: string;
  district: string;
  familySize: number;
  membersCount?: number;
  vulnerableMembersCount: number;
  vulnerableMembers?: number;
  riskLevel: RiskLevel;
  currentRisk?: RiskLevel;
  status: RelocationCaseStatus;
  stage?: 'identified' | 'consented' | 'compensated' | 'in_transit' | 'settled';
  assignedSiteId: string;
  targetSiteId?: string;
  assignedSiteName: string;
  targetSiteName?: string;
  plotNumber?: string;
  compensationSanctionedInr: number;
  compensationDisbursedInr: number;
  isOverdue: boolean;
  daysInCurrentStage: number;
  slaTargetDays?: number;
  lastUpdated?: string;
  timeline: LedgerTimelineEvent[];
}

export interface SensorReading {
  id: string;
  villageId: string;
  villageName: string;
  district: string;
  sensorType: 'rain_gauge' | 'soil_moisture' | 'tilt_sensor' | 'river_level';
  label: string;
  unit: string;
  currentValue: number;
  warningThreshold: number;
  criticalThreshold: number;
  history: { time: string; value: number }[];
  status: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
}

export interface EvacuationStep {
  id: string;
  label: string;
  department: string;
  completed: boolean;
  completedAt?: string;
}

export interface AlertItem {
  id: string;
  villageId: string;
  villageName: string;
  district: string;
  hazardType: HazardType;
  severity: 'critical' | 'high' | 'moderate' | 'advisory';
  urgency?: 'Immediate' | 'Expected' | 'Future';
  certainty?: 'Observed' | 'Likely' | 'Possible';
  title: string;
  message: string;
  messageEn?: string;
  channels?: string[];
  timestamp: string;
  expiresAt?: string;
  acknowledged: boolean;
  sensorTrigger?: string;
  evacuationChecklist: EvacuationStep[];
  deliveryStats?: {
    smsSent: number;
    appPushDelivered: number;
    whatsappBroadcast: number;
    sirensActivated: number;
  };
}

export interface DataSourceStatus {
  id: string;
  agency: string;
  fullName: string;
  dataset: string;
  lastSynced: string;
  status: 'online' | 'syncing' | 'degraded';
  recordsCount: string;
  refreshFreq: string;
}

export interface ExplainScorePayload {
  title: string;
  subtitle: string;
  totalScore: number;
  riskLevel?: RiskLevel;
  scoreType: 'hazard' | 'vulnerability' | 'priority' | 'suitability';
  rank?: number;
  villageName: string;
  entityName?: string;
  district: string;
  factors: {
    name: string;
    rawDisplay: string;
    normalizedValue: number;
    weight: number;
    contribution: number;
    percentageOfScore: number;
    color: string;
  }[];
  contextNotes: string[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  module: string;
  details: string;
}

export interface SavedAoi {
  id: string;
  name: string;
  createdAt: string;
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  affectedVillagesCount: number;
  affectedHouseholds: number;
  vulnerablePopulation?: number;
  sheltersInside: number;
  polygonCoords?: [number, number][];
  coordinates?: [number, number][];
}

export interface LiveWeatherData {
  temperatureC: number;
  windSpeedKmh: number;
  precipitationMm: number;
  rainfall24hMm: number;
  humidityPct: number;
  imdWarningLevel: ImdWarningLevel;
  dailyForecast: {
    date: string;
    rainMm: number;
    precipitationMm?: number;
    maxTempC: number;
  }[];
  forecast7d: {
    date: string;
    rainMm: number;
    precipitationMm: number;
    maxTempC: number;
  }[];
  source: 'open-meteo-live' | 'seeded-baseline';
}

export interface SeismicEvent {
  id: string;
  place: string;
  magnitude: number;
  depthKm: number;
  lat: number;
  lng: number;
  time: string;
}

export type AlertZoneLevel = 'Green' | 'Yellow' | 'Orange' | 'Red';

export type AlertDisasterType =
  | 'flood'
  | 'landslide'
  | 'cyclone'
  | 'earthquake'
  | 'fire'
  | 'other';

export type AlertLifecycleStatus = 'Draft' | 'Issued' | 'Updated' | 'Cancelled' | 'Expired';

export interface AlertZoneVersionEntry {
  version: number;
  updatedAt: string;
  updatedBy: string;
  level: AlertZoneLevel;
  lifecycleStatus: AlertLifecycleStatus;
  note: string;
}

export interface ActiveAlertZone {
  id: string;
  level: AlertZoneLevel;
  disasterType: AlertDisasterType;
  areaName: string;
  district: string;
  issuedBy: string;
  issuedAt: string;
  startsAt?: string;
  expiresAt: string;
  instructions: string;
  messageEn?: string;
  messageHi?: string;
  severity?: 'Minor' | 'Moderate' | 'Severe' | 'Extreme';
  urgency?: 'Immediate' | 'Expected' | 'Future';
  lifecycleStatus?: AlertLifecycleStatus;
  usersReached?: number;
  isDrill?: boolean;
  version?: number;
  versionHistory?: AlertZoneVersionEntry[];
  polygon: [number, number][]; // [lng, lat][]
  centerLat: number;
  centerLng: number;
  rawGeometry?: any;
  color_hex?: string;
  risk_score?: number;
  hazard_score?: number;
  vulnerability_score?: number;
  exposure_score?: number;
  affected_area_sqkm?: number;
  exposed_population?: number;
  category_code?: string;
  category_name?: string;
  contributing_indicators?: string[];
  source_datasets?: string[];
  properties?: Record<string, any>;
}

export type VolunteerSkill = 'medical' | 'rescue' | 'boat' | 'driver' | 'food';

export type VolunteerStatus = 'Available' | 'Busy' | 'Offline';

export type VolunteerTaskStatus = 'Assigned' | 'Accepted' | 'Declined' | 'In progress' | 'Done';

export interface VolunteerTaskItem {
  id: string;
  title: string;
  location: string;
  status: VolunteerTaskStatus;
  assignedBy: string;
  assignedAt: string;
  updatedAt: string;
}

export interface VolunteerMember {
  id: string;
  name: string;
  skills: VolunteerSkill[];
  status: VolunteerStatus;
  lastSeen: string;
  district: string;
  phone: string;
  optedInLocationSharing: boolean;
  lat: number;
  lng: number;
  unitName?: string;
  approvalStatus?: 'Pending Approval' | 'Approved' | 'Rejected';
  availability?: string;
  assignedTask?: VolunteerTaskItem;
}

export interface ShelterCheckInRecord {
  id: string;
  campId: string;
  campName: string;
  personName: string;
  ageGroup: 'Child (0-14)' | 'Adult (15-59)' | 'Elderly (60+)';
  headcount: number;
  specialNeeds: 'None' | 'Medical' | 'Disabled' | 'Pregnant / Lactating' | 'Infant';
  status: 'Checked-In' | 'Checked-Out';
  checkedInAt: string;
  checkedOutAt?: string;
  recordedBy: string;
}

export interface ResourceRequestRecord {
  id: string;
  stockId: string;
  itemName: string;
  district: string;
  quantityRequested: number;
  destination: string;
  requestedBy: string;
  requestedAt: string;
  status: 'Requested' | 'Approved & Dispatched' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
}

export interface FamilySafeCheckIn {
  id: string;
  citizenName: string;
  citizenPhone: string;
  familyContactName: string;
  familyContactPhone: string;
  statusMessage: string;
  lat: number;
  lng: number;
  district: string;
  timestamp: string;
}

export interface DrillSummaryReport {
  id: string;
  startedAt: string;
  endedAt: string;
  startedBy: string;
  alertsIssuedCount: number;
  voiceAlertsSentCount: number;
  sosSentCount: number;
  avgAckSeconds: number;
  summaryNote: string;
}

export type VoiceAlertDeliveryStatus =
  | 'Queued Offline'
  | 'Sending'
  | 'Delivered to control room'
  | 'Received by control room'
  | 'Acknowledged by control room'
  | 'Team Dispatched'
  | 'Resolved'
  | 'Failed';

export type EmergencySosDeliveryStatus =
  | 'Queued Offline'
  | 'Sending'
  | 'Delivered'
  | 'Acknowledged by control room'
  | 'Team Dispatched'
  | 'Resolved'
  | 'Failed';

export interface VoiceAlertAuditEntry {
  time: string;
  actor: string;
  action: string;
}

export interface VoiceAlertItem {
  id: string;
  referenceNo: string;
  audioUrl?: string;
  audioMimeType: string;
  audioSizeBytes: number;
  durationSeconds: number;
  transcriptSummary?: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: string;
  createdAtMs: number;
  receivedAtIst?: string;
  acknowledgedAtMs?: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  dispatchedTeamName?: string;
  userId: string;
  userName: string;
  phone?: string;
  district: string;
  controlRoomTarget: string;
  severity: 'Critical' | 'High' | 'Moderate';
  status: VoiceAlertDeliveryStatus;
  retryCount: number;
  isDrill?: boolean;
  auditTrail: VoiceAlertAuditEntry[];
}

export interface EmergencySosItem {
  id: string;
  referenceNo: string;
  lat: number;
  lng: number;
  accuracyMeters: number;
  timestamp: string;
  createdAtMs: number;
  acknowledgedAtMs?: number;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  dispatchedTeamName?: string;
  userId: string;
  userName: string;
  phone?: string;
  district: string;
  controlRoomTarget: string;
  priority: 'Highest (SOS)';
  status: EmergencySosDeliveryStatus;
  retryCount: number;
  isDrill?: boolean;
  auditTrail: VoiceAlertAuditEntry[];
}

export type ComparisonRating = 'Yes' | 'Partial' | 'No';

export type ImpactCategory =
  | 'Alerting'
  | 'Mapping'
  | 'Resource visibility'
  | 'Planning'
  | 'Transparency'
  | 'Usability';

export interface ImpactComparisonRow {
  id: string;
  parameter: string;
  category: ImpactCategory;
  nivaran: { rating: ComparisonRating; why: string };
  manualProcess: { rating: ComparisonRating; why: string };
  publicAlertSystems: { rating: ComparisonRating; why: string };
  standaloneGis: { rating: ComparisonRating; why: string };
  sourceNote: string;
}

// =====================================================================
// INDIA'S LAST 30 DAYS DISASTER HISTORY TYPES (SECTIONS 1 TO 6)
// =====================================================================

export type DisasterCategoryGroup = 'natural' | 'human_induced';

export type DisasterCategory =
  // Natural disasters
  | 'flood'
  | 'flash_flood'
  | 'urban_flood'
  | 'landslide'
  | 'cloudburst'
  | 'cyclone'
  | 'earthquake'
  | 'tsunami'
  | 'heatwave'
  | 'cold_wave'
  | 'lightning'
  | 'thunderstorm'
  | 'drought'
  | 'forest_fire'
  | 'avalanche'
  | 'heavy_rainfall'
  | 'coastal_erosion'
  // Human-induced disasters
  | 'industrial_accident'
  | 'chemical_gas_leak'
  | 'major_fire'
  | 'building_collapse'
  | 'dam_failure'
  | 'major_transport_accident'
  | 'emergency_other';

export type DisasterSeverity = 'Critical' | 'Severe' | 'Moderate' | 'Minor';

export type IncidentOperationalStatus =
  | 'Active'
  | 'Rescue in Progress'
  | 'Contained'
  | 'Relief Operations'
  | 'Resolved';

export interface DistrictCasualtyBreakdown {
  district: string;
  deaths: number | null;
  injured: number | null;
  missing: number | null;
}

export interface NewsSourceCitation {
  sourceName: string;
  headline: string;
  url?: string;
  timestamp?: string;
}

export interface IncidentPhotograph {
  caption: string;
  url?: string;
  credit?: string;
}

export interface NationalDisasterIncident {
  id: string;
  title: string;
  category: DisasterCategory;
  categoryGroup: DisasterCategoryGroup;
  categoryLabel: string;
  incidentDate: string;
  incidentTime?: string;
  incidentEndTime?: string;
  state: string;
  district: string;
  locality?: string;
  lat?: number | null;
  lng?: number | null;
  coordinatesVerified: boolean;
  severity: DisasterSeverity;
  status: IncidentOperationalStatus;
  shortDescription: string;
  dataSource: string;
  lastUpdated: string;

  // Section B: Human Impact
  humanImpact: {
    deathsConfirmed: number | null;
    deathsProvisional: number | null;
    injuredConfirmed: number | null;
    injuredProvisional: number | null;
    missing: number | null;
    rescued: number | null;
    evacuated: number | null;
    peopleAffected: number | null;
    familiesAffected: number | null;
    displaced: number | null;
    districtCasualtiesBreakdown?: DistrictCasualtyBreakdown[];
    historicalRevisionNote?: string;
  };

  // Section C: What Actually Happened?
  chronology: {
    whatHappened: string;
    howItBegan: string;
    reportedCauses: string[];
    affectedAreas: string[];
    scaleOfIncident: string;
    reportedDamageOverview: string;
    immediateConsequences: string[];
    responseOperationsOverview: string;
    currentSituation: string;
  };

  // Section D: Damage Assessment
  damageAssessment?: {
    housesDamaged?: number | string | null;
    buildingsCollapsed?: number | string | null;
    roadsDamagedKm?: number | string | null;
    bridgesDamaged?: number | string | null;
    agriculturalLandHa?: number | string | null;
    electricityDisruption?: string | null;
    waterSupplyDisruption?: string | null;
    infrastructureDamageSummary?: string | null;
    estimatedLossInrCrores?: number | string | null;
  };

  // Section E: Government and Emergency Response
  emergencyResponse?: {
    ndrfDeployed: boolean;
    ndrfBattalionDetails?: string;
    sdrfDeployed: boolean;
    sdrfDetails?: string;
    policeFireDeployed: boolean;
    districtAdminResponse: string;
    medicalAssistance: string;
    reliefCampsCount?: number | null;
    reliefCampInmates?: number | null;
    exGratiaAnnouncements?: string;
    currentResponseStatus: string;
  };

  // Section F: Evidence and Sources
  evidenceSources?: {
    officialSitrepUrl?: string;
    officialReportName?: string;
    pressReleaseTitle?: string;
    newsSources?: NewsSourceCitation[];
    photographs?: IncidentPhotograph[];
    satelliteAnalysis?: string;
    sourceAgency: string;
    publishedTimestamp: string;
  };
}


