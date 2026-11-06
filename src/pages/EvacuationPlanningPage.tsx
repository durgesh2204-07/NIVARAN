import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bus,
  CheckCircle2,
  Clock,
  Fuel,
  MapPin,
  Navigation,
  Route,
  ShieldAlert,
  Tent,
  Truck,
  Users,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { NivaranMap } from '../components/NivaranMap';
import { RiskBadge } from '../components/RiskBadge';

type EvacPhase = 'Advisory' | 'Stand-by' | 'Mandatory';

interface EvacZoneItem {
  id: string;
  code: string;
  name: string;
  district: string;
  villageIds: string[];
  phase: EvacPhase;
  assemblyPoint: string;
  destinationCamp: string;
  primaryRoute: string;
  alternateRoute: string;
  distanceKm: number;
  etaMinutes: number;
  corridorCapacityPerHr: number;
  assembledCount: number;
  shelteredCount: number;
}

const INITIAL_EVAC_ZONES: EvacZoneItem[] = [
  {
    id: 'ez-01',
    code: 'EVAC-RGD-01',
    name: 'Irshalwadi & Nanivali Upper Scarp Sector',
    district: 'Raigad',
    villageIds: ['v-01', 'v-06'],
    phase: 'Mandatory',
    assemblyPoint: 'Chowk Gram Panchayat Primary School Ground (142m ASL)',
    destinationCamp: 'Khalapur Multi-Purpose Cyclone & Landslide Shelter',
    primaryRoute: 'NH-48 Chowk Link Road (All-Weather Bitumen)',
    alternateRoute: 'Morbe Dam Service Corridor (4x4 Only)',
    distanceKm: 6.4,
    etaMinutes: 22,
    corridorCapacityPerHr: 420,
    assembledCount: 198,
    shelteredCount: 184,
  },
  {
    id: 'ez-02',
    code: 'EVAC-RGD-02',
    name: 'Taliye & Kondhavi Hill-Toe Basin',
    district: 'Raigad',
    villageIds: ['v-02', 'v-07'],
    phase: 'Mandatory',
    assemblyPoint: 'Mahad MIDC High-Ground Staging Yard',
    destinationCamp: 'Mahad Dr. Babasaheb Ambedkar Bhavan Relief Camp',
    primaryRoute: 'SH-70 Mahad-Raigad Fort Road',
    alternateRoute: 'Birwadi Industrial Bypass',
    distanceKm: 11.2,
    etaMinutes: 34,
    corridorCapacityPerHr: 550,
    assembledCount: 312,
    shelteredCount: 290,
  },
  {
    id: 'ez-03',
    code: 'EVAC-STR-01',
    name: 'Mirgaon & Ambeghar Koyna Rim Sector',
    district: 'Satara',
    villageIds: ['v-03', 'v-08'],
    phase: 'Stand-by',
    assemblyPoint: 'Patan Market Committee High Plinth Yard',
    destinationCamp: 'Koynanagar ZP High School Relief Complex',
    primaryRoute: 'SH-78 Karad-Chiplun Highway',
    alternateRoute: 'Morgiri Ridge Road',
    distanceKm: 8.8,
    etaMinutes: 28,
    corridorCapacityPerHr: 380,
    assembledCount: 145,
    shelteredCount: 110,
  },
  {
    id: 'ez-04',
    code: 'EVAC-RTN-01',
    name: 'Tiware & पोफळी Vashishti Floodplain',
    district: 'Ratnagiri',
    villageIds: ['v-05', 'v-10'],
    phase: 'Advisory',
    assemblyPoint: 'Alore MSEB Colony Community Hall',
    destinationCamp: 'Chiplun DBJ College Indoor Stadium Shelter',
    primaryRoute: 'NH-66 Mumbai-Goa 4-Lane Elevated Section',
    alternateRoute: 'Kumbharli Ghat Lower Spur',
    distanceKm: 14.5,
    etaMinutes: 38,
    corridorCapacityPerHr: 600,
    assembledCount: 90,
    shelteredCount: 65,
  },
];

