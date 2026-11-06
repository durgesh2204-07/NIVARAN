import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  ClipboardCheck,
  FileDown,
  HeartPulse,
  Home,
  Package,
  Plus,
  Send,
  WifiOff,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface DamageRecord {
  id: string;
  code: string;
  villageName: string;
  district: string;
  assessedAt: string;
  officerName: string;
  housesFullyDestroyed: number;
  housesSeverelyDamaged: number;
  housesPartiallyDamaged: number;
  fatalities: number;
  injured: number;
  cropAreaHaDamaged: number;
  livestockLost: number;
  roadsCutKm: number;
  culvertsDamaged: number;
  foodPacketsNeeded: number;
  tarpaulinsNeeded: number;
  estimatedReliefInrLakhs: number;
  status: 'Verified for SDRF Disbursement' | 'Pending Tehsildar Review';
}

const INITIAL_DAMAGE_RECORDS: DamageRecord[] = [
  {
    id: 'dna-01',
    code: 'DNA-RGD-2026-01',
    villageName: 'Irshalwadi',
    district: 'Raigad',
    assessedAt: '2026-10-10 11:15 IST',
    officerName: 'S. K. Kadam (Tahsildar / Revenue)',
    housesFullyDestroyed: 19,
    housesSeverelyDamaged: 14,
    housesPartiallyDamaged: 11,
    fatalities: 0,
    injured: 3,
    cropAreaHaDamaged: 18.5,
    livestockLost: 6,
    roadsCutKm: 2.4,
    culvertsDamaged: 2,
    foodPacketsNeeded: 450,
    tarpaulinsNeeded: 65,
    estimatedReliefInrLakhs: 48.6,
    status: 'Verified for SDRF Disbursement',
  },
  {
    id: 'dna-02',
    code: 'DNA-RGD-2026-02',
    villageName: 'Taliye',
    district: 'Raigad',
    assessedAt: '2026-10-10 12:40 IST',
    officerName: 'R. M. Patil (Circle Officer)',
    housesFullyDestroyed: 12,
    housesSeverelyDamaged: 21,
    housesPartiallyDamaged: 18,
    fatalities: 0,
    injured: 2,
    cropAreaHaDamaged: 32.0,
    livestockLost: 9,
    roadsCutKm: 3.8,
    culvertsDamaged: 3,
    foodPacketsNeeded: 620,
    tarpaulinsNeeded: 80,
    estimatedReliefInrLakhs: 54.2,
    status: 'Verified for SDRF Disbursement',
  },
  {
    id: 'dna-03',
    code: 'DNA-STR-2026-03',
    villageName: 'Mirgaon',
    district: 'Satara',
    assessedAt: '2026-10-10 13:50 IST',
    officerName: 'V. D. Jadhav (Junior Engineer, PWD)',
    housesFullyDestroyed: 5,
    housesSeverelyDamaged: 11,
    housesPartiallyDamaged: 16,
    fatalities: 0,
    injured: 1,
    cropAreaHaDamaged: 14.2,
    livestockLost: 2,
    roadsCutKm: 1.9,
    culvertsDamaged: 1,
    foodPacketsNeeded: 280,
    tarpaulinsNeeded: 40,
    estimatedReliefInrLakhs: 22.8,
    status: 'Pending Tehsildar Review',
  },
];

