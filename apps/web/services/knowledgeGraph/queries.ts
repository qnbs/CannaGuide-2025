import { lexiconData } from '@/data/lexicon'
import { nodeToLink } from './nodeMapping'
import type {
    CrossModuleLink,
    GraphEdge,
    GraphNode,
    GraphNodeType,
    GraphStore,
    QueryContext,
} from './types'

export function getNeighbors(store: GraphStore, nodeId: string): GraphNode[] {
    const edgeIndices = store.adjacency.get(nodeId)
    if (!edgeIndices) return []

    const result: GraphNode[] = []
    for (const idx of edgeIndices) {
        const edge = store.edges[idx]
        if (!edge) continue
        const neighborId = edge.source === nodeId ? edge.target : edge.source
        const node = store.nodes.get(neighborId)
        if (node) result.push(node)
    }
    return result
}

export function getEdgesFor(store: GraphStore, nodeId: string): GraphEdge[] {
    const edgeIndices = store.adjacency.get(nodeId)
    if (!edgeIndices) return []
    return Array.from(edgeIndices)
        .map((idx) => store.edges[idx])
        .filter((e): e is GraphEdge => e !== undefined)
}

export function getNode(store: GraphStore, nodeId: string): GraphNode | undefined {
    return store.nodes.get(nodeId)
}

export function getNodesByType(store: GraphStore, type: GraphNodeType): GraphNode[] {
    const result: GraphNode[] = []
    for (const node of store.nodes.values()) {
        if (node.type === type) result.push(node)
    }
    return result
}

export function traverse(
    store: GraphStore,
    seedId: string,
    maxHops: number = 2,
    filterType?: GraphNodeType,
): Array<{ node: GraphNode; hops: number; weight: number }> {
    if (!store.nodes.has(seedId)) return []

    const visited = new Map<string, { hops: number; weight: number }>()
    const queue: Array<{ id: string; hops: number; weight: number }> = [
        { id: seedId, hops: 0, weight: 1 },
    ]
    visited.set(seedId, { hops: 0, weight: 1 })

    while (queue.length > 0) {
        const current = queue.shift()
        if (!current || current.hops >= maxHops) continue

        const edgeIndices = store.adjacency.get(current.id)
        if (!edgeIndices) continue

        for (const idx of edgeIndices) {
            const edge = store.edges[idx]
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
        const node = store.nodes.get(id)
        if (!node) continue
        if (filterType && node.type !== filterType) continue
        results.push({ node, hops: info.hops, weight: info.weight })
    }

    return results.sort((a, b) => b.weight - a.weight)
}

export function getRelatedLinks(store: GraphStore, context: QueryContext): CrossModuleLink[] {
    const links: CrossModuleLink[] = []
    const seen = new Set<string>()

    if (context.plantId) {
        const plantNodeId = `plant:${context.plantId}`
        const traversed = traverse(store, plantNodeId, 3)
        for (const item of traversed) {
            if (seen.has(item.node.id)) continue
            const link = nodeToLink(item.node, item.weight, `plant -> ${item.node.type}`)
            if (link) {
                seen.add(item.node.id)
                links.push(link)
            }
        }
    }

    if (context.currentStage) {
        const stageNodeId = `stage:${context.currentStage}`
        const stageNeighbors = traverse(store, stageNodeId, 2)
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

    if (context.diseaseId) {
        const diseaseNodeId = `disease:${context.diseaseId}`
        const diseaseNeighbors = traverse(store, diseaseNodeId, 2)
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

    if (context.strainName) {
        const strainNodeId = `strain:${context.strainName}`
        const strainNeighbors = traverse(store, strainNodeId, 2, 'terpene')
        for (const item of strainNeighbors) {
            if (seen.has(item.node.id)) continue
            const link = nodeToLink(item.node, item.weight * 0.7, `strain -> ${item.node.type}`)
            if (link) {
                seen.add(item.node.id)
                links.push(link)
            }
        }
    }

    if (context.keywords && context.keywords.length > 0) {
        for (const kw of context.keywords) {
            const lower = kw.toLowerCase()
            for (const entry of lexiconData) {
                if (entry.key.toLowerCase().includes(lower)) {
                    const nodeId = `lexicon:${entry.key}`
                    if (seen.has(nodeId)) continue
                    const node = store.nodes.get(nodeId)
                    if (!node) continue
                    seen.add(nodeId)
                    const link = nodeToLink(node, 0.6, `keyword:${kw} -> lexicon`)
                    if (link) links.push(link)
                }
            }
        }
    }

    return links
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, context.maxResults ?? 10)
}

export function buildAiContext(store: GraphStore, context: QueryContext): string {
    const parts: string[] = []
    const links = getRelatedLinks(store, { ...context, maxResults: 8 })

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
