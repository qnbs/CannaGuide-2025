import { STORAGE_PREFIX } from '@/constants';

/**
 * A centralized service for interacting with localStorage.
 * Handles serialization, deserialization, and error catching.
 */
export const storageService = {
    /**
     * Retrieves an item from localStorage.
     * @param key The key to retrieve (without prefix).
     * @param defaultValue The default value to return if the key doesn't exist or an error occurs.
     * @returns The parsed value or the default value.
     */
    getItem<T>(key: string, defaultValue: T): T {
        try {
            const item = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return defaultValue;
        }
    },

    /**
     * Stores an item in localStorage.
     * @param key The key to store under (without prefix).
     * @param value The value to store.
     */
    setItem<T>(key: string, value: T): void {
        try {
            const serializedValue = JSON.stringify(value);
            window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, serializedValue);
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    },

    /**
     * Removes an item from localStorage.
     * @param key The key to remove (without prefix).
     */
    removeItem(key: string): void {
        try {
            window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        } catch (error) {
            console.error(`Error removing from localStorage key “${key}”:`, error);
        }
    },
    
    /**
     * Clears all application data from localStorage.
     * A more robust implementation might iterate over keys with the prefix,
     * but for this app's purpose, clear() is sufficient.
     */
    clearAll(): void {
         try {
            window.localStorage.clear();
         } catch (error) {
             console.error('Error clearing localStorage:', error);
         }
    }
};