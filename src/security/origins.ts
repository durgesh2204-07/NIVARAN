/**
 * Single source of truth for third-party origins, Content-Security-Policy (CSP),
 * rate-limit budgets, and runtime kill switches / feature flags.
 */

export const ALLOWED_ORIGINS = {
  weather: 'https://api.open-meteo.com',
  seismic: 'https://earthquake.usgs.gov',
  geocoding: 'https://nominatim.openstreetmap.org',
  routing: 'https://router.project-osrm.org',
  terrainDem: 'https://s3.amazonaws.com',
  vectorTiles: 'https://tiles.openfreemap.org',
  satelliteTiles: 'https://server.arcgisonline.com',
  servicesArcgis: 'https://services.arcgisonline.com',
  arcgisWildcard: 'https://*.arcgisonline.com',
  osmTiles: 'https://*.tile.openstreetmap.org',
  osmDirect: 'https://tile.openstreetmap.org',
  cartoTiles: 'https://*.basemaps.cartocdn.com',
  googleTiles: 'https://*.google.com',
  googleTileUrls: 'https://*.google.com',
  mapboxTiles: 'https://api.mapbox.com',
  maptilerTiles: 'https://api.maptiler.com',
  topoTiles: 'https://*.tile.opentopomap.org',
  bigdatacloud: 'https://api.bigdatacloud.net',
  ipwhois: 'https://ipwho.is',
} as const;

export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    ALLOWED_ORIGINS.satelliteTiles,
    ALLOWED_ORIGINS.servicesArcgis,
    ALLOWED_ORIGINS.arcgisWildcard,
    ALLOWED_ORIGINS.osmTiles,
    ALLOWED_ORIGINS.osmDirect,
    ALLOWED_ORIGINS.cartoTiles,
    ALLOWED_ORIGINS.googleTiles,
    ALLOWED_ORIGINS.googleTileUrls,
    ALLOWED_ORIGINS.mapboxTiles,
    ALLOWED_ORIGINS.maptilerTiles,
    ALLOWED_ORIGINS.topoTiles,
    ALLOWED_ORIGINS.vectorTiles,
    ALLOWED_ORIGINS.terrainDem,
  ],
  'connect-src': [
    "'self'",
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'ws://localhost:5173',
    'ws://127.0.0.1:5173',
    ALLOWED_ORIGINS.weather,
    ALLOWED_ORIGINS.seismic,
    ALLOWED_ORIGINS.geocoding,
    ALLOWED_ORIGINS.routing,
    ALLOWED_ORIGINS.terrainDem,
    ALLOWED_ORIGINS.vectorTiles,
    ALLOWED_ORIGINS.mapboxTiles,
    ALLOWED_ORIGINS.maptilerTiles,
    ALLOWED_ORIGINS.satelliteTiles,
    ALLOWED_ORIGINS.servicesArcgis,
    ALLOWED_ORIGINS.arcgisWildcard,
    ALLOWED_ORIGINS.osmTiles,
    ALLOWED_ORIGINS.osmDirect,
    ALLOWED_ORIGINS.bigdatacloud,
    ALLOWED_ORIGINS.ipwhois,
  ],
  'worker-src': ["'self'", 'blob:'],
  'font-src': ["'self'", 'data:'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
};

export function buildCspString(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Client-side rate limit budgets matching server-side enforcement rules (Section 8.6).
 */
export const RATE_LIMIT_BUDGETS = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  sos: { maxRequests: 1, windowMs: 2 * 60 * 1000 }, // 1 active SOS per 2 min
  publicReport: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour per device
  geocoding: { maxRequests: 1, windowMs: 1000 }, // 1 request per second (Nominatim policy)
  weather: { maxRequests: 30, windowMs: 60 * 1000 },
  routing: { maxRequests: 15, windowMs: 60 * 1000 },
} as const;

export interface FeatureFlags {
  enable3dTerrain: boolean;
  enableLiveWeather: boolean;
  enableSeismicFeed: boolean;
  enableNominatimSearch: boolean;
  enableOsrmRouting: boolean;
  enableFloodSimulator: boolean;
  enableVoiceSearch: boolean;
  readOnlyEmergencyMode: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enable3dTerrain: true,
  enableLiveWeather: true,
  enableSeismicFeed: true,
  enableNominatimSearch: true,
  enableOsrmRouting: true,
  enableFloodSimulator: true,
  enableVoiceSearch: true,
  readOnlyEmergencyMode: false,
};
