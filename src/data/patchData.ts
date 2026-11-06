import {
  ActiveAlertZone,
  EmergencySosItem,
  ImpactComparisonRow,
  VoiceAlertItem,
  VolunteerMember,
} from '../types';

/**
 * Time-bound Active Disaster Alert Zones (Green / Orange / Red) per Section 2.
 * Separate from static hazard risk zones used in long-term relocation Planning.
 */
export const INITIAL_ACTIVE_ALERT_ZONES: ActiveAlertZone[] = [
  {
    id: 'az-01',
    level: 'Red',
    disasterType: 'landslide',
    areaName: 'Irshalwadi, Khalapur & Morbe Escarpment Catchment',
    district: 'Raigad',
    issuedBy: 'DDMA Raigad Collectorate Control Room (GSI + IMD Alert)',
    issuedAt: '2026-10-12 13:15 IST',
    expiresAt: '2026-10-13 06:00 IST',
    instructions:
      'RED ALERT (Take Action / Evacuate): 24h rainfall crossed 212 mm with 12 cm slope tension crack. Evacuate immediately to Khalapur-Chowk Relief Camp.',
    centerLat: 18.9265,
    centerLng: 73.2361,
    polygon: [
      [73.192, 18.912],
      [73.218, 18.886],
      [73.262, 18.894],
      [73.284, 18.925],
      [73.266, 18.958],
      [73.224, 18.962],
      [73.198, 18.941],
      [73.192, 18.912],
    ],
  },
  {
    id: 'az-02',
    level: 'Red',
    disasterType: 'flood',
    areaName: 'Savitri River & Taliye-Mahad Inundation Basin',
    district: 'Raigad',
    issuedBy: 'Maharashtra SDMA SEOC & CWC Flood Forecast',
    issuedAt: '2026-10-12 12:40 IST',
    expiresAt: '2026-10-13 09:00 IST',
    instructions:
      'RED ALERT (Danger / Evacuate): Savitri & Kal rivers 0.8m above Danger Mark at Mahad bridge. Shift all low-lying riverbank & scarp-toe households to ZP School Shelters.',
    centerLat: 18.1182,
    centerLng: 73.4714,
    polygon: [
      [73.395, 18.082],
      [73.438, 18.055],
      [73.495, 18.062],
      [73.538, 18.105],
      [73.526, 18.158],
      [73.468, 18.174],
      [73.412, 18.145],
      [73.395, 18.082],
    ],
  },
  {
    id: 'az-03',
    level: 'Orange',
    disasterType: 'landslide',
    areaName: 'Ambenali Ghat, Mahabaleshwar & Koyna Upper Slope Belt',
    district: 'Satara',
    issuedBy: 'DDMA Satara Control Room & IMD Pune',
    issuedAt: '2026-10-12 11:30 IST',
    expiresAt: '2026-10-13 12:00 IST',
    instructions:
      'ORANGE ALERT (Warning / Be Prepared): Very heavy ghat rainfall (168 mm/24h). Keep 72h Go-Bag ready; heavy vehicle movement restricted on Ambenali Ghat.',
    centerLat: 17.912,
    centerLng: 73.635,
    polygon: [
      [73.565, 17.875],
      [73.612, 17.848],
      [73.682, 17.858],
      [73.715, 17.912],
      [73.694, 17.968],
      [73.628, 17.975],
      [73.578, 17.938],
      [73.565, 17.875],
    ],
  },
  {
    id: 'az-04',
    level: 'Orange',
    disasterType: 'flood',
    areaName: 'Vashishti Estuary & Chiplun Floodplain Corridor',
    district: 'Ratnagiri',
    issuedBy: 'DDMA Ratnagiri Control Room & WRD',
    issuedAt: '2026-10-12 10:45 IST',
    expiresAt: '2026-10-13 08:00 IST',
    instructions:
      'ORANGE ALERT (Warning / Be Prepared): High tide coincides with Koyna tailrace release at 19:30 IST. SDRF rescue boats pre-positioned at Chiplun & Khed.',
    centerLat: 17.5323,
    centerLng: 73.5178,
    polygon: [
      [73.452, 17.502],
      [73.495, 17.478],
      [73.558, 17.486],
      [73.584, 17.532],
      [73.562, 17.578],
      [73.498, 17.584],
      [73.458, 17.548],
      [73.452, 17.502],
    ],
  },
  {
    id: 'az-05',
    level: 'Yellow',
    disasterType: 'flood',
    areaName: 'Lonavala-Maval-Mulshi & Tamhini Ghat Watch Sector',
    district: 'Pune',
    issuedBy: 'DDMA Pune Control Room & IMD Mausam',
    issuedAt: '2026-10-12 10:15 IST',
    expiresAt: '2026-10-13 14:00 IST',
    instructions:
      'YELLOW ALERT (Watch / Be Updated): Heavy intermittent rain (88 mm/24h) & Damini lightning watch. Avoid low-lying Indrayani & Pauna causeways.',
    centerLat: 18.625,
    centerLng: 73.515,
    polygon: [
      [73.395, 18.545],
      [73.465, 18.485],
      [73.585, 18.512],
      [73.645, 18.615],
      [73.612, 18.735],
      [73.495, 18.755],
      [73.405, 18.675],
      [73.395, 18.545],
    ],
  },
  {
    id: 'az-06',
    level: 'Yellow',
    disasterType: 'landslide',
    areaName: 'Ambegaon - Malin & Dimbhe Dam Sub-Basin',
    district: 'Pune',
    issuedBy: 'DDMA Pune Control Room',
    issuedAt: '2026-10-12 09:30 IST',
    expiresAt: '2026-10-13 18:00 IST',
    instructions:
      'YELLOW ALERT (Watch / Be Updated): Moderate-heavy rain (74 mm/24h) across Ghod river catchment. Talathi & GSI slope spotters on watch.',
    centerLat: 19.1588,
    centerLng: 73.6881,
    polygon: [
      [73.615, 19.118],
      [73.665, 19.095],
      [73.735, 19.108],
      [73.758, 19.162],
      [73.728, 19.212],
      [73.655, 19.215],
      [73.618, 19.172],
      [73.615, 19.118],
    ],
  },
  {
    id: 'az-07',
    level: 'Green',
    disasterType: 'other',
    areaName: 'Pimpri-Chinchwad, Akurdi & Pune Urban Plateau',
    district: 'Pune',
    issuedBy: 'PCMC / DDMA Pune Emergency Control',
    issuedAt: '2026-10-12 09:00 IST',
    expiresAt: '2026-10-13 18:00 IST',
    instructions:
      'GREEN (No Warning / Safe): Normal urban weather (<18 mm/24h). All transit corridors, metro, and relief staging centers operating normally.',
    centerLat: 18.6298,
    centerLng: 73.7997,
    polygon: [
      [73.715, 18.565],
      [73.785, 18.535],
      [73.868, 18.555],
      [73.885, 18.635],
      [73.845, 18.695],
      [73.755, 18.698],
      [73.718, 18.638],
      [73.715, 18.565],
    ],
  },
  {
    id: 'az-08',
    level: 'Green',
    disasterType: 'flood',
    areaName: 'Panchganga Basin Monitor Zone (Shirol - Karveer)',
    district: 'Kolhapur',
    issuedBy: 'DDMA Kolhapur Control Room',
    issuedAt: '2026-10-12 08:30 IST',
    expiresAt: '2026-10-13 18:00 IST',
    instructions:
      'GREEN (Watch / Safe): River level 2.4 m below warning threshold at Rajaram Weir. Routine CWC telemetry active.',
    centerLat: 16.705,
    centerLng: 74.2433,
    polygon: [
      [74.165, 16.668],
      [74.225, 16.645],
      [74.298, 16.658],
      [74.325, 16.715],
      [74.295, 16.768],
      [74.215, 16.772],
      [74.172, 16.725],
      [74.165, 16.668],
    ],
  },
];

