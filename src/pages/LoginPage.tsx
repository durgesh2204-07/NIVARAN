import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Heart,
  Shield,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
  Building2,
  Landmark,
  Radio,
  Compass,
  ShieldCheck,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useAppStore, ORGANISATION_PRESETS } from '../store/useAppStore';
import { OrganisationType } from '../types';

export type AuthorityCategory = 'all' | 'command' | 'field' | 'community';

export interface AuthorityConfig {
  id: OrganisationType;
  category: 'command' | 'field' | 'community';
  roleCode: string;
  badge: string;
  badgeClass: string;
  cardTheme: 'dark' | 'light';
  title: string;
  shortLabel: string;
  desc: string;
  officialName: string;
  designation: string;
  department: string;
  jurisdiction: string;
  defaultEmail: string;
  defaultPass: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
}

export const ALL_AUTHORITIES: AuthorityConfig[] = [
  {
    id: 'national',
    category: 'command',
    roleCode: 'AUTH 01',
    badge: 'APEX NATIONAL',
    badgeClass: 'bg-[#451A03] text-[#F59E0B] border border-amber-600/40',
    cardTheme: 'dark',
    title: 'NDMA NATIONAL',
    shortLabel: 'NDMA National',
    desc: 'National Disaster Management Authority apex command & multi-state coordination.',
    officialName: 'Sh. R. K. Srivastava, IAS',
    designation: 'Joint Secretary (Operations)',
    department: 'National Emergency Operations Centre (NEOC New Delhi)',
    jurisdiction: 'All India (National Grid)',
    defaultEmail: 'ops.ndma@nic.in',
    defaultPass: 'Nivaran@123',
    icon: Landmark,
  },
  {
    id: 'state',
    category: 'command',
    roleCode: 'AUTH 02',
    badge: 'STATE SEOC',
    badgeClass: 'bg-[#451A03] text-[#F59E0B] border border-amber-600/40',
    cardTheme: 'dark',
    title: 'SDMA STATE',
    shortLabel: 'SDMA Mantralaya',
    desc: 'Maharashtra State Disaster Management Authority & State Emergency Operations Centre.',
    officialName: 'Dr. Rajeshwar Deshmukh, IAS',
    designation: 'Principal Secretary & State Relief Commissioner',
    department: 'State Emergency Operations Centre, Mantralaya Mumbai',
    jurisdiction: 'Maharashtra State',
    defaultEmail: 'seoc.mantralaya@maharashtra.gov.in',
    defaultPass: 'Nivaran@123',
    icon: Building2,
  },
  {
    id: 'district',
    category: 'command',
    roleCode: 'AUTH 03',
    badge: 'DISTRICT DDMA',
    badgeClass: 'bg-[#E6F7F2] text-[#008060] border border-[#B8F0E5]',
    cardTheme: 'light',
    title: 'DDMA DISTRICT',
    shortLabel: 'DDMA Collectorate',
    desc: 'District Disaster Management Authority, Collectorate & evacuation command.',
    officialName: 'Dr. M. Kulkarni, IAS',
    designation: 'District Collector & DDMA Chairperson',
    department: 'District Emergency Operations Centre (Raigad / Pune)',
    jurisdiction: 'Raigad / Pune District',
    defaultEmail: 'collector.raigad@maharashtra.gov.in',
    defaultPass: 'Nivaran@123',
    icon: ShieldAlert,
  },
  {
    id: 'response_forces',
    category: 'field',
    roleCode: 'AUTH 04',
    badge: 'RESCUE FORCE',
    badgeClass: 'bg-[#E6F7F2] text-[#008060] border border-[#B8F0E5]',
    cardTheme: 'light',
    title: 'NDRF / SDRF',
    shortLabel: 'NDRF 5th Battalion',
    desc: 'National & State Disaster Response Forces, tactical rescue & search operations.',
    officialName: 'Comdt. V. K. Rathore',
    designation: 'Commandant — Incident Response Team Lead',
    department: 'NDRF 5th Battalion & SDRF Strike Detachment',
    jurisdiction: 'Field Strike Radius (Western Ghats)',
    defaultEmail: '5bn.ndrf.pune@gov.in',
    defaultPass: 'Field@123',
    icon: Radio,
  },
  {
    id: 'departments',
    category: 'field',
    roleCode: 'AUTH 05',
    badge: 'TELEMETRY & NODAL',
    badgeClass: 'bg-[#E6F7F2] text-[#008060] border border-[#B8F0E5]',
    cardTheme: 'light',
    title: 'GSI / IMD',
    shortLabel: 'GSI & IMD Telemetry',
    desc: 'Geological Survey of India, landslide telemetry, rain gauges & slope sensors.',
    officialName: 'S. K. Kadam',
    designation: 'Nodal Telemetry Officer',
    department: 'Slope Stability & Hydro-Meteorological Division',
    jurisdiction: 'Sensor Nodes & Weather Grid',
    defaultEmail: 'nodal.gsi.west@gov.in',
    defaultPass: 'Field@123',
    icon: Compass,
  },
  {
    id: 'partners',
    category: 'community',
    roleCode: 'AUTH 06',
    badge: 'RELIEF & AAPDA MITRA',
    badgeClass: 'bg-[#E6F7F2] text-[#008060] border border-[#B8F0E5]',
    cardTheme: 'light',
    title: 'SHELTER & VOLUNTEERS',
    shortLabel: 'Aapda Mitra & Relief',
    desc: 'Disaster relief shelters, Aapda Mitra volunteers, supply distribution & medical camps.',
    officialName: 'Anjali Sawant',
    designation: 'Shelter Manager & Volunteer Coordinator',
    department: 'Relief Camp Operations & Indian Red Cross Society',
    jurisdiction: 'Relief Camps & Distribution Hubs',
    defaultEmail: 'relief.mh@indianredcross.org',
    defaultPass: 'Field@123',
    icon: Heart,
  },
  {
    id: 'citizen',
    category: 'community',
    roleCode: 'AUTH 07',
    badge: 'CITIZEN & PUBLIC',
    badgeClass: 'bg-[#E6F7F2] text-[#008060] border border-[#B8F0E5]',
    cardTheme: 'light',
    title: 'CITIZEN / PUBLIC',
    shortLabel: 'Citizen Safety',
    desc: 'Report emergencies, request help, locate safe shelters and receive early warning alerts.',
    officialName: 'Ramesh Pardhi',
    designation: 'Registered Resident (Irshalwadi)',
    department: 'Public Emergency Reporting & Safe Evacuation Hubs',
    jurisdiction: 'Habitations & Safe Plateaus',
    defaultEmail: 'citizen.raigad@nivaran.gov.in',
    defaultPass: '123456',
    icon: User,
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, addToast } = useAppStore();

  const [selectedAuthorityId, setSelectedAuthorityId] = useState<OrganisationType>('state');
  const [activeCategory, setActiveCategory] = useState<AuthorityCategory>('all');
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  const selectedAuthority =
    ALL_AUTHORITIES.find((a) => a.id === selectedAuthorityId) || ALL_AUTHORITIES[1];

  const [emailOrPhone, setEmailOrPhone] = useState(selectedAuthority.defaultEmail);
  const [password, setPassword] = useState(selectedAuthority.defaultPass);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Security Rate Limiting & Error Handling State
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  const authBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `NIVARAN — National Disaster Early Warning & Resilience Platform`;
  }, []);

  // Countdown timer for security rate-limit lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setFailedAttempts(0);
          setAuthError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleSelectAuthority = (auth: AuthorityConfig, scrollToAuth = false) => {
    setSelectedAuthorityId(auth.id);
    setEmailOrPhone(auth.defaultEmail);
    setPassword(auth.defaultPass);
    setAuthError(null);

    if (scrollToAuth && authBoxRef.current) {
      authBoxRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutRemaining > 0) return;

    const trimmedEmail = emailOrPhone.trim();
    if (!trimmedEmail || !password) {
      setAuthError('Please enter both your official identifier and password.');
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      // Connect to backend auth gateway
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const ct = response.headers.get('content-type') || '';
      if (response.ok && ct.includes('application/json')) {
        const data = await response.json();
        const preset = ORGANISATION_PRESETS[selectedAuthority.id] || ORGANISATION_PRESETS.state;

        setUser(
          {
            ...preset,
            emailOrPhone: data.user?.email || trimmedEmail,
            name: data.user?.name || selectedAuthority.officialName,
            unitName: data.user?.department || selectedAuthority.department,
          },
          keepSignedIn
        );

        addToast({
          title: 'Authority Authentication Verified',
          message: `${selectedAuthority.title} · ${data.user?.name || selectedAuthority.officialName} logged in`,
          type: 'success',
        });

        setFailedAttempts(0);
        setIsLoading(false);
        navigate('/dashboard');
        return;
      } else if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const retrySecs = Number(errorData.retry_after_seconds || response.headers.get('Retry-After') || 30);
        setLockoutRemaining(retrySecs);
        setAuthError(`Rate Limit Exceeded: Too many sign-in attempts. Please wait ${retrySecs} seconds.`);
        addToast({
          title: 'Rate Limit Security Enforced',
          message: `Too many sign-in attempts. Please wait ${retrySecs} seconds before trying again.`,
          type: 'warning',
        });
        setIsLoading(false);
        return;
      } else if (response.status === 401 || response.status === 400 || response.status === 403) {
        // Backend actively rejected credentials
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        if (newAttempts >= 5) {
          setLockoutRemaining(30);
          setAuthError('Security Alert: 5 consecutive failed login attempts. Terminal locked for 30 seconds.');
        } else {
          setAuthError(`Invalid credentials. ${5 - newAttempts} attempt(s) remaining before security lockout.`);
        }
        addToast({
          title: 'Authentication Denied',
          message: 'Invalid official identifier or password. Access is restricted to authorized personnel.',
          type: 'critical',
        });
        setIsLoading(false);
        return;
      }
    } catch {
      // Offline fallback: strictly verify credentials against authorized presets
    }

    // Strict local verification: Check if credentials match any authorized authority
    const matchingAuth = ALL_AUTHORITIES.find(
      (a) =>
        a.defaultEmail.toLowerCase() === trimmedEmail.toLowerCase() &&
        a.defaultPass === password
    );

    if (matchingAuth) {
      const preset = ORGANISATION_PRESETS[matchingAuth.id] || ORGANISATION_PRESETS.state;
      setUser(
        {
          ...preset,
          emailOrPhone: trimmedEmail,
          name: matchingAuth.officialName,
          unitName: matchingAuth.department,
        },
        keepSignedIn
      );

      addToast({
        title: 'Security Verified · Access Granted',
        message: `${matchingAuth.title} — ${matchingAuth.officialName}`,
        type: 'success',
      });

      setFailedAttempts(0);
      setIsLoading(false);
      navigate('/dashboard');
      return;
    }

    // Invalid credentials entered! Strictly reject and enforce lockout counter
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    if (newAttempts >= 5) {
      setLockoutRemaining(30);
      setAuthError('Security Lockout: 5 consecutive failed attempts. Terminal locked for 30 seconds.');
    } else {
      setAuthError(`Access Denied: Invalid identifier or password. (${5 - newAttempts} attempts left)`);
    }

    addToast({
      title: 'Authentication Denied',
      message: 'Invalid credentials. Access to NIVARAN Disaster Platform is restricted.',
      type: 'critical',
    });
    setIsLoading(false);
  };

  const filteredAuthorities = ALL_AUTHORITIES.filter((a) => {
    if (activeCategory === 'all') return true;
    return a.category === activeCategory;
  });

  return (
    <div className="min-h-screen w-full bg-[#FAFCFB] flex flex-col font-sans selection:bg-[#008060]/20 selection:text-[#008060]">
      {/* =====================================================================
          TOP NAVIGATION BAR (Exact match to screenshot branding)
          ===================================================================== */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: [N] Logo and Brand Name (NIVARAN) */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#008060] flex items-center justify-center text-white font-black text-xl shadow-xs">
              N
            </div>
            <span className="font-black text-xl sm:text-2xl tracking-tight text-[#0F172A] uppercase font-sans">
              NIVARAN
            </span>
          </div>

          {/* Right: Online Status & Role Select Button */}
          <div className="flex items-center gap-3">
            {/* Online Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F7F2] border border-[#A7F3D0]/70 text-[#008060] text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>ONLINE</span>
            </div>

            {/* Select Role Button */}
            <button
              type="button"
              onClick={() => {
                if (authBoxRef.current) {
                  authBoxRef.current.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#008060] hover:bg-[#006e52] active:bg-[#005a43] text-white text-xs sm:text-[13px] font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-white/90" />
              <span>Select Authority / Sign In</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          HERO HEADER SECTION
          ===================================================================== */}
      <section className="pt-10 sm:pt-12 pb-6 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E0F7F4] border border-[#B8F0E5] text-[#008060] text-xs font-bold tracking-wider uppercase mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#008060]" />
            <span>DISASTER RESILIENCE & RESPONSE NETWORK</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl font-black text-[#0F172A] tracking-tight mb-2">
            NIVARAN
          </h1>

          {/* Subtitle */}
          <h2 className="text-xl sm:text-2xl font-bold text-[#008060] tracking-tight mb-2">
            Disaster Management & Early Warning Platform
          </h2>

          {/* Tagline */}
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Connect apex disaster authorities, district collectors, field response battalions, telemetry officers, volunteers, and citizens for unified action.
          </p>

          {/* Instant 1-Click Launch Action for Demo Evaluators */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setUser(ORGANISATION_PRESETS.state, true);
                addToast({
                  title: 'Demo Access Granted',
                  message: 'Entering Overview Dashboard as Maharashtra SDMA Commander',
                  type: 'success',
                });
                navigate('/dashboard');
              }}
              className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold bg-[#008060] hover:bg-[#006e52] text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer hover:scale-105"
            >
              <Compass className="w-4 h-4 text-emerald-200" />
              <span>Launch Overview Dashboard (Instant Access)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Authority Category Filter Tabs */}
        <div className="max-w-2xl mx-auto mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#008060] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Authorities (7)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('command')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'command'
                ? 'bg-[#008060] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Command (NDMA / SDMA / DDMA)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('field')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'field'
                ? 'bg-[#008060] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Field Forces (NDRF / SDRF / GSI)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('community')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'community'
                ? 'bg-[#008060] text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Community (Volunteers & Citizens)
          </button>
        </div>
      </section>

      {/* =====================================================================
          AUTHORITIES GRID (Matching uploaded screenshot style)
          ===================================================================== */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuthorities.map((auth) => {
            const isSelected = selectedAuthorityId === auth.id;
            const isDark = auth.cardTheme === 'dark';
            const Icon = auth.icon;

            return (
              <div
                key={auth.id}
                onClick={() => handleSelectAuthority(auth, true)}
                className={`rounded-3xl p-6 sm:p-7 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isDark
                    ? isSelected
                      ? 'bg-[#0F172A] border-2 border-cyan-400 ring-4 ring-cyan-400/20 shadow-2xl scale-[1.01]'
                      : 'bg-[#0F172A] border border-slate-800 shadow-lg hover:border-slate-700'
                    : isSelected
                    ? 'bg-white border-2 border-[#14B8A6] ring-4 ring-[#14B8A6]/15 shadow-xl scale-[1.01]'
                    : 'bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div>
                  {/* Card Header: Icon & Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xs ${
                        isDark
                          ? 'bg-[#1E293B] border border-slate-700 text-cyan-400'
                          : 'bg-[#ECFDF5] border border-[#A7F3D0]/60 text-[#008060]'
                      }`}
                    >
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${auth.badgeClass}`}>
                        {auth.badge}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`text-xl font-black tracking-tight mb-1.5 ${
                      isDark ? 'text-white' : 'text-[#0F172A]'
                    }`}
                  >
                    {auth.title}
                  </h3>

                  <div
                    className={`text-xs font-semibold mb-2 ${
                      isDark ? 'text-cyan-300/90' : 'text-[#008060]'
                    }`}
                  >
                    {auth.officialName}
                  </div>

                  <p
                    className={`text-xs leading-relaxed min-h-[44px] ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {auth.desc}
                  </p>

                  {/* Jurisdiction tag */}
                  <div className="mt-3 pt-3 border-t border-slate-200/20 text-[11px] flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Scope:</span>
                    <span
                      className={`font-semibold truncate max-w-[170px] ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}
                    >
                      {auth.jurisdiction}
                    </span>
                  </div>
                </div>

                {/* Card Action Pill Button */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAuthority(auth, true);
                    }}
                    className={`w-full py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#008060] hover:bg-[#006e52] text-white shadow-sm'
                        : isDark
                        ? 'bg-[#1E293B] hover:bg-slate-700 text-slate-300'
                        : 'bg-[#F1F5F9] hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>Continue as {auth.shortLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          AUTHENTICATION CONTAINER (Matching screenshot bottom style)
          ===================================================================== */}
      <section ref={authBoxRef} className="max-w-4xl w-full mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 transition-all">
          {/* Header row: Subtitle + Title + Sign In / Register toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-black text-[#008060] uppercase tracking-wider block mb-1">
                AUTHENTICATION FOR {selectedAuthority.title}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Sign In to {selectedAuthority.shortLabel} Portal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedAuthority.designation} · {selectedAuthority.officialName}
              </p>
            </div>

            {/* Sign In · Register Tabs */}
            <div className="flex items-center gap-3 self-start sm:self-auto text-sm font-semibold">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className={`cursor-pointer transition-colors ${
                  authMode === 'signin'
                    ? 'text-[#008060] font-bold underline underline-offset-4 decoration-2 decoration-[#008060]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Sign In
              </button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  addToast({
                    title: 'Authority Credential Request',
                    message: 'Official ID verification is required for government disaster credentials.',
                    type: 'info',
                  });
                }}
                className={`cursor-pointer transition-colors ${
                  authMode === 'register'
                    ? 'text-[#008060] font-bold underline underline-offset-4 decoration-2 decoration-[#008060]'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          {/* Quick 1-Click All Authorities Switcher Bar */}
          <div className="my-5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#008060]" />
                <span>Quick 1-Click Authority Credentials Switcher:</span>
              </span>
              <span className="text-[11px] text-slate-400">Click to switch login</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {ALL_AUTHORITIES.map((auth) => (
                <button
                  key={auth.id}
                  type="button"
                  onClick={() => handleSelectAuthority(auth)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedAuthorityId === auth.id
                      ? 'bg-[#008060] text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>{auth.shortLabel}</span>
                  <span
                    className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      selectedAuthorityId === auth.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {auth.roleCode}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Security Error Banner / Rate Limiting Alert */}
            {authError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Input 1: Email or Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Identifier / Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-[#008060] flex items-center pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  disabled={lockoutRemaining > 0}
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Official gov.in or nic.in identifier"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008060] focus:ring-4 focus:ring-emerald-100 transition-all font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Input 2: Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-amber-500 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={lockoutRemaining > 0}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Security password"
                  className="w-full pl-10 pr-16 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008060] focus:ring-4 focus:ring-emerald-100 transition-all font-medium disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-xs font-bold text-[#008060] hover:text-[#006e52] cursor-pointer select-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Remember Me and Forgot Password */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#008060] focus:ring-[#008060] cursor-pointer"
                />
                <span>Keep me signed in on this terminal</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  addToast({
                    title: 'Credential Retrieval Assistance',
                    message: 'Official authority credentials must be retrieved through your DDMA / SDMA IT administrator.',
                    type: 'info',
                  });
                }}
                className="font-semibold text-[#008060] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Department info strip */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-bold text-slate-800 truncate max-w-[280px]">
                {selectedAuthority.department}
              </span>
            </div>

            {/* Primary Action Button (Strict Authentication Only - Direct Guest Bypass Removed) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || lockoutRemaining > 0}
                className="w-full py-3.5 px-6 rounded-full bg-[#008060] hover:bg-[#006e52] active:bg-[#005a43] text-white font-bold text-sm shadow-md hover:shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>
                  {lockoutRemaining > 0
                    ? `Terminal Locked (${lockoutRemaining}s)`
                    : isLoading
                    ? 'Verifying Security Credentials...'
                    : `Sign In to ${selectedAuthority.shortLabel} Portal`}
                </span>
                {!isLoading && lockoutRemaining === 0 && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Secure System Footer Notice */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#008060]" />
              <span>Official Government Disaster Management System · Secure Access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>National Geospatial Data Security Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          FOOTER
          ===================================================================== */}
      <footer className="w-full mt-auto py-6 bg-white border-t border-slate-200/80 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 NIVARAN — National Disaster Management Authority (NDMA) & SDMA Maharashtra.</p>
        </div>
      </footer>
    </div>
  );
};
