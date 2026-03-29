/**
 * WorkerBus -- Centralized, promise-based Web Worker communication dispatcher.
 *
 * Provides type-safe, promise-based request/response communication with all
 * Web Workers. Every outgoing message is tagged with a unique messageId so
 * the corresponding response can be resolved or rejected. A configurable
 * per-request timeout prevents hung workers from blocking the caller.
 *
 * Usage:
 *   workerBus.register('genealogy', new Worker(...))
 *   const result = await workerBus.dispatch<LayoutResult>('genealogy', 'LAYOUT', payload)
 */

import type { WorkerRequest, WorkerResponse } from '@/types/workerBus.types'

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface PendingRequest<T = unknown> {
    resolve: (value: T) => void
    reject: (reason: unknown) => void
    timer: ReturnType<typeof setTimeout>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000

// ---------------------------------------------------------------------------
// WorkerBus
// ---------------------------------------------------------------------------

class WorkerBusImpl {
    private readonly workers = new Map<string, Worker>()
    private readonly pending = new Map<string, PendingRequest>()

    /**
     * Register a named worker instance. If a worker with the same name already
     * exists, it is terminated and replaced.
     */
    register(name: string, worker: Worker): void {
        const existing = this.workers.get(name)
        if (existing) {
            existing.terminate()
        }
        this.workers.set(name, worker)

        worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
            this.handleMessage(event.data)
        })

        worker.addEventListener('error', (event: ErrorEvent) => {
            // Reject ALL pending requests for this worker on unrecoverable error
            for (const [id, entry] of this.pending) {
                if (id.startsWith(`${name}:`)) {
                    clearTimeout(entry.timer)
                    entry.reject(new Error(`[WorkerBus] Worker "${name}" error: ${event.message}`))
                    this.pending.delete(id)
                }
            }
        })
    }

    /**
     * Unregister and terminate a worker by name.
     */
    unregister(name: string): void {
        const worker = this.workers.get(name)
        if (worker) {
            worker.terminate()
            this.workers.delete(name)
        }
        // Reject any pending requests
        for (const [id, entry] of this.pending) {
            if (id.startsWith(`${name}:`)) {
                clearTimeout(entry.timer)
                entry.reject(new Error(`[WorkerBus] Worker "${name}" unregistered`))
                this.pending.delete(id)
            }
        }
    }

    /**
     * Dispatch a typed request to a named worker and return a Promise that
     * resolves with the worker's response data.
     */
    dispatch<TResponse = unknown>(
        workerName: string,
        type: string,
        payload?: unknown,
        timeoutMs: number = DEFAULT_TIMEOUT_MS,
    ): Promise<TResponse> {
        const worker = this.workers.get(workerName)
        if (!worker) {
            return Promise.reject(
                new Error(`[WorkerBus] No worker registered with name "${workerName}"`),
            )
        }

        const messageId = `${workerName}:${crypto.randomUUID()}`

        return new Promise<TResponse>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(messageId)
                reject(
                    new Error(
                        `[WorkerBus] Request to "${workerName}" timed out after ${timeoutMs}ms`,
                    ),
                )
            }, timeoutMs)

            this.pending.set(messageId, {
                resolve: resolve as (v: unknown) => void,
                reject,
                timer,
            })

            const request: WorkerRequest = { messageId, type, payload }
            worker.postMessage(request)
        })
    }

    /**
     * Check whether a worker is registered.
     */
    has(name: string): boolean {
        return this.workers.has(name)
    }

    /**
     * Terminate all workers and reject all pending requests.
     */
    dispose(): void {
        for (const name of [...this.workers.keys()]) {
            this.unregister(name)
        }
    }

    // -----------------------------------------------------------------------
    // Private
    // -----------------------------------------------------------------------

    private handleMessage(data: WorkerResponse): void {
        if (!data || typeof data.messageId !== 'string') {
            // Not a WorkerBus-managed message -- ignore so legacy handlers
            // continue to work during incremental migration.
            return
        }
        const entry = this.pending.get(data.messageId)
        if (!entry) {
            return
        }
        this.pending.delete(data.messageId)
        clearTimeout(entry.timer)

        if (data.error) {
            entry.reject(new Error(data.error))
        } else {
            entry.resolve(data.data)
        }
    }
}

/** Singleton WorkerBus instance for the entire application. */
export const workerBus = new WorkerBusImpl()
