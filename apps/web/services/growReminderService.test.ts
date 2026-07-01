import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlantStage, type AppSettings, type Plant } from '@/types'

// Mock plantSimulationService before import
vi.mock('@/services/plantSimulationService', () => ({
    PLANT_STAGE_DETAILS: {
        [PlantStage.Seed]: { duration: 3, idealVitals: { vpd: { min: 0.4, max: 0.8 } } },
        [PlantStage.Germination]: { duration: 5, idealVitals: { vpd: { min: 0.4, max: 0.8 } } },
        [PlantStage.Seedling]: { duration: 14, idealVitals: { vpd: { min: 0.4, max: 0.8 } } },
        [PlantStage.Vegetative]: { duration: 28, idealVitals: { vpd: { min: 0.8, max: 1.2 }, ph: { min: 5.8, max: 6.5 } } },
        [PlantStage.Flowering]: { duration: 56, idealVitals: { vpd: { min: 1.0, max: 1.5 } } },
        [PlantStage.Harvest]: { duration: Infinity, idealVitals: { vpd: { min: 0.8, max: 1.2 } } },
    },
}))

import { growReminderService } from '@/services/growReminderService'

const makeSettings = (overrides: Partial<AppSettings['notifications']> = {}): AppSettings =>
    ({
        notifications: {
            enabled: true,
            stageChange: true,
            problemDetected: true,
            harvestReady: true,
            newTask: true,
            lowWaterWarning: true,
            phDriftWarning: true,
            quietHours: { enabled: false, start: '22:00', end: '07:00' },
            ...overrides,
        },
    }) as AppSettings

const makePlant = (overrides: Record<string, unknown> = {}): Plant =>
    ({
        id: 'plant-1',
        name: 'Test Plant',
        stage: PlantStage.Vegetative,
        age: 30,
        health: 80,
        environment: {
            temperature: 25,
            humidity: 60,
            vpd: 1.0,
            co2: 400,
        },
        medium: {
            moisture: 50,
            ph: 6.5,
            ec: 1.2,
        },
        ...overrides,
    }) as unknown as Plant

