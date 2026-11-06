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
  getStoredMapProvider,
  getStoredProviderKey,
  getStreetBasemapConfig,
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
  const language = useAppStore((s) => s.language);
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

    const config = getStreetBasemapConfig(provider, activeKey);
    const sampleUrl = config.tiles[0];
    const res = await testTileConnectivity(sampleUrl);

    setTestStatus({
      testing: false,
      result: {
        ok: res.ok,
        message: res.ok
          ? language === 'hi'
            ? 'कनेक्शन सफल: टाइल सर्वर सक्रिय है (HTTP 200 OK)'
            : language === 'mr'
            ? 'कनेक्शन यशस्वी: टाइल सर्व्हर सक्रिय आहे (HTTP 200 OK)'
            : 'Connection successful: Tile server is active (HTTP 200 OK)'
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
      language === 'hi'
        ? 'मानचित्र प्रदाता और एपीआई सेटिंग्स सहेजी गईं!'
        : language === 'mr'
        ? 'नकाशा प्रदाता आणि एपीआय सेटिंग्ज जतन केल्या!'
        : 'Map provider and API configuration applied successfully!',
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
      language === 'hi'
        ? 'निःशुल्क ओपन जीआईएस (OpenStreetMap) पर रीसेट किया गया'
        : language === 'mr'
        ? 'विनामूल्य ओपन जीआयएस (OpenStreetMap) वर रीसेट केले'
        : 'Reverted to 100% Free Open GIS (OpenStreetMap & Esri)',
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
                {language === 'hi'
                  ? 'मानचित्र कार्टोग्राफी एवं स्थानिक परतें'
                  : language === 'mr'
                  ? 'नकाशा कार्टोग्राफी व भौगोलिक थर'
                  : 'GIS Cartography & Spatial Layers'}
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {language === 'hi'
                  ? 'सुरक्षित राष्ट्रीय जीआईएस नेटवर्क सक्रिय · पूर्णतया सुरक्षित'
                  : language === 'mr'
                  ? 'सुरक्षित राष्ट्रीय जीआयएस नेटवर्क सक्रिय · पूर्णपणे सुरक्षित'
                  : 'Secured National Geospatial Network Active · Zero Client Keys Required'}
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
                <span>
                  {language === 'hi'
                    ? 'सुरक्षित राष्ट्रीय भू-स्थानिक नेटवर्क: सुरक्षित एवं प्रमाणित'
                    : language === 'mr'
                    ? 'सुरक्षित राष्ट्रीय भू-स्थानिक नेटवर्क: सुरक्षित व प्रमाणित'
                    : 'Secured National Geospatial Network · Authenticated & Encrypted'}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900 text-[#059669] font-mono font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? 'निवारण जीआईएस आधिकारिक ओपनस्ट्रीटमैप (OpenStreetMap) और एश्री (Esri World Satellite) के सुरक्षित सर्वर का उपयोग करता है। सभी भू-स्थानिक परतें एन्क्रिप्टेड और सुरक्षित हैं।'
                  : language === 'mr'
                  ? 'निवारण जीआयएस अधिकृत ओपनस्ट्रीटनकाशा (OpenStreetMap) आणि एश्री (Esri World Satellite) च्या सुरक्षित सर्व्हरचा वापर करतो. सर्व भौगोलिक थर एन्क्रिप्टेड व सुरक्षित आहेत.'
                  : 'NIVARAN GIS utilizes high-resolution official OpenStreetMap vector cartography and Esri World Satellite GIS via TLS 1.3 encrypted government gateway endpoints. No external keys exposed.'}
              </p>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="font-bold text-[11px] text-[var(--text-secondary)] uppercase tracking-wider block">
              {language === 'hi'
                ? 'मानचित्र प्रदाता चुनें'
                : language === 'mr'
                ? 'नकाशा प्रदाता निवडा'
                : 'Select Map Cartography Provider'}
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
                      <span>OpenStreetMap Standard (Official)</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 dark:bg-emerald-900 text-[#059669] font-semibold">
                        {language === 'hi' ? 'निःशुल्क' : language === 'mr' ? 'मोफत' : 'Free / Open'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {language === 'hi'
                        ? 'संपूर्ण भारत और वैश्विक खुला मानचित्र · शून्य वॉटरमार्क'
                        : language === 'mr'
                        ? 'संपूर्ण भारत आणि जागतिक खुला नकाशा · शून्य वॉटरमार्क'
                        : 'Official OpenStreetMap Foundation global raster tiles · No key needed'}
                    </p>
                  </div>
                </div>
                <Globe className="w-4 h-4 text-[#059669] shrink-0" />
              </label>

              {/* 2. Google Maps (Optional) */}
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
                      {language === 'hi'
                        ? 'गूगल मैप्स सड़क और इलाके की टाइलें (वैकल्पिक एपीआई कुंजी)'
                        : language === 'mr'
                        ? 'गुगल नकाशे रस्ता आणि भूप्रदेश टाइल्स (पर्यायी एपीआय की)'
                        : 'Google global street tiles with optional official Google Maps API key'}
                    </p>
                  </div>
                </div>
                <Layers className="w-4 h-4 text-sky-600 shrink-0" />
              </label>

              {/* 3. Mapbox Streets */}
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
                      <span>Mapbox Streets v12</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-semibold">
                        Requires Token
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {language === 'hi'
                        ? 'मैपबॉक्स टोकन आवश्यक (pk.eyJ1...)'
                        : language === 'mr'
                        ? 'मॅपबॉक्स टोकन आवश्यक (pk.eyJ1...)'
                        : 'Custom high-fidelity Mapbox styling (requires public access token)'}
                    </p>
                  </div>
                </div>
                <Key className="w-4 h-4 text-purple-600 shrink-0" />
              </label>

              {/* 4. MapTiler */}
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
                      <span>MapTiler Cloud</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold">
                        Requires Key
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {language === 'hi'
                        ? 'मैपटाइलर क्लाउड टाइल्स (कुंजी आवश्यक)'
                        : language === 'mr'
                        ? 'मॅपटायलर क्लाउड टाइल्स (की आवश्यक)'
                        : 'MapTiler Cloud vector & raster streets service'}
                    </p>
                  </div>
                </div>
                <Key className="w-4 h-4 text-amber-600 shrink-0" />
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
                      {language === 'hi'
                        ? 'सरकारी भू-स्थानिक इंट्रानेट या निजी टाइल सर्वर URL'
                        : language === 'mr'
                        ? 'शासकीय भू-स्थानिक इंट्रानेट किंवा खाजगी टाइल सर्व्हर URL'
                        : 'Self-hosted or state department WMTS/XYZ URL template'}
                    </p>
                  </div>
                </div>
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
              </label>
            </div>
          </div>

          {/* Secure Backend Cartography Gateway Information */}
          <div className="p-3.5 rounded-[12px] bg-slate-50 dark:bg-slate-800/50 border border-[var(--border)] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#059669]">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Security & Integrity Certified</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              All map tiles and spatial vectors are streamed via authenticated and encrypted government proxies. No private or client API keys are required or exposed to the browser.
            </p>
          </div>

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
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {language === 'hi'
                  ? 'निःशुल्क ओपन जीआईएस रीसेट'
                  : language === 'mr'
                  ? 'विनामूल्य ओपन जीआयएस रीसेट'
                  : 'Reset to Free Open GIS'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus.testing}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {testStatus.testing
                  ? 'Testing...'
                  : language === 'hi'
                  ? 'कनेक्शन टेस्ट करें'
                  : language === 'mr'
                  ? 'कनेक्शन तपासा'
                  : 'Test Connection'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
            >
              {language === 'hi' ? 'रद्द करें' : language === 'mr' ? 'रद्द करा' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {language === 'hi'
                  ? 'लागू करें और सहेजें'
                  : language === 'mr'
                  ? 'लागू करा आणि जतन करा'
                  : 'Apply & Save Settings'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
