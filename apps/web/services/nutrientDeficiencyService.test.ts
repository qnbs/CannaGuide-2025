import { describe, expect, it } from 'vitest'
import {
    getStartNode,
    getNode,
    isResult,
    getAllDeficiencyIds,
    getMaxDepth,
} from '@/services/nutrientDeficiencyService'

describe('nutrientDeficiencyService', () => {
    it('getStartNode returns the root question node', () => {
        const root = getStartNode()
        expect(root.id).toBe('root')
        expect(root.questionKey).toBe('olderLeavesAffected')
        expect(isResult(root)).toBe(false)
    })

    it('traverses the nitrogen path correctly (root -> yes -> yes -> no -> yes)', () => {
        const root = getStartNode()
        // yes -> mobile-general
        const n1 = getNode(root.yesNodeId)
        expect(n1).toBeDefined()
        expect(isResult(n1)).toBe(false)

        // yes -> mobile-yellow-detail
        if (!isResult(n1) && n1) {
            const n2 = getNode(n1.yesNodeId)
            expect(n2).toBeDefined()
            expect(isResult(n2)).toBe(false)

            // no -> mobile-pale-green
            if (!isResult(n2) && n2) {
                const n3 = getNode(n2.noNodeId)
                expect(n3).toBeDefined()
                expect(isResult(n3)).toBe(false)

                // yes -> result-nitrogen
                if (!isResult(n3) && n3) {
                    const result = getNode(n3.yesNodeId)
                    expect(result).toBeDefined()
                    expect(isResult(result)).toBe(true)
                    if (isResult(result)) {
                        expect(result.deficiencyId).toBe('nitrogen-deficiency')
                    }
                }
            }
        }
    })

    it('traverses the magnesium path correctly (root -> yes -> no -> yes)', () => {
        const root = getStartNode()
        // yes -> mobile-general
        const n1 = getNode(root.yesNodeId)
        expect(n1).toBeDefined()

        // no -> mobile-no-yellow
        if (!isResult(n1) && n1) {
            const n2 = getNode(n1.noNodeId)
            expect(n2).toBeDefined()
            expect(isResult(n2)).toBe(false)

            // yes -> result-magnesium
            if (!isResult(n2) && n2) {
                const result = getNode(n2.yesNodeId)
                expect(result).toBeDefined()
                expect(isResult(result)).toBe(true)
                if (isResult(result)) {
                    expect(result.deficiencyId).toBe('magnesium-deficiency')
                }
            }
        }
    })

    it('traverses the iron path correctly (root -> no -> yes -> yes)', () => {
        const root = getStartNode()
        // no -> immobile-chlorosis
        const n1 = getNode(root.noNodeId)
        expect(n1).toBeDefined()
        expect(isResult(n1)).toBe(false)

        // yes -> immobile-iron-or-mn
        if (!isResult(n1) && n1) {
            const n2 = getNode(n1.yesNodeId)
            expect(n2).toBeDefined()

            // yes -> result-iron
            if (!isResult(n2) && n2) {
                const result = getNode(n2.yesNodeId)
                expect(result).toBeDefined()
                expect(isResult(result)).toBe(true)
                if (isResult(result)) {
                    expect(result.deficiencyId).toBe('iron-deficiency')
                }
            }
        }
    })

    it('all leaf nodes have DeficiencyResult with required fields', () => {
        const ids = getAllDeficiencyIds()
        expect(ids.length).toBeGreaterThanOrEqual(9)

        // Check every result reachable from the tree
        const visited = new Set<string>()
        const queue = ['root']

        while (queue.length > 0) {
            const id = queue.shift()!
            if (visited.has(id)) continue
            visited.add(id)

            const node = getNode(id)
            if (!node) continue

            if (isResult(node)) {
                expect(node.deficiencyId).toBeTruthy()
                expect(node.symptomKeys.length).toBeGreaterThan(0)
                expect(node.treatmentKeys.length).toBeGreaterThan(0)
                expect(['mild', 'moderate', 'severe']).toContain(node.severity)
            } else {
                queue.push(node.yesNodeId)
                queue.push(node.noNodeId)
            }
        }
    })

    it('getMaxDepth returns 4', () => {
        expect(getMaxDepth()).toBe(4)
    })
})