export const DamageAssessmentPage: React.FC = () => {
  const { villages, user, isOfflineSimulated, addToast, logAuditEvent } = useAppStore();
  const [records, setRecords] = useState<DamageRecord[]>(INITIAL_DAMAGE_RECORDS);

  // Rapid Assessment Form State
  const [villageId, setVillageId] = useState('v-01');
  const [housesFull, setHousesFull] = useState(4);
  const [housesSevere, setHousesSevere] = useState(8);
  const [housesPartial, setHousesPartial] = useState(12);
  const [injured, setInjured] = useState(0);
  const [cropHa, setCropHa] = useState(6.5);
  const [livestock, setLivestock] = useState(2);
  const [roadsKm, setRoadsKm] = useState(1.2);
  const [culverts, setCulverts] = useState(1);
  const [foodPackets, setFoodPackets] = useState(200);
  const [tarpaulins, setTarpaulins] = useState(35);

  const rollups = useMemo(() => {
    return records.reduce(
      (acc, r) => {
        acc.full += r.housesFullyDestroyed;
        acc.severe += r.housesSeverelyDamaged;
        acc.partial += r.housesPartiallyDamaged;
        acc.cropHa += r.cropAreaHaDamaged;
        acc.roadsKm += r.roadsCutKm;
        acc.reliefLakhs += r.estimatedReliefInrLakhs;
        return acc;
      },
      { full: 0, severe: 0, partial: 0, cropHa: 0, roadsKm: 0, reliefLakhs: 0 }
    );
  }, [records]);

  const handleSubmitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetV = villages.find((v) => v.id === villageId) || villages[0];
    // SDRF norm calculation: ₹1.20L per fully destroyed house, ₹0.60L severe, ₹0.15L partial + infra
    const reliefLakhs = Number(
      (
        housesFull * 1.2 +
        housesSevere * 0.6 +
        housesPartial * 0.15 +
        cropHa * 0.18 +
        roadsKm * 2.5
      ).toFixed(1)
    );

    const newRec: DamageRecord = {
      id: `dna-${Date.now()}`,
      code: `DNA-${targetV.district.slice(0, 3).toUpperCase()}-2026-0${records.length + 1}`,
      villageName: targetV.name,
      district: targetV.district,
      assessedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      officerName: user?.name || 'Field Assessment Team',
      housesFullyDestroyed: housesFull,
      housesSeverelyDamaged: housesSevere,
      housesPartiallyDamaged: housesPartial,
      fatalities: 0,
      injured,
      cropAreaHaDamaged: cropHa,
      livestockLost: livestock,
      roadsCutKm: roadsKm,
      culvertsDamaged: culverts,
      foodPacketsNeeded: foodPackets,
      tarpaulinsNeeded: tarpaulins,
      estimatedReliefInrLakhs: reliefLakhs,
      status: 'Pending Tehsildar Review',
    };

    setRecords([newRec, ...records]);
    logAuditEvent(
      'SUBMITTED_DAMAGE_ASSESSMENT',
      'Damage & Needs Assessment',
      `Filed ${newRec.code} for ${targetV.name} (Est. SDRF outlay: ₹${reliefLakhs}L).`
    );
    addToast(
      `Rapid Damage Assessment ${newRec.code} logged and rolled up to District & State summary.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neu-raised p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#0B8F80] font-semibold">
            Module 6.13 · Post-Incident & Pre-Monsoon Rapid Assessment
          </div>
          <h1 className="text-xl font-bold mt-0.5">
            Damage and Needs Assessment (PDNA / SDRF Norms)
          </h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Field rapid assessment forms rolling up housing damage, infrastructure loss and immediate relief requirements to District and State summaries.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isOfflineSimulated ? (
            <span className="px-3 py-1.5 rounded bg-[#CA8A04] text-white font-semibold flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Offline Queue Mode Active</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded bg-[#15803D] text-white font-semibold">
              Synced with Revenue & Relief Ledger
            </span>
          )}
        </div>
      </div>

      {/* State & District Roll-Up KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="neu-raised p-4">
          <span className="text-xs text-[var(--text-secondary)] block">
            Houses Damaged (Full / Severe / Partial)
          </span>
          <span className="font-mono text-2xl font-bold mt-1 block">
            {rollups.full} / {rollups.severe} / {rollups.partial}
          </span>
        </div>
        <div className="neu-raised p-4">
          <span className="text-xs text-[var(--text-secondary)] block">
            Agricultural & Horticulture Loss
          </span>
          <span className="font-mono text-2xl font-bold mt-1 block">
            {rollups.cropHa.toFixed(1)} ha
          </span>
        </div>
        <div className="neu-raised p-4">
          <span className="text-xs text-[var(--text-secondary)] block">
            Ghat & Rural Roads Cut
          </span>
          <span className="font-mono text-2xl font-bold mt-1 block">
            {rollups.roadsKm.toFixed(1)} km
          </span>
        </div>
        <div className="neu-raised p-4">
          <span className="text-xs text-[var(--text-secondary)] block">
            Estimated SDRF Relief Outlay
          </span>
          <span className="font-mono text-2xl font-bold text-[#0B8F80] mt-1 block">
            ₹{rollups.reliefLakhs.toFixed(1)} Lakhs
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Rapid Field Assessment Form */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmitAssessment} className="neu-raised p-5 space-y-4 text-xs">
            <div className="border-b border-[var(--border)] pb-2">
              <h2 className="text-base font-bold">Rapid Field Assessment Entry</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Feeds directly into Relief Supply Dispatch and Household Compensation Cases.
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1">Habitation</label>
              <select
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                className="neu-input px-3 py-2 w-full"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.taluka}, {v.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold mb-1">Fully Destroyed</label>
                <input
                  type="number"
                  min={0}
                  value={housesFull}
                  onChange={(e) => setHousesFull(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Severely Damaged</label>
                <input
                  type="number"
                  min={0}
                  value={housesSevere}
                  onChange={(e) => setHousesSevere(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Partially Damaged</label>
                <input
                  type="number"
                  min={0}
                  value={housesPartial}
                  onChange={(e) => setHousesPartial(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold mb-1">Injuries</label>
                <input
                  type="number"
                  min={0}
                  value={injured}
                  onChange={(e) => setInjured(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Crop Loss (ha)</label>
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  value={cropHa}
                  onChange={(e) => setCropHa(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Livestock Lost</label>
                <input
                  type="number"
                  min={0}
                  value={livestock}
                  onChange={(e) => setLivestock(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">Roads Cut (km)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  value={roadsKm}
                  onChange={(e) => setRoadsKm(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Culverts / Bridges</label>
                <input
                  type="number"
                  min={0}
                  value={culverts}
                  onChange={(e) => setCulverts(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1">Immediate Food Packets</label>
                <input
                  type="number"
                  min={0}
                  value={foodPackets}
                  onChange={(e) => setFoodPackets(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Tarpaulin Sheets</label>
                <input
                  type="number"
                  min={0}
                  value={tarpaulins}
                  onChange={(e) => setTarpaulins(Number(e.target.value))}
                  className="neu-input px-2.5 py-1.5 w-full font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-[10px] bg-[#0B8F80] text-white font-bold flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" strokeWidth={1.75} />
              <span>File Damage & Needs Assessment</span>
            </button>
          </form>
        </div>

        {/* Right: District & State Assessment Register */}
        <div className="lg:col-span-7">
          <div className="neu-raised p-5 space-y-4">
            <h2 className="text-base font-bold">
              District & State Damage Roll-Up Register ({records.length})
            </h2>
            <div className="neu-flat overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2.5 px-3">Assessment ID & Habitation</th>
                    <th className="py-2.5 px-3 text-right">Houses (F/S/P)</th>
                    <th className="py-2.5 px-3 text-right">Infra & Crops</th>
                    <th className="py-2.5 px-3 text-right">Relief Needs</th>
                    <th className="py-2.5 px-3 text-right">SDRF Outlay</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold block">{r.code}</span>
                        <span>
                          {r.villageName}, {r.district}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {r.housesFullyDestroyed} / {r.housesSeverelyDamaged} /{' '}
                        {r.housesPartiallyDamaged}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {r.roadsCutKm} km road · {r.cropAreaHaDamaged} ha
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {r.foodPacketsNeeded} pkts · {r.tarpaulinsNeeded} tarp
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0B8F80]">
                        ₹{r.estimatedReliefInrLakhs.toFixed(1)}L
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.status.includes('Verified')
                              ? 'bg-[#15803D] text-white'
                              : 'bg-[#CA8A04] text-white'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
