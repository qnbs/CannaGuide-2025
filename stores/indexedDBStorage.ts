
export interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

const DB_NAME = 'CannaGuideStateDB';
const DB_VERSION = 1;
const STORE_NAME = 'zustand_state';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error("IndexedDB error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

const getStore = (mode: IDBTransactionMode): IDBObjectStore => {
  const transaction = db.transaction(STORE_NAME, mode);
  return transaction.objectStore(STORE_NAME);
};

export const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    await openDB();
    return new Promise((resolve, reject) => {
      const store = getStore('readonly');
      const request = store.get(name);
      request.onsuccess = () => {
        resolve((request.result as string) || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await openDB();
    return new Promise((resolve, reject) => {
      const store = getStore('readwrite');
      const request = store.put(value, name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  removeItem: async (name: string): Promise<void> => {
    await openDB();
    return new Promise((resolve, reject) => {
      const store = getStore('readwrite');
      const request = store.delete(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
