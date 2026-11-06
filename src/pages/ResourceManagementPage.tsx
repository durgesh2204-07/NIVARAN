import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  Send,
  Shield,
  Tent,
  Truck,
  Users,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ResourceManagementPage: React.FC = () => {
  const responseTeams = useAppStore((s) => s.responseTeams);
  const resourceStock = useAppStore((s) => s.resourceStock);
  const reliefCamps = useAppStore((s) => s.reliefCamps);
  const incidents = useAppStore((s) => s.incidents);
  const deployResourceItem = useAppStore((s) => s.deployResourceItem);
  const updateCampOccupancy = useAppStore((s) => s.updateCampOccupancy);
  const assignTeamToIncident = useAppStore((s) => s.assignTeamToIncident);

  const [activeTab, setActiveTab] = useState<'camps' | 'teams' | 'stock'>('camps');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [deployTargetIncident, setDeployTargetIncident] = useState<string>(
    incidents[0]?.code || 'INC-MH-2026-01'
  );

  const filteredCamps = reliefCamps.filter((c) =>
    districtFilter === 'All' ? true : c.district === districtFilter
  );

  const totalShelterCapacity = reliefCamps.reduce((s, c) => s + c.capacityPersons, 0);
  const totalCurrentOccupancy = reliefCamps.reduce((s, c) => s + c.currentOccupancy, 0);
  const lowStockCount = resourceStock.filter(
    (r) => r.availableQty <= r.minThresholdQty
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E9F8E]">
            <Truck className="w-4 h-4" />
            <span>IDRN — India Disaster Resource Network & Shelter Registry</span>
          </div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white mt-0.5">
            Response Teams, Relief Equipment & Emergency Shelter Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage {reliefCamps.length} verified relief shelters, {responseTeams.length}{' '}
            specialized NDRF/SDRF units, and emergency stockpile logistics.
          </p>
        </div>

        {/* Summary KPI Pills */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
            Shelter Occupancy: {totalCurrentOccupancy.toLocaleString()} /{' '}
            {totalShelterCapacity.toLocaleString()} Citizens
          </div>
          {lowStockCount > 0 && (
            <div className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{lowStockCount} Low-Stock Alert(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs + District Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              id: 'camps' as const,
              label: `Emergency Shelters & Relief Camps (${reliefCamps.length})`,
              icon: Tent,
            },
            {
              id: 'teams' as const,
              label: `NDRF / SDRF / Fire / Medical Units (${responseTeams.length})`,
              icon: Users,
            },
            {
              id: 'stock' as const,
              label: `Relief Equipment & Stockpile (${resourceStock.length})`,
              icon: PackageCheck,
            },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                  activeTab === t.id
                    ? 'bg-[#0B1F33] text-white border-[#0B1F33] dark:bg-[#0E9F8E] dark:border-[#0E9F8E]'
                    : 'bg-white dark:bg-[#11253A] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          aria-label="Filter by District"
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#11253A] border border-slate-200 dark:border-slate-700 text-xs font-bold"
        >
          <option value="All">All Districts</option>
          <option value="Raigad">Raigad</option>
          <option value="Ratnagiri">Ratnagiri</option>
          <option value="Pune">Pune</option>
          <option value="Satara">Satara</option>
          <option value="Kolhapur">Kolhapur</option>
        </select>
      </div>

      {/* TAB 1: 25 Relief Camps / Emergency Shelters */}
      {activeTab === 'camps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCamps.map((camp) => {
            const pct = Math.round(
              (camp.currentOccupancy / Math.max(1, camp.capacityPersons)) * 100
            );
            const barColor =
              pct >= 90
                ? 'bg-[#DC2626]'
                : pct >= 65
                ? 'bg-[#F97316]'
                : 'bg-[#16A34A]';

            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-[#11253A] rounded-card p-4 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between space-y-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
                        {camp.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {camp.taluka} Taluka, {camp.district} District
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        camp.status === 'Full'
                          ? 'bg-red-500/15 text-red-600'
                          : camp.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                </div>

                {/* Occupancy Bar & Live +/- Controls */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/70 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Live Occupancy:</span>
                    <span className="font-bold tabular-nums text-[#0F172A] dark:text-white">
                      {camp.currentOccupancy} / {camp.capacityPersons} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${barColor} transition-all`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Check-in / Check-out Evacuees:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCampOccupancy(camp.id, -10)}
                        className="p-1.5 rounded-lg bg-white dark:bg-[#11253A] border border-slate-200 dark:border-slate-700 hover:border-[#0E9F8E]"
                        title="Check out 10 evacuees"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => updateCampOccupancy(camp.id, 10)}
                        className="p-1.5 rounded-lg bg-[#0E9F8E] text-white hover:bg-[#0B8375]"
                        title="Check in 10 evacuees"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* SPHERE Facility Checklist */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  {[
                    ['RO Water', camp.facilities.drinkingWater],
                    ['Medical Desk', camp.facilities.medicalDesk],
                    ['Sanitation', camp.facilities.sanitationToilets],
                    ['DG Power', camp.facilities.generatorPower],
                    ['Hot Kitchen', camp.facilities.communityKitchen],
                  ].map(([label, ok]) => (
                    <span
                      key={String(label)}
                      className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 ${
                        ok
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/10 text-amber-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{label}</span>
                    </span>
                  ))}
                </div>

                {/* Camp In-charge */}
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>In-Charge: {camp.inChargeName}</span>
                  <a
                    href={`tel:${camp.contactPhone}`}
                    className="inline-flex items-center gap-1 text-[#0E9F8E] font-bold hover:underline"
                  >
                    <Phone className="w-3 h-3" /> {camp.contactPhone}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Response Teams (NDRF / SDRF / Fire / Medical) */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {responseTeams.map((team) => (
            <div
              key={team.id}
              className="bg-white dark:bg-[#11253A] rounded-card p-5 border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between space-y-4 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#0B1F33] text-white font-mono text-[11px] font-bold">
                      {team.code}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-bold text-[10px]">
                      {team.unitType}
                    </span>
                  </div>
                  <h3 className="font-heading font-extrabold text-base text-[#0F172A] dark:text-white mt-1.5">
                    {team.name}
                  </h3>
                  <div className="text-slate-500 mt-0.5">
                    Base District: {team.district} • Commander: {team.commanderName} (
                    {team.contactPhone})
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    team.status === 'Available'
                      ? 'bg-emerald-500/15 text-emerald-600'
                      : 'bg-amber-500/15 text-amber-600'
                  }`}
                >
                  {team.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624]">
                  <div className="text-[10px] text-slate-400">Strength</div>
                  <div className="font-bold text-sm">{team.personnelCount} Personnel</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624]">
                  <div className="text-[10px] text-slate-400">GPS Coordinates</div>
                  <div className="font-mono font-bold">
                    {team.lat.toFixed(3)}°N, {team.lng.toFixed(3)}°E
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1624]">
                  <div className="text-[10px] text-slate-400">Telemetry Sync</div>
                  <div className="font-bold text-[#0E9F8E]">{team.lastUpdated}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#0E9F8E]" />
                  <span>Assign to Active Incident:</span>
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      assignTeamToIncident(e.target.value, team.id);
                      e.target.value = '';
                    }
                  }}
                  aria-label="Dispatch team to incident"
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-bold"
                >
                  <option value="">Select Incident to Dispatch...</option>
                  {incidents
                    .filter((i) => i.status !== 'Resolved')
                    .map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.code}: {inc.villageName} ({inc.severity})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Relief Equipment & Stockpile */}
      {activeTab === 'stock' && (
        <div className="bg-white dark:bg-[#11253A] rounded-card border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-heading font-bold text-sm">
              District Warehouse Inventory & Rapid Allocation
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">
                Target Incident for Dispatch:
              </span>
              <select
                value={deployTargetIncident}
                onChange={(e) => setDeployTargetIncident(e.target.value)}
                aria-label="Target incident for equipment dispatch"
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-bold"
              >
                {incidents.map((inc) => (
                  <option key={inc.id} value={inc.code}>
                    {inc.code} — {inc.villageName} ({inc.district})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0A1624] text-slate-500 uppercase text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Equipment / Relief Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Warehouse Location</th>
                  <th className="py-3.5 px-3">Available</th>
                  <th className="py-3.5 px-3">Deployed</th>
                  <th className="py-3.5 px-3">Stock Health</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 tabular-nums">
                {resourceStock.map((item) => {
                  const isLow = item.availableQty <= item.minThresholdQty;
                  return (
                    <tr key={item.id}>
                      <td className="py-3.5 px-4 font-bold text-[#0F172A] dark:text-white">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {item.warehouseLocation} ({item.district})
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-sm text-[#0E9F8E]">
                        {item.availableQty.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3.5 px-3 font-semibold">
                        {item.deployedQty.toLocaleString()} {item.unit}
                      </td>
                      <td className="py-3.5 px-3">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Low Stock (&le;
                            {item.minThresholdQty})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Optimal
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() =>
                            deployResourceItem(
                              item.id,
                              item.unit === 'packets' ? 200 : 2,
                              deployTargetIncident
                            )
                          }
                          disabled={item.availableQty <= 0}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B1F33] hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-[11px]"
                        >
                          <Send className="w-3 h-3 text-[#0E9F8E]" />
                          <span>
                            Dispatch +{item.unit === 'packets' ? '200' : '2'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
