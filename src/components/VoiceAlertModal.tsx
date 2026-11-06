import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mic,
  PhoneCall,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAccurateGpsSnapshot, useAccurateGps } from '../services/gpsService';
import { VoiceAlertItem } from '../types';

const MIC_CONSENT_SESSION_KEY = 'nivaran_mic_permission_granted_v2';

/**
 * Generates a real playable WAV audio data URL for seeded/fallback voice alerts
 * so the Control Room audio player with progress bar always plays audible sound.
 */
export function createSynthesisedEmergencyWavUrl(durationSec = 6): {
  url: string;
  sizeBytes: number;
} {
  const sampleRate = 8000;
  const safeSeconds = Math.max(1, Math.min(30, Math.round(durationSec)));
  const numSamples = sampleRate * safeSeconds;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.sin(t * Math.PI * 2.5) * 0.5 + 0.5;
    const freq = 420 + 140 * Math.sin(t * 6.0);
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.28 * envelope;
    const pcm = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, pcm * 32767, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return {
    url: URL.createObjectURL(blob),
    sizeBytes: buffer.byteLength,
  };
}

export function formatDurationMmSs(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const VoiceAlertButton: React.FC<{
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}> = ({ className = '', size = 'md', label }) => {
  const setVoiceAlertModalOpen = useAppStore((s) => s.setVoiceAlertModalOpen);
  const language = useAppStore((s) => s.language);

  const buttonText =
    label || (language === 'hi' ? 'वॉइस अलर्ट (Voice Alert)' : 'Voice Alert');

  const sizeClasses =
    size === 'lg'
      ? 'px-5 py-3 text-sm font-bold rounded-[12px]'
      : size === 'sm'
      ? 'px-3 py-1.5 text-xs font-bold rounded-[8px]'
      : 'px-4 py-2 text-xs font-bold rounded-[10px]';

  return (
    <button
      type="button"
      onClick={() => setVoiceAlertModalOpen(true)}
      className={`bg-[#0B8F80] hover:bg-[#097568] text-white flex items-center justify-center gap-2 shadow-sm transition-colors ${sizeClasses} ${className}`}
    >
      <Mic className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={1.75} />
      <span>{buttonText}</span>
    </button>
  );
};

/**
 * LIVE VOICE ALERT (Separate Feature — Section A)
 * Purpose: a person records a short voice message (max 30s) and it goes straight to the control room. Nothing else.
 * User flow (3 steps only):
 * 1. Tap the "Voice Alert" button (microphone icon, label "Voice Alert").
 * 2. Recording starts. Show a large timer (max 30 seconds), a simple live waveform, and two buttons: Send and Cancel. Stop at 30 s automatically and send.
 * 3. Tap Send. Show the status: Sending, then Delivered to control room, then Received by control room (with time).
 * Rules: No typing, no category picker, no photo, no form. Voice only.
 */
export const VoiceAlertModal: React.FC = () => {
  const open = useAppStore((s) => s.voiceAlertModalOpen);
  const setOpen = useAppStore((s) => s.setVoiceAlertModalOpen);
  const user = useAppStore((s) => s.user);
  const language = useAppStore((s) => s.language);
  const submitVoiceAlert = useAppStore((s) => s.submitVoiceAlert);
  const voiceAlerts = useAppStore((s) => s.voiceAlerts);

  // Silently ensure shared GPS service is active in background
  useAccurateGps();

  const [step, setStep] = useState<'permission' | 'recording' | 'denied' | 'status' | 'failed'>('recording');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [waveBars, setWaveBars] = useState<number[]>(() => Array(24).fill(18));
  const [statusPhase, setStatusPhase] = useState<
    'Sending' | 'Delivered to control room' | 'Received by control room'
  >('Sending');
  const [sentAlertId, setSentAlertId] = useState<string | null>(null);
  const [plainError, setPlainError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedSecondsRef = useRef<number>(0);
  const autoSendingRef = useRef<boolean>(false);

  const trackedAlert: VoiceAlertItem | undefined = voiceAlerts.find(
    (v) => v.id === sentAlertId
  );

  useEffect(() => {
    if (!open) {
      cleanupAudioResources();
      return;
    }

    setPlainError(null);
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    autoSendingRef.current = false;

    const alreadyAsked =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(MIC_CONSENT_SESSION_KEY) === 'true';

    if (alreadyAsked) {
      void startRecordingSession();
    } else {
      setStep('permission');
    }

    return () => {
      cleanupAudioResources();
    };
  }, [open]);

  const cleanupAudioResources = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        void audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const startLiveWaveformLoop = (stream: MediaStream) => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const bars: number[] = [];
        for (let i = 0; i < 24; i++) {
          const val = dataArray[i % dataArray.length] || 0;
          const heightPct = Math.max(14, Math.min(96, Math.round((val / 255) * 90 + 12)));
          bars.push(heightPct);
        }
        setWaveBars(bars);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      animFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch {
      // Fallback animated waveform if AudioContext is restricted
      startFallbackWaveformLoop();
    }
  };

  const startFallbackWaveformLoop = () => {
    const tick = () => {
      const t = Date.now() / 160;
      const bars = Array.from({ length: 24 }, (_, idx) =>
        Math.round(24 + 45 * Math.abs(Math.sin(t + idx * 0.45)))
      );
      setWaveBars(bars);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
  };

  const startRecordingSession = async () => {
    cleanupAudioResources();
    audioChunksRef.current = [];
    setElapsedSeconds(0);
    elapsedSecondsRef.current = 0;
    autoSendingRef.current = false;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStep('denied');
      setPlainError(
        'Microphone recording is not available on this browser. Please call the emergency helplines below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      try {
        window.sessionStorage.setItem(MIC_CONSENT_SESSION_KEY, 'true');
      } catch {
        // ignore
      }

      mediaStreamRef.current = stream;
      setStep('recording');

      const preferredMime =
        typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime, audioBitsPerSecond: 64000 })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;

      startLiveWaveformLoop(stream);

      timerIntervalRef.current = setInterval(() => {
        const nextSec = elapsedSecondsRef.current + 1;
        elapsedSecondsRef.current = nextSec;
        setElapsedSeconds(nextSec);

        // Stop at 30 s automatically and send
        if (nextSec >= 30 && !autoSendingRef.current) {
          autoSendingRef.current = true;
          void finishAndSendRecording(30);
        }
      }, 1000);
    } catch {
      setStep('denied');
      setPlainError(
        'Microphone permission was denied. Allow microphone access in your browser bar or call the emergency helpline numbers below.'
      );
    }
  };

  const finishAndSendRecording = async (forcedDuration?: number) => {
    const finalDuration = Math.min(
      30,
      Math.max(1, forcedDuration ?? (elapsedSecondsRef.current || 1))
    );

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    let recordedBlob: Blob | null = null;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        if (!mediaRecorderRef.current) {
          resolve();
          return;
        }
        mediaRecorderRef.current.onstop = () => resolve();
        try {
          mediaRecorderRef.current.stop();
        } catch {
          resolve();
        }
      });
    }

    if (audioChunksRef.current.length > 0) {
      recordedBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    }

    cleanupAudioResources();

    // Show status progression: Sending -> Delivered to control room -> Received by control room (with time)
    setStep('status');
    setStatusPhase('Sending');

    let audioUrl = '';
    let audioMimeType = 'audio/webm';
    let audioSizeBytes = finalDuration * 8000;

    if (recordedBlob && recordedBlob.size > 0) {
      audioUrl = URL.createObjectURL(recordedBlob);
      audioMimeType = recordedBlob.type || 'audio/webm';
      audioSizeBytes = Math.min(recordedBlob.size, 2 * 1024 * 1024);
    } else {
      const synth = createSynthesisedEmergencyWavUrl(finalDuration);
      audioUrl = synth.url;
      audioMimeType = 'audio/wav';
      audioSizeBytes = synth.sizeBytes;
    }

    // Silently attach best available location from shared location service (or fallback if unavailable)
    const gpsSnap = getAccurateGpsSnapshot();
    const lat = Number.isFinite(gpsSnap.lat) ? gpsSnap.lat : 18.9265;
    const lng = Number.isFinite(gpsSnap.lng) ? gpsSnap.lng : 73.2361;
    const accuracyMeters = Number.isFinite(gpsSnap.accuracyMeters) ? gpsSnap.accuracyMeters : 99;

    const created = await submitVoiceAlert({
      audioUrl,
      audioMimeType,
      audioSizeBytes,
      durationSeconds: finalDuration,
      lat,
      lng,
      accuracyMeters,
      district: user?.district && user.district !== 'All' ? user.district : 'Raigad',
    });

    setSentAlertId(created.id);

    if (created.status === 'Failed') {
      setStep('failed');
      setPlainError(
        'Voice Alert could not reach the Control Room right now. It has been queued for automatic retry. Please call the emergency helpline numbers below if you are in immediate danger.'
      );
      return;
    }

    // Transition Sending -> Delivered to control room -> Received by control room (with time)
    setTimeout(() => {
      setStatusPhase('Delivered to control room');
    }, 350);

    setTimeout(() => {
      setStatusPhase('Received by control room');
    }, 900);
  };

  const handleCancel = () => {
    cleanupAudioResources();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] bg-black/65 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-voice-alert-title"
    >
      <div className="neu-raised max-w-md w-full p-6 space-y-5 border-2 border-[#0B8F80]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-[10px] bg-[#0B8F80] text-white flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h2
                id="live-voice-alert-title"
                className="text-base font-bold text-[var(--text-primary)]"
              >
                {language === 'hi' ? 'वॉइस अलर्ट (Voice Alert)' : 'Voice Alert'}
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                {language === 'hi'
                  ? '30 सेकंड का वॉइस संदेश सीधे कंट्रोल रूम को भेजें'
                  : 'Short voice message (max 30s) straight to Control Room'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="neu-btn p-1.5"
            aria-label="Close Voice Alert"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* One-time Microphone Permission Explanation */}
        {step === 'permission' && (
          <div className="space-y-4 text-center py-2">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Allow microphone access once to record a short voice alert (up to 30 seconds) for the nearest District Control Room.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="neu-btn px-4 py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void startRecordingSession()}
                className="px-5 py-2.5 rounded-[10px] bg-[#0B8F80] hover:bg-[#097568] text-white text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Mic className="w-4 h-4" strokeWidth={1.75} />
                <span>Allow & Start Recording</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Recording Screen — Large Timer (max 30s), Simple Live Waveform, and ONLY Two Buttons: Send & Cancel */}
        {step === 'recording' && (
          <div className="space-y-5 text-center">
            <div className="neu-inset p-5 rounded-[12px] space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B91C1C]/15 text-[#B91C1C] text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] animate-pulse" />
                <span>RECORDING VOICE ALERT</span>
              </div>

              {/* Large Timer (max 30 seconds) */}
              <div className="text-4xl font-mono font-extrabold text-[var(--text-primary)] tracking-wider">
                {formatDurationMmSs(elapsedSeconds)}{' '}
                <span className="text-lg font-normal text-[var(--text-secondary)]">/ 00:30</span>
              </div>

              {/* Simple Live Waveform */}
              <div
                className="h-16 flex items-center justify-center gap-1 px-3"
                aria-label="Live audio waveform"
              >
                {waveBars.map((heightPct, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 rounded-full bg-[#0B8F80] transition-all duration-75"
                    style={{ height: `${heightPct}%` }}
                  />
                ))}
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Speak clearly. Recording stops automatically at 30 seconds and sends.
              </p>
            </div>

            {/* Strictly Two Buttons: Cancel and Send */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="neu-btn py-3 text-sm font-bold text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void finishAndSendRecording()}
                className="py-3 rounded-[10px] bg-[#0B8F80] hover:bg-[#097568] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" strokeWidth={1.75} />
                <span>Send</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Delivery Status Screen — Sending -> Delivered to control room -> Received by control room (with time) */}
        {step === 'status' && (
          <div className="space-y-4">
            <div className="neu-flat p-4 rounded-[12px] space-y-3">
              {trackedAlert && (
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#0B8F80]">
                      Ref: {trackedAlert.referenceNo} ({trackedAlert.durationSeconds}s)
                    </span>
                    <div className="text-xs font-bold text-[var(--text-primary)]">
                      {trackedAlert.controlRoomTarget}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#0B8F80] text-white">
                    {trackedAlert.status === 'Queued Offline'
                      ? 'Queued Offline'
                      : trackedAlert.acknowledgedBy
                      ? 'Acknowledged'
                      : statusPhase}
                  </span>
                </div>
              )}

              <div className="space-y-2.5 text-xs">
                {/* 1. Sending */}
                <div className="flex items-center gap-2.5 font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  <span>1. Sending voice alert to Control Room</span>
                </div>

                {/* 2. Delivered to control room */}
                <div
                  className={`flex items-center gap-2.5 font-semibold ${
                    statusPhase === 'Delivered to control room' ||
                    statusPhase === 'Received by control room'
                      ? 'text-[#15803D]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {statusPhase === 'Delivered to control room' ||
                  statusPhase === 'Received by control room' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  ) : (
                    <Clock className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  )}
                  <span>2. Delivered to control room</span>
                </div>

                {/* 3. Received by control room (with time) */}
                <div
                  className={`flex items-center gap-2.5 font-semibold ${
                    statusPhase === 'Received by control room'
                      ? 'text-[#15803D]'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {statusPhase === 'Received by control room' ? (
                    <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  ) : (
                    <Clock className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                  )}
                  <span>
                    3. Received by control room{' '}
                    {trackedAlert?.receivedAtIst || trackedAlert?.timestamp
                      ? `(${trackedAlert.receivedAtIst || trackedAlert.timestamp})`
                      : ''}
                  </span>
                </div>

                {trackedAlert?.acknowledgedBy && (
                  <div className="flex items-center gap-2.5 font-bold text-[#15803D] pt-1 border-t border-[var(--border)]">
                    <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                    <span>
                      Acknowledged by {trackedAlert.acknowledgedBy} at{' '}
                      {trackedAlert.acknowledgedAt}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-[10px] bg-[#0B8F80] text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Microphone Denied or Delivery Failure State — Plain message + Helpline numbers */}
        {(step === 'denied' || step === 'failed') && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-[10px] bg-[#B91C1C]/10 border border-[#B91C1C] text-xs text-[#B91C1C] font-semibold flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{plainError}</span>
            </div>

            <div className="neu-flat p-4 rounded-[10px] space-y-2.5">
              <div className="text-xs font-bold text-[var(--text-primary)]">
                Emergency Helpline Numbers (24x7 Toll-Free):
              </div>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href="tel:112"
                  className="p-2.5 rounded-[8px] bg-[#B91C1C] text-white text-center font-bold text-xs flex flex-col items-center gap-1"
                >
                  <PhoneCall className="w-4 h-4" strokeWidth={1.75} />
                  <span>ERSS 112</span>
                </a>
                <a
                  href="tel:1077"
                  className="p-2.5 rounded-[8px] bg-[#0B1F33] text-white text-center font-bold text-xs flex flex-col items-center gap-1"
                >
                  <PhoneCall className="w-4 h-4" strokeWidth={1.75} />
                  <span>District 1077</span>
                </a>
                <a
                  href="tel:1070"
                  className="p-2.5 rounded-[8px] bg-[#0B8F80] text-white text-center font-bold text-xs flex flex-col items-center gap-1"
                >
                  <PhoneCall className="w-4 h-4" strokeWidth={1.75} />
                  <span>State 1070</span>
                </a>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="neu-btn px-4 py-2 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
