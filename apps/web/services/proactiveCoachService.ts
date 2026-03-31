// ---------------------------------------------------------------------------
// Proactive Smart Coach Service
//
// Subscribes to the Redux store and monitors plant environment values after
// each simulation tick (plantStateUpdated).  When a metric exceeds safe
// thresholds and the per-metric cooldown has elapsed, the service requests
// plant-specific advice from the AI facade and pushes a SmartAlert into the
// transient Zustand alerts store.
//
// Initialised once from the app bootstrap (index.tsx) after store hydration.
// ---------------------------------------------------------------------------

import type { AppStore, RootState } from '@/stores/store'
import { useAlertsStore, type AlertMetric } from '@/stores/useAlertsStore'
import { secureRandom } from '@/utils/random'
import type { Plant } from '@/types'

// ---------------------------------------------------------------------------
// Threshold configuration
// ---------------------------------------------------------------------------

interface ThresholdRange {
    min: number
    max: number
}

const THRESHOLDS: Record<AlertMetric, ThresholdRange> = {
    temperature: { min: 16, max: 30 },
    humidity: { min: 30, max: 75 },
    vpd: { min: 0.4, max: 1.6 },
    ph: { min: 5.5, max: 7.0 },
    ec: { min: 0.5, max: 3.0 },
}

/** Cooldown per metric per plant in milliseconds (2 hours). */
const COOLDOWN_MS = 2 * 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** Map of `${plantId}:${metric}` -> last alert timestamp. */
const cooldownMap = new Map<string, number>()

/** Prevents concurrent AI calls from stacking up. */
let pendingCalls = 0
const MAX_CONCURRENT_CALLS = 2

let unsubscribe: (() => void) | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateAlertId(): string {
    return `coach_${Date.now()}_${Math.floor(secureRandom() * 1e9)}`
}

function isCooldownActive(plantId: string, metric: AlertMetric): boolean {
    const key = `${plantId}:${metric}`
    const lastAlert = cooldownMap.get(key)
    if (lastAlert === undefined) return false
    return Date.now() - lastAlert < COOLDOWN_MS
}

function setCooldown(plantId: string, metric: AlertMetric): void {
    cooldownMap.set(`${plantId}:${metric}`, Date.now())
}

interface Breach {
    metric: AlertMetric
    value: number
}

function detectBreaches(plant: Plant): Breach[] {
    const breaches: Breach[] = []
    const env = plant.environment
    const med = plant.medium

    const temp = env.internalTemperature
    const tRange = THRESHOLDS.temperature
    if (temp < tRange.min || temp > tRange.max) {
        breaches.push({ metric: 'temperature', value: temp })
    }

    const hum = env.internalHumidity
    const hRange = THRESHOLDS.humidity
    if (hum < hRange.min || hum > hRange.max) {
        breaches.push({ metric: 'humidity', value: hum })
    }

    const vpd = env.vpd
    const vRange = THRESHOLDS.vpd
    if (vpd < vRange.min || vpd > vRange.max) {
        breaches.push({ metric: 'vpd', value: vpd })
    }

    const ph = med.ph
    const pRange = THRESHOLDS.ph
    if (ph < pRange.min || ph > pRange.max) {
        breaches.push({ metric: 'ph', value: ph })
    }

    const ec = med.ec
    const eRange = THRESHOLDS.ec
    if (ec < eRange.min || ec > eRange.max) {
        breaches.push({ metric: 'ec', value: ec })
    }

    return breaches
}

// ---------------------------------------------------------------------------
// AI call (fire-and-forget, non-blocking)
// ---------------------------------------------------------------------------

async function requestAiAdvice(plant: Plant, breach: Breach): Promise<void> {
    if (pendingCalls >= MAX_CONCURRENT_CALLS) return

    pendingCalls++
    try {
        const { aiService } = await import('@/services/aiFacade')
        const lang = document.documentElement.lang === 'de' ? 'de' : 'en'

        const response = await aiService.getPlantAdvice(
            {
                ...plant,
                // Inject the critical reading into the plant context so the AI
                // can reference it directly in its advice.
                environment: {
                    ...plant.environment,
                    ...(breach.metric === 'temperature'
                        ? { internalTemperature: breach.value }
                        : {}),
                    ...(breach.metric === 'humidity' ? { internalHumidity: breach.value } : {}),
                    ...(breach.metric === 'vpd' ? { vpd: breach.value } : {}),
                },
                medium: {
                    ...plant.medium,
                    ...(breach.metric === 'ph' ? { ph: breach.value } : {}),
                    ...(breach.metric === 'ec' ? { ec: breach.value } : {}),
                },
            },
            lang,
        )

        const advice = response.content.trim()
        if (!advice) return

        useAlertsStore.getState().addAlert({
            id: generateAlertId(),
            timestamp: Date.now(),
            triggerValue: breach.value,
            metric: breach.metric,
            aiAdvice: advice,
            isDismissed: false,
            plantId: plant.id,
            plantName: plant.name,
        })

        // Push native OS notification so the user is alerted even when the
        // app is minimised or in the background.
        try {
            const { sendNotification } = await import('@/services/nativeBridgeService')
            const metricLabels: Record<AlertMetric, string> = {
                temperature: 'Temperature',
                humidity: 'Humidity',
                vpd: 'VPD',
                ph: 'pH',
                ec: 'EC',
            }
            void sendNotification({
                title: `${plant.name}: ${metricLabels[breach.metric]} critical`,
                body: advice.slice(0, 200),
                tag: `coach_${plant.id}_${breach.metric}`,
            })
        } catch {
            // Native notification is best-effort -- never block the alert flow
        }

        setCooldown(plant.id, breach.metric)
    } catch {
        // Silently swallow -- the coach is best-effort
        console.debug('[ProactiveCoach] AI advice request failed for', breach.metric)
    } finally {
        pendingCalls--
    }
}

// ---------------------------------------------------------------------------
// Store subscriber
// ---------------------------------------------------------------------------

function handleStateChange(state: RootState): void {
    const plants = Object.values(state.simulation.plants.entities)
    for (const plant of plants) {
        if (!plant) continue

        const breaches = detectBreaches(plant)
        for (const breach of breaches) {
            if (!isCooldownActive(plant.id, breach.metric)) {
                // Fire-and-forget -- non-blocking
                void requestAiAdvice(plant, breach)
                // Set cooldown immediately to prevent duplicate calls before
                // the async AI request resolves.
                setCooldown(plant.id, breach.metric)
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const proactiveCoachService = {
    /**
     * Subscribe to the Redux store and begin monitoring plant environments.
     * Call once after store hydration in the app bootstrap.
     */
    init(store: AppStore): void {
        if (unsubscribe) return // Already initialised

        // Debounce: only evaluate after 2 seconds of no state changes to
        // avoid thrashing during rapid simulation ticks.
        let timer: number | undefined
        unsubscribe = store.subscribe(() => {
            clearTimeout(timer)
            timer = window.setTimeout(() => {
                handleStateChange(store.getState() as RootState)
            }, 2000)
        })
    },

    /** Tear down the subscription (used in tests or cleanup). */
    dispose(): void {
        if (unsubscribe) {
            unsubscribe()
            unsubscribe = null
        }
        cooldownMap.clear()
    },
}
