import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
  LayoutDashboard,
  Users,
  X,
} from 'lucide-react';

interface GuidedWalkthroughModalProps {
  open: boolean;
  onClose: () => void;
}

interface WalkthroughStep {
  step: number;
  title: string;
  route: string;
  moduleLabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>;
  summary: string;
  operationalDetails: string[];
  actionLabel: string;
}

const STEPS: WalkthroughStep[] = [
  {
    step: 1,
    title: 'Command Dashboard — Live Weather, Seismic Feed & Risk Breakdown',
    route: '/dashboard',
    moduleLabel: '8.1 Command Dashboard',
    icon: LayoutDashboard,
    summary:
      'Review real-time district KPIs, Open-Meteo 7-day precipitation forecasts, USGS M2.5+ seismic events, and habitation risk distribution.',
    operationalDetails: [
      'Inspect Red Zone habitations, population at risk, and shelter bed occupancy.',
      'Check live weather telemetry and active Common Alerting Protocol (CAP) advisories.',
      'Trigger 1-click evacuation orders or voice alerts directly from the command bar.',
    ],
    actionLabel: 'Open Command Dashboard',
  },
  {
    step: 2,
    title: '3D GIS Workspace — 65° Terrain Pitch over Irshalwadi & Flood Depth',
    route: '/gis',
    moduleLabel: '8.2 3D GIS Workspace',
    icon: Globe,
    summary:
      'Explore WebGL 3D terrain (AWS Terrarium DEM), 3D extruded habitation risk columns, live GPS tracking, and dynamic flood inundation polygons.',
    operationalDetails: [
      'Click "3D Red Zone" or "3D Flood" in the map top bar to pitch the camera to 65° over Irshalwadi and Mahad.',
      'Use "Live GPS" or "GPS Patrol" to track field officer coordinates and plot evacuation routes.',
      'Switch between Esri Satellite, Topographic DEM, OpenStreetMap, and Dark Control Room basemaps.',
    ],
    actionLabel: 'Open 3D GIS Workspace',
  },
  {
    step: 3,
    title: 'Vulnerability Index — Explainable Multi-Criteria Breakdown',
    route: '/vulnerability',
    moduleLabel: '8.4 Vulnerability Index',
    icon: Users,
    summary:
      'Inspect every habitation’s composite vulnerability score across demographic, housing, socio-economic, infrastructure, and isolation sub-indices.',
    operationalDetails: [
      'Adjust AHP/TOPSIS indicator weights and observe real-time re-ranking across all 40 habitations.',
      'Open the "Explain Score" breakdown to inspect exact formula terms, raw values, and audit timestamps.',
      'Compare radar profiles across up to 3 habitations side by side.',
    ],
    actionLabel: 'Open Vulnerability Index',
  },
  {
    step: 4,
    title: 'Site Suitability & Capacity — Engineering Constraints Calculator',
    route: '/site-suitability',
    moduleLabel: '8.5 Site Suitability & Capacity',
    icon: Building2,
    summary:
      'Evaluate 12 candidate host sites and compute maximum safe household capacity from land, water, sanitation, and shelter constraints.',
    operationalDetails: [
      'Safe capacity is governed by min(landAreaHa × 10000 / 120, waterLpd / 200, sanitationUnits × 5, shelterStructures).',
      'Identifies the exact limiting factor (land, water, sanitation, or structures) for each candidate site.',
      'Checks slope (<12°), flood return period (>100-yr), and distance to road, hospital, and school.',
    ],
    actionLabel: 'Open Site Suitability',
  },
  {
    step: 5,
    title: 'Priority & Relocation Plan — Constrained Allocation & Rationale',
    route: '/priority-ranking',
    moduleLabel: '8.6 Priority & Relocation Plan',
    icon: BarChart3,
    summary:
      'Run the deterministic multi-criteria allocation engine to match Red Zone habitations to safe host sites with plain-English rationale.',
    operationalDetails: [
      'Enforces hard constraints: no site overflow, max travel distance, and livelihood compatibility.',
      'Produces an itemized cost estimate (land, housing, road, water/power, livelihood grant) in ₹ Cr.',
      'Generates a plain-English rationale and phased Gantt schedule for every relocation pairing.',
    ],
    actionLabel: 'Open Priority & Relocation Plan',
  },
  {
    step: 6,
    title: 'Data & Model Transparency — Sources, ETL Pipeline & Model Registry',
    route: '/data-management',
    moduleLabel: '7.1–7.5 Data & Model Transparency',
    icon: Database,
    summary:
      'Inspect data provenance (NRSC Bhuvan, GSI, CWC, IMD, Census), 6-stage ETL pipeline status, registered models, and 250 m analysis grid.',
    operationalDetails: [
      'Distinguishes clearly between Live API feeds, Synthetic sample datasets, and Planned backend modules.',
      'Inspect the 6-stage geospatial pipeline (Ingestion → Alignment → Feature Extraction → Scoring → Allocation).',
      'Review the Model Registry (RF Flood, GBT Landslide, TOPSIS/AHP, Greedy + Local Search) and 250 m grid cells.',
    ],
    actionLabel: 'Open Data & Model Transparency',
  },
];

