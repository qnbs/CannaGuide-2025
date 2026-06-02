import type { AppSettings } from '@/types'
import { defaultSettings } from '@/stores/slices/settingsSlice'

/* eslint-disable @typescript-eslint/no-unsafe-type-assertion */

export const deepMergeSettings = (persisted: Partial<AppSettings>): AppSettings => {
    const blockedMergeKeys = new Set(['__proto__', 'constructor', 'prototype'])
    const isObject = (item: unknown): item is Record<string, unknown> =>
        !!item && typeof item === 'object' && !Array.isArray(item)
    const isSafeMergeKey = (key: string): boolean => !blockedMergeKeys.has(key)

    const output = structuredClone(defaultSettings) as unknown as Record<string, unknown>

    function merge(target: Record<string, unknown>, source: Record<string, unknown>) {
        for (const [key, sourceValue] of Object.entries(source)) {
            if (!isSafeMergeKey(key)) continue
            if (!Object.prototype.hasOwnProperty.call(target, key)) continue

            if (isObject(sourceValue)) {
                const currentTargetValue = target[key]
                if (!isObject(currentTargetValue)) {
                    continue
                }
                merge(target[key] as Record<string, unknown>, sourceValue)
            } else if (sourceValue !== undefined) {
                target[key] = sourceValue
            }
        }
    }
    if (isObject(persisted)) {
        merge(output, persisted)
    }

    const simulationSettings = (output as Record<string, unknown>).simulation as
        | Record<string, unknown>
        | undefined
    if (
        simulationSettings &&
        Object.prototype.hasOwnProperty.call(simulationSettings, 'speedMultiplier')
    ) {
        delete simulationSettings.speedMultiplier
    }

    return output as unknown as AppSettings
}
