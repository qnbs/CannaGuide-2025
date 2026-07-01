import type { StoredImageData } from '@/types'
import { IMAGES_STORE } from '@/constants'
import { resizeImage } from '@/services/imageService'
import { openDB, performTx, toIndexedDbError } from './connection'
import {
    getStorageEstimateSnapshot,
    isQuotaExceededError,
} from './storageHelpers'
import { IMAGE_PRUNE_BATCH_SIZE, STORAGE_USAGE_WARNING_RATIO } from './types'

export const imageStore = {
    async pruneOldImages(maxToDelete = IMAGE_PRUNE_BATCH_SIZE): Promise<number> {
        const conn = await openDB()

        const allImages = await new Promise<StoredImageData[]>((resolve, reject) => {
            const tx = conn.transaction(IMAGES_STORE, 'readonly')
            const req = tx.objectStore(IMAGES_STORE).getAll()
            req.onsuccess = () => resolve(req.result)
            tx.onerror = () =>
                reject(toIndexedDbError(tx.error, '[dbService] Failed to load images for pruning.'))
        })

        if (allImages.length === 0) {
            return 0
        }

        const sortedByAge = allImages.toSorted((a, b) => a.createdAt - b.createdAt)
        const imagesToDelete = sortedByAge.slice(0, Math.min(maxToDelete, sortedByAge.length))

        await new Promise<void>((resolve, reject) => {
            const transaction = conn.transaction(IMAGES_STORE, 'readwrite')
            const store = transaction.objectStore(IMAGES_STORE)

            transaction.oncomplete = () => resolve()
            transaction.onerror = () =>
                reject(
                    toIndexedDbError(
                        transaction.error,
                        '[dbService] Failed to delete old images during prune operation.',
                    ),
                )

            imagesToDelete.forEach((image) => {
                store.delete(image.id)
            })
        })

        return imagesToDelete.length
    },

    async addImage(imageData: StoredImageData): Promise<void> {
        const estimateBeforeWrite = await getStorageEstimateSnapshot()
        if (estimateBeforeWrite.usageRatio >= STORAGE_USAGE_WARNING_RATIO) {
            await this.pruneOldImages(IMAGE_PRUNE_BATCH_SIZE)
        }

        let normalizedImageData = imageData
        try {
            const compressedData = await resizeImage(imageData.data)
            normalizedImageData = {
                ...imageData,
                data: compressedData,
            }
        } catch (compressionError) {
            console.debug(
                '[dbService] Could not compress image before storing. Using original payload.',
                compressionError,
            )
        }

        try {
            await performTx<IDBValidKey>(IMAGES_STORE, 'readwrite', (store) =>
                store.put(normalizedImageData),
            )
        } catch (error) {
            if (!isQuotaExceededError(error)) {
                throw error
            }

            console.debug(
                '[dbService] Quota exceeded while storing image. Pruning old images and retrying once.',
            )
            await this.pruneOldImages(IMAGE_PRUNE_BATCH_SIZE * 2)
            await performTx<IDBValidKey>(IMAGES_STORE, 'readwrite', (store) =>
                store.put(normalizedImageData),
            )
        }
    },

    async getImage(id: string): Promise<StoredImageData | undefined> {
        return performTx<StoredImageData | undefined>(IMAGES_STORE, 'readonly', (store) =>
            store.get(id),
        )
    },

    async getAllImages(): Promise<StoredImageData[]> {
        return performTx<StoredImageData[]>(IMAGES_STORE, 'readonly', (store) => store.getAll())
    },
}
