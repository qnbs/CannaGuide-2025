// ---------------------------------------------------------------------------
// knowledgeGraphService -- Unified Knowledge Graph for CannaGuide 2025
//
// Provides a central graph-based query engine that connects all data domains:
// Strains <-> Diseases <-> Nutrients <-> Journal <-> IoT <-> Lexicon <-> Guides
//
// The graph is populated lazily from static data + Redux state and enables
// cross-module "Related Knowledge" queries, contextual AI enrichment,
// and intelligent navigation suggestions.
//
// All queries are synchronous (in-memory graph) -- no async overhead.
// ---------------------------------------------------------------------------

import type { Plant, Strain } from '@/types'
import { injectPlants as injectPlantsData, injectStrainTerpenes as injectStrainTerpenesData } from './injection'
import * as queries from './queries'
import { indexStaticData } from './staticIndexers'
import type {
    CrossModuleLink,
    GraphEdge,
    GraphMutators,
    GraphNode,
    GraphNodeType,
    GraphStore,
    QueryContext,
} from './types'

export type {
    CrossModuleLink,
    EdgeRelation,
    GraphEdge,
    GraphNode,
    GraphNodeType,
    QueryContext,
} from './types'

class KnowledgeGraph {
    private nodes = new Map<string, GraphNode>()
    private edges: GraphEdge[] = []
    private adjacency = new Map<string, Set<number>>()
    private _initialized = false

    private get store(): GraphStore {
        return { nodes: this.nodes, edges: this.edges, adjacency: this.adjacency }
    }

    private get mutators(): GraphMutators {
        return {
            nodes: this.nodes,
            addNode: (node) => this.addNode(node),
            addEdge: (edge) => this.addEdge(edge),
        }
    }

    /**
     * Lazily initializes the graph with static data.
     * Safe to call multiple times -- subsequent calls are no-ops.
     */
    initialize(): void {
        if (this._initialized) return
        this._initialized = true
        indexStaticData(this.nodes, (node) => this.addNode(node), (edge) => this.addEdge(edge))
    }

    get isInitialized(): boolean {
        return this._initialized
    }

    get nodeCount(): number {
        return this.nodes.size
    }

    get edgeCount(): number {
        return this.edges.length
    }

    private addNode(node: GraphNode): void {
        this.nodes.set(node.id, node)
    }

    private addEdge(edge: GraphEdge): void {
        const idx = this.edges.length
        this.edges.push(edge)

        if (!this.adjacency.has(edge.source)) {
            this.adjacency.set(edge.source, new Set())
        }
        this.adjacency.get(edge.source)?.add(idx)

        if (!this.adjacency.has(edge.target)) {
            this.adjacency.set(edge.target, new Set())
        }
        this.adjacency.get(edge.target)?.add(idx)
    }

    /**
     * Injects live plant data into the graph for cross-referencing.
     * Call this when plants change (debounced from Redux listener).
     */
    injectPlants(plants: Plant[]): void {
        injectPlantsData(this.mutators, plants)
    }

    /**
     * Injects strain terpene profiles into the graph.
     */
    injectStrainTerpenes(strains: Strain[]): void {
        injectStrainTerpenesData(this.mutators, strains)
    }

    getNeighbors(nodeId: string): GraphNode[] {
        return queries.getNeighbors(this.store, nodeId)
    }

    getEdgesFor(nodeId: string): GraphEdge[] {
        return queries.getEdgesFor(this.store, nodeId)
    }

    getNode(nodeId: string): GraphNode | undefined {
        return queries.getNode(this.store, nodeId)
    }

    getNodesByType(type: GraphNodeType): GraphNode[] {
        return queries.getNodesByType(this.store, type)
    }

    traverse(
        seedId: string,
        maxHops: number = 2,
        filterType?: GraphNodeType,
    ): Array<{ node: GraphNode; hops: number; weight: number }> {
        return queries.traverse(this.store, seedId, maxHops, filterType)
    }

    /**
     * Core public API: Get cross-module links relevant to a given context.
     */
    getRelatedLinks(context: QueryContext): CrossModuleLink[] {
        this.initialize()
        return queries.getRelatedLinks(this.store, context)
    }

    /**
     * Build AI context string from graph for a given plant/stage/disease.
     * Used by the Context Bridge to enrich AI prompts.
     */
    buildAiContext(context: QueryContext): string {
        this.initialize()
        return queries.buildAiContext(this.store, context)
    }

    getStats(): { nodeCount: number; edgeCount: number } {
        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.length,
        }
    }
}

export const knowledgeGraph = new KnowledgeGraph()
