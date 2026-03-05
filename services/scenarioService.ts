import { Scenario } from '@/types';

const scenarios: Scenario[] = [
    {
        id: 'temperature-plus-2c',
        titleKey: 'Temperature +2 C',
        descriptionKey: 'What happens if canopy temperature increases by 2 C?',
        title: 'Temperature +2 C',
        description: 'Compares baseline conditions against a +2 C environment shift.',
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
];

class ScenarioService {
    getScenarioById(id: string): Scenario | undefined {
        return scenarios.find(s => s.id === id);
    }

    getAllScenarios(): Scenario[] {
        return scenarios;
    }
}

export const scenarioService = new ScenarioService();
