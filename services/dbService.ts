import { StoredImageData, Strain } from '@/types';

const DB_NAME = 'CannaGuideDB';
const DB_VERSION = 1;
const STRAINS_STORE = 'strains';
const IMAGES_STORE = 'images';
const METADATA_STORE = 'metadata';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(STRAINS_STORE)) {
                dbInstance.createObjectStore(STRAINS_STORE, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(IMAGES_STORE)) {
                dbInstance.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(METADATA_STORE)) {
                dbInstance.createObjectStore(METADATA_STORE, { keyPath: 'key' });
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

const getStore = (storeName: string, mode: IDBTransactionMode): IDBObjectStore => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
};

export const dbService = {
    async getMetadata(key: string): Promise<any> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(METADATA_STORE, 'readonly');
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async setMetadata(metadata: any): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(METADATA_STORE, 'readwrite');
            const request = store.put(metadata);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async addStrains(strains: Strain[]): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAINS_STORE, 'readwrite');
            const store = transaction.objectStore(STRAINS_STORE);
            store.clear();
            strains.forEach(strain => store.add(strain));
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    async getAllStrains(): Promise<Strain[]> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(STRAINS_STORE, 'readonly');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getStrainsCount(): Promise<number> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(STRAINS_STORE, 'readonly');
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async addImage(imageData: StoredImageData): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(IMAGES_STORE, 'readwrite');
            const request = store.put(imageData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },

    async getImage(id: string): Promise<StoredImageData | null> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(IMAGES_STORE, 'readonly');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },
};
