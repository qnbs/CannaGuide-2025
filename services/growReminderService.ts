import { Plant, PlantStage } from '@/types'
import type { AppSettings } from '@/types'
import { PLANT_STAGE_DETAILS } from '@/services/plantSimulationService'

const REMINDER_COOLDOWN_MS = 4 * 60 * 60 * 1000
const REMINDER_SNOOZE_KEY = 'cg.reminders.lastNotified'

export type GrowReminderType = 'vpd' | 'watering' | 'harvest' | 'ph'

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
        const [hours = NaN, minutes = NaN] = value.split(':').map(Number)
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
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

class GrowReminderService {
    public buildReminders(plants: Plant[]): GrowReminder[] {
        const now = Date.now()

        return plants.flatMap((plant) => {
            const reminders: GrowReminder[] = []
            const stageVitals = PLANT_STAGE_DETAILS[plant.stage]?.idealVitals

            if (stageVitals) {
                const minVpd = stageVitals.vpd.min
                const maxVpd = stageVitals.vpd.max
                if (plant.environment.vpd < minVpd || plant.environment.vpd > maxVpd) {
                    reminders.push({
                        id: `${plant.id}-vpd`,
                        plantId: plant.id,
                        plantName: plant.name,
                        type: 'vpd',
                        title: `VPD alarm for ${plant.name}`,
                        body: `Current VPD ${plant.environment.vpd.toFixed(2)} kPa is outside ${minVpd.toFixed(1)}-${maxVpd.toFixed(1)} kPa.`,
                        severity: 'warning',
                        dueAt: now,
                    })
                }
            }

            if (plant.medium.moisture < 38) {
                reminders.push({
                    id: `${plant.id}-watering`,
                    plantId: plant.id,
                    plantName: plant.name,
                    type: 'watering',
                    title: `Watering reminder: ${plant.name}`,
                    body: `Soil moisture is ${Math.round(plant.medium.moisture)}%. Consider watering soon.`,
                    severity: plant.medium.moisture < 25 ? 'critical' : 'warning',
                    dueAt: now,
                })
            }

            if (stageVitals?.ph && (plant.medium.ph < stageVitals.ph.min || plant.medium.ph > stageVitals.ph.max)) {
                reminders.push({
                    id: `${plant.id}-ph`,
                    plantId: plant.id,
                    plantName: plant.name,
                    type: 'ph',
                    title: `pH drift detected: ${plant.name}`,
                    body: `Current pH ${plant.medium.ph.toFixed(1)} is outside ${stageVitals.ph.min.toFixed(1)}-${stageVitals.ph.max.toFixed(1)} for ${plant.stage.toLowerCase()}.`,
                    severity: 'warning',
                    dueAt: now,
                })
            }

            const daysToHarvest = getDaysToHarvest(plant)
            if (plant.stage === PlantStage.Harvest || daysToHarvest <= 7) {
                reminders.push({
                    id: `${plant.id}-harvest`,
                    plantId: plant.id,
                    plantName: plant.name,
                    type: 'harvest',
                    title: `Harvest reminder: ${plant.name}`,
                    body:
                        daysToHarvest === 0
                            ? 'Harvest window is open now.'
                            : `Estimated harvest window in ${daysToHarvest} day(s).`,
                    severity: daysToHarvest <= 2 ? 'critical' : 'info',
                    dueAt: now,
                })
            }

            return reminders
        })
    }

    public buildReminderBatches(reminders: GrowReminder[]): GrowReminderBatch[] {
        const batches = new Map<string, GrowReminder[]>()

        for (const reminder of reminders) {
            const existing = batches.get(reminder.plantId) || []
            existing.push(reminder)
            batches.set(reminder.plantId, existing)
        }

        return Array.from(batches.entries()).map(([plantId, plantReminders]) => {
            const sortedReminders = [...plantReminders].sort((left, right) => {
                const severityRank = { critical: 0, warning: 1, info: 2 }
                const severityDelta = severityRank[left.severity] - severityRank[right.severity]
                if (severityDelta !== 0) return severityDelta
                return left.dueAt - right.dueAt
            })

            const plantName = sortedReminders[0]?.plantName || 'Plant'
            const topSeverity = sortedReminders.reduce<'info' | 'warning' | 'critical'>((highest, reminder) => {
                const severityRank = { critical: 0, warning: 1, info: 2 }
                return severityRank[reminder.severity] < severityRank[highest] ? reminder.severity : highest
            }, 'info')

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
        }).sort((left, right) => left.dueAt - right.dueAt)
    }

    public async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            return 'denied'
        }

        if (Notification.permission === 'granted') {
            return 'granted'
        }

        return Notification.requestPermission()
    }

    public async registerPeriodicSync(swRegistration?: ServiceWorkerRegistration): Promise<void> {
        const registration =
            swRegistration || (await navigator.serviceWorker.getRegistration().catch(() => undefined))
        if (!registration) return

        const periodicSync = (registration as ServiceWorkerRegistration & {
            periodicSync?: { register: (tag: string, options: { minInterval: number }) => Promise<void> }
        }).periodicSync

        if (periodicSync) {
            await periodicSync.register('grow-reminders', { minInterval: 6 * 60 * 60 * 1000 })
            return
        }

        if ('sync' in registration) {
            await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('grow-reminders-sync')
        }
    }

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

    public async notifyDueReminders(reminders: GrowReminder[], settings?: AppSettings, targetPlantId?: string): Promise<void> {
        if (Notification.permission !== 'granted') return
        if (settings?.notifications.quietHours.enabled && isWithinQuietHours(settings.notifications.quietHours.start, settings.notifications.quietHours.end)) {
            return
        }

        const now = Date.now()
        const snoozedMap = readSnoozedMap()
        const batches = this.buildReminderBatches(targetPlantId ? reminders.filter((reminder) => reminder.plantId === targetPlantId) : reminders)

        for (const batch of batches) {
            const batchReminders = batch.reminders.filter((reminder) => isReminderEnabled(reminder, settings))
            if (batchReminders.length === 0) {
                continue
            }

            const lastNotified = snoozedMap[batch.id] || 0
            if (now - lastNotified < REMINDER_COOLDOWN_MS) {
                continue
            }

            const primaryReminder = batchReminders[0]
            if (!primaryReminder) continue
            const title = batchReminders.length === 1 ? primaryReminder.title : `${batchReminders.length} reminders for ${batch.plantName}`
            const body = batchReminders.length === 1 ? primaryReminder.body : batchReminders.map((reminder) => reminder.title).join(' · ')

            const registration = await navigator.serviceWorker.getRegistration().catch(() => undefined)
            if (registration) {
                await registration.showNotification(title, {
                    body,
                    icon: registration.scope + 'icon.svg',
                    badge: registration.scope + 'icon.svg',
                    tag: `grow-reminder-batch-${batch.id}`,
                    data: { reminderIds: batchReminders.map((reminder) => reminder.id), plantId: batch.plantId },
                })
            } else {
                new Notification(title, { body })
            }

            snoozedMap[batch.id] = now
        }

        writeSnoozedMap(snoozedMap)
    }
}

export const growReminderService = new GrowReminderService()
