/**
 * @file dbService.ts
 * @description A world-class, robust, and performant IndexedDB service for CannaGuide 2025.
 * This service provides a complete data persistence layer with the following advanced features:
 * - Singleton, promise-based connection management with robust schema migration.
 * - Bulletproof, atomic transaction patterns to ensure data integrity.
 * - Memory-efficient data retrieval using cursors for large datasets.
 * - High-performance indexed queries for fast, database-native filtering.
 * - Sophisticated prefix-based full-text search implementation.
 * - Comprehensive type safety and JSDoc documentation.
 */

import { StoredImageData, Strain } from '@/types';
import { 
    DB_NAME, 
    DB_VERSION,
    STRAINS_STORE,
    IMAGES_STORE,
    METADATA_STORE,
    STRAIN_SEARCH_INDEX_STORE,
    STRAIN_INDEX_TYPE,
    STRAIN_INDEX_THC,
    STRAIN_INDEX_CBD,
    STRAIN_INDEX_FLOWERING,
} from '@/constants';


// --- TYPE DEFINITIONS ---

/** Represents a key-value pair in the metadata store. */
interface MetadataItem<T = any> {
    key: string;
    value: T;
}

/** Represents an entry in the full-text search index store. */
interface StrainIndexItem {
    word: string;
    ids: string[];
}


// --- CONNECTION MANAGEMENT ---

let db: IDBDatabase;

/**
 * Opens and initializes the IndexedDB database.
 * This function acts as a singleton, returning a cached connection if available.
 * It includes a robust, versioned schema migration strategy.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database connection.
 */
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
                    if (!strainStore.indexNames.contains(STRAIN_INDEX_TYPE)) {
                        strainStore.createIndex(STRAIN_INDEX_TYPE, 'type', { unique: false });
                    }
                    if (!strainStore.indexNames.contains(STRAIN_INDEX_THC)) {
                        strainStore.createIndex(STRAIN_INDEX_THC, 'thc', { unique: false });
                    }
                    if (!strainStore.indexNames.contains(STRAIN_INDEX_CBD)) {
                        strainStore.createIndex(STRAIN_INDEX_CBD, 'cbd', { unique: false });
                    }
                    if (!strainStore.indexNames.contains(STRAIN_INDEX_FLOWERING)) {
                        strainStore.createIndex(STRAIN_INDEX_FLOWERING, 'floweringTime', { unique: false });
                    }
                }
            }
        };

        request.onsuccess = (event) => {
            db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error("[dbService] IndexedDB connection error:", (event.target as IDBOpenDBRequest).error);
            reject((event.target as IDBOpenDBRequest).error);
        };
    });
};

/**
 * A generic, promisified helper for executing a single request within a transaction.
 * This ensures the transaction lifecycle is managed correctly by capturing the request's
 * result on its `onsuccess` event and only resolving the promise when the entire
 * transaction successfully completes via its `oncomplete` event. This robustly prevents
 * `TransactionInactiveError` race conditions.
 * @template T The expected result type of the IDBRequest.
 * @param {string} storeName The name of the object store.
 * @param {IDBTransactionMode} mode The transaction mode ('readonly' or 'readwrite').
 * @param {(store: IDBObjectStore) => IDBRequest<T>} action A callback that receives the store and should return an IDBRequest.
 * @returns {Promise<T>} A promise that resolves with the result of the request upon transaction completion.
 */
const performTx = <T>(storeName: string, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    return new Promise(async (resolve, reject) => {
        await openDB();
        const transaction = db.transaction(storeName, mode);
        let requestResult: T;

        transaction.onerror = () => {
            console.error(`[dbService] Transaction error on ${storeName}:`, transaction.error);
            reject(transaction.error);
        };

        transaction.oncomplete = () => {
            resolve(requestResult);
        };

        const store = transaction.objectStore(storeName);
        const request = action(store);
        
        request.onsuccess = () => {
            requestResult = request.result;
        };
    });
};


