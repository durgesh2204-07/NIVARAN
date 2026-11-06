import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Award,
  BookOpen,
  Building2,
  Calculator,
  CheckCircle2,
  CloudRain,
  Compass,
  ExternalLink,
  FileText,
  Flame,
  Landmark,
  Layers,
  Package,
  PhoneCall,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ThermometerSun,
  Truck,
  Users,
  Waves,
  Wind,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { HazardType } from '../types';

export type NdmaHubTabId =
  | 'sachet_cap'
  | 'hazards_atlas'
  | 'telemetry'
  | 'idrn_ndrf'
  | 'aapda_mitra'
  | 'ndmp_relief'
  | 'portals_kit';

interface HazardProfile {
  id: string;
  name: string;
  nameHi: string;
  category: 'Natural Hazard' | 'Man-Made / CBRN Hazard';
  nodalAgency: string;
  nodalMinistry: string;
  zoneClassification: string;
  earlyWarningTrigger: string;
  badgeColor: string;
  mitigationGuidelines: string[];
  before: string[];
  during: string[];
  after: string[];
  donts: string[];
}

const NDMA_HAZARD_ENCYCLOPEDIA: HazardProfile[] = [
  {
    id: 'landslide',
    name: 'Landslide, Mudflow & Slope Failure',
    nameHi: 'भूस्खलन और ढलान सुरक्षा (Landslide)',
    category: 'Natural Hazard',
    nodalAgency: 'Geological Survey of India (GSI) & NDMA',
    nodalMinistry: 'Ministry of Mines & Ministry of Home Affairs',
    zoneClassification: 'High / Severe Macro & Meso Susceptibility Zone (Western Ghats & Himalayas — NLSM)',
    earlyWarningTrigger: 'Rainfall > 150 mm/24h or > 180 mm/6h + Pore-water pressure > 42 kPa',
    badgeColor: '#B91C1C',
    mitigationGuidelines: [
      'NDMA National Landslide Risk Management Strategy (2019): Site-specific geotechnical investigation & slope stabilization.',
      'Bio-engineering with deep-rooted vetiver grass, stepped gabion retaining walls, and lined catch-water surface drains.',
      'Real-time acoustic emission, inclinometer, and MEMS tilt-sensor early warning networks in vulnerable ghat habitations.',
    ],
    before: [
      'Identify safe evacuation routes to higher ground or designated ZP School / Revenue shelters away from steep escarpments.',
      'Watch for early warning signs: new cracks in foundations/retaining walls, tilting trees/poles, or sudden muddy spring seepage.',
      'Keep drain channels and hill-slope culverts clear of leaf litter and boulders before monsoon onset.',
    ],
    during: [
      'Evacuate immediately when a Red or Orange Alert is issued or if you hear rumbling sounds from the upper slope.',
      'Assist elderly residents, pregnant women, children, and persons with disabilities first.',
      'If driving on ghat roads (Ambenali, Tamhini, Malshej, Varandha), watch for collapsed pavement and falling rocks.',
    ],
    after: [
      'Stay away from the slide area; secondary mudslides and rockfalls frequently follow the primary slip.',
      'Report broken utility lines and trapped persons via Nivaran Voice Alert or ERSS 112.',
      'Return home only after GSI / Tahsildar structural safety clearance.',
    ],
    donts: [
      'Do NOT build or shelter near steep hill cuts, natural drainage gullies (nalas), or toe of overhanging scarps.',
      'Do NOT cross flooded or debris-covered mountain footbridges during heavy rainfall.',
    ],
  },
  {
    id: 'flood',
    name: 'Floods, Cloudburst & River Inundation',
    nameHi: 'बाढ़ और अतिवृष्टि सुरक्षा (Flood & Cloudburst)',
    category: 'Natural Hazard',
    nodalAgency: 'Central Water Commission (CWC) & IMD',
    nodalMinistry: 'Ministry of Jal Shakti & Ministry of Earth Sciences',
    zoneClassification: 'Flood Prone River Basins & Urban Flash-Flood Catchments (40+ Million Hectares Nationally)',
    earlyWarningTrigger: 'CWC River Gauge crossing Warning / Danger Mark or Cloudburst > 100 mm/hour',
    badgeColor: '#1D4ED8',
    mitigationGuidelines: [
      'NDMA Management of Floods & Urban Flooding Guidelines: Floodplain zoning, detention basins, and desilting of storm drains.',
      'Automated Reservoir Rule-Curve coordination across upstream dams (Koyna, Mulshi, Khadakwasla, Bhatghar, Dimbhe).',
      'Elevated flood shelters with raised handpumps, solar micro-grids, and inflatable rescue boat pre-positioning.',
    ],
    before: [
      'Know your village flood danger mark and nearest elevated relief camp on the Nivaran Map.',
      'Store Aadhaar, land records, medicines, and dry rations in waterproof bags inside your 72-hour Go-Bag.',
      'Monitor CWC river gauge levels and dam release bulletins.',
    ],
    during: [
      'Move immediately to higher ground or designated relief camps before access roads submerge.',
      'Switch off main electrical switchgear and LPG cylinder valves before evacuating.',
      'Use a stick to check the firmness of the ground in front of you if walking through shallow standing water.',
    ],
    after: [
      'Drink only boiled or chlorinated water distributed at official relief camps.',
      'Clear stagnant water around houses and sprinkle bleaching powder to prevent water-borne diseases.',
    ],
    donts: [
      'Do NOT walk, swim, or drive through moving floodwater — 15 cm of fast water can knock a person down and 60 cm can float a vehicle.',
      'Do NOT touch wet electrical equipment or fallen power lines.',
    ],
  },
  {
    id: 'cyclone',
    name: 'Cyclone, Gale Winds & Coastal Storm Surge',
    nameHi: 'चक्रवात और तूफ़ान सुरक्षा (Cyclone)',
    category: 'Natural Hazard',
    nodalAgency: 'India Meteorological Department (IMD) & INCOIS',
    nodalMinistry: 'Ministry of Earth Sciences',
    zoneClassification: 'Very High / High Coastal Wind & Storm Surge Hazard Belt (Arabian Sea & Bay of Bengal)',
    earlyWarningTrigger: '4-Stage IMD Cyclone Warning: Pre-Cyclone Watch (72h) -> Alert (48h) -> Warning (24h) -> Post-Landfall',
    badgeColor: '#EA580C',
    mitigationGuidelines: [
      'NDMA National Cyclone Risk Mitigation Project (NCRMP): Multi-purpose cyclone shelters (MPCS), underground cabling & saline embankments.',
      'Coastal bio-shield mangrove regeneration and automated VHF/NavIC fishermen alert transponders.',
    ],
    before: [
      'Secure loose tin sheets, solar panels, and signboards; trim dead branches overhanging houses.',
      'Fishermen must keep boats moored safely and strictly avoid venturing into the sea during IMD warnings.',
      'Keep battery-operated radio, power bank, and torch fully charged.',
    ],
    during: [
      'Stay indoors in the strongest interior room away from glass windows; close storm shutters.',
      'If in a kutcha structure or low-lying coastal belt (Raigad, Ratnagiri, Sindhudurg, Palghar), move to a pucca Cyclone Shelter early.',
      'Beware of the calm "Eye of the Cyclone" — violent winds will resume from the opposite direction.',
    ],
    after: [
      'Wait for the official All-Clear bulletin from IMD / SDMA before stepping outside.',
      'Stay clear of dangling electric wires, damaged bridges, and uprooted trees.',
    ],
    donts: [
      'Do NOT go out during the temporary lull when the cyclone eye passes overhead.',
      'Do NOT spread unverified rumours on social media; rely on SACHET CAP & Nivaran official alerts.',
    ],
  },
  {
    id: 'earthquake',
    name: 'Earthquake & Seismic Structural Hazard',
    nameHi: 'भूकंप सुरक्षा (Earthquake)',
    category: 'Natural Hazard',
    nodalAgency: 'National Center for Seismology (NCS) & NDMA',
    nodalMinistry: 'Ministry of Earth Sciences & Ministry of Housing and Urban Affairs',
    zoneClassification: 'BIS IS-1893 Seismic Zones II, III, IV & V (Koyna-Warna Reservoir Induced Seismicity Zone IV)',
    earlyWarningTrigger: 'NCS Real-Time Seismic Telemetry Magnitude >= 4.5 M or PGA > 0.15g',
    badgeColor: '#7C3AED',
    mitigationGuidelines: [
      'NDMA Management of Earthquakes Guidelines: Mandatory compliance with BIS IS 1893, IS 13920 (ductile detailing) & IS 4326.',
      'Seismic retrofitting of lifeline buildings (district hospitals, collectorates, schools, bridges, and emergency control rooms).',
    ],
    before: [
      'Fasten heavy cupboards, water heaters, and overhead storage securely to walls.',
      'Identify safe spots in each room (under sturdy tables or against inside load-bearing corners) and open assembly grounds outside.',
    ],
    during: [
      'DROP to your hands and knees, COVER your head and neck under a sturdy desk/table, and HOLD ON until shaking stops.',
      'If outdoors, move to an open area away from buildings, trees, streetlights, and high-tension power lines.',
    ],
    after: [
      'Expect aftershocks; evacuate damaged buildings calmly using stairs.',
      'Check for gas leaks by smell only — open windows and shut off the main valve.',
    ],
    donts: [
      'Do NOT use elevators during or after an earthquake.',
      'Do NOT light matches or flip electrical switches if you suspect a gas leak.',
    ],
  },
  {
    id: 'lightning',
    name: 'Lightning (Damini), Thunderstorm & Heatwave',
    nameHi: 'आकाशीय बिजली, वज्रपात और लू (Lightning & Heatwave)',
    category: 'Natural Hazard',
    nodalAgency: 'IMD & IITM Damini Lightning Network',
    nodalMinistry: 'Ministry of Earth Sciences',
    zoneClassification: 'Convective Lightning & Seasonal Heatwave Action Plan Zones',
    earlyWarningTrigger: 'IITM Damini 40 km Lightning Strike Radar Detection / IMD Heatwave > 40°C (Plains) or > 30°C (Hills)',
    badgeColor: '#CA8A04',
    mitigationGuidelines: [
      'NDMA Thunderstorm, Lightning & Heatwave Action Plan: Installation of lightning arresters on schools/panchayats and Cool Roofs / ORS kiosks.',
      '30-30 Lightning Safety Rule dissemination to farmers, trekkers, and rural MGNREGA field workers.',
    ],
    before: [
      'Check 30-minute lightning strike warnings before working in open agricultural fields or hill pastures.',
      'During Heatwave alerts, keep ORS, drinking water, and shaded rest areas ready; schedule outdoor work before 11 AM.',
    ],
    during: [
      'Follow the 30-30 Rule: if thunder follows lightning in less than 30 seconds, move inside a pucca building or hard-topped metal vehicle immediately.',
      'Stay away from plumbing pipes, corded phones, and plugged-in electrical appliances.',
    ],
    after: [
      'Wait at least 30 minutes after the last clap of thunder before resuming outdoor work.',
      'Give immediate CPR if a person is struck by lightning (they carry no residual electrical charge).',
    ],
    donts: [
      'Do NOT take shelter under isolated tall trees, open farm sheds, or metallic structures.',
      'Do NOT leave children or pets in parked vehicles during heatwave conditions.',
    ],
  },
  {
    id: 'cbrn',
    name: 'Chemical, Industrial, Biological & Radiological (CBRN)',
    nameHi: 'रासायनिक, औद्योगिक और जैविक आपदा (CBRN & Industrial)',
    category: 'Man-Made / CBRN Hazard',
    nodalAgency: 'NDMA CBRN Division, DISH, MoEFCC, MoHFW & DAE',
    nodalMinistry: 'Ministry of Environment, Forest & Climate Change / Ministry of Health / DAE',
    zoneClassification: 'Major Accident Hazard (MAH) Industrial Clusters, Highway Hazmat Corridors & Ports',
    earlyWarningTrigger: 'Toxic Gas Leak / Hazmat Spill / Off-Site Industrial Siren Activation',
    badgeColor: '#0F766E',
    mitigationGuidelines: [
      'NDMA Chemical (Industrial) Disaster Guidelines: Mandatory On-Site and Off-Site Emergency Plans, wind-sock indicators & mutual aid response.',
      'NDRF Hazmat & CBRN Decontamination Units equipped with SCBA sets, chemical detectors, and antidotes.',
    ],
    before: [
      'Residents near MIDC / industrial belts should know the distinct sound of the Off-Site Emergency Siren vs. All-Clear Siren.',
      'Identify upwind and crosswind evacuation routes away from chemical storage plants.',
    ],
    during: [
      'Move immediately UPWIND and CROSSWIND (perpendicular to wind direction) away from the chemical plume.',
      'Cover nose and mouth with a wet cloth; if instructed to shelter-in-place, close all windows, vents, and AC dampers.',
    ],
    after: [
      'Undergo thorough water decontamination at NDRF/Fire Brigade Hazmat showers if exposed to chemical mist.',
      'Consume only sealed food and water tested safe by public health authorities.',
    ],
    donts: [
      'Do NOT walk downwind of a chemical fire or gas leak.',
      'Do NOT wash chemical spills into public storm drains or village water sources.',
    ],
  },
];

