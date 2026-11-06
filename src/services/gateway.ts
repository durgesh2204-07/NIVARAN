import { apiRequest, ApiResult } from '../resilience/apiClient';
import { recordBreadcrumb } from '../resilience/reporter';
import { mockContractAdapter, SYNTHETIC_ADAPTER_BANNER } from '../mocks/mockAdapter';
import { DEFAULT_WEIGHTS } from '../store/useAppStore';
import { HazardWeights } from '../types';

/**
 * Single Backend Proxy Gateway (`services/gateway.ts`, Section 9 & Section 10).
 *
 * The front end talks ONLY to `services/gateway.ts` -> resilient client -> typed endpoints:
 * GET /health · GET /villages · GET /sites · GET /cells · GET /summary · GET /sources
 * GET /pipeline/status · GET /models · GET /models/{id} · POST /analyze · POST /allocate
 * POST /scenario · GET /plans · POST /plans/{id}/approve · POST /sos · POST /reports.
 */

let memoryAccessToken: string | null = null;
let csrfToken: string = generateCsrfToken();

function generateCsrfToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function setMemoryAccessToken(token: string | null): void {
  memoryAccessToken = token;
  if (!token) {
    csrfToken = generateCsrfToken();
  }
}

export function getMemoryAccessToken(): string | null {
  return memoryAccessToken;
}

export function getCsrfToken(): string {
  return csrfToken;
}

