import { diseaseAtlas } from '@/data/diseases'
import { lexiconData } from '@/data/lexicon'
import { learningPaths } from '@/data/learningPaths'
import { PlantStage } from '@/types'
import type { AddEdgeFn, AddNodeFn } from './types'

const tagToStageMap: Record<string, PlantStage> = {
    setup: PlantStage.Seed,
    germination: PlantStage.Germination,
    seedling: PlantStage.Seedling,
    vegetative: PlantStage.Vegetative,
    basics: PlantStage.Seedling,
    flowering: PlantStage.Flowering,
    harvest: PlantStage.Harvest,
    curing: PlantStage.Curing,
    watering: PlantStage.Vegetative,
}

export function indexDiseases(addNode: AddNodeFn, addEdge: AddEdgeFn): void {
    for (const d of diseaseAtlas) {
        addNode({
            id: `disease:${d.id}`,
            type: 'disease',
            label: d.id,
            meta: {
                category: d.category,
                severity: d.severity,
                urgency: d.urgency,
                nameKey: d.nameKey,
                colorToken: d.colorToken,
            },
        })

        for (const lexKey of d.relatedLexiconKeys) {
            addEdge({
                source: `disease:${d.id}`,
                target: `lexicon:${lexKey}`,
                relation: 'RELATES_TO',
                weight: 0.8,
            })
        }

        for (const articleId of d.relatedArticleIds) {
            addEdge({
                source: `disease:${d.id}`,
                target: `guide:${articleId}`,
                relation: 'TREATS',
                weight: 0.9,
            })
        }

        for (const stage of d.affectedStages) {
            addEdge({
                source: `disease:${d.id}`,
                target: `stage:${stage}`,
                relation: 'AFFECTS_STAGE',
                weight: 0.7,
            })
        }
    }
}

export function indexLexicon(addNode: AddNodeFn, addEdge: AddEdgeFn): void {
    for (const entry of lexiconData) {
        addNode({
            id: `lexicon:${entry.key}`,
            type: 'lexicon',
            label: entry.key,
            meta: { category: entry.category },
        })

        if (entry.category === 'Terpene') {
            addEdge({
                source: `lexicon:${entry.key}`,
                target: `terpene:${entry.key}`,
                relation: 'REFERENCES',
                weight: 1.0,
            })
            addNode({
                id: `terpene:${entry.key}`,
                type: 'terpene',
                label: entry.key,
                meta: {},
            })
        }

        if (entry.category === 'Nutrient') {
            addNode({
                id: `nutrient:${entry.key}`,
                type: 'nutrient',
                label: entry.key,
                meta: {},
            })
            addEdge({
                source: `lexicon:${entry.key}`,
                target: `nutrient:${entry.key}`,
                relation: 'REFERENCES',
                weight: 1.0,
            })
        }
    }
}

export function indexLearningPaths(addNode: AddNodeFn, addEdge: AddEdgeFn): void {
    for (const lp of learningPaths) {
        addNode({
            id: `learningPath:${lp.id}`,
            type: 'learningPath',
            label: lp.id,
            meta: {
                titleKey: lp.titleKey,
                level: lp.targetLevel,
                minutes: lp.estimatedMinutes,
                tags: lp.tags,
            },
        })

        for (const tag of lp.tags) {
            const stageMatch = tagToStageMap[tag]
            if (stageMatch) {
                addEdge({
                    source: `learningPath:${lp.id}`,
                    target: `stage:${stageMatch}`,
                    relation: 'COVERED_BY',
                    weight: 0.6,
                })
            }
        }

        for (const step of lp.steps) {
            if (step.referenceId) {
                addEdge({
                    source: `learningPath:${lp.id}`,
                    target: `guide:${step.referenceId}`,
                    relation: 'REFERENCES',
                    weight: 0.7,
                })
            }
        }
    }
}

export function indexCalculators(addNode: AddNodeFn, addEdge: AddEdgeFn): void {
    const calculators = ['vpd', 'nutrient', 'ph'] as const
    for (const calc of calculators) {
        addNode({
            id: `calculator:${calc}`,
            type: 'calculator',
            label: calc,
            meta: {},
        })
    }

    addEdge({
        source: 'calculator:vpd',
        target: 'lexicon:vpd',
        relation: 'REFERENCES',
        weight: 1.0,
    })

    addEdge({
        source: 'calculator:nutrient',
        target: 'lexicon:ecValue',
        relation: 'REFERENCES',
        weight: 0.9,
    })
    addEdge({
        source: 'calculator:ph',
        target: 'lexicon:phValue',
        relation: 'REFERENCES',
        weight: 0.9,
    })
}

export function indexNutrients(
    nodes: Map<string, { id: string }>,
    addNode: AddNodeFn,
    addEdge: AddEdgeFn,
): void {
    const nutrients = ['nitrogen', 'phosphorus', 'potassium', 'calcium', 'magnesium'] as const
    for (const n of nutrients) {
        const nodeId = `nutrient:${n}`
        if (!nodes.has(nodeId)) {
            addNode({ id: nodeId, type: 'nutrient', label: n, meta: {} })
        }
        addEdge({
            source: nodeId,
            target: `disease:${n}-deficiency`,
            relation: 'DEFICIENCY_OF',
            weight: 1.0,
        })
    }
}

export function indexStages(addNode: AddNodeFn): void {
    const stages: PlantStage[] = [
        PlantStage.Seed,
        PlantStage.Germination,
        PlantStage.Seedling,
        PlantStage.Vegetative,
        PlantStage.Flowering,
        PlantStage.Harvest,
        PlantStage.Drying,
        PlantStage.Curing,
        PlantStage.Finished,
    ]
    for (const s of stages) {
        addNode({ id: `stage:${s}`, type: 'stage', label: s, meta: {} })
    }
}

export function indexStaticData(
    nodes: Map<string, { id: string }>,
    addNode: AddNodeFn,
    addEdge: AddEdgeFn,
): void {
    indexDiseases(addNode, addEdge)
    indexLexicon(addNode, addEdge)
    indexLearningPaths(addNode, addEdge)
    indexCalculators(addNode, addEdge)
    indexNutrients(nodes, addNode, addEdge)
    indexStages(addNode)
}
