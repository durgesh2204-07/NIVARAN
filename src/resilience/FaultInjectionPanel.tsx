import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Sliders, Terminal, WifiOff, X } from 'lucide-react';
import {
  DependencyHealth,
  FaultInjectionConfig,
  getDependencyHealthList,
  getFaultInjectionConfig,
  setFaultInjectionConfig,
  subscribeFaultInjection,
} from './apiClient';
import { getWebVitalsSnapshot, WebVitalSnapshot } from './reporter';
import { useAppStore } from '../store/useAppStore';

/**
 * Hidden-in-production Fault Injection & Resilience Verification Panel (Section 9.6).
 * Rendered ONLY when `import.meta.env.DEV` is true.
 * Allows testing every graceful degradation fallback (network off, slow 3G latency,
 * HTTP 500/429, malformed JSON, and individual feed kill-switches).
 */
export const FaultInjectionPanel: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [cfg, setCfg] = useState<FaultInjectionConfig>(() => getFaultInjectionConfig());
  const [deps, setDeps] = useState<DependencyHealth[]>(() => getDependencyHealthList());
  const [vitals, setVitals] = useState<WebVitalSnapshot[]>(() => getWebVitalsSnapshot());
  const setOfflineSimulated = useAppStore((s) => s.setOfflineSimulated);

  useEffect(() => {
    const unsub = subscribeFaultInjection((next) => {
      setCfg({ ...next });
      setOfflineSimulated(next.forceOffline);
    });
    const timer = window.setInterval(() => {
      setDeps(getDependencyHealthList());
      setVitals(getWebVitalsSnapshot());
    }, 2500);
    return () => {
      unsub();
      window.clearInterval(timer);
    };
  }, [setOfflineSimulated]);

  const update = (partial: Partial<FaultInjectionConfig>) => {
    const next = setFaultInjectionConfig(partial);
    setCfg(next);
  };

  const activeFaultCount =
    (cfg.forceOffline ? 1 : 0) +
    (cfg.artificialLatencyMs > 0 ? 1 : 0) +
    (cfg.simulatedFailureMode !== 'none' ? 1 : 0) +
    (cfg.disableWeatherFeed ? 1 : 0) +
    (cfg.disableSeismicFeed ? 1 : 0) +
    (cfg.disableNominatimFeed ? 1 : 0) +
    (cfg.disableOsrmRouting ? 1 : 0) +
    (cfg.disable3dTerrainTiles ? 1 : 0);

  if (!open) {
    return (
      <div className="fixed bottom-3 right-3 z-50 print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Developer Fault Injection & Resilience Matrix (DEV only)"
          className={`neu-btn-sm px-3 py-1.5 text-[11px] font-mono font-semibold flex items-center gap-1.5 ${
            activeFaultCount > 0
              ? 'border-2 border-[#EA580C] text-[#EA580C]'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
          <span>Fault Injection (DEV)</span>
          {activeFaultCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-[#EA580C] text-white text-[10px]">
              {activeFaultCount} active
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Developer Fault Injection Panel"
      className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] neu-raised p-4 border-2 border-[#0B8F80] space-y-3 text-xs print:hidden"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
          <span className="font-mono font-bold text-[var(--text-primary)]">
            Fault Injection & Circuit Health (DEV)
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close Fault Injection Panel"
          className="neu-btn-sm p-1"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Network & Latency Controls */}
      <div className="space-y-2">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-1.5 font-medium">
            <WifiOff className="w-3.5 h-3.5 text-[#B91C1C]" strokeWidth={1.75} />
            <span>Force Offline Mode (IndexedDB Queue)</span>
          </span>
          <input
            type="checkbox"
            checked={cfg.forceOffline}
            onChange={(e) => update({ forceOffline: e.target.checked })}
            className="accent-[#0B8F80] w-4 h-4"
          />
        </label>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--text-secondary)]">Artificial Latency:</span>
          <select
            value={cfg.artificialLatencyMs}
            onChange={(e) => update({ artificialLatencyMs: Number(e.target.value) })}
            className="neu-input px-2 py-1 text-xs font-mono"
          >
            <option value={0}>0 ms (Normal)</option>
            <option value={1200}>1200 ms (Slow 3G)</option>
            <option value={4000}>4000 ms (Congested)</option>
          </select>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--text-secondary)]">API Failure Mode:</span>
          <select
            value={cfg.simulatedFailureMode}
            onChange={(e) =>
              update({
                simulatedFailureMode: e.target.value as FaultInjectionConfig['simulatedFailureMode'],
              })
            }
            className="neu-input px-2 py-1 text-xs font-mono"
          >
            <option value="none">None (Healthy)</option>
            <option value="http_500">HTTP 500 Server Error</option>
            <option value="http_429">HTTP 429 Rate Limit</option>
            <option value="timeout">Request Timeout</option>
            <option value="malformed_json">Malformed JSON Payload</option>
          </select>
        </div>
      </div>

      {/* Individual Feed Kill Switches */}
      <div className="neu-flat p-2.5 rounded-[10px] space-y-1.5">
        <p className="text-[11px] font-mono font-semibold text-[var(--text-secondary)] uppercase">
          Degradation Matrix Kill-Switches
        </p>
        {[
          { key: 'disableWeatherFeed' as const, label: 'Disable Open-Meteo Weather → Historical fallback' },
          { key: 'disableSeismicFeed' as const, label: 'Disable USGS Seismic → Status chip fallback' },
          { key: 'disableNominatimFeed' as const, label: 'Disable Nominatim → Seeded habitations only' },
          { key: 'disableOsrmRouting' as const, label: 'Disable OSRM Routing → Straight-line bearing' },
          { key: 'disable3dTerrainTiles' as const, label: 'Disable 3D DEM Tiles → Auto 2D fallback' },
        ].map((item) => (
          <label key={item.key} className="flex items-center justify-between gap-2 cursor-pointer text-[11px]">
            <span>{item.label}</span>
            <input
              type="checkbox"
              checked={cfg[item.key]}
              onChange={(e) => update({ [item.key]: e.target.checked })}
              className="accent-[#0B8F80]"
            />
          </label>
        ))}
      </div>

      {/* Circuit Breakers */}
      <div className="neu-flat p-2.5 rounded-[10px] space-y-1">
        <p className="text-[11px] font-mono font-semibold text-[var(--text-secondary)] uppercase flex items-center gap-1">
          <Activity className="w-3 h-3 text-[#0B8F80]" strokeWidth={1.75} />
          <span>Host Circuit Breakers</span>
        </p>
        <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
          {deps.map((d) => (
            <div key={d.id} className="flex items-center justify-between text-[11px] font-mono">
              <span className="truncate">{d.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  d.circuit === 'closed'
                    ? 'bg-[#15803D] text-white'
                    : d.circuit === 'half-open'
                    ? 'bg-[#CA8A04] text-white'
                    : 'bg-[#B91C1C] text-white'
                }`}
              >
                {d.circuit.toUpperCase()} {d.lastLatencyMs ? `· ${d.lastLatencyMs}ms` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Web Vitals Snapshot */}
      {vitals.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {vitals.map((v) => (
            <span
              key={v.name}
              className="neu-flat px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text-secondary)]"
            >
              {v.name}: {v.value} ({v.rating})
            </span>
          ))}
        </div>
      )}

      {activeFaultCount > 0 && (
        <button
          type="button"
          onClick={() =>
            update({
              forceOffline: false,
              artificialLatencyMs: 0,
              simulatedFailureMode: 'none',
              disableWeatherFeed: false,
              disableSeismicFeed: false,
              disableNominatimFeed: false,
              disableOsrmRouting: false,
              disable3dTerrainTiles: false,
            })
          }
          className="w-full neu-btn py-1.5 text-xs font-semibold text-[#B91C1C] flex items-center justify-center gap-1"
        >
          <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Reset All Injected Faults</span>
        </button>
      )}
    </div>
  );
};
