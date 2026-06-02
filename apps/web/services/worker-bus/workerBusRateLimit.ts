import type { RateLimitConfig } from '@/services/worker-bus/workerBusTypes'

const rateLimitWindows = new Map<string, number[]>()
const rateLimitConfigs = new Map<string, RateLimitConfig>()

export const isRateLimitAllowed = (workerName: string): boolean => {
    const config = rateLimitConfigs.get(workerName)
    if (!config) return true

    const now = performance.now()
    let window = rateLimitWindows.get(workerName)
    if (!window) {
        window = []
        rateLimitWindows.set(workerName, window)
    }

    const cutoff = now - config.windowMs
    while (window.length > 0 && (window[0] ?? now) < cutoff) {
        window.shift()
    }

    if (window.length >= config.maxRequests) {
        return false
    }
    window.push(now)
    return true
}

export const setWorkerRateLimit = (workerName: string, config: RateLimitConfig | undefined): void => {
    if (config === undefined) {
        rateLimitConfigs.delete(workerName)
        rateLimitWindows.delete(workerName)
    } else {
        rateLimitConfigs.set(workerName, {
            maxRequests: Math.max(1, config.maxRequests),
            windowMs: Math.max(100, config.windowMs),
        })
    }
}

export const getWorkerRateLimit = (workerName: string): RateLimitConfig | undefined =>
    rateLimitConfigs.get(workerName)

export const clearWorkerRateLimits = (): void => {
    rateLimitWindows.clear()
    rateLimitConfigs.clear()
}
