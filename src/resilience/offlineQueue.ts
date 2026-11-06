import { openDB, IDBPDatabase } from 'idb';

export type OfflineMutationType =
  | 'VOICE_ALERT'
  | 'SOS_ALERT'
  | 'SOS_DISPATCH'
  | 'PUBLIC_HAZARD_REPORT'
  | 'FIELD_VERIFICATION'
  | 'DAMAGE_ASSESSMENT'
  | 'INCIDENT_UPDATE';

export type OfflineItemStatus = 'Queued' | 'Sending' | 'Sent' | 'Failed';

export interface OfflineQueueRecord {
  id: string;
  idempotencyKey: string;
  type: OfflineMutationType;
  summary: string;
  payload: Record<string, unknown>;
  status: OfflineItemStatus;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  lastError?: string;
}

const DB_NAME = 'nivaran_offline_db';
const STORE_NAME = 'mutation_queue';
const DEFAULT_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours (Section 8.7)

let dbPromise: Promise<IDBPDatabase> | null = null;
let storageDegradedToMemory = false;
const memoryFallbackQueue = new Map<string, OfflineQueueRecord>();

async function getDb(): Promise<IDBPDatabase | null> {
  if (storageDegradedToMemory || typeof window === 'undefined' || !('indexedDB' in window)) {
    storageDegradedToMemory = true;
    return null;
  }
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    }).catch(() => {
      storageDegradedToMemory = true;
      return null as unknown as IDBPDatabase;
    });
  }
  return dbPromise;
}

export function isOfflineStorageInMemoryFallback(): boolean {
  return storageDegradedToMemory;
}

/**
 * Strips any accidental token/password fields before persisting to IndexedDB (Section 8.7).
 */
function scrubTokensFromPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (/token|password|secret|authorization|cookie/i.test(k)) {
      continue;
    }
    clean[k] = v;
  }
  return clean;
}

/**
 * Enqueues a mutation into IndexedDB (with automatic in-memory fallback if storage is blocked)
 * and sets a 72-hour expiration window.
 */
export async function enqueueOfflineMutation(input: {
  idempotencyKey: string;
  type: OfflineMutationType;
  summary: string;
  payload: Record<string, unknown>;
}): Promise<OfflineQueueRecord> {
  const now = Date.now();
  const record: OfflineQueueRecord = {
    id: `OQ-${now}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    idempotencyKey: input.idempotencyKey,
    type: input.type,
    summary: input.summary.slice(0, 160),
    payload: scrubTokensFromPayload(input.payload),
    status: 'Queued',
    attempts: 0,
    createdAt: now,
    expiresAt: now + DEFAULT_TTL_MS,
  };

  const db = await getDb();
  if (!db) {
    memoryFallbackQueue.set(record.id, record);
    return record;
  }

  try {
    // Check if an identical idempotencyKey already exists to prevent duplicates
    const all = (await db.getAll(STORE_NAME)) as OfflineQueueRecord[];
    const existing = all.find((item) => item.idempotencyKey === input.idempotencyKey);
    if (existing) {
      return existing;
    }
    await db.put(STORE_NAME, record);
    return record;
  } catch {
    storageDegradedToMemory = true;
    memoryFallbackQueue.set(record.id, record);
    return record;
  }
}

/**
 * Lists all non-expired items in the offline queue, automatically purging items older than 72 hours.
 */
export async function listOfflineQueue(): Promise<OfflineQueueRecord[]> {
  const now = Date.now();
  const db = await getDb();

  if (!db) {
    const items: OfflineQueueRecord[] = [];
    for (const [id, rec] of memoryFallbackQueue.entries()) {
      if (rec.expiresAt <= now) {
        memoryFallbackQueue.delete(id);
      } else {
        items.push(rec);
      }
    }
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  try {
    const all = (await db.getAll(STORE_NAME)) as OfflineQueueRecord[];
    const valid: OfflineQueueRecord[] = [];
    for (const item of all) {
      if (item.expiresAt <= now) {
        await db.delete(STORE_NAME, item.id);
      } else {
        valid.push(item);
      }
    }
    return valid.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return Array.from(memoryFallbackQueue.values());
  }
}

export async function updateOfflineItemStatus(
  id: string,
  status: OfflineItemStatus,
  lastError?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    const existing = memoryFallbackQueue.get(id);
    if (existing) {
      memoryFallbackQueue.set(id, {
        ...existing,
        status,
        attempts: existing.attempts + (status === 'Sending' ? 1 : 0),
        lastError,
      });
    }
    return;
  }

  try {
    const existing = (await db.get(STORE_NAME, id)) as OfflineQueueRecord | undefined;
    if (existing) {
      await db.put(STORE_NAME, {
        ...existing,
        status,
        attempts: existing.attempts + (status === 'Sending' ? 1 : 0),
        lastError,
      });
    }
  } catch {
    // Ignore storage write error
  }
}

/**
 * Clears all queued personal data and mutations on sign-out (Section 8.2 & 8.7).
 */
export async function clearOfflineQueueOnSignOut(): Promise<void> {
  memoryFallbackQueue.clear();
  const db = await getDb();
  if (db) {
    try {
      await db.clear(STORE_NAME);
    } catch {
      // Ignore
    }
  }
}
