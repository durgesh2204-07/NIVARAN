import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Compass,
  Filter,
  Globe2,
  MapPin,
  Mic,
  MicOff,
  Search,
  ShieldAlert,
  Tent,
  Users,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { searchNominatim, NominatimPlace } from '../services/externalApis';
import { RiskBadge } from './RiskBadge';
import { classifyHazard, weightedScore } from '../utils/scoring';
import { NivaranTheme } from '../store/useAppStore';

const THEME_OPTIONS: { id: NivaranTheme; name: string; desc: string; color: string }[] = [
  { id: 'nivaran-light', name: 'NIVARAN Light', desc: 'Clean government white with emerald green', color: '#008060' },
  { id: 'nivaran-dark', name: 'NIVARAN Dark', desc: 'Deep charcoal with green accents', color: '#10B981' },
  { id: 'midnight', name: 'Midnight Command', desc: 'Dark navy command centre with cyan glow', color: '#00F5D4' },
  { id: 'forest', name: 'Forest Operations', desc: 'Deep forest green with vibrant lime accents', color: '#84CC16' },
  { id: 'high-contrast', name: 'High Contrast', desc: 'Accessibility-focused high contrast mode', color: '#FACC15' },
];

const QUICK_NAV_ROUTES = [
  { path: '/map', name: 'Live GIS Command Map', desc: 'Interactive spatial map with 5-tier risk zones', icon: Compass },
  { path: '/dashboard', name: 'Red Zone Risk Dashboard', desc: 'Comprehensive risk scoring & telemetry metrics', icon: ShieldAlert },
  { path: '/alerts', name: 'Disaster Alerts & Advisories', desc: 'CAP-compliant early warnings & weather alerts', icon: AlertTriangle },
  { path: '/resources', name: 'Safe Shelters & Resources', desc: 'Relief camps, capacity & resource stocks', icon: Building2 },
  { path: '/planning', name: 'Relocation Site Planner', desc: 'Safe plateau carrying capacity & zoning', icon: MapPin },
  { path: '/community-reports', name: 'Field Hazard Reports', desc: 'Crowdsourced community incidents & hazard logs', icon: Users },
];

const SAMPLE_STRUCTURED_QUERIES = [
  'high risk villages in Raigad',
  'shelters with capacity above 100',
  'open incidents last 24 h',
  'relocation sites in Satara',
];

