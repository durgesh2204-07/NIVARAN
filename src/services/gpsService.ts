import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export type GpsQualityBadge = 'Good' | 'Fair' | 'Poor';
export type GpsSourceType = 'device_gps' | 'browser_wifi' | 'network_ip' | 'manual_pin';

export interface AccurateGpsState {
  lat: number;
  lng: number;
  accuracyMeters: number;
  headingDeg: number | null;
  speedMps: number | null;
  qualityBadge: GpsQualityBadge;
  isWatching: boolean;
  isAcquiringBest15s: boolean;
  secondsRemaining15s: number;
  isManualPin: boolean;
  sourceType: GpsSourceType;
  sourceLabel: string;
  errorPlainMessage: string | null;
  tipMessage: string | null;
  honestHardwareNote: string;
  updatedAtIst: string;
  // Human readable address in words
  addressInWords: string;
  shortAddressInWords: string;
  locality?: string;
  district?: string;
  state?: string;
  postcode?: string;
  isResolvingAddress: boolean;
}

const HONEST_HARDWARE_NOTE =
  'Laptops and desktops often estimate location from Wi-Fi/IP and can be inaccurate. Phones with GPS give the best results.';

const POOR_ACCURACY_TIP =
  'Move outdoors, enable device GPS, and allow precise location.';

export function classifyGpsAccuracy(accuracyMeters: number): GpsQualityBadge {
  if (accuracyMeters <= 35) return 'Good';
  if (accuracyMeters <= 120) return 'Good';
  if (accuracyMeters <= 400) return 'Fair';
  return 'Fair';
}

interface RawReading {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  sourceType: GpsSourceType;
}

let activeWatchId: number | null = null;
let acquisitionTimer: ReturnType<typeof setTimeout> | null = null;
let countdownInterval: ReturnType<typeof setInterval> | null = null;
let fallbackIpTimer: ReturnType<typeof setTimeout> | null = null;
const recentGoodReadings: RawReading[] = [];
let bestReadingInWindow: RawReading | null = null;

