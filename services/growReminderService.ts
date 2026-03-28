import { Plant, PlantStage } from '@/types'
import type { AppSettings } from '@/types'
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService'

const REMINDER_COOLDOWN_MS = 4 * 60 * 60 * 1000
const REMINDER_SNOOZE_KEY = 'cg.reminders.lastNotified'

/** Type of grow reminder alert (VPD, watering, harvest, pH). */
export type GrowReminderType = 'vpd' | 'watering' | 'harvest' | 'ph'

/** A single grow reminder generated from plant vitals analysis. */
export interface GrowReminder {
    id: string
    plantId: string
    plantName: string
    type: GrowReminderType
    title: string
    body: string
    severity: 'info' | 'warning' | 'critical'
    dueAt: number
}

/** A batch of reminders grouped by plant for notification delivery. */
export interface GrowReminderBatch {
    id: string
    plantId: string
    plantName: string
    reminders: GrowReminder[]
    title: string
    body: string
    severity: 'info' | 'warning' | 'critical'
    dueAt: number
}

const readSnoozedMap = (): Record<string, number> => {
    try {
        const raw = localStorage.getItem(REMINDER_SNOOZE_KEY)
        return raw ? (JSON.parse(raw) as Record<string, number>) : {}
    } catch {
        return {}
    }
}

const writeSnoozedMap = (map: Record<string, number>) => {
    try {
        localStorage.setItem(REMINDER_SNOOZE_KEY, JSON.stringify(map))
    } catch {
        // Ignore quota/storage errors in reminder helper.
    }
}

const isWithinQuietHours = (start: string, end: string, now = new Date()): boolean => {
    const toMinutes = (value: string) => {
        const [rawHours, rawMinutes] = value.split(':')
        if (rawHours === undefined || rawMinutes === undefined) return null

        const hours = Number(rawHours)
        const minutes = Number(rawMinutes)
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
        return hours * 60 + minutes
    }

    const startMinutes = toMinutes(start)
    const endMinutes = toMinutes(end)
    if (startMinutes === null || endMinutes === null) return false

    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    if (startMinutes === endMinutes) return true
    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }

    return currentMinutes >= startMinutes || currentMinutes < endMinutes
}

const isReminderEnabled = (reminder: GrowReminder, settings?: AppSettings): boolean => {
    if (!settings?.notifications.enabled) return false

    switch (reminder.type) {
        case 'vpd':
            return settings.notifications.problemDetected
        case 'watering':
            return settings.notifications.lowWaterWarning || settings.notifications.newTask
        case 'harvest':
            return settings.notifications.harvestReady
        case 'ph':
            return settings.notifications.phDriftWarning
        default:
            return true
    }
}

const getDaysToHarvest = (plant: Plant): number => {
    const stageOrder: PlantStage[] = [
        PlantStage.Seed,
        PlantStage.Germination,
        PlantStage.Seedling,
        PlantStage.Vegetative,
        PlantStage.Flowering,
        PlantStage.Harvest,
    ]

    const totalDaysToHarvest = stageOrder.reduce((sum, stage) => {
        const duration = PLANT_STAGE_DETAILS[stage].duration
        return Number.isFinite(duration) ? sum + duration : sum
    }, 0)

    return Math.max(0, Math.round(totalDaysToHarvest - plant.age))
}

const getRelevantReminders = (reminders: GrowReminder[], targetPlantId?: string): GrowReminder[] =>
    targetPlantId ? reminders.filter((reminder) => reminder.plantId === targetPlantId) : reminders

const getEnabledBatchReminders = (
    batch: GrowReminderBatch,
    settings?: AppSettings,
): GrowReminder[] => batch.reminders.filter((reminder) => isReminderEnabled(reminder, settings))

const isBatchCoolingDown = (
    batchId: string,
    snoozedMap: Record<string, number>,
    now: number,
): boolean => {
    const lastNotified = snoozedMap[batchId] || 0
    return now - lastNotified < REMINDER_COOLDOWN_MS
}

const composeBatchMessage = (
    batch: GrowReminderBatch,
    reminders: GrowReminder[],
): { title: string; body: string } | null => {
    const primaryReminder = reminders[0]
    if (!primaryReminder) {
        return null
    }

    if (reminders.length === 1) {
        return {
            title: primaryReminder.title,
            body: primaryReminder.body,
        }
    }

    return {
        title: `${reminders.length} reminders for ${batch.plantName}`,
        body: reminders.map((reminder) => reminder.title).join(' · '),
    }
}

