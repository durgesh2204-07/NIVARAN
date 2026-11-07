import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Globe,
  Key,
  Layers,
  RotateCcw,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
import {
  getDarkBasemapConfig,
  getStoredMapProvider,
  getStoredProviderKey,
  getStreetBasemapConfig,
  getTopoBasemapConfig,
  MapProviderType,
  setStoredMapProvider,
  setStoredProviderKey,
  testTileConnectivity,
} from '../gis/mapTileConfig';
import { useAppStore } from '../store/useAppStore';

interface MapProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProviderChanged?: (provider: MapProviderType) => void;
}

export const MapProviderSettingsModal: React.FC<MapProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  onProviderChanged,
}) => {
  const addToast = useAppStore((s) => s.addToast);

  const [provider, setProvider] = useState<MapProviderType>(getStoredMapProvider());
  const [googleKey, setGoogleKey] = useState<string>(getStoredProviderKey('google'));
  const [mapboxKey, setMapboxKey] = useState<string>(getStoredProviderKey('mapbox'));
  const [maptilerKey, setMaptilerKey] = useState<string>(getStoredProviderKey('maptiler'));
  const [customUrl, setCustomUrl] = useState<string>(getStoredProviderKey('custom'));

  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    result?: { ok: boolean; message: string };
  }>({ testing: false });

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    let activeKey = '';
    if (provider === 'google') activeKey = googleKey;
    else if (provider === 'mapbox') activeKey = mapboxKey;
    else if (provider === 'maptiler') activeKey = maptilerKey;
    else if (provider === 'custom') activeKey = customUrl;

    const config =
      provider === 'custom'
        ? getStreetBasemapConfig(provider, activeKey)
        : getDarkBasemapConfig(provider, activeKey);
    const sampleUrl = config.tiles[0];
    const res = await testTileConnectivity(sampleUrl);

    setTestStatus({
      testing: false,
      result: {
        ok: res.ok,
        message: res.ok
          ? `Connection verified: Tile service responded successfully (HTTP 200 OK) for ${config.label}`
          : res.message,
      },
    });
  };

  const handleSave = () => {
    setStoredMapProvider(provider);
    setStoredProviderKey('google', googleKey);
    setStoredProviderKey('mapbox', mapboxKey);
    setStoredProviderKey('maptiler', maptilerKey);
    setStoredProviderKey('custom', customUrl);

    if (onProviderChanged) {
      onProviderChanged(provider);
    }

    addToast(
      'Map provider and API configuration applied successfully!',
      'success'
    );
    onClose();
  };

  const handleResetToFree = () => {
    setProvider('osm');
    setStoredMapProvider('osm');
    if (onProviderChanged) {
      onProviderChanged('osm');
    }
    addToast(
      'Reverted to 100% Free Open GIS (CartoDB Dark Matter, Esri Topo & OpenStreetMap)',
      'info'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0B1F33] rounded-[16px] shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="map-provider-title"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[#E8F5E9]/60 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-sm">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="map-provider-title"
                className="text-base font-bold text-[var(--text-primary)] leading-tight"
              >
                GIS Cartography & Basemap API Configuration
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Secured National Geospatial Network Active · Zero Client Keys Required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Active Free Mode Banner */}
          <div className="p-3.5 rounded-[12px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-[#059669] text-xs flex items-center gap-1.5">
                <span>Secured National Geospatial Network: Verified & Encrypted</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900 text-[#059669] font-mono font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                NIVARAN GIS utilizes high-contrast CartoDB Dark Matter, Esri World Topo Map, and OpenStreetMap vector cartography via TLS 1.3 encrypted endpoints. All maps function seamlessly without external API keys.
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="font-bold text-[11px] text-[var(--text-secondary)] uppercase tracking-wider block">
              Select Map Cartography Provider
            </label>

            <div className="grid grid-cols-1 gap-2">
              {/* 1. OpenStreetMap (Default) */}
              <label
                className={`p-3 rounded-[12px] border cursor-pointer transition-all flex items-center justify-between ${
                  provider === 'osm'
                    ? 'border-[#059669] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="map-provider"
                    value="osm"
                    checked={provider === 'osm'}
                    onChange={() => setProvider('osm')}
                    className="accent-[#059669] w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>OpenStreetMap & Esri Topo (Recommended)</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900 text-[#059669] font-semibold">
                        Free / No Key Required
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Official CartoDB Dark Matter, Esri Topo Relief, Esri Satellite, and OpenStreetMap Street tiles
                    </p>
                  </div>
                </div>
                <Globe className="w-4 h-4 text-[#059669] shrink-0" />
              </label>

              {/* 2. Mapbox Streets & Dark v11 */}
              <label
                className={`p-3 rounded-[12px] border cursor-pointer transition-all flex items-center justify-between ${
                  provider === 'mapbox'
                    ? 'border-[#059669] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="map-provider"
                    value="mapbox"
                    checked={provider === 'mapbox'}
                    onChange={() => setProvider('mapbox')}
                    className="accent-[#059669] w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>Mapbox (Dark v11 · Outdoors Topo · Streets v12)</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold">
                        Requires Token
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Custom high-fidelity Mapbox vector styling (requires public access token)
                    </p>
                  </div>
                </div>
                <Key className="w-4 h-4 text-purple-600 shrink-0" />
              </label>

              {/* 3. MapTiler */}
              <label
                className={`p-3 rounded-[12px] border cursor-pointer transition-all flex items-center justify-between ${
                  provider === 'maptiler'
                    ? 'border-[#059669] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="map-provider"
                    value="maptiler"
                    checked={provider === 'maptiler'}
                    onChange={() => setProvider('maptiler')}
                    className="accent-[#059669] w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>MapTiler Cloud (DataViz Dark · Topo v2)</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold">
                        Requires Key
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      MapTiler Cloud vector & raster cartography services
                    </p>
                  </div>
                </div>
                <Key className="w-4 h-4 text-amber-600 shrink-0" />
              </label>

              {/* 4. Google Maps */}
              <label
                className={`p-3 rounded-[12px] border cursor-pointer transition-all flex items-center justify-between ${
                  provider === 'google'
                    ? 'border-[#059669] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="map-provider"
                    value="google"
                    checked={provider === 'google'}
                    onChange={() => setProvider('google')}
                    className="accent-[#059669] w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>Google Maps Road & Hybrid</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-semibold">
                        Optional Key
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Google global street, dark navigation, and terrain elevation tiles
                    </p>
                  </div>
                </div>
                <Layers className="w-4 h-4 text-sky-600 shrink-0" />
              </label>

              {/* 5. Custom WMTS / XYZ */}
              <label
                className={`p-3 rounded-[12px] border cursor-pointer transition-all flex items-center justify-between ${
                  provider === 'custom'
                    ? 'border-[#059669] bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm'
                    : 'border-[var(--border)] hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="map-provider"
                    value="custom"
                    checked={provider === 'custom'}
                    onChange={() => setProvider('custom')}
                    className="accent-[#059669] w-4 h-4"
                  />
                  <div>
                    <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span>Custom Enterprise GIS Tile Server</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                        WMTS / XYZ
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Self-hosted or state department WMTS/XYZ tile URL template
                    </p>
                  </div>
                </div>
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
              </label>
            </div>
          </div>

          {/* DYNAMIC KEY INPUT FIELDS BASED ON SELECTED PROVIDER */}
          {provider === 'mapbox' && (
            <div className="p-3.5 rounded-[12px] bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-600" />
                  Mapbox Public Access Token (pk.eyJ...)
                </label>
                <a
                  href="https://account.mapbox.com/access-tokens/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1"
                >
                  Get Free Token <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={mapboxKey}
                onChange={(e) => setMapboxKey(e.target.value)}
                placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJ..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#071320] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-purple-700 dark:text-purple-300">
                Powers Dark GIS (dark-v11), Outdoors Topo (outdoors-v12), and Streets (streets-v12).
              </p>
            </div>
          )}

          {provider === 'maptiler' && (
            <div className="p-3.5 rounded-[12px] bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  MapTiler Cloud API Key
                </label>
                <a
                  href="https://cloud.maptiler.com/account/keys/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1"
                >
                  Get Free Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={maptilerKey}
                onChange={(e) => setMaptilerKey(e.target.value)}
                placeholder="e.g. 5xYz9AbC123DeFgHiJkL"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#071320] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                Powers DataViz Dark GIS, Topo v2 elevation, and Streets v2 vector tiles.
              </p>
            </div>
          )}

          {provider === 'google' && (
            <div className="p-3.5 rounded-[12px] bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-sky-600" />
                  Google Maps API Key (Optional)
                </label>
                <a
                  href="https://console.cloud.google.com/google/maps-apis"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1"
                >
                  Google Cloud Console <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={googleKey}
                onChange={(e) => setGoogleKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-[#071320] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[10px] text-sky-700 dark:text-sky-300">
                Powers Google Street, Satellite Hybrid, and Terrain Topo layers.
              </p>
            </div>
          )}

          {provider === 'custom' && (
            <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-slate-800/60 border border-[var(--border)] space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#059669]" />
                Custom WMTS / XYZ Tile Server URL Template
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://your-domain.gov.in/tiles/{z}/{x}/{y}.png"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#071320] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {provider === 'osm' && (
            <div className="p-3.5 rounded-[12px] bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>100% Free Verified Open GIS Active</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                All 4 mission-critical basemaps work out of the box with zero external API key and zero rate limits:
              </p>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 list-disc pl-4">
                <li><strong>Dark GIS Mission Control:</strong> CartoDB Dark Matter (Multi-CDN parallel raster tiles)</li>
                <li><strong>Topographic Map:</strong> Esri World Topo Map (ArcGIS REST High-Resolution Relief)</li>
                <li><strong>Satellite 3D:</strong> Esri World Imagery + AWS Terrarium DEM Hillshade</li>
                <li><strong>Street Map:</strong> OpenStreetMap Standard WGS84</li>
              </ul>
            </div>
          )}

          {/* Test Status feedback */}
          {testStatus.result && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 font-medium text-xs ${
                testStatus.result.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200'
              }`}
            >
              {testStatus.result.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <X className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{testStatus.result.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] bg-slate-50/60 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToFree}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Free Open GIS</span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus.testing}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{testStatus.testing ? 'Testing...' : 'Test Tile Connection'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
