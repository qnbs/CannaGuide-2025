import { Strain } from '@/types';

const DB_NAME = 'CannaGuide2025DB';
const DB_VERSION = 2; // Incremented version for schema change
const IMAGE_STORE_NAME = 'plant_images';
const STRAINS_STORE_NAME = 'strains';
const METADATA_STORE_NAME = 'metadata';

let db: IDBDatabase;

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", request.error);
            reject("IndexedDB error");
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                dbInstance.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(STRAINS_STORE_NAME)) {
                dbInstance.createObjectStore(STRAINS_STORE_NAME, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(METADATA_STORE_NAME)) {
                dbInstance.createObjectStore(METADATA_STORE_NAME, { keyPath: 'key' });
            }
        };
    });
};

const addImage = async (id: string, data: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.put({ id, data });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const getImage = async (id: string): Promise<string | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE_NAME], 'readonly');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result ? request.result.data : null);
        };
        request.onerror = () => reject(request.error);
    });
};

const addStrains = async (strains: Strain[]): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STRAINS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STRAINS_STORE_NAME);
        // Clear before adding to ensure freshness on re-translation
        store.clear(); 
        strains.forEach(strain => store.put(strain));
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

const getAllStrainsFromDB = async (): Promise<Strain[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STRAINS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(STRAINS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getStrainsCount = async (): Promise<number> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STRAINS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(STRAINS_STORE_NAME);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getMetadata = async (key: string): Promise<any> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([METADATA_STORE_NAME], 'readonly');
        const store = transaction.objectStore(METADATA_STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const setMetadata = async (data: { key: string, [prop: string]: any }): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([METADATA_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(METADATA_STORE_NAME);
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const clearAllData = async (): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE_NAME, STRAINS_STORE_NAME, METADATA_STORE_NAME], 'readwrite');
        transaction.objectStore(IMAGE_STORE_NAME).clear();
        transaction.objectStore(STRAINS_STORE_NAME).clear();
        transaction.objectStore(METADATA_STORE_NAME).clear();

        transaction.oncomplete = () => {
            console.log("All IndexedDB stores cleared successfully.");
            resolve();
        };
        transaction.onerror = () => {
            console.error("Error clearing IndexedDB stores:", transaction.error);
            reject(transaction.error);
        };
    });
};

export const dbService = {
    initDB,
    addImage,
    getImage,
    addStrains,
    getAllStrains: getAllStrainsFromDB,
    getStrainsCount,
    getMetadata,
    setMetadata,
    clearAllData,
};