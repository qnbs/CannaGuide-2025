type ResumePersistence = () => void

let persistenceSuspended = false
let activeWrite: Promise<void> = Promise.resolve()

/** Serialize writes and skip any write that has not started when recovery begins. */
export const schedulePersistenceWrite = async (write: () => Promise<void>): Promise<boolean> => {
    if (persistenceSuspended) return false

    let completed = false
    const scheduledWrite = activeWrite.then(async () => {
        if (persistenceSuspended) return
        await write()
        completed = true
    })
    activeWrite = scheduledWrite.catch(() => {})
    await scheduledWrite
    return completed
}

/**
 * Stop new persistence writes and wait for the current one to finish. The caller
 * must resume after a failed recovery; successful recovery stays suspended until reload.
 */
export const suspendPersistenceForRecovery = async (): Promise<ResumePersistence | null> => {
    if (persistenceSuspended) return null

    persistenceSuspended = true
    await activeWrite

    let resumed = false
    return () => {
        if (resumed) return
        resumed = true
        persistenceSuspended = false
    }
}
