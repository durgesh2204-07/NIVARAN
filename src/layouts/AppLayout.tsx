import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  Compass,
  Contrast,
  Cpu,
  Database,
  ExternalLink,
  FileCheck2,
  FileText,
  Flame,
  Globe,
  HeartHandshake,
  History,
  Layers,
  LifeBuoy,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Navigation,
  PieChart,
  RefreshCw,
  Search,
  Settings,
  ShieldAlert,
  Siren,
  Sliders,
  Sun,
  Truck,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Language, OrganisationType, UserRole, Village } from '../types';
import { ExplainScoreModal } from '../components/ExplainScoreModal';
import { CommandPalette } from '../components/CommandPalette';
import { ToastContainer } from '../components/ToastContainer';
import { NivaranLogo } from '../components/NivaranLogo';
import { VoiceAlertButton, VoiceAlertModal } from '../components/VoiceAlertModal';
import { EmergencySosButton, EmergencySosModal } from '../components/EmergencySosModal';
import { LeftNavigationPanel } from './LeftNavigationPanel';
import { NotificationCenterPopover } from '../components/NotificationCenterPopover';
import { KebabMenu } from '../components/KebabMenu';
import { SlidePanel } from '../components/SlidePanel';
import { PageTransition } from '../components/PageTransition';
import { Nivaran247AiChatbot } from '../components/Nivaran247AiChatbot';

interface NavTabItem {
  to: string;
  labelEn: string;
  labelHi: string;
  labelMr: string;
  descEn?: string;
  descHi?: string;
  descMr?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  roles: UserRole[];
  badge?: string;
}

interface NavGroup {
  groupTitleEn: string;
  groupTitleHi: string;
  groupTitleMr: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  items: NavTabItem[];
}

const ALL_ROLES: UserRole[] = [
  'administrator',
  'district_officer',
  'field_officer',
  'response_team',
  'sdma',
  'national_authority',
  'department_agency',
  'partner_org',
  'citizen',
  'villager',
];

const STAFF_ROLES: UserRole[] = [
  'administrator',
  'district_officer',
  'field_officer',
  'response_team',
  'sdma',
  'national_authority',
  'department_agency',
  'partner_org',
];

/**
 * Top Navbar Primary Tabs
 */
const PRIMARY_NAV_TABS: NavTabItem[] = [
  {
    to: '/map',
    labelEn: 'Command Map',
    labelHi: 'कमांड मैप',
    labelMr: 'कमांड नकाशा',
    icon: Globe,
    roles: ALL_ROLES,
  },
  {
    to: '/disaster-history',
    labelEn: 'India Disaster History',
    labelHi: 'भारत आपदा इतिहास',
    labelMr: 'भारत आपत्ती इतिहास',
    icon: History,
    roles: ALL_ROLES,
  },
  {
    to: '/alerts',
    labelEn: 'Disaster Alerts',
    labelHi: 'आपदा अलर्ट',
    labelMr: 'इशारे व सूचना',
    icon: Bell,
    roles: ALL_ROLES,
  },
  {
    to: '/dashboard',
    labelEn: 'Risk Zones',
    labelHi: 'रेड ज़ोन जोखिम',
    labelMr: 'रेड झोन जोखीम',
    icon: ShieldAlert,
    roles: ALL_ROLES,
  },
  {
    to: '/relocation-sites',
    labelEn: 'Safe Shelters',
    labelHi: 'सुरक्षित आश्रय',
    labelMr: 'सुरक्षित निवारा',
    icon: Building2,
    roles: ALL_ROLES,
  },
  {
    to: '/planning',
    labelEn: 'Relocation Planning',
    labelHi: 'पुनर्वास योजना',
    labelMr: 'पुनर्वसन नियोजन',
    icon: MapPin,
    roles: ALL_ROLES,
  },
  {
    to: '/resources',
    labelEn: 'Field & Supplies',
    labelHi: 'राहत सामग्री',
    labelMr: 'साधनसामग्री व मदत',
    icon: Truck,
    roles: ALL_ROLES,
  },
  {
    to: '/impact',
    labelEn: 'Analytics & SITREP',
    labelHi: 'प्रभाव और विश्लेषण',
    labelMr: 'प्रभाव व विश्लेषण',
    icon: Activity,
    roles: ALL_ROLES,
  },
];

/**
 * Categorized Navigation Groups for "All Modules" Dropdown
 * Comprehensive directory of all 24 platform features & modules
 */
