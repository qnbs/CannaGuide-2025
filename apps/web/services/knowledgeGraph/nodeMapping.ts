import { View, KnowledgeViewTab } from '@/types'
import type { CrossModuleLink, GraphNode, GraphNodeType } from './types'

export const nodeTypeToViewMapping: Record<
    GraphNodeType,
    { view: View; tab?: KnowledgeViewTab } | undefined
> = {
    disease: { view: View.Knowledge, tab: KnowledgeViewTab.Atlas },
    lexicon: { view: View.Knowledge, tab: KnowledgeViewTab.Lexikon },
    guide: { view: View.Knowledge, tab: KnowledgeViewTab.Guide },
    learningPath: { view: View.Knowledge, tab: KnowledgeViewTab.Lernpfad },
    calculator: { view: View.Knowledge, tab: KnowledgeViewTab.Rechner },
    plant: { view: View.Plants },
    journal: { view: View.Plants },
    strain: { view: View.Strains },
    stage: undefined,
    nutrient: { view: View.Knowledge, tab: KnowledgeViewTab.Lexikon },
    terpene: { view: View.Knowledge, tab: KnowledgeViewTab.Lexikon },
}

export function nodeToLink(
    node: GraphNode,
    weight: number,
    path: string,
): CrossModuleLink | undefined {
    const mapping = nodeTypeToViewMapping[node.type]
    if (!mapping) return undefined

    return {
        id: node.id,
        label: node.label,
        nodeType: node.type,
        targetView: mapping.view,
        targetTab: mapping.tab,
        targetId: node.id.split(':')[1],
        relevanceScore: weight,
        relationPath: path,
    }
}
