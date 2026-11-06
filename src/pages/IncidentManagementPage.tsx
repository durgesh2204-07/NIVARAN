import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  MapPin,
  PlusCircle,
  ShieldAlert,
  Siren,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { HazardType, IncidentStatus } from '../types';

const WORKFLOW_STEPS: IncidentStatus[] = [
  'Reported',
  'Verified',
  'Response Assigned',
  'In Progress',
  'Resolved',
];

export const IncidentManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const incidents = useAppStore((s) => s.incidents);
  const responseTeams = useAppStore((s) => s.responseTeams);
  const villages = useAppStore((s) => s.villages);
  const createIncident = useAppStore((s) => s.createIncident);
  const advanceIncidentStatus = useAppStore((s) => s.advanceIncidentStatus);
  const assignTeamToIncident = useAppStore((s) => s.assignTeamToIncident);

  const [statusFilter, setStatusFilter] = useState<'All' | IncidentStatus>('All');
  const [modalOpen, setModalOpen] = useState<boolean>(
    Boolean(searchParams.get('lat'))
  );

  // New Incident Form state
  const [title, setTitle] = useState('Active Slope Toe Subsidence & Road Blockage');
  const [villageId, setVillageId] = useState(
    searchParams.get('villageId') || villages[0]?.id || 'v-01'
  );
  const [hazardType, setHazardType] = useState<HazardType>('landslide');
  const [severity, setSeverity] = useState<'Critical' | 'High' | 'Moderate'>('Critical');
  const [affectedPop, setAffectedPop] = useState<number>(185);
  const [slaMinutes, setSlaMinutes] = useState<number>(45);
  const [description, setDescription] = useState(
    'Field revenue inspector reported fresh 1.2m tensile scarp crack above hamlet approach road following intense monsoon downpour.'
  );

  const filteredIncidents = incidents.filter((inc) =>
    statusFilter === 'All' ? true : inc.status === statusFilter
  );

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetV = villages.find((v) => v.id === villageId) ?? villages[0];
    const customLat = searchParams.get('lat')
      ? Number(searchParams.get('lat'))
      : targetV.lat;
    const customLng = searchParams.get('lng')
      ? Number(searchParams.get('lng'))
      : targetV.lng;

    createIncident({
      title,
      hazardType,
      severity,
      district: targetV.district,
      villageName: targetV.name,
      lat: customLat,
      lng: customLng,
      affectedPopulation: affectedPop,
      assignedTeamIds: [],
      slaDeadlineMinutes: slaMinutes,
      description,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DC2626]">
            <Siren className="w-4 h-4" />
            <span>SEOC / DEOC Incident Command & Triage System</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white mt-0.5">
            Active Disaster Incidents, Response Dispatch & SLA Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Workflow: Reported → Verified → Response Assigned → In Progress → Resolved
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white text-xs font-bold shadow-sm min-h-[42px]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log New Field Incident</span>
        </button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {(['All', ...WORKFLOW_STEPS] as const).map((st) => {
          const count =
            st === 'All'
              ? incidents.length
              : incidents.filter((i) => i.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                statusFilter === st
                  ? 'bg-[#0B1F33] text-white border-[#0B1F33] dark:bg-[#0E9F8E] dark:border-[#0E9F8E]'
                  : 'bg-white dark:bg-[#11253A] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
              }`}
            >
              {st} ({count})
            </button>
          );
        })}
      </div>

      {/* Incident Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredIncidents.map((inc) => {
          const currentStepIdx = WORKFLOW_STEPS.indexOf(inc.status);
          const nextStep =
            currentStepIdx < WORKFLOW_STEPS.length - 1
              ? WORKFLOW_STEPS[currentStepIdx + 1]
              : null;

          const assignedTeams = responseTeams.filter((t) =>
            inc.assignedTeamIds.includes(t.id)
          );

          return (
            <div
              key={inc.id}
              className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between space-y-4"
            >
              {/* Top Row */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white font-mono text-[11px] font-bold">
                      {inc.code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase text-white ${
                        inc.severity === 'Critical'
                          ? 'bg-[#DC2626]'
                          : inc.severity === 'High'
                          ? 'bg-[#F97316]'
                          : 'bg-[#EAB308]'
                      }`}
                    >
                      {inc.severity}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0E9F8E]/15 text-[#0E9F8E] text-[10px] font-bold uppercase">
                      {inc.status}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    SLA Target: {inc.slaDeadlineMinutes}m
                  </span>
                </div>

                <h2 className="font-heading font-extrabold text-base text-[#0F172A] dark:text-white">
                  {inc.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-[#0E9F8E]" />
                    {inc.villageName}, {inc.district} ({inc.lat.toFixed(3)}°N,{' '}
                    {inc.lng.toFixed(3)}°E)
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#4F46E5]" />
                    {inc.affectedPopulation} citizens affected
                  </span>
                  <span>Reported: {inc.reportedAt}</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {inc.description}
                </p>
              </div>

              {/* 5-Stage Workflow Progress Stepper */}
              <div className="grid grid-cols-5 gap-1 pt-1">
                {WORKFLOW_STEPS.map((st, idx) => {
                  const done = idx <= currentStepIdx;
                  return (
                    <div key={st} className="space-y-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          done
                            ? 'bg-[#0E9F8E]'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                      <div
                        className={`text-[9px] font-bold truncate ${
                          done
                            ? 'text-[#0E9F8E]'
                            : 'text-slate-400'
                        }`}
                      >
                        {st}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Assigned Response Teams & Quick Dispatch */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-[#0F172A] dark:text-white flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#0E9F8E]" />
                    <span>
                      Assigned NDRF / SDRF / Emergency Units ({assignedTeams.length})
                    </span>
                  </span>

                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        assignTeamToIncident(inc.id, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    aria-label="Assign response team"
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#11253A] border border-slate-300 dark:border-slate-700 text-[11px] font-bold"
                  >
                    <option value="">+ Dispatch Response Unit...</option>
                    {responseTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.code} — {team.name} ({team.status})
                      </option>
                    ))}
                  </select>
                </div>

                {assignedTeams.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {assignedTeams.map((t) => (
                      <span
                        key={t.id}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#11253A] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center gap-1.5"
                      >
                        <ShieldAlert className="w-3 h-3 text-[#0E9F8E]" />
                        <span>
                          {t.code}: {t.commanderName} ({t.personnelCount} personnel)
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    No field unit assigned yet — select a unit above to dispatch.
                  </div>
                )}
              </div>

              {/* Incident Timeline Log */}
              <div className="space-y-1.5 max-h-28 overflow-y-auto border-t border-slate-200 dark:border-slate-800 pt-2.5">
                {inc.timeline.map((entry, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] flex items-start justify-between gap-2 text-slate-600 dark:text-slate-300"
                  >
                    <span>
                      <strong className="text-[#0F172A] dark:text-white">
                        {entry.actor}:
                      </strong>{' '}
                      {entry.note}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {entry.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* Advance Workflow Footer */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Logged in SEOC Immutable Incident Diary
                </span>
                {nextStep ? (
                  <button
                    onClick={() => advanceIncidentStatus(inc.id, nextStep)}
                    className="px-4 py-2 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Advance to "{nextStep}"</span>
                  </button>
                ) : (
                  <span className="text-xs font-bold text-[#16A34A] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Incident Resolved
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create New Incident Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[1000] bg-[#0B1F33]/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white dark:bg-[#11253A] w-full max-w-lg rounded-card shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden space-y-4"
          >
            <div className="bg-[#0B1F33] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-heading font-bold text-base">
                Log New Emergency Incident
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Incident Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Habitation</label>
                  <select
                    value={villageId}
                    onChange={(e) => setVillageId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                  >
                    {villages.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Hazard Category</label>
                  <select
                    value={hazardType}
                    onChange={(e) => setHazardType(e.target.value as HazardType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 uppercase"
                  >
                    <option value="landslide">Landslide</option>
                    <option value="flood">Flood</option>
                    <option value="cloudburst">Cloudburst</option>
                    <option value="erosion">Slope Erosion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) =>
                      setSeverity(e.target.value as 'Critical' | 'High' | 'Moderate')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Moderate">Moderate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Affected Citizens</label>
                  <input
                    type="number"
                    value={affectedPop}
                    onChange={(e) => setAffectedPop(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">SLA Target (min)</label>
                  <input
                    type="number"
                    value={slaMinutes}
                    onChange={(e) => setSlaMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Field Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700"
                  required
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-[#0A1624] border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-xs font-bold"
              >
                Register Incident
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
