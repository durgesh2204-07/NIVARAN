'use client';
import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff as EyeClosed,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { ORGANISATION_PRESETS, useAppStore } from '@/store/useAppStore';
import { OrganisationType } from '@/types';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

interface OrgOption {
  id: OrganisationType;
  shortLabel: string;
  label: string;
  defaultEmail: string;
  defaultPass: string;
  defaultUnit: string;
}

const ORG_OPTIONS: OrgOption[] = [
  {
    id: 'state',
    shortLabel: 'SDMA State',
    label: 'State Emergency Operations Centre (SDMA)',
    defaultEmail: 'seoc.mantralaya@maharashtra.gov.in',
    defaultPass: 'Nivaran@123',
    defaultUnit: 'Maharashtra SEOC — Mantralaya, Mumbai',
  },
  {
    id: 'district',
    shortLabel: 'DDMA District',
    label: 'District Control Room (DDMA Raigad)',
    defaultEmail: 'collector.raigad@maharashtra.gov.in',
    defaultPass: 'Nivaran@123',
    defaultUnit: 'DDMA Raigad Collectorate Control Room',
  },
  {
    id: 'national',
    shortLabel: 'NDMA National',
    label: 'National Disaster Management Authority (NDMA)',
    defaultEmail: 'ops.ndma@nic.in',
    defaultPass: 'Nivaran@123',
    defaultUnit: 'NDMA Operations Division (New Delhi)',
  },
  {
    id: 'response_forces',
    shortLabel: 'NDRF / SDRF',
    label: 'NDRF 5th Battalion & SDRF Rescue Team',
    defaultEmail: '5bn.ndrf.pune@gov.in',
    defaultPass: 'Field@123',
    defaultUnit: 'NDRF 5th Battalion (Pune)',
  },
  {
    id: 'departments',
    shortLabel: 'GSI / Field',
    label: 'GSI / IMD / Revenue Field Officer',
    defaultEmail: 'nodal.gsi.west@gov.in',
    defaultPass: 'Field@123',
    defaultUnit: 'Geological Survey of India (GSI)',
  },
  {
    id: 'citizen',
    shortLabel: 'Citizen',
    label: 'Citizen Safety & Relief Portal',
    defaultEmail: 'citizen.raigad@nivaran.gov.in',
    defaultPass: '123456',
    defaultUnit: 'Irshalwadi / Raigad Sector',
  },
];

const CAPTCHA_CODES = ['NV482', 'RD917', 'MH204', 'SD735'];

const CARD_I18N = {
  welcome: {
    en: 'Welcome to NIVARAN',
    hi: 'निवारण (NIVARAN) में आपका स्वागत है',
    mr: 'निवारण (NIVARAN) मध्ये आपले स्वागत आहे',
  },
  signInToContinue: {
    en: 'Sign in to continue',
    hi: 'आगे बढ़ने के लिए साइन इन करें',
    mr: 'पुढे जाण्यासाठी साइन इन करा',
  },
  selectRole: {
    en: 'Select Role',
    hi: 'भूमिका चुनें',
    mr: 'भूमिका निवडा',
  },
  emailPlaceholder: {
    en: 'Email address or ID',
    hi: 'ईमेल पता या आईडी',
    mr: 'ईमेल पत्ता किंवा आयडी',
  },
  passwordPlaceholder: {
    en: 'Password',
    hi: 'पासवर्ड',
    mr: 'पासवर्ड',
  },
  captchaPlaceholder: {
    en: 'Captcha',
    hi: 'कैप्चा',
    mr: 'कॅप्चा',
  },
  rememberMe: {
    en: 'Remember me',
    hi: 'मुझे याद रखें',
    mr: 'माझी नोंद ठेवा',
  },
  forgotPassword: {
    en: 'Forgot password?',
    hi: 'पासवर्ड भूल गए?',
    mr: 'पासवर्ड विसरलात?',
  },
  signInButton: {
    en: 'Sign In to',
    hi: 'साइन इन करें -',
    mr: 'साइन इन करा -',
  },
  or: {
    en: 'or',
    hi: 'या',
    mr: 'किंवा',
  },
  citizenQuickAccess: {
    en: 'Citizen Quick Access (Public Portal)',
    hi: 'नागरिक त्वरित प्रवेश (सार्वजनिक पोर्टल)',
    mr: 'नागरिक त्वरित प्रवेश (सार्वजनिक पोर्टल)',
  },
  needAssistance: {
    en: 'Need assistance?',
    hi: 'सहायता चाहिए?',
    mr: 'मदत हवी आहे का?',
  },
  publicSafetyMap: {
    en: 'Enter Public Safety Map',
    hi: 'सार्वजनिक सुरक्षा मानचित्र खोलें',
    mr: 'सार्वजनिक सुरक्षा नकाशा उघडा',
  },
  roles: {
    state: { en: 'SDMA State', hi: 'SDMA राज्य', mr: 'SDMA राज्य' },
    district: { en: 'DDMA District', hi: 'DDMA ज़िला', mr: 'DDMA जिल्हा' },
    national: { en: 'NDMA National', hi: 'NDMA राष्ट्रीय', mr: 'NDMA राष्ट्रीय' },
    response_forces: { en: 'NDRF / SDRF', hi: 'NDRF / SDRF', mr: 'NDRF / SDRF' },
    departments: { en: 'GSI / Field', hi: 'GSI / फील्ड', mr: 'GSI / क्षेत्र' },
    partners: { en: 'Shelter & Volunteers', hi: 'आश्रय एवं स्वयंसेवक', mr: 'निवारा व स्वयंसेवक' },
    citizen: { en: 'Citizen', hi: 'नागरिक', mr: 'नागरिक' },
  } as Record<OrganisationType, { en: string; hi: string; mr: string }>,
};