const notifyReminderBatch = async (
    batch: GrowReminderBatch,
    reminders: GrowReminder[],
    message: { title: string; body: string },
): Promise<void> => {
    const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
    if (registration) {
        await registration.showNotification(message.title, {
            body: message.body,
            icon: registration.scope + 'icon.svg',
            badge: registration.scope + 'icon.svg',
            tag: `grow-reminder-batch-${batch.id}`,
            data: { reminderIds: reminders.map((reminder) => reminder.id), plantId: batch.plantId },
        })
        return
    }

    new Notification(message.title, { body: message.body })
}

class GrowReminderService {
    private _createReminder(
        plant: Plant,
        type: GrowReminder['type'],
        title: string,
        body: string,
        severity: GrowReminder['severity'],
        now: number,
    ): GrowReminder {
        return {
            id: `${plant.id}-${type}`,
            plantId: plant.id,
            plantName: plant.name,
            type,
            title,
            body,
            severity,
            dueAt: now,
        }
    }

    private _checkVpd(
        plant: Plant,
        stageVitals: { vpd: { min: number; max: number } },
        now: number,
    ): GrowReminder | null {
        const { min: minVpd, max: maxVpd } = stageVitals.vpd
        if (plant.environment.vpd >= minVpd && plant.environment.vpd <= maxVpd) return null
        return this._createReminder(
            plant,
            'vpd',
            `VPD alarm for ${plant.name}`,
            `Current VPD ${plant.environment.vpd.toFixed(2)} kPa is outside ${minVpd.toFixed(1)}-${maxVpd.toFixed(1)} kPa.`,
            'warning',
            now,
        )
    }

    private _checkWatering(plant: Plant, now: number): GrowReminder | null {
        if (plant.medium.moisture >= 38) return null
        return this._createReminder(
            plant,
            'watering',
            `Watering reminder: ${plant.name}`,
            `Soil moisture is ${Math.round(plant.medium.moisture)}%. Consider watering soon.`,
            plant.medium.moisture < 25 ? 'critical' : 'warning',
            now,
        )
    }

    private _checkPh(
        plant: Plant,
        stageVitals: { ph?: { min: number; max: number } },
        now: number,
    ): GrowReminder | null {
        if (!stageVitals.ph) return null
        if (plant.medium.ph >= stageVitals.ph.min && plant.medium.ph <= stageVitals.ph.max)
            return null
        return this._createReminder(
            plant,
            'ph',
            `pH drift detected: ${plant.name}`,
            `Current pH ${plant.medium.ph.toFixed(1)} is outside ${stageVitals.ph.min.toFixed(1)}-${stageVitals.ph.max.toFixed(1)} for ${plant.stage.toLowerCase()}.`,
            'warning',
            now,
        )
    }

    private _checkHarvest(plant: Plant, now: number): GrowReminder | null {
        const daysToHarvest = getDaysToHarvest(plant)
        if (plant.stage !== PlantStage.Harvest && daysToHarvest > 7) return null
        return this._createReminder(
            plant,
            'harvest',
            `Harvest reminder: ${plant.name}`,
            daysToHarvest === 0
                ? 'Harvest window is open now.'
                : `Estimated harvest window in ${daysToHarvest} day(s).`,
            daysToHarvest <= 2 ? 'critical' : 'info',
            now,
        )
    }

    private _getPlantReminders(plant: Plant, now: number): GrowReminder[] {
        const stageVitals = PLANT_STAGE_DETAILS[plant.stage]?.idealVitals
        const checks: Array<GrowReminder | null> = [
            stageVitals ? this._checkVpd(plant, stageVitals, now) : null,
            this._checkWatering(plant, now),
            stageVitals ? this._checkPh(plant, stageVitals, now) : null,
            this._checkHarvest(plant, now),
        ]
        return checks.filter((r): r is GrowReminder => r !== null)
    }

    /** Analyze all plants and generate grow reminders based on VPD, moisture, pH, and harvest proximity. */
    public buildReminders(plants: Plant[]): GrowReminder[] {
        const now = Date.now()
        return plants.flatMap((plant) => this._getPlantReminders(plant, now))
    }