export const EvacuationPlanningPage: React.FC = () => {
  const {
    villages,
    sites,
    reports,
    weights,
    climateHorizon,
    extraRainfallMm,
    setSelectedVillageId,
    addToast,
    logAuditEvent,
  } = useAppStore();

  const [zones, setZones] = useState<EvacZoneItem[]>(INITIAL_EVAC_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('ez-01');
  const [closureSteps, setClosureSteps] = useState([
    {
      id: 'cl-1',
      label: 'Verify 100% headcount reconciliation between assembly point and shelter register',
      done: true,
    },
    {
      id: 'cl-2',
      label: 'Confirm priority medical transport completed for all special-needs residents',
      done: true,
    },
    {
      id: 'cl-3',
      label: 'Deploy Police & Home Guard perimeter cordon at evacuated Red Zone entry roads',
      done: false,
    },
    {
      id: 'cl-4',
      label: 'Disconnect low-lying LT electrical feeders to prevent electrocution during inundation',
      done: false,
    },
    {
      id: 'cl-5',
      label: 'Transmit signed Evacuation Completion Certificate to District Collector (DEOC)',
      done: false,
    },
  ]);

  const activeZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || zones[0],
    [zones, selectedZoneId]
  );

  // Compute special-needs registry and vehicle/fuel logistics for the active zone
  const zoneLogistics = useMemo(() => {
    const matchedVillages = villages.filter((v) =>
      activeZone.villageIds.includes(v.id)
    );
    const totalPop = matchedVillages.reduce((acc, v) => acc + v.population, 0) || 420;
    const totalHh = matchedVillages.reduce((acc, v) => acc + v.households, 0) || 92;

    const elderlyCount = Math.round(totalPop * 0.14);
    const disabledCount = Math.round(totalPop * 0.035);
    const pregnantCount = Math.round(totalPop * 0.028);
    const specialNeedsTotal = elderlyCount + disabledCount + pregnantCount;

    // Logistics calculation: 42 persons per MSRTC evacuation bus, 4 special-needs per 4x4 ambulance
    const busesRequired = Math.ceil((totalPop - specialNeedsTotal) / 42);
    const ambulancesRequired = Math.ceil(specialNeedsTotal / 6);
    const utilityTrucksRequired = Math.ceil(totalHh / 25);
    // Round-trip fuel at 4.2 km/L for buses & trucks + 30% hill-climb reserve
    const totalRoundTripKm = activeZone.distanceKm * 2;
    const dieselLitresRequired = Math.round(
      ((busesRequired + utilityTrucksRequired) * totalRoundTripKm * 0.42 +
        ambulancesRequired * totalRoundTripKm * 0.18) *
        1.3
    );

    return {
      matchedVillages,
      totalPop,
      totalHh,
      elderlyCount,
      disabledCount,
      pregnantCount,
      specialNeedsTotal,
      busesRequired,
      ambulancesRequired,
      utilityTrucksRequired,
      dieselLitresRequired,
    };
  }, [activeZone, villages]);

  const handleUpdatePhase = (zoneId: string, nextPhase: EvacPhase) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, phase: nextPhase } : z))
    );
    logAuditEvent(
      'EVACUATION_PHASE_CHANGE',
      'Evacuation Planning',
      `Zone ${zoneId.toUpperCase()} set to ${nextPhase} phase.`
    );
    addToast(`Evacuation zone phase updated to ${nextPhase}.`, 'warning');
  };

  const handleIncrementHeadcount = (field: 'assembledCount' | 'shelteredCount', delta: number) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== activeZone.id) return z;
        const nextVal = Math.max(0, Math.min(zoneLogistics.totalPop, z[field] + delta));
        return { ...z, [field]: nextVal };
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neu-raised p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#0B8F80] font-semibold">
            Module 6.11 · Pre-Impact Evacuation Operations
          </div>
          <h1 className="text-xl font-bold mt-0.5">
            Evacuation Planning, Special-Needs Registry & Route Logistics
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Phased evacuation zones (Advisory · Stand-by · Mandatory), assembly point headcounts, MSRTC vehicle & fuel requirements, and handover checklists.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded bg-[#B91C1C] text-white font-bold">
            {zones.filter((z) => z.phase === 'Mandatory').length} Mandatory Zones Active
          </span>
        </div>
      </div>

      {/* Evacuation Zones Table + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Evacuation Zone Selector & Phase Control */}
        <div className="lg:col-span-7 space-y-4">
          <div className="neu-raised p-4 space-y-3">
            <h2 className="text-base font-bold">Designated Evacuation Zones</h2>
            <div className="neu-flat overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2.5 px-3">Zone Code & Sector</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Phase</th>
                    <th className="py-2.5 px-3 text-right">Headcount</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {zones.map((z) => {
                    const isSelected = z.id === activeZone.id;
                    const phaseBadgeColor =
                      z.phase === 'Mandatory'
                        ? 'bg-[#B91C1C] text-white'
                        : z.phase === 'Stand-by'
                        ? 'bg-[#EA580C] text-white'
                        : 'bg-[#CA8A04] text-white';
                    return (
                      <tr
                        key={z.id}
                        onClick={() => setSelectedZoneId(z.id)}
                        className={`cursor-pointer ${
                          isSelected ? 'bg-[#0B8F80]/10' : 'hover:bg-black/5'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold block">{z.code}</span>
                          <span className="text-[var(--text-secondary)]">{z.name}</span>
                        </td>
                        <td className="py-2.5 px-3 font-medium">{z.district}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${phaseBadgeColor}`}
                          >
                            {z.phase}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {z.shelteredCount} sheltered / {z.assembledCount} staged
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <select
                            value={z.phase}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleUpdatePhase(z.id, e.target.value as EvacPhase)
                            }
                            aria-label={`Set evacuation phase for ${z.name}`}
                            className="neu-input px-2 py-1 text-[11px] font-semibold"
                          >
                            <option value="Advisory">Advisory</option>
                            <option value="Stand-by">Stand-by</option>
                            <option value="Mandatory">Mandatory</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Zone Route Options, Vehicle & Fuel Calculator */}
          <div className="neu-raised p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-2">
              <div>
                <span className="font-mono text-xs text-[#0B8F80] font-bold">
                  {activeZone.code}
                </span>
                <h3 className="text-base font-bold">{activeZone.name}</h3>
              </div>
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                Total Residents: {zoneLogistics.totalPop} ({zoneLogistics.totalHh} HH)
              </span>
            </div>

            {/* Assembly Point & Route Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="neu-flat p-3 space-y-1">
                <span className="text-[var(--text-secondary)] font-semibold block">
                  Staging Assembly Point
                </span>
                <p className="font-bold">{activeZone.assemblyPoint}</p>
                <span className="text-[var(--text-secondary)] block pt-1">
                  Receiving Relief Shelter:
                </span>
                <p className="font-semibold text-[#0B8F80]">{activeZone.destinationCamp}</p>
              </div>

              <div className="neu-flat p-3 space-y-1">
                <span className="text-[var(--text-secondary)] font-semibold block">
                  Route Options & Corridor Capacity
                </span>
                <p className="font-semibold">Primary: {activeZone.primaryRoute}</p>
                <p className="text-[var(--text-secondary)]">
                  Alternate: {activeZone.alternateRoute}
                </p>
                <p className="font-mono text-[11px] pt-1">
                  Dist: {activeZone.distanceKm} km · ETA: {activeZone.etaMinutes} min · Cap:{' '}
                  {activeZone.corridorCapacityPerHr} pers/hr
                </p>
              </div>
            </div>

            {/* Vehicle & Fuel Requirement Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="neu-flat p-3">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Bus className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                  <span>MSRTC Buses</span>
                </div>
                <div className="font-mono text-lg font-bold mt-1">
                  {zoneLogistics.busesRequired} units
                </div>
              </div>
              <div className="neu-flat p-3">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#B91C1C]" strokeWidth={1.75} />
                  <span>4×4 Ambulances</span>
                </div>
                <div className="font-mono text-lg font-bold mt-1">
                  {zoneLogistics.ambulancesRequired} units
                </div>
              </div>
              <div className="neu-flat p-3">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Truck className="w-3.5 h-3.5 text-[#EA580C]" strokeWidth={1.75} />
                  <span>Utility Trucks</span>
                </div>
                <div className="font-mono text-lg font-bold mt-1">
                  {zoneLogistics.utilityTrucksRequired} units
                </div>
              </div>
              <div className="neu-flat p-3">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Fuel className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.75} />
                  <span>Diesel Reserve</span>
                </div>
                <div className="font-mono text-lg font-bold mt-1">
                  {zoneLogistics.dieselLitresRequired} L
                </div>
              </div>
            </div>

            {/* Special-Needs Registry & Live Headcount Tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="neu-flat p-3 space-y-2">
                <span className="font-bold block">
                  Special-Needs Registry (Priority Evacuation)
                </span>
                <div className="flex justify-between">
                  <span>Elderly (&gt;65 yrs):</span>
                  <span className="font-mono font-bold">{zoneLogistics.elderlyCount} persons</span>
                </div>
                <div className="flex justify-between">
                  <span>Persons with Disabilities:</span>
                  <span className="font-mono font-bold">{zoneLogistics.disabledCount} persons</span>
                </div>
                <div className="flex justify-between">
                  <span>Pregnant & Lactating Mothers:</span>
                  <span className="font-mono font-bold">{zoneLogistics.pregnantCount} persons</span>
                </div>
              </div>

              <div className="neu-flat p-3 space-y-2">
                <span className="font-bold block">
                  Live Headcount Reconciliation
                </span>
                <div className="flex items-center justify-between">
                  <span>At Assembly Point:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold">
                      {activeZone.assembledCount} / {zoneLogistics.totalPop}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrementHeadcount('assembledCount', 15)}
                      className="neu-btn px-2 py-0.5 text-[11px] font-bold"
                    >
                      +15
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Checked into Shelter:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#15803D]">
                      {activeZone.shelteredCount} / {zoneLogistics.totalPop}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleIncrementHeadcount('shelteredCount', 15)}
                      className="neu-btn px-2 py-0.5 text-[11px] font-bold"
                    >
                      +15
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: 3D Evacuation Corridor Map + Closure/Handover Checklist */}
        <div className="lg:col-span-5 space-y-4">
          <div className="neu-raised p-3">
            <NivaranMap
              villages={villages}
              sites={sites}
              reports={reports}
              weights={weights}
              climateHorizon={climateHorizon}
              extraRainfallMm={extraRainfallMm}
              onSelectVillage={(v) => setSelectedVillageId(v.id)}
              heightClass="h-[360px]"
              showRelocationLines
            />
          </div>

          <div className="neu-raised p-4 space-y-3 text-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Evacuation Closure & Handover Checklist
            </h3>
            <div className="space-y-2">
              {closureSteps.map((step) => (
                <label
                  key={step.id}
                  className="neu-flat p-2.5 flex items-start gap-2.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={step.done}
                    onChange={() =>
                      setClosureSteps((prev) =>
                        prev.map((s) => (s.id === step.id ? { ...s, done: !s.done } : s))
                      )
                    }
                    className="mt-0.5 accent-[#0B8F80]"
                  />
                  <span className={step.done ? 'line-through text-[var(--text-secondary)]' : 'font-medium'}>
                    {step.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
