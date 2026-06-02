/** Default WorkerBus configuration and internal protocol markers. */

export const DEFAULT_TIMEOUT_MS = 30_000
export const DEFAULT_MAX_CONCURRENT = 8
export const DEFAULT_MAX_QUEUE_SIZE = 64
export const DEFAULT_RETRY_DELAY_MS = 500
export const MAX_PREEMPTION_RETRIES = 3

export const PORT_TRANSFER_TYPE = '__PORT_TRANSFER__'
export const CANCEL_TYPE = '__CANCEL__'

export const NON_RETRYABLE = ['No worker registered', 'disposed', 'unregistered', 'Queue full'] as const
