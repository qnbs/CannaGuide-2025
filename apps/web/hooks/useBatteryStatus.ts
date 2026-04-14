import { useState, useEffect } from 'react'
import { isEcoMode, isCriticalBattery } from '@/services/local-ai'

interface BatteryStatus {
    /** Battery level 0-100, or null if API unavailable. */
    level: number | null
    /** Whether the device is currently charging. */
    charging: boolean
    /** Whether eco mode is currently active. */
    ecoActive: boolean
    /** Whether GPU is gated due to critical battery. */
    gpuGated: boolean
}

/**
 * Hook that provides live battery status + eco-mode/GPU-gating state.
 * Updates when battery level or charging state changes.
 * Falls back gracefully when Battery API is unavailable.
 */
export function useBatteryStatus(): BatteryStatus {
    const [status, setStatus] = useState<BatteryStatus>({
        level: null,
        charging: false,
        ecoActive: isEcoMode(),
        gpuGated: isCriticalBattery(),
    })

    useEffect(() => {
        let mounted = true

        const update = (battery?: { level: number; charging: boolean }): void => {
            if (!mounted) return
            setStatus({
                level: battery ? Math.round(battery.level * 100) : null,
                charging: battery?.charging ?? false,
                ecoActive: isEcoMode(),
                gpuGated: isCriticalBattery(),
            })
        }

        const init = async (): Promise<void> => {
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Battery API type narrowing
                const nav = navigator as unknown as {
                    getBattery?: () => Promise<{
                        level: number
                        charging: boolean
                        addEventListener: (type: string, listener: () => void) => void
                        removeEventListener: (type: string, listener: () => void) => void
                    }>
                }
                const battery = await nav.getBattery?.()
                if (!battery || !mounted) return

                update(battery)

                const onChange = (): void => update(battery)
                battery.addEventListener('levelchange', onChange)
                battery.addEventListener('chargingchange', onChange)
            } catch {
                // Battery API unavailable -- keep defaults
            }
        }

        void init()

        // Poll eco/gpu state every 30s (these can change independently of battery events)
        const interval = setInterval(() => {
            if (mounted) {
                setStatus((prev) => ({
                    ...prev,
                    ecoActive: isEcoMode(),
                    gpuGated: isCriticalBattery(),
                }))
            }
        }, 30_000)

        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [])

    return status
}