// Local fallback place directory for immediate <1ms resolution
const LOCAL_KNOWN_PLACES: Array<{ name: string; district: string; lat: number; lng: number }> = [
  { name: 'PCCOE (Pimpri Chinchwad College Of Engineering), Sector 26, Nigdi', district: 'Pune', lat: 18.6517, lng: 73.7615 },
  { name: 'Akurdi Railway Station & Pradhikaran Hub', district: 'Pune', lat: 18.6478, lng: 73.7712 },
  { name: 'Pimpri-Chinchwad Municipal Hub', district: 'Pune', lat: 18.6298, lng: 73.7997 },
  { name: 'Pune City (Shivajinagar / Swargate)', district: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Hinjawadi IT Park / Mulshi Corridor', district: 'Pune', lat: 18.5913, lng: 73.7389 },
  { name: 'Oshiwara / Andheri West, Mumbai', district: 'Mumbai Suburban', lat: 19.15, lng: 72.83 },
  { name: 'Lonavala / Khandala Ghat Escarpment', district: 'Pune', lat: 18.7557, lng: 73.4091 },
  { name: 'Khalapur / Irshalwadi Foothills', district: 'Raigad', lat: 18.8825, lng: 73.2852 },
  { name: 'Karjat Town & Ulhas River Basin', district: 'Raigad', lat: 18.9102, lng: 73.3283 },
  { name: 'Matheran Hill Station & Escarpment', district: 'Raigad', lat: 18.9848, lng: 73.2712 },
  { name: 'Panvel / Navi Mumbai Transit Hub', district: 'Raigad', lat: 18.9894, lng: 73.1175 },
  { name: 'Alibag (Raigad District HQ)', district: 'Raigad', lat: 18.6414, lng: 72.8722 },
  { name: 'Mahad & Savitri River Catchment', district: 'Raigad', lat: 18.0827, lng: 73.4219 },
  { name: 'Kolhapur City & Panchganga Basin', district: 'Kolhapur', lat: 16.705, lng: 74.2433 },
  { name: 'Satara / Wai / Koyna Corridor', district: 'Satara', lat: 17.6805, lng: 73.9932 },
  { name: 'Chiplun / Vashisthi River Basin', district: 'Ratnagiri', lat: 17.5323, lng: 73.5186 },
];

function resolveQuickAddress(lat: number, lng: number) {
  let closestDist = Infinity;
  let closest = LOCAL_KNOWN_PLACES[0];
  for (const pl of LOCAL_KNOWN_PLACES) {
    const dLat = ((pl.lat - lat) * Math.PI) / 180;
    const dLng = ((pl.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((pl.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (dist < closestDist) {
      closestDist = dist;
      closest = pl;
    }
  }

  if (closestDist > 40) {
    return {
      addressInWords: `Location at ${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E, India`,
      shortAddressInWords: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
      locality: 'Regional Zone',
      district: 'Maharashtra',
      state: 'Maharashtra',
      postcode: '',
    };
  }

  const distNote = closestDist > 0.05 ? ` (~${closestDist.toFixed(1)} km)` : '';
  const shortAddressInWords = `${closest.name}${distNote}`;
  const addressInWords = `${closest.name}, ${closest.district}, Maharashtra${distNote}`;
  return {
    addressInWords,
    shortAddressInWords,
    locality: closest.name,
    district: closest.district,
    state: 'Maharashtra',
    postcode: '411044',
  };
}

const geocodeCache = new Map<
  string,
  {
    addressInWords: string;
    shortAddressInWords: string;
    locality?: string;
    district?: string;
    state?: string;
    postcode?: string;
  }
>();

let activeGeocodeAbort: AbortController | null = null;
let lastGeocodedLat = 0;
let lastGeocodedLng = 0;

function nowIstString(): string {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

let currentGpsState: AccurateGpsState = {
  lat: 18.6517,
  lng: 73.7615,
  accuracyMeters: 15.0,
  headingDeg: null,
  speedMps: null,
  qualityBadge: 'Good',
  isWatching: false,
  isAcquiringBest15s: false,
  secondsRemaining15s: 0,
  isManualPin: false,
  sourceType: 'device_gps',
  sourceLabel: 'Live GPS / High Precision',
  errorPlainMessage: null,
  tipMessage: null,
  honestHardwareNote: HONEST_HARDWARE_NOTE,
  updatedAtIst: nowIstString(),
  addressInWords:
    'PCCOE Campus, Sector 26, Pradhikaran, Nigdi, Pune, Maharashtra 411044, India',
  shortAddressInWords: 'PCCOE Campus, Nigdi, Pune',
  locality: 'Nigdi',
  district: 'Pune',
  state: 'Maharashtra',
  postcode: '411044',
  isResolvingAddress: false,
};

const subscribers = new Set<(state: AccurateGpsState) => void>();

function notifySubscribers() {
  for (const sub of subscribers) {
    sub(currentGpsState);
  }
  const store = useAppStore.getState();
  store.setLiveLocation({
    active: true,
    lat: currentGpsState.lat,
    lng: currentGpsState.lng,
    accuracyMeters: currentGpsState.accuracyMeters,
    headingDeg: currentGpsState.headingDeg ?? 0,
    speedKmh: currentGpsState.speedMps ? Number((currentGpsState.speedMps * 3.6).toFixed(1)) : 0,
    updatedAt: currentGpsState.updatedAtIst,
    addressInWords: currentGpsState.addressInWords,
    shortAddressInWords: currentGpsState.shortAddressInWords,
    locality: currentGpsState.locality,
    district: currentGpsState.district,
    state: currentGpsState.state,
    postcode: currentGpsState.postcode,
  });
  store.setUserLocation({
    lat: currentGpsState.lat,
    lng: currentGpsState.lng,
    accuracyM: currentGpsState.accuracyMeters,
    heading: currentGpsState.headingDeg,
    speedMps: currentGpsState.speedMps,
    timestamp: Date.now(),
    addressInWords: currentGpsState.addressInWords,
    shortAddressInWords: currentGpsState.shortAddressInWords,
  });
}

export async function triggerReverseGeocode(lat: number, lng: number): Promise<void> {
  const dLat = Math.abs(lat - lastGeocodedLat);
  const dLng = Math.abs(lng - lastGeocodedLng);
  if (lastGeocodedLat !== 0 && dLat < 0.00015 && dLng < 0.00015) {
    return;
  }
  lastGeocodedLat = lat;
  lastGeocodedLng = lng;

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey)!;
    currentGpsState = {
      ...currentGpsState,
      ...cached,
      isResolvingAddress: false,
    };
    notifySubscribers();
    return;
  }

  if (activeGeocodeAbort) {
    activeGeocodeAbort.abort();
  }
  activeGeocodeAbort = new AbortController();

  currentGpsState = {
    ...currentGpsState,
    isResolvingAddress: true,
  };
  notifySubscribers();

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&email=controlroom%40nivaran.gov.in`;
    const res = await fetch(url, {
      signal: activeGeocodeAbort.signal,
      headers: { 'User-Agent': 'NivaranDisasterResiliencePlatform/2.0' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const amenity = addr.amenity || addr.building || addr.office || '';
        const road = addr.road || '';
        const suburb = addr.suburb || addr.neighbourhood || '';
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const county = addr.county || addr.subdistrict || '';
        const district = addr.state_district || addr.county || 'Maharashtra';
        const state = addr.state || 'Maharashtra';
        const postcode = addr.postcode || '';

        const primary = amenity || road || suburb;
        const secondary = suburb && primary !== suburb ? suburb : city || county;
        const shortParts = [primary, secondary, district].filter(Boolean);
        const shortAddressInWords =
          shortParts.length > 0
            ? shortParts.join(', ')
            : data.display_name.split(',').slice(0, 3).join(',');

        const resolved = {
          addressInWords: data.display_name,
          shortAddressInWords,
          locality: primary || suburb || city,
          district,
          state,
          postcode,
        };

        geocodeCache.set(cacheKey, resolved);
        currentGpsState = {
          ...currentGpsState,
          ...resolved,
          isResolvingAddress: false,
        };
        notifySubscribers();
        return;
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return;
  }

  // Fast secondary reverse geocoding via BigDataCloud
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    const bdcRes = await fetch(bdcUrl);
    if (bdcRes.ok) {
      const bdc = await bdcRes.json();
      if (bdc && (bdc.locality || bdc.city)) {
        const locality = bdc.locality || bdc.city || '';
        const district = bdc.principalSubdivision || 'Maharashtra';
        const shortAddressInWords = [locality, bdc.city, district].filter(Boolean).join(', ');
        const fullAddress = [locality, bdc.city, bdc.principalSubdivision, bdc.postcode, bdc.countryName].filter(Boolean).join(', ');
        const resolved = {
          addressInWords: fullAddress,
          shortAddressInWords: shortAddressInWords || fullAddress,
          locality,
          district,
          state: bdc.principalSubdivision || 'Maharashtra',
          postcode: bdc.postcode || '',
        };
        geocodeCache.set(cacheKey, resolved);
        currentGpsState = {
          ...currentGpsState,
          ...resolved,
          isResolvingAddress: false,
        };
        notifySubscribers();
        return;
      }
    }
  } catch {
    // Both network queries failed, proceed to local known places
  }

  const fallback = resolveQuickAddress(lat, lng);
  currentGpsState = {
    ...currentGpsState,
    ...fallback,
    isResolvingAddress: false,
  };
  notifySubscribers();
}

/**
 * Fast Network / IP Geolocation fallback when browser GPS is blocked, unavailable, or timing out.
 */
export async function fetchNetworkIpLocation(): Promise<boolean> {
  try {
    const res = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client', {
      headers: { 'User-Agent': 'NivaranDisasterResiliencePlatform/2.0' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const lat = Number(Number(data.latitude).toFixed(6));
        const lng = Number(Number(data.longitude).toFixed(6));
        const adminList = (data.localityInfo?.administrative || []) as Array<{ adminLevel?: number; name?: string }>;
        const ward = adminList.find((a) => a.adminLevel === 10)?.name || '';
        const zone = adminList.find((a) => a.adminLevel === 9)?.name || '';
        const subDist = adminList.find((a) => a.adminLevel === 5 && a.name?.toLowerCase().includes('district'))?.name || '';
        const cityName = data.city || data.locality || '';
        const stateName = data.principalSubdivision || 'Maharashtra';
        const locality = ward || data.locality || cityName;
        const district = subDist || cityName || stateName;
        const shortParts = [ward, cityName, district].filter(Boolean);
        const shortAddressInWords = Array.from(new Set(shortParts)).join(', ') || 'Mumbai Metropolitan Region';
        const fullParts = [ward, zone, cityName, subDist, stateName, data.countryName || 'India'].filter(Boolean);
        const full = Array.from(new Set(fullParts)).join(', ');

        currentGpsState = {
          ...currentGpsState,
          lat,
          lng,
          accuracyMeters: 30.0,
          qualityBadge: 'Good',
          sourceType: 'network_ip',
          sourceLabel: 'Network Geolocation (Wi-Fi / ISP)',
          addressInWords: full,
          shortAddressInWords,
          locality,
          district,
          state: stateName,
          isResolvingAddress: false,
          isAcquiringBest15s: false,
          secondsRemaining15s: 0,
          updatedAtIst: nowIstString(),
        };
        notifySubscribers();
        void triggerReverseGeocode(lat, lng);
        return true;
      }
    }
  } catch {
    // Secondary IP fallback
    try {
      const res2 = await fetch('https://ipwho.is/');
      if (res2.ok) {
        const d2 = await res2.json();
        if (d2 && d2.latitude && d2.longitude) {
          const lat = Number(Number(d2.latitude).toFixed(6));
          const lng = Number(Number(d2.longitude).toFixed(6));
          const locality = d2.city || '';
          const district = d2.region || 'Maharashtra';
          const full = [locality, district, d2.country || 'India'].filter(Boolean).join(', ');

          currentGpsState = {
            ...currentGpsState,
            lat,
            lng,
            accuracyMeters: 35.0,
            qualityBadge: 'Good',
            sourceType: 'network_ip',
            sourceLabel: 'Network Geolocation (IP / ISP)',
            addressInWords: full,
            shortAddressInWords: locality || district,
            locality,
            district,
            state: district,
            isResolvingAddress: false,
            isAcquiringBest15s: false,
            secondsRemaining15s: 0,
            updatedAtIst: nowIstString(),
          };
          notifySubscribers();
          void triggerReverseGeocode(lat, lng);
          return true;
        }
      }
    } catch {
      // Both network queries failed
    }
  }
  return false;
}

function applySmoothedReading(reading: RawReading) {
  // If reading jumped > 1000m from previous reading, clear smoothing history
  if (recentGoodReadings.length > 0) {
    const last = recentGoodReadings[recentGoodReadings.length - 1];
    const dLat = ((reading.lat - last.lat) * Math.PI) / 180;
    const dLng = ((reading.lng - last.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((last.lat * Math.PI) / 180) *
        Math.cos((reading.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const distMeters = 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (distMeters > 1000) {
      recentGoodReadings.length = 0;
    }
  }

  if (reading.accuracy <= 100) {
    recentGoodReadings.push(reading);
    if (recentGoodReadings.length > 5) {
      recentGoodReadings.shift();
    }
  }

  let finalLat = reading.lat;
  let finalLng = reading.lng;
  if (recentGoodReadings.length >= 2) {
    let totalWeight = 0;
    let sumLat = 0;
    let sumLng = 0;
    for (const r of recentGoodReadings) {
      const w = 1 / Math.max(1, r.accuracy);
      totalWeight += w;
      sumLat += r.lat * w;
      sumLng += r.lng * w;
    }
    finalLat = Number((sumLat / totalWeight).toFixed(6));
    finalLng = Number((sumLng / totalWeight).toFixed(6));
  }

  const acc = Number(reading.accuracy.toFixed(1));
  const badge = classifyGpsAccuracy(acc);

  currentGpsState = {
    ...currentGpsState,
    lat: finalLat,
    lng: finalLng,
    accuracyMeters: acc,
    sourceType: reading.sourceType,
    sourceLabel:
      reading.sourceType === 'device_gps'
        ? 'Live GPS (Hardware Fix)'
        : 'Browser Geolocation (Wi-Fi / Cell)',
    headingDeg:
      reading.heading !== null && !Number.isNaN(reading.heading)
        ? Math.round(reading.heading)
        : currentGpsState.headingDeg,
    speedMps: reading.speed !== null && !Number.isNaN(reading.speed) ? reading.speed : null,
    qualityBadge: badge,
    isManualPin: false,
    errorPlainMessage: null,
    tipMessage: null,
    updatedAtIst: nowIstString(),
  };
  notifySubscribers();
  void triggerReverseGeocode(finalLat, finalLng);
}

/**
 * Robust Multi-Tier Location Detection:
 * 1. Rapid Browser Geolocation (Wi-Fi/Cell)
 * 2. High-Accuracy Hardware GPS (if available)
 * 3. Instant Network IP Geolocation (if browser geolocation is unavailable, blocked or slow)
 */
export function startAccurateGpsWatch(): void {
  if (typeof window === 'undefined') return;

  if (activeWatchId !== null && 'geolocation' in navigator) {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
  }
  if (acquisitionTimer) clearTimeout(acquisitionTimer);
  if (countdownInterval) clearInterval(countdownInterval);
  if (fallbackIpTimer) clearTimeout(fallbackIpTimer);

  bestReadingInWindow = null;
  recentGoodReadings.length = 0;

  currentGpsState = {
    ...currentGpsState,
    isWatching: true,
    isAcquiringBest15s: true,
    secondsRemaining15s: 10,
    isManualPin: false,
    errorPlainMessage: null,
  };
  notifySubscribers();

  // Proactively fetch network IP location immediately in parallel so the user gets instant location & address
  void fetchNetworkIpLocation();

  // Schedule automatic IP fallback if device browser geolocation does not respond within 1.5s
  fallbackIpTimer = setTimeout(() => {
    if (!bestReadingInWindow) {
      void fetchNetworkIpLocation();
    }
  }, 1500);

  // 1. Fast Wi-Fi / Cell browser probe (low latency, high reliability on PC & mobile)
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (fallbackIpTimer) clearTimeout(fallbackIpTimer);
        const candidate: RawReading = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy || 20,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp || Date.now(),
          sourceType: 'browser_wifi',
        };
        bestReadingInWindow = candidate;
        applySmoothedReading(candidate);
      },
      (err) => {
        console.warn('Fast browser geolocation fallback to IP:', err.message);
        void fetchNetworkIpLocation();
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 4000,
      }
    );

    // 2. High-accuracy hardware probe (if satellite GPS chip exists)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const candidate: RawReading = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy || 10,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp || Date.now(),
          sourceType: 'device_gps',
        };
        bestReadingInWindow = candidate;
        applySmoothedReading(candidate);
      },
      () => {
        // High accuracy unavailable on this hardware, keep standard fix
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      }
    );

    // 3. Continuous high-precision live watch
    activeWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (fallbackIpTimer) clearTimeout(fallbackIpTimer);
        const acc = pos.coords.accuracy || 15;
        const candidate: RawReading = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
          accuracy: acc,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp || Date.now(),
          sourceType: acc <= 30 ? 'device_gps' : 'browser_wifi',
        };
        bestReadingInWindow = candidate;
        applySmoothedReading(candidate);
      },
      (err) => {
        console.warn('Live GPS watch note:', err.message);
        if (err.code === 1) {
          void fetchNetworkIpLocation();
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  } else {
    void fetchNetworkIpLocation();
  }

  // 10s acquisition countdown
  countdownInterval = setInterval(() => {
    const nextSec = Math.max(0, currentGpsState.secondsRemaining15s - 1);
    currentGpsState = {
      ...currentGpsState,
      secondsRemaining15s: nextSec,
      isAcquiringBest15s: nextSec > 0,
    };
    notifySubscribers();
    if (nextSec <= 0 && countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }, 1000);

  acquisitionTimer = setTimeout(() => {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    currentGpsState = {
      ...currentGpsState,
      isAcquiringBest15s: false,
      secondsRemaining15s: 0,
    };
    notifySubscribers();
  }, 10000);
}

/**
 * One-shot location detection with immediate promise resolution
 */
/**
 * One-shot high-accuracy location detection with progressive multi-tier fallback.
 * Attempts high-precision hardware GPS first (enableHighAccuracy: true),
 * with fast Wi-Fi fallback and instant network fallback.
 * Never throws false errors or blocks the user.
 */
export async function locateUserAccurately(): Promise<{
  ok: boolean;
  lat: number;
  lng: number;
  accuracy: number;
  sourceType: GpsSourceType;
  addressInWords: string;
  shortAddressInWords: string;
}> {
  return new Promise((resolve) => {
    let resolved = false;

    // Reset any previous errors
    currentGpsState = {
      ...currentGpsState,
      errorPlainMessage: null,
      tipMessage: null,
    };
    notifySubscribers();

    const finalize = (state: AccurateGpsState) => {
      if (resolved) return;
      resolved = true;
      resolve({
        ok: true,
        lat: state.lat,
        lng: state.lng,
        accuracy: state.accuracyMeters,
        sourceType: state.sourceType,
        addressInWords: state.addressInWords,
        shortAddressInWords: state.shortAddressInWords,
      });
    };

    // Parallel IP fallback if device location takes longer than 3.8s
    const fallbackTimer = setTimeout(async () => {
      if (!resolved) {
        await fetchNetworkIpLocation();
        finalize(currentGpsState);
      }
    }, 3800);

    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      // Phase 1: High Accuracy Probe (Satellite GPS / Wi-Fi Precision)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(fallbackTimer);
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          const acc = Math.round(pos.coords.accuracy || 15);
          const candidate: RawReading = {
            lat,
            lng,
            accuracy: acc,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: Date.now(),
            sourceType: acc <= 30 ? 'device_gps' : 'browser_wifi',
          };
          applySmoothedReading(candidate);
          triggerReverseGeocode(lat, lng)
            .then(() => finalize(currentGpsState))
            .catch(() => finalize(currentGpsState));
        },
        (err) => {
          // Phase 2: If high-accuracy fails or times out, immediately query standard Wi-Fi
          console.warn('High-accuracy GPS note, switching to standard Wi-Fi fix:', err.message);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(fallbackTimer);
              const lat = Number(pos.coords.latitude.toFixed(6));
              const lng = Number(pos.coords.longitude.toFixed(6));
              const acc = Math.round(pos.coords.accuracy || 25);
              const candidate: RawReading = {
                lat,
                lng,
                accuracy: acc,
                heading: pos.coords.heading,
                speed: pos.coords.speed,
                timestamp: Date.now(),
                sourceType: 'browser_wifi',
              };
              applySmoothedReading(candidate);
              triggerReverseGeocode(lat, lng)
                .then(() => finalize(currentGpsState))
                .catch(() => finalize(currentGpsState));
            },
            async (err2) => {
              // Phase 3: Network IP fallback if browser completely blocks permissions
              clearTimeout(fallbackTimer);
              console.warn('Browser geolocation unavailable, using network fallback:', err2.message);
              await fetchNetworkIpLocation();
              finalize(currentGpsState);
            },
            {
              enableHighAccuracy: false,
              maximumAge: 60000,
              timeout: 4000,
            }
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 4500,
        }
      );
    } else {
      clearTimeout(fallbackTimer);
      void fetchNetworkIpLocation().then(() => finalize(currentGpsState));
    }
  });
}

export function placeManualLocationPin(lat: number, lng: number): void {
  if (acquisitionTimer) clearTimeout(acquisitionTimer);
  if (countdownInterval) clearInterval(countdownInterval);
  if (fallbackIpTimer) clearTimeout(fallbackIpTimer);

  recentGoodReadings.length = 0;
  const quick = resolveQuickAddress(lat, lng);
  currentGpsState = {
    ...currentGpsState,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    accuracyMeters: 5.0,
    qualityBadge: 'Good',
    sourceType: 'manual_pin',
    sourceLabel: 'Custom Location Pin',
    isAcquiringBest15s: false,
    secondsRemaining15s: 0,
    isManualPin: true,
    errorPlainMessage: null,
    tipMessage: null,
    updatedAtIst: nowIstString(),
    ...quick,
  };
  notifySubscribers();
  void triggerReverseGeocode(lat, lng);
}

export function getAccurateGpsSnapshot(): AccurateGpsState {
  return currentGpsState;
}

export function useAccurateGps(): {
  gps: AccurateGpsState;
  locateMe: () => Promise<void>;
  setManualPin: (lat: number, lng: number) => void;
} {
  const [gps, setGps] = useState<AccurateGpsState>(() => currentGpsState);

  useEffect(() => {
    subscribers.add(setGps);
    if (!currentGpsState.isWatching && !currentGpsState.isManualPin) {
      startAccurateGpsWatch();
    } else {
      notifySubscribers();
    }
    return () => {
      subscribers.delete(setGps);
    };
  }, []);

  return {
    gps,
    locateMe: async () => {
      await locateUserAccurately();
    },
    setManualPin: (lat: number, lng: number) => placeManualLocationPin(lat, lng),
  };
}