/**
 * Registered Aapda Mitra & Civil Defence Volunteers per Section 3.
 * Live GPS coordinates are only displayed to authorised officers AND only when optedInLocationSharing is true.
 */
export const INITIAL_VOLUNTEERS: VolunteerMember[] = [
  {
    id: 'vol-01',
    name: 'Santosh More',
    skills: ['rescue', 'medical'],
    status: 'Available',
    lastSeen: '2 mins ago',
    district: 'Raigad',
    phone: '+91-9822014411',
    optedInLocationSharing: true,
    lat: 18.9185,
    lng: 73.2412,
    unitName: 'Aapda Mitra Khalapur Batch IV',
  },
  {
    id: 'vol-02',
    name: 'Dr. Priya Kulkarni',
    skills: ['medical', 'food'],
    status: 'Available',
    lastSeen: '4 mins ago',
    district: 'Raigad',
    phone: '+91-9822014422',
    optedInLocationSharing: true,
    lat: 18.8895,
    lng: 73.2855,
    unitName: 'Indian Red Cross Medical First Responder',
  },
  {
    id: 'vol-03',
    name: 'Mahesh Tandale',
    skills: ['boat', 'rescue'],
    status: 'Busy',
    lastSeen: '1 min ago',
    district: 'Raigad',
    phone: '+91-9822014433',
    optedInLocationSharing: true,
    lat: 18.084,
    lng: 73.422,
    unitName: 'Mahad Flood Boat Rescue Squad',
  },
  {
    id: 'vol-04',
    name: 'Vikram Jadhav',
    skills: ['driver', 'rescue'],
    status: 'Available',
    lastSeen: '6 mins ago',
    district: 'Satara',
    phone: '+91-9822014444',
    optedInLocationSharing: true,
    lat: 17.921,
    lng: 73.658,
    unitName: 'Mahabaleshwar Trekker & Rope Rescue',
  },
  {
    id: 'vol-05',
    name: 'Sunita Shinde',
    skills: ['food', 'medical'],
    status: 'Available',
    lastSeen: '9 mins ago',
    district: 'Pune',
    phone: '+91-9822014455',
    optedInLocationSharing: true,
    lat: 19.142,
    lng: 73.695,
    unitName: 'Ambegaon SHG Community Kitchen Lead',
  },
  {
    id: 'vol-06',
    name: 'Rohan Surve',
    skills: ['boat', 'driver'],
    status: 'Available',
    lastSeen: '5 mins ago',
    district: 'Ratnagiri',
    phone: '+91-9822014466',
    optedInLocationSharing: true,
    lat: 17.529,
    lng: 73.524,
    unitName: 'Chiplun Civil Defence Swimmer',
  },
  {
    id: 'vol-07',
    name: 'Kiran Patil',
    skills: ['medical'],
    status: 'Offline',
    lastSeen: '42 mins ago',
    district: 'Kolhapur',
    phone: '+91-9822014477',
    optedInLocationSharing: false, // Opted out of live GPS sharing
    lat: 16.712,
    lng: 74.248,
    unitName: 'Shirol Paramedic Volunteer',
  },
  {
    id: 'vol-08',
    name: 'Amol Gawde',
    skills: ['rescue', 'driver', 'food'],
    status: 'Available',
    lastSeen: '3 mins ago',
    district: 'Sindhudurg',
    phone: '+91-9822014488',
    optedInLocationSharing: true,
    lat: 15.995,
    lng: 73.682,
    unitName: 'Kudal Aapda Mitra Team',
  },
];