    /** Group reminders by plant ID into batches sorted by severity and due date. */
    public buildReminderBatches(reminders: GrowReminder[]): GrowReminderBatch[] {
        const batches = new Map<string, GrowReminder[]>()

        for (const reminder of reminders) {
            const existing = batches.get(reminder.plantId) || []
            existing.push(reminder)
            batches.set(reminder.plantId, existing)
        }

        return Array.from(batches.entries())
            .map(([plantId, plantReminders]) => {
                const sortedReminders = plantReminders.toSorted((left, right) => {
                    const severityRank = { critical: 0, warning: 1, info: 2 }
                    const severityDelta = severityRank[left.severity] - severityRank[right.severity]
                    if (severityDelta !== 0) return severityDelta
                    return left.dueAt - right.dueAt
                })

                const plantName = sortedReminders[0]?.plantName || 'Plant'
                const topSeverity = sortedReminders.reduce<'info' | 'warning' | 'critical'>(
                    (highest, reminder) => {
                        const severityRank = { critical: 0, warning: 1, info: 2 }
                        return severityRank[reminder.severity] < severityRank[highest]
                            ? reminder.severity
                            : highest
                    },
                    'info',
                )

                return {
                    id: plantId,
                    plantId,
                    plantName,
                    reminders: sortedReminders,
                    title:
                        sortedReminders.length === 1
                            ? (sortedReminders[0]?.title ?? '')
                            : `${sortedReminders.length} reminders for ${plantName}`,
                    body: sortedReminders.map((reminder) => reminder.title).join(' · '),
                    severity: topSeverity,
                    dueAt: Math.min(...sortedReminders.map((reminder) => reminder.dueAt)),
                }
            })
            .toSorted((left, right) => left.dueAt - right.dueAt)
    }

    /** Request browser notification permission. Returns the resulting permission state. */
    public async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            return 'denied'
        }

        if (Notification.permission === 'granted') {
            return 'granted'
        }

        return Notification.requestPermission()
    }

    /** Register periodic sync for background reminder checks via the Service Worker. */
    public async registerPeriodicSync(swRegistration?: ServiceWorkerRegistration): Promise<void> {
        const registration =
            swRegistration ||
            (await navigator.serviceWorker.getRegistration().catch(() => undefined))
        if (!registration) return

        const periodicSync = (
            registration as ServiceWorkerRegistration & {
                periodicSync?: {
                    register: (tag: string, options: { minInterval: number }) => Promise<void>
                }
            }
        ).periodicSync

        if (periodicSync) {
            await periodicSync.register('grow-reminders', { minInterval: 6 * 60 * 60 * 1000 })
            return
        }

        if ('sync' in registration) {
            await (
                registration as ServiceWorkerRegistration & {
                    sync: { register: (tag: string) => Promise<void> }
                }
            ).sync.register('grow-reminders-sync')
        }
    }

    /** Send updated reminders to the active Service Worker for background processing. */
    public async syncRemindersToWorker(reminders: GrowReminder[]): Promise<void> {
        if (!('serviceWorker' in navigator)) return

        const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
        const controller = navigator.serviceWorker.controller

        if (controller) {
            controller.postMessage({ type: 'UPDATE_REMINDERS', payload: reminders })
        } else if (registration?.active) {
            registration.active.postMessage({ type: 'UPDATE_REMINDERS', payload: reminders })
        }
    }

    public async triggerWorkerReminderCheck(): Promise<void> {
        if (!('serviceWorker' in navigator)) return
        const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
        const controller = navigator.serviceWorker.controller

        if (controller) {
            controller.postMessage({ type: 'REQUEST_REMINDER_CHECK' })
        } else if (registration?.active) {
            registration.active.postMessage({ type: 'REQUEST_REMINDER_CHECK' })
        }
    }

    public getBatchTriggerUrl(plantId: string): string {
        const url = new URL(window.location.href)
        url.searchParams.set('reminderBatch', plantId)
        return url.toString()
    }

    /** Evaluate due reminders against user settings and dispatch browser notifications. Respects quiet hours and cooldown. */
    public async notifyDueReminders(
        reminders: GrowReminder[],
        settings?: AppSettings,
        targetPlantId?: string,
    ): Promise<void> {
        if (Notification.permission !== 'granted') return
        if (
            settings?.notifications.quietHours.enabled &&
            isWithinQuietHours(
                settings.notifications.quietHours.start,
                settings.notifications.quietHours.end,
            )
        ) {
            return
        }

        const now = Date.now()
        const snoozedMap = readSnoozedMap()
        const batches = this.buildReminderBatches(getRelevantReminders(reminders, targetPlantId))

        for (const batch of batches) {
            const batchReminders = getEnabledBatchReminders(batch, settings)
            if (batchReminders.length === 0) {
                continue
            }

            if (isBatchCoolingDown(batch.id, snoozedMap, now)) {
                continue
            }

            const message = composeBatchMessage(batch, batchReminders)
            if (!message) {
                continue
            }

            await notifyReminderBatch(batch, batchReminders, message)

            snoozedMap[batch.id] = now
        }

        writeSnoozedMap(snoozedMap)
    }
}

export const growReminderService = new GrowReminderService()