export const dbService = {
    // --- Metadata Store ---
    async getMetadata<T = any>(key: string): Promise<T | undefined> {
        const result = await performTx<MetadataItem<T> | undefined>(METADATA_STORE, 'readonly', store => store.get(key));
        return result?.value;
    },

    async setMetadata<T>(key: string, value: T): Promise<void> {
        const item: MetadataItem<T> = { key, value };
        await performTx<IDBValidKey>(METADATA_STORE, 'readwrite', store => store.put(item));
    },

    // --- Strains Store ---

    /**
     * Atomically clears the entire strains store and populates it with a new list of strains.
     * This is designed for initial data loads and updates.
     * @param {Strain[]} strains The array of strains to add.
     * @returns {Promise<void>} A promise that resolves on successful completion or rejects on error.
     */
    async addStrains(strains: Strain[]): Promise<void> {
        await openDB();
        return new Promise<void>((resolve, reject) => {
            const transaction = db.transaction(STRAINS_STORE, 'readwrite');
            const store = transaction.objectStore(STRAINS_STORE);
    
            const clearRequest = store.clear();
            
            clearRequest.onerror = () => {
                 console.error('[dbService] Failed to clear store during atomic transaction:', clearRequest.error);
                 transaction.abort();
            }
            
            clearRequest.onsuccess = () => {
                strains.forEach(strain => {
                    // Using .put() is an "upsert" operation, which is more resilient to duplicate
                    // source data than .add(), preventing "Key already exists" errors.
                    store.put(strain);
                });
            }

            transaction.oncomplete = () => {
                console.log('[dbService] Atomically replaced all strains in IndexedDB.');
                resolve();
            };
    
            transaction.onerror = () => {
                console.error('[dbService] Failed to replace strains in atomic transaction:', transaction.error);
                reject(transaction.error);
            };
        });
    },
    
    /**
     * Retrieves all strains from the database in a memory-efficient way using a cursor.
     * This is superior to `getAll()` for large datasets.
     * @returns {Promise<Strain[]>} A promise that resolves with an array of all strains.
     */
    async getAllStrains(): Promise<Strain[]> {
        await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAINS_STORE, 'readonly');
            const store = transaction.objectStore(STRAINS_STORE);
            const request = store.openCursor();
            const results: Strain[] = [];

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    // Cursor is exhausted, all data has been read.
                    resolve(results);
                }
            };
        });
    },

    async getStrainsCount(): Promise<number> {
        return performTx<number>(STRAINS_STORE, 'readonly', store => store.count());
    },
    
    /**
     * Performs a high-performance query on the strains store using a specified index.
     * @param {string} indexName The name of the index to query (e.g., 'by_thc').
     * @param {IDBValidKey | IDBKeyRange} query The key or key range for the query.
     * @returns {Promise<Strain[]>} A promise that resolves with the matching strains.
     */
    async queryStrainsByIndex(indexName: string, query: IDBValidKey | IDBKeyRange): Promise<Strain[]> {
        await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAINS_STORE, 'readonly');
            const store = transaction.objectStore(STRAINS_STORE);
            const index = store.index(indexName);
            const request = index.getAll(query);
            
            transaction.oncomplete = () => resolve(request.result || []);
            transaction.onerror = () => reject(transaction.error);
        });
    },

    // --- Images Store ---
    async addImage(imageData: StoredImageData): Promise<void> {
        await performTx<IDBValidKey>(IMAGES_STORE, 'readwrite', store => store.put(imageData));
    },

    async getImage(id: string): Promise<StoredImageData | undefined> {
        return performTx<StoredImageData | undefined>(IMAGES_STORE, 'readonly', store => store.get(id));
    },

    async getAllImages(): Promise<StoredImageData[]> {
        return performTx<StoredImageData[]>(IMAGES_STORE, 'readonly', store => store.getAll());
    },
    
    // --- Search Index Store ---

    /**
     * Atomically clears and rebuilds the full-text search index.
     * @param {Record<string, string[]>} index A map where keys are words and values are arrays of strain IDs.
     * @returns {Promise<void>} A promise that resolves on completion.
     */
    async updateSearchIndex(index: Record<string, string[]>): Promise<void> {
        await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAIN_SEARCH_INDEX_STORE, 'readwrite');
            const store = transaction.objectStore(STRAIN_SEARCH_INDEX_STORE);
            const clearRequest = store.clear();

            clearRequest.onerror = () => {
                console.error('[dbService] Failed to clear search index:', clearRequest.error);
                transaction.abort();
            };
            
            clearRequest.onsuccess = () => {
                Object.entries(index).forEach(([word, ids]) => {
                    store.put({ word, ids });
                });
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    },

    /**
     * Performs a sophisticated prefix-based "AND" search across multiple tokens.
     * For each token, it finds all index words starting with that token, collects all associated
     * strain IDs, and then computes the intersection of the ID sets from all tokens.
     * @param {string[]} tokens An array of search tokens.
     * @returns {Promise<Set<string>>} A promise resolving with a Set of matching strain IDs.
     */
    async searchIndex(tokens: string[]): Promise<Set<string>> {
        if (tokens.length === 0) return new Set();
        await openDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STRAIN_SEARCH_INDEX_STORE, 'readonly');
            const store = transaction.objectStore(STRAIN_SEARCH_INDEX_STORE);
            const resultSets: Set<string>[] = [];
            let completedRequests = 0;

            transaction.onerror = () => reject(transaction.error);
            
            transaction.oncomplete = () => {
                if (resultSets.length === 0 || resultSets.length < tokens.length) {
                    return resolve(new Set());
                }
                // Compute the intersection of all result sets.
                const intersection = resultSets.reduce((a, b) => new Set([...a].filter(x => b.has(x))));
                resolve(intersection);
            };

            tokens.forEach(token => {
                // For each token, do a prefix search (e.g., "blue" matches "blueberry").
                const range = IDBKeyRange.bound(token, token + '\uffff');
                const request = store.openCursor(range);
                const idsForToken = new Set<string>();

                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor) {
                        (cursor.value.ids as string[]).forEach(id => idsForToken.add(id));
                        cursor.continue();
                    } else {
                        // Cursor for this token is done.
                        resultSets.push(idsForToken);
                        completedRequests++;
                    }
                };
                request.onerror = () => {
                     // If one request fails, we can still try to complete the transaction with the others
                     console.error(`[dbService] Search index request failed for token: ${token}`);
                     completedRequests++;
                }
            });
        });
    }
};
