import React, { useMemo, useState } from 'react';
import {
  CloudRain,
  ExternalLink,
  Globe,
  PhoneCall,
  Radio,
  Search,
  ShieldAlert,
  Siren,
} from 'lucide-react';

interface OfficialPortal {
  id: string;
  shortCode: string;
  name: string;
  authority: string;
  category: 'Emergency Response' | 'Early Warning & Alerts' | 'Satellite & GIS' | 'State & Relief';
  url: string;
  helpline?: string;
  badgeColor: string;
  description: string;
  capabilities: string[];
}

const OFFICIAL_PORTALS: OfficialPortal[] = [
  {
    id: 'erss-112',
    shortCode: 'ERSS 112',
    name: 'ERSS 112 — Emergency Response Support System',
    authority: 'Ministry of Home Affairs, Government of India',
    category: 'Emergency Response',
    url: 'https://112.gov.in/',
    helpline: '112',
    badgeColor: '#DC2626',
    description:
      'Pan-India single emergency response portal integrating Police (100), Fire (101), Ambulance (108), and SDRF/Disaster Rescue services with live GPS location dispatch.',
    capabilities: [
      '24x7 Pan-India Unified Emergency Dispatch (112)',
      'Automated Location-Based Public Safety Answering Point (PSAP)',
      '112 India Mobile App & Citizen SOS Integration',
    ],
  },
  {
    id: 'ndma-sachet',
    shortCode: 'SACHET (CAP)',
    name: 'SACHET — National Disaster Alert Portal',
    authority: 'National Disaster Management Authority (NDMA) & C-DOT',
    category: 'Early Warning & Alerts',
    url: 'https://sachet.ndma.gov.in/',
    helpline: '1078',
    badgeColor: '#EA580C',
    description:
      'Official Common Alerting Protocol (CAP) early warning platform broadcasting geo-targeted SMS, Cell Broadcast, and RSS disaster alerts from IMD, CWC, INCOIS, DGRE, and FSI.',
    capabilities: [
      'Real-time CAP Geo-Targeted Red / Orange / Yellow Warnings',
      'All-India State & District Active Disaster Advisories',
      'Multi-Agency Feed Aggregation (IMD, CWC, INCOIS, NCS)',
    ],
  },
  {
    id: 'ndma-india',
    shortCode: 'NDMA INDIA',
    name: 'NDMA — National Disaster Management Authority',
    authority: 'Government of India (Apex Disaster Management Body)',
    category: 'Emergency Response',
    url: 'https://ndma.gov.in/',
    helpline: '1078 / 011-26701728',
    badgeColor: '#0B8F80',
    description:
      'Apex body for Disaster Management in India establishing national guidelines, landslide & flood mitigation policies, Aapda Mitra community response, and national relocation standards.',
    capabilities: [
      'National Disaster Management Plan (NDMP) & Guidelines',
      'Landslide & Flood Risk Mitigation Frameworks',
      'National Control Room & Situation Reports',
    ],
  },
  {
    id: 'ndrf-hq',
    shortCode: 'NDRF',
    name: 'NDRF — National Disaster Response Force',
    authority: 'Ministry of Home Affairs, Government of India',
    category: 'Emergency Response',
    url: 'https://ndrf.gov.in/',
    helpline: '9711077372 / 011-24363260',
    badgeColor: '#2563EB',
    description:
      'Specialized multi-disciplinary rescue force deployed for flood rescue, landslide search & rescue, collapsed structure response, and pre-positioning across high-risk Red Zones.',
    capabilities: [
      '16 NDRF Battalions & Regional Response Centres (RRCs)',
      'Specialized Flood Water, Landslide & USAR Rescue Teams',
      '24x7 NDRF Control Room Coordination',
    ],
  },
  {
    id: 'imd-mausam',
    shortCode: 'IMD MAUSAM',
    name: 'IMD — India Meteorological Department',
    authority: 'Ministry of Earth Sciences, Government of India',
    category: 'Early Warning & Alerts',
    url: 'https://mausam.imd.gov.in/',
    helpline: '1800-180-1717',
    badgeColor: '#0284C7',
    description:
      'Official national meteorological agency providing district-wise rainfall warnings, Doppler weather radar imagery, cyclone tracks, and extreme cloudburst nowcasts.',
    capabilities: [
      'District-wise 5-Day Colour-Coded Heavy Rainfall Warnings',
      'Doppler Weather Radar (DWR) & INSAT-3DR Satellite Feeds',
      'Impact-Based Urban & River Basin Flash Flood Guidance',
    ],
  },
  {
    id: 'cwc-flood',
    shortCode: 'CWC FLOOD',
    name: 'CWC — Central Water Commission Flood Forecast',
    authority: 'Department of Water Resources, Govt. of India',
    category: 'Early Warning & Alerts',
    url: 'https://ffs.india-water.gov.in/',
    helpline: '011-26106838',
    badgeColor: '#1D4ED8',
    description:
      'Real-time river gauge hydrographs, reservoir inflow forecasts, Warning Level (WL), Danger Level (DL), and Highest Flood Level (HFL) telemetry across Indian river basins.',
    capabilities: [
      'Live River Water Level vs Warning & Danger Level',
      'Dam & Barrage Inflow / Outflow Early Advisories',
      '7-Day Hydrological Basin Flood Advisories',
    ],
  },
  {
    id: 'isro-bhuvan',
    shortCode: 'ISRO BHUVAN',
    name: 'NRSC Bhuvan — ISRO Geoportal & Disaster Support',
    authority: 'National Remote Sensing Centre (ISRO)',
    category: 'Satellite & GIS',
    url: 'https://bhuvan.nrsc.gov.in/',
    badgeColor: '#0B8F80',
    description:
      'ISRO geospatial platform offering high-resolution satellite imagery, Cartosat Digital Elevation Models (DEM), flood inundation layers, and land-use / land-cover mapping.',
    capabilities: [
      'Near Real-Time Satellite Flood Inundation Mapping',
      'Cartosat Terrain DEM & Landslide Inventory Layers',
      'Village-Level Cadastral & Infrastructure Overlays',
    ],
  },
  {
    id: 'isro-ndem',
    shortCode: 'ISRO NDEM',
    name: 'NDEM — National Database for Emergency Management',
    authority: 'NRSC / ISRO & Ministry of Home Affairs',
    category: 'Satellite & GIS',
    url: 'https://ndem.nrsc.gov.in/',
    badgeColor: '#0F766E',
    description:
      'Comprehensive national GIS decision-support repository combining multi-scale base maps, hazard zonation atlases, critical infrastructure, and emergency resource allocation tools.',
    capabilities: [
      'Multi-Hazard Zonation Maps & Vulnerability Atlases',
      'Space-Based Disaster Management Support (DMS) Feeds',
      'District & Taluka Emergency Resource GIS',
    ],
  },
  {
    id: 'gsi-bhukosh',
    shortCode: 'GSI BHUKOSH',
    name: 'GSI Bhukosh — Landslide & Geological Portal',
    authority: 'Geological Survey of India, Ministry of Mines',
    category: 'Satellite & GIS',
    url: 'https://bhukosh.gsi.gov.in/',
    badgeColor: '#B45309',
    description:
      'National geological and landslide susceptibility mapping portal providing 1:50,000 National Landslide Susceptibility Mapping (NLSM) and historical landslide scar inventories.',
    capabilities: [
      'National Landslide Susceptibility Mapping (NLSM)',
      'Geomorphology, Fault Lines & Slope Instability Data',
      'Regional Landslide Early Warning System (LEWS)',
    ],
  },
  {
    id: 'ncs-seismo',
    shortCode: 'NCS SEISMO',
    name: 'NCS — National Center for Seismology',
    authority: 'Ministry of Earth Sciences, Government of India',
    category: 'Early Warning & Alerts',
    url: 'https://seismo.gov.in/',
    badgeColor: '#7C2D12',
    description:
      'Nodal agency monitoring earthquake activity across India through the National Seismological Network with real-time magnitude, epicenter, and focal depth reporting.',
    capabilities: [
      '24x7 Real-Time Earthquake Epicenter & Magnitude Bulletins',
      'Seismic Microzonation & Hazard Maps (Zones II–V)',
      ' Dam-Triggered & Reservoir-Induced Seismicity Tracking',
    ],
  },
  {
    id: 'incois-ocean',
    shortCode: 'INCOIS',
    name: 'INCOIS — Tsunami & Storm Surge Early Warning',
    authority: 'Ministry of Earth Sciences, Government of India',
    category: 'Early Warning & Alerts',
    url: 'https://incois.gov.in/',
    badgeColor: '#0369A1',
    description:
      'Indian Tsunami Early Warning Centre (ITEWC) providing coastal storm surge, high wave alerts, swell surge warnings, and coastal inundation advisories.',
    capabilities: [
      'Coastal Storm Surge & High Wave Advisories',
      'Tsunami Early Warning Bulletins',
      'Coastal Vulnerability Index (CVI) Mapping',
    ],
  },
  {
    id: 'maharashtra-sdma',
    shortCode: 'MAHA SDMA',
    name: 'Maharashtra SDMA — Relief & Rehabilitation Portal',
    authority: 'Revenue & Forest Dept., Government of Maharashtra',
    category: 'State & Relief',
    url: 'https://rfd.maharashtra.gov.in/',
    helpline: '1070 / 022-22027990',
    badgeColor: '#15803D',
    description:
      'State Emergency Operations Centre (SEOC Mantralaya) portal for Maharashtra disaster management, Western Ghats landslide relocationGRs, and district DDMA coordination.',
    capabilities: [
      'Maharashtra State Emergency Operations Centre (1070)',
      'District Control Room (DDMA 1077) & Taluka Relief Directives',
      'Permanent Rehabilitation & Safe Site Allocation GRs',
    ],
  },
];

