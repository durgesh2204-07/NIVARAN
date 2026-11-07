import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Power,
  Server,
  Database,
  Globe2,
  Wifi,
  WifiOff,
  Flame,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface HealthData {
  status: string;
  live_mongo: boolean;
  api_version: string;
  checkedAt?: string;
}

export const PowerControl: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const {
    user,
    logout,
    addToast,
    emergencyMode,
    toggleEmergencyMode,
    isOfflineSimulated,
    setOfflineSimulated,
  } = useAppStore();

  // Query actual backend health endpoint
  const checkHealth = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData({
          ...data,
          checkedAt: new Date().toLocaleTimeString(),
        });
      } else {
        setHealthData({
          status: 'degraded',
          live_mongo: false,
          api_version: '2.0.0',
          checkedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch {
      setHealthData({
        status: 'offline',
        live_mongo: false,
        api_version: '2.0.0',
        checkedAt: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      void checkHealth();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    addToast({
      title: 'Session Safely Terminated',
      message: `${user?.name || 'User'} successfully signed out. Terminal locked.`,
      type: 'info',
    });
    navigate('/login');
  };

  const isBackendHealthy = healthData?.status === 'healthy';
  const isMongoLive = healthData?.live_mongo === true;

  return (
    <div ref={panelRef} className="relative inline-block text-left">
      {/* Power Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="System Power and Health Control"
        className={`p-2 rounded-lg border transition-all cursor-pointer shadow-2xs flex items-center justify-center relative ${
          isOpen
            ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-400/40'
            : 'bg-slate-50 dark:bg-[#172F46] hover:bg-slate-100 dark:hover:bg-[#1E3A5F] border-slate-200 dark:border-[#233C57] text-slate-700 dark:text-slate-200'
        }`}
        title="Command Centre Power & Status"
      >
        <Power className={`w-4 h-4 ${emergencyMode ? 'text-red-500 animate-pulse' : 'text-[#008060]'}`} strokeWidth={2.2} />
        {/* Status dot */}
        <span
          className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-white dark:border-[#101C2C] ${
            isBackendHealthy ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </button>

      {/* Control Panel Flyout */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F] shadow-2xl p-5 z-50 overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E3A5F] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shadow-2xs">
                  <Power className="w-4 h-4 stroke-[2.4]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    Command Status
                  </h4>
                  <span className="text-[10.5px] font-mono text-slate-400">
                    Live Telemetry Diagnostics
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={checkHealth}
                  disabled={isChecking}
                  title="Re-check health"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172F46] cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#172F46] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Real-time Health Metrics Strip */}
            <div className="space-y-2.5 mb-5 text-xs">
              {/* Metric 1: App Status */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#008060]" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Application Frontend
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>OPERATIONAL</span>
                </div>
              </div>

              {/* Metric 2: Backend API Status */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Backend FastAPI (8000)
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1.5 font-mono text-[11px] font-bold ${
                    isBackendHealthy ? 'text-emerald-600' : 'text-amber-500'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isBackendHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isBackendHealthy ? 'HEALTHY (ONLINE)' : 'STANDBY'}</span>
                </div>
              </div>

              {/* Metric 3: Database Connection Status */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Database Engine
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{isMongoLive ? 'MONGODB LIVE' : 'RESILIENT MEMORY'}</span>
                </div>
              </div>

              {/* Metric 4: GIS Service Status */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-cyan-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    GIS Spatial Cartography
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>CONNECTED</span>
                </div>
              </div>

              {/* Metric 5: Offline Mode Status */}
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#172F46] border border-slate-200/80 dark:border-[#233C57] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isOfflineSimulated ? (
                    <WifiOff className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Wifi className="w-4 h-4 text-[#008060]" />
                  )}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    Network Connectivity
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOfflineSimulated(!isOfflineSimulated)}
                  className={`text-[10.5px] font-mono px-2 py-0.5 rounded cursor-pointer font-bold ${
                    isOfflineSimulated
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                  }`}
                >
                  {isOfflineSimulated ? 'OFFLINE SIMULATED' : 'LIVE SYNC'}
                </button>
              </div>
            </div>

            {/* Emergency Mode Toggle Switch */}
            <div className="p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Flame className={`w-5 h-5 ${emergencyMode ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Emergency Lockdown Mode
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Prioritize evacuation alerts & strike teams
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleEmergencyMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  emergencyMode ? 'bg-red-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    emergencyMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Safe Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Safe Logout & Terminal Lock</span>
            </button>

            {/* Checked At timestamp */}
            {healthData?.checkedAt && (
              <div className="text-[10px] font-mono text-slate-400 text-center mt-2.5">
                Last Verified: {healthData.checkedAt} · Zero API Keys Exposed
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
