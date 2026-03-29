import { useSyncExternalStore } from 'react'
import {
    subscribeWebLlmLoading,
    getWebLlmLoadingSnapshot,
    type WebLlmLoadingState,
} from '@/services/webLlmProgressEmitter'

/**
 * Subscribe to WebLLM model-loading progress via useSyncExternalStore.
 * Returns the current loading state (idle | loading | ready | error).
 */
export const useWebLlmLoadProgress = (): WebLlmLoadingState =>
    useSyncExternalStore(subscribeWebLlmLoading, getWebLlmLoadingSnapshot)
