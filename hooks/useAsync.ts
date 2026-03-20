import { useState, useEffect, type DependencyList } from 'react'

export interface UseAsyncResult<T> {
    data: T | null
    isLoading: boolean
    error: string | null
}

/**
 * Generic hook for async service calls with loading/error state and cancellation.
 *
 * Eliminates the duplicated `useState(loading) + useState(error) + isCancelled`
 * pattern found in useYieldPrediction, useStorageEstimate, etc.
 */
export function useAsync<T>(
    fn: () => Promise<T>,
    deps: DependencyList,
    enabled = true,
): UseAsyncResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!enabled) {
            setData(null)
            setError(null)
            setIsLoading(false)
            return
        }

        let isCancelled = false

        const run = async (): Promise<void> => {
            setIsLoading(true)
            setError(null)
            try {
                const result = await fn()
                if (!isCancelled) {
                    setData(result)
                }
            } catch (e) {
                if (!isCancelled) {
                    setError(e instanceof Error ? e.message : 'Unknown error')
                    setData(null)
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false)
                }
            }
        }

        void run()

        return () => {
            isCancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return { data, isLoading, error }
}
