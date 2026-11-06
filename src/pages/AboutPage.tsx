import React from 'react';
import {
  ArrowRight,
  Cpu,
  Database,
  Globe,
  HelpCircle,
  Layers,
  Server,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

const METHOD_NOTES_QA = [
  {
    q: 'Are these official Red Zones?',
    a: 'No. Zones displayed in the workspace are labelled "Red Zone (computed)" based on the active threshold configuration until validated on the ground and formally notified by the competent District or State Authority.',
  },
  {
    q: 'Is this machine learning?',
    a: 'Only where a trained, evaluated model is registered in the Model Registry. By default, Nivaran computes a deterministic, versioned Weighted Index (v2.4-NDMA-2026) and never labels a weighted formula as machine learning.',
  },
  {
    q: 'Does a site score guarantee safety?',
    a: 'No. A candidate relocation site suitability score is a multi-criteria screening aid. Permanent resettlement requires field geotechnical verification, engineering checks, and formal authority approval.',
  },
  {
    q: 'What if safe site capacity is short?',
    a: 'The allocation engine never forces an unsafe assignment or exceeds a site’s binding capacity constraint (min of land, water, and infrastructure capacity). Any unmet population is explicitly reported under "Unassigned population" with the binding constraint.',
  },
  {
    q: 'Why combine GIS, susceptibility modelling, and optimisation?',
    a: 'GIS handles spatial buffers, terrain elevation, and proximity; susceptibility models estimate hazard where labelled inventories exist; multi-criteria scoring evaluates exposure, vulnerability, and site suitability; and constrained optimisation assigns households without violating site capacity.',
  },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="neu-raised p-6 space-y-2 border-l-4 border-l-[#0B8F80]">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#0B8F80]">
          NDMA · SDMA · DDMA Operations Architecture & Method Notes
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Nivaran — National Disaster Risk, Red Zone & Relocation Decision-Support System
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl leading-relaxed">
          Move people before the disaster, not after. Nivaran provides national, state, and district disaster management authorities with a transparent spatial decision-support platform to delineate computed Red Zones, verify relocation site capacity constraints, issue CAP v1.2 advisories, and track household resettlement.
        </p>
      </div>

      {/* System Architecture Pipeline */}
      <div className="neu-raised p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            System Operational Architecture (Data Ingestion → Spatial Analysis → Decision Engine → Secure Dispatch → Field Command)
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Unified disaster intelligence pipeline and high-availability operational telemetry:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="neu-flat p-4 space-y-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#0B8F80]/15 text-[#0B8F80] flex items-center justify-center">
              <Globe className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="font-bold text-sm">1. Spatial Ingestion</div>
            <p className="text-[var(--text-secondary)]">
              Digital Elevation Models, IMD meteorological feeds, ISRO/NRSC hazard inventories, CWC hydrological river gauges &amp; seismic networks.
            </p>
            <div className="text-[10px] font-mono text-[#0B8F80] font-bold">
              Standard Geodetic Coordinates
            </div>
          </div>

          <div className="neu-flat p-4 space-y-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#0B1F33]/15 text-[#0B8F80] flex items-center justify-center">
              <Database className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="font-bold text-sm">2. Spatial Analysis Grid</div>
            <p className="text-[var(--text-secondary)]">
              Multi-resolution spatial grid, administrative boundary index, Census household data &amp; cryptographic audit trail.
            </p>
            <div className="text-[10px] font-mono text-[#0B8F80] font-bold">
              Spatial Proximity &amp; Buffering
            </div>
          </div>

          <div className="neu-flat p-4 space-y-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center">
              <Cpu className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="font-bold text-sm">3. Decision Engine</div>
            <p className="text-[var(--text-secondary)]">
              Versioned weighted hazard index, 4-step risk chain (0–100), binding site capacity &amp; constrained allocation.
            </p>
            <div className="text-[10px] font-mono text-[#EA580C] font-bold">
              Weighted Index v2.4
            </div>
          </div>

          <div className="neu-flat p-4 space-y-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#15803D]/15 text-[#15803D] flex items-center justify-center">
              <Server className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="font-bold text-sm">4. Secure Dispatch</div>
            <p className="text-[var(--text-secondary)]">
              Role-authorized data services, GeoJSON distribution, automated failover protection &amp; CAP v1.2 emergency dispatch.
            </p>
            <div className="text-[10px] font-mono text-[#15803D] font-bold">
              Encrypted Protocol &amp; Dispatch
            </div>
          </div>

          <div className="neu-flat p-4 space-y-2">
            <div className="w-8 h-8 rounded-[8px] bg-[#B91C1C]/15 text-[#B91C1C] flex items-center justify-center">
              <Smartphone className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="font-bold text-sm">5. Web &amp; Field Command</div>
            <p className="text-[var(--text-secondary)]">
              Interactive 2D/3D workspace, live GPS geofencing, resilient offline field synchronization &amp; citizen safety services.
            </p>
            <div className="text-[10px] font-mono text-[#B91C1C] font-bold">
              Offline-Capable Field Sync
            </div>
          </div>
        </div>
      </div>

      {/* Operational Method Notes for Officials */}
      <div className="neu-raised p-5 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#0B8F80]" strokeWidth={1.75} />
          <h2 className="text-base font-bold">
            Method Notes &amp; Operational FAQ for Reviewing Officials
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {METHOD_NOTES_QA.map((item) => (
            <div key={item.q} className="neu-flat p-4 space-y-1.5">
              <div className="font-bold text-sm text-[var(--text-primary)]">{item.q}</div>
              <p className="text-[var(--text-secondary)] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Intelligence & Method Integrity Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        <div className="neu-raised p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <Layers className="w-5 h-5 text-[#0B8F80]" strokeWidth={1.75} />
            <span>2D/3D Geospatial Intelligence &amp; Telemetry</span>
          </div>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[#0B8F80] shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>
                <strong>High-Resolution Elevation &amp; Terrain Modeling:</strong> Real-time 2D and 3D terrain analysis with dynamic risk visualization, inundation scenarios, and slope stability profiling.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[#0B8F80] shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>
                <strong>Operational Telemetry Feeds:</strong> Live meteorological precipitation tracking, seismic event monitoring, administrative boundary geocoding, and evacuation corridor optimization.
              </span>
            </li>
          </ul>
        </div>

        <div className="neu-raised p-5 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-[#15803D]" strokeWidth={1.75} />
            <span>Method Integrity &amp; Court-Defensible Governance</span>
          </div>
          <ul className="space-y-2 text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>
                <strong>Explicit Method Badges:</strong> Every score carries its versioned method badge (`Weighted index v2.4-NDMA-2026`) and deterministic template rationale.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-[#15803D] shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>
                <strong>Host-Site Hazard Re-Check:</strong> Candidate relocation sites failing safety thresholds are excluded before allocation and never forced.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* Operational Honesty & Governance Notice */}
      <div className="neu-flat p-4 border-l-4 border-l-[#CA8A04] text-xs text-[var(--text-secondary)]">
        <strong className="text-[var(--text-primary)]">Method &amp; Governance Notice: </strong>
        Decision support for authority review. Not an official warning. A site score is a screening aid and does not certify safety. Relocation requires field verification, engineering checks and authority approval.
      </div>
    </div>
  );
};