describe('GrowReminderService', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.restoreAllMocks()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    describe('buildReminders', () => {
        it('returns empty array for empty plant list', () => {
            expect(growReminderService.buildReminders([])).toEqual([])
        })

        it('generates VPD alarm when VPD is out of range', () => {
            const plant = makePlant({
                environment: { temperature: 25, humidity: 60, vpd: 2.0, co2: 400 },
            })
            const reminders = growReminderService.buildReminders([plant])
            const vpdReminder = reminders.find((r) => r.type === 'vpd')
            expect(vpdReminder).toBeDefined()
            expect(vpdReminder!.severity).toBe('warning')
        })

        it('does not generate VPD alarm when VPD is in range', () => {
            const plant = makePlant({
                environment: { temperature: 25, humidity: 60, vpd: 1.0, co2: 400 },
            })
            const reminders = growReminderService.buildReminders([plant])
            const vpdReminder = reminders.find((r) => r.type === 'vpd')
            expect(vpdReminder).toBeUndefined()
        })

        it('generates watering reminder for low moisture', () => {
            const plant = makePlant({ medium: { moisture: 30, ph: 6.5, ec: 1.2 } })
            const reminders = growReminderService.buildReminders([plant])
            const waterReminder = reminders.find((r) => r.type === 'watering')
            expect(waterReminder).toBeDefined()
            expect(waterReminder!.severity).toBe('warning')
        })

        it('generates critical watering reminder for very low moisture', () => {
            const plant = makePlant({ medium: { moisture: 20, ph: 6.5, ec: 1.2 } })
            const reminders = growReminderService.buildReminders([plant])
            const waterReminder = reminders.find((r) => r.type === 'watering')
            expect(waterReminder).toBeDefined()
            expect(waterReminder!.severity).toBe('critical')
        })

        it('does not generate watering reminder for adequate moisture', () => {
            const plant = makePlant({ medium: { moisture: 60, ph: 6.5, ec: 1.2 } })
            const reminders = growReminderService.buildReminders([plant])
            const waterReminder = reminders.find((r) => r.type === 'watering')
            expect(waterReminder).toBeUndefined()
        })

        it('generates harvest reminder for plants at harvest stage', () => {
            const plant = makePlant({ stage: PlantStage.Harvest, age: 110 })
            const reminders = growReminderService.buildReminders([plant])
            const harvestReminder = reminders.find((r) => r.type === 'harvest')
            expect(harvestReminder).toBeDefined()
        })

        it('handles multiple plants', () => {
            const plants = [
                makePlant({ id: 'p1', medium: { moisture: 20, ph: 6.5, ec: 1.2 } }),
                makePlant({
                    id: 'p2',
                    environment: { temperature: 25, humidity: 60, vpd: 2.0, co2: 400 },
                }),
            ]
            const reminders = growReminderService.buildReminders(plants)
            expect(reminders.length).toBeGreaterThanOrEqual(2)
        })

        it('generates pH reminder when pH is out of range', () => {
            const plant = makePlant({ medium: { moisture: 55, ph: 5.0, ec: 1.2 } })
            const reminders = growReminderService.buildReminders([plant])
            expect(reminders.some((r) => r.type === 'ph')).toBe(true)
        })

        it('generates seedling VPD reminder using seedling thresholds', () => {
            const plant = makePlant({
                stage: PlantStage.Seedling,
                environment: { temperature: 25, humidity: 60, vpd: 1.5, co2: 400 },
            })
            const reminders = growReminderService.buildReminders([plant])
            expect(reminders.some((r) => r.type === 'vpd')).toBe(true)
        })

        it('generates VPD alarm when VPD is below minimum', () => {
            const plant = makePlant({
                environment: { temperature: 25, humidity: 60, vpd: 0.3, co2: 400 },
            })
            const reminders = growReminderService.buildReminders([plant])
            expect(reminders.some((r) => r.type === 'vpd')).toBe(true)
        })

        it('generates harvest info when harvest window is within seven days', () => {
            const plant = makePlant({ age: 100 })
            const reminders = growReminderService.buildReminders([plant])
            const harvest = reminders.find((r) => r.type === 'harvest')
            expect(harvest).toBeDefined()
            expect(harvest!.severity).toBe('info')
            expect(harvest!.body).toContain('day(s)')
        })

        it('marks harvest as critical when window is within two days', () => {
            const plant = makePlant({ age: 105 })
            const reminders = growReminderService.buildReminders([plant])
            const harvest = reminders.find((r) => r.type === 'harvest')
            expect(harvest?.severity).toBe('critical')
        })

        it('uses open-now copy when harvest window has arrived', () => {
            const plant = makePlant({ age: 110 })
            const reminders = growReminderService.buildReminders([plant])
            const harvest = reminders.find((r) => r.type === 'harvest')
            expect(harvest?.body).toBe('Harvest window is open now.')
        })
    })

    describe('buildReminderBatches', () => {
        it('groups reminders by plant for one batch notification', () => {
            const reminders = [
                {
                    id: 'p1-watering',
                    plantId: 'p1',
                    plantName: 'Plant One',
                    type: 'watering' as const,
                    title: 'Watering reminder: Plant One',
                    body: 'Moisture is low.',
                    severity: 'warning' as const,
                    dueAt: 10,
                },
                {
                    id: 'p1-ph',
                    plantId: 'p1',
                    plantName: 'Plant One',
                    type: 'ph' as const,
                    title: 'pH drift detected: Plant One',
                    body: 'pH is outside range.',
                    severity: 'critical' as const,
                    dueAt: 5,
                },
            ]

            const batches = growReminderService.buildReminderBatches(reminders)

            expect(batches).toHaveLength(1)
            expect(batches[0]!.plantId).toBe('p1')
            expect(batches[0]!.reminders).toHaveLength(2)
            expect(batches[0]!.severity).toBe('critical')
            expect(batches[0]!.title).toBe('2 reminders for Plant One')
        })
    })

    describe('helpers', () => {
        it('builds batch trigger URLs for plant detail navigation', () => {
            expect(growReminderService.getBatchTriggerUrl('plant-42')).toContain('plant-42')
        })
    })

    describe('requestPermission', () => {
        it('returns denied when Notification API is unavailable', async () => {
            const originalNotification = globalThis.Notification
            // @ts-expect-error test shim
            delete globalThis.Notification
            await expect(growReminderService.requestPermission()).resolves.toBe('denied')
            globalThis.Notification = originalNotification
        })

        it('returns granted when permission is already granted', async () => {
            vi.stubGlobal('Notification', {
                permission: 'granted',
                requestPermission: vi.fn(),
            })
            await expect(growReminderService.requestPermission()).resolves.toBe('granted')
        })

        it('requests permission when not yet granted', async () => {
            const requestPermission = vi.fn().mockResolvedValue('default')
            vi.stubGlobal('Notification', {
                permission: 'default',
                requestPermission,
            })
            await expect(growReminderService.requestPermission()).resolves.toBe('default')
            expect(requestPermission).toHaveBeenCalled()
        })
    })

    describe('registerPeriodicSync', () => {
        it('registers periodic sync when supported', async () => {
            const register = vi.fn().mockResolvedValue(undefined)
            const registration = { periodicSync: { register } }
            await growReminderService.registerPeriodicSync(
                registration as unknown as ServiceWorkerRegistration,
            )
            expect(register).toHaveBeenCalledWith('grow-reminders', {
                minInterval: 6 * 60 * 60 * 1000,
            })
        })

        it('falls back to background sync when periodic sync is unavailable', async () => {
            const register = vi.fn().mockResolvedValue(undefined)
            const registration = {
                sync: { register },
            }
            await growReminderService.registerPeriodicSync(
                registration as unknown as ServiceWorkerRegistration,
            )
            expect(register).toHaveBeenCalledWith('grow-reminders-sync')
        })

        it('no-ops when no service worker registration exists', async () => {
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue(undefined),
                },
            })
            await expect(growReminderService.registerPeriodicSync()).resolves.toBeUndefined()
        })
    })

    describe('service worker messaging', () => {
        it('syncRemindersToWorker posts to the active controller', async () => {
            const postMessage = vi.fn()
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    controller: { postMessage },
                    getRegistration: vi.fn().mockResolvedValue(undefined),
                },
            })

            const reminders = [
                {
                    id: 'p1-watering',
                    plantId: 'p1',
                    plantName: 'Plant One',
                    type: 'watering' as const,
                    title: 'Water',
                    body: 'Low moisture',
                    severity: 'warning' as const,
                    dueAt: 1,
                },
            ]

            await growReminderService.syncRemindersToWorker(reminders)
            expect(postMessage).toHaveBeenCalledWith({
                type: 'UPDATE_REMINDERS',
                payload: reminders,
            })
        })

        it('syncRemindersToWorker posts to registration.active when controller is missing', async () => {
            const postMessage = vi.fn()
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    controller: null,
                    getRegistration: vi.fn().mockResolvedValue({
                        active: { postMessage },
                    }),
                },
            })

            await growReminderService.syncRemindersToWorker([])
            expect(postMessage).toHaveBeenCalledWith({
                type: 'UPDATE_REMINDERS',
                payload: [],
            })
        })

        it('triggerWorkerReminderCheck posts a reminder-check request', async () => {
            const postMessage = vi.fn()
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    controller: { postMessage },
                    getRegistration: vi.fn().mockResolvedValue(undefined),
                },
            })

            await growReminderService.triggerWorkerReminderCheck()
            expect(postMessage).toHaveBeenCalledWith({ type: 'REQUEST_REMINDER_CHECK' })
        })
    })

    describe('notifyDueReminders', () => {
        const reminders = [
            {
                id: 'p1-watering',
                plantId: 'p1',
                plantName: 'Plant One',
                type: 'watering' as const,
                title: 'Watering reminder: Plant One',
                body: 'Moisture is low.',
                severity: 'warning' as const,
                dueAt: Date.now(),
            },
        ]

        it('skips notifications when permission is not granted', async () => {
            const showNotification = vi.fn()
            vi.stubGlobal('Notification', { permission: 'denied' })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({ showNotification }),
                },
            })

            await growReminderService.notifyDueReminders(reminders, makeSettings())
            expect(showNotification).not.toHaveBeenCalled()
        })

        it('skips notifications during quiet hours', async () => {
            const showNotification = vi.fn()
            vi.stubGlobal('Notification', { permission: 'granted' })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({ showNotification }),
                },
            })

            vi.spyOn(Date.prototype, 'getHours').mockReturnValue(23)
            vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)

            await growReminderService.notifyDueReminders(
                reminders,
                makeSettings({
                    quietHours: { enabled: true, start: '22:00', end: '07:00' },
                }),
            )
            expect(showNotification).not.toHaveBeenCalled()
        })

        it('shows a service worker notification for enabled reminders', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            await growReminderService.notifyDueReminders(reminders, makeSettings())
            expect(showNotification).toHaveBeenCalled()
            expect(localStorage.getItem('cg.reminders.lastNotified')).toContain('p1')
        })

        it('falls back to the Notification constructor without a service worker', async () => {
            const notificationCtor = vi.fn()
            vi.stubGlobal('Notification', notificationCtor)
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue(undefined),
                },
            })

            await growReminderService.notifyDueReminders(reminders, makeSettings())
            expect(notificationCtor).toHaveBeenCalled()
        })

        it('respects per-type notification settings', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            await growReminderService.notifyDueReminders(
                reminders,
                makeSettings({ lowWaterWarning: false, newTask: false }),
            )
            expect(showNotification).not.toHaveBeenCalled()
        })

        it('does not re-notify batches within the cooldown window', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            localStorage.setItem('cg.reminders.lastNotified', JSON.stringify({ p1: Date.now() }))

            await growReminderService.notifyDueReminders(reminders, makeSettings())
            expect(showNotification).not.toHaveBeenCalled()
        })

        it('filters reminders to a target plant id', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            const mixed = [
                ...reminders,
                {
                    id: 'p2-vpd',
                    plantId: 'p2',
                    plantName: 'Plant Two',
                    type: 'vpd' as const,
                    title: 'VPD alarm for Plant Two',
                    body: 'Out of range',
                    severity: 'warning' as const,
                    dueAt: Date.now(),
                },
            ]

            await growReminderService.notifyDueReminders(mixed, makeSettings(), 'p2')
            expect(showNotification).toHaveBeenCalledWith(
                'VPD alarm for Plant Two',
                expect.objectContaining({ body: 'Out of range' }),
            )
        })

        it('skips harvest reminders when harvest notifications are disabled', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            const harvestOnly = [
                {
                    id: 'p1-harvest',
                    plantId: 'p1',
                    plantName: 'Plant One',
                    type: 'harvest' as const,
                    title: 'Harvest reminder: Plant One',
                    body: 'Soon',
                    severity: 'info' as const,
                    dueAt: Date.now(),
                },
            ]

            await growReminderService.notifyDueReminders(
                harvestOnly,
                makeSettings({ harvestReady: false }),
            )
            expect(showNotification).not.toHaveBeenCalled()
        })

        it('skips notifications when the master toggle is disabled', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            await growReminderService.notifyDueReminders(reminders, makeSettings({ enabled: false }))
            expect(showNotification).not.toHaveBeenCalled()
        })

        it('delivers notifications outside overnight quiet hours', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            vi.spyOn(Date.prototype, 'getHours').mockReturnValue(12)
            vi.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0)

            await growReminderService.notifyDueReminders(
                reminders,
                makeSettings({
                    quietHours: { enabled: true, start: '22:00', end: '07:00' },
                }),
            )
            expect(showNotification).toHaveBeenCalled()
        })

        it('ignores invalid quiet-hour values and still notifies', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            await growReminderService.notifyDueReminders(
                reminders,
                makeSettings({
                    quietHours: { enabled: true, start: 'invalid', end: '07:00' },
                }),
            )
            expect(showNotification).toHaveBeenCalled()
        })

        it('skips VPD reminders when problem detection notifications are disabled', async () => {
            const showNotification = vi.fn().mockResolvedValue(undefined)
            vi.stubGlobal('Notification', vi.fn())
            Object.defineProperty(globalThis.Notification, 'permission', {
                configurable: true,
                value: 'granted',
            })
            vi.stubGlobal('navigator', {
                serviceWorker: {
                    getRegistration: vi.fn().mockResolvedValue({
                        scope: 'https://example.test/',
                        showNotification,
                    }),
                },
            })

            const vpdOnly = [
                {
                    id: 'p1-vpd',
                    plantId: 'p1',
                    plantName: 'Plant One',
                    type: 'vpd' as const,
                    title: 'VPD alarm for Plant One',
                    body: 'Out of range',
                    severity: 'warning' as const,
                    dueAt: Date.now(),
                },
            ]

            await growReminderService.notifyDueReminders(
                vpdOnly,
                makeSettings({ problemDetected: false }),
            )
            expect(showNotification).not.toHaveBeenCalled()
        })
    })
})