export const OFFICIAL_NDMA_PORTAL_DIRECTORY = [
  {
    id: 'ndma',
    name: 'NDMA — National Disaster Management Authority',
    ministry: 'Ministry of Home Affairs, Govt. of India',
    desc: 'Apex national body for disaster management policies, guidelines, national plans, and NEOC coordination.',
    url: 'https://ndma.gov.in/',
    helpline: '1078 / 011-26701728',
    badge: 'APEX NATIONAL PORTAL',
    color: '#0B8F80',
  },
  {
    id: 'sachet',
    name: 'SACHET — National CAP Integrated Alert System',
    ministry: 'NDMA & C-DOT (Common Alerting Protocol)',
    desc: 'Real-time geo-targeted disaster warnings from IMD, CWC, INCOIS, GSI, FSI & State SDMAs across India.',
    url: 'https://sachet.ndma.gov.in/',
    helpline: '1078',
    badge: 'CAP EARLY WARNING',
    color: '#EA580C',
  },
  {
    id: 'erss112',
    name: 'ERSS 112 — National Emergency Response System',
    ministry: 'Ministry of Home Affairs, Govt. of India',
    desc: 'Single pan-India emergency number 112 integrating Police (100), Fire (101), Ambulance (108) & SDRF/NDRF.',
    url: 'https://112.gov.in/',
    helpline: '112',
    badge: 'PAN-INDIA SOS',
    color: '#B91C1C',
  },
  {
    id: 'idrn',
    name: 'IDRN — India Disaster Resource Network',
    ministry: 'NIDM & NDMA National Equipment Registry',
    desc: 'District-level electronic inventory of specialist rescue equipment, boats, cranes, medical supplies & skilled human resources.',
    url: 'https://idrn.nidm.gov.in/',
    helpline: '1070',
    badge: 'RESOURCE INVENTORY',
    color: '#1D4ED8',
  },
  {
    id: 'imd',
    name: 'IMD Mausam — India Meteorological Department',
    ministry: 'Ministry of Earth Sciences',
    desc: 'District rainfall alerts (Red/Orange/Yellow), Doppler weather radar, nowcasts & cyclone bulletins.',
    url: 'https://mausam.imd.gov.in/',
    helpline: '1800-220-161',
    badge: 'WEATHER & RADAR',
    color: '#0284C7',
  },
  {
    id: 'cwc',
    name: 'CWC — Central Water Commission Flood Forecast',
    ministry: 'Ministry of Jal Shakti',
    desc: 'Live river gauge water levels, danger mark alerts, and dam inflow/outflow hydrographs.',
    url: 'https://ffs.india-water.gov.in/',
    helpline: '1070',
    badge: 'RIVER HYDROLOGY',
    color: '#15803D',
  },
  {
    id: 'gsi',
    name: 'GSI Bhukosh & Landslide Susceptibility Portal',
    ministry: 'Geological Survey of India (Ministry of Mines)',
    desc: 'National Landslide Susceptibility Mapping (NLSM), scarp hazard zones, and geological telemetry.',
    url: 'https://bhukosh.gsi.gov.in/',
    helpline: '1077',
    badge: 'LANDSLIDE GIS',
    color: '#9333EA',
  },
  {
    id: 'ndrf',
    name: 'NDRF — National Disaster Response Force',
    ministry: 'Specialist Search & Rescue Battalions',
    desc: '16 specialized battalions for flood rescue, landslide debris response, CBRN & collapsed structure search.',
    url: 'https://ndrf.gov.in/',
    helpline: '9711077372',
    badge: 'RESCUE FORCE',
    color: '#0B1F33',
  },
  {
    id: 'bhuvan',
    name: 'ISRO Bhuvan — NDEM Disaster Services',
    ministry: 'National Remote Sensing Centre (ISRO)',
    desc: 'Satellite flood inundation layers, terrain DEMs, and National Database for Emergency Management (NDEM).',
    url: 'https://bhuvan.nrsc.gov.in/',
    helpline: '1078',
    badge: 'ISRO SATELLITE GIS',
    color: '#0F766E',
  },
];

