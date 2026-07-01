import type { Plant, Strain } from '@/types'
import type { GraphMutators } from './types'

function calculateRecency(timestamp: number): number {
    const age = Date.now() - timestamp
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    return Math.max(0.1, 1 - age / thirtyDays)
}

function clearDynamicNodes(nodes: Map<string, unknown>): void {
    for (const [id] of nodes) {
        if (id.startsWith('plant:') || id.startsWith('journal:')) {
            nodes.delete(id)
        }
    }
}

export function injectPlants({ nodes, addNode, addEdge }: GraphMutators, plants: Plant[]): void {
    clearDynamicNodes(nodes)

    for (const plant of plants) {
        const plantNodeId = `plant:${plant.id}`
        addNode({
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

        addEdge({
            source: plantNodeId,
            target: `stage:${plant.stage}`,
            relation: 'AFFECTS_STAGE',
            weight: 1.0,
        })

        if (plant.strain?.name) {
            const strainNodeId = `strain:${plant.strain.name}`
            if (!nodes.has(strainNodeId)) {
                addNode({
                    id: strainNodeId,
                    type: 'strain',
                    label: plant.strain.name,
                    meta: {},
                })
            }
            addEdge({
                source: plantNodeId,
                target: strainNodeId,
                relation: 'USES_STRAIN',
                weight: 1.0,
            })
        }

        if (plant.problems) {
            for (const problem of plant.problems) {
                const diseaseId = `disease:${problem.type}`
                if (nodes.has(diseaseId)) {
                    addEdge({
                        source: plantNodeId,
                        target: diseaseId,
                        relation: 'RELATES_TO',
                        weight: 0.9,
                    })
                }
            }
        }

        if (plant.journal) {
            const recent = plant.journal.slice(-20)
            for (const entry of recent) {
                const journalNodeId = `journal:${entry.id}`
                addNode({
                    id: journalNodeId,
                    type: 'journal',
                    label: entry.type,
                    meta: {
                        createdAt: entry.createdAt,
                        notes: entry.notes,
                        type: entry.type,
                    },
                })
                addEdge({
                    source: plantNodeId,
                    target: journalNodeId,
                    relation: 'LOGGED_FOR',
                    weight: calculateRecency(entry.createdAt),
                })
            }
        }
    }
}

export function injectStrainTerpenes(
    { nodes, addNode, addEdge }: GraphMutators,
    strains: Strain[],
): void {
    for (const strain of strains) {
        const strainNodeId = `strain:${strain.name}`
        if (!nodes.has(strainNodeId)) {
            addNode({
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
                    if (!nodes.has(terpNodeId)) {
                        addNode({
                            id: terpNodeId,
                            type: 'terpene',
                            label: terpene,
                            meta: {},
                        })
                    }
                    addEdge({
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
