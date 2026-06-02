import { describe, expect, it } from 'vitest'
import type { SimulationSettings } from '@/services/simulation/simulationProfiles'
import {
    ENVIRONMENTAL_DRIFT,
    getSimulationProfileCurve,
    SIMULATION_PROFILE_CURVES,
} from '@/services/simulation/simulationProfiles'

describe('simulationProfiles', () => {
    it('returns intermediate curve by default', () => {
        expect(getSimulationProfileCurve()).toEqual(SIMULATION_PROFILE_CURVES.intermediate)
    })

    it('returns expert curve when profile is expert', () => {
        expect(
            getSimulationProfileCurve({ simulationProfile: 'expert' } as SimulationSettings),
        ).toEqual(SIMULATION_PROFILE_CURVES.expert)
    })

    it('exposes environmental drift bounds', () => {
        expect(ENVIRONMENTAL_DRIFT.tempBounds.max).toBeGreaterThan(
            ENVIRONMENTAL_DRIFT.tempBounds.min,
        )
    })
})
