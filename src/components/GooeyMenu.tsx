import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  LayoutDashboard,
  Globe,
  ShieldAlert,
  Bell,
  Building2,
  MapPin,
  FileText,
  HeartHandshake,
  BarChart3,
  Settings,
  X,
  Layers,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface MenuItem {
  to: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  color: string;
}

const MENU_ITEMS: MenuItem[] = [
  { to: '/dashboard', label: 'Dashboard', shortLabel: 'Dash', icon: LayoutDashboard, color: '#008060' },
  { to: '/map', label: 'Live GIS Command', shortLabel: 'GIS', icon: Globe, color: '#0284C7' },
  { to: '/gis', label: 'Risk Zones & Layers', shortLabel: 'Zones', icon: ShieldAlert, color: '#DC2626' },
  { to: '/alerts', label: 'Disaster Alerts', shortLabel: 'Alerts', icon: Bell, color: '#EA580C' },
  { to: '/resources', label: 'Safe Shelters', shortLabel: 'Shelters', icon: Building2, color: '#16A34A' },
  { to: '/planning', label: 'Relocation Planning', shortLabel: 'Plan', icon: MapPin, color: '#8B5CF6' },
  { to: '/community-reports', label: 'Field Reports', shortLabel: 'Reports', icon: FileText, color: '#D97706' },
  { to: '/volunteers', label: 'Volunteers & Mitra', shortLabel: 'Volunteers', icon: HeartHandshake, color: '#EC4899' },
  { to: '/impact', label: 'Impact Analytics', shortLabel: 'Analytics', icon: BarChart3, color: '#06B6D4' },
  { to: '/settings', label: 'System Settings', shortLabel: 'Settings', icon: Settings, color: '#64748B' },
];

export const GooeyMenu: React.FC = () => {
  const isOpen = useAppStore((s) => s.gooeyMenuOpen);
  const setIsOpen = useAppStore((s) => s.setGooeyMenuOpen);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Push-back layered 3D depth effect on main app interface
  useEffect(() => {
    const mainEl = document.getElementById('main-app-content');
    if (!mainEl) return;

    if (isOpen) {
      mainEl.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), filter 0.4s ease, border-radius 0.4s ease';
      mainEl.style.transform = 'scale(0.96) perspective(1200px) translateZ(-40px)';
      mainEl.style.filter = 'brightness(0.90) saturate(0.9)';
      mainEl.style.borderRadius = '24px';
      mainEl.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.45)';
      mainEl.style.overflow = 'hidden';
      mainEl.style.pointerEvents = 'none';
    } else {
      mainEl.style.transform = 'none';
      mainEl.style.filter = 'none';
      mainEl.style.borderRadius = '0px';
      mainEl.style.boxShadow = 'none';
      mainEl.style.pointerEvents = 'auto';
    }

    return () => {
      if (mainEl) {
        mainEl.style.transform = 'none';
        mainEl.style.filter = 'none';
        mainEl.style.borderRadius = '0px';
        mainEl.style.boxShadow = 'none';
        mainEl.style.pointerEvents = 'auto';
      }
    };
  }, [isOpen]);

  const handleItemClick = (to: string) => {
    const mainEl = document.getElementById('main-app-content');
    if (mainEl) {
      mainEl.style.transform = 'none';
      mainEl.style.filter = 'none';
      mainEl.style.borderRadius = '0px';
      mainEl.style.boxShadow = 'none';
      mainEl.style.pointerEvents = 'auto';
    }
    setIsOpen(false);
    navigate(to);
  };

  return (
    <>
      {/* SVG Gooey Morphing Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="gooey-morph-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Floating Gooey Menu Container */}
      <div
        ref={menuRef}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center select-none pointer-events-auto"
      >
        {/* Backdrop for click outside */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                const mainEl = document.getElementById('main-app-content');
                if (mainEl) {
                  mainEl.style.transform = 'none';
                  mainEl.style.filter = 'none';
                  mainEl.style.borderRadius = '0px';
                  mainEl.style.boxShadow = 'none';
                  mainEl.style.pointerEvents = 'auto';
                }
                setIsOpen(false);
              }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 pointer-events-auto"
            />
          )}
        </AnimatePresence>

        {/* Menu Items Flyout */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 360 }}
              className="fixed bottom-24 right-6 z-50 p-4 rounded-3xl bg-white/95 dark:bg-[#101C2C]/95 backdrop-blur-xl border border-slate-200/90 dark:border-[#1E3A5F] shadow-2xl max-w-sm sm:max-w-md w-auto pointer-events-auto"
            >
              {/* Header Label inside flyout */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-[#1E3A5F]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#008060] animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                    Gooey Command Hub
                  </span>
                </div>
                <span className="text-[10.5px] font-mono text-slate-400">10 Core Modules</span>
              </div>

              {/* 2-Column Grid of 10 Options */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 min-w-[280px] sm:min-w-[340px]">
                {MENU_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={(e) => {
                        e.preventDefault();
                        handleItemClick(item.to);
                      }}
                      className={`p-2.5 rounded-2xl flex items-center gap-2.5 text-left transition-all cursor-pointer group relative overflow-hidden pointer-events-auto ${
                        isActive
                          ? 'bg-[#008060] text-white shadow-md'
                          : 'bg-slate-50 dark:bg-[#172F46] hover:bg-slate-100 dark:hover:bg-[#1E3A5F] text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-[#233C57]'
                      }`}
                      title={`Open ${item.label}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white dark:bg-[#101C2C] shadow-2xs'
                        }`}
                        style={{ color: isActive ? '#FFFFFF' : item.color }}
                      >
                        <Icon className="w-4 h-4 stroke-[2.2]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate leading-tight">
                          {item.label}
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-400'
                          }`}
                        >
                          {item.shortLabel}
                        </div>
                      </div>

                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Push-back note footer */}
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1E3A5F] flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Push-Back 3D Depth Active</span>
                <span>ESC to Close</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Central Floating Action Button */}
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          aria-label={isOpen ? 'Close Gooey Navigation Hub' : 'Open Gooey Navigation Hub'}
          title={isOpen ? 'Close Hub (ESC)' : 'Open Gooey Command Hub'}
          className={`relative z-50 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer pointer-events-auto transition-all ${
            isOpen
              ? 'bg-[#DC2626] hover:bg-[#B91C1C] ring-4 ring-red-400/30'
              : 'bg-[#008060] hover:bg-[#006e52] ring-4 ring-[#008060]/30'
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Compass className="w-6 h-6 stroke-[2.2] animate-spin-slow" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
};

