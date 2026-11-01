import { describe, expect, it } from 'vitest'
import { PlantStage, type Plant } from '@/types'
import {
    runDailySynthesis,
    type DailySimulationDeps,
} from '@/services/simulation/dailySimulationLoop'

const deps: DailySimulationDeps = {
    clonePlant: (plant) => ({
        ...plant,
        biomass: { ...plant.biomass },
        strain: { ...plant.strain },
        cannabinoidProfile: { ...plant.cannabinoidProfile },
        terpeneProfile: { ...plant.terpeneProfile },
    }),
    applyEnvironmentalCorrections: (plant) => plant,
}

const floweringPlant = (strain: Plant['strain']): Plant =>
    ({
        stage: PlantStage.Flowering,
        health: 100,
        stressLevel: 0,
        biomass: { flowers: 5 },
        strain,
        cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
        terpeneProfile: {},
    }) as Plant

describe('runDailySynthesis', () => {
    it('does not write NaN when the cultivar omitted THC and CBD', () => {
        const strain = { id: 'bare', name: 'Bare' } as Plant['strain']
        const after = runDailySynthesis(floweringPlant(strain), deps)
        expect(after.cannabinoidProfile.thc).toBe(0)
        expect(after.cannabinoidProfile.cbd).toBe(0)
        expect(Number.isNaN(after.cannabinoidProfile.thc)).toBe(false)
    })

    it('splits new cannabinoids when THC was reported', () => {
        const strain = { id: 'known', name: 'Known', thc: 20 } as Plant['strain']
        const after = runDailySynthesis(floweringPlant(strain), deps)
        expect(after.cannabinoidProfile.thc).toBeGreaterThan(0)
        expect(after.cannabinoidProfile.cbd).toBeGreaterThan(0)
    })

    it('does not add production when CBD is reported as zero and THC is absent', () => {
        const strain = { id: 'zero-cbd', name: 'Zero CBD', cbd: 0 } as Plant['strain']
        const after = runDailySynthesis(floweringPlant(strain), deps)
        expect(after.cannabinoidProfile.thc).toBe(0)
        expect(after.cannabinoidProfile.cbd).toBe(0)
    })
})