export function createIdempotencyKey(actionPrefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${actionPrefix}-${Date.now()}-${rand}`;
}

export interface GatewayCallOptions<T> {
  endpoint: `/api/${string}`;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  fallbackHandler?: () => Promise<T> | T;
}

export async function callBackendGateway<T>(
  options: GatewayCallOptions<T>
): Promise<ApiResult<T>> {
  const method = options.method || 'GET';
  const isMutation = method !== 'GET';
  const headers: Record<string, string> = {
    'X-Requested-With': 'Nivaran-Operations-Client',
  };

  if (memoryAccessToken) {
    headers['Authorization'] = `Bearer ${memoryAccessToken}`;
  }
  if (isMutation) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const idempotencyKey =
    options.idempotencyKey || (isMutation ? createIdempotencyKey('mut') : undefined);

  recordBreadcrumb('api', `Gateway ${method} ${options.endpoint}`);

  if (options.fallbackHandler) {
    const data = await options.fallbackHandler();
    return {
      data,
      stale: false,
      updatedAtIst: new Date().toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      }),
      warning: SYNTHETIC_ADAPTER_BANNER,
    };
  }

  return apiRequest<T>({
    url: options.endpoint,
    method,
    headers,
    body: options.body,
    idempotencyKey,
    dependencyId: 'own_api',
  });
}

/**
 * Typed Section 9 Backend Contract Endpoints
 */
export const gatewayContract = {
  getHealth: () =>
    callBackendGateway({
      endpoint: '/api/health',
      fallbackHandler: () => mockContractAdapter.getHealth(),
    }),
  getVillages: () =>
    callBackendGateway({
      endpoint: '/api/villages',
      fallbackHandler: () => mockContractAdapter.getVillagesGeoJson(),
    }),
  getSites: () =>
    callBackendGateway({
      endpoint: '/api/sites',
      fallbackHandler: () => mockContractAdapter.getSitesGeoJson(),
    }),
  getCells: (hazard = 'landslide') =>
    callBackendGateway({
      endpoint: `/api/cells?hazard=${encodeURIComponent(hazard)}`,
      fallbackHandler: () => mockContractAdapter.getCells(hazard),
    }),
  getSummary: () =>
    callBackendGateway({
      endpoint: '/api/summary',
      fallbackHandler: () => mockContractAdapter.getSummary(),
    }),
  getSources: () =>
    callBackendGateway({
      endpoint: '/api/sources',
      fallbackHandler: () => mockContractAdapter.getSources(),
    }),
  getPipelineStatus: () =>
    callBackendGateway({
      endpoint: '/api/pipeline/status',
      fallbackHandler: () => mockContractAdapter.getPipelineStatus(),
    }),
  getModels: () =>
    callBackendGateway({
      endpoint: '/api/models',
      fallbackHandler: () => mockContractAdapter.getModels(),
    }),
  postAllocate: (weights: HazardWeights = DEFAULT_WEIGHTS) =>
    callBackendGateway({
      endpoint: '/api/allocate',
      method: 'POST',
      body: { weights },
      fallbackHandler: () => mockContractAdapter.postAllocate(weights),
    }),
  postScenario: (params: { extraRainfallMm?: number; unavailableSiteIds?: string[] }) =>
    callBackendGateway({
      endpoint: '/api/scenario',
      method: 'POST',
      body: params,
      fallbackHandler: () => mockContractAdapter.postScenario(params),
    }),
  getVoiceAlerts: (currentList: unknown[] = []) =>
    callBackendGateway({
      endpoint: '/api/alerts/voice',
      fallbackHandler: () => mockContractAdapter.getVoiceAlerts(currentList),
    }),
  postVoiceAlert: (payload: {
    audioMimeType: string;
    audioSizeBytes: number;
    durationSeconds: number;
    lat: number;
    lng: number;
    accuracyMeters: number;
    userId: string;
    userName: string;
    phone?: string;
    district: string;
    controlRoomTarget: string;
    audioUrl?: string;
    transcriptSummary?: string;
  }) =>
    callBackendGateway({
      endpoint: '/api/alerts/voice',
      method: 'POST',
      body: payload,
      fallbackHandler: () => mockContractAdapter.postVoiceAlert(payload),
    }),
  patchVoiceAlertStatus: (id: string, status: string, actor: string) =>
    callBackendGateway({
      endpoint: `/api/alerts/voice/${encodeURIComponent(id)}/status`,
      method: 'PATCH',
      body: { status, actor },
      fallbackHandler: () => mockContractAdapter.patchVoiceAlertStatus(id, status, actor),
    }),
  getSosAlerts: (currentList: unknown[] = []) =>
    callBackendGateway({
      endpoint: '/api/alerts/sos',
      fallbackHandler: () => mockContractAdapter.getSosAlerts(currentList),
    }),
  postSosAlert: (payload: {
    lat: number;
    lng: number;
    accuracyMeters: number;
    timestamp: string;
    userId: string;
    userName: string;
    phone?: string;
    district: string;
    controlRoomTarget: string;
  }) =>
    callBackendGateway({
      endpoint: '/api/alerts/sos',
      method: 'POST',
      body: payload,
      fallbackHandler: () => mockContractAdapter.postSosAlert(payload),
    }),
  patchSosAlertStatus: (id: string, status: string, actor: string) =>
    callBackendGateway({
      endpoint: `/api/alerts/sos/${encodeURIComponent(id)}/status`,
      method: 'PATCH',
      body: { status, actor },
      fallbackHandler: () => mockContractAdapter.patchSosAlertStatus(id, status, actor),
    }),
};

/**
 * Realtime Channel (WebSocket / SSE / BroadcastChannel mock adapter)
 * Propagates Alert Zone level changes and incoming Voice Alerts & SOS Alerts across all logged-in tabs/users.
 */
export type RealtimeEventPayload =
  | { type: 'ALERT_ZONE_UPDATED'; zone: unknown }
  | { type: 'VOICE_ALERT_CREATED'; alert: unknown }
  | { type: 'VOICE_ALERT_STATUS_UPDATED'; id: string; status: string; actor: string }
  | { type: 'SOS_ALERT_CREATED'; alert: unknown }
  | { type: 'SOS_ALERT_STATUS_UPDATED'; id: string; status: string; actor: string };

const realtimeListeners = new Set<(event: RealtimeEventPayload) => void>();
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('nivaran_realtime_ops_v2');
    broadcastChannel.onmessage = (msg) => {
      if (msg.data && typeof msg.data === 'object' && 'type' in msg.data) {
        for (const listener of realtimeListeners) {
          listener(msg.data as RealtimeEventPayload);
        }
      }
    };
  } catch {
    broadcastChannel = null;
  }
}

export function publishRealtimeEvent(event: RealtimeEventPayload): void {
  recordBreadcrumb('api', `Realtime broadcast: ${event.type}`);
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch {
      // ignore
    }
  }
  for (const listener of realtimeListeners) {
    listener(event);
  }
}

export function subscribeRealtimeEvents(
  listener: (event: RealtimeEventPayload) => void
): () => void {
  realtimeListeners.add(listener);
  return () => {
    realtimeListeners.delete(listener);
  };
}

