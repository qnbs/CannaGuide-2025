import { KnowledgeArticle, PlantStage, ProblemType } from '@/types';

export const knowledgeBase: KnowledgeArticle[] = [
    {
        id: 'phase1-prep',
        titleKey: 'knowledgeView.knowledgebase.phase1-prep.title',
        contentKey: 'knowledgeView.knowledgebase.phase1-prep.content',
        tags: ['preparation', 'setup', 'tent', 'light', 'environment'],
        triggers: {
            ageInDays: { min: 0, max: 1 },
            plantStage: PlantStage.Seed,
        }
    },
    {
        id: 'phase2-seedling',
        titleKey: 'knowledgeView.knowledgebase.phase2-seedling.title',
        contentKey: 'knowledgeView.knowledgebase.phase2-seedling.content',
        tags: ['seedling', 'germination', 'early stage', 'watering', 'humidity'],
        triggers: {
            plantStage: [PlantStage.Germination, PlantStage.Seedling],
        }
    },
    {
        id: 'phase3-vegetative',
        titleKey: 'knowledgeView.knowledgebase.phase3-vegetative.title',
        contentKey: 'knowledgeView.knowledgebase.phase3-vegetative.content',
        tags: ['vegetative', 'growth', 'training', 'nutrients', 'topping', 'lst'],
        triggers: {
            plantStage: PlantStage.Vegetative,
        }
    },
    {
        id: 'phase4-flowering',
        titleKey: 'knowledgeView.knowledgebase.phase4-flowering.title',
        contentKey: 'knowledgeView.knowledgebase.phase4-flowering.content',
        tags: ['flowering', 'stretch', 'nutrients', 'pk boost', 'light cycle', 'humidity'],
        triggers: {
            plantStage: PlantStage.Flowering,
        }
    },
    {
        id: 'phase5-harvest',
        titleKey: 'knowledgeView.knowledgebase.phase5-harvest.title',
        contentKey: 'knowledgeView.knowledgebase.phase5-harvest.content',
        tags: ['harvest', 'drying', 'curing', 'trichomes', 'trimming'],
        triggers: {
            plantStage: [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing],
        }
    },
    {
        id: 'fix-overwatering',
        titleKey: 'knowledgeView.knowledgebase.fix-overwatering.title',
        contentKey: 'knowledgeView.knowledgebase.fix-overwatering.content',
        tags: ['problem', 'fix', 'overwatering', 'watering', 'roots', 'droopy'],
        triggers: {
            // FIX: Replaced string literal with enum member to match ProblemType.
            activeProblems: [ProblemType.Overwatering]
        }
    },
    {
        id: 'fix-calcium-deficiency',
        titleKey: 'knowledgeView.knowledgebase.fix-calcium-deficiency.title',
        contentKey: 'knowledgeView.knowledgebase.fix-calcium-deficiency.content',
        tags: ['problem', 'fix', 'calcium', 'deficiency', 'calmag', 'nutrients', 'ph'],
        triggers: {
            // FIX: Replaced string literal with enum member to match ProblemType.
            activeProblems: [ProblemType.NutrientDeficiency]
        }
    },
];