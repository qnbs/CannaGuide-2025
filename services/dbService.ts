
import { StoredImageData, Strain } from '@/types';

const DB_NAME = 'CannaGuideDB';
const DB_VERSION = 3; // Upgraded version for new indices
const STRAINS_STORE = 'strains';
const IMAGES_STORE = 'images';
const METADATA_STORE = 'metadata';
const STRAIN_SEARCH_INDEX_STORE = 'strain_search_index';

let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            const transaction = (event.target as IDBOpenDBRequest).transaction;

            if (event.oldVersion < 1) {
                if (!dbInstance.objectStoreNames.contains(STRAINS_STORE)) {
                    dbInstance.createObjectStore(STRAINS_STORE, { keyPath: 'id' });
                }
                if (!dbInstance.objectStoreNames.contains(IMAGES_STORE)) {
                    dbInstance.createObjectStore(IMAGES_STORE, { keyPath: 'id' });
                }
                if (!dbInstance.objectStoreNames.contains(METADATA_STORE)) {
                    dbInstance.createObjectStore(METADATA_STORE, { keyPath: 'key' });
                }
            }
            
            if (event.oldVersion < 2) {
                if (!dbInstance.objectStoreNames.contains(STRAIN_SEARCH_INDEX_STORE)) {
                    dbInstance.createObjectStore(STRAIN_SEARCH_INDEX_STORE, { keyPath: 'word' });
                }
            }

            if (event.oldVersion < 3) {
                 if (transaction) {
                    const strainStore = transaction.objectStore(STRAINS_STORE);
                    if (!strainStore.indexNames.contains('by_type')) {
                        strainStore.createIndex('by_type', 'type', { unique: false });
                    }
                    if (!strainStore.indexNames.contains('by_thc')) {
                        strainStore.createIndex('by_thc', 'thc', { unique: false });
                    }
                    if (!strainStore.indexNames.contains('by_cbd')) {
                        strainStore.createIndex('by_cbd', 'cbd', { unique: false });
                    }
                    if (!strainStore.indexNames.contains('by_floweringTime')) {
                        strainStore.createIndex('by_floweringTime', 'floweringTime', { unique: false });
                    }
                }
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

    async getAllImages(): Promise<StoredImageData[]> {
        await openDB();
        return new Promise((resolve, reject) => {
            const store = getStore(IMAGES_STORE, 'readonly');
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    },

    async updateSearchIndex(index: Record<string, string[]>): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAIN_SEARCH_INDEX_STORE, 'readwrite');
            const store = transaction.objectStore(STRAIN_SEARCH_INDEX_STORE);
            store.clear();
            Object.entries(index).forEach(([word, ids]) => {
                store.put({ word, ids });
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    async searchIndex(tokens: string[]): Promise<Set<string> | null> {
        if (tokens.length === 0) return null;
        await openDB();

        const transaction = db.transaction(STRAIN_SEARCH_INDEX_STORE, 'readonly');
        const store = transaction.objectStore(STRAIN_SEARCH_INDEX_STORE);
        
        const promises = tokens.map(token => {
            return new Promise<string[] | undefined>((resolve, reject) => {
                const request = store.get(token);
                request.onsuccess = () => resolve(request.result?.ids);
                request.onerror = () => reject(request.error);
            });
        });
        
        try {
            const results = await Promise.all(promises);

            if (results.some(r => r === undefined)) {
                return new Set(); // One token not found, so no intersection possible
            }

            const idSets = results.map(ids => new Set(ids!));
            if (idSets.length === 0) return new Set();

            // Find the intersection of all sets
            const intersection = idSets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));
            return intersection;
        } catch(error) {
            console.error("Search Index error:", error);
            return new Set(); // Return empty set on error
        }
    }
};