/**
 * Seeded Voice Alerts for Control Room Inbox & Delivery Tracking per Section 5.
 */
const nowMs = Date.now();
export const INITIAL_VOICE_ALERTS: VoiceAlertItem[] = [
  {
    id: 'va-101',
    referenceNo: 'VA-2026-8841',
    audioMimeType: 'audio/webm',
    audioSizeBytes: 184320,
    durationSeconds: 14,
    transcriptSummary:
      'Water level rising rapidly near Irshalwadi lower footbridge, 6 elderly residents need immediate transport to Chowk school shelter.',
    lat: 18.9248,
    lng: 73.2345,
    accuracyMeters: 14.2,
    timestamp: '14:18 IST',
    createdAtMs: nowMs - 14 * 60 * 1000,
    userId: 'usr-cit-01',
    userName: 'Ramesh Pardhi (Irshalwadi)',
    phone: '+91-9876543210',
    district: 'Raigad',
    controlRoomTarget: 'Raigad District Control Room (DDMA Alibag)',
    severity: 'Critical',
    status: 'Delivered to control room',
    retryCount: 0,
    auditTrail: [
      {
        time: '14:18 IST',
        actor: 'Ramesh Pardhi (Citizen)',
        action: 'Recorded 14s Voice Alert with GPS (+/- 14.2 m).',
      },
      {
        time: '14:18 IST',
        actor: 'Nivaran Gateway',
        action: 'Delivered to Raigad District Control Room inbox.',
      },
    ],
  },
  {
    id: 'va-102',
    referenceNo: 'VA-2026-8839',
    audioMimeType: 'audio/webm',
    audioSizeBytes: 215040,
    durationSeconds: 19,
    transcriptSummary:
      'Mudslide debris blocking approach culvert at Taliye Kondalkar Wadi. 12 families waiting at Panchayat ground.',
    lat: 18.1165,
    lng: 73.4692,
    accuracyMeters: 18.5,
    timestamp: '13:52 IST',
    createdAtMs: nowMs - 40 * 60 * 1000,
    acknowledgedAtMs: nowMs - 37 * 60 * 1000,
    acknowledgedBy: 'Dr. M. Kulkarni, IAS (DDMA Raigad)',
    acknowledgedAt: '13:55 IST',
    dispatchedTeamName: 'NDRF 5th Bn Team Alpha',
    userId: 'usr-cit-09',
    userName: 'Ganesh Kondalkar (Police Patil)',
    phone: '+91-9422091122',
    district: 'Raigad',
    controlRoomTarget: 'Raigad District Control Room (DDMA Alibag)',
    severity: 'Critical',
    status: 'Acknowledged by control room',
    retryCount: 0,
    auditTrail: [
      {
        time: '13:52 IST',
        actor: 'Ganesh Kondalkar',
        action: 'Recorded 19s Voice Alert with GPS (+/- 18.5 m).',
      },
      {
        time: '13:52 IST',
        actor: 'Nivaran Gateway',
        action: 'Delivered to Raigad District Control Room.',
      },
      {
        time: '13:55 IST',
        actor: 'Dr. M. Kulkarni, IAS',
        action: 'Acknowledged by control room and assigned NDRF 5th Bn Team Alpha.',
      },
    ],
  },
  {
    id: 'va-103',
    referenceNo: 'VA-2026-8834',
    audioMimeType: 'audio/webm',
    audioSizeBytes: 142000,
    durationSeconds: 11,
    transcriptSummary:
      'Retaining wall seepage observed along Ambenali Ghat hairpin bend 4. Requesting PWD & Tahsildar inspection.',
    lat: 17.9142,
    lng: 73.6388,
    accuracyMeters: 24.0,
    timestamp: '13:10 IST',
    createdAtMs: nowMs - 82 * 60 * 1000,
    acknowledgedAtMs: nowMs - 78 * 60 * 1000,
    acknowledgedBy: 'Satara DEOC Duty Officer',
    acknowledgedAt: '13:14 IST',
    userId: 'usr-dept-01',
    userName: 'S. K. Kadam (Field Officer)',
    phone: '+91-9423018800',
    district: 'Satara',
    controlRoomTarget: 'Satara District Control Room',
    severity: 'High',
    status: 'Resolved',
    retryCount: 0,
    auditTrail: [
      {
        time: '13:10 IST',
        actor: 'S. K. Kadam',
        action: 'Recorded 11s Voice Alert with GPS (+/- 24.0 m).',
      },
      {
        time: '13:14 IST',
        actor: 'Satara DEOC Duty Officer',
        action: 'Acknowledged by control room.',
      },
      {
        time: '13:45 IST',
        actor: 'Satara DEOC Duty Officer',
        action: 'Marked resolved after PWD barrier placement.',
      },
    ],
  },
];

