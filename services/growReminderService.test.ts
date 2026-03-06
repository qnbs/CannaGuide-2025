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
})
