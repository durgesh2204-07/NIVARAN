import {
  ActiveAlertZone,
  AuditLogEntry,
  DrillSummaryReport,
  EmergencySosItem,
  FamilySafeCheckIn,
  HouseholdCase,
  ImpactComparisonRow,
  IncidentItem,
  ReliefCamp,
  ResourceRequestRecord,
  ResourceStockItem,
  ShelterCheckInRecord,
  ShelterOccupancyLog,
  VoiceAlertItem,
  VolunteerMember,
} from '../types';

/**
 * Persistent Mock Backend Adapter using IndexedDB + BroadcastChannel (Section 1).
 *
 * Ensures all operational mutations (alert zones, shelter occupancy, check-ins,
 * volunteers, tasks, IDRN resources, incidents, relocation cases, voice/SOS alerts,
 * drill mode, and audit logs) persist across page reloads AND update live across
 * all open browser tabs/sessions.
 */

const DB_NAME = 'nivaran_operational_db_v2';
const STORE_NAME = 'operational_state';
const SNAPSHOT_KEY = 'live_state_v2';
const CHANNEL_NAME = 'nivaran_operational_sync_v2';

export interface PersistedOperationalSnapshot {
  updatedAtMs: number;
  isUsingDemoSeedData: boolean;
  drillModeActive: boolean;
  drillStartedAt?: string | null;
  activeAlertZones: ActiveAlertZone[];
  reliefCamps: ReliefCamp[];
  shelterOccupancyLogs: ShelterOccupancyLog[];
  shelterCheckIns: ShelterCheckInRecord[];
  volunteers: VolunteerMember[];
  resourceStock: ResourceStockItem[];
  resourceRequests: ResourceRequestRecord[];
  incidents: IncidentItem[];
  householdCases: HouseholdCase[];
  voiceAlerts: VoiceAlertItem[];
  sosAlerts: EmergencySosItem[];
  impactComparison: ImpactComparisonRow[];
  familySafeCheckIns: FamilySafeCheckIn[];
  drillSummaryReports: DrillSummaryReport[];
  auditLogs: AuditLogEntry[];
}

function openOperationalDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

let syncChannel: BroadcastChannel | null = null;
const syncListeners = new Set<(snapshot: Partial<PersistedOperationalSnapshot>) => void>();
const TAB_INSTANCE_ID = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel(CHANNEL_NAME);
    syncChannel.onmessage = (event) => {
      const data = event.data;
      if (
        data &&
        typeof data === 'object' &&
        data.senderTabId !== TAB_INSTANCE_ID &&
        data.payload
      ) {
        for (const listener of syncListeners) {
          listener(data.payload as Partial<PersistedOperationalSnapshot>);
        }
      }
    };
  } catch {
    syncChannel = null;
  }
}

export function subscribeOperationalSync(
  listener: (snapshot: Partial<PersistedOperationalSnapshot>) => void
): () => void {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
}

export async function loadOperationalSnapshot(): Promise<Partial<PersistedOperationalSnapshot> | null> {
  const db = await openOperationalDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(SNAPSHOT_KEY);
      getReq.onsuccess = () => {
        resolve((getReq.result as Partial<PersistedOperationalSnapshot>) || null);
      };
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveOperationalSnapshot(
  partial: Partial<PersistedOperationalSnapshot>,
  broadcastToOtherTabs = true
): Promise<void> {
  if (broadcastToOtherTabs && syncChannel) {
    try {
      syncChannel.postMessage({
        senderTabId: TAB_INSTANCE_ID,
        timestamp: Date.now(),
        payload: partial,
      });
    } catch {
      // ignore BroadcastChannel serialization errors
    }
  }

  const db = await openOperationalDb();
  if (!db) return;

  try {
    const existing = (await loadOperationalSnapshot()) || {};
    const merged: Partial<PersistedOperationalSnapshot> = {
      ...existing,
      ...partial,
      updatedAtMs: Date.now(),
    };
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(merged, SNAPSHOT_KEY);
  } catch {
    // ignore IndexedDB quota errors
  }
}

export async function clearOperationalSnapshot(): Promise<void> {
  const db = await openOperationalDb();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(SNAPSHOT_KEY);
  } catch {
    // ignore
  }
}
