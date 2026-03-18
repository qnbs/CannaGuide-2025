import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PlantStage } from '@/types'

// Mock plantSimulationService before import
vi.mock('@/services/plantSimulationService', () => ({
    PLANT_STAGE_DETAILS: {
        [PlantStage.Seed]: { duration: 3, idealVitals: { vpd: { min: 0.4, max: 0.8 } } },
        [PlantStage.Germination]: { duration: 5, idealVitals: { vpd: { min: 0.4, max: 0.8 } } },
        [PlantStage.Seedling]: { duration: 14, idealVitals: { vpd: { min: 0.4, max: 0.8 } } },
        [PlantStage.Vegetative]: { duration: 28, idealVitals: { vpd: { min: 0.8, max: 1.2 } } },
        [PlantStage.Flowering]: { duration: 56, idealVitals: { vpd: { min: 1.0, max: 1.5 } } },
        [PlantStage.Harvest]: { duration: Infinity, idealVitals: { vpd: { min: 0.8, max: 1.2 } } },
    },
}))

import { growReminderService } from '@/services/growReminderService'

const makePlant = (overrides: Partial<any> = {}) => ({
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
})

describe('GrowReminderService', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    describe('buildReminders', () => {
        it('returns empty array for empty plant list', () => {
            expect(growReminderService.buildReminders([])).toEqual([])
        })

        it('generates VPD alarm when VPD is out of range', () => {
            const plant = makePlant({ environment: { temperature: 25, humidity: 60, vpd: 2.0, co2: 400 } })
            const reminders = growReminderService.buildReminders([plant as any])
            const vpdReminder = reminders.find(r => r.type === 'vpd')
            expect(vpdReminder).toBeDefined()
            expect(vpdReminder!.severity).toBe('warning')
        })

        it('does not generate VPD alarm when VPD is in range', () => {
            const plant = makePlant({ environment: { temperature: 25, humidity: 60, vpd: 1.0, co2: 400 } })
            const reminders = growReminderService.buildReminders([plant as any])
            const vpdReminder = reminders.find(r => r.type === 'vpd')
            expect(vpdReminder).toBeUndefined()
        })

        it('generates watering reminder for low moisture', () => {
            const plant = makePlant({ medium: { moisture: 30, ph: 6.5, ec: 1.2 } })
            const reminders = growReminderService.buildReminders([plant as any])
            const waterReminder = reminders.find(r => r.type === 'watering')
            expect(waterReminder).toBeDefined()
            expect(waterReminder!.severity).toBe('warning')
        })

        it('generates critical watering reminder for very low moisture', () => {
            const plant = makePlant({ medium: { moisture: 20, ph: 6.5, ec: 1.2 } })
            const reminders = growReminderService.buildReminders([plant as any])
            const waterReminder = reminders.find(r => r.type === 'watering')
            expect(waterReminder).toBeDefined()
            expect(waterReminder!.severity).toBe('critical')
        })

        it('does not generate watering reminder for adequate moisture', () => {
            const plant = makePlant({ medium: { moisture: 60, ph: 6.5, ec: 1.2 } })
            const reminders = growReminderService.buildReminders([plant as any])
            const waterReminder = reminders.find(r => r.type === 'watering')
            expect(waterReminder).toBeUndefined()
        })

        it('generates harvest reminder for plants at harvest stage', () => {
            const plant = makePlant({ stage: PlantStage.Harvest, age: 110 })
            const reminders = growReminderService.buildReminders([plant as any])
            const harvestReminder = reminders.find(r => r.type === 'harvest')
            expect(harvestReminder).toBeDefined()
        })

        it('handles multiple plants', () => {
            const plants = [
                makePlant({ id: 'p1', medium: { moisture: 20, ph: 6.5, ec: 1.2 } }),
                makePlant({ id: 'p2', environment: { temperature: 25, humidity: 60, vpd: 2.0, co2: 400 } }),
            ]
            const reminders = growReminderService.buildReminders(plants as any[])
            expect(reminders.length).toBeGreaterThanOrEqual(2)
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
            expect(batches[0].plantId).toBe('p1')
            expect(batches[0].reminders).toHaveLength(2)
            expect(batches[0].severity).toBe('critical')
            expect(batches[0].title).toBe('2 reminders for Plant One')
        })
    })
})
