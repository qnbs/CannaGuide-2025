import { Strain, StoredImageData, PlantID, SearchIndex, StrainID } from '@/types';

const DB_NAME = 'CannaGuide2025DB';
const DB_VERSION = 4; // Incremented version for search index
const IMAGE_STORE_NAME = 'plant_images';
const STRAINS_STORE_NAME = 'strains';
const METADATA_STORE_NAME = 'metadata';
const SEARCH_INDEX_STORE_NAME = 'search_index';

let db: IDBDatabase;

/**
 * Initializes the IndexedDB database connection. This is the single entry point for all DB interactions.
 * It handles the creation and versioning of the database schema.
 * @returns A promise that resolves with the database instance.
 */
const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject("IndexedDB error: " + request.error?.message);
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            console.log(`[DB Service] Upgrading database from v${event.oldVersion} to v${DB_VERSION}`);

            if (event.oldVersion < 3) {
                if (!dbInstance.objectStoreNames.contains(METADATA_STORE_NAME)) dbInstance.createObjectStore(METADATA_STORE_NAME, { keyPath: 'key' });
                if (!dbInstance.objectStoreNames.contains(STRAINS_STORE_NAME)) dbInstance.createObjectStore(STRAINS_STORE_NAME, { keyPath: 'id' });
                if (transaction) {
                    const strainStore = transaction.objectStore(STRAINS_STORE_NAME);
                    strainStore.createIndex('by_name', 'name', { unique: false });
                    strainStore.createIndex('by_type', 'type', { unique: false });
                }
                const imageStore = dbInstance.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
                imageStore.createIndex('by_plantId', 'plantId', { unique: false });
                imageStore.createIndex('by_timestamp', 'timestamp', { unique: false });
            }
            if (event.oldVersion < 4) {
                 if (!dbInstance.objectStoreNames.contains(SEARCH_INDEX_STORE_NAME)) {
                    dbInstance.createObjectStore(SEARCH_INDEX_STORE_NAME, { keyPath: 'id' });
                }
            }
        };
    });
};

const performTransaction = <T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    return initDB().then(db => new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = action(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => {
            console.error(`Request error on store '${storeName}':`, request.error);
            reject(request.error);
        };
    }));
};

const _buildSearchIndex = (strains: Strain[]): SearchIndex => {
    const index: Record<string, Set<StrainID>> = {};
    strains.forEach(strain => {
        const searchableText = [
            strain.name, strain.type, strain.genetics, ...(strain.aromas || []), ...(strain.dominantTerpenes || [])
        ].join(' ').toLowerCase();

        const tokens = new Set(searchableText.split(/[^a-z0-9]+/));
        tokens.forEach(token => {
            if (token.length > 1) { // Ignore single-letter tokens
                if (!index[token]) index[token] = new Set();
                index[token].add(strain.id);
            }
        });
    });
    
    // Convert sets to arrays for storage
    const storableIndex: SearchIndex = {};
    for (const token in index) {
        storableIndex[token] = Array.from(index[token]);
    }
    return storableIndex;
};

const addImage = (imageData: StoredImageData): Promise<IDBValidKey> => {
    return performTransaction(IMAGE_STORE_NAME, 'readwrite', store => store.put(imageData));
};

const getImage = (id: string): Promise<StoredImageData | null> => {
    return performTransaction(IMAGE_STORE_NAME, 'readonly', store => store.get(id));
};

const getImagesForPlant = (plantId: PlantID): Promise<StoredImageData[]> => {
    return initDB().then(db => new Promise<StoredImageData[]>((resolve, reject) => {
        const transaction = db.transaction(IMAGE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const index = store.index('by_plantId');
        const request = index.getAll(plantId);

        request.onsuccess = () => resolve(request.result.sort((a, b) => b.timestamp - a.timestamp));
        request.onerror = () => reject(request.error);
    }));
};

const addStrains = async (strains: Strain[]): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction([STRAINS_STORE_NAME, SEARCH_INDEX_STORE_NAME], 'readwrite');
    const strainsStore = transaction.objectStore(STRAINS_STORE_NAME);
    const searchIndexStore = transaction.objectStore(SEARCH_INDEX_STORE_NAME);

    await new Promise<void>((resolve, reject) => {
        const clearReq = strainsStore.clear();
        clearReq.onsuccess = () => resolve();
        clearReq.onerror = () => reject(clearReq.error);
    });

    strains.forEach(strain => strainsStore.put(strain));
    
    const searchIndex = _buildSearchIndex(strains);
    searchIndexStore.put({ id: 'strain_fulltext_index', index: searchIndex });
    
    return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

const getAllStrainsFromDB = (): Promise<Strain[]> => {
    return performTransaction(STRAINS_STORE_NAME, 'readonly', store => store.getAll());
};

const getStrainsCount = (): Promise<number> => {
    return performTransaction(STRAINS_STORE_NAME, 'readonly', store => store.count());
};

const searchStrains = async (query: string): Promise<Strain[]> => {
    const db = await initDB();
    const transaction = db.transaction([SEARCH_INDEX_STORE_NAME, STRAINS_STORE_NAME], 'readonly');
    const searchIndexStore = transaction.objectStore(SEARCH_INDEX_STORE_NAME);
    const strainsStore = transaction.objectStore(STRAINS_STORE_NAME);

    return new Promise((resolve, reject) => {
        const indexReq = searchIndexStore.get('strain_fulltext_index');
        indexReq.onsuccess = () => {
            const indexData = indexReq.result?.index as SearchIndex | undefined;
            if (!indexData) return resolve([]);
            
            const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 1);
            if (tokens.length === 0) return resolve([]);

            const resultSet = new Set<StrainID>(indexData[tokens[0]] || []);
            for (let i = 1; i < tokens.length; i++) {
                const ids = new Set(indexData[tokens[i]] || []);
                resultSet.forEach(id => {
                    if (!ids.has(id)) resultSet.delete(id);
                });
            }

            const strainIds = Array.from(resultSet);
            if (strainIds.length === 0) return resolve([]);

            const results: Strain[] = [];
            let processed = 0;
            strainIds.forEach(id => {
                const strainReq = strainsStore.get(id);
                strainReq.onsuccess = () => {
                    if (strainReq.result) results.push(strainReq.result);
                    processed++;
                    if (processed === strainIds.length) resolve(results);
                };
            });
        };
        indexReq.onerror = () => reject(indexReq.error);
    });
};

const getMetadata = (key: string): Promise<any> => {
    return performTransaction(METADATA_STORE_NAME, 'readonly', store => store.get(key));
};

const setMetadata = (data: { key: string, [prop: string]: any }): Promise<IDBValidKey> => {
    return performTransaction(METADATA_STORE_NAME, 'readwrite', store => store.put(data));
};

const clearAllData = async (): Promise<void> => {
    const db = await initDB();
    const storesToClear = [IMAGE_STORE_NAME, STRAINS_STORE_NAME, METADATA_STORE_NAME, SEARCH_INDEX_STORE_NAME];
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storesToClear, 'readwrite');
        storesToClear.forEach(storeName => transaction.objectStore(storeName).clear());

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
    addImage,
    getImage,
    getImagesForPlant,
    addStrains,
    getAllStrains: getAllStrainsFromDB,
    getStrainsCount,
    searchStrains,
    getMetadata,
    setMetadata,
    clearAllData,
};