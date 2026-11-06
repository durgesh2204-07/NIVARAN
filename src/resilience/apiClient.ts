import { z } from 'zod';
import { RATE_LIMIT_BUDGETS } from '../security/origins';
import { recordBreadcrumb, reportError } from './reporter';

/**
 * Typed Error Hierarchy for unified error handling (Section 9.2).
 */
export class ApiBaseError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly retryAfterMs?: number;

  constructor(message: string, code: string, status?: number, retryAfterMs?: number) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export class NetworkError extends ApiBaseError {
  constructor(message = 'Network connection unavailable.') {
    super(message, 'NETWORK_ERROR');
  }
}

export class TimeoutError extends ApiBaseError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs} ms.`, 'TIMEOUT_ERROR', 408);
  }
}

export class AuthError extends ApiBaseError {
  constructor(message = 'Authentication required or session expired.') {
    super(message, 'AUTH_ERROR', 401);
  }
}

export class ForbiddenError extends ApiBaseError {
  constructor(message = 'You do not have access to this record.') {
    super(message, 'FORBIDDEN_ERROR', 403);
  }
}

export class NotFoundError extends ApiBaseError {
  constructor(message = 'Requested resource was not found.') {
    super(message, 'NOT_FOUND_ERROR', 404);
  }
}

export class ValidationError extends ApiBaseError {
  constructor(message = 'Response payload failed schema validation.') {
    super(message, 'VALIDATION_ERROR', 422);
  }
}

export class RateLimitError extends ApiBaseError {
  constructor(message = 'Too many requests. Please wait before retrying.', retryAfterMs = 5000) {
    super(message, 'RATE_LIMIT_ERROR', 429, retryAfterMs);
  }
}

export class ServerError extends ApiBaseError {
  constructor(message = 'Upstream service returned an error.', status = 500) {
    super(message, 'SERVER_ERROR', status);
  }
}

/**
 * Fault Injection state (Development only, Section 9.6).
 */
export interface FaultInjectionConfig {
  forceOffline: boolean;
  artificialLatencyMs: number;
  simulatedFailureMode: 'none' | 'http_500' | 'http_429' | 'timeout' | 'malformed_json';
  disableWeatherFeed: boolean;
  disableSeismicFeed: boolean;
  disableNominatimFeed: boolean;
  disableOsrmRouting: boolean;
  disable3dTerrainTiles: boolean;
}

let faultConfig: FaultInjectionConfig = {
  forceOffline: false,
  artificialLatencyMs: 0,
  simulatedFailureMode: 'none',
  disableWeatherFeed: false,
  disableSeismicFeed: false,
  disableNominatimFeed: false,
  disableOsrmRouting: false,
  disable3dTerrainTiles: false,
};

let faultListeners: Array<(cfg: FaultInjectionConfig) => void> = [];

export function getFaultInjectionConfig(): FaultInjectionConfig {
  return { ...faultConfig };
}

export function setFaultInjectionConfig(partial: Partial<FaultInjectionConfig>): FaultInjectionConfig {
  faultConfig = { ...faultConfig, ...partial };
  faultListeners.forEach((l) => l(faultConfig));
  recordBreadcrumb('security', `Fault injection updated: ${JSON.stringify(partial)}`);
  return getFaultInjectionConfig();
}

export function subscribeFaultInjection(listener: (cfg: FaultInjectionConfig) => void): () => void {
  faultListeners.push(listener);
  return () => {
    faultListeners = faultListeners.filter((l) => l !== listener);
  };
}

/**
 * Per-host Circuit Breaker & Dependency Health Registry (Section 9.2 & 9.6).
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

export interface DependencyHealth {
  id: 'own_api' | 'weather' | 'seismic' | 'geocoding' | 'routing' | 'tiles' | 'alert_gateway';
  label: string;
  host: string;
  circuit: CircuitState;
  consecutiveFailures: number;
  openedAt: number | null;
  lastLatencyMs: number | null;
  lastSuccessAt: string | null;
  lastErrorMessage: string | null;
}

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_HALF_OPEN_MS = 30 * 1000; // 30 seconds

const dependencyRegistry = new Map<DependencyHealth['id'], DependencyHealth>([
  [
    'own_api',
    {
      id: 'own_api',
      label: 'Nivaran Command API Gateway',
      host: 'self',
      circuit: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastLatencyMs: 18,
      lastSuccessAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  ],
  [
    'weather',
    {
      id: 'weather',
      label: 'Open-Meteo Weather & Elevation',
      host: 'api.open-meteo.com',
      circuit: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastLatencyMs: 145,
      lastSuccessAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  ],
  [
    'seismic',
    {
      id: 'seismic',
      label: 'USGS Seismic GeoJSON Feed',
      host: 'earthquake.usgs.gov',
      circuit: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastLatencyMs: 210,
      lastSuccessAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  ],
  [
    'geocoding',
    {
      id: 'geocoding',
      label: 'Nominatim Gazetteer & Search',
      host: 'nominatim.openstreetmap.org',
      circuit: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastLatencyMs: 190,
      lastSuccessAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  ],
  [
    'routing',
    {
      id: 'routing',
      label: 'OSRM Evacuation Routing Engine',
      host: 'router.project-osrm.org',
      circuit: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastLatencyMs: 165,
      lastSuccessAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  ],
  [
    'tiles',
    {
      id: 'tiles',
      label: 'AWS Terrarium 3D DEM & Vector Tiles',
      host: 's3.amazonaws.com',
      circuit: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastLatencyMs: 95,
      lastSuccessAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  ],
  [
    'alert_gateway',
    {
      id: 'alert_gateway',
      label: 'CAP v1.2 Public Alerting Gateway',
      host: 'cap-gateway.internal',
      circuit: 'closed',
      consecutiveFailures: 0,
      openedAt: null,
      lastLatencyMs: 24,
      lastSuccessAt: new Date().toISOString(),
      lastErrorMessage: null,
    },
  ],
]);

export function getDependencyHealthList(): DependencyHealth[] {
  const now = Date.now();
  return Array.from(dependencyRegistry.values()).map((dep) => {
    if (dep.circuit === 'open' && dep.openedAt && now - dep.openedAt >= CIRCUIT_HALF_OPEN_MS) {
      dep.circuit = 'half-open';
    }
    return { ...dep };
  });
}

export function recordDependencyOutcome(
  id: DependencyHealth['id'],
  success: boolean,
  latencyMs?: number,
  errorMessage?: string
): void {
  const dep = dependencyRegistry.get(id);
  if (!dep) return;

  if (success) {
    dep.circuit = 'closed';
    dep.consecutiveFailures = 0;
    dep.openedAt = null;
    if (typeof latencyMs === 'number') {
      dep.lastLatencyMs = Math.round(latencyMs);
    }
    dep.lastSuccessAt = new Date().toISOString();
    dep.lastErrorMessage = null;
  } else {
    dep.consecutiveFailures += 1;
    dep.lastErrorMessage = errorMessage || 'Upstream failure';
    if (dep.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
      dep.circuit = 'open';
      dep.openedAt = Date.now();
    }
  }
}

/**
 * Rate Limit Budget Tracker (Section 8.6 & 9.2).
 */
const rateTimestamps = new Map<string, number[]>();

export function checkRateBudget(
  category: keyof typeof RATE_LIMIT_BUDGETS,
  customKey?: string
): { allowed: boolean; retryAfterMs: number } {
  const budget = RATE_LIMIT_BUDGETS[category];
  const key = customKey ? `${category}:${customKey}` : category;
  const now = Date.now();
  const windowStart = now - budget.windowMs;
  const history = (rateTimestamps.get(key) || []).filter((t) => t > windowStart);

  if (history.length >= budget.maxRequests) {
    const oldest = history[0] || now;
    const retryAfterMs = Math.max(500, oldest + budget.windowMs - now);
    return { allowed: false, retryAfterMs };
  }

  history.push(now);
  rateTimestamps.set(key, history);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Stale-While-Revalidate (SWR) Memory Cache & Concurrency Limiter.
 */
interface SwrCacheEntry<T> {
  data: T;
  updatedAt: number;
  updatedAtIst: string;
}

const swrCache = new Map<string, SwrCacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();
let activeConcurrency = 0;
const MAX_CONCURRENCY = 6;
const concurrencyQueue: Array<() => void> = [];

async function acquireConcurrencySlot(): Promise<void> {
  if (activeConcurrency < MAX_CONCURRENCY) {
    activeConcurrency += 1;
    return;
  }
  await new Promise<void>((resolve) => {
    concurrencyQueue.push(resolve);
  });
  activeConcurrency += 1;
}

function releaseConcurrencySlot(): void {
  activeConcurrency = Math.max(0, activeConcurrency - 1);
  const next = concurrencyQueue.shift();
  if (next) next();
}

export function formatTimeIst(date = new Date()): string {
  try {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

export interface ApiRequestOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  dependencyId?: DependencyHealth['id'];
  rateCategory?: keyof typeof RATE_LIMIT_BUDGETS;
  schema?: z.ZodType<T>;
  cacheKey?: string;
  cacheTtlMs?: number;
  signal?: AbortSignal;
  idempotencyKey?: string;
}

export interface ApiResult<T> {
  data: T;
  stale: boolean;
  updatedAtIst: string;
  warning?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Unified resilient API client (Section 9.2).
 * Handles timeouts, retries with exponential backoff & jitter, circuit breaking,
 * de-duplication, rate budgets, Zod schema validation, and Stale-While-Revalidate fallback.
 */
export async function apiRequest<T>(options: ApiRequestOptions<T>): Promise<ApiResult<T>> {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 8000,
    retries = method === 'GET' ? 2 : 0,
    dependencyId = 'own_api',
    rateCategory,
    schema,
    cacheKey = method === 'GET' ? url : undefined,
    cacheTtlMs = 5 * 60 * 1000,
    signal,
    idempotencyKey,
  } = options;

  // Check if fresh cache entry exists
  if (cacheKey && method === 'GET') {
    const cached = swrCache.get(cacheKey) as SwrCacheEntry<T> | undefined;
    if (cached && Date.now() - cached.updatedAt < cacheTtlMs && !faultConfig.forceOffline) {
      return {
        data: cached.data,
        stale: false,
        updatedAtIst: cached.updatedAtIst,
      };
    }
  }

  // De-duplicate identical in-flight GET requests
  const dedupeKey = method === 'GET' ? `${method}:${url}` : undefined;
  if (dedupeKey && inFlightRequests.has(dedupeKey)) {
    return inFlightRequests.get(dedupeKey) as Promise<ApiResult<T>>;
  }

  const execute = async (): Promise<ApiResult<T>> => {
    // 1. Check Fault Injection
    if (faultConfig.forceOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      recordDependencyOutcome(dependencyId, false, 0, 'Offline mode active');
      throw new NetworkError('Device is offline.');
    }
    if (dependencyId === 'weather' && faultConfig.disableWeatherFeed) {
      recordDependencyOutcome('weather', false, 0, 'Fault injection: Weather disabled');
      throw new ServerError('Open-Meteo feed disabled by fault injection.', 503);
    }
    if (dependencyId === 'seismic' && faultConfig.disableSeismicFeed) {
      recordDependencyOutcome('seismic', false, 0, 'Fault injection: Seismic disabled');
      throw new ServerError('USGS feed disabled by fault injection.', 503);
    }
    if (dependencyId === 'geocoding' && faultConfig.disableNominatimFeed) {
      recordDependencyOutcome('geocoding', false, 0, 'Fault injection: Nominatim disabled');
      throw new ServerError('Nominatim feed disabled by fault injection.', 503);
    }
    if (dependencyId === 'routing' && faultConfig.disableOsrmRouting) {
      recordDependencyOutcome('routing', false, 0, 'Fault injection: OSRM disabled');
      throw new ServerError('OSRM routing disabled by fault injection.', 503);
    }

    if (faultConfig.artificialLatencyMs > 0) {
      await sleep(faultConfig.artificialLatencyMs);
    }

    if (faultConfig.simulatedFailureMode === 'timeout') {
      recordDependencyOutcome(dependencyId, false, timeoutMs, 'Simulated timeout');
      throw new TimeoutError(timeoutMs);
    }
    if (faultConfig.simulatedFailureMode === 'http_500') {
      recordDependencyOutcome(dependencyId, false, 50, 'Simulated HTTP 500');
      throw new ServerError('Simulated HTTP 500 Internal Server Error', 500);
    }
    if (faultConfig.simulatedFailureMode === 'http_429') {
      recordDependencyOutcome(dependencyId, false, 30, 'Simulated HTTP 429');
      throw new RateLimitError('Simulated 429 Too Many Requests', 5000);
    }
    if (faultConfig.simulatedFailureMode === 'malformed_json') {
      recordDependencyOutcome(dependencyId, false, 40, 'Simulated malformed JSON');
      throw new ValidationError('Simulated malformed JSON payload');
    }

    // 2. Check Circuit Breaker
    const dep = dependencyRegistry.get(dependencyId);
    if (dep && dep.circuit === 'open') {
      if (dep.openedAt && Date.now() - dep.openedAt >= CIRCUIT_HALF_OPEN_MS) {
        dep.circuit = 'half-open';
      } else {
        throw new ServerError(`Circuit breaker open for ${dep.label}`, 503);
      }
    }

    // 3. Check Rate Limit Budget
    if (rateCategory) {
      const budgetCheck = checkRateBudget(rateCategory);
      if (!budgetCheck.allowed) {
        throw new RateLimitError(
          `Rate limit exceeded for ${rateCategory}. Retry in ${Math.ceil(budgetCheck.retryAfterMs / 1000)}s.`,
          budgetCheck.retryAfterMs
        );
      }
    }

    let lastErr: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      await acquireConcurrencySlot();
      const startTime = performance.now();
      const controller = new AbortController();
      const timerId = setTimeout(() => controller.abort(), timeoutMs);

      if (signal) {
        signal.addEventListener('abort', () => controller.abort(), { once: true });
      }

      try {
        const reqHeaders: Record<string, string> = {
          Accept: 'application/json',
          ...headers,
        };
        if (body !== undefined) {
          reqHeaders['Content-Type'] = 'application/json';
        }
        if (idempotencyKey) {
          reqHeaders['Idempotency-Key'] = idempotencyKey;
        }

        const res = await fetch(url, {
          method,
          headers: reqHeaders,
          body: body !== undefined ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timerId);
        const elapsed = performance.now() - startTime;

        if (!res.ok) {
          if (res.status === 401) throw new AuthError();
          if (res.status === 403) throw new ForbiddenError();
          if (res.status === 404) throw new NotFoundError();
          if (res.status === 429) {
            const retryAfterHeader = res.headers.get('Retry-After');
            const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 4000;
            throw new RateLimitError('Upstream rate limit reached.', retryAfterMs);
          }
          throw new ServerError(`HTTP ${res.status} from ${url}`, res.status);
        }

        const rawJson: unknown = await res.json();
        const validated: T = schema ? schema.parse(rawJson) : (rawJson as T);

        recordDependencyOutcome(dependencyId, true, elapsed);
        recordBreadcrumb('api', `${method} ${url}`, res.status);

        const nowIst = formatTimeIst();
        if (cacheKey && method === 'GET') {
          swrCache.set(cacheKey, {
            data: validated,
            updatedAt: Date.now(),
            updatedAtIst: nowIst,
          });
        }

        return {
          data: validated,
          stale: false,
          updatedAtIst: nowIst,
        };
      } catch (err) {
        clearTimeout(timerId);
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        const wrappedErr = isAbort ? new TimeoutError(timeoutMs) : err;
        lastErr = wrappedErr;

        const errMsg = wrappedErr instanceof Error ? wrappedErr.message : 'Request failed';
        recordDependencyOutcome(dependencyId, false, performance.now() - startTime, errMsg);

        // Only retry idempotent GET requests on network/timeout/5xx/429 errors
        const shouldRetry =
          method === 'GET' &&
          attempt < retries &&
          !(wrappedErr instanceof AuthError) &&
          !(wrappedErr instanceof ForbiddenError) &&
          !(wrappedErr instanceof ValidationError);

        if (shouldRetry) {
          const baseDelay =
            wrappedErr instanceof RateLimitError && wrappedErr.retryAfterMs
              ? wrappedErr.retryAfterMs
              : Math.min(3500, 400 * Math.pow(2, attempt));
          const jitter = Math.floor(Math.random() * 200);
          await sleep(baseDelay + jitter);
          continue;
        }
        break;
      } finally {
        releaseConcurrencySlot();
      }
    }

    // Stale-while-revalidate fallback if cached data is available
    if (cacheKey && method === 'GET') {
      const staleEntry = swrCache.get(cacheKey) as SwrCacheEntry<T> | undefined;
      if (staleEntry) {
        return {
          data: staleEntry.data,
          stale: true,
          updatedAtIst: staleEntry.updatedAtIst,
          warning: `Last updated ${staleEntry.updatedAtIst} IST · Retrying`,
        };
      }
    }

    reportError(lastErr, { componentScope: `apiClient:${dependencyId}` });
    throw lastErr instanceof Error ? lastErr : new NetworkError('Network request failed.');
  };

  const promise = execute().finally(() => {
    if (dedupeKey) {
      inFlightRequests.delete(dedupeKey);
    }
  });

  if (dedupeKey) {
    inFlightRequests.set(dedupeKey, promise);
  }

  return promise;
}
