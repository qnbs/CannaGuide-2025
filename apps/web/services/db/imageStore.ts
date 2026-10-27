import type { StoredImageData } from '@/types'
import { IMAGES_STORE } from '@/constants'
import { schedulePersistenceWrite } from '@/bootstrap/persistenceCoordinator'
import { resizeImage } from '@/services/imageService'
import { openDB, performTx, toIndexedDbError } from './connection'
import { collectReferencedImageIds } from './imageReferences'
import { getStorageEstimateSnapshot, isQuotaExceededError } from './storageHelpers'
import { IMAGE_PRUNE_BATCH_SIZE, IMAGE_PRUNE_GRACE_MS, STORAGE_USAGE_WARNING_RATIO } from './types'

const pruneUnreferencedImages = async (maxToDelete: number): Promise<number> => {
    // Throws if any reference source is unreadable: then nothing is deleted.
    const referenced = await collectReferencedImageIds()
    const conn = await openDB()

    const allImages = await new Promise<StoredImageData[]>((resolve, reject) => {
        const tx = conn.transaction(IMAGES_STORE, 'readonly')
        const req = tx.objectStore(IMAGES_STORE).getAll()
        req.onsuccess = () => resolve(req.result)
        tx.onerror = () =>
            reject(toIndexedDbError(tx.error, '[dbService] Failed to load images for pruning.'))
    })

    const graceCutoff = Date.now() - IMAGE_PRUNE_GRACE_MS
    const imagesToDelete = allImages
        .filter(
            (image) =>
                !referenced.has(image.id) &&
                Number.isFinite(image.createdAt) &&
                image.createdAt <= graceCutoff,
        )
        .toSorted((a, b) => a.createdAt - b.createdAt)
        .slice(0, Math.max(0, maxToDelete))
    if (imagesToDelete.length === 0) {
        return 0
    }

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
}

export const imageStore = {
    /**
     * Delete up to `maxToDelete` of the oldest images that no journal entry
     * references (live state, persisted snapshots or archive) and that are older
     * than IMAGE_PRUNE_GRACE_MS. A referenced photo is never deleted.
     *
     * Runs under the persistence lock: a backup restore holds it exclusively from
     * its image commit until the restored snapshot is live, so restored images are
     * never seen as unreferenced. Returns 0 when fenced by a recovery.
     */
    async pruneOldImages(maxToDelete = IMAGE_PRUNE_BATCH_SIZE): Promise<number> {
        let deleted = 0
        const ran = await schedulePersistenceWrite(async () => {
            deleted = await pruneUnreferencedImages(maxToDelete)
        })
        return ran ? deleted : 0
    },

    /** Reclaiming space is best effort; it must never block saving a new photo. */
    async tryPruneOldImages(maxToDelete: number): Promise<void> {
        try {
            await this.pruneOldImages(maxToDelete)
        } catch (error) {
            console.debug('[dbService] Could not prune unreferenced images.', error)
        }
    },

    async addImage(imageData: StoredImageData): Promise<void> {
        const estimateBeforeWrite = await getStorageEstimateSnapshot()
        if (estimateBeforeWrite.usageRatio >= STORAGE_USAGE_WARNING_RATIO) {
            await this.tryPruneOldImages(IMAGE_PRUNE_BATCH_SIZE)
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
                '[dbService] Quota exceeded while storing image. Pruning unreferenced images and retrying once.',
            )
            await this.tryPruneOldImages(IMAGE_PRUNE_BATCH_SIZE * 2)
            // If nothing unreferenced could be reclaimed this rethrows the quota
            // error, and the caller reports the failed save: no photo is evicted.
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
