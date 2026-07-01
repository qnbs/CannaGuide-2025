import { PlantStage, View, KnowledgeViewTab } from '@/types'

export type GraphNodeType =
    | 'disease'
    | 'lexicon'
    | 'guide'
    | 'learningPath'
    | 'plant'
    | 'journal'
    | 'strain'
    | 'stage'
    | 'nutrient'
    | 'terpene'
    | 'calculator'

export interface GraphNode {
    readonly id: string
    readonly type: GraphNodeType
    readonly label: string
    readonly meta: Record<string, unknown>
}

export type EdgeRelation =
    | 'RELATES_TO'
    | 'TREATS'
    | 'AFFECTS_STAGE'
    | 'LOGGED_FOR'
    | 'USES_STRAIN'
    | 'HAS_TERPENE'
    | 'DEFICIENCY_OF'
    | 'COVERED_BY'
    | 'REFERENCES'

export interface GraphEdge {
    readonly source: string
    readonly target: string
    readonly relation: EdgeRelation
    readonly weight: number
}

export interface CrossModuleLink {
    readonly id: string
    readonly label: string
    readonly nodeType: GraphNodeType
    readonly targetView: View
    readonly targetTab?: KnowledgeViewTab | string | undefined
    readonly targetId?: string | undefined
    readonly relevanceScore: number
    readonly relationPath: string
}

export interface QueryContext {
    readonly plantId?: string | undefined
    readonly currentStage?: PlantStage | undefined
    readonly diseaseId?: string | undefined
    readonly strainName?: string | undefined
    readonly keywords?: string[] | undefined
    readonly currentView?: View | undefined
    readonly currentTab?: KnowledgeViewTab | undefined
    readonly maxResults?: number | undefined
}

export interface GraphStore {
    readonly nodes: Map<string, GraphNode>
    readonly edges: GraphEdge[]
    readonly adjacency: Map<string, Set<number>>
}

export type AddNodeFn = (node: GraphNode) => void
export type AddEdgeFn = (edge: GraphEdge) => void

export interface GraphMutators {
    readonly nodes: Map<string, GraphNode>
    readonly addNode: AddNodeFn
    readonly addEdge: AddEdgeFn
}
