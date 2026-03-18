/// <reference lib="webworker" />

import * as d3 from 'd3'
import { geneticsService } from '@/services/geneticsService'
import { GENEALOGY_NODE_SIZE, GENEALOGY_NODE_SEPARATION } from '@/constants'
import type { GenealogyNode, Strain } from '@/types'

interface GenealogyLayoutNode {
    data: GenealogyNode
    depth: number
    x: number
    y: number
}

interface GenealogyLayoutLink {
    sourceIndex: number
    targetIndex: number
}

type GenealogyWorkerMessage =
    | { type: 'LAYOUT'; tree: GenealogyNode; orientation: 'horizontal' | 'vertical' }
    | { type: 'CONTRIBUTIONS'; tree: GenealogyNode | null }
    | {
        type: 'OFFSPRING_PROFILE'
        parentA: Strain
        parentB: Strain
        phenotypes: {
            parentA: { vigor: number; resin: number; aroma: number; resistance: number }
            parentB: { vigor: number; resin: number; aroma: number; resistance: number }
        }
    }

self.onmessage = (event: MessageEvent<GenealogyWorkerMessage>) => {
    try {
        if (event.data.type === 'LAYOUT') {
            const root = d3.hierarchy(event.data.tree, (node) => node?.children)
            const treeLayout = d3.tree<GenealogyNode>().nodeSize(
                event.data.orientation === 'horizontal'
                    ? [
                        GENEALOGY_NODE_SIZE.height + GENEALOGY_NODE_SEPARATION.y,
                        GENEALOGY_NODE_SIZE.width + GENEALOGY_NODE_SEPARATION.x,
                    ]
                    : [
                        GENEALOGY_NODE_SIZE.width + GENEALOGY_NODE_SEPARATION.x,
                        GENEALOGY_NODE_SIZE.height + GENEALOGY_NODE_SEPARATION.y,
                    ],
            )

            treeLayout(root)

            const descendants = root.descendants() as d3.HierarchyPointNode<GenealogyNode>[]
            const indexByNode = new Map(descendants.map((node, index) => [node, index]))

            const nodes: GenealogyLayoutNode[] = descendants.map((node) => ({
                data: node.data,
                depth: node.depth,
                x: node.x,
                y: node.y,
            }))

            const links: GenealogyLayoutLink[] = root.links().map((link) => ({
                sourceIndex: indexByNode.get(link.source as d3.HierarchyPointNode<GenealogyNode>) ?? 0,
                targetIndex: indexByNode.get(link.target as d3.HierarchyPointNode<GenealogyNode>) ?? 0,
            }))

            self.postMessage({ type: 'LAYOUT_RESULT', nodes, links })
            return
        }

        if (event.data.type === 'CONTRIBUTIONS') {
            const contributions = event.data.tree ? geneticsService.calculateGeneticContribution(event.data.tree) : []
            self.postMessage({ type: 'CONTRIBUTIONS_RESULT', contributions })
            return
        }

        if (event.data.type === 'OFFSPRING_PROFILE') {
            const result = geneticsService.estimateOffspringProfile(
                event.data.parentA,
                event.data.parentB,
                event.data.phenotypes,
            )
            self.postMessage({ type: 'OFFSPRING_PROFILE_RESULT', result })
        }
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            message: error instanceof Error ? error.message : 'Unknown genealogy worker error',
        })
    }
}

export {}
