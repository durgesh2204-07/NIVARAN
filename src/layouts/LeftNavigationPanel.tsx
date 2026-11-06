import React, { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Cpu,
  Database,
  FileCheck2,
  FileText,
  Flame,
  Globe,
  HeartHandshake,
  History,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  MapPin,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Radio,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sliders,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { useAppStore } from '../store/useAppStore';

export interface NavItemDef {
  num: number;
  to: string;
  labelEn: string;
  labelHi: string;
  labelMr: string;
  descEn: string;
  descHi: string;
  descMr: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  roles: UserRole[];
  badgeKey?: 'alerts' | 'incidents' | 'reports' | 'cases' | 'camps';
}

export interface NavGroupDef {
  groupId: string;
  titleEn: string;
  titleHi: string;
  titleMr: string;
  items: NavItemDef[];
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

/**
 * 17 CORE OPERATIONAL MODULES (ENTERPRISE SIDEBAR)
 */
export const MASTER_NAV_GROUPS: NavGroupDef[] = [
  {
    groupId: 'grp_intelligence',
    titleEn: 'Disaster & Geospatial Intelligence',
    titleHi: 'आपदा एवं भू-स्थानिक बुद्धिमत्ता',
    titleMr: 'आपत्ती व भू-माहिती बुद्धिमत्ता',
    items: [
      {
        num: 1,
        to: '/dashboard',
        labelEn: 'Overview Dashboard',
        labelHi: 'डैशबोर्ड अवलोकन',
        labelMr: 'डॅशबोर्ड आढावा',
        descEn: 'Executive disaster summary, active red zones & district telemetry',
        descHi: 'कार्यकारी आपदा सारांश, सक्रिय रेड ज़ोन और ज़िला टेलीमेट्री',
        descMr: 'कार्यकारी आपत्ती सारांश, सक्रिय रेड झोन व जिल्हा माहिती',
        icon: LayoutDashboard,
        roles: ALL_ROLES,
      },
      {
        num: 2,
        to: '/map',
        labelEn: 'Live GIS Intelligence',
        labelHi: 'लाइव जीआईएस कमांड',
        labelMr: 'थेट जीआयएस बुद्धिमत्ता',
        descEn: 'Interactive GIS command center with 3D terrain & live GPS telemetry',
        descHi: 'त्रि-फलक जीआईएस कमांड सेंटर एवं लाइव जीपीएस',
        descMr: '३-पॅनेल जीआयएस नियंत्रण कक्ष व थेट जीपीएस',
        icon: Globe,
        roles: ALL_ROLES,
      },
      {
        num: 2.5,
        to: '/disaster-history',
        labelEn: 'India Disaster History',
        labelHi: 'भारत आपदा इतिहास (30 दिन)',
        labelMr: 'भारत आपत्ती इतिहास (३० दिवस)',
        descEn: 'Nationwide Disaster Events – Last 30 Days across all 36 States & UTs',
        descHi: 'सभी 36 राज्यों और संघ राज्य क्षेत्रों में पिछले 30 दिनों की आपदाएं',
        descMr: 'सर्व ३६ राज्य व केंद्रशासित प्रदेशांमधील मागील ३० दिवसांच्या आपत्ती',
        icon: History,
        roles: ALL_ROLES,
      },
      {
        num: 3,
        to: '/hazard-map',
        labelEn: 'Disaster Monitoring',
        labelHi: 'आपदा निगरानी एवं रडार',
        labelMr: 'आपत्ती निरीक्षण व रडार',
        descEn: 'Slope instability, landslide hazard zonation & IMD rainfall telemetry',
        descHi: 'ढलान अस्थिरता, भूस्खलन खतरा क्षेत्र एवं वर्षा डेटा',
        descMr: 'उताराची असुरक्षितता, दरडप्रवण क्षेत्र व पर्जन्यमान',
        icon: AlertTriangle,
        roles: ALL_ROLES,
      },
      {
        num: 4,
        to: '/dashboard?view=redzones',
        labelEn: 'Red Zone Identification',
        labelHi: 'रेड ज़ोन पहचान एवं वर्गीकरण',
        labelMr: 'रेड झोन निश्चिती व वर्गीकरण',
        descEn: 'Multi-hazard vulnerability index, red zone matrix & high-risk villages',
        descHi: 'एनडीएमए बहु-आपदा संवेदनशीलता और उच्च जोखिम वाले गाँव',
        descMr: 'एनडीएमए बहु-आपत्ती संवेदनशीलता व उच्च जोखीम गावे',
        icon: ShieldAlert,
        roles: ALL_ROLES,
      },
      {
        num: 5,
        to: '/vulnerability',
        labelEn: 'Vulnerability Assessment',
        labelHi: 'संवेदनशीलता मूल्यांकन',
        labelMr: 'संवेदनशीलता मूल्यमापन',
        descEn: 'Socio-economic exposure (% elderly, % disabled, kutcha houses)',
        descHi: 'सामाजिक-आर्थिक संवेदनशीलता और कमजोर बस्तियों की पहचान',
        descMr: 'सामाजिक-आर्थिक संवेदनशीलता व असुरक्षित वस्त्या',
        icon: Users,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    groupId: 'grp_relocation',
    titleEn: 'Safe Zone & Relocation Planning',
    titleHi: 'सुरक्षित क्षेत्र एवं पुनर्वास नियोजन',
    titleMr: 'सुरक्षित जागा व पुनर्वसन नियोजन',
    items: [
      {
        num: 6,
        to: '/relocation-sites',
        labelEn: 'Safe Zone Analysis',
        labelHi: 'सुरक्षित स्थल विश्लेषण',
        labelMr: 'सुरक्षित जागा विश्लेषण',
        descEn: 'MCDA candidate site evaluation, restrictive carrying capacity & water constraints',
        descHi: 'सुरक्षित स्थलों की पहचान, धारण क्षमता और ढलान स्थिरता',
        descMr: 'सुरक्षित जागांची निवड, धारण क्षमता व स्थिरता',
        icon: Building2,
        roles: ALL_ROLES,
      },
      {
        num: 7,
        to: '/planning',
        labelEn: 'Carrying Capacity Assessment',
        labelHi: 'धारण क्षमता निर्धारण',
        labelMr: 'धारण क्षमता मूल्यमापन',
        descEn: 'Formula-based safe capacity (0.08 ha/HH) & infrastructure block layout',
        descHi: 'स्वचालित आवास लेआउट और बुनियादी ढांचा ग्रिड योजना',
        descMr: 'स्वयंचलित गृहनिर्माण आराखडा व पायाभूत सुविधा नियोजन',
        icon: MapPin,
        roles: ALL_ROLES,
      },
      {
        num: 8,
        to: '/priority-ranking',
        labelEn: 'Relocation Priority Planning',
        labelHi: 'पुनर्वास प्राथमिकता क्रम',
        labelMr: 'पुनर्वसन प्राधान्य क्रमवारी',
        descEn: 'Multi-criteria ranking algorithm, urgency score & official order PDF',
        descHi: 'बहु-मानदंड रैंकिंग और तात्कालिकता सूचकांक',
        descMr: 'बहु-निकष क्रमवारी व निकड निर्देशांक',
        icon: BarChart3,
        roles: ALL_ROLES,
      },
      {
        num: 9,
        to: '/simulator',
        labelEn: 'Disaster Simulation',
        labelHi: 'परिदृश्य सिम्युलेटर',
        labelMr: 'परिदृश्य सिम्युलेटर',
        descEn: 'What-if scenarios: heavy rainfall, dam discharge, road disruption & capacity drop',
        descHi: 'अत्यधिक वर्षा, बांध जल विसर्जन और भूस्खलन का अग्रिम सिमुलेशन',
        descMr: 'मुसळधार पाऊस, धरण विसर्ग व संभाव्य परिस्थिती मॉडेलिंग',
        icon: Sliders,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    groupId: 'grp_operations',
    titleEn: 'Incident & Emergency Operations',
    titleHi: 'घटना एवं आपातकालीन संचालन',
    titleMr: 'घटना व आपत्कालीन ऑपरेशन्स',
    items: [
      {
        num: 10,
        to: '/incidents',
        labelEn: 'Incident Management',
        labelHi: 'घटना प्रबंधन एवं ट्राइएज',
        labelMr: 'घटना व्यवस्थापन व तपासणी',
        descEn: 'Real-time incident verification, emergency triage & quick response team dispatch',
        descHi: 'वास्तविक समय में घटनाओं का सत्यापन और त्वरित प्रतिक्रिया दल आवंटन',
        descMr: 'थेट घटनांची नोंद, पडताळणी व प्रतिसाद पथक नियुक्ती',
        icon: Flame,
        roles: ALL_ROLES,
        badgeKey: 'incidents',
      },
      {
        num: 11,
        to: '/alerts',
        labelEn: 'SOS Management',
        labelHi: 'एसओएस एवं आधिकारिक अलर्ट',
        labelMr: 'एसओएस व अधिकृत इशारे',
        descEn: 'Emergency SOS beacons, geofenced CAP alert broadcasts & speech-transcribed advisories',
        descHi: 'रेड/ऑरेंज/येलो/ग्रीन अलर्ट, जियोफेन्स्ड प्रसारण और चेतावनी',
        descMr: 'रेड/ऑरेंज/येलो/ग्रीन इशारे व भौगोलिक नियंत्रण कक्षातून सूचना',
        icon: Bell,
        roles: ALL_ROLES,
        badgeKey: 'alerts',
      },
      {
        num: 12,
        to: '/community-reports',
        labelEn: 'Field Reports',
        labelHi: 'क्षेत्रीय रिपोर्ट एवं अवलोकन',
        labelMr: 'क्षेत्रीय अहवाल व निरीक्षणे',
        descEn: 'Community hazard submissions, field verification workflow & offline sync queue',
        descHi: 'नागरिक ग्राउंड रिपोर्ट, फोटो साक्ष्य और सत्यापन',
        descMr: 'नागरिक ग्राउंड रिपोर्ट, छायाचित्रे व पडताळणी',
        icon: FileText,
        roles: ALL_ROLES,
        badgeKey: 'reports',
      },
      {
        num: 13,
        to: '/volunteers',
        labelEn: 'Volunteer Coordination',
        labelHi: 'स्वयंसेवक समन्वय',
        labelMr: 'स्वयंसेवक समन्वय',
        descEn: 'Aapda Mitra volunteer directory, specialized rescue skills & live deployment',
        descHi: 'आपदा मित्र स्वयंसेवकों की सूची, कौशल और तैनाती क्षेत्र',
        descMr: 'आपत्ती मित्र स्वयंसेवक यादी, कौशल्ये व कार्यक्षेत्र वाटप',
        icon: HeartHandshake,
        roles: ALL_ROLES,
      },
      {
        num: 14,
        to: '/resources',
        labelEn: 'Resource Management',
        labelHi: 'संसाधन एवं आश्रय प्रबंधन',
        labelMr: 'साधनसामग्री व निवारा केंद्र',
        descEn: 'IDRN inventory visibility, medical kits, rations & relief camp live occupancy',
        descHi: 'आईडीआरएन सामग्री, दवाइयाँ, राशन और आश्रय क्षमता की लाइव स्थिति',
        descMr: 'आयडीआरएन साधनसामग्री, औषधे, अन्न व निवारा केंद्रांची क्षमता',
        icon: Truck,
        roles: ALL_ROLES,
        badgeKey: 'camps',
      },
    ],
  },
  {
    groupId: 'grp_governance',
    titleEn: 'Analytics, Audit & Governance',
    titleHi: 'सांख्यिकी, ऑडिट एवं प्रशासन',
    titleMr: 'सांख्यिकी, ऑडिट व प्रशासन',
    items: [
      {
        num: 15,
        to: '/analytics',
        labelEn: 'Analytics and Reports',
        labelHi: 'रिपोर्ट एवं सांख्यिकी',
        labelMr: 'अहवाल व सांख्यिकी',
        descEn: 'Disaster readiness KPI reports, before/after impact analysis & CSV/PDF exports',
        descHi: 'व्यापक आपदा तत्परता रिपोर्ट, केपीआई और ऑडिट निर्यात',
        descMr: 'सर्वसमावेशक आपत्ती सज्जता अहवाल व माहिती निर्यात',
        icon: PieChart,
        roles: ALL_ROLES,
      },
      {
        num: 16,
        to: '/settings?tab=audit',
        labelEn: 'Audit Logs',
        labelHi: 'अपरिवर्तनीय ऑडिट लॉग्स',
        labelMr: 'अपरिवर्तनीय ऑडिट नोंद',
        descEn: 'SHA-256 verifiable audit ledger, timestamped officer actions & compliance',
        descHi: 'अपरिवर्तनीय ऑडिट लॉग, सुरक्षा अनुपालन, भूमिकाएँ और मॉक ड्रिल नियंत्रण',
        descMr: 'अपरिवर्तनीय ऑडिट नोंद, सुरक्षा नियमावली व पदभार नियंत्रणे',
        icon: FileCheck2,
        roles: ALL_ROLES,
      },
      {
        num: 17,
        to: '/settings',
        labelEn: 'Settings',
        labelHi: 'प्रशासन एवं सेटिंग्स',
        labelMr: 'प्रशासन व नियंत्रणे',
        descEn: 'RBAC role permissions, mock drill controls, telemetry feeds & system params',
        descHi: 'आरबीएसी अनुमतियाँ, मॉक ड्रिल और सुरक्षा सेटिंग्स',
        descMr: 'आरबीएसी परवानग्या, सराव मोहीम व सुरक्षा नियंत्रणे',
        icon: Settings,
        roles: ALL_ROLES,
      },
      {
        num: 18,
        to: '/citizen-portal',
        labelEn: 'Citizen Safety Portal',
        labelHi: 'नागरिक सुरक्षा पोर्टल',
        labelMr: 'नागरिक सुरक्षा पोर्टल',
        descEn: 'Public safety dashboard, nearest shelter locator & emergency SOS beacon',
        descHi: 'सार्वजनिक सुरक्षा डैशबोर्ड, निकटतम आश्रय खोज और सुरक्षा सलाह',
        descMr: 'सार्वजनिक सुरक्षा डॅशबोर्ड, जवळचा निवारा शोध व सुरक्षा सल्ला',
        icon: LifeBuoy,
        roles: ALL_ROLES,
      },
    ],
  },
];

interface LeftNavigationPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  language: Language;
  userRole?: UserRole;
}

export const LeftNavigationPanel: React.FC<LeftNavigationPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  language,
  userRole = 'administrator',
}) => {
  const location = useLocation();

  // Dynamic store metrics for live badges
  const activeAlertZones = useAppStore((s) => s.activeAlertZones);
  const incidents = useAppStore((s) => s.incidents);
  const householdCases = useAppStore((s) => s.householdCases);
  const reliefCamps = useAppStore((s) => s.reliefCamps);

  const highAlertsCount = activeAlertZones.filter(
    (z) => z.level === 'Red' || z.level === 'Orange'
  ).length;
  const pendingIncidentsCount = incidents.filter(
    (i) => i.status === 'Reported' || i.status === 'In Progress'
  ).length;
  const activeCasesCount = householdCases.filter(
    (c) => c.status !== 'Resettled'
  ).length;

  const getBadgeValue = (key?: string): number | null => {
    if (key === 'alerts' && highAlertsCount > 0) return highAlertsCount;
    if (key === 'incidents' && pendingIncidentsCount > 0) return pendingIncidentsCount;
    if (key === 'cases' && activeCasesCount > 0) return activeCasesCount;
    if (key === 'camps') return reliefCamps.length;
    return null;
  };

  const getItemLabel = (it: NavItemDef): string => {
    if (language === 'mr') return it.labelMr || it.labelHi || it.labelEn;
    if (language === 'hi') return it.labelHi || it.labelEn;
    return it.labelEn;
  };

  const getGroupTitle = (grp: NavGroupDef): string => {
    if (language === 'mr') return grp.titleMr || grp.titleHi || grp.titleEn;
    if (language === 'hi') return grp.titleHi || grp.titleEn;
    return grp.titleEn;
  };

  // Filter items by role permissions
  const filteredGroups = useMemo(() => {
    return MASTER_NAV_GROUPS.map((grp) => ({
      ...grp,
      items: grp.items.filter((it) => it.roles.includes(userRole)),
    })).filter((grp) => grp.items.length > 0);
  }, [userRole]);

  const navContent = (
    <div className="flex flex-col h-full select-none bg-white dark:bg-[#101C2C] text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-[#1E3A5F]">
      {/* Panel Top Header: Command Status */}
      <div className="px-3.5 py-3 border-b border-slate-200 dark:border-[#1E3A5F] flex items-center justify-between shrink-0 bg-slate-50 dark:bg-[#0B131E]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A078] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-700 dark:text-slate-300">
              {language === 'mr'
                ? '१७ नियंत्रण कक्ष विभाग'
                : language === 'hi'
                ? '१७ नियंत्रण कक्ष मॉड्यूल'
                : '17 Operational Modules'}
            </span>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A078] animate-pulse" />
          </div>
        )}

        {/* Toggle Collapse Button (Desktop) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#172F46] transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand Navigation Panel' : 'Collapse Navigation Panel'}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4 text-[#16A078]" strokeWidth={2} />
          ) : (
            <PanelLeftClose className="w-4 h-4 text-[#16A078]" strokeWidth={2} />
          )}
        </button>

        {/* Close Button (Mobile) */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="md:hidden p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Items Container (Scrollable) */}
      <nav
        aria-label="Enterprise GIS Navigation Panel"
        className="flex-1 overflow-y-auto px-2 py-3 space-y-4 no-scrollbar"
      >
        {filteredGroups.map((grp) => (
          <div key={grp.groupId} className="space-y-1">
            {/* Category Section Heading */}
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {getGroupTitle(grp)}
              </div>
            )}

            {/* Group Navigation Links */}
            <div className="space-y-0.5">
              {grp.items.map((it) => {
                const Icon = it.icon;
                const label = getItemLabel(it);
                const badge = getBadgeValue(it.badgeKey);
                const cleanPath = it.to.split('?')[0];
                const isActive =
                  location.pathname === cleanPath ||
                  (cleanPath !== '/' && location.pathname.startsWith(cleanPath));

                return (
                  <NavLink
                    key={it.num}
                    to={it.to}
                    onClick={() => {
                      if (mobileOpen) onCloseMobile();
                    }}
                    title={isCollapsed ? `${it.num < 10 ? '0' : ''}${it.num}. ${label}` : undefined}
                    className={`group relative flex items-center rounded-xl text-xs transition-all duration-200 font-medium active:scale-[0.98] ${
                      isCollapsed
                        ? 'justify-center py-2.5 px-1'
                        : 'gap-2.5 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-[#16A078] text-white font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172F46] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {/* Active Indicator Bar on Left Edge */}
                    {isActive && (
                      <span className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-white shadow-xs" />
                    )}

                    {/* Item Number Pill */}
                    {!isCollapsed ? (
                      <span
                        className={`font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded shrink-0 transition-colors ${
                          isActive
                            ? 'bg-black/20 text-white'
                            : 'bg-slate-100 dark:bg-[#172F46] text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {it.num < 10 ? `0${it.num}` : it.num}
                      </span>
                    ) : null}

                    {/* Icon with Hover Micro-motion */}
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-[#16A078]'
                      }`}
                      strokeWidth={2}
                    />

                    {/* Label */}
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="truncate leading-tight text-[12.5px]">{label}</div>
                      </div>
                    )}

                    {/* Badge */}
                    {badge !== null && (
                      <span
                        className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${
                          it.badgeKey === 'alerts'
                            ? 'bg-[#DC2626] text-white animate-pulse'
                            : it.badgeKey === 'incidents'
                            ? 'bg-[#EA580C] text-white'
                            : isActive
                            ? 'bg-white text-[#16A078]'
                            : 'bg-slate-200 dark:bg-[#233C57] text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Authority Stamp */}
      <div className="p-2.5 border-t border-slate-200 dark:border-[#1E3A5F] bg-slate-50 dark:bg-[#0B131E] shrink-0 text-center">
        {!isCollapsed ? (
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-mono">
            <span>NDMA · SDMA</span>
            <span className="font-bold text-[#16A078]">NIVARAN 2.0</span>
          </div>
        ) : (
          <div className="text-[9px] font-mono font-bold text-[#16A078]">2.0</div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with Smooth Spring Collapse */}
      <aside
        className={`hidden md:flex flex-col h-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 ${
          isCollapsed ? 'w-16' : 'w-64 lg:w-72'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer with Smooth Backdrop & Slide-in */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={onCloseMobile}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {navContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
