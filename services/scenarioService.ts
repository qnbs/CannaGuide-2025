import { Scenario } from '@/types';

const scenarios: Scenario[] = [
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