const IMD_5DAY_FORECAST = [
  {
    district: 'Raigad (Mahad, Poladpur, Taliye)',
    day1: { label: 'Red Alert (Extreme Rain)', rainMm: 215, windKmph: 65, color: '#B91C1C' },
    day2: { label: 'Orange Alert (Very Heavy)', rainMm: 142, windKmph: 50, color: '#EA580C' },
    day3: { label: 'Orange Alert (Heavy)', rainMm: 118, windKmph: 42, color: '#EA580C' },
    day4: { label: 'Yellow Watch', rainMm: 68, windKmph: 30, color: '#CA8A04' },
    day5: { label: 'Green (Moderate)', rainMm: 32, windKmph: 22, color: '#15803D' },
  },
  {
    district: 'Pune (Ambegaon, Malin, Mulshi, Maval)',
    day1: { label: 'Orange Alert (Very Heavy)', rainMm: 168, windKmph: 48, color: '#EA580C' },
    day2: { label: 'Red Alert (Ghat Cloudburst)', rainMm: 195, windKmph: 58, color: '#B91C1C' },
    day3: { label: 'Yellow Watch', rainMm: 84, windKmph: 35, color: '#CA8A04' },
    day4: { label: 'Green (Light-Mod)', rainMm: 38, windKmph: 24, color: '#15803D' },
    day5: { label: 'Green (Normal)', rainMm: 21, windKmph: 18, color: '#15803D' },
  },
  {
    district: 'Satara (Patan, Koyna, Mahabaleshwar)',
    day1: { label: 'Red Alert (Extreme Ghat Rain)', rainMm: 240, windKmph: 62, color: '#B91C1C' },
    day2: { label: 'Orange Alert (Very Heavy)', rainMm: 155, windKmph: 48, color: '#EA580C' },
    day3: { label: 'Yellow Watch', rainMm: 92, windKmph: 36, color: '#CA8A04' },
    day4: { label: 'Yellow Watch', rainMm: 64, windKmph: 28, color: '#CA8A04' },
    day5: { label: 'Green (Moderate)', rainMm: 29, windKmph: 20, color: '#15803D' },
  },
  {
    district: 'Ratnagiri & Sindhudurg (Chiplun, Khed)',
    day1: { label: 'Orange Alert (Coastal Surge)', rainMm: 158, windKmph: 60, color: '#EA580C' },
    day2: { label: 'Orange Alert (Very Heavy)', rainMm: 134, windKmph: 52, color: '#EA580C' },
    day3: { label: 'Yellow Watch', rainMm: 76, windKmph: 38, color: '#CA8A04' },
    day4: { label: 'Green (Moderate)', rainMm: 44, windKmph: 26, color: '#15803D' },
    day5: { label: 'Green (Normal)', rainMm: 25, windKmph: 20, color: '#15803D' },
  },
  {
    district: 'Kolhapur & Sangli (Panchganga / Krishna Basin)',
    day1: { label: 'Orange Alert (River Rise)', rainMm: 128, windKmph: 40, color: '#EA580C' },
    day2: { label: 'Orange Alert (Dam Release)', rainMm: 135, windKmph: 42, color: '#EA580C' },
    day3: { label: 'Yellow Watch', rainMm: 72, windKmph: 30, color: '#CA8A04' },
    day4: { label: 'Green (Moderate)', rainMm: 35, windKmph: 22, color: '#15803D' },
    day5: { label: 'Green (Normal)', rainMm: 19, windKmph: 16, color: '#15803D' },
  },
];

const SDRF_RELIEF_NORMS = [
  {
    id: 'ex-gratia-death',
    category: 'Ex-Gratia Payment to Families of Deceased Persons',
    normRate: 400000,
    unitLabel: 'per deceased person',
    authority: 'SDRF / NDRF Revised MHA Norms',
    timeline: 'Within 48 hours of verification by Tahsildar / Medical Officer',
  },
  {
    id: 'disability-high',
    category: 'Grievous Injury / Disability (> 60% permanent disability)',
    normRate: 250000,
    unitLabel: 'per injured person',
    authority: 'SDRF / NDRF Revised MHA Norms',
    timeline: 'Civil Surgeon certificate based DBT transfer',
  },
  {
    id: 'house-fully-damaged',
    category: 'Fully Damaged / Destroyed Pucca or Kutcha House (Hilly Areas)',
    normRate: 130000,
    unitLabel: 'per household',
    authority: 'SDRF Housing Assistance (Griha Anudan)',
    timeline: 'Geo-tagged Panchnama by Talathi & Gram Sevak',
  },
  {
    id: 'household-clothing-utensils',
    category: 'Loss of Clothing & Household Utensils in Flood / Landslide',
    normRate: 5000,
    unitLabel: 'per affected family (₹2,500 clothing + ₹2,500 utensils)',
    authority: 'Immediate Gratuitous Relief (GR)',
    timeline: 'Immediate disbursement at Relief Camp via DBT',
  },
  {
    id: 'crop-loss-irrigated',
    category: 'Agricultural Crop Loss (> 33% damage — Irrigated Land)',
    normRate: 17000,
    unitLabel: 'per hectare (up to 2 hectares)',
    authority: 'SDRF Agricultural Input Subsidy',
    timeline: 'Joint Agriculture & Revenue Panchnama',
  },
  {
    id: 'milch-cattle-loss',
    category: 'Loss of Milch Animals (Cow / Buffalo)',
    normRate: 37500,
    unitLabel: 'per animal (up to 3 large milch animals)',
    authority: 'SDRF Animal Husbandry Relief Norm',
    timeline: 'Veterinary Officer certification',
  },
];

