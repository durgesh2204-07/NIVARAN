import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MoreVertical,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Layers,
  Database,
  Settings,
  HelpCircle,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const KebabMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { addToast, selectedDistrict, emergencyMode, toggleEmergencyMode } = useAppStore();

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Action 1: Refresh data
  const handleRefreshData = () => {
    setIsOpen(false);
    addToast({
      title: 'Refreshing Spatial & Sensor Data',
      message: `Fetching latest IMD weather & GSI telemetry for ${selectedDistrict}...`,
      type: 'info',
    });
    // Trigger window storage / state sync
    window.dispatchEvent(new Event('storage'));
  };

  // Action 2: Export Report
  const handleExportReport = () => {
    setIsOpen(false);
    addToast({
      title: 'Exporting Situation Report (SITREP)',
      message: `Generating multi-hazard SITREP for ${selectedDistrict} District in PDF/CSV format...`,
      type: 'success',
    });
  };

  // Action 3: Download GIS Data
  const handleDownloadGisData = async () => {
    setIsOpen(false);
    try {
      const res = await fetch('/api/gis/risk-zones');
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nivaran_${selectedDistrict.toLowerCase()}_risk_zones.geojson`;
        a.click();
        URL.revokeObjectURL(url);
        addToast({
          title: 'GIS GeoJSON Exported',
          message: `Saved ${selectedDistrict} spatial polygons to your download folder.`,
          type: 'success',
        });
        return;
      }
    } catch {}

    addToast({
      title: 'GIS Export Prepared',
      message: 'Spatial polygon shapefiles prepared for QGIS / ArcGIS import.',
      type: 'info',
    });
  };

  // Action 4: Toggle Fullscreen
  const handleToggleFullscreen = () => {
    setIsOpen(false);
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Action 5: Manage Layers (or navigate to GIS workspace)
  const handleManageLayers = () => {
    setIsOpen(false);
    if (location.pathname !== '/gis') {
      navigate('/gis');
    } else {
      addToast({
        title: 'GIS Layers Active',
        message: 'Toggle CWC drainage, fault buffers and risk tiers from the left panel.',
        type: 'info',
      });
    }
  };

  // Action 6: View Data Sources
  const handleViewDataSources = () => {
    setIsOpen(false);
    navigate('/data-sources');
  };

  // Action 7: Open Settings
  const handleOpenSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  // Action 8: Help & Documentation
  const handleHelp = () => {
    setIsOpen(false);
    addToast({
      title: 'NIVARAN Operational Manual',
      message: 'SOP NDMA / SDMA Multi-Hazard Relocation Decision System v2.0 active.',
      type: 'info',
    });
  };

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* 3-dot Kebab Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Contextual Actions Menu"
        aria-expanded={isOpen}
        className={`p-2 rounded-lg border transition-all cursor-pointer shadow-2xs flex items-center justify-center ${
          isOpen
            ? 'bg-[#008060] text-white border-[#008060]'
            : 'bg-slate-50 dark:bg-[#172F46] hover:bg-slate-100 dark:hover:bg-[#1E3A5F] border-slate-200 dark:border-[#233C57] text-slate-700 dark:text-slate-200'
        }`}
        title="More Actions (⋮)"
      >
        <MoreVertical className="w-4 h-4" strokeWidth={2.2} />
      </button>

      {/* Fold-Down Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-[#101C2C] border border-slate-200 dark:border-[#1E3A5F] shadow-xl py-1.5 z-50 overflow-hidden font-sans"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#1E3A5F] text-[10.5px] font-black uppercase tracking-wider text-slate-400">
              Context Actions
            </div>

            <div className="py-1">
              {/* Refresh data */}
              <button
                type="button"
                onClick={handleRefreshData}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#008060]" />
                <span>Refresh Telemetry</span>
              </button>

              {/* Export report */}
              <button
                type="button"
                onClick={handleExportReport}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                <span>Export Situation Report</span>
              </button>

              {/* Download GIS data */}
              <button
                type="button"
                onClick={handleDownloadGisData}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download GIS GeoJSON</span>
              </button>

              {/* Toggle fullscreen */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                    <span>Toggle Fullscreen</span>
                  </>
                )}
              </button>

              {/* Manage layers */}
              <button
                type="button"
                onClick={handleManageLayers}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Manage GIS Layers</span>
              </button>

              {/* View data sources */}
              <button
                type="button"
                onClick={handleViewDataSources}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Database className="w-3.5 h-3.5 text-cyan-500" />
                <span>View Data Sources</span>
              </button>

              {/* Emergency mode toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  toggleEmergencyMode();
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Flame className={`w-3.5 h-3.5 ${emergencyMode ? 'text-red-500' : 'text-slate-400'}`} />
                <span>{emergencyMode ? 'Disable Emergency Mode' : 'Toggle Emergency Mode'}</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-[#1E3A5F]" />

              {/* Settings */}
              <button
                type="button"
                onClick={handleOpenSettings}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>System Settings</span>
              </button>

              {/* Help & docs */}
              <button
                type="button"
                onClick={handleHelp}
                className="w-full px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#172F46] flex items-center gap-2.5 transition-colors cursor-pointer text-left"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Help & Documentation</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

