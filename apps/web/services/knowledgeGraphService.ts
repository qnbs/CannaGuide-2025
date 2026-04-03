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

import { diseaseAtlas } from '@/data/diseases'
import { lexiconData } from '@/data/lexicon'
import { learningPaths } from '@/data/learningPaths'
import type { Plant, PlantStage, Strain, KnowledgeViewTab, View } from '@/types'

// ---------------------------------------------------------------------------
// Graph Node & Edge Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cross-Module Link (returned to UI for navigation)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Knowledge Graph Implementation
// ---------------------------------------------------------------------------

class KnowledgeGraph {
    private nodes = new Map<string, GraphNode>()
    private edges: GraphEdge[] = []
    private adjacency = new Map<string, Set<number>>()
    private _initialized = false

    /**
     * Lazily initializes the graph with static data.
     * Safe to call multiple times -- subsequent calls are no-ops.
     */
    initialize(): void {
        if (this._initialized) return
        this._initialized = true

        this.indexDiseases()
        this.indexLexicon()
        this.indexLearningPaths()
        this.indexCalculators()
        this.indexNutrients()
        this.indexStages()
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

    // -- Graph mutation (internal) -----------------------------------------

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

    // -- Static data indexing -----------------------------------------------

    private indexDiseases(): void {
        for (const d of diseaseAtlas) {
            this.addNode({
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

            // Link disease -> related lexicon entries
            for (const lexKey of d.relatedLexiconKeys) {
                this.addEdge({
                    source: `disease:${d.id}`,
                    target: `lexicon:${lexKey}`,
                    relation: 'RELATES_TO',
                    weight: 0.8,
                })
            }

            // Link disease -> related guide articles
            for (const articleId of d.relatedArticleIds) {
                this.addEdge({
                    source: `disease:${d.id}`,
                    target: `guide:${articleId}`,
                    relation: 'TREATS',
                    weight: 0.9,
                })
            }

            // Link disease -> affected stages
            for (const stage of d.affectedStages) {
                this.addEdge({
                    source: `disease:${d.id}`,
                    target: `stage:${stage}`,
                    relation: 'AFFECTS_STAGE',
                    weight: 0.7,
                })
            }
        }
    }

    private indexLexicon(): void {
        for (const entry of lexiconData) {
            this.addNode({
                id: `lexicon:${entry.key}`,
                type: 'lexicon',
                label: entry.key,
                meta: { category: entry.category },
            })

            // Link terpenes and nutrients to their dedicated type nodes
            if (entry.category === 'Terpene') {
                this.addEdge({
                    source: `lexicon:${entry.key}`,
                    target: `terpene:${entry.key}`,
                    relation: 'REFERENCES',
                    weight: 1.0,
                })
                this.addNode({
                    id: `terpene:${entry.key}`,
                    type: 'terpene',
                    label: entry.key,
                    meta: {},
                })
            }

            if (entry.category === 'Nutrient') {
                this.addNode({
                    id: `nutrient:${entry.key}`,
                    type: 'nutrient',
                    label: entry.key,
                    meta: {},
                })
                this.addEdge({
                    source: `lexicon:${entry.key}`,
                    target: `nutrient:${entry.key}`,
                    relation: 'REFERENCES',
                    weight: 1.0,
                })
            }
        }
    }

    private indexLearningPaths(): void {
        for (const lp of learningPaths) {
            this.addNode({
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

            // Link learning path to related stages via tags
            for (const tag of lp.tags) {
                const stageMatch = tagToStageMap[tag]
                if (stageMatch) {
                    this.addEdge({
                        source: `learningPath:${lp.id}`,
                        target: `stage:${stageMatch}`,
                        relation: 'COVERED_BY',
                        weight: 0.6,
                    })
                }
            }

            // Link learning path steps to guide articles
            for (const step of lp.steps) {
                if (step.referenceId) {
                    this.addEdge({
                        source: `learningPath:${lp.id}`,
                        target: `guide:${step.referenceId}`,
                        relation: 'REFERENCES',
                        weight: 0.7,
                    })
                }
            }
        }
    }

    private indexCalculators(): void {
        const calculators = ['vpd', 'nutrient', 'ph'] as const
        for (const calc of calculators) {
            this.addNode({
                id: `calculator:${calc}`,
                type: 'calculator',
                label: calc,
                meta: {},
            })
        }

        // VPD calculator relates to environment lexicon entries
        this.addEdge({
            source: 'calculator:vpd',
            target: 'lexicon:vpd',
            relation: 'REFERENCES',
            weight: 1.0,
        })

        // Nutrient calculator relates to EC/pH
        this.addEdge({
            source: 'calculator:nutrient',
            target: 'lexicon:ecValue',
            relation: 'REFERENCES',
            weight: 0.9,
        })
        this.addEdge({
            source: 'calculator:ph',
            target: 'lexicon:phValue',
            relation: 'REFERENCES',
            weight: 0.9,
        })
    }

    private indexNutrients(): void {
        const nutrients = ['nitrogen', 'phosphorus', 'potassium', 'calcium', 'magnesium'] as const
        for (const n of nutrients) {
            const nodeId = `nutrient:${n}`
            if (!this.nodes.has(nodeId)) {
                this.addNode({ id: nodeId, type: 'nutrient', label: n, meta: {} })
            }
            // Link nutrient -> deficiency disease
            this.addEdge({
                source: nodeId,
                target: `disease:${n}-deficiency`,
                relation: 'DEFICIENCY_OF',
                weight: 1.0,
            })
        }
    }

    private indexStages(): void {
        const stages: PlantStage[] = [
            'SEED' as PlantStage,
            'GERMINATION' as PlantStage,
            'SEEDLING' as PlantStage,
            'VEGETATIVE' as PlantStage,
            'FLOWERING' as PlantStage,
            'HARVEST' as PlantStage,
            'DRYING' as PlantStage,
            'CURING' as PlantStage,
            'FINISHED' as PlantStage,
        ]
        for (const s of stages) {
            this.addNode({ id: `stage:${s}`, type: 'stage', label: s, meta: {} })
        }
    }

    // -- Dynamic data injection (from Redux state) -------------------------

    /**
     * Injects live plant data into the graph for cross-referencing.
     * Call this when plants change (debounced from Redux listener).
     */
    injectPlants(plants: Plant[]): void {
        // Remove old plant nodes
        for (const [id] of this.nodes) {
            if (id.startsWith('plant:') || id.startsWith('journal:')) {
                this.nodes.delete(id)
            }
        }

        for (const plant of plants) {
            const plantNodeId = `plant:${plant.id}`
            this.addNode({
                id: plantNodeId,
                type: 'plant',
                label: plant.name,
                meta: {
                    stage: plant.stage,
                    health: plant.health,
                    strain: plant.strain?.name,
                    vpd: plant.environment?.vpd,
                },
            })

            // Plant -> current stage
            this.addEdge({
                source: plantNodeId,
                target: `stage:${plant.stage}`,
                relation: 'AFFECTS_STAGE',
                weight: 1.0,
            })

            // Plant -> strain (if available)
            if (plant.strain?.name) {
                const strainNodeId = `strain:${plant.strain.name}`
                if (!this.nodes.has(strainNodeId)) {
                    this.addNode({
                        id: strainNodeId,
                        type: 'strain',
                        label: plant.strain.name,
                        meta: {},
                    })
                }
                this.addEdge({
                    source: plantNodeId,
                    target: strainNodeId,
                    relation: 'USES_STRAIN',
                    weight: 1.0,
                })
            }

            // Plant -> problems (link to diseases)
            if (plant.problems) {
                for (const problem of plant.problems) {
                    const diseaseId = `disease:${problem.type}`
                    if (this.nodes.has(diseaseId)) {
                        this.addEdge({
                            source: plantNodeId,
                            target: diseaseId,
                            relation: 'RELATES_TO',
                            weight: 0.9,
                        })
                    }
                }
            }

            // Index recent journal entries (last 20 per plant)
            if (plant.journal) {
                const recent = plant.journal.slice(-20)
                for (const entry of recent) {
                    const journalNodeId = `journal:${entry.id}`
                    this.addNode({
                        id: journalNodeId,
                        type: 'journal',
                        label: entry.type,
                        meta: {
                            createdAt: entry.createdAt,
                            notes: entry.notes,
                            type: entry.type,
                        },
                    })
                    this.addEdge({
                        source: plantNodeId,
                        target: journalNodeId,
                        relation: 'LOGGED_FOR',
                        weight: calculateRecency(entry.createdAt),
                    })
                }
            }
        }
    }

    /**
     * Injects strain terpene profiles into the graph.
     */
    injectStrainTerpenes(strains: Strain[]): void {
        for (const strain of strains) {
            const strainNodeId = `strain:${strain.name}`
            if (!this.nodes.has(strainNodeId)) {
                this.addNode({
                    id: strainNodeId,
                    type: 'strain',
                    label: strain.name,
                    meta: { type: strain.type, thc: strain.thc, cbd: strain.cbd },
                })
            }

            if (strain.terpeneProfile) {
                for (const [terpene, value] of Object.entries(strain.terpeneProfile)) {
                    if (typeof value === 'number' && value > 0) {
                        const terpNodeId = `terpene:${terpene}`
                        if (!this.nodes.has(terpNodeId)) {
                            this.addNode({
                                id: terpNodeId,
                                type: 'terpene',
                                label: terpene,
                                meta: {},
                            })
                        }
                        this.addEdge({
                            source: strainNodeId,
                            target: terpNodeId,
                            relation: 'HAS_TERPENE',
                            weight: Math.min(1, value / 5),
                        })
                    }
                }
            }
        }
    }

    // -- Query API ----------------------------------------------------------------

    /**
     * Returns nodes directly connected to the given node ID.
     */
    getNeighbors(nodeId: string): GraphNode[] {
        const edgeIndices = this.adjacency.get(nodeId)
        if (!edgeIndices) return []

        const result: GraphNode[] = []
        for (const idx of edgeIndices) {
            const edge = this.edges[idx]
            if (!edge) continue
            const neighborId = edge.source === nodeId ? edge.target : edge.source
            const node = this.nodes.get(neighborId)
            if (node) result.push(node)
        }
        return result
    }

    /**
     * Returns edges connected to the given node ID.
     */
    getEdgesFor(nodeId: string): GraphEdge[] {
        const edgeIndices = this.adjacency.get(nodeId)
        if (!edgeIndices) return []
        return Array.from(edgeIndices)
            .map((idx) => this.edges[idx])
            .filter((e): e is GraphEdge => e !== undefined)
    }

    /**
     * Returns a node by its ID, or undefined.
     */
    getNode(nodeId: string): GraphNode | undefined {
        return this.nodes.get(nodeId)
    }

    /**
     * Find all nodes of a specific type.
     */
    getNodesByType(type: GraphNodeType): GraphNode[] {
        const result: GraphNode[] = []
        for (const node of this.nodes.values()) {
            if (node.type === type) result.push(node)
        }
        return result
    }

    /**
     * BFS traversal up to N hops from a seed node. Returns all reachable nodes
     * with their shortest hop distance and accumulated weight.
     */
    traverse(
        seedId: string,
        maxHops: number = 2,
        filterType?: GraphNodeType,
    ): Array<{ node: GraphNode; hops: number; weight: number }> {
        if (!this.nodes.has(seedId)) return []

        const visited = new Map<string, { hops: number; weight: number }>()
        const queue: Array<{ id: string; hops: number; weight: number }> = [
            { id: seedId, hops: 0, weight: 1 },
        ]
        visited.set(seedId, { hops: 0, weight: 1 })

        while (queue.length > 0) {
            const current = queue.shift()
            if (!current || current.hops >= maxHops) continue

            const edgeIndices = this.adjacency.get(current.id)
            if (!edgeIndices) continue

            for (const idx of edgeIndices) {
                const edge = this.edges[idx]
                if (!edge) continue
                const neighborId = edge.source === current.id ? edge.target : edge.source
                if (visited.has(neighborId)) continue

                const nextHops = current.hops + 1
                const nextWeight = current.weight * edge.weight
                visited.set(neighborId, { hops: nextHops, weight: nextWeight })
                queue.push({ id: neighborId, hops: nextHops, weight: nextWeight })
            }
        }

        const results: Array<{ node: GraphNode; hops: number; weight: number }> = []
        for (const [id, info] of visited) {
            if (id === seedId) continue
            const node = this.nodes.get(id)
            if (!node) continue
            if (filterType && node.type !== filterType) continue
            results.push({ node, hops: info.hops, weight: info.weight })
        }

        return results.sort((a, b) => b.weight - a.weight)
    }

    /**
     * Core public API: Get cross-module links relevant to a given context.
     *
     * This is the main method consumed by UI components for "Related Knowledge",
     * "Suggested Reading", and cross-module navigation.
     */
    getRelatedLinks(context: QueryContext): CrossModuleLink[] {
        this.initialize()

        const links: CrossModuleLink[] = []
        const seen = new Set<string>()

        // 1. If we have a plant context, traverse from plant node
        if (context.plantId) {
            const plantNodeId = `plant:${context.plantId}`
            const traversed = this.traverse(plantNodeId, 3)
            for (const item of traversed) {
                if (seen.has(item.node.id)) continue
                const link = nodeToLink(item.node, item.weight, `plant -> ${item.node.type}`)
                if (link) {
                    seen.add(item.node.id)
                    links.push(link)
                }
            }
        }

        // 2. If we have a current stage, find relevant diseases and guides
        if (context.currentStage) {
            const stageNodeId = `stage:${context.currentStage}`
            const stageNeighbors = this.traverse(stageNodeId, 2)
            for (const item of stageNeighbors) {
                if (seen.has(item.node.id)) continue
                const link = nodeToLink(
                    item.node,
                    item.weight * 0.9,
                    `stage:${context.currentStage} -> ${item.node.type}`,
                )
                if (link) {
                    seen.add(item.node.id)
                    links.push(link)
                }
            }
        }

        // 3. If we have a disease context, traverse from disease
        if (context.diseaseId) {
            const diseaseNodeId = `disease:${context.diseaseId}`
            const diseaseNeighbors = this.traverse(diseaseNodeId, 2)
            for (const item of diseaseNeighbors) {
                if (seen.has(item.node.id)) continue
                const link = nodeToLink(
                    item.node,
                    item.weight * 0.85,
                    `disease -> ${item.node.type}`,
                )
                if (link) {
                    seen.add(item.node.id)
                    links.push(link)
                }
            }
        }

        // 4. If we have a strain context, traverse terpenes and related
        if (context.strainName) {
            const strainNodeId = `strain:${context.strainName}`
            const strainNeighbors = this.traverse(strainNodeId, 2, 'terpene')
            for (const item of strainNeighbors) {
                if (seen.has(item.node.id)) continue
                const link = nodeToLink(item.node, item.weight * 0.7, `strain -> ${item.node.type}`)
                if (link) {
                    seen.add(item.node.id)
                    links.push(link)
                }
            }
        }

        // 5. If we have keyword search tokens, match lexicon entries
        if (context.keywords && context.keywords.length > 0) {
            for (const kw of context.keywords) {
                const lower = kw.toLowerCase()
                for (const entry of lexiconData) {
                    if (entry.key.toLowerCase().includes(lower)) {
                        const nodeId = `lexicon:${entry.key}`
                        if (seen.has(nodeId)) continue
                        const node = this.nodes.get(nodeId)
                        if (!node) continue
                        seen.add(nodeId)
                        const link = nodeToLink(node, 0.6, `keyword:${kw} -> lexicon`)
                        if (link) links.push(link)
                    }
                }
            }
        }

        // Sort by relevance and limit
        return links
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, context.maxResults ?? 10)
    }

    /**
     * Build AI context string from graph for a given plant/stage/disease.
     * Used by the Context Bridge to enrich AI prompts.
     */
    buildAiContext(context: QueryContext): string {
        this.initialize()

        const parts: string[] = []
        const links = this.getRelatedLinks({ ...context, maxResults: 8 })

        if (links.length > 0) {
            parts.push('Related knowledge graph context:')
            for (const link of links) {
                parts.push(
                    `- [${link.nodeType}] ${link.label} (relevance: ${Math.round(link.relevanceScore * 100)}%, via: ${link.relationPath})`,
                )
            }
        }

        return parts.join('\n')
    }

    /**
     * Returns basic graph statistics for debugging and testing.
     */
    getStats(): { nodeCount: number; edgeCount: number } {
        return {
            nodeCount: this.nodes.size,
            edgeCount: this.edges.length,
        }
    }
}

// ---------------------------------------------------------------------------
// Query Context
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tagToStageMap: Record<string, PlantStage> = {
    setup: 'SEED' as PlantStage,
    germination: 'GERMINATION' as PlantStage,
    seedling: 'SEEDLING' as PlantStage,
    vegetative: 'VEGETATIVE' as PlantStage,
    basics: 'SEEDLING' as PlantStage,
    flowering: 'FLOWERING' as PlantStage,
    harvest: 'HARVEST' as PlantStage,
    curing: 'CURING' as PlantStage,
    watering: 'VEGETATIVE' as PlantStage,
}

function calculateRecency(timestamp: number): number {
    const age = Date.now() - timestamp
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    return Math.max(0.1, 1 - age / thirtyDays)
}

function nodeToLink(node: GraphNode, weight: number, path: string): CrossModuleLink | undefined {
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

const nodeTypeToViewMapping: Record<
    GraphNodeType,
    { view: View; tab?: KnowledgeViewTab | string } | undefined
> = {
    disease: { view: 'knowledge' as View, tab: 'Atlas' },
    lexicon: { view: 'knowledge' as View, tab: 'Lexikon' },
    guide: { view: 'knowledge' as View, tab: 'Guide' },
    learningPath: { view: 'knowledge' as View, tab: 'Lernpfad' },
    calculator: { view: 'knowledge' as View, tab: 'Rechner' },
    plant: { view: 'plants' as View },
    journal: { view: 'plants' as View },
    strain: { view: 'strains' as View },
    stage: undefined,
    nutrient: { view: 'knowledge' as View, tab: 'Lexikon' },
    terpene: { view: 'knowledge' as View, tab: 'Lexikon' },
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const knowledgeGraph = new KnowledgeGraph()