const EMERGENCY_KIT_ITEMS = [
  'Drinking water (at least 3 litres per person per day for 3 days)',
  'Non-perishable dry rations (roasted gram, biscuits, jaggery, baby food)',
  'Waterproof pouch with Aadhaar cards, ration card, bank passbook & land 7/12 extract',
  'First-aid kit, ORS packets, chlorine tablets & 7-day essential prescription medicines',
  'LED torch with extra batteries, whistle (to signal rescuers) & mobile power bank',
  'Battery/solar-powered FM radio for SACHET / All India Radio emergency bulletins',
  'Warm blanket, raincoat/plastic sheet, sturdy footwear & hygiene supplies',
  'Emergency cash in small denominations & written family contact numbers',
];

export const NdmaPortalFeaturesHub: React.FC<{
  defaultSection?: NdmaHubTabId;
}> = ({ defaultSection = 'sachet_cap' }) => {
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const alerts = useAppStore((s) => s.alerts);
  const createCapAlert = useAppStore((s) => s.createCapAlert);
  const acknowledgeAlert = useAppStore((s) => s.acknowledgeAlert);
  const toggleEvacuationChecklistStep = useAppStore((s) => s.toggleEvacuationChecklistStep);
  const triggerThresholdBreachDemo = useAppStore((s) => s.triggerThresholdBreachDemo);
  const sensors = useAppStore((s) => s.sensors);
  const dataSources = useAppStore((s) => s.dataSources);
  const syncAllDataSources = useAppStore((s) => s.syncAllDataSources);
  const resourceStock = useAppStore((s) => s.resourceStock);
  const deployResourceItem = useAppStore((s) => s.deployResourceItem);
  const responseTeams = useAppStore((s) => s.responseTeams);
  const volunteers = useAppStore((s) => s.volunteers);
  const villages = useAppStore((s) => s.villages);
  const addToast = useAppStore((s) => s.addToast);

  const isCitizen = !user || user.role === 'citizen' || user.role === 'villager';

  const [section, setSection] = useState<NdmaHubTabId>(defaultSection);

  // 1. SACHET CAP Composer state
  const [capVillageId, setCapVillageId] = useState(villages[0]?.id || 'v-01');
  const [capHazard, setCapHazard] = useState<HazardType>('landslide');
  const [capSeverity, setCapSeverity] = useState<'critical' | 'high' | 'moderate' | 'advisory'>('critical');
  const [capTitle, setCapTitle] = useState(
    'RED ALERT: Heavy Rainfall & Landslide Warning — Evacuate Low-Scarp Houses'
  );
  const [capMessage, setCapMessage] = useState(
    'IMD & GSI telemetry indicate >180 mm/6h rainfall. Move immediately to the nearest ZP School Relief Camp. Call 112 or 1077 for assistance.'
  );

  // 2. Hazard Encyclopedia & Do's/Don'ts state
  const [selectedHazardId, setSelectedHazardId] = useState<string>('landslide');

  // 4. IDRN Search & Category Filter
  const [idrnQuery, setIdrnQuery] = useState('');

  // 5. Aapda Mitra Volunteer Registration state
  const [mitraList, setMitraList] = useState(() => [
    {
      id: 'am-101',
      name: 'Rohan Deshmukh (Yuva Aapda Mitra)',
      district: 'Pune (Ambegaon)',
      skill: 'Collapsed Structure Search & Rescue + First Aid',
      phone: '+91-9822011402',
      batch: 'NDMA Batch XIV — Certified',
      status: 'Active / Ready',
    },
    {
      id: 'am-102',
      name: 'Pranali Sawant (Aapda Sakhi)',
      district: 'Raigad (Mahad)',
      skill: 'Flood Rescue Boat Handling & CPR / Maternal Triage',
      phone: '+91-9423088119',
      batch: 'NDMA Batch XII — Certified',
      status: 'Active / Ready',
    },
    {
      id: 'am-103',
      name: 'ganesh Shinde (Aapda Mitra)',
      district: 'Satara (Patan / Koyna)',
      skill: 'Rope Rescue, Ham Radio VHF & Landslide Spotter',
      phone: '+91-9765102938',
      batch: 'NDMA Batch XV — Certified',
      status: 'Deployed on Field',
    },
  ]);
  const [newMitraName, setNewMitraName] = useState('');
  const [newMitraDistrict, setNewMitraDistrict] = useState('Pune');
  const [newMitraSkill, setNewMitraSkill] = useState('First Aid, CPR & Search/Rescue');
  const [newMitraPhone, setNewMitraPhone] = useState('');

  const [mockDrills, setMockDrills] = useState([
    {
      id: 'md-1',
      title: 'Monsoon Landslide & Dam Release Multi-Agency Mock Exercise',
      location: 'Malin & Taleghar (Ambegaon Taluka, Pune)',
      agencies: 'NDRF 5th Bn, Revenue, Police, PHC Medical Team & 85 Villagers',
      date: 'Conducted · 96% Evacuation Target Met in 18 mins',
      status: 'Completed',
    },
    {
      id: 'md-2',
      title: 'Coastal Cyclone & Flood Inundation Table-Top + Field Drill',
      location: 'Taliye & Mahad Riverfront (Raigad)',
      agencies: 'SDRF, Coast Guard, DDMA Raigad & Aapda Mitra Volunteers',
      date: 'Scheduled · Next Monsoon Readiness Cycle',
      status: 'Scheduled',
    },
  ]);

  // 6. SDRF/NDRF Relief Calculator state
  const [selectedReliefId, setSelectedReliefId] = useState<string>(SDRF_RELIEF_NORMS[0]!.id);
  const [reliefCount, setReliefCount] = useState<number>(1);

  // 7. 72-Hour Go-Bag Kit state
  const [checkedKitItems, setCheckedKitItems] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  const activeHazard =
    NDMA_HAZARD_ENCYCLOPEDIA.find((h) => h.id === selectedHazardId) ||
    NDMA_HAZARD_ENCYCLOPEDIA[0]!;

  const selectedReliefNorm = useMemo(
    () => SDRF_RELIEF_NORMS.find((n) => n.id === selectedReliefId) || SDRF_RELIEF_NORMS[0]!,
    [selectedReliefId]
  );

  const filteredResourceStock = useMemo(() => {
    const q = idrnQuery.trim().toLowerCase();
    if (!q) return resourceStock;
    return resourceStock.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.district.toLowerCase().includes(q) ||
        item.warehouseLocation.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [resourceStock, idrnQuery]);

  const handleBroadcastCap = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVillage = villages.find((v) => v.id === capVillageId) || villages[0];
    if (!targetVillage) return;

    createCapAlert({
      villageId: targetVillage.id,
      villageName: targetVillage.name,
      district: targetVillage.district,
      hazardType: capHazard,
      severity: capSeverity,
      urgency: capSeverity === 'critical' ? 'Immediate' : 'Expected',
      certainty: 'Observed',
      title: capTitle.trim() || `CAP Alert for ${targetVillage.name}`,
      message: capMessage.trim(),
      sensorTrigger: 'NDMA SACHET CAP v1.2 Broadcast Console',
      channels: ['SACHET SMS', 'Cell Broadcast', 'Mobile App Push', 'Gram Panchayat Siren'],
      evacuationChecklist: [
        {
          id: `chk-1-${Date.now()}`,
          label: 'Trigger SACHET Cell Broadcast & Gram Panchayat Siren',
          department: 'SDMA / DDMA Control Room',
          completed: true,
          completedAt: 'Just now',
        },
        {
          id: `chk-2-${Date.now()}`,
          label: `Mobilize Tahsildar & NDRF/SDRF Rescue Unit for ${targetVillage.name}`,
          department: 'Incident Commander',
          completed: false,
        },
        {
          id: `chk-3-${Date.now()}`,
          label: 'Verify bed, food & medical readiness at nearest Relief Camp',
          department: 'Camp Nodal Officer',
          completed: false,
        },
      ],
    });
  };

  const handleEnrollAapdaMitra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMitraName.trim()) return;
    setMitraList((prev) => [
      {
        id: `am-${Date.now()}`,
        name: `${newMitraName.trim()} (Aapda Mitra)`,
        district: newMitraDistrict,
        skill: newMitraSkill,
        phone: newMitraPhone.trim() || '+91-9800000000',
        batch: 'NDMA Online Enrollment — Verified',
        status: 'Active / Ready',
      },
      ...prev,
    ]);
    setNewMitraName('');
    setNewMitraPhone('');
    addToast('Enrolled in NDMA Aapda Mitra Community Volunteer Registry.', 'success');
  };

  return (
    <div className="space-y-4">
      {/* =====================================================================
          NDMA OFFICIAL PORTAL BANNER & 7-MODULE NAVIGATION BAR
          ===================================================================== */}
      <div className="neu-raised p-4 space-y-3 border-t-4 border-[#0B8F80]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#0B1F33] text-white flex items-center justify-center shrink-0 font-extrabold text-sm">
              NDMA
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#0B8F80] text-white">
                  NATIONAL DISASTER MANAGEMENT AUTHORITY (NDMA) · GOVT. OF INDIA
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#EA580C] text-white">
                  SACHET CAP v1.2 INTEGRATED
                </span>
              </div>
              <h2 className="text-base font-extrabold text-[var(--text-primary)] mt-0.5">
                {language === 'hi'
                  ? 'राष्ट्रीय आपदा प्रबंधन प्राधिकरण (NDMA) एवं SACHET एकीकृत पोर्टल'
                  : 'NDMA National Disaster Portal, SACHET Early Warning & IDRN Command Suite'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <a
              href="tel:1078"
              className="px-2.5 py-1.5 rounded bg-[#0B1F33] text-white font-bold flex items-center gap-1"
              title="NDMA 24x7 National Control Room"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#14B8A6]" strokeWidth={1.75} />
              <span>NDMA: 1078</span>
            </a>
            <a
              href="tel:112"
              className="px-2.5 py-1.5 rounded bg-[#B91C1C] text-white font-bold flex items-center gap-1"
              title="ERSS National Emergency Number"
            >
              <PhoneCall className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>ERSS: 112</span>
            </a>
            <a
              href="tel:1070"
              className="px-2.5 py-1.5 rounded bg-[#0B8F80] text-white font-bold flex items-center gap-1"
              title="State Emergency Operations Centre (SDMA)"
            >
              <span>SDMA: 1070</span>
            </a>
            <a
              href="tel:1077"
              className="px-2.5 py-1.5 rounded bg-[#1D4ED8] text-white font-bold flex items-center gap-1"
              title="District Emergency Operations Centre (DDMA)"
            >
              <span>DDMA: 1077</span>
            </a>
          </div>
        </div>

        {/* 7 NDMA Feature Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSection('sachet_cap')}
            className={`px-3 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
              section === 'sachet_cap'
                ? 'bg-[#0B8F80] text-white shadow-sm'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>1. SACHET CAP & IMD 5-Day Forecast</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('hazards_atlas')}
            className={`px-3 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
              section === 'hazards_atlas'
                ? 'bg-[#0B8F80] text-white shadow-sm'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>2. NDMA Hazards, Guidelines & Do&apos;s/Don&apos;ts</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('telemetry')}
            className={`px-3 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
              section === 'telemetry'
                ? 'bg-[#0B8F80] text-white shadow-sm'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>3. IMD / CWC / GSI Live Sensors</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('idrn_ndrf')}
            className={`px-3 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
              section === 'idrn_ndrf'
                ? 'bg-[#0B8F80] text-white shadow-sm'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <Package className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>4. IDRN Equipment & NDRF Battalions</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('aapda_mitra')}
            className={`px-3 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
              section === 'aapda_mitra'
                ? 'bg-[#0B8F80] text-white shadow-sm'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>5. Aapda Mitra Volunteers & Mock Drills</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('ndmp_relief')}
            className={`px-3 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
              section === 'ndmp_relief'
                ? 'bg-[#0B8F80] text-white shadow-sm'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>6. NDMP Plan, IRS & SDRF Relief Calculator</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('portals_kit')}
            className={`px-3 py-2 rounded-[8px] text-xs font-bold flex items-center gap-1.5 transition-colors ${
              section === 'portals_kit'
                ? 'bg-[#0B8F80] text-white shadow-sm'
                : 'neu-btn text-[var(--text-primary)]'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>7. Official Portals & 72h Go-Bag Kit</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. SACHET CAP EARLY WARNING FEED, BROADCASTER & IMD 5-DAY FORECAST
          ===================================================================== */}
      {section === 'sachet_cap' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 space-y-3">
              <div className="neu-raised p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      SACHET CAP v1.2 Multi-Hazard Public Bulletins ({alerts.length})
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Common Alerting Protocol (ITU-T X.1303) integrated feed with Evacuation Checklists & Multi-Channel Delivery Telemetry
                    </p>
                  </div>

                  {!isCitizen && (
                    <button
                      type="button"
                      onClick={triggerThresholdBreachDemo}
                      className="px-3 py-1.5 rounded-[8px] bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Simulate Cloudburst Breach (194.5 mm)</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="neu-flat p-4 rounded-[12px] border border-[var(--border)] space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${
                              alert.severity === 'critical'
                                ? 'bg-[#B91C1C]'
                                : alert.severity === 'high'
                                ? 'bg-[#EA580C]'
                                : 'bg-[#CA8A04]'
                            }`}
                          >
                            {alert.severity} · {alert.urgency}
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)]">
                            {alert.villageName} ({alert.district})
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                          {alert.timestamp}
                        </span>
                      </div>

                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        {alert.title}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{alert.message}</p>

                      {alert.deliveryStats && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono">
                          <div className="neu-raised px-2.5 py-1.5 rounded">
                            SMS Sent: <strong>{alert.deliveryStats.smsSent}</strong>
                          </div>
                          <div className="neu-raised px-2.5 py-1.5 rounded">
                            App Push: <strong>{alert.deliveryStats.appPushDelivered}</strong>
                          </div>
                          <div className="neu-raised px-2.5 py-1.5 rounded">
                            WhatsApp: <strong>{alert.deliveryStats.whatsappBroadcast}</strong>
                          </div>
                          <div className="neu-raised px-2.5 py-1.5 rounded">
                            Sirens: <strong>{alert.deliveryStats.sirensActivated}</strong>
                          </div>
                        </div>
                      )}

                      {alert.evacuationChecklist && alert.evacuationChecklist.length > 0 && (
                        <div className="pt-2 border-t border-[var(--border)] space-y-1.5">
                          <div className="text-[11px] font-bold text-[var(--text-primary)]">
                            NDMA Standard Evacuation Checklist:
                          </div>
                          {alert.evacuationChecklist.map((step) => (
                            <label
                              key={step.id}
                              className="flex items-center justify-between gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-black/5"
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={step.completed}
                                  onChange={() =>
                                    toggleEvacuationChecklistStep(alert.id, step.id)
                                  }
                                  className="rounded accent-[#0B8F80]"
                                />
                                <span
                                  className={
                                    step.completed
                                      ? 'line-through text-[var(--text-secondary)]'
                                      : 'font-semibold text-[var(--text-primary)]'
                                  }
                                >
                                  {step.label}
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                                {step.department}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {!alert.acknowledged && !isCitizen && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-3 py-1 rounded bg-[#15803D] text-white text-xs font-bold flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            <span>Acknowledge CAP Bulletin</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: SACHET CAP Alert Broadcaster */}
            <div className="lg:col-span-5">
              <form
                onSubmit={handleBroadcastCap}
                className="neu-raised p-4 space-y-3 border-2 border-[#0B8F80]"
              >
                <div className="border-b border-[var(--border)] pb-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#0B8F80]">
                    NDMA SACHET CAP v1.2 PUBLISHER
                  </span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Issue Multi-Channel CAP Public Warning
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Target Habitation / Sector
                    </label>
                    <select
                      value={capVillageId}
                      onChange={(e) => setCapVillageId(e.target.value)}
                      className="neu-input w-full px-2.5 py-1.5"
                    >
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.district})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                      Hazard Category
                    </label>
                    <select
                      value={capHazard}
                      onChange={(e) => setCapHazard(e.target.value as HazardType)}
                      className="neu-input w-full px-2.5 py-1.5"
                    >
                      <option value="landslide">Landslide</option>
                      <option value="flood">Flood</option>
                      <option value="cloudburst">Cloudburst</option>
                      <option value="cyclone">Cyclone</option>
                      <option value="earthquake">Earthquake</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    CAP Alert Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'critical', label: 'Red (Danger)', bg: '#B91C1C' },
                        { id: 'high', label: 'Orange (Warning)', bg: '#EA580C' },
                        { id: 'advisory', label: 'Yellow/Green (Watch)', bg: '#15803D' },
                      ] as const
                    ).map((lv) => (
                      <button
                        key={lv.id}
                        type="button"
                        onClick={() => setCapSeverity(lv.id)}
                        className={`py-1.5 px-2 rounded text-xs font-bold text-white transition-all ${
                          capSeverity === lv.id
                            ? 'ring-2 ring-offset-1 ring-[#0B1F33]'
                            : 'opacity-75'
                        }`}
                        style={{ backgroundColor: lv.bg }}
                      >
                        {lv.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Alert Headline
                  </label>
                  <input
                    type="text"
                    value={capTitle}
                    onChange={(e) => setCapTitle(e.target.value)}
                    className="neu-input w-full px-2.5 py-1.5"
                  />
                </div>

                <div className="text-xs">
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Public Evacuation / Safety Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={capMessage}
                    onChange={(e) => setCapMessage(e.target.value)}
                    className="neu-input w-full px-2.5 py-1.5"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-[10px] bg-[#0B8F80] hover:bg-[#097568] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" strokeWidth={1.75} />
                  <span>Broadcast via SACHET SMS, App Push, WhatsApp & Sirens</span>
                </button>
              </form>
            </div>
          </div>

          {/* IMD 5-Day Multi-Hazard District Weather Warning Matrix (from SACHET / IMD Mausam) */}
          <div className="neu-raised p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-[#0284C7]" strokeWidth={1.75} />
                  <span>IMD & SACHET 5-Day District Multi-Hazard Weather Warning Matrix</span>
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Color-coded district impact warnings (Red = Take Action / Evacuate · Orange = Be Prepared · Yellow = Be Updated · Green = No Warning)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2 pr-3 font-bold">District / Catchment</th>
                    <th className="py-2 px-2 font-bold">Day 1 (Today)</th>
                    <th className="py-2 px-2 font-bold">Day 2 (Tomorrow)</th>
                    <th className="py-2 px-2 font-bold">Day 3</th>
                    <th className="py-2 px-2 font-bold">Day 4</th>
                    <th className="py-2 px-2 font-bold">Day 5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {IMD_5DAY_FORECAST.map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-3 font-bold text-[var(--text-primary)]">
                        {row.district}
                      </td>
                      {[row.day1, row.day2, row.day3, row.day4, row.day5].map((d, dIdx) => (
                        <td key={dIdx} className="py-2 px-2">
                          <div
                            className="px-2.5 py-1.5 rounded-[8px] text-white font-bold text-[11px] leading-tight"
                            style={{ backgroundColor: d.color }}
                          >
                            <div>{d.label}</div>
                            <div className="font-mono text-[10px] opacity-90 mt-0.5">
                              {d.rainMm} mm · {d.windKmph} km/h
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. NDMA MULTI-HAZARD ENCYCLOPEDIA, NATIONAL GUIDELINES & DO'S / DON'TS
          ===================================================================== */}
      {section === 'hazards_atlas' && (
        <div className="space-y-4">
          <div className="neu-raised p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {language === 'hi'
                    ? 'NDMA प्राकृतिक और मानव-निर्मित आपदा दिशानिर्देश एवं क्या करें / क्या न करें'
                    : 'NDMA Natural & Man-Made (CBRN) Hazard Atlas, National Guidelines & Do’s/Don’ts'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Select any hazard category from the official NDMA portal taxonomy to inspect zonation, nodal agency, mitigation norms, and citizen survival SOPs
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {NDMA_HAZARD_ENCYCLOPEDIA.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedHazardId(h.id)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-colors ${
                      selectedHazardId === h.id
                        ? 'text-white shadow-sm'
                        : 'neu-btn text-[var(--text-primary)]'
                    }`}
                    style={
                      selectedHazardId === h.id ? { backgroundColor: h.badgeColor } : undefined
                    }
                  >
                    {language === 'hi' ? h.nameHi : h.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Hazard Zonation & Nodal Ministry Metadata Card */}
            <div className="neu-flat p-4 rounded-[12px] border border-[var(--border)] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                  Nodal Technical Agency & Ministry
                </span>
                <div className="font-bold text-[var(--text-primary)] mt-0.5">
                  {activeHazard.nodalAgency}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {activeHazard.nodalMinistry}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                  NDMA Vulnerability / Zonation Profile
                </span>
                <div className="font-bold text-[var(--text-primary)] mt-0.5">
                  {activeHazard.zoneClassification}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                  Early Warning Threshold Criteria
                </span>
                <div className="font-mono font-bold text-[#B91C1C] mt-0.5">
                  {activeHazard.earlyWarningTrigger}
                </div>
              </div>
            </div>

            {/* NDMA Technical Mitigation Guidelines */}
            <div className="neu-flat p-4 rounded-[12px] border-l-4 border-[#0B8F80] space-y-1.5 text-xs">
              <div className="font-bold text-sm text-[#0B8F80]">
                NDMA National Technical Mitigation Guidelines & Structural Standards
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[var(--text-primary)]">
                {activeHazard.mitigationGuidelines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>

            {/* 4-Quadrant Do's & Don'ts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="neu-flat p-4 rounded-[12px] space-y-2 border-l-4 border-[#0284C7]">
                <div className="font-bold text-sm text-[#0284C7]">
                  1. BEFORE DISASTER (Preparedness Do&apos;s)
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[var(--text-primary)]">
                  {activeHazard.before.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="neu-flat p-4 rounded-[12px] space-y-2 border-l-4 border-[#EA580C]">
                <div className="font-bold text-sm text-[#EA580C]">
                  2. DURING DISASTER (Immediate Survival Action)
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[var(--text-primary)]">
                  {activeHazard.during.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="neu-flat p-4 rounded-[12px] space-y-2 border-l-4 border-[#15803D]">
                <div className="font-bold text-sm text-[#15803D]">
                  3. AFTER DISASTER (Safe Recovery & Rehabilitation)
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[var(--text-primary)]">
                  {activeHazard.after.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="neu-flat p-4 rounded-[12px] space-y-2 border-l-4 border-[#B91C1C]">
                <div className="font-bold text-sm text-[#B91C1C] flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" strokeWidth={1.75} />
                  <span>4. STRICT DON&apos;TS (Life-Saving Prohibitions)</span>
                </div>
                <ul className="space-y-1.5 list-disc pl-4 text-[var(--text-primary)] font-semibold">
                  {activeHazard.donts.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. IMD / CWC / GSI / SEISMIC LIVE TELEMETRY & NATIONAL DATA FEEDS
          ===================================================================== */}
      {section === 'telemetry' && (
        <div className="space-y-4">
          <div className="neu-raised p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Live Multi-Agency Telemetry Gauges (IMD Rain · CWC River · GSI Piezometer)
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Automated threshold monitoring across Western Ghats & Konkan river basins
                </p>
              </div>
              <button
                type="button"
                onClick={syncAllDataSources}
                className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white text-xs font-bold flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Sync All National Feeds</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {sensors.map((s) => {
                const pct = Math.min(
                  100,
                  Math.round((s.currentValue / Math.max(1, s.criticalThreshold * 1.15)) * 100)
                );
                return (
                  <div key={s.id} className="neu-flat p-3.5 rounded-[12px] space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)]">{s.label}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${
                          s.status === 'critical'
                            ? 'bg-[#B91C1C]'
                            : s.status === 'warning'
                            ? 'bg-[#EA580C]'
                            : 'bg-[#15803D]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {s.villageName} ({s.district})
                    </div>
                    <div className="flex items-baseline justify-between font-mono pt-1">
                      <span className="text-lg font-extrabold text-[var(--text-primary)]">
                        {s.currentValue} {s.unit}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        Warn: {s.warningThreshold} · Crit: {s.criticalThreshold} {s.unit}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            s.status === 'critical'
                              ? '#B91C1C'
                              : s.status === 'warning'
                              ? '#EA580C'
                              : '#15803D',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="neu-raised p-4 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              National Disaster Data Feeds (IMD, CWC, GSI, ISRO Bhuvan, Census SECC, USGS)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {dataSources.map((ds) => (
                <div
                  key={ds.id}
                  className="neu-flat p-3 rounded-[10px] flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">
                      {ds.agency} — {ds.fullName}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{ds.dataset}</div>
                    <div className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">
                      Synced: {ds.lastSynced} · {ds.recordsCount} records
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white ${
                      ds.status === 'online' ? 'bg-[#15803D]' : 'bg-[#EA580C]'
                    }`}
                  >
                    {ds.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          4. NDMA IDRN EQUIPMENT STOCK & NDRF / SDRF RESPONSE FORCES
          ===================================================================== */}
      {section === 'idrn_ndrf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* IDRN Equipment Stock */}
          <div className="lg:col-span-7 neu-raised p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  IDRN — India Disaster Resource Network Equipment Inventory ({filteredResourceStock.length})
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  District emergency stockpile tracked per NDMA / NIDM IDRN standard categories
                </p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={idrnQuery}
                  onChange={(e) => setIdrnQuery(e.target.value)}
                  placeholder="Search boat, crane, pump..."
                  className="neu-input pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {filteredResourceStock.map((item) => (
                <div
                  key={item.id}
                  className="neu-flat p-3.5 rounded-[10px] flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[var(--text-primary)]">{item.name}</span>
                      <span className="px-2 py-0.5 rounded bg-[#0B8F80]/15 text-[#0B8F80] font-mono font-bold text-[11px]">
                        {item.availableQty} / {item.availableQty + item.deployedQty} {item.unit}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Depot: {item.warehouseLocation} ({item.district})
                    </div>
                  </div>

                  {!isCitizen && (
                    <button
                      type="button"
                      disabled={item.availableQty <= 0}
                      onClick={() => deployResourceItem(item.id, 1, 'INC-ACTIVE')}
                      className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] hover:bg-[#097568] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Deploy 1 {item.unit} to Field</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NDRF / SDRF Response Forces */}
          <div className="lg:col-span-5 neu-raised p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                NDRF (5th Battalion Pune / Sudumbare) & SDRF Response Units ({responseTeams.length})
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Specialist search, flood boat rescue, canine squad & medical response units
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              {responseTeams.map((team) => (
                <div key={team.id} className="neu-flat p-3.5 rounded-[10px] space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[var(--text-primary)]">{team.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                        team.status === 'Available'
                          ? 'bg-[#15803D]'
                          : team.status === 'Deployed'
                          ? 'bg-[#EA580C]'
                          : 'bg-[#0284C7]'
                      }`}
                    >
                      {team.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)]">
                    Unit: <strong>{team.unitType}</strong> ({team.district}) · Strength:{' '}
                    <strong>{team.personnelCount} personnel</strong>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
                    <span>Commander: {team.commanderName}</span>
                    <a
                      href={`tel:${team.contactPhone}`}
                      className="font-bold text-[#0B8F80] hover:underline"
                    >
                      {team.contactPhone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. NDMA AAPDA MITRA COMMUNITY VOLUNTEER SCHEME & MOCK DRILLS
          ===================================================================== */}
      {section === 'aapda_mitra' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7 space-y-4">
            <div className="neu-raised p-4 space-y-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#0B8F80]">
                  NDMA NATIONAL COMMUNITY VOLUNTEER SCHEME
                </span>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Aapda Mitra & Aapda Sakhi Trained First-Responder Registry ({mitraList.length + volunteers.length})
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  Community volunteers trained in basic search & rescue, flood boat operation, CPR, and village evacuation under NDMA Aapda Mitra programme
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                {mitraList.map((m) => (
                  <div
                    key={m.id}
                    className="neu-flat p-3.5 rounded-[10px] flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{m.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {m.district} · Skills: <strong>{m.skill}</strong>
                      </div>
                      <div className="text-[10px] font-mono text-[#0B8F80] mt-0.5">
                        {m.batch} · {m.phone}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#15803D] text-white text-[10px] font-bold">
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Drills & Capacity Building */}
            <div className="neu-raised p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    NDMA Mock Drills & Table-Top Exercises (TTEx)
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Pre-monsoon village evacuation rehearsals and school safety drills
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMockDrills((prev) => [
                      {
                        id: `md-${Date.now()}`,
                        title: 'Village Flash-Flood & Siren Evacuation Drill',
                        location: 'Koyna & Patan Sector (Satara)',
                        agencies: 'DDMA, NDRF, Tahsildar & Gram Panchayat',
                        date: 'Scheduled Today · 16:00 IST',
                        status: 'Scheduled',
                      },
                      ...prev,
                    ]);
                    addToast('New NDMA Mock Exercise scheduled and notified to DDMA.', 'success');
                  }}
                  className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Schedule Mock Drill</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {mockDrills.map((d) => (
                  <div key={d.id} className="neu-flat p-3 rounded-[10px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)]">{d.title}</span>
                      <span className="px-2 py-0.5 rounded bg-[#0B8F80]/15 text-[#0B8F80] font-mono font-bold text-[10px]">
                        {d.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      Location: {d.location} · Agencies: {d.agencies}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--text-primary)]">{d.date}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Enroll as Aapda Mitra Volunteer */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleEnrollAapdaMitra}
              className="neu-raised p-4 space-y-3 border-2 border-[#0B8F80]"
            >
              <div className="border-b border-[var(--border)] pb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-[#0B8F80]">
                  AAPDA MITRA / YUVA AAPDA MITRA REGISTRATION
                </span>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Enroll as Certified Community Disaster Volunteer
                </h3>
              </div>

              <div className="text-xs space-y-2.5">
                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newMitraName}
                    onChange={(e) => setNewMitraName(e.target.value)}
                    placeholder="Enter volunteer full name"
                    className="neu-input w-full px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    District / Block
                  </label>
                  <select
                    value={newMitraDistrict}
                    onChange={(e) => setNewMitraDistrict(e.target.value)}
                    className="neu-input w-full px-2.5 py-1.5"
                  >
                    <option value="Pune">Pune</option>
                    <option value="Raigad">Raigad</option>
                    <option value="Satara">Satara</option>
                    <option value="Ratnagiri">Ratnagiri</option>
                    <option value="Kolhapur">Kolhapur</option>
                    <option value="Thane">Thane</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Primary Emergency Skill Specialization
                  </label>
                  <select
                    value={newMitraSkill}
                    onChange={(e) => setNewMitraSkill(e.target.value)}
                    className="neu-input w-full px-2.5 py-1.5"
                  >
                    <option value="First Aid, CPR & Search/Rescue">
                      First Aid, CPR & Basic Search/Rescue
                    </option>
                    <option value="Flood Boat Operator & Life-Saving Swimmer">
                      Flood Boat Operator & Life-Saving Swimmer
                    </option>
                    <option value="Landslide Slope Spotter & Crowd Evacuation">
                      Landslide Slope Spotter & Crowd Evacuation
                    </option>
                    <option value="Ham Radio / Emergency VHF Communications">
                      Ham Radio / Emergency VHF Communications
                    </option>
                    <option value="Community Kitchen & Relief Camp Management">
                      Community Kitchen & Relief Camp Management
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                    Mobile Number (for SACHET SMS Mobilization)
                  </label>
                  <input
                    type="tel"
                    value={newMitraPhone}
                    onChange={(e) => setNewMitraPhone(e.target.value)}
                    placeholder="+91-98XXXXXXXX"
                    className="neu-input w-full px-2.5 py-1.5"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-[10px] bg-[#0B8F80] hover:bg-[#097568] text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" strokeWidth={1.75} />
                <span>Register in NDMA Aapda Mitra Roster</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. NDMP NATIONAL PLAN, IRS COMMAND ROSTER & SDRF/NDRF RELIEF CALCULATOR
          ===================================================================== */}
      {section === 'ndmp_relief' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* SDRF / NDRF Relief Assistance Calculator */}
          <div className="lg:col-span-7 neu-raised p-4 space-y-3">
            <div className="border-b border-[var(--border)] pb-2.5">
              <span className="text-[10px] font-mono font-bold uppercase text-[#0B8F80]">
                MHA / NDMA REVISED SDRF & NDRF RELIEF NORMS
              </span>
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Official Ex-Gratia & Disaster Relief Assistance Estimator</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Direct Benefit Transfer (DBT) relief norms under Disaster Management Act, 2005
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Select Relief Assistance Category
                </label>
                <select
                  value={selectedReliefId}
                  onChange={(e) => setSelectedReliefId(e.target.value)}
                  className="neu-input w-full px-2.5 py-2 text-xs font-semibold"
                >
                  {SDRF_RELIEF_NORMS.map((norm) => (
                    <option key={norm.id} value={norm.id}>
                      {norm.category} — ₹{norm.normRate.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[var(--text-secondary)] mb-1">
                  Affected Units / Beneficiaries
                </label>
                <input
                  type="number"
                  min={1}
                  max={5000}
                  value={reliefCount}
                  onChange={(e) => setReliefCount(Math.max(1, Number(e.target.value) || 1))}
                  className="neu-input w-full px-2.5 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="neu-flat p-4 rounded-[12px] border-l-4 border-[#0B8F80] flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 text-xs">
                <div className="font-bold text-[var(--text-primary)]">
                  {selectedReliefNorm.category}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Norm: ₹{selectedReliefNorm.normRate.toLocaleString('en-IN')}{' '}
                  {selectedReliefNorm.unitLabel} · {selectedReliefNorm.authority}
                </div>
                <div className="text-[11px] font-mono text-[#0B8F80]">
                  Verification & Timeline: {selectedReliefNorm.timeline}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                  Total Sanctioned Relief Outlay
                </div>
                <div className="text-xl font-extrabold font-mono text-[#0B8F80]">
                  ₹{(selectedReliefNorm.normRate * reliefCount).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Full SDRF Norms Reference Table */}
            <div className="space-y-2 pt-2 text-xs">
              <div className="font-bold text-[var(--text-primary)]">
                Standard SDRF / NDRF Financial Assistance Schedule:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SDRF_RELIEF_NORMS.map((n) => (
                  <div key={n.id} className="neu-flat p-3 rounded-[10px] space-y-1">
                    <div className="font-bold text-[var(--text-primary)]">{n.category}</div>
                    <div className="font-mono font-extrabold text-sm text-[#0B8F80]">
                      ₹{n.normRate.toLocaleString('en-IN')}{' '}
                      <span className="text-[10px] font-normal text-[var(--text-secondary)]">
                        ({n.unitLabel})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: NDMA Institutional Hierarchy & Incident Response System (IRS) */}
          <div className="lg:col-span-5 neu-raised p-4 space-y-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-[#0B8F80]">
                DISASTER MANAGEMENT ACT, 2005 & NDMP
              </span>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                NDMA Incident Response System (IRS) Command Chain
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                {
                  tier: '1. National Level — NDMA & NEC / NEOC (New Delhi)',
                  role: 'Hon’ble PM (Chairperson, NDMA) · Home Secretary (NEC) · NDRF DG',
                  helpline: '1078 / 011-26701728',
                },
                {
                  tier: '2. State Level — SDMA & SEOC Mantralaya Control Room',
                  role: 'Hon’ble CM (Chairperson, SDMA) · Chief Secretary · State Relief Commissioner',
                  helpline: '1070 / 022-22027990',
                },
                {
                  tier: '3. District Level — DDMA & DEOC Collectorate',
                  role: 'District Collector / Magistrate (Responsible Officer & Incident Commander)',
                  helpline: '1077',
                },
                {
                  tier: '4. Taluka & Village Level — Tahsildar & Gram Disaster Committee',
                  role: 'Tahsildar / BDO · Talathi · Sarpanch · Police Patil · ASHA & Aapda Mitra',
                  helpline: '112 / Local Taluka Control',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="neu-flat p-3 rounded-[10px] border-l-4 border-[#0B1F33] space-y-1"
                >
                  <div className="font-bold text-[var(--text-primary)]">{item.tier}</div>
                  <div className="text-[11px] text-[var(--text-secondary)]">{item.role}</div>
                  <div className="text-[11px] font-mono font-bold text-[#0B8F80]">
                    Emergency Line: {item.helpline}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          7. OFFICIAL NATIONAL PORTALS LAUNCHPAD & 72-HOUR EMERGENCY GO-BAG KIT
          ===================================================================== */}
      {section === 'portals_kit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Official Portals Launchpad */}
          <div className="lg:col-span-8 neu-raised p-4 space-y-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Official Government Disaster Management Portals (Click to Open Website)
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Direct integration with NDMA, SACHET, ERSS 112, IDRN, IMD, CWC, GSI, NDRF & ISRO Bhuvan
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {OFFICIAL_NDMA_PORTAL_DIRECTORY.map((portal) => (
                <a
                  key={portal.id}
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="neu-flat p-3.5 rounded-[12px] border border-[var(--border)] hover:border-[#0B8F80] transition-all flex flex-col justify-between gap-2.5 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: portal.color }}
                      >
                        {portal.badge}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-[#0B8F80] flex items-center gap-1 group-hover:underline">
                        <span>Open Portal</span>
                        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </span>
                    </div>
                    <div className="font-bold text-sm text-[var(--text-primary)]">
                      {portal.name}
                    </div>
                    <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      {portal.ministry}
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">{portal.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[var(--text-secondary)] truncate">{portal.url}</span>
                    <span className="font-bold text-[var(--text-primary)]">
                      Helpline: {portal.helpline}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* 72-Hour Family Emergency Kit Checklist */}
          <div className="lg:col-span-4 neu-raised p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <ShieldCheck className="w-5 h-5 text-[#0B8F80]" strokeWidth={1.75} />
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  NDMA 72-Hour Emergency Go-Bag Kit
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Household readiness checklist before evacuation
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              {EMERGENCY_KIT_ITEMS.map((item, idx) => (
                <label
                  key={idx}
                  className="neu-flat p-2.5 rounded-[8px] flex items-start gap-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(checkedKitItems[idx])}
                    onChange={() =>
                      setCheckedKitItems((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                    className="mt-0.5 rounded accent-[#0B8F80]"
                  />
                  <span
                    className={
                      checkedKitItems[idx]
                        ? 'line-through text-[var(--text-secondary)]'
                        : 'font-semibold text-[var(--text-primary)]'
                    }
                  >
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