/**
 * Seeded Emergency SOS Distress Signals for Control Room SOS Inbox per Section B.
 * Higher priority than Voice Alerts; one-gesture GPS + timestamp + caller ID.
 */
export const INITIAL_SOS_ALERTS: EmergencySosItem[] = [
  {
    id: 'sos-201',
    referenceNo: 'SOS-2026-9914',
    lat: 18.9261,
    lng: 73.2358,
    accuracyMeters: 11.4,
    timestamp: '14:24 IST',
    createdAtMs: nowMs - 8 * 60 * 1000,
    userId: 'usr-cit-01',
    userName: 'Ramesh Pardhi',
    phone: '+91-9876543210',
    district: 'Raigad',
    controlRoomTarget: 'Raigad District Control Room (DDMA Alibag)',
    priority: 'Highest (SOS)',
    status: 'Delivered',
    retryCount: 0,
    auditTrail: [
      {
        time: '14:24 IST',
        actor: 'Ramesh Pardhi (usr-cit-01)',
        action: 'Confirmed 2-second Emergency SOS hold with GPS (+/- 11.4 m).',
      },
      {
        time: '14:24 IST',
        actor: 'Nivaran Gateway',
        action: 'Delivered HIGHEST PRIORITY SOS distress signal to Raigad District Control Room.',
      },
    ],
  },
  {
    id: 'sos-202',
    referenceNo: 'SOS-2026-9908',
    lat: 18.1179,
    lng: 73.4708,
    accuracyMeters: 15.8,
    timestamp: '14:02 IST',
    createdAtMs: nowMs - 30 * 60 * 1000,
    acknowledgedAtMs: nowMs - 28 * 60 * 1000,
    acknowledgedBy: 'Dr. M. Kulkarni, IAS (DDMA Raigad)',
    acknowledgedAt: '14:04 IST',
    dispatchedTeamName: 'NDRF 5th Bn Flood Rescue Squad',
    userId: 'anon-cit-4412',
    userName: 'Citizen SOS (Taliye-Mahad)',
    phone: '+91-9421883310',
    district: 'Raigad',
    controlRoomTarget: 'Raigad District Control Room (DDMA Alibag)',
    priority: 'Highest (SOS)',
    status: 'Acknowledged by control room',
    retryCount: 0,
    auditTrail: [
      {
        time: '14:02 IST',
        actor: 'Citizen SOS (anon-cit-4412)',
        action: 'Confirmed 2-second Emergency SOS hold with GPS (+/- 15.8 m).',
      },
      {
        time: '14:02 IST',
        actor: 'Nivaran Gateway',
        action: 'Delivered to Raigad District Control Room.',
      },
      {
        time: '14:04 IST',
        actor: 'Dr. M. Kulkarni, IAS (DDMA Raigad)',
        action: 'Acknowledged by control room and dispatched NDRF 5th Bn Flood Rescue Squad.',
      },
    ],
  },
];

