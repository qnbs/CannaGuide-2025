import { KnowledgeArticle, PlantStage, ProblemType } from '@/types'

export const knowledgeBase: KnowledgeArticle[] = [
    {
        id: 'phase1-prep',
        titleKey: 'knowledgeView.knowledgebase.phase1-prep.title',
        contentKey: 'knowledgeView.knowledgebase.phase1-prep.content',
        tags: ['preparation', 'setup', 'tent', 'light', 'environment'],
        triggers: {
            ageInDays: { min: 0, max: 1 },
            plantStage: PlantStage.Seed,
        },
    },
    {
        id: 'phase2-seedling',
        titleKey: 'knowledgeView.knowledgebase.phase2-seedling.title',
        contentKey: 'knowledgeView.knowledgebase.phase2-seedling.content',
        tags: ['seedling', 'germination', 'early stage', 'watering', 'humidity'],
        triggers: {
            plantStage: [PlantStage.Germination, PlantStage.Seedling],
        },
    },
    {
        id: 'phase3-vegetative',
        titleKey: 'knowledgeView.knowledgebase.phase3-vegetative.title',
        contentKey: 'knowledgeView.knowledgebase.phase3-vegetative.content',
        tags: ['vegetative', 'growth', 'training', 'nutrients', 'topping', 'lst'],
        triggers: {
            plantStage: PlantStage.Vegetative,
        },
    },
    {
        id: 'phase4-flowering',
        titleKey: 'knowledgeView.knowledgebase.phase4-flowering.title',
        contentKey: 'knowledgeView.knowledgebase.phase4-flowering.content',
        tags: ['flowering', 'stretch', 'nutrients', 'pk boost', 'light cycle', 'humidity'],
        triggers: {
            plantStage: PlantStage.Flowering,
        },
    },
    {
        id: 'phase5-harvest',
        titleKey: 'knowledgeView.knowledgebase.phase5-harvest.title',
        contentKey: 'knowledgeView.knowledgebase.phase5-harvest.content',
        tags: ['harvest', 'drying', 'curing', 'trichomes', 'trimming'],
        triggers: {
            plantStage: [PlantStage.Harvest, PlantStage.Drying, PlantStage.Curing],
        },
    },
    {
        id: 'fix-overwatering',
        titleKey: 'knowledgeView.knowledgebase.fix-overwatering.title',
        contentKey: 'knowledgeView.knowledgebase.fix-overwatering.content',
        tags: ['problem', 'fix', 'overwatering', 'watering', 'roots', 'droopy'],
        triggers: {
            activeProblems: [ProblemType.Overwatering],
        },
    },
    {
        id: 'fix-calcium-deficiency',
        titleKey: 'knowledgeView.knowledgebase.fix-calcium-deficiency.title',
        contentKey: 'knowledgeView.knowledgebase.fix-calcium-deficiency.content',
        tags: ['problem', 'fix', 'calcium', 'deficiency', 'calmag', 'nutrients', 'ph'],
        triggers: {
            activeProblems: [ProblemType.NutrientDeficiency],
        },
    },
    {
        id: 'fix-nutrient-burn',
        titleKey: 'knowledgeView.knowledgebase.fix-nutrient-burn.title',
        contentKey: 'knowledgeView.knowledgebase.fix-nutrient-burn.content',
        tags: ['problem', 'fix', 'nutrient burn', 'overfeeding', 'ec'],
        triggers: {}, // Can be triggered by high EC in the future
    },
    {
        id: 'fix-pests',
        titleKey: 'knowledgeView.knowledgebase.fix-pests.title',
        contentKey: 'knowledgeView.knowledgebase.fix-pests.content',
        tags: ['problem', 'fix', 'pests', 'spider mites', 'fungus gnats', 'neem oil'],
        triggers: {
            activeProblems: [ProblemType.PestInfestation],
        },
    },
    {
        id: 'concept-training',
        titleKey: 'knowledgeView.knowledgebase.concept-training.title',
        contentKey: 'knowledgeView.knowledgebase.concept-training.content',
        tags: ['concept', 'training', 'lst', 'topping', 'yield'],
        triggers: {
            plantStage: PlantStage.Vegetative,
        },
    },
    {
        id: 'concept-environment',
        titleKey: 'knowledgeView.knowledgebase.concept-environment.title',
        contentKey: 'knowledgeView.knowledgebase.concept-environment.content',
        tags: ['concept', 'environment', 'temperature', 'humidity', 'airflow', 'vpd'],
        triggers: {},
    },
    {
        id: 'tech-dynamic-lighting',
        titleKey: 'knowledgeView.growTech.categories.dynamicLighting.title',
        contentKey: 'knowledgeView.growTech.categories.dynamicLighting.content',
        tags: ['technology', 'led', 'lighting', 'spectrum', 'dynamic', '2026'],
        triggers: {},
    },
    {
        id: 'tech-sensors-iot',
        titleKey: 'knowledgeView.growTech.categories.sensorsIoT.title',
        contentKey: 'knowledgeView.growTech.categories.sensorsIoT.content',
        tags: ['technology', 'sensors', 'iot', 'vpd', 'automation', 'mqtt', '2026'],
        triggers: {},
    },
    {
        id: 'tech-ai-automation',
        titleKey: 'knowledgeView.growTech.categories.aiAutomation.title',
        contentKey: 'knowledgeView.growTech.categories.aiAutomation.content',
        tags: ['technology', 'ai', 'automation', 'diagnostics', '2026'],
        triggers: {},
    },
    {
        id: 'tech-digital-twin',
        titleKey: 'knowledgeView.growTech.categories.digitalTwin.title',
        contentKey: 'knowledgeView.growTech.categories.digitalTwin.content',
        tags: ['technology', 'digital twin', 'simulation', 'sandbox', '2026'],
        triggers: {},
    },
    {
        id: 'tech-hydroponics-aeroponics',
        titleKey: 'knowledgeView.growTech.categories.hydroAero.title',
        contentKey: 'knowledgeView.growTech.categories.hydroAero.content',
        tags: ['technology', 'hydroponics', 'aeroponics', 'soilless', '2026'],
        triggers: {},
    },
    {
        id: 'tech-tissue-culture',
        titleKey: 'knowledgeView.growTech.categories.tissueCulture.title',
        contentKey: 'knowledgeView.growTech.categories.tissueCulture.content',
        tags: ['technology', 'tissue culture', 'cloning', 'genetics', '2026'],
        triggers: {},
    },
    {
        id: 'tech-sustainability',
        titleKey: 'knowledgeView.growTech.categories.sustainability.title',
        contentKey: 'knowledgeView.growTech.categories.sustainability.content',
        tags: ['technology', 'sustainability', 'post-harvest', 'curing', 'energy', '2026'],
        triggers: {},
    },
]