export const GuidedWalkthroughModal: React.FC<GuidedWalkthroughModalProps> = ({
  open,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  if (!open) return null;

  const activeStep = STEPS[currentIndex] ?? STEPS[0]!;
  const Icon = activeStep.icon;

  const handleNavigateAndContinue = (route: string) => {
    navigate(route);
  };

  return (
    <div
      className="fixed inset-0 z-[1250] bg-black/65 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-title"
    >
      <div className="neu-raised max-w-2xl w-full overflow-hidden border border-[var(--border)]">
        {/* Header */}
        <div className="bg-[#0B1F33] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded bg-[#0B8F80] text-white font-mono text-[11px] font-bold">
              STEP {activeStep.step} OF {STEPS.length}
            </span>
            <h2 id="walkthrough-title" className="text-sm font-bold tracking-tight">
              Operational Guided Walkthrough
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Skip and close walkthrough"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-1.5 overflow-x-auto">
          {STEPS.map((s, idx) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                setCurrentIndex(idx);
                navigate(s.route);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-colors shrink-0 ${
                idx === currentIndex
                  ? 'bg-[#0B8F80] text-white'
                  : idx < currentIndex
                  ? 'bg-[#15803D]/15 text-[#15803D] border border-[#15803D]/30'
                  : 'neu-inset text-[var(--text-secondary)]'
              }`}
            >
              {s.step}. {s.moduleLabel.replace(/^[0-9.–\s]+/, '')}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-[10px] bg-[#0B8F80]/15 text-[#0B8F80] shrink-0">
              <Icon className="w-6 h-6" strokeWidth={1.75} />
            </div>
            <div className="space-y-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#0B8F80] font-bold">
                {activeStep.moduleLabel}
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {activeStep.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {activeStep.summary}
              </p>
            </div>
          </div>

          <div className="neu-inset p-4 rounded-[10px] space-y-2">
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Key Verification Actions in this Step
            </div>
            <ul className="space-y-1.5">
              {activeStep.operationalDetails.map((detail, i) => (
                <li
                  key={i}
                  className="text-xs text-[var(--text-primary)] flex items-start gap-2"
                >
                  <CheckCircle2
                    className="w-3.5 h-3.5 text-[#0B8F80] shrink-0 mt-0.5"
                    strokeWidth={1.75}
                  />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => {
                handleNavigateAndContinue(activeStep.route);
                onClose();
              }}
              className="px-3.5 py-2 rounded-[8px] bg-[#0B1F33] text-white text-xs font-semibold hover:bg-[#143252]"
            >
              {activeStep.actionLabel} & Inspect Now
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-[8px] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Skip tour
              </button>
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => {
                  const prev = Math.max(0, currentIndex - 1);
                  setCurrentIndex(prev);
                  const stepObj = STEPS[prev];
                  if (stepObj) navigate(stepObj.route);
                }}
                className="neu-btn px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Previous</span>
              </button>
              {currentIndex < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(STEPS.length - 1, currentIndex + 1);
                    setCurrentIndex(next);
                    const stepObj = STEPS[next];
                    if (stepObj) navigate(stepObj.route);
                  }}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#0B8F80] hover:bg-[#087366] text-white text-xs font-semibold flex items-center gap-1"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-[8px] bg-[#15803D] text-white text-xs font-semibold"
                >
                  Finish Walkthrough
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