const ALL_MODULES_GROUPS: NavGroup[] = [
  {
    groupTitleEn: 'Hazard & Mapping',
    groupTitleHi: 'आपदा और मानचित्र',
    groupTitleMr: 'आपत्ती व नकाशा कार्यक्षेत्र',
    icon: Globe,
    items: [
      {
        to: '/map',
        labelEn: 'Command Map',
        labelHi: 'कमांड मैप',
        labelMr: 'कमांड नकाशा',
        descEn: 'Interactive GIS map with live GPS, 4-tier alert zones & weather telemetry',
        descHi: 'लाइव जीपीएस, 4-स्तरीय अलर्ट और मौसम टेलीमेट्री के साथ जीआईएस मैप',
        descMr: 'थेट जीपीएस, ४-स्तरीय इशारा क्षेत्र व हवामान निरीक्षणासह नकाशा',
        icon: Globe,
        roles: ALL_ROLES,
      },
      {
        to: '/disaster-history',
        labelEn: 'India Disaster History',
        labelHi: 'भारत आपदा इतिहास (30 दिन)',
        labelMr: 'भारत आपत्ती इतिहास (३० दिवस)',
        descEn: 'Nationwide Disaster Events – Last 30 Days across all 36 States & UTs',
        descHi: 'सभी 36 राज्यों और संघ राज्य क्षेत्रों में पिछले 30 दिनों की आपदा घटनाएं',
        descMr: 'सर्व ३६ राज्य व केंद्रशासित प्रदेशांमधील मागील ३० दिवसांच्या आपत्ती घटना',
        icon: History,
        roles: ALL_ROLES,
      },
      {
        to: '/gis',
        labelEn: 'Map Explorer & Layers',
        labelHi: 'मैप एक्सप्लोरर एवं परतें',
        labelMr: 'नकाशा शोधक व जीआयएस थर',
        descEn: 'Multi-layer GIS inspection, CWC rivers, GSI faults & buffer zones',
        descHi: 'सीडब्ल्यूसी नदियाँ, जीएसआई फॉल्ट्स और बफर ज़ोन का विश्लेषण',
        descMr: 'सीडब्ल्यूसी नद्या, जीएसआय फॉल्ट्स व बफर झोन तपासणी',
        icon: Layers,
        roles: ALL_ROLES,
      },
      {
        to: '/digital-twin',
        labelEn: '3D Terrain & Digital Twin',
        labelHi: '3D भूभाग एवं डिजिटल ट्विन',
        labelMr: '3D भूभाग व डिजिटल मॉडेल',
        descEn: 'High-res 3D elevation model with pitch, bearing & flood simulation',
        descHi: 'ऊंचाई मॉडल, कैमरा नियंत्रण और बाढ़ सिमुलेशन के साथ 3D भूभाग',
        descMr: 'उंची मॉडेल, कॅमेरा नियंत्रण व पूर सिम्युलेशनसह 3D मॉडेल',
        icon: Compass,
        roles: ALL_ROLES,
      },
      {
        to: '/hazard-map',
        labelEn: 'Hazard Intelligence',
        labelHi: 'आपदा विश्लेषण एवं जोखिम',
        labelMr: 'धोका नकाशा व जोखीम',
        descEn: 'Slope instability, landslide hazard zonation & rainfall overlays',
        descHi: 'ढलान अस्थिरता, भूस्खलन खतरा क्षेत्र और वर्षा डेटा',
        descMr: 'उताराची असुरक्षितता, दरडप्रवण क्षेत्र व पर्जन्यमान माहिती',
        icon: AlertTriangle,
        roles: ALL_ROLES,
      },
      {
        to: '/dashboard',
        labelEn: 'Red Zone Risk Dashboard',
        labelHi: 'रेड ज़ोन जोखिम डैशबोर्ड',
        labelMr: 'रेड झोन जोखीम विश्लेषण',
        descEn: 'NDMA multi-hazard vulnerability analytics and villages at high risk',
        descHi: 'एनडीएमए बहु-आपदा संवेदनशीलता और उच्च जोखिम वाले गाँव',
        descMr: 'एनडीएमए बहु-आपत्ती संवेदनशीलता व उच्च जोखीम गावे',
        icon: ShieldAlert,
        roles: ALL_ROLES,
      },
      {
        to: '/vulnerability',
        labelEn: 'Vulnerability Assessment',
        labelHi: 'संवेदनशीलता मूल्यांकन',
        labelMr: 'संवेदनशीलता मूल्यमापन',
        descEn: 'Socio-economic exposure, demographic risk & vulnerable habitations',
        descHi: 'सामाजिक-आर्थिक संवेदनशीलता और कमजोर बस्तियों की पहचान',
        descMr: 'सामाजिक-आर्थिक संवेदनशीलता व असुरक्षित वस्त्यांचे मूल्यांकन',
        icon: Users,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    groupTitleEn: 'Relocation & Planning',
    groupTitleHi: 'पुनर्वास और योजना',
    groupTitleMr: 'पुनर्वसन व नियोजन',
    icon: Building2,
    items: [
      {
        to: '/priority-ranking',
        labelEn: 'Relocation Priority Engine',
        labelHi: 'प्राथमिकता रैंकिंग इंजन',
        labelMr: 'पुनर्वसन प्राधान्य क्रमवारी',
        descEn: 'Multi-criteria ranking algorithm, weighted scoring & urgency index',
        descHi: 'बहु-मानदंड रैंकिंग, भारित स्कोर और तात्कालिकता सूचकांक',
        descMr: 'बहु-निकष क्रमवारी, गुण पद्धती व निकड निर्देशांक',
        icon: BarChart3,
        roles: ALL_ROLES,
      },
      {
        to: '/relocation-sites',
        labelEn: 'Safe-Zone Capacity',
        labelHi: 'सुरक्षित क्षमता एवं उपयुक्तता',
        labelMr: 'सुरक्षित जागा क्षमता व योग्यता',
        descEn: 'Safe site identification, carrying capacity metrics & slope stability',
        descHi: 'सुरक्षित स्थलों की पहचान, धारण क्षमता और ढलान स्थिरता',
        descMr: 'सुरक्षित जागांची निवड, धारण क्षमता व उताराची स्थिरता',
        icon: Building2,
        roles: ALL_ROLES,
      },
      {
        to: '/planning',
        labelEn: 'Relocation Site Planner',
        labelHi: 'स्थल योजनाकार एवं लेआउट',
        labelMr: 'जागा नियोजक व आराखडा',
        descEn: 'Automated layout generation, housing block planning & infrastructure grid',
        descHi: 'स्वचालित लेआउट, आवास ब्लॉक योजना और बुनियादी ढांचा ग्रिड',
        descMr: 'स्वयंचलित आराखडा, गृहनिर्माण ब्लॉक्स व पायाभूत सुविधा नियोजन',
        icon: MapPin,
        roles: ALL_ROLES,
      },
      {
        to: '/simulator',
        labelEn: 'What-If Scenario Simulator',
        labelHi: 'परिदृश्य सिम्युलेटर',
        labelMr: 'परिदृश्य सिम्युलेटर (What-If)',
        descEn: 'Heavy rainfall, dam discharge, slope failure & what-if predictive modeling',
        descHi: 'अत्यधिक वर्षा, बांध जल विसर्जन और भूस्खलन का अग्रिम सिमुलेशन',
        descMr: 'मुसळधार पाऊस, धरण विसर्ग व दरड कोसळण्याचे संभाव्य मॉडेलिंग',
        icon: Sliders,
        roles: ALL_ROLES,
      },
      {
        to: '/relocation-tracker',
        labelEn: 'Relocation Case Tracker',
        labelHi: 'पुनर्वास केस ट्रैकर',
        labelMr: 'पुनर्वसन प्रकरण ट्रॅकर',
        descEn: 'Citizen rehabilitation tracking, family allotment & phase-wise milestones',
        descHi: 'नागरिक पुनर्वास ट्रैकिंग, परिवार आवंटन और चरणबद्ध प्रगति',
        descMr: 'नागरिक पुनर्वसन मागोवा, कुटुंब वाटप व टप्प्याटप्प्याची प्रगती',
        icon: FileCheck2,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    groupTitleEn: 'Emergency & Field Operations',
    groupTitleHi: 'राहत और क्षेत्रीय कार्य',
    groupTitleMr: 'मदत व आपत्कालीन ऑपरेशन्स',
    icon: Bell,
    items: [
      {
        to: '/alerts',
        labelEn: 'Official Alerts & Broadcasts',
        labelHi: 'आधिकारिक अलर्ट एवं सूचना',
        labelMr: 'अधिकृत इशारे व माहिती',
        descEn: 'Red/Orange/Yellow/Green CAP alerts, geofenced broadcasts & warning feeds',
        descHi: 'रेड/ऑरेंज/येलो/ग्रीन अलर्ट, जियोफेन्स्ड प्रसारण और चेतावनी',
        descMr: 'रेड/ऑरेंज/येलो/ग्रीन इशारे व भौगोलिक नियंत्रण कक्षातून सूचना',
        icon: Bell,
        roles: ALL_ROLES,
      },
      {
        to: '/sos',
        labelEn: 'Emergency SOS Beacon',
        labelHi: 'आपातकालीन एसओएस (SOS)',
        labelMr: 'आपत्कालीन एसओएस (SOS)',
        descEn: 'High-priority SOS distress beacon, emergency contacts & live rescue dispatch',
        descHi: 'उच्च-प्राथमिकता एसओएस संकट सिग्नल और त्वरित बचाव दल सहायता',
        descMr: 'अति-तातडीचे एसओएस संकट बीकन व थेट बचाव पथक संपर्क',
        icon: Siren,
        roles: ALL_ROLES,
      },
      {
        to: '/incidents',
        labelEn: 'Incident Management & Triage',
        labelHi: 'घटना प्रबंधन एवं ट्राइएज',
        labelMr: 'घटना व्यवस्थापन व तपासणी',
        descEn: 'Real-time incident verification, emergency triage & response assignment',
        descHi: 'वास्तविक समय में घटनाओं का सत्यापन और त्वरित प्रतिक्रिया दल आवंटन',
        descMr: 'थेट घटनांची नोंद, पडताळणी व तात्काळ प्रतिसाद पथक नियुक्ती',
        icon: Flame,
        roles: ALL_ROLES,
      },
      {
        to: '/community-reports',
        labelEn: 'Citizen & Field Reports',
        labelHi: 'नागरिक एवं फील्ड रिपोर्ट',
        labelMr: 'नागरिक व क्षेत्रीय अहवाल',
        descEn: 'Crowdsourced field observations, hazard photos & ground-truth validation',
        descHi: 'नागरिकों द्वारा भेजी गई तस्वीरें, फील्ड रिपोर्ट और जमीनी सत्यापन',
        descMr: 'स्थानिकांकडून मिळालेली छायाचित्रे, क्षेत्रीय निरीक्षणे व वास्तव पडताळणी',
        icon: FileText,
        roles: ALL_ROLES,
      },
      {
        to: '/evacuation',
        labelEn: 'Evacuation Routes & Roads',
        labelHi: 'निकासी मार्ग एवं सड़क स्थिति',
        labelMr: 'स्थलांतर मार्ग व रस्ते स्थिती',
        descEn: 'OSRM turn-by-turn routing, road blockages & safe transit corridors',
        descHi: 'सुरक्षित निकासी मार्ग, सड़क अवरोध स्थिति और दिशा-निर्देश',
        descMr: 'सुरक्षित स्थलांतर रस्ते, रस्ता अडथळा माहिती व मार्गदर्शन',
        icon: Navigation,
        roles: ALL_ROLES,
      },
      {
        to: '/resources',
        labelEn: 'Shelters & Relief Supplies',
        labelHi: 'आश्रय स्थल एवं राहत सामग्री',
        labelMr: 'निवारा केंद्र व मदत साहित्य',
        descEn: 'IDRN inventory, medical kits, food rations & shelter live occupancy',
        descHi: 'आईडीआरएन सामग्री, दवाइयाँ, राशन और आश्रय क्षमता की लाइव स्थिति',
        descMr: 'आयडीआरएन साधनसामग्री, औषधे, अन्न व निवारा केंद्रांची क्षमता',
        icon: Truck,
        roles: ALL_ROLES,
      },
      {
        to: '/volunteers',
        labelEn: 'Volunteers Network',
        labelHi: 'स्वयंसेवक नेटवर्क',
        labelMr: 'स्वयंसेवक जाळे व मदतनीस',
        descEn: 'Opted-in volunteer directory, specialized skills & deployment zones',
        descHi: 'पंजीकृत स्वयंसेवकों की सूची, कौशल्य और कार्यक्षेत्र आवंटन',
        descMr: 'नोंदणीकृत स्वयंसेवक, कौशल्ये व कार्यक्षेत्र वाटप',
        icon: HeartHandshake,
        roles: ALL_ROLES,
      },
      {
        to: '/national-portals',
        labelEn: 'National Portals Hub',
        labelHi: 'राष्ट्रीय आपदा पोर्टल',
        labelMr: 'राष्ट्रीय आपत्ती पोर्टल्स',
        descEn: 'Direct integration with NDMA, IMD Mausam, CWC Floods & GSI Landslides',
        descHi: 'एनडीएमए, मौसम विभाग, सीडब्ल्यूसी और जीएसआई पोर्टल्स से सीधा जुड़ाव',
        descMr: 'एनडीएमए, हवामान विभाग, सीडब्ल्यूसी व जीएसआय पोर्टल थेट दुवे',
        icon: ExternalLink,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    groupTitleEn: 'Analytics, Admin & Public',
    groupTitleHi: 'विश्लेषण, प्रशासन एवं नागरिक',
    groupTitleMr: 'विश्लेषण, प्रशासन व नागरिक',
    icon: PieChart,
    items: [
      {
        to: '/citizen-portal',
        labelEn: 'Citizen Safety Portal',
        labelHi: 'नागरिक सुरक्षा पोर्टल',
        labelMr: 'नागरिक सुरक्षा पोर्टल',
        descEn: 'Public safety dashboard, nearest shelter finder & emergency advisory',
        descHi: 'सार्वजनिक सुरक्षा डैशबोर्ड, निकटतम आश्रय खोज और सुरक्षा सलाह',
        descMr: 'सार्वजनिक सुरक्षा डॅशबोर्ड, जवळचा निवारा शोध व सुरक्षा सल्ला',
        icon: LifeBuoy,
        roles: ALL_ROLES,
      },
      {
        to: '/impact',
        labelEn: 'Impact Assessment',
        labelHi: 'प्रभाव एवं क्षति विश्लेषण',
        labelMr: 'प्रभाव व नुकसान मूल्यांकन',
        descEn: 'Before/after disaster comparison, economic losses & affected population',
        descHi: 'आपदा पूर्व एवं पश्चात तुलना, आर्थिक नुकसान और प्रभावित आबादी',
        descMr: 'आपत्ती आधी व नंतरची तुलना, आर्थिक नुकसान व बाधित लोकसंख्या',
        icon: Activity,
        roles: ALL_ROLES,
      },
      {
        to: '/analytics',
        labelEn: 'Reports & Statistical Summaries',
        labelHi: 'रिपोर्ट एवं सांख्यिकी',
        labelMr: 'अहवाल व सांख्यिकी सारांश',
        descEn: 'Comprehensive disaster readiness reports, KPI metrics & audit exports',
        descHi: 'व्यापक आपदा तत्परता रिपोर्ट, केपीआई और ऑडिट निर्यात',
        descMr: 'सर्वसमावेशक आपत्ती सज्जता अहवाल, केपीआय व माहिती निर्यात',
        icon: PieChart,
        roles: ALL_ROLES,
      },
      {
        to: '/data-sources',
        labelEn: 'Data Sources & Feeds',
        labelHi: 'डेटा स्रोत एवं लाइव फीड',
        labelMr: 'माहिती स्रोत व थेट फीड्स',
        descEn: 'OpenStreetMap, Open-Meteo, USGS Earthquake & live telemetry feeds',
        descHi: 'ओपनस्ट्रीटमैप, मौसम डेटा, भूकंप और लाइव टेलीमेट्री स्रोत',
        descMr: 'ओपनस्ट्रीटनकाशा, हवामान डेटा, भूकंप व थेट माहिती स्रोत',
        icon: Database,
        roles: ALL_ROLES,
      },
      {
        to: '/settings',
        labelEn: 'Administration & Audit',
        labelHi: 'प्रशासन एवं ऑडिट',
        labelMr: 'प्रशासन व ऑडिट तपासणी',
        descEn: 'Immutable audit logs, security compliance, roles & mock drill controls',
        descHi: 'अपरिवर्तनीय ऑडिट लॉग, सुरक्षा अनुपालन, भूमिकाएँ और मॉक ड्रिल नियंत्रण',
        descMr: 'अपरिवर्तनीय ऑडिट नोंद, सुरक्षा नियमावली, पदभार व सराव मोहीम नियंत्रणे',
        icon: Settings,
        roles: ALL_ROLES,
      },
    ],
  },
];

const getNavTabLabel = (item: NavTabItem, _lang?: Language): string => {
  return item.labelEn;
};

const getNavTabDesc = (item: NavTabItem, _lang?: Language): string => {
  return item.descEn || '';
};

const getNavGroupTitle = (grp: NavGroup, _lang?: Language): string => {
  return grp.groupTitleEn;
};

const DISTRICT_OPTIONS: { id: string; en: string; hi: string; mr: string }[] = [
  { id: 'All', en: 'All Regions (Maharashtra)', hi: 'सभी क्षेत्र (महाराष्ट्र)', mr: 'सर्व भाग (महाराष्ट्र)' },
  { id: 'Raigad', en: 'Raigad District', hi: 'रायगढ़ ज़िला', mr: 'रायगड जिल्हा' },
  { id: 'Pune', en: 'Pune District', hi: 'पुणे ज़िला', mr: 'पुणे जिल्हा' },
  { id: 'Ratnagiri', en: 'Ratnagiri District', hi: 'रत्नागिरी ज़िला', mr: 'रत्नागिरी जिल्हा' },
  { id: 'Satara', en: 'Satara District', hi: 'सतारा ज़िला', mr: 'सातारा जिल्हा' },
  { id: 'Kolhapur', en: 'Kolhapur District', hi: 'कोल्हापुर ज़िला', mr: 'कोल्हापूर जिल्हा' },
  { id: 'Sindhudurg', en: 'Sindhudurg District', hi: 'सिंधुदुर्ग ज़िला', mr: 'सिंधुदुर्ग जिल्हा' },
];

const ROLE_OPTIONS: { id: OrganisationType; en: string; hi: string; mr: string }[] = [
  { id: 'national', en: 'National (NDMA)', hi: 'राष्ट्रीय (NDMA)', mr: 'राष्ट्रीय (NDMA)' },
  { id: 'state', en: 'State (SDMA)', hi: 'राज्य (SDMA)', mr: 'राज्य (SDMA)' },
  { id: 'district', en: 'District (DDMA)', hi: 'ज़िला (DDMA)', mr: 'जिल्हा (DDMA)' },
  { id: 'departments', en: 'Field / GIS (GSI)', hi: 'फील्ड / जीआईएस (GSI)', mr: 'क्षेत्र / भूमाहिती (GSI)' },
  { id: 'response_forces', en: 'NDRF / Rescue', hi: 'एनडीआरएफ / बचाव दल', mr: 'एनडीआरएफ / बचाव पथक' },
  { id: 'partners', en: 'Shelter & Volunteers', hi: 'आश्रय एवं स्वयंसेवक', mr: 'निवारा व स्वयंसेवक' },
  { id: 'citizen', en: 'Citizen', hi: 'नागरिक', mr: 'नागरिक' },
];

const UI_STRINGS = {
  search: { en: 'Search...', hi: 'खोजें...', mr: 'शोधा...' },
  mockDrill: { en: 'Mock Drill', hi: 'मॉक ड्रिल', mr: 'सराव मोहीम' },
  endDrill: { en: 'End Drill', hi: 'ड्रिल समाप्त', mr: 'मोहीम थांबवा' },
  offline: { en: 'Offline', hi: 'ऑफ़लाइन', mr: 'ऑफलाईन' },
  synced: { en: 'Synced', hi: 'सिंक किया', mr: 'सिंक झाले' },
  sync: { en: 'Sync', hi: 'सिंक करें', mr: 'सिंक करा' },
  moreModules: { en: 'More Modules', hi: 'अधिक मॉड्यूल', mr: 'इतर विभाग' },
  logout: { en: 'Logout', hi: 'लॉगआउट', mr: 'लॉगआउट' },
  tagline: {
    en: 'Disaster Resilience & Relocation',
    hi: 'आपदा सुदृढ़ता एवं सुरक्षित पुनर्वास',
    mr: 'आपत्ती लवचिकता व सुरक्षित पुनर्वसन',
  },
  adminRegion: {
    en: 'Administrative Region:',
    hi: 'प्रशासनिक क्षेत्र:',
    mr: 'प्रशासकीय विभाग:',
  },
  operatingRole: {
    en: 'Operating Role:',
    hi: 'कार्यकारी भूमिका:',
    mr: 'कार्यकारी पद:',
  },
};

export const AppLayout: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const switchOrganisationQuick = useAppStore((s) => s.switchOrganisationQuick);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const highContrast = useAppStore((s) => s.highContrast);
  const toggleHighContrast = useAppStore((s) => s.toggleHighContrast);
  const isOfflineSimulated = useAppStore((s) => s.isOfflineSimulated);
  const setOfflineSimulated = useAppStore((s) => s.setOfflineSimulated);
  const syncOfflineQueue = useAppStore((s) => s.syncOfflineQueue);
  const offlineQueue = useAppStore((s) => s.offlineQueue);
  const voiceAlerts = useAppStore((s) => s.voiceAlerts);
  const sosAlerts = useAppStore((s) => s.sosAlerts);
  const drillModeActive = useAppStore((s) => s.drillModeActive);
  const toggleDrillMode = useAppStore((s) => s.toggleDrillMode);
  const selectedDistrict = useAppStore((s) => s.selectedDistrict);
  const setSelectedDistrict = useAppStore((s) => s.setSelectedDistrict);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const setCommandPaletteOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const addToast = useAppStore((s) => s.addToast);
  const syncAllDataSources = useAppStore((s) => s.syncAllDataSources);

  const activeAlertZones = useAppStore((s) => s.activeAlertZones);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handlePlatformRefresh = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new CustomEvent('nivaran:refresh'));
    syncAllDataSources();
    addToast({
      title: 'Platform Refreshed',
      message: 'Live GIS telemetry, GPS coordinates, and AI forecast models synchronized.',
      type: 'success',
    });
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const [modulesDropdownOpen, setModulesDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leftNavCollapsed, setLeftNavCollapsed] = useState(false);
  const [leftNavMobileOpen, setLeftNavMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const queuedVoiceAlertsCount = voiceAlerts.filter(
    (v) => v.status === 'Queued Offline'
  ).length;
  const queuedSosAlertsCount = sosAlerts.filter(
    (s) => s.status === 'Queued Offline'
  ).length;
  const totalOfflineQueuedCount =
    offlineQueue.length + queuedVoiceAlertsCount + queuedSosAlertsCount;
  const unacknowledgedVoiceCount = voiceAlerts.filter(
    (v) => v.status === 'Delivered to control room'
  ).length;
  const isCitizen = user?.role === 'citizen' || user?.role === 'villager';
  const highAlertsCount = activeAlertZones.filter(
    (z) => z.level === 'Red' || z.level === 'Orange'
  ).length + sosAlerts.filter((s) => s.status !== 'Resolved').length;

  const location = useLocation();
  const navigate = useNavigate();

  const [liveTime, setLiveTime] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close menus on outside click, route change, or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModulesDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModulesDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setModulesDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const allowedPrimaryTabs = PRIMARY_NAV_TABS.filter((tab) =>
    tab.roles.includes(user.role)
  );

  const allFlatItems = useMemo(() => ALL_MODULES_GROUPS.flatMap((g) => g.items), []);
  const currentTab = allFlatItems.find((item) => location.pathname === item.to);
  const isCurrentInDropdown = !allowedPrimaryTabs.some(
    (tab) => location.pathname === tab.to
  );

  const filteredModuleGroups = useMemo(() => {
    const q = moduleFilter.trim().toLowerCase();
    if (!q) return ALL_MODULES_GROUPS;
    return ALL_MODULES_GROUPS.map((grp) => ({
      ...grp,
      items: grp.items.filter(
        (it) =>
          it.labelEn.toLowerCase().includes(q) ||
          it.labelHi.toLowerCase().includes(q) ||
          it.labelMr.toLowerCase().includes(q) ||
          (it.descEn && it.descEn.toLowerCase().includes(q)) ||
          (it.descHi && it.descHi.toLowerCase().includes(q)) ||
          (it.descMr && it.descMr.toLowerCase().includes(q)) ||
          it.to.toLowerCase().includes(q)
      ),
    })).filter((grp) => grp.items.length > 0);
  }, [moduleFilter]);

  const totalModulesCount = useMemo(
    () => ALL_MODULES_GROUPS.reduce((acc, g) => acc + g.items.length, 0),
    []
  );
  const filteredModulesCount = useMemo(
    () => filteredModuleGroups.reduce((acc, g) => acc + g.items.length, 0),
    [filteredModuleGroups]
  );

  const openVillageDrawer = (village: Village) => {
    setSelectedVillageId(village.id);
  };

  const handleSignOut = () => {
    logout();
    addToast('Session terminated.', 'info');
    navigate('/login');
  };

  return (
    <>
      <div id="main-app-content" className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#F8FAFC] dark:bg-[#0B131E] text-[#101C2C] dark:text-[#F8FAFC] selection:bg-[#008060]/20 selection:text-[#008060]">
      {/* =====================================================================
          TOP NAVIGATION BAR (Enterprise Command Center: Fully Framed, Responsive, Zero Overflow)
          ===================================================================== */}
      <header className="sticky top-0 z-40 w-full max-w-full bg-white dark:bg-[#101C2C] text-[#101C2C] dark:text-[#F8FAFC] border-b border-slate-200 dark:border-[#1E3A5F] shadow-2xs">
        {/* UPPER TIER: Brand, Administrative Context, Quick Actions, Controls */}
        <div className="w-full max-w-full px-3 sm:px-4 lg:px-6 py-2 border-b border-slate-200 dark:border-[#1E3A5F] flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Brand Identity (Simple, Proper [N] NIVARAN) + Administrative Region Selector */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <NavLink
              to="/map"
              className="flex items-center gap-2 focus:outline-none group shrink-0"
              title="NIVARAN"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#008060] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xs transition-transform group-hover:scale-105 shrink-0">
                N
              </div>
              <span className="font-black text-lg sm:text-xl tracking-tight text-[#0F172A] dark:text-white uppercase font-sans">
                NIVARAN
              </span>
            </NavLink>

            <div className="h-5 w-px bg-slate-200 dark:bg-[#1E3A5F] hidden sm:block" />

            {/* Region / District Filter */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-50 dark:bg-[#172F46] hover:bg-slate-100 dark:hover:bg-[#1E3A5F] border border-slate-200 dark:border-[#233C57] rounded-lg px-2.5 py-1 shadow-2xs transition-all">
              <MapPin className="w-3.5 h-3.5 text-[#008060] shrink-0" strokeWidth={2.2} />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                aria-label="Current administrative area"
                className="bg-transparent text-[#0F172A] dark:text-white text-xs font-semibold focus:outline-none cursor-pointer pr-1"
              >
                {DISTRICT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="text-slate-900 bg-white dark:bg-[#172F46] dark:text-white">
                    {opt.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Actions & Preferences, dynamically adapting to stay inside the frame */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Search Ctrl+K Button */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#172F46] hover:bg-slate-100 dark:hover:bg-[#1E3A5F] border border-slate-200 dark:border-[#233C57] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
              title="Global Search (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-[#008060]" strokeWidth={2.2} />
              <span>{UI_STRINGS.search[language]}</span>
              <kbd className="px-1.5 py-0.2 rounded bg-white dark:bg-[#101C2C] font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#233C57]">
                Ctrl+K
              </kbd>
            </button>

            {/* Quick Emergency SOS Trigger */}
            <EmergencySosButton size="sm" className="hidden lg:inline-flex" />

            {/* Emergency Notification Center Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
                title="Emergency Notification Center"
                aria-label="Emergency Notifications"
              >
                <Bell className="w-4 h-4 text-[#008060]" strokeWidth={2} />
                {highAlertsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9.5px] font-mono font-bold flex items-center justify-center animate-pulse">
                    {highAlertsCount}
                  </span>
                )}
              </button>
              <NotificationCenterPopover
                isOpen={notificationsOpen}
                onClose={() => setNotificationsOpen(false)}
                language={language}
              />
            </div>

            {/* Mock Drill Button (Staff only) */}
            {!isCitizen && (
              <button
                type="button"
                onClick={toggleDrillMode}
                className={`hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all shadow-2xs ${
                  drillModeActive
                    ? 'bg-[#CA8A04] text-white border-amber-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#172F46] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#233C57] hover:bg-slate-100 dark:hover:bg-[#1E3A5F]'
                }`}
                title="Mock Drill Mode"
              >
                <ShieldAlert className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{drillModeActive ? UI_STRINGS.endDrill[language] : UI_STRINGS.mockDrill[language]}</span>
              </button>
            )}

            {/* Online / Offline Status Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-2xs ${
                isOfflineSimulated
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                  : 'bg-[#E6F7F2] dark:bg-[#008060]/20 text-[#008060] dark:text-emerald-300 border border-[#A7F3D0]/80 dark:border-[#008060]/50'
              }`}
              title={
                isOfflineSimulated
                  ? 'System Status: Offline Telemetry Cached'
                  : 'Platform Online & Telemetry Synchronized'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOfflineSimulated ? 'bg-amber-500' : 'bg-[#10B981] animate-pulse'
                }`}
              />
              <span className="tracking-wide uppercase font-bold text-[11px]">
                {isOfflineSimulated
                  ? `${UI_STRINGS.offline[language]} (${totalOfflineQueuedCount})`
                  : 'ONLINE'}
              </span>
            </div>

            {totalOfflineQueuedCount > 0 && (
              <button
                type="button"
                onClick={syncOfflineQueue}
                className="px-2 py-1 rounded-lg bg-[#008060] text-white text-xs font-bold flex items-center gap-1 hover:bg-[#006e52] shadow-2xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{UI_STRINGS.sync[language]}</span>
              </button>
            )}

            {/* Role Switcher */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-50 dark:bg-[#172F46] hover:bg-slate-100 dark:hover:bg-[#1E3A5F] border border-slate-200 dark:border-[#233C57] rounded-lg px-2 py-1 text-xs font-bold shadow-2xs transition-all">
              <Users className="w-3.5 h-3.5 text-[#008060] shrink-0" strokeWidth={2} />
              <select
                value={user.organisationType || 'state'}
                onChange={(e) =>
                  switchOrganisationQuick(e.target.value as OrganisationType)
                }
                aria-label="Switch active authority role"
                className="bg-transparent text-[#0F172A] dark:text-white text-xs font-bold focus:outline-none cursor-pointer pr-1"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="text-slate-900 bg-white dark:bg-[#172F46] dark:text-white">
                    {opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Global Refresh Button */}
            <button
              type="button"
              onClick={handlePlatformRefresh}
              className="neu-btn px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-slate-700 dark:text-slate-200 hover:text-[#008060] text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Refresh live telemetry, GIS map markers & predictions"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#008060] ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" strokeWidth={2} />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#008060]" strokeWidth={2} />
              )}
            </button>

            {/* Contextual Actions Kebab Menu (⋮) */}
            <KebabMenu />

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 dark:border-[#1E3A5F]">
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#008060] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-200 dark:ring-emerald-900/50"
                title={`${user.name} (${user.unitName || user.designation})`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left leading-tight hidden 2xl:block">
                <div className="text-xs font-bold text-[#0F172A] dark:text-white truncate max-w-[110px]">
                  {user.name}
                </div>
                <div className="text-[10.5px] font-semibold text-[#008060] dark:text-emerald-400 truncate max-w-[110px]">
                  {user.unitName || user.designation}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/60 transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              <span className="hidden xl:inline">{UI_STRINGS.logout[language]}</span>
            </button>

            {/* Mobile Navigation Drawer Hamburger */}
            <button
              type="button"
              onClick={() => setLeftNavMobileOpen(!leftNavMobileOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-slate-700 dark:text-slate-200 cursor-pointer"
              aria-label="Toggle Navigation Menu"
              title="Toggle Navigation Menu"
            >
              {leftNavMobileOpen ? (
                <X className="w-5 h-5" strokeWidth={2} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* LOWER TIER: Horizontal Navigation Tabs + "All Modules" Dropdown */}
        <div className="hidden md:flex items-center justify-between w-full max-w-full px-3 sm:px-4 lg:px-6 py-1.5 bg-slate-50 dark:bg-[#0B131E] border-b border-slate-200 dark:border-[#1E3A5F]">
          {/* Primary Nav Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5">
            {allowedPrimaryTabs.map((item) => {
              const Icon = item.icon;
              const label = getNavTabLabel(item, language);
              const badgeCount =
                item.to === '/alerts' && unacknowledgedVoiceCount > 0
                  ? String(unacknowledgedVoiceCount)
                  : undefined;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-xs sm:text-[12.5px] font-semibold transition-colors duration-150 shrink-0 select-none ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-[#172F46] hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="activePrimaryNavTabIndicator"
                          className="absolute inset-0 rounded-lg bg-[#008060] shadow-xs -z-0"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                        <span>{label}</span>
                        {badgeCount && (
                          <span className="ml-1 px-1.5 py-0.2 text-[9.5px] font-mono font-bold rounded-full bg-[#DC2626] text-white">
                            {badgeCount}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Mega Dropdown: "All Modules" */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setModulesDropdownOpen((v) => !v)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-[12.5px] font-bold transition-all cursor-pointer ${
                  modulesDropdownOpen || isCurrentInDropdown
                    ? 'bg-[#008060] text-white shadow-xs'
                    : 'bg-white dark:bg-[#172F46] border border-slate-200 dark:border-[#233C57] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E3A5F] shadow-2xs'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" strokeWidth={2} />
                <span>
                  {isCurrentInDropdown && currentTab
                    ? getNavTabLabel(currentTab, language)
                    : UI_STRINGS.moreModules[language]}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    modulesDropdownOpen ? 'rotate-180' : ''
                  }`}
                  strokeWidth={2}
                />
              </button>

              {/* All Modules Dropdown Panel */}
              <AnimatePresence>
                {modulesDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -6 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute left-0 lg:left-auto lg:right-0 xl:left-0 top-full mt-2 w-[940px] max-w-[96vw] bg-white border border-[#D1E7DD] rounded-2xl shadow-2xl p-4.5 z-50 origin-top"
                  >
                  {/* Mega Menu Top Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#D1E7DD]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#E8F5E9] text-[#059669] flex items-center justify-center font-bold shadow-xs">
                        <Cpu className="w-4 h-4" strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0F291E] flex items-center gap-2">
                          <span>All 24 Platform Modules & Features</span>
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-[#D1E7DD] text-[#0F5132]">
                            {filteredModulesCount} / {totalModulesCount} Active
                          </span>
                        </div>
                        <div className="text-[10.5px] text-[#355344]">
                          Explore all disaster capabilities and click any module to launch
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Search Filter Input */}
                      <div className="relative flex items-center">
                        <Search className="w-3.5 h-3.5 text-[#059669] absolute left-2.5 pointer-events-none" />
                        <input
                          type="text"
                          value={moduleFilter}
                          onChange={(e) => setModuleFilter(e.target.value)}
                          placeholder="Filter features (e.g. SOS, 3D, Shelters)..."
                          className="pl-8 pr-7 py-1 text-xs bg-[#F4F9F5] border border-[#D1E7DD] rounded-lg text-[#0F291E] placeholder:text-gray-400 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] w-48 sm:w-64"
                        />
                        {moduleFilter && (
                          <button
                            type="button"
                            onClick={() => setModuleFilter('')}
                            className="absolute right-2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setModulesDropdownOpen(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#0F291E] hover:bg-[#E8F5E9] transition-colors"
                        title="Close (Esc)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Category Columns Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 max-h-[64vh] overflow-y-auto pr-1">
                    {filteredModuleGroups.map((grp) => {
                      const GrpIcon = grp.icon || Globe;
                      return (
                        <div key={grp.groupTitleEn} className="space-y-2 flex flex-col">
                          {/* Category Header */}
                          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#F4F9F5] border border-[#D1E7DD]/70">
                            <div className="flex items-center gap-1.5">
                              <GrpIcon className="w-3.5 h-3.5 text-[#059669]" strokeWidth={2} />
                              <span className="text-[10px] font-bold font-mono text-[#059669] uppercase tracking-wide">
                                {getNavGroupTitle(grp, language)}
                              </span>
                            </div>
                            <span className="text-[9.5px] font-mono text-[#355344] font-bold">
                              {grp.items.length}
                            </span>
                          </div>

                          {/* Module Items */}
                          <div className="space-y-1.5 flex-1">
                            {grp.items.map((it) => {
                              const Icon = it.icon;
                              const label = getNavTabLabel(it, language);
                              const desc = getNavTabDesc(it, language);
                              const isActive = location.pathname === it.to;

                              return (
                                <NavLink
                                  key={it.to}
                                  to={it.to}
                                  onClick={() => {
                                    setModulesDropdownOpen(false);
                                    setModuleFilter('');
                                  }}
                                  className={`group flex items-start gap-2.5 p-2 rounded-[10px] border transition-all ${
                                    isActive
                                      ? 'bg-[#059669] text-white border-[#047857] shadow-sm'
                                      : 'bg-white hover:bg-[#E8F5E9] text-[#0F291E] border-[#D1E7DD]/70 hover:border-[#A7F3D0]'
                                  }`}
                                >
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                      isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-[#E8F5E9] text-[#059669] group-hover:bg-[#059669] group-hover:text-white'
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                      <span
                                        className={`text-xs font-bold leading-tight truncate ${
                                          isActive ? 'text-white' : 'text-[#0F291E]'
                                        }`}
                                      >
                                        {label}
                                      </span>
                                      {isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                      )}
                                    </div>
                                    {desc && (
                                      <p
                                        className={`text-[9.5px] leading-snug line-clamp-2 mt-0.5 ${
                                          isActive ? 'text-emerald-100' : 'text-[#355344]'
                                        }`}
                                      >
                                        {desc}
                                      </p>
                                    )}
                                  </div>
                                </NavLink>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mega Menu Bottom Quick Bar */}
                  <div className="mt-3.5 pt-3 border-t border-[#D1E7DD] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#355344]">
                      <span className="font-semibold text-[#059669]">Quick Jump:</span>
                      <NavLink
                        to="/map"
                        onClick={() => setModulesDropdownOpen(false)}
                        className="px-2 py-0.5 rounded-md bg-[#E8F5E9] hover:bg-[#D1FAE5] text-[#059669] font-bold"
                      >
                        📍 Command Map
                      </NavLink>
                      <NavLink
                        to="/citizen-portal"
                        onClick={() => setModulesDropdownOpen(false)}
                        className="px-2 py-0.5 rounded-md bg-[#E8F5E9] hover:bg-[#D1FAE5] text-[#059669] font-bold"
                      >
                        🛡️ Citizen Safety
                      </NavLink>
                      <NavLink
                        to="/sos"
                        onClick={() => setModulesDropdownOpen(false)}
                        className="px-2 py-0.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700 font-bold"
                      >
                        🚨 Emergency SOS
                      </NavLink>
                      <NavLink
                        to="/national-portals"
                        onClick={() => setModulesDropdownOpen(false)}
                        className="px-2 py-0.5 rounded-md bg-[#E8F5E9] hover:bg-[#D1FAE5] text-[#059669] font-bold"
                      >
                        🌐 National Portals
                      </NavLink>
                    </div>

                    <div className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400">
                      Official Disaster Management Platform · Operational Authority
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

          {/* Right Sub-Header Info: Live IST Time */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-white dark:bg-[#101C2C] px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-[#1E3A5F] text-xs font-mono font-bold text-[#008060] dark:text-emerald-400 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>{liveTime} IST</span>
            </div>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER MENU */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#D1E7DD] p-4 space-y-4 max-h-[80vh] overflow-y-auto">
            {/* Mobile District Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#059669] uppercase">
                {UI_STRINGS.adminRegion[language]}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-[#F4F9F5] text-[#0F291E] border border-[#D1E7DD] rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                {DISTRICT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {language === 'mr' ? opt.mr : language === 'hi' ? opt.hi : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Role Switcher */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#059669] uppercase">
                {UI_STRINGS.operatingRole[language]}
              </label>
              <select
                value={user.organisationType || 'state'}
                onChange={(e) =>
                  switchOrganisationQuick(e.target.value as OrganisationType)
                }
                className="w-full bg-[#F4F9F5] text-[#0F291E] border border-[#D1E7DD] rounded-md px-2.5 py-1.5 text-xs font-semibold"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {language === 'mr' ? opt.mr : language === 'hi' ? opt.hi : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Navigation Links */}
            <div className="space-y-3 pt-2 border-t border-[#D1E7DD]">
              {ALL_MODULES_GROUPS.map((grp) => {
                const visibleItems = grp.items.filter((it) =>
                  it.roles.includes(user.role)
                );
                if (visibleItems.length === 0) return null;

                return (
                  <div key={grp.groupTitleEn} className="space-y-1">
                    <div className="text-[10px] font-bold text-[#059669] uppercase px-1">
                      {getNavGroupTitle(grp, language)}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {visibleItems.map((it) => {
                        const Icon = it.icon;
                        const label = getNavTabLabel(it, language);
                        return (
                          <NavLink
                            key={it.to}
                            to={it.to}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-semibold transition-colors ${
                                isActive
                                  ? 'bg-[#059669] text-white font-bold'
                                  : 'bg-[#F4F9F5] text-[#355344] hover:text-[#0F291E]'
                              }`
                            }
                          >
                            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">{label}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile User & Sign out */}
            <div className="pt-3 border-t border-[#D1E7DD] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#0F291E]">{user.name}</div>
                <div className="text-[10px] text-[#355344]">{user.unitName || user.designation}</div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 hover:bg-red-200"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{UI_STRINGS.logout[language]}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================================
          MOCK DRILL BANNER & SACHET CAP ALERT BULLETIN (Fixed under Navbar)
          ===================================================================== */}
      {drillModeActive && (
        <div className="bg-[#CA8A04] text-white px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 font-bold z-30">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black/30 font-mono text-[10px] uppercase">
              MOCK DRILL ACTIVE
            </span>
            <span>
              All Alerts, Voice Alerts &amp; SOS issued now are labelled [DRILL] and excluded from real SitRep statistics.
            </span>
          </div>
          {!isCitizen && (
            <button
              type="button"
              onClick={toggleDrillMode}
              className="px-3 py-0.5 rounded bg-[#0A0E1A] text-white text-[11px] font-bold"
            >
              End Mock Drill
            </button>
          )}
        </div>
      )}



      {/* =====================================================================
          MAIN WORKSPACE: Collapsible 19-Module Left Sidebar + GIS / Decision Surface
          ===================================================================== */}
      <div className="flex flex-1 min-h-0 relative">
        <LeftNavigationPanel
          isCollapsed={leftNavCollapsed}
          onToggleCollapse={() => setLeftNavCollapsed((c) => !c)}
          mobileOpen={leftNavMobileOpen}
          onCloseMobile={() => setLeftNavMobileOpen(false)}
          language={language}
          userRole={user.role}
        />
        <main className="flex-1 min-w-0 p-3 md:p-4.5 pb-20 md:pb-6 overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname} transitionKey={location.pathname}>
              <Outlet context={{ openVillageDrawer }} />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white text-[#0F291E] border-t border-[#D1E7DD] flex items-center justify-around py-1 px-1 shadow-lg"
      >
        {allowedPrimaryTabs.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded text-[10px] font-medium min-h-[48px] active:scale-95 transition-all duration-150 ${
                  isActive ? 'text-[#059669] font-bold' : 'text-[#355344]'
                }`
              }
            >
              <Icon className="w-4 h-4 mb-0.5" strokeWidth={1.75} />
              <span className="truncate max-w-[64px]">{getNavTabLabel(item, language)}</span>
            </NavLink>
          );
        })}
      </nav>
      </div>

      {/* Reusable Slide-In Side Panel */}
      <SlidePanel />

      {/* Global Modals & Toasts */}
      <CommandPalette />
      <VoiceAlertModal />
      <EmergencySosModal />
      <ExplainScoreModal />
      <ToastContainer />

      {/* 24/7 AI Disaster Emergency Assistant Chatbot */}
      <Nivaran247AiChatbot />
    </>
  );
};