export const CommandPalette: React.FC = () => {
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const currentTheme = useAppStore((s) => s.currentTheme);
  const setTheme = useAppStore((s) => s.setTheme);
  const activeAlertZones = useAppStore((s) => s.activeAlertZones);
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const camps = useAppStore((s) => s.reliefCamps);
  const incidents = useAppStore((s) => s.incidents);
  const responseTeams = useAppStore((s) => s.responseTeams);
  const weights = useAppStore((s) => s.weights);
  const language = useAppStore((s) => s.language);
  const setSelectedVillageId = useAppStore((s) => s.setSelectedVillageId);
  const setSelectedSiteId = useAppStore((s) => s.setSelectedSiteId);
  const openSidePanel = useAppStore((s) => s.openSidePanel);
  const addToast = useAppStore((s) => s.addToast);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [nominatimResults, setNominatimResults] = useState<NominatimPlace[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [listeningVoice, setListeningVoice] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setNominatimResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingPlaces(true);
      const places = await searchNominatim(query);
      setNominatimResults(places);
      setSearchingPlaces(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Parse structured query filters (Section 6.19)
  const parsedFilters = useMemo(() => {
    const q = query.toLowerCase();
    const filters: string[] = [];
    let districtFilter: string | null = null;
    const districts = ['raigad', 'satara', 'pune', 'ratnagiri', 'kolhapur', 'sindhudurg'];
    for (const d of districts) {
      if (q.includes(d)) {
        districtFilter = d.charAt(0).toUpperCase() + d.slice(1);
        filters.push(`District: ${districtFilter}`);
      }
    }

    const highRiskOnly =
      q.includes('high risk') || q.includes('red zone') || q.includes('immediate');
    if (highRiskOnly) filters.push('Risk: Immediate / Short-term');

    let minShelterCapacity: number | null = null;
    const capMatch = q.match(/(?:above|over|>)\s*(\d+)/);
    if (capMatch) {
      minShelterCapacity = Number(capMatch[1]);
      filters.push(`Capacity > ${minShelterCapacity}`);
    }

    const openIncidentsOnly =
      q.includes('open incident') || q.includes('last 24 h') || q.includes('active incident');
    if (openIncidentsOnly) filters.push('Status: Open (Last 24 h)');

    return {
      filters,
      districtFilter,
      highRiskOnly,
      minShelterCapacity,
      openIncidentsOnly,
    };
  }, [query]);

  if (!open) return null;

  const q = query.trim().toLowerCase();

  // Voice Input via Web Speech API (English / Hindi / Marathi)
  const handleStartVoiceSearch = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRec) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRec as any)();
      recognition.lang =
        language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      recognition.interimResults = false;
      setListeningVoice(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) setQuery(transcript);
        setListeningVoice(false);
      };
      recognition.onerror = () => setListeningVoice(false);
      recognition.onend = () => setListeningVoice(false);
      recognition.start();
    } catch {
      setListeningVoice(false);
    }
  };

  const matchedVillages = villages
    .filter((v) => {
      if (parsedFilters.districtFilter && v.district !== parsedFilters.districtFilter) {
        return false;
      }
      const score = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
      const level = classifyHazard(score);
      if (
        parsedFilters.highRiskOnly &&
        level !== 'Immediate' &&
        level !== 'Short-term'
      ) {
        return false;
      }
      if (!q) return true;
      if (parsedFilters.filters.length > 0) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.district.toLowerCase().includes(q) ||
        v.taluka.toLowerCase().includes(q)
      );
    })
    .slice(0, 6);

  const matchedIncidents = incidents
    .filter((inc) => {
      if (parsedFilters.districtFilter && inc.district !== parsedFilters.districtFilter) {
        return false;
      }
      if (parsedFilters.openIncidentsOnly && inc.status === 'Resolved') {
        return false;
      }
      if (!q) return true;
      if (parsedFilters.openIncidentsOnly || parsedFilters.districtFilter) return true;
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.villageName.toLowerCase().includes(q) ||
        inc.district.toLowerCase().includes(q) ||
        inc.code.toLowerCase().includes(q)
      );
    })
    .slice(0, 4);

  const matchedCamps = camps
    .filter((c) => {
      if (parsedFilters.districtFilter && c.district !== parsedFilters.districtFilter) {
        return false;
      }
      if (
        parsedFilters.minShelterCapacity !== null &&
        c.capacityPersons <= parsedFilters.minShelterCapacity
      ) {
        return false;
      }
      if (!q) return true;
      if (parsedFilters.minShelterCapacity !== null || parsedFilters.districtFilter) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.taluka.toLowerCase().includes(q)
      );
    })
    .slice(0, 4);

  const matchedSites = sites
    .filter((s) => {
      if (parsedFilters.districtFilter && s.district !== parsedFilters.districtFilter) {
        return false;
      }
      if (!q) return false;
      return (
        s.name.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q) ||
        q.includes('site')
      );
    })
    .slice(0, 4);

  const matchedTeams = responseTeams
    .filter(
      (t) =>
        q &&
        (t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.district.toLowerCase().includes(q))
    )
    .slice(0, 3);

  const matchedZones = activeAlertZones
    .filter(
      (z) =>
        q &&
        (z.areaName.toLowerCase().includes(q) ||
          z.level.toLowerCase().includes(q) ||
          z.disasterType.toLowerCase().includes(q) ||
          z.id.toLowerCase().includes(q))
    )
    .slice(0, 4);

  const matchedThemes = THEME_OPTIONS.filter(
    (t) =>
      q.includes('theme') ||
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q)
  );

  const matchedRoutes = QUICK_NAV_ROUTES.filter(
    (r) =>
      q &&
      (r.name.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.path.toLowerCase().includes(q))
  ).slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-[1100] bg-black/60 flex items-start justify-center pt-14 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Search"
      onClick={() => setOpen(false)}
    >
      <div
        className="neu-raised w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#0B8F80] shrink-0" strokeWidth={1.75} />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search habitations, incidents, shelters, teams or type 'high risk villages in Raigad'..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] focus:outline-none"
          />
          <button
            type="button"
            onClick={handleStartVoiceSearch}
            title="Voice search (English / Hindi / Marathi)"
            className={`neu-btn p-2 ${listeningVoice ? 'text-[#B91C1C]' : 'text-[#0B8F80]'}`}
          >
            {listeningVoice ? (
              <MicOff className="w-4 h-4" strokeWidth={1.75} />
            ) : (
              <Mic className="w-4 h-4" strokeWidth={1.75} />
            )}
          </button>
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold border border-[var(--border)] rounded">
            ESC
          </kbd>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1.5 rounded text-[var(--text-secondary)]"
            aria-label="Close command search"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Sample Structured Queries & Active Filter Pills */}
        <div className="px-4 py-2 bg-[var(--surface-flat)] border-b border-[var(--border)] flex flex-wrap items-center gap-1.5 text-xs">
          {parsedFilters.filters.length > 0 ? (
            <>
              <span className="font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Applied filters:</span>
              </span>
              {parsedFilters.filters.map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 rounded bg-[#0B8F80] text-white font-mono text-[11px] font-semibold"
                >
                  {f}
                </span>
              ))}
            </>
          ) : (
            <>
              <span className="text-[11px] text-[var(--text-secondary)]">Structured queries:</span>
              {SAMPLE_STRUCTURED_QUERIES.map((sq) => (
                <button
                  key={sq}
                  type="button"
                  onClick={() => setQuery(sq)}
                  className="px-2 py-0.5 rounded border border-[var(--border)] hover:border-[#0B8F80] font-mono text-[11px]"
                >
                  {sq}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[65vh] overflow-y-auto p-3 space-y-4">
          {/* Quick Page Routes */}
          {matchedRoutes.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#008060]" strokeWidth={2} />
                <span>Navigation Routes ({matchedRoutes.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedRoutes.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div
                      key={r.path}
                      onClick={() => {
                        setOpen(false);
                        navigate(r.path);
                      }}
                      className="neu-flat px-3 py-2 flex items-center justify-between gap-2 hover:bg-[#008060]/10 transition-colors cursor-pointer rounded-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#008060]/10 text-[#008060] flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {r.name}
                          </div>
                          <div className="text-[10.5px] text-[var(--text-secondary)]">
                            {r.desc}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {r.path}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Theme Switcher in Command Palette */}
          {matchedThemes.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#008060]" />
                <span>System Themes ({matchedThemes.length})</span>
              </div>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {matchedThemes.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => {
                      setTheme(th.id);
                      addToast({
                        title: 'Theme Applied',
                        message: `Switched to ${th.name} theme.`,
                        type: 'success',
                      });
                    }}
                    className={`p-2 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer border ${
                      currentTheme === th.id
                        ? 'border-[#008060] bg-[#008060]/10 ring-1 ring-[#008060]'
                        : 'border-[var(--border)] hover:bg-[var(--surface-flat)]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs border border-white"
                      style={{ backgroundColor: th.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {th.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {th.desc}
                      </div>
                    </div>
                    {currentTheme === th.id && (
                      <span className="text-[10px] font-bold text-[#008060] shrink-0">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active GIS Risk Zones */}
          {matchedZones.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#DC2626]" strokeWidth={2} />
                <span>Active GIS Risk Zones ({matchedZones.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedZones.map((z) => (
                  <div
                    key={z.id}
                    className="neu-flat px-3 py-2 flex items-center justify-between gap-2 rounded-xl"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span
                          className="px-2 py-0.2 rounded text-[10px] font-mono font-bold text-white uppercase"
                          style={{
                            backgroundColor:
                              z.level === 'Red'
                                ? '#DC2626'
                                : z.level === 'Yellow'
                                ? '#EAB308'
                                : z.level === 'Orange'
                                ? '#F97316'
                                : '#16A34A',
                          }}
                        >
                          {z.level}
                        </span>
                        <span>{z.areaName}</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        {z.disasterType} · {z.district || 'Maharashtra'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        openSidePanel('zone', z, `${z.areaName} (${z.level.toUpperCase()} RISK)`);
                        navigate('/map');
                      }}
                      className="px-2.5 py-1 rounded bg-[#008060] text-white text-[11px] font-semibold hover:bg-[#006e52] cursor-pointer"
                    >
                      Inspect Zone
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Habitations */}
          {matchedVillages.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Habitations ({matchedVillages.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedVillages.map((v) => {
                  const score = weightedScore(v.hazardFactors, weights, v.verifiedReportsCount);
                  const lvl = classifyHazard(score);
                  return (
                    <div
                      key={v.id}
                      className="neu-flat px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold">
                          {v.name}{' '}
                          <span className="font-normal text-[var(--text-secondary)]">
                            ({v.taluka}, {v.district}, {v.state || 'Maharashtra'})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                          {v.households} HH · {v.elevationM}m ASL · Slope {v.slopeDeg}°
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RiskBadge level={lvl} score={score} size="sm" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVillageId(v.id);
                            setOpen(false);
                            navigate('/gis');
                          }}
                          className="px-2.5 py-1 rounded bg-[#0B8F80] text-white text-[11px] font-semibold"
                        >
                          Open on map
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Shelters / Relief Camps */}
          {matchedCamps.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Tent className="w-3.5 h-3.5 text-[#15803D]" strokeWidth={1.75} />
                <span>Relief Camps ({matchedCamps.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedCamps.map((c) => (
                  <div
                    key={c.id}
                    className="neu-flat px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold">{c.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {c.taluka}, {c.district} · Capacity: {c.currentOccupancy}/{c.capacityPersons}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate('/gis');
                      }}
                      className="px-2.5 py-1 rounded bg-[#0B1F33] text-white text-[11px] font-semibold"
                    >
                      Open on map
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Incidents */}
          {matchedIncidents.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#B91C1C]" strokeWidth={1.75} />
                <span>Incidents ({matchedIncidents.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="neu-flat px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold">{inc.title}</div>
                      <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                        {inc.code} · {inc.villageName}, {inc.district} · {inc.status}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={inc.severity} size="sm" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVillageId(inc.villageId || null);
                          setOpen(false);
                          navigate('/gis');
                        }}
                        className="px-2.5 py-1 rounded bg-[#0B8F80] text-white text-[11px] font-semibold"
                      >
                        Open on map
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relocation Sites */}
          {matchedSites.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Candidate Relocation Sites ({matchedSites.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedSites.map((s) => (
                  <div
                    key={s.id}
                    className="neu-flat px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold">{s.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {s.taluka}, {s.district} · {s.usableAreaHa} ha
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSiteId(s.id);
                        setOpen(false);
                        navigate('/gis');
                      }}
                      className="px-2.5 py-1 rounded bg-[#0B8F80] text-white text-[11px] font-semibold"
                    >
                      Open on map
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Response Teams */}
          {matchedTeams.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Response Teams ({matchedTeams.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {matchedTeams.map((t) => (
                  <div
                    key={t.id}
                    className="neu-flat px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold">{t.name}</div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {t.code} · {t.district} · {t.status}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate('/gis');
                      }}
                      className="px-2.5 py-1 rounded bg-[#0B8F80] text-white text-[11px] font-semibold"
                    >
                      Open on map
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nominatim Place Results */}
          {nominatimResults.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Nominatim Places ({nominatimResults.length})</span>
              </div>
              <div className="mt-1 space-y-1">
                {nominatimResults.map((place) => (
                  <div
                    key={place.placeId}
                    className="neu-flat px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="pr-2">
                      <div className="text-xs font-semibold line-clamp-1">
                        {place.displayName}
                      </div>
                      <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                        {place.lat.toFixed(4)}°N, {place.lng.toFixed(4)}°E
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate(`/gis?lat=${place.lat}&lng=${place.lng}&zoom=13`);
                      }}
                      className="px-2.5 py-1 rounded bg-[#0B8F80] text-white text-[11px] font-semibold shrink-0"
                    >
                      Open on map
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
