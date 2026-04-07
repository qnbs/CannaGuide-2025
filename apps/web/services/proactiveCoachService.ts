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
import { PlantStage, type Plant } from '@/types'
import { DEFAULT_GROW_ID, DEFAULT_GROW_NAME } from '@/constants'

// ---------------------------------------------------------------------------
// Threshold configuration
// ---------------------------------------------------------------------------

interface ThresholdRange {
    min: number
    max: number
}

/** Global fallback thresholds (all stages). */
const THRESHOLDS: Record<AlertMetric, ThresholdRange> = {
    temperature: { min: 16, max: 30 },
    humidity: { min: 30, max: 75 },
    vpd: { min: 0.4, max: 1.6 },
    ph: { min: 5.5, max: 7.0 },
    ec: { min: 0.5, max: 3.0 },
    co2: { min: 300, max: 1500 },
    moisture: { min: 20, max: 90 },
}

/**
 * Stage-specific overrides for metrics that vary significantly across growth
 * phases. Any metric not listed here falls back to THRESHOLDS.
 * VPD optimums: seedling 0.4-0.8, vegetative 0.8-1.2, flowering 1.0-1.6.
 */
const STAGE_THRESHOLDS: Partial<Record<PlantStage, Partial<Record<AlertMetric, ThresholdRange>>>> =
    {
        [PlantStage.Seed]: {
            vpd: { min: 0.4, max: 0.8 },
            temperature: { min: 20, max: 28 },
            humidity: { min: 60, max: 80 },
        },
        [PlantStage.Germination]: {
            vpd: { min: 0.4, max: 0.8 },
            temperature: { min: 20, max: 28 },
            humidity: { min: 60, max: 80 },
        },
        [PlantStage.Seedling]: {
            vpd: { min: 0.4, max: 0.8 },
            temperature: { min: 20, max: 28 },
            humidity: { min: 60, max: 75 },
        },
        [PlantStage.Vegetative]: {
            vpd: { min: 0.8, max: 1.2 },
            temperature: { min: 18, max: 28 },
            humidity: { min: 40, max: 70 },
        },
        [PlantStage.Flowering]: {
            vpd: { min: 1.0, max: 1.6 },
            temperature: { min: 17, max: 27 },
            humidity: { min: 30, max: 50 },
        },
    }

/** Cooldown per metric per plant in milliseconds (2 hours). */
const COOLDOWN_MS = 2 * 60 * 60 * 1000

/** sessionStorage key prefix for persistent cooldown entries. */
const COOLDOWN_SESSION_KEY = 'cannaguide_coach_cooldown'

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

/** In-memory mirror of sessionStorage cooldown (faster lookup). */
const cooldownMap = new Map<string, number>()

/** Prevents concurrent AI calls from stacking up. */
let pendingCalls = 0
const MAX_CONCURRENT_CALLS = 2

let unsubscribe: (() => void) | null = null

// ---------------------------------------------------------------------------
// Stage-aware threshold resolution
// ---------------------------------------------------------------------------

function resolveThreshold(stage: PlantStage, metric: AlertMetric): ThresholdRange {
    const stageOverride = STAGE_THRESHOLDS[stage]
    return stageOverride?.[metric] ?? THRESHOLDS[metric]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateAlertId(): string {
    return `coach_${Date.now()}_${Math.floor(secureRandom() * 1e9)}`
}

function loadCooldownFromSession(): void {
    try {
        const raw = sessionStorage.getItem(COOLDOWN_SESSION_KEY)
        if (!raw) return
        const map = JSON.parse(raw) as Record<string, number>
        for (const [k, v] of Object.entries(map)) {
            cooldownMap.set(k, v)
        }
    } catch {
        // sessionStorage unavailable or corrupted -- proceed without persistence
    }
}

function saveCooldownToSession(): void {
    try {
        const obj: Record<string, number> = {}
        cooldownMap.forEach((v, k) => { obj[k] = v })
        sessionStorage.setItem(COOLDOWN_SESSION_KEY, JSON.stringify(obj))
    } catch {
        // sessionStorage write failure is non-critical
    }
}

function isCooldownActive(plantId: string, metric: AlertMetric): boolean {
    const key = `${plantId}:${metric}`
    const lastAlert = cooldownMap.get(key)
    if (lastAlert === undefined) return false
    return Date.now() - lastAlert < COOLDOWN_MS
}

function setCooldown(plantId: string, metric: AlertMetric): void {
    cooldownMap.set(`${plantId}:${metric}`, Date.now())
    saveCooldownToSession()
}

interface Breach {
    metric: AlertMetric
    value: number
}

function detectBreaches(plant: Plant): Breach[] {
    const breaches: Breach[] = []
    const env = plant.environment
    const med = plant.medium
    const stage: PlantStage = (plant.stage as PlantStage) ?? PlantStage.Vegetative

    const check = (metric: AlertMetric, value: number): void => {
        const range = resolveThreshold(stage, metric)
        if (value < range.min || value > range.max) {
            breaches.push({ metric, value })
        }
    }

    check('temperature', env.internalTemperature)
    check('humidity', env.internalHumidity)
    check('vpd', env.vpd)
    check('ph', med.ph)
    check('ec', med.ec)

    if (env.co2Level !== undefined) {
        check('co2', env.co2Level)
    }

    if (med.moisture !== undefined) {
        check('moisture', med.moisture)
    }

    return breaches
}

// ---------------------------------------------------------------------------
// AI call (fire-and-forget, non-blocking)
// ---------------------------------------------------------------------------

async function requestAiAdvice(
    plant: Plant,
    breach: Breach,
    growId: string,
    growName: string,
): Promise<void> {
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
            growId,
            growName,
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
                co2: 'CO2',
                moisture: 'Moisture',
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
    const growEntities = state.grows?.grows?.entities ?? {}

    for (const plant of plants) {
        if (!plant) continue

        const growId = plant.growId ?? DEFAULT_GROW_ID
        const growEntity = growEntities[growId]
        const growName = growEntity?.name ?? DEFAULT_GROW_NAME

        const breaches = detectBreaches(plant)
        for (const breach of breaches) {
            if (!isCooldownActive(plant.id, breach.metric)) {
                // Fire-and-forget -- non-blocking
                void requestAiAdvice(plant, breach, growId, growName)
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

        loadCooldownFromSession()

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