/**
 * 14-Parameter Capability Comparison Matrix per Section 7 (Impact Tab).
 * Qualitative comparison based on documented system capabilities.
 * Yes = 2, Partial = 1, No = 0.
 */
export const INITIAL_IMPACT_COMPARISON: ImpactComparisonRow[] = [
  {
    id: 'imp-01',
    parameter: 'Citizen-to-control-room alert channel with location',
    category: 'Alerting',
    nivaran: {
      rating: 'Yes',
      why: '1-tap 30s Voice Alert packages audio, best GPS reading & accuracy radius directly to nearest District Control Room.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'Relies on voice phone calls or unverified WhatsApp forwards without structured GPS coordinates.',
    },
    publicAlertSystems: {
      rating: 'No',
      why: 'One-way broadcast channel (authority to public); no citizen-to-control-room voice + GPS reporting.',
    },
    standaloneGis: {
      rating: 'No',
      why: 'Reference map viewers do not provide emergency citizen-to-control-room communication channels.',
    },
    sourceNote: 'NDMA Emergency Operations Centre SOP & Nivaran Section 5 specification',
  },
  {
    id: 'imp-02',
    parameter: 'Alert delivery tracking and acknowledgement',
    category: 'Alerting',
    nivaran: {
      rating: 'Yes',
      why: 'Sender sees live state (Sending → Delivered → Acknowledged with officer name & time) with offline retry.',
    },
    manualProcess: {
      rating: 'No',
      why: 'Callers have no live status tracking once a phone call ends or a paper register entry is made.',
    },
    publicAlertSystems: {
      rating: 'Partial',
      why: 'Tracks telecom cell-broadcast dispatch counts, but does not track individual citizen distress acknowledgements.',
    },
    standaloneGis: {
      rating: 'No',
      why: 'No alerting or delivery state machine exists in standalone thematic GIS portals.',
    },
    sourceNote: 'CAP v1.2 ITU-T X.1303 standard vs bilateral acknowledgement workflow',
  },
  {
    id: 'imp-03',
    parameter: 'Location accuracy handling',
    category: 'Mapping',
    nivaran: {
      rating: 'Yes',
      why: '15s continuous watchPosition selects lowest-error reading, filters >100m spikes, smooths jitter & allows manual pin.',
    },
    manualProcess: {
      rating: 'No',
      why: 'Verbal landmarks over phone calls are ambiguous during night-time or heavy monsoon conditions.',
    },
    publicAlertSystems: {
      rating: 'Partial',
      why: 'Uses coarse telecom cell-tower polygons or district/taluka boundaries rather than meter-level GPS filtering.',
    },
    standaloneGis: {
      rating: 'Partial',
      why: 'Uses browser single-shot getCurrentPosition without 15s accuracy windowing or error-radius classification.',
    },
    sourceNote: 'W3C Geolocation API High-Accuracy Field Telemetry Guidelines',
  },
  {
    id: 'imp-04',
    parameter: 'Live Red/Orange/Green alert zones on a map',
    category: 'Mapping',
    nivaran: {
      rating: 'Yes',
      why: 'Time-bound Red/Orange/Green active disaster polygons with mandatory authority confirmation & realtime sync.',
    },
    manualProcess: {
      rating: 'No',
      why: 'Issued as PDF circulars or text orders without live interactive polygon boundaries.',
    },
    publicAlertSystems: {
      rating: 'Yes',
      why: 'CAP feeds publish colour-coded district and sub-division warning polygons.',
    },
    standaloneGis: {
      rating: 'Partial',
      why: 'Displays static historical hazard layers, not time-bound operational evacuation alert zones.',
    },
    sourceNote: 'IMD / NDMA Colour-Coded Early Warning Protocol',
  },
  {
    id: 'imp-05',
    parameter: 'Volunteer visibility',
    category: 'Resource visibility',
    nivaran: {
      rating: 'Yes',
      why: 'Shows live Aapda Mitra volunteers by skill (medical, rescue, boat, driver, food) with strict opt-in privacy.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'Static phone directories in taluka files; no live availability or opt-in map position.',
    },
    publicAlertSystems: {
      rating: 'No',
      why: 'Public warning portals do not track field responder or volunteer rosters.',
    },
    standaloneGis: {
      rating: 'No',
      why: 'Thematic portals map physical terrain and infrastructure, not live field volunteers.',
    },
    sourceNote: 'NDMA Aapda Mitra Scheme Operational Guidelines',
  },
  {
    id: 'imp-06',
    parameter: 'Shelter availability visibility',
    category: 'Resource visibility',
    nivaran: {
      rating: 'Yes',
      why: 'Shows live capacity, free beds, water/food/power/medical status, nearest 3 shelters & OSRM road directions.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'Occupancy tallied manually on chalkboards or spreadsheets updated once or twice daily.',
    },
    publicAlertSystems: {
      rating: 'Partial',
      why: 'Lists static relief camp addresses without live bed occupancy or road routing.',
    },
    standaloneGis: {
      rating: 'Partial',
      why: 'Maps school/building footprints statically without real-time occupancy or manager audit logs.',
    },
    sourceNote: 'Minimum Standards of Relief in Camp Management (NDMA)',
  },
  {
    id: 'imp-07',
    parameter: 'Hazard and vulnerability risk mapping',
    category: 'Planning',
    nivaran: {
      rating: 'Yes',
      why: 'Combines rainfall, slope, past events & river proximity with household socio-economic vulnerability.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'Maintained in separate departmental tables (GSI landslide lists, Revenue census registers).',
    },
    publicAlertSystems: {
      rating: 'Partial',
      why: 'Focuses on immediate meteorological triggers rather than composite household vulnerability.',
    },
    standaloneGis: {
      rating: 'Yes',
      why: 'Provides rich multi-layered geomorphological, hydrological and hazard atlas layers.',
    },
    sourceNote: 'GSI National Landslide Susceptibility Mapping & Census SECC indicators',
  },
  {
    id: 'imp-08',
    parameter: 'Site suitability and capacity-based relocation planning',
    category: 'Planning',
    nivaran: {
      rating: 'Yes',
      why: 'Evaluates candidate revenue sites by safe elevation, slope, water reliability & household plot capacity.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'Conducted through ad-hoc site visits after a disaster occurs.',
    },
    publicAlertSystems: {
      rating: 'No',
      why: 'Designed for short-term warning dissemination, not permanent habitation relocation planning.',
    },
    standaloneGis: {
      rating: 'Partial',
      why: 'Shows land-use layers but lacks household capacity calculators and plot-per-family constraints.',
    },
    sourceNote: 'National Policy on Rehabilitation and Resettlement',
  },
  {
    id: 'imp-09',
    parameter: 'Optimised allocation of people to shelters (OR-Tools)',
    category: 'Planning',
    nivaran: {
      rating: 'Yes',
      why: 'Capacity-constrained solver matches high-priority habitations to nearest suitable sites without overflow.',
    },
    manualProcess: {
      rating: 'No',
      why: 'Manual assignment frequently leads to overcrowding at the nearest camp while nearby camps remain empty.',
    },
    publicAlertSystems: {
      rating: 'No',
      why: 'No mathematical capacity-matching or evacuation routing solver.',
    },
    standaloneGis: {
      rating: 'No',
      why: 'Visualises buffers and distances but does not run constrained capacity-allocation solvers.',
    },
    sourceNote: 'Constrained Minimum-Cost Evacuation & Relocation Allocation Model',
  },
  {
    id: 'imp-10',
    parameter: 'Explainability of scores',
    category: 'Transparency',
    nivaran: {
      rating: 'Yes',
      why: 'Every risk, vulnerability & suitability number opens a deterministic factor-by-factor breakdown modal.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'Committee notes record conclusions, but factor weights are rarely standardised across blocks.',
    },
    publicAlertSystems: {
      rating: 'Partial',
      why: 'Displays IMD threshold category, without village-level composite score decomposition.',
    },
    standaloneGis: {
      rating: 'Partial',
      why: 'Renders raster/vector classes, but rarely exposes interactive weight-contribution breakdowns per village.',
    },
    sourceNote: 'Nivaran Section 6.1 Method Integrity & Deterministic Explainability Standard',
  },
  {
    id: 'imp-11',
    parameter: 'What-if scenarios',
    category: 'Planning',
    nivaran: {
      rating: 'Yes',
      why: 'Interactive rainfall surge (+0 to +300 mm), water-level rise & civil engineering intervention simulator.',
    },
    manualProcess: {
      rating: 'No',
      why: 'Static paper disaster management plans cannot recalculate village risk rankings dynamically.',
    },
    publicAlertSystems: {
      rating: 'No',
      why: 'Broadcasts current forecast advisories without interactive policy/engineering simulation.',
    },
    standaloneGis: {
      rating: 'Partial',
      why: 'Supports static return-period flood rasters (10-yr/50-yr) but not interactive intervention cost-benefit.',
    },
    sourceNote: 'NDMA Guidelines on Landslide & Flood Mitigation',
  },
  {
    id: 'imp-12',
    parameter: 'Offline / low-network support',
    category: 'Usability',
    nivaran: {
      rating: 'Yes',
      why: 'IndexedDB offline queue with 72h expiry and automatic background retry for Voice Alerts & field reports.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'Paper works offline, but cannot sync or alert the district control room until physically delivered.',
    },
    publicAlertSystems: {
      rating: 'Partial',
      why: 'SMS cell broadcast works on 2G, but web/app portals fail to submit citizen feedback when offline.',
    },
    standaloneGis: {
      rating: 'No',
      why: 'Heavy WMS/WFS map portals fail to load or submit data when cellular connectivity drops in ghats.',
    },
    sourceNote: 'Field Operations Resilience Standard (IndexedDB + Backoff Sync)',
  },
  {
    id: 'imp-13',
    parameter: 'Role-based access and audit trail',
    category: 'Transparency',
    nivaran: {
      rating: 'Yes',
      why: 'Strict RBAC across National/State/District/Field/Citizen roles with immutable audit log for every action.',
    },
    manualProcess: {
      rating: 'Partial',
      why: 'File signatures exist on paper orders, but WhatsApp instructions lack unified tamper-evident audit logs.',
    },
    publicAlertSystems: {
      rating: 'Yes',
      why: 'Authorised nodal officers sign and publish CAP advisories with full agency attribution.',
    },
    standaloneGis: {
      rating: 'Partial',
      why: 'Department logins exist, but shelter occupancy & voice dispatch audit trails are not applicable.',
    },
    sourceNote: 'Digital Personal Data Protection (DPDP) Act 2023 & E-Governance Audit Norms',
  },
  {
    id: 'imp-14',
    parameter: 'Ease of use (taps to complete a key task)',
    category: 'Usability',
    nivaran: {
      rating: 'Yes',
      why: 'Simplified 6-tab interface; any primary action (Voice Alert, Locate Me, Issue Zone Alert) takes <= 2 taps.',
    },
    manualProcess: {
      rating: 'No',
      why: 'Requires cross-referencing multiple registers, phone calls and manual map sheets.',
    },
    publicAlertSystems: {
      rating: 'Yes',
      why: 'Simple public alert feed for citizens, though lacks integrated shelter/planning tools.',
    },
    standaloneGis: {
      rating: 'No',
      why: 'Complex multi-nested GIS layer trees (20+ checkboxes) require specialist GIS training.',
    },
    sourceNote: 'Target - to be validated in a pilot (<= 2 taps for core emergency actions)',
  },
];
