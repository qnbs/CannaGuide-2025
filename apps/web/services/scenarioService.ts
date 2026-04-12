import { Scenario } from '@/types'

const scenarios: Scenario[] = [
    {
        id: 'temperature-plus-2c',
        titleKey: 'knowledgeView.scenarios.tempPlus2c.title',
        descriptionKey: 'knowledgeView.scenarios.tempPlus2c.description',
        durationDays: 14,
        plantAModifier: { day: 1, action: 'NONE' },
        plantBModifier: { day: 1, action: 'TEMP_PLUS_2' },
    },
    {
        id: 'topping-vs-lst',
        titleKey: 'knowledgeView.scenarios.toppingVsLst.title',
        descriptionKey: 'knowledgeView.scenarios.toppingVsLst.description',
        durationDays: 14,
        plantAModifier: { day: 3, action: 'LST' },
        plantBModifier: { day: 3, action: 'TOP' },
    },
    {
        id: 'humidity-plus-10',
        titleKey: 'knowledgeView.scenarios.humidityPlus10.title',
        descriptionKey: 'knowledgeView.scenarios.humidityPlus10.description',
        durationDays: 14,
        plantAModifier: { day: 1, action: 'NONE' },
        plantBModifier: { day: 1, action: 'HUMIDITY_PLUS_10' },
    },
    {
        id: 'humidity-minus-10',
        titleKey: 'knowledgeView.scenarios.humidityMinus10.title',
        descriptionKey: 'knowledgeView.scenarios.humidityMinus10.description',
        durationDays: 14,
        plantAModifier: { day: 1, action: 'NONE' },
        plantBModifier: { day: 1, action: 'HUMIDITY_MINUS_10' },
    },
    {
        id: 'light-boost',
        titleKey: 'knowledgeView.scenarios.lightBoost.title',
        descriptionKey: 'knowledgeView.scenarios.lightBoost.description',
        durationDays: 14,
        plantAModifier: { day: 1, action: 'NONE' },
        plantBModifier: { day: 1, action: 'LIGHT_BOOST' },
    },
    {
        id: 'ph-drift-acidic',
        titleKey: 'knowledgeView.scenarios.phDriftAcidic.title',
        descriptionKey: 'knowledgeView.scenarios.phDriftAcidic.description',
        durationDays: 14,
        plantAModifier: { day: 1, action: 'NONE' },
        plantBModifier: { day: 1, action: 'PH_DRIFT_ACIDIC' },
    },
    {
        id: 'ec-ramp-up',
        titleKey: 'knowledgeView.scenarios.ecRampUp.title',
        descriptionKey: 'knowledgeView.scenarios.ecRampUp.description',
        durationDays: 14,
        plantAModifier: { day: 1, action: 'NONE' },
        plantBModifier: { day: 1, action: 'EC_RAMP' },
    },
    {
        id: 'defoliation-day-7',
        titleKey: 'knowledgeView.scenarios.defoliationDay7.title',
        descriptionKey: 'knowledgeView.scenarios.defoliationDay7.description',
        durationDays: 14,
        plantAModifier: { day: 1, action: 'NONE' },
        plantBModifier: { day: 7, action: 'DEFOLIATE' },
    },
]

class ScenarioService {
    getScenarioById(id: string): Scenario | undefined {
        return scenarios.find((s) => s.id === id)
    }

    getAllScenarios(): Scenario[] {
        return scenarios
    }
}

export const scenarioService = new ScenarioService()
