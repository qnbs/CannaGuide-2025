/**
 * Worker-side cooperative preemption abort tracking (W-02.1).
 *
 * Workers import this module to check whether the current job has been
 * cancelled via a __CANCEL__ message from the WorkerBus. The abort state
 * is tracked per-messageId so concurrent jobs in the same worker are
 * independently cancellable.
 *
 * Usage in worker code:
 *   import { initAbortHandler, checkAborted } from '@/utils/workerAbort'
 *
 *   // At top of worker file:
 *   initAbortHandler()
 *
 *   // Inside long-running loops:
 *   for (let i = 0; i < items.length; i++) {
 *       checkAborted(messageId)
 *       // ... heavy work ...
 *   }
 */

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** Set of messageIds that have been marked for cancellation. */
const abortedIds = new Set<string>()

// ---------------------------------------------------------------------------
// Public API (worker-side)
// ---------------------------------------------------------------------------

/**
 * Install the __CANCEL__ message handler on the worker's global scope.
 * Must be called once at the top of each worker file that supports
 * cooperative preemption.
 *
 * When the WorkerBus preempts a job, it sends:
 *   `{ type: '__CANCEL__', messageId: string }`
 * This handler marks that messageId as aborted.
 */
export function initAbortHandler(): void {
    const originalHandler = self.onmessage

    self.onmessage = (event: MessageEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const data = event.data as { type?: string; messageId?: string } | undefined
        if (data?.type === '__CANCEL__' && typeof data.messageId === 'string') {
            abortedIds.add(data.messageId)
            return // Do not forward to the main handler
        }
        // Forward all other messages to the original handler
        if (originalHandler) {
            originalHandler.call(self, event)
        }
    }
}

/**
 * Check whether the given messageId has been cancelled.
 * Call this inside long-running loops or between processing phases.
 *
 * @throws Error with message 'CANCELLED' if the job was preempted.
 */
export function checkAborted(messageId: string): void {
    if (abortedIds.has(messageId)) {
        abortedIds.delete(messageId)
        throw new Error('CANCELLED')
    }
}

/**
 * Clear a messageId from the abort set.
 * Called automatically by checkAborted on throw, or manually on job completion.
 */
export function clearAborted(messageId: string): void {
    abortedIds.delete(messageId)
}

/**
 * Check whether a messageId is marked as aborted without throwing.
 * Useful for conditional branching instead of exception-based control flow.
 */
export function isAborted(messageId: string): boolean {
    return abortedIds.has(messageId)
}

/** W-02.1: Internal cancel message type constant. */
export const CANCEL_MESSAGE_TYPE = '__CANCEL__'
