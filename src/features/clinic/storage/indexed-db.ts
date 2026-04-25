import { createInitialClinicState } from "@/features/clinic/services/queue-engine";
import type { ClinicState } from "@/features/clinic/types";

const DB_NAME = "dr-panwar-clinic";
const DB_VERSION = 1;
const STORE_NAME = "app-state";
const RECORD_KEY = "clinic-state";
const FALLBACK_KEY = "dr-panwar-clinic-fallback";

function browserReady() {
  return typeof window !== "undefined";
}

function hasIndexedDb() {
  return browserReady() && "indexedDB" in window;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => Promise<T>,
) {
  const database = await openDatabase();

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);

    action(store).then(resolve).catch(reject);

    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      database.close();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
      database.close();
    };
  });
}

function readFallbackState(): ClinicState | null {
  if (!browserReady()) {
    return null;
  }

  const raw = window.localStorage.getItem(FALLBACK_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ClinicState;
  } catch {
    return null;
  }
}

function writeFallbackState(state: ClinicState) {
  if (!browserReady()) {
    return;
  }

  window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(state));
}

export async function readClinicState() {
  if (!hasIndexedDb()) {
    return readFallbackState() ?? createInitialClinicState();
  }

  try {
    const result = await withStore("readonly", (store) => {
      return new Promise<ClinicState | undefined>((resolve, reject) => {
        const request = store.get(RECORD_KEY);
        request.onsuccess = () => resolve(request.result as ClinicState | undefined);
        request.onerror = () =>
          reject(request.error ?? new Error("IndexedDB read failed"));
      });
    });

    return result ?? createInitialClinicState();
  } catch {
    return readFallbackState() ?? createInitialClinicState();
  }
}

export async function writeClinicState(state: ClinicState) {
  if (!hasIndexedDb()) {
    writeFallbackState(state);
    return;
  }

  await withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(state, RECORD_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB write failed"));
    });
  });
}