export interface SignInCardProps {
  topOverlay?: React.ReactNode;
}

export function Component({ topOverlay }: SignInCardProps = {}) {
  const navigate = useNavigate();
  const { setUser, addToast, language } = useAppStore();

  const [selectedOrg, setSelectedOrg] = useState<OrganisationType>('state');
  const activeOrgMeta = ORG_OPTIONS.find((o) => o.id === selectedOrg) || ORG_OPTIONS[0]!;

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(activeOrgMeta.defaultEmail);
  const [password, setPassword] = useState(activeOrgMeta.defaultPass);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [, setMousePosition] = useState({ x: 0, y: 0 });

  const [captchaIdx, setCaptchaIdx] = useState(0);
  const currentCaptcha = CAPTCHA_CODES[captchaIdx % CAPTCHA_CODES.length]!;
  const [captchaInput, setCaptchaInput] = useState(currentCaptcha);

  // For 3D card effect - increased rotation range for more pronounced 3D effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
    setMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSelectOrg = (org: OrganisationType) => {
    setSelectedOrg(org);
    const found = ORG_OPTIONS.find((o) => o.id === org) || ORG_OPTIONS[0]!;
    setEmail(found.defaultEmail);
    setPassword(found.defaultPass);
  };

  const handleRefreshCaptcha = () => {
    const nextIdx = (captchaIdx + 1) % CAPTCHA_CODES.length;
    setCaptchaIdx(nextIdx);
    setCaptchaInput(CAPTCHA_CODES[nextIdx]!);
  };

  const completeSignIn = (orgToUse: OrganisationType) => {
    const preset = ORGANISATION_PRESETS[orgToUse] || ORGANISATION_PRESETS.state;
    const found = ORG_OPTIONS.find((o) => o.id === orgToUse) || ORG_OPTIONS[0]!;
    setUser(
      {
        ...preset,
        emailOrPhone: email.trim() || found.defaultEmail,
        unitName: found.defaultUnit,
      },
      rememberMe
    );
    navigate('/map');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      completeSignIn(selectedOrg);
    }, 650);
  };

  const handleGoogleOrQuickCitizenSignIn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      completeSignIn('citizen');
    }, 500);
  };

  return (
    <div className="min-h-screen w-screen bg-[#F4F9F5] text-[#0F291E] relative overflow-hidden flex flex-col items-center justify-center">
      {/* Background gradient effect - Fresh Mint & White */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E8F5E9]/60 via-[#F4F9F5] to-[#FFFFFF]" />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* Top radial glow - Mint & Emerald */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-[50%] bg-[#10B981]/10 blur-[90px] pointer-events-none" />
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[100vh] h-[60vh] rounded-b-full bg-[#059669]/10 blur-[70px] pointer-events-none"
        animate={{
          opacity: [0.15, 0.28, 0.15],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: 'mirror',
        }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[90vh] h-[90vh] rounded-t-full bg-[#10B981]/10 blur-[80px] pointer-events-none"
        animate={{
          opacity: [0.2, 0.35, 0.2],
          scale: [1, 1.08, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: 'mirror',
          delay: 1,
        }}
      />

      {/* Animated glow spots */}
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-[#10B981]/10 rounded-full blur-[100px] animate-pulse opacity-40 pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-[#059669]/10 rounded-full blur-[100px] animate-pulse delay-1000 opacity-30 pointer-events-none" />

      {/* Optional top header overlay for Emergency Voice Alert / SOS & Language controls */}
      {topOverlay && <div className="w-full relative z-20">{topOverlay}</div>}

      <div className="flex-1 w-full flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md relative z-10"
          style={{ perspective: 1500 }}
        >
          <motion.div
            className="relative"
            style={{ rotateX, rotateY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            whileHover={{ z: 10 }}
          >
            <div className="relative group">
              {/* Card glow effect - reduced intensity */}
              <motion.div
                className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
                animate={{
                  boxShadow: [
                    '0 0 10px 2px rgba(255,255,255,0.03)',
                    '0 0 15px 5px rgba(255,255,255,0.05)',
                    '0 0 10px 2px rgba(255,255,255,0.03)',
                  ],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  repeatType: 'mirror',
                }}
              />

              {/* Traveling light beam effect - reduced opacity */}
              <div className="absolute -inset-[1px] rounded-2xl overflow-hidden pointer-events-none">
                {/* Top light beam - enhanced glow */}
                <motion.div
                  className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                  initial={{ filter: 'blur(2px)' }}
                  animate={{
                    left: ['-50%', '100%'],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
                  }}
                  transition={{
                    left: {
                      duration: 2.5,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 1,
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: 'mirror',
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: 'mirror',
                    },
                  }}
                />

                {/* Right light beam - enhanced glow */}
                <motion.div
                  className="absolute top-0 right-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                  initial={{ filter: 'blur(2px)' }}
                  animate={{
                    top: ['-50%', '100%'],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
                  }}
                  transition={{
                    top: {
                      duration: 2.5,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: 0.6,
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: 0.6,
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: 0.6,
                    },
                  }}
                />

                {/* Bottom light beam - enhanced glow */}
                <motion.div
                  className="absolute bottom-0 right-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                  initial={{ filter: 'blur(2px)' }}
                  animate={{
                    right: ['-50%', '100%'],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
                  }}
                  transition={{
                    right: {
                      duration: 2.5,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: 1.2,
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: 1.2,
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: 1.2,
                    },
                  }}
                />

                {/* Left light beam - enhanced glow */}
                <motion.div
                  className="absolute bottom-0 left-0 h-[50%] w-[3px] bg-gradient-to-b from-transparent via-white to-transparent opacity-70"
                  initial={{ filter: 'blur(2px)' }}
                  animate={{
                    bottom: ['-50%', '100%'],
                    opacity: [0.3, 0.7, 0.3],
                    filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'],
                  }}
                  transition={{
                    bottom: {
                      duration: 2.5,
                      ease: 'easeInOut',
                      repeat: Infinity,
                      repeatDelay: 1,
                      delay: 1.8,
                    },
                    opacity: {
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: 1.8,
                    },
                    filter: {
                      duration: 1.5,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: 1.8,
                    },
                  }}
                />

                {/* Subtle corner glow spots - reduced opacity */}
                <motion.div
                  className="absolute top-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'mirror',
                  }}
                />
                <motion.div
                  className="absolute top-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    delay: 0.5,
                  }}
                />
                <motion.div
                  className="absolute bottom-0 right-0 h-[8px] w-[8px] rounded-full bg-white/60 blur-[2px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    delay: 1,
                  }}
                />
                <motion.div
                  className="absolute bottom-0 left-0 h-[5px] w-[5px] rounded-full bg-white/40 blur-[1px]"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                  }}
                  transition={{
                    duration: 2.3,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    delay: 1.5,
                  }}
                />
              </div>

              {/* Card border glow - reduced opacity */}
              <div className="absolute -inset-[0.5px] rounded-2xl bg-gradient-to-r from-white/3 via-white/7 to-white/3 opacity-0 group-hover:opacity-70 transition-opacity duration-500 pointer-events-none" />

              {/* Glass card background - Crisp White & Light Green */}
              <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl p-6 border border-[#D1E7DD] shadow-xl overflow-hidden text-[#0F291E]">
                {/* Subtle card inner patterns */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(135deg, #059669 0.5px, transparent 0.5px), linear-gradient(45deg, #059669 0.5px, transparent 0.5px)`,
                    backgroundSize: '30px 30px',
                  }}
                />

                {/* Logo and header */}
                <div className="text-center space-y-1 mb-5 relative z-10">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', duration: 0.8 }}
                    className="mx-auto w-11 h-11 rounded-full border border-emerald-300 flex items-center justify-center relative overflow-hidden bg-emerald-50 shadow-xs"
                  >
                    <ShieldCheck className="w-5 h-5 text-[#059669] relative z-10" />
                    {/* Inner lighting effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-transparent opacity-60" />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold text-[#0F291E]"
                  >
                    {CARD_I18N.welcome[language]}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-[#355344] text-xs"
                  >
                    {CARD_I18N.signInToContinue[language]} ({CARD_I18N.roles[activeOrgMeta.id][language]})
                  </motion.p>
                </div>

                {/* Authority / Role Quick Selector Pills */}
                <div className="mb-4 relative z-10">
                  <div className="text-[11px] font-medium text-[#355344] mb-1.5 flex items-center justify-between">
                    <span>{CARD_I18N.selectRole[language]}</span>
                    <span className="text-[#059669] font-mono text-[10px] font-bold">
                      {CARD_I18N.roles[activeOrgMeta.id][language]}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ORG_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOrg(opt.id)}
                        className={cn(
                          'px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 truncate border',
                          selectedOrg === opt.id
                            ? 'bg-[#059669] text-white border-[#059669] font-bold shadow-xs'
                            : 'bg-[#F7FAF8] text-[#355344] border-[#D1E7DD] hover:bg-[#E8F5E9] hover:text-[#059669]'
                        )}
                      >
                        {CARD_I18N.roles[opt.id][language]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                  <motion.div className="space-y-3">
                    {/* Email input */}
                    <motion.div
                      className={`relative ${focusedInput === 'email' ? 'z-10' : ''}`}
                      whileFocus={{ scale: 1.01 }}
                      whileHover={{ scale: 1.005 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Mail
                          className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                            focusedInput === 'email' ? 'text-[#059669]' : 'text-[#355344]'
                          }`}
                        />

                        <Input
                          type="text"
                          placeholder={CARD_I18N.emailPlaceholder[language]}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedInput('email')}
                          onBlur={() => setFocusedInput(null)}
                          className="w-full bg-[#F4F9F5] border-[#D1E7DD] focus:border-[#059669] text-[#0F291E] placeholder-[#355344]/50 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white"
                        />
                      </div>
                    </motion.div>

                    {/* Password input */}
                    <motion.div
                      className={`relative ${focusedInput === 'password' ? 'z-10' : ''}`}
                      whileFocus={{ scale: 1.01 }}
                      whileHover={{ scale: 1.005 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Lock
                          className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                            focusedInput === 'password' ? 'text-[#059669]' : 'text-[#355344]'
                          }`}
                        />

                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={CARD_I18N.passwordPlaceholder[language]}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedInput('password')}
                          onBlur={() => setFocusedInput(null)}
                          className="w-full bg-[#F4F9F5] border-[#D1E7DD] focus:border-[#059669] text-[#0F291E] placeholder-[#355344]/50 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white"
                        />

                        {/* Toggle password visibility */}
                        <div
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 cursor-pointer"
                        >
                          {showPassword ? (
                            <Eye className="w-4 h-4 text-[#355344] hover:text-[#0F291E] transition-colors duration-300" />
                          ) : (
                            <EyeClosed className="w-4 h-4 text-[#355344] hover:text-[#0F291E] transition-colors duration-300" />
                          )}
                        </div>
                      </div>
                    </motion.div>

                    {/* Security Captcha Row */}
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="px-3 py-1.5 rounded-lg bg-[#E8F5E9] border border-[#D1E7DD] text-[#059669] font-mono text-xs font-bold tracking-widest select-none">
                        {currentCaptcha}
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshCaptcha}
                        aria-label="Refresh captcha"
                        className="p-2 rounded-lg bg-[#F4F9F5] border border-[#D1E7DD] text-[#355344] hover:text-[#0F291E] hover:bg-[#E8F5E9] transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <Input
                        type="text"
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder={CARD_I18N.captchaPlaceholder[language]}
                        className="flex-1 bg-[#F4F9F5] border-[#D1E7DD] focus:border-[#059669] text-[#0F291E] placeholder-[#355344]/50 h-9 font-mono text-xs uppercase focus:bg-white"
                      />
                    </div>
                  </motion.div>

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={() => setRememberMe(!rememberMe)}
                          className="appearance-none h-4 w-4 rounded border border-[#D1E7DD] bg-[#F4F9F5] checked:bg-[#059669] checked:border-[#059669] focus:outline-none transition-all duration-200 cursor-pointer"
                        />
                        {rememberMe && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute inset-0 flex items-center justify-center text-white pointer-events-none"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          </motion.div>
                        )}
                      </div>
                      <label
                        htmlFor="remember-me"
                        className="text-xs text-[#355344] hover:text-[#0F291E] transition-colors duration-200 cursor-pointer font-medium"
                      >
                        {CARD_I18N.rememberMe[language]}
                      </label>
                    </div>

                    <div className="text-xs relative group/link">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectOrg(selectedOrg);
                          addToast({
                            title: 'Demo Credentials Restored',
                            message: `Auto-filled credentials for ${activeOrgMeta.shortLabel}.`,
                            type: 'info',
                          });
                        }}
                        className="text-[#355344] hover:text-[#059669] transition-colors duration-200 font-medium"
                      >
                        {CARD_I18N.forgotPassword[language]}
                      </button>
                    </div>
                  </div>

                  {/* Sign in button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group/button mt-4"
                  >
                    <div className="relative overflow-hidden bg-[#059669] text-white hover:bg-[#047857] font-semibold h-10 rounded-lg transition-all duration-300 flex items-center justify-center shadow-md shadow-emerald-900/15">
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center"
                          >
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </motion.div>
                        ) : (
                          <motion.span
                            key="button-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-1.5 text-sm font-semibold"
                          >
                            {CARD_I18N.signInButton[language]} {CARD_I18N.roles[activeOrgMeta.id][language]}
                            <ArrowRight className="w-3.5 h-3.5 group-hover/button:translate-x-1 transition-transform duration-300" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>

                  {/* Minimal Divider */}
                  <div className="relative mt-2 mb-4 flex items-center">
                    <div className="flex-grow border-t border-[#D1E7DD]"></div>
                    <span className="mx-3 text-xs text-[#355344]/70 font-medium">
                      {CARD_I18N.or[language]}
                    </span>
                    <div className="flex-grow border-t border-[#D1E7DD]"></div>
                  </div>

                  {/* Google / Instant Citizen SSO Sign In */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleGoogleOrQuickCitizenSignIn}
                    className="w-full relative group/google"
                  >
                    <div className="relative overflow-hidden bg-[#E8F5E9] text-[#0F291E] font-medium h-10 rounded-lg border border-[#D1E7DD] hover:bg-[#D1FAE5] transition-all duration-300 flex items-center justify-center gap-2">
                      <span className="text-[#059669] text-xs font-semibold">
                        {CARD_I18N.citizenQuickAccess[language]}
                      </span>
                    </div>
                  </motion.button>

                  {/* Sign up link */}
                  <motion.p
                    className="text-center text-xs text-[#355344] mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {CARD_I18N.needAssistance[language]}{' '}
                    <RouterLink
                      to="/map"
                      onClick={() => completeSignIn('citizen')}
                      className="text-[#059669] hover:text-[#047857] transition-colors font-semibold underline"
                    >
                      {CARD_I18N.publicSafetyMap[language]}
                    </RouterLink>
                  </motion.p>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
