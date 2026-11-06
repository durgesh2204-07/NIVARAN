import React, { useMemo, useState } from 'react';
import {
  Contrast,
  Database,
  Download,
  Flame,
  Globe,
  Moon,
  RotateCcw,
  Shield,
  Sun,
  Trash2,
  UserCheck,
  Palette,
} from 'lucide-react';
import Papa from 'papaparse';
import { useAppStore, NivaranTheme } from '../store/useAppStore';
import { Language, OrganisationType, TextSize } from '../types';

export const SettingsPage: React.FC = () => {
  const {
    user,
    switchOrganisationQuick,
    language,
    setLanguage,
    darkMode,
    toggleDarkMode,
    textSize,
    setTextSize,
    highContrast,
    toggleHighContrast,
    currentTheme,
    setTheme,
    resetWeights,
    scoringVersions,
    currentMethodVersion,
    partnerRequests,
    resolvePartnerAccessRequest,
    auditLogs,
    isUsingDemoSeedData,
    resetDemoSeedData,
    clearDemoSeedData,
    drillModeActive,
    toggleDrillMode,
    activeAlertZones,
    reliefCamps,
    volunteers,
    resourceStock,
    householdCases,
    addToast,
  } = useAppStore();

  const isAdmin =
    user?.role === 'administrator' ||
    user?.role === 'sdma' ||
    user?.role === 'national_authority';

  const [auditFilterModule, setAuditFilterModule] = useState<string>('All');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const matchesModule =
        auditFilterModule === 'All' ||
        l.module.toLowerCase().includes(auditFilterModule.toLowerCase());
      const matchesQuery =
        !auditSearchQuery.trim() ||
        l.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        l.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        l.actorName.toLowerCase().includes(auditSearchQuery.toLowerCase());
      return matchesModule && matchesQuery;
    });
  }, [auditLogs, auditFilterModule, auditSearchQuery]);

  const handleExportAuditCsv = () => {
    const csv = Papa.unparse(filteredAuditLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nivaran-Audit-Log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Audit log exported to CSV.', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="neu-raised p-4">
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          {language === 'hi'
            ? 'सेटिंग्स: प्रोफ़ाइल, भाषा और प्रशासन (Settings)'
            : 'Settings: Profile, Language & Administration'}
        </h1>
        <p className="text-xs text-[var(--text-secondary)]">
          Profile and language settings for your active role. Administrative controls are visible to Administrator roles only.
        </p>
      </div>

      {/* 1. PROFILE & LANGUAGE (Visible to all roles) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Profile Card */}
        <div className="neu-raised p-4 space-y-3 text-xs">
          <h2 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <UserCheck className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
            <span>Active Profile &amp; Role</span>
          </h2>

          <div className="neu-flat p-3.5 rounded-[10px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Name:</span>
              <span className="font-bold text-[var(--text-primary)]">
                {user?.name || 'Guest Citizen'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Unit / Designation:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {user?.unitName || user?.designation}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Jurisdiction:</span>
              <span className="font-mono font-bold text-[#0B8F80]">
                {user?.jurisdictionLevel || 'District'} ({user?.district || 'Raigad'})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Role Scope:</span>
              <span className="px-2 py-0.5 rounded bg-[#0B1F33] text-white font-mono text-[11px] font-bold">
                {user?.orgRole || user?.role}
              </span>
            </div>
          </div>

          <div className="neu-flat p-3 rounded-[10px] flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-[var(--text-secondary)]">
              Switch active role preset:
            </span>
            <select
              value={user?.organisationType || 'state'}
              onChange={(e) =>
                switchOrganisationQuick(e.target.value as OrganisationType)
              }
              className="neu-input px-3 py-1.5 text-xs font-semibold"
            >
              <option value="national">National Authority (NDMA — Admin)</option>
              <option value="state">State Authority (SDMA — Admin)</option>
              <option value="district">District Authority (DDMA Officer)</option>
              <option value="response_forces">Response Forces (NDRF / SDRF)</option>
              <option value="departments">Departments (GSI / IMD / Revenue)</option>
              <option value="partners">Relief Partner (Red Cross / Aapda Mitra)</option>
              <option value="citizen">Citizen / Public View</option>
            </select>
          </div>
        </div>

        {/* Language & Accessibility Card */}
        <div className="neu-raised p-4 space-y-3 text-xs">
          <h2 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
            <Globe className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
            <span>Language, Text Size &amp; Contrast</span>
          </h2>

          <div className="neu-flat p-3 rounded-[10px] flex items-center justify-between">
            <div>
              <span className="font-bold block">Language (English / हिन्दी / मराठी)</span>
              <span className="text-[var(--text-secondary)]">
                Applies across navigation, alerts and labels
              </span>
            </div>
            <div className="neu-inset p-1 flex gap-1">
              {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    language === l ? 'bg-[#0B8F80] text-white' : ''
                  }`}
                >
                  {l === 'en' ? 'English' : l === 'hi' ? 'हिन्दी' : 'मराठी'}
                </button>
              ))}
            </div>
          </div>

          <div className="neu-flat p-3 rounded-[10px] flex items-center justify-between">
            <div>
              <span className="font-bold block">Text Size (WCAG AA)</span>
              <span className="text-[var(--text-secondary)]">100%, 115% or 130%</span>
            </div>
            <div className="neu-inset p-1 flex gap-1">
              {(['100', '115', '130'] as TextSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setTextSize(sz)}
                  className={`px-2.5 py-1 rounded font-mono font-semibold ${
                    textSize === sz ? 'bg-[#0B1F33] text-white' : ''
                  }`}
                >
                  {sz}%
                </button>
              ))}
            </div>
          </div>

          <div className="neu-flat p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold block text-sm">Theme System & Command Styling</span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Choose from 5 unified command themes across the platform
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#008060] uppercase">
                {currentTheme}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              {[
                { id: 'nivaran-light', name: 'NIVARAN Light', color: '#008060', bg: '#FFFFFF' },
                { id: 'nivaran-dark', name: 'NIVARAN Dark', color: '#10B981', bg: '#1E293B' },
                { id: 'midnight', name: 'Midnight', color: '#00F5D4', bg: '#0E1A33' },
                { id: 'forest', name: 'Forest', color: '#84CC16', bg: '#0E2E1F' },
                { id: 'high-contrast', name: 'High Contrast', color: '#FACC15', bg: '#000000' },
              ].map((th) => (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setTheme(th.id as NivaranTheme)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    currentTheme === th.id
                      ? 'border-[#008060] ring-2 ring-[#008060]/30 shadow-sm'
                      : 'border-[var(--border)] hover:bg-[var(--surface-flat)]'
                  }`}
                  style={{ backgroundColor: th.bg }}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                      style={{ backgroundColor: th.color }}
                    />
                    {currentTheme === th.id && (
                      <span className="w-2 h-2 rounded-full bg-[#008060]" />
                    )}
                  </div>
                  <span
                    className="text-xs font-bold leading-tight"
                    style={{ color: th.id === 'nivaran-light' ? '#0F172A' : '#FFFFFF' }}
                  >
                    {th.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ADMIN SECTION (Visible ONLY to Admin Role per Section 1) */}
      {isAdmin ? (
        <div className="space-y-4">
          {/* Demo Seed Data & Persistent Operational Database Controls */}
          <div className="neu-raised p-4 space-y-3 text-xs border-l-4 border-[#0B8F80]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Admin Only: Demo Seed Data &amp; Persistent IndexedDB / BroadcastChannel Store
                </h2>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold text-white ${
                    isUsingDemoSeedData ? 'bg-[#CA8A04]' : 'bg-[#15803D]'
                  }`}
                >
                  {isUsingDemoSeedData ? 'DEMO SEED DATA LOADED' : 'CLEAN PRODUCTION STATE'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDrillMode()}
                  className={`px-3 py-1.5 rounded-[8px] font-bold flex items-center gap-1.5 text-white ${
                    drillModeActive ? 'bg-[#EA580C]' : 'bg-[#0B1F33]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>{drillModeActive ? 'End Mock Drill Mode' : 'Start Mock Drill Mode'}</span>
                </button>
                <button
                  type="button"
                  onClick={resetDemoSeedData}
                  className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Reset Demo Data</span>
                </button>
                <button
                  type="button"
                  onClick={clearDemoSeedData}
                  className="px-3 py-1.5 rounded-[8px] bg-[#B91C1C] text-white font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Clear Demo Data (Use Real Only)</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              All operational state (CAP Alert Zones: {activeAlertZones.length}, Shelters: {reliefCamps.length}, Volunteers: {volunteers.length}, IDRN Resources: {resourceStock.length}, Relocation Cases: {householdCases.length}) is persisted in IndexedDB (<code>nivaran_operational_db_v2</code>) and synchronized live across open browser tabs via <code>BroadcastChannel</code>.
            </p>
          </div>

          <div className="neu-raised p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Admin Only: Partner Access Requests ({partnerRequests.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={resetWeights}
                className="neu-btn px-3 py-1.5 font-semibold flex items-center gap-1 text-[#0B8F80]"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Reset Scoring Method ({currentMethodVersion})</span>
              </button>
            </div>

            <div className="neu-flat overflow-x-auto rounded-[10px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2 px-3">Organisation</th>
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Purpose</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {partnerRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="py-2 px-3 font-bold">{req.organisationName}</td>
                      <td className="py-2 px-3">{req.district}</td>
                      <td className="py-2 px-3">{req.purpose}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                            req.status === 'Approved'
                              ? 'bg-[#15803D]'
                              : req.status === 'Declined'
                              ? 'bg-[#B91C1C]'
                              : 'bg-[#CA8A04]'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">
                        {req.status === 'Pending' && (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => resolvePartnerAccessRequest(req.id, 'Approved')}
                              className="px-2 py-1 rounded bg-[#15803D] text-white font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => resolvePartnerAccessRequest(req.id, 'Declined')}
                              className="px-2 py-1 rounded bg-[#B91C1C] text-white font-semibold"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Versioned Scoring Method Registry */}
          <div className="neu-raised p-4 space-y-2.5 text-xs">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Admin Only: Versioned Hazard Scoring Method Registry
            </h2>
            <div className="neu-flat overflow-x-auto rounded-[10px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2 px-3">Version</th>
                    <th className="py-2 px-3">Author &amp; Date</th>
                    <th className="py-2 px-3">Calibration Note</th>
                    <th className="py-2 px-3">Weights</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {scoringVersions.map((ver) => (
                    <tr key={ver.version}>
                      <td className="py-2 px-3 font-mono font-bold text-[#0B8F80]">
                        {ver.version}
                      </td>
                      <td className="py-2 px-3">
                        {ver.author} ({ver.timestamp})
                      </td>
                      <td className="py-2 px-3">{ver.reason}</td>
                      <td className="py-2 px-3 font-mono text-[11px]">{ver.diffSummary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Immutable Audit Log */}
          <div className="neu-raised p-4 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Admin Only: Immutable Audit Log ({filteredAuditLogs.length})
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  placeholder="Search action, actor or details..."
                  className="neu-input px-2.5 py-1 text-xs"
                />
                <select
                  value={auditFilterModule}
                  onChange={(e) => setAuditFilterModule(e.target.value)}
                  className="neu-input px-2.5 py-1 text-xs"
                >
                  <option value="All">All Modules</option>
                  <option value="Alert">Alert Zones &amp; Voice Alerts</option>
                  <option value="Shelter">Shelters &amp; Relief Camps</option>
                  <option value="Volunteer">Volunteers &amp; Tasks</option>
                  <option value="IDRN">IDRN Resource Inventory</option>
                  <option value="Incident">Field Incidents</option>
                  <option value="Relocation">Relocation Planning</option>
                  <option value="Impact">Impact Assessment</option>
                </select>
                <button
                  type="button"
                  onClick={handleExportAuditCsv}
                  className="px-3 py-1.5 rounded-[8px] bg-[#0B8F80] text-white font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className="neu-flat overflow-x-auto max-h-72 rounded-[10px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Actor</th>
                    <th className="py-2 px-3">Module</th>
                    <th className="py-2 px-3">Action</th>
                    <th className="py-2 px-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2 px-3 font-mono whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-2 px-3 font-semibold">{log.actorName}</td>
                      <td className="py-2 px-3">{log.module}</td>
                      <td className="py-2 px-3 font-mono text-[#0B8F80] font-bold">
                        {log.action}
                      </td>
                      <td className="py-2 px-3">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="neu-flat p-3.5 rounded-[10px] text-xs text-[var(--text-secondary)]">
          Administrative governance logs and scoring method registries are restricted to Administrator roles.
        </div>
      )}
    </div>
  );
};
