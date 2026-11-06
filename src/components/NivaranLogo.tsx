import React, { useId } from 'react';

interface NivaranLogoProps {
  size?: number;
  className?: string;
}

/**
 * NIVARAN Official Emblem:
 * A precision-crafted National Disaster Resilience & Relocation Command Crest.
 * Features an armored dual-bevel shield, iconic stylized 'N' shelter pillars,
 * golden faceted apex beacon of safety & early warning, and lower terrain hydrology curves.
 */
export const NivaranLogo: React.FC<NivaranLogoProps> = ({ size = 44, className = '' }) => {
  const uid = useId().replace(/:/g, '_');
  const shieldGradId = `nivaran_shield_${uid}`;
  const bevelGradId = `nivaran_bevel_${uid}`;
  const waveGradId = `nivaran_wave_${uid}`;
  const shadowId = `nivaran_shadow_${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-sm select-none transition-transform ${className}`}
      aria-label="NIVARAN Official Disaster Resilience Emblem"
      role="img"
    >
      <defs>
        {/* Main Emerald Gradient */}
        <linearGradient id={shieldGradId} x1="32" y1="3" x2="32" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="45%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Rim Bevel Gradient */}
        <linearGradient id={bevelGradId} x1="11" y1="4" x2="53" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="50%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#065F46" />
        </linearGradient>

        {/* Topographic & Hydrology Wave Gradient */}
        <linearGradient id={waveGradId} x1="16" y1="48" x2="48" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>

        {/* Subtle Crest Drop Shadow */}
        <filter id={shadowId} x="6" y="2" width="52" height="62" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0F291E" floodOpacity="0.28" />
        </filter>
      </defs>

      {/* 1. Base Guardian Hex-Shield with Bevel Edge */}
      <g filter={`url(#${shadowId})`}>
        <path
          d="M32 4L11 12V28C11 43.5 20 55 32 59.5C44 55 53 43.5 53 28V12L32 4Z"
          fill={`url(#${shieldGradId})`}
          stroke={`url(#${bevelGradId})`}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Inner Refined White Rim */}
        <path
          d="M32 7.5L14 14V27.5C14 41 21.5 51.5 32 55.5C42.5 51.5 50 41 50 27.5V14L32 7.5Z"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeOpacity="0.45"
          strokeLinejoin="round"
        />
      </g>

      {/* 2. Apex Golden Faceted Beacon / Early Warning Star of Hope */}
      <path d="M32 8.5L27.5 14L32 19.5V8.5Z" fill="#D97706" />
      <path d="M32 8.5L36.5 14L32 19.5V8.5Z" fill="#FDE047" />
      <path d="M29.5 14L32 12.5L34.5 14L32 15.5Z" fill="#FFFFFF" />

      {/* 3. Iconic Stylized Continuous 'N' Monogram (Disaster Shelter & Relief Pillar) */}
      <path
        d="M21.5 45V23.5L42.5 45V23.5"
        stroke="#FFFFFF"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4. Central Radiant Core Beacon */}
      <circle cx="32" cy="34.25" r="2.2" fill="#FFFFFF" />
      <circle cx="32" cy="34.25" r="1.2" fill="#059669" />

      {/* 5. Lower Hydrology & Flood Mitigation Waves */}
      <path
        d="M16 49.5C21 47 26.5 47 32 49.5C37.5 52 43 52 48 49.5"
        stroke={`url(#${waveGradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M20 54C24 52 28 52 32 54C36 56 40 56 44 54"
        stroke={`url(#${waveGradId})`}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
    </svg>
  );
};
