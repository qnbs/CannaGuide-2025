/// <reference lib="webworker" />

import * as d3 from 'd3'
import { geneticsService } from '@/services/geneticsService'
import { GENEALOGY_NODE_SIZE, GENEALOGY_NODE_SEPARATION } from '@/constants'
import type { GenealogyNode, Strain } from '@/types'
import type { WorkerRequest } from '@/types/workerBus.types'
import { workerOk, workerErr } from '@/types/workerBus.types'
import { initAbortHandler } from '@/utils/workerAbort'

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

interface LayoutPayload {
    tree: GenealogyNode
    orientation: 'horizontal' | 'vertical'
}

interface ContributionsPayload {
    tree: GenealogyNode | null
}

interface OffspringProfilePayload {
    parentA: Strain
    parentB: Strain
    phenotypes: {
        parentA: { vigor: number; resin: number; aroma: number; resistance: number }
        parentB: { vigor: number; resin: number; aroma: number; resistance: number }
    }
}

const isTrustedWorkerMessage = (event: MessageEvent<unknown>): boolean => {
    return !event.origin || event.origin === self.location.origin
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    if (!isTrustedWorkerMessage(event)) {
        return
    }

    const { messageId, type, payload } = event.data

    try {
        if (type === 'LAYOUT') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const p = payload as LayoutPayload
            const root = d3.hierarchy(p.tree, (node) => node?.children)
            const treeLayout = d3
                .tree<GenealogyNode>()
                .nodeSize(
                    p.orientation === 'horizontal'
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

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const descendants = root.descendants() as d3.HierarchyPointNode<GenealogyNode>[]
            const indexByNode = new Map(descendants.map((node, index) => [node, index]))

            const nodes: GenealogyLayoutNode[] = descendants.map((node) => ({
                data: node.data,
                depth: node.depth,
                x: node.x,
                y: node.y,
            }))

            const links: GenealogyLayoutLink[] = root.links().map((link) => ({
                sourceIndex:
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    indexByNode.get(link.source as d3.HierarchyPointNode<GenealogyNode>) ?? 0,
                targetIndex:
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                    indexByNode.get(link.target as d3.HierarchyPointNode<GenealogyNode>) ?? 0,
            }))

            self.postMessage(workerOk(messageId, { nodes, links }))
            return
        }

        if (type === 'CONTRIBUTIONS') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const p = payload as ContributionsPayload
            const contributions = p.tree ? geneticsService.calculateGeneticContribution(p.tree) : []
            self.postMessage(workerOk(messageId, { contributions }))
            return
        }

        if (type === 'OFFSPRING_PROFILE') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const p = payload as OffspringProfilePayload
            const result = geneticsService.estimateOffspringProfile(
                p.parentA,
                p.parentB,
                p.phenotypes,
            )
            self.postMessage(workerOk(messageId, { result }))
            return
        }

        self.postMessage(workerErr(messageId, `Unknown command: ${type}`))
    } catch (error) {
        self.postMessage(
            workerErr(
                messageId,
                error instanceof Error ? error.message : 'Unknown genealogy worker error',
            ),
        )
    }
}

// W-02.1: Install cooperative abort handler (must be after self.onmessage)
initAbortHandler()

export {}
