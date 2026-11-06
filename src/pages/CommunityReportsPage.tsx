import React, { useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  HelpCircle,
  LocateFixed,
  Mic,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { classifyHazard, weightedScore } from '../utils/scoring';
import { RiskBadge } from '../components/RiskBadge';
import { ReportCategory } from '../types';

const SAMPLE_PHOTOS: Record<ReportCategory, string> = {
  ground_crack:
    'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=800&q=80',
  water_logging:
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  seepage:
    'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=800&q=80',
  erosion:
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
  tilting_house:
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
  other:
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
};

export const CommunityReportsPage: React.FC = () => {
  const user = useAppStore((s) => s.user);
  const villages = useAppStore((s) => s.villages);
  const sites = useAppStore((s) => s.sites);
  const reports = useAppStore((s) => s.reports);
  const offlineQueue = useAppStore((s) => s.offlineQueue);
  const isOfflineSimulated = useAppStore((s) => s.isOfflineSimulated);
  const setOfflineSimulated = useAppStore((s) => s.setOfflineSimulated);
  const syncOfflineQueue = useAppStore((s) => s.syncOfflineQueue);
  const submitCommunityReport = useAppStore((s) => s.submitCommunityReport);
  const updateReportStatus = useAppStore((s) => s.updateReportStatus);
  const weights = useAppStore((s) => s.weights);
  const addToast = useAppStore((s) => s.addToast);

  const [selectedVillageId, setSelectedVillageId] = useState<string>('v-01');
  const [category, setCategory] = useState<ReportCategory>('ground_crack');
  const [crackWidthCm, setCrackWidthCm] = useState<number>(6);
  const [crackLengthM, setCrackLengthM] = useState<number>(14);
  const [description, setDescription] = useState<string>('');
  const [lat, setLat] = useState<number>(18.9269);
  const [lng, setLng] = useState<number>(73.2365);
  const [photoPreview, setPhotoPreview] = useState<string>(
    SAMPLE_PHOTOS.ground_crack
  );
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);
  const [recordingVoice, setRecordingVoice] = useState<boolean>(false);
  const [showReportForm, setShowReportForm] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const homeVillage =
    villages.find((v) => v.id === selectedVillageId) || villages[0];
  const homeHazardScore = weightedScore(
    homeVillage.hazardFactors,
    weights,
    homeVillage.verifiedReportsCount
  );
  const homeRiskLevel = classifyHazard(homeHazardScore);
  const nearestSafeSite =
    sites.find((s) => s.district === homeVillage.district) || sites[0];

  const handleCaptureGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(Number(pos.coords.latitude.toFixed(4)));
          setLng(Number(pos.coords.longitude.toFixed(4)));
          addToast({
            title: 'Browser Geolocation Captured',
            message: `Pinned at ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
            type: 'success',
          });
        },
        () => {
          // Fallback to village coordinates + slight offset
          setLat(Number((homeVillage.lat + 0.0006).toFixed(4)));
          setLng(Number((homeVillage.lng + 0.0005).toFixed(4)));
          addToast({
            title: 'GPS Fallback Pin Applied',
            message: `Using ${homeVillage.name} Gram Panchayat benchmark coordinates.`,
            type: 'info',
          });
        }
      );
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      addToast({
        title: 'Description Required',
        message: 'Please describe the ground crack, seepage, or tilting structure.',
        type: 'warning',
      });
      return;
    }

    submitCommunityReport({
      villageId: homeVillage.id,
      villageName: homeVillage.name,
      district: homeVillage.district,
      category,
      description:
        category === 'ground_crack'
          ? `[Tension Fissure: ${crackWidthCm}cm width, ${crackLengthM}m length] ${description.trim()}`
          : description.trim(),
      reporterName: user?.name || 'Gram Suraksha Citizen',
      reporterPhone: user?.emailOrPhone || '9876543210',
      lat,
      lng,
      photoUrl: photoPreview || SAMPLE_PHOTOS[category],
      hasVoiceNote,
      voiceNoteTranscript: hasVoiceNote
        ? 'Voice note attached: Seepage & crack widening observed near upper slope.'
        : undefined,
    });

    setDescription('');
    setHasVoiceNote(false);
  };

  const filteredReports = reports.filter((r) =>
    statusFilter === 'all' ? true : r.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Offline Queue & Role Banner */}
      <div className="bg-white dark:bg-[#11253A] p-5 rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
            Community Hazard Reporting App & Field Officer Verification Queue
          </h1>
          <p className="text-xs text-[#475569] dark:text-slate-400 mt-1">
            Mobile-first crowdsourced early warning. Only{' '}
            <strong>Field-Officer Verified</strong> reports increment the village hazard
            history factor (+0.025).
          </p>
        </div>

        {/* Offline Queue Simulator Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setOfflineSimulated(!isOfflineSimulated)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all min-h-[42px] ${
              isOfflineSimulated
                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/10 text-[#16A34A] border-emerald-500/30'
            }`}
          >
            {isOfflineSimulated ? (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline Mode Simulated (Will Sync Later)</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>Network Online (Click to Test Offline Queue)</span>
              </>
            )}
          </button>

          {offlineQueue.length > 0 && (
            <button
              onClick={syncOfflineQueue}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0E9F8E] text-white text-xs font-bold shadow-sm min-h-[42px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sync {offlineQueue.length} Pending Report(s) Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Left Mobile-First Villager App (5 cols) + Right Field Officer Verification Queue (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Mobile-First Villager Home & Report Form */}
        <div className="lg:col-span-5 space-y-5">
          {/* Villager Safety Status & Emergency Card */}
          <div className="bg-[#0B1F33] text-white rounded-card p-5 shadow-soft-lg space-y-4 border border-slate-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0E9F8E]">
                Villager Safety Companion (Mobile-First)
              </span>
              <select
                value={selectedVillageId}
                onChange={(e) => {
                  const v = villages.find((x) => x.id === e.target.value);
                  setSelectedVillageId(e.target.value);
                  if (v) {
                    setLat(v.lat);
                    setLng(v.lng);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-[#11253A] border border-slate-700 text-xs font-bold text-white"
                aria-label="Select your village"
              >
                {villages.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Risk Status in Simple Language */}
            <div className="p-4 rounded-2xl bg-white/8 border border-white/15 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300">Your Village Risk Status:</span>
                <RiskBadge level={homeRiskLevel} score={homeHazardScore} size="md" />
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {homeRiskLevel === 'Immediate'
                  ? `ALERT: ${homeVillage.name} is in the Immediate Red Zone (${homeHazardScore.toFixed(
                      3
                    )}). Do not stay near steep slopes during heavy rain. Keep emergency kit ready.`
                  : homeRiskLevel === 'Short-term'
                  ? `WATCH: ${homeVillage.name} is in the Short-Term Orange Zone (${homeHazardScore.toFixed(
                      3
                    )}). Report any new cracks, muddy seepage, or tilting trees immediately.`
                  : `${homeVillage.name} is currently under normal monsoon watch. Report any unusual ground or water signs below.`}
              </p>
            </div>

            {/* Nearest Safe Site & Evacuation Tips */}
            <div className="p-3.5 rounded-xl bg-[#0E9F8E]/15 border border-[#0E9F8E]/35 text-xs space-y-1">
              <div className="font-bold text-teal-200 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#0E9F8E]" />
                <span>Nearest Designated Safe Site: {nearestSafeSite.name}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Evacuation Tip: Move uphill away from stream channels; assist elderly (
                {homeVillage.vulnerabilityFactors.elderlyPct}%) and PwD residents first.
              </p>
            </div>

            {/* Emergency Numbers */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <a
                href="tel:112"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex flex-col items-center"
              >
                <PhoneCall className="w-4 h-4 text-[#DC2626] mb-1" />
                <span className="font-extrabold">112</span>
                <span className="text-[10px] text-slate-300">National Emergency</span>
              </a>
              <a
                href="tel:1077"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex flex-col items-center"
              >
                <PhoneCall className="w-4 h-4 text-[#0E9F8E] mb-1" />
                <span className="font-extrabold">1077</span>
                <span className="text-[10px] text-slate-300">District Control</span>
              </a>
              <a
                href="tel:1078"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex flex-col items-center"
              >
                <PhoneCall className="w-4 h-4 text-amber-400 mb-1" />
                <span className="font-extrabold">1078</span>
                <span className="text-[10px] text-slate-300">NDMA Helpline</span>
              </a>
            </div>

            {/* Big "Report a Warning Sign" Button */}
            <button
              type="button"
              onClick={() => setShowReportForm((s) => !s)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#DC2626] hover:bg-red-700 text-white font-heading font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 min-h-[48px]"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Report a Warning Sign (Ground Crack / Seepage)</span>
            </button>
          </div>

          {/* Citizen Warning Sign Report Form */}
          {showReportForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 text-xs"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white">
                  Submit Field Warning Report
                </h2>
                {isOfflineSimulated && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                    Will sync when online
                  </span>
                )}
              </div>

              {/* Category Picker */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Warning Sign Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'ground_crack', label: 'Ground Crack' },
                      { id: 'seepage', label: 'Muddy Seepage' },
                      { id: 'tilting_house', label: 'Tilting House/Pole' },
                      { id: 'erosion', label: 'Bank Erosion' },
                      { id: 'water_logging', label: 'Water Logging' },
                      { id: 'other', label: 'Other Sign' },
                    ] as { id: ReportCategory; label: string }[]
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setPhotoPreview(SAMPLE_PHOTOS[cat.id]);
                      }}
                      className={`py-2 px-2.5 rounded-xl border font-semibold text-left transition-all min-h-[40px] ${
                        category === cat.id
                          ? 'border-[#0E9F8E] bg-[#0E9F8E]/12 text-[#0E9F8E] font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0A1624]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Geotechnical Tension Crack Measurement (Pre-Disaster Early Indicator) */}
              {category === 'ground_crack' && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-300 dark:border-amber-800/50 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Geotechnical Crown Fissure Measurement</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900/60 font-mono font-bold">
                      GSI Slope Benchmark
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Crack Width (cm)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={crackWidthCm}
                        onChange={(e) => setCrackWidthCm(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Fissure Length (m)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={crackLengthM}
                        onChange={(e) => setCrackLengthM(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0A1624] border border-slate-300 dark:border-slate-700 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {crackWidthCm >= 5 && (
                    <div className="p-2 rounded-lg bg-red-100/80 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-[11px] text-red-700 dark:text-red-300 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>CRITICAL: Crack width &ge; 5 cm indicates active sub-surface shear plane movement (Crown failure precursor). High-priority EOC alert flagged.</span>
                    </div>
                  )}
                </div>
              )}

              {/* GPS Auto-Capture + Manual Fallback */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-200">
                    GPS Coordinates (Auto-Captured / Manual Pin)
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureGps}
                    className="inline-flex items-center gap-1 text-[#0E9F8E] font-bold hover:underline"
                  >
                    <LocateFixed className="w-3.5 h-3.5" /> Auto-Capture GPS
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 font-mono"
                    aria-label="Latitude"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 font-mono"
                    aria-label="Longitude"
                  />
                </div>
              </div>

              {/* Photo Upload + Voice Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:border-[#0E9F8E] bg-slate-50 dark:bg-[#0A1624]">
                  <Camera className="w-4 h-4 text-[#0E9F8E]" />
                  <span className="font-semibold">Upload / Capture Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setRecordingVoice(true);
                    setTimeout(() => {
                      setRecordingVoice(false);
                      setHasVoiceNote(true);
                    }, 1000);
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold ${
                    hasVoiceNote
                      ? 'border-[#16A34A] bg-[#16A34A]/10 text-[#16A34A]'
                      : recordingVoice
                      ? 'border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] animate-pulse'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0A1624]'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  <span>
                    {hasVoiceNote
                      ? 'Voice Note Attached ✓'
                      : recordingVoice
                      ? 'Recording...'
                      : 'Add Optional Voice Note'}
                  </span>
                </button>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="report-desc"
                  className="block font-bold text-slate-700 dark:text-slate-200 mb-1"
                >
                  Short Observation Description
                </label>
                <textarea
                  id="report-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe crack width, muddy water seepage, or tilting structure..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0E9F8E]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white font-heading font-bold text-sm shadow-sm min-h-[44px]"
              >
                {isOfflineSimulated
                  ? 'Save Report to Offline Queue'
                  : 'Submit Report to Field Officer Queue'}
              </button>
            </form>
          )}
        </div>

        {/* RIGHT: Field Officer Verification Queue */}
        <div className="lg:col-span-7 space-y-4">
          {/* Pending Offline Queue Banner if any */}
          {offlineQueue.length > 0 && (
            <div className="p-4 rounded-card bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  Offline Queue ({offlineQueue.length} report waiting in local memory)
                </div>
                <p className="text-amber-800 dark:text-amber-300">
                  Will automatically sync to Field Officer Queue when connection restores.
                </p>
              </div>
              <button
                onClick={syncOfflineQueue}
                className="px-3.5 py-2 rounded-xl bg-amber-600 text-white font-bold shrink-0"
              >
                Sync Now
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-[#11253A] rounded-card shadow-soft border border-slate-200/80 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-base text-[#0F172A] dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-[#0E9F8E]" />
                  <span>Field Officer Verification Queue ({filteredReports.length})</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Verify reports to dynamically increment village disaster history score
                  and pin on GIS map
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0A1624] p-1 rounded-xl">
                {(['all', 'pending', 'verified', 'info_requested', 'rejected'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
                        statusFilter === st
                          ? 'bg-[#0B1F33] text-white dark:bg-[#0E9F8E]'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-3.5">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1624] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-4"
                >
                  <img
                    src={rep.photoUrl}
                    alt={rep.category}
                    className="w-full sm:w-32 h-28 object-cover rounded-xl shrink-0 border border-slate-200 dark:border-slate-700"
                  />

                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0B1F33] text-white font-bold text-[10px] uppercase">
                          {rep.category.replace('_', ' ')}
                        </span>
                        <span className="font-heading font-bold text-sm text-[#0F172A] dark:text-white">
                          {rep.villageName} ({rep.district})
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rep.status === 'verified'
                            ? 'bg-[#16A34A]/15 text-[#16A34A]'
                            : rep.status === 'pending'
                            ? 'bg-[#EAB308]/20 text-amber-800 dark:text-amber-300'
                            : rep.status === 'rejected'
                            ? 'bg-[#DC2626]/15 text-[#DC2626]'
                            : 'bg-indigo-500/15 text-[#4F46E5]'
                        }`}
                      >
                        {rep.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                      {rep.description}
                    </p>

                    {rep.voiceNoteTranscript && (
                      <div className="p-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-900 dark:text-teal-200">
                        🎙️ Voice Note: “{rep.voiceNoteTranscript}”
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-1">
                      <span>
                        By: <strong>{rep.reporterName}</strong> • GPS:{' '}
                        {rep.lat.toFixed(4)}°N, {rep.lng.toFixed(4)}°E
                      </span>
                      {rep.verifiedBy && (
                        <span className="text-[#16A34A] font-semibold">
                          Verified by {rep.verifiedBy} (+0.025 History Bump Active)
                        </span>
                      )}
                    </div>

                    {/* Field Officer / SDMA Verification Buttons */}
                    {user?.role !== 'villager' && (
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            updateReportStatus(
                              rep.id,
                              'verified',
                              'Field inspection confirmed crack/seepage.'
                            )
                          }
                          disabled={rep.status === 'verified'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-green-700 disabled:opacity-40 text-white font-bold text-[11px]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify (+Feed Hazard Score)</span>
                        </button>

                        <button
                          onClick={() =>
                            updateReportStatus(
                              rep.id,
                              'info_requested',
                              'Please provide clearer landmark photo.'
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-[11px]"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Request More Info</span>
                        </button>

                        <button
                          onClick={() =>
                            updateReportStatus(
                              rep.id,
                              'rejected',
                              'Duplicate or non-hazard observation.'
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-[#DC2626] font-bold text-[11px]"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