export const NationalPortalsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPortals = useMemo(() => {
    return OFFICIAL_PORTALS.filter((p) => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.shortCode.toLowerCase().includes(q) ||
        p.authority.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const openPortalWindow = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. HERO HEADER & DIRECT ERSS 112 / SACHET / NDMA QUICK-LAUNCH BAR
          ===================================================================== */}
      <div className="neu-raised p-5 sm:p-6 border-l-4 border-[#0B8F80] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-[#0B8F80] text-white font-mono text-[11px] font-bold uppercase tracking-wider">
                OFFICIAL GOVERNMENT DISASTER & RESPONSE PORTALS
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#DC2626] text-white font-mono text-[11px] font-bold">
                24×7 HELPLINES: 112 · 1078 · 1070 · 1077
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              National Disaster Management & Emergency Response Websites
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl">
              Click any official portal below to directly open ERSS 112, NDMA SACHET (CAP Alerts),
              NDMA India, NDRF, IMD Mausam, CWC Flood Forecast, ISRO Bhuvan, or GSI Bhukosh in a new
              tab.
            </p>
          </div>

          {/* Emergency Helpline Quick Dial Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="tel:112"
              className="px-3.5 py-2 rounded-[10px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-4 h-4" strokeWidth={2} />
              <span>Dial ERSS 112</span>
            </a>
            <a
              href="tel:1078"
              className="px-3.5 py-2 rounded-[10px] bg-[#0B1F33] hover:bg-[#143252] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-4 h-4 text-[#14B8A6]" strokeWidth={2} />
              <span>NDMA 1078</span>
            </a>
            <a
              href="tel:1070"
              className="px-3.5 py-2 rounded-[10px] bg-[#0B8F80] hover:bg-[#087366] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <PhoneCall className="w-4 h-4" strokeWidth={2} />
              <span>State SEOC 1070</span>
            </a>
          </div>
        </div>

        {/* 1-Click Direct Launch Strip for Top 4 National Portals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[var(--border)]">
          <a
            href="https://112.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-[12px] bg-[#DC2626] hover:bg-[#B91C1C] text-white flex items-center justify-between transition-transform hover:-translate-y-0.5 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Siren className="w-6 h-6 shrink-0" strokeWidth={2} />
              <div>
                <div className="font-bold text-sm">ERSS 112 India</div>
                <div className="text-[11px] font-mono text-white/90">https://112.gov.in</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0" strokeWidth={2} />
          </a>

          <a
            href="https://sachet.ndma.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-[12px] bg-[#EA580C] hover:bg-[#C2410C] text-white flex items-center justify-between transition-transform hover:-translate-y-0.5 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <Radio className="w-6 h-6 shrink-0" strokeWidth={2} />
              <div>
                <div className="font-bold text-sm">NDMA SACHET Alerts</div>
                <div className="text-[11px] font-mono text-white/90">
                  https://sachet.ndma.gov.in
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0" strokeWidth={2} />
          </a>

          <a
            href="https://ndma.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-[12px] bg-[#0B8F80] hover:bg-[#087366] text-white flex items-center justify-between transition-transform hover:-translate-y-0.5 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 shrink-0" strokeWidth={2} />
              <div>
                <div className="font-bold text-sm">NDMA Official Portal</div>
                <div className="text-[11px] font-mono text-white/90">https://ndma.gov.in</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0" strokeWidth={2} />
          </a>

          <a
            href="https://mausam.imd.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-[12px] bg-[#0284C7] hover:bg-[#0369A1] text-white flex items-center justify-between transition-transform hover:-translate-y-0.5 shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <CloudRain className="w-6 h-6 shrink-0" strokeWidth={2} />
              <div>
                <div className="font-bold text-sm">IMD Mausam Radar</div>
                <div className="text-[11px] font-mono text-white/90">
                  https://mausam.imd.gov.in
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 shrink-0" strokeWidth={2} />
          </a>
        </div>
      </div>

      {/* =====================================================================
          2. FILTER & SEARCH BAR
          ===================================================================== */}
      <div className="neu-raised p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              'ALL',
              'Emergency Response',
              'Early Warning & Alerts',
              'Satellite & GIS',
              'State & Relief',
            ] as const
          ).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0B8F80] text-white'
                  : 'neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat === 'ALL' ? `All Portals (${OFFICIAL_PORTALS.length})` : cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px] flex-1 max-w-sm">
          <Search
            className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ERSS 112, Sachet, NDMA, IMD, Bhuvan..."
            className="neu-input w-full pl-9 pr-3 py-2 text-xs"
          />
        </div>
      </div>

      {/* =====================================================================
          3. ALL OFFICIAL PORTAL CARDS (CLICK ANY CARD TO OPEN WEBSITE)
          ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPortals.map((portal) => (
          <div
            key={portal.id}
            onClick={() => openPortalWindow(portal.url)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openPortalWindow(portal.url);
              }
            }}
            className="neu-raised p-5 flex flex-col justify-between gap-4 cursor-pointer border border-transparent hover:border-[#0B8F80] transition-all group"
          >
            <div className="space-y-3">
              {/* Top Row: Short Code Badge + Category + External Link Icon */}
              <div className="flex items-center justify-between gap-2">
                <span
                  className="px-2.5 py-1 rounded-[6px] text-white font-mono text-xs font-extrabold tracking-wide"
                  style={{ backgroundColor: portal.badgeColor }}
                >
                  {portal.shortCode}
                </span>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {portal.category}
                </span>
              </div>

              {/* Title & Authority */}
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] group-hover:text-[#0B8F80] transition-colors flex items-center justify-between gap-2">
                  <span>{portal.name}</span>
                  <ExternalLink
                    className="w-4 h-4 shrink-0 text-[#0B8F80]"
                    strokeWidth={2}
                  />
                </h2>
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5">
                  {portal.authority}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {portal.description}
              </p>

              {/* Capabilities List */}
              <ul className="space-y-1 pt-1">
                {portal.capabilities.map((cap, idx) => (
                  <li
                    key={idx}
                    className="text-[11px] text-[var(--text-primary)] flex items-center gap-1.5"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: portal.badgeColor }}
                    />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer: URL, Helpline & Direct Open Website Link */}
            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-mono text-[11px] text-[#0B8F80] font-semibold truncate">
                  {portal.url}
                </div>
                {portal.helpline && (
                  <div className="font-mono text-[11px] text-[#DC2626] font-bold">
                    Helpline: {portal.helpline}
                  </div>
                )}
              </div>

              <a
                href={portal.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3.5 py-2 rounded-[8px] bg-[#0B1F33] hover:bg-[#0B8F80] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Open Website</span>
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
