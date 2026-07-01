import { METADATA_STORE } from '@/constants'
import { performTx } from './connection'
import type { MetadataItem } from './types'

export const metadataStore = {
    async getMetadata<T = unknown>(key: string): Promise<T | undefined> {
        const result = await performTx<MetadataItem<T> | undefined>(
            METADATA_STORE,
            'readonly',
            (store) => store.get(key),
        )
        return result?.value
    },

    async setMetadata<T>(key: string, value: T): Promise<void> {
        const item: MetadataItem<T> = { key, value }
        await performTx<IDBValidKey>(METADATA_STORE, 'readwrite', (store) => store.put(item))
    },
}
