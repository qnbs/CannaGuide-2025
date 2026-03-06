
export interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

const DB_NAME = 'CannaGuideStateDB';
const DB_VERSION = 1;
const STORE_NAME = 'zustand_state';

let db: IDBDatabase | null = null;
// Promise lock – prevents concurrent openDB() calls from opening duplicate connections
let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (db) return Promise.resolve(db);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      // Handle connection loss (storage pressure, version upgrade from another tab)
      db.onclose = () => { db = null; dbPromise = null; };
      db.onversionchange = () => { db?.close(); db = null; dbPromise = null; };
      resolve(db);
    };

    request.onerror = (event) => {
      dbPromise = null;
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
};

const getStore = async (mode: IDBTransactionMode): Promise<IDBObjectStore> => {
  const conn = await openDB();
  const transaction = conn.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
};

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await getStore('readonly');
        const request = store.get(name);
        request.onsuccess = () => {
          resolve((request.result as string) || null);
        };
        request.onerror = () => {
          reject(request.error);
        };
      } catch (e) { reject(e); }
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await getStore('readwrite');
        const request = store.put(value, name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) { reject(e); }
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const store = await getStore('readwrite');
        const request = store.delete(name);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      } catch (e) { reject(e); }
    });
  },
};
