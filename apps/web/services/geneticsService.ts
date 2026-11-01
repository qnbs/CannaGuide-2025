import { Strain, GenealogyNode, StrainType, GeneticContribution } from '@/types'
import { strainAliases } from '@/data/strainAliases'

// Helper to collapse nodes beyond a certain depth for a cleaner initial view
const collapseNodes = (node: GenealogyNode, depth: number, maxDepth: number) => {
    if (depth >= maxDepth && node.children) {
        node._children = node.children
        delete node.children
    }
    if (node.children) {
        node.children.forEach((child) => collapseNodes(child, depth + 1, maxDepth))
    }
}

const stripParentheticalSuffix = (input: string): string => {
    const start = input.indexOf('(')
    return start === -1 ? input : input.slice(0, start)
}

const splitCrossGenetics = (genetics: string): string[] => {
    const tokens = genetics.split(' ')
    const parents: string[] = []
    let currentParts: string[] = []

    for (const rawToken of tokens) {
        const token = rawToken.trim()
        if (!token) continue

        if (token.toLowerCase() === 'x') {
            if (currentParts.length > 0) {
                parents.push(currentParts.join(' '))
                currentParts = []
            }
            continue
        }

        currentParts.push(token)
    }

    if (currentParts.length > 0) {
        parents.push(currentParts.join(' '))
    }

    return parents
}

const cleanedCanonicalName = (canonicalName: string): string =>
    stripParentheticalSuffix(canonicalName).toLowerCase().trim()

const parseParentNames = (genetics: string): string[] =>
    splitCrossGenetics(genetics)
        .map((p) => p.replaceAll('(', '').replaceAll(')', '').trim())
        .filter(
            (p) =>
                p.length > 0 &&
                p.toLowerCase() !== 'unknown' &&
                !p.toLowerCase().includes('phenotype'),
        )

const uniqueById = <T extends { id: string }>(items: T[]): T[] => [
    ...new Map(items.map((item) => [item.id, item])).values(),
]

const averagePair = (left: number, right: number): number => (left + right) / 2

const clampTen = (value: number): number => Math.max(0, Math.min(10, value))

const finiteMeasurement = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

const averageKnownMeasurements = (left: unknown, right: unknown): number | null => {
    const leftMeasurement = finiteMeasurement(left)
    const rightMeasurement = finiteMeasurement(right)
    if (leftMeasurement === undefined || rightMeasurement === undefined) return null
    return averagePair(leftMeasurement, rightMeasurement)
}

const offsetMeasurement = (base: number | null, delta: number): number | null =>
    base === null ? null : base + delta

const flooredMeasurement = (base: number | null, delta: number, floor: number): number | null =>
    base === null ? null : Math.max(floor, base + delta)

const stabilityOrNull = (
    thcA: number | undefined,
    thcB: number | undefined,
    flowerA: number | undefined,
    flowerB: number | undefined,
    resistanceScore: number,
): number | null => {
    if (thcA === undefined || thcB === undefined) return null
    if (flowerA === undefined || flowerB === undefined) return null
    return Math.max(
        0,
        Math.min(
            100,
            55 +
                (10 - Math.abs(thcA - thcB)) * 2 +
                (10 - Math.abs(flowerA - flowerB)) * 1.5 +
                resistanceScore * 1.2,
        ),
    )
}

class GeneticsService {
    private _getCanonicalName(name: string): string {
        const lowerName = name.trim().toLowerCase()
        return strainAliases[lowerName] || name.trim()
    }

    private _findStrainByName(strainName: string, allStrains: Strain[]): Strain | undefined {
        const canonicalName = this._getCanonicalName(strainName)
        const cleanedName = cleanedCanonicalName(canonicalName)
        return allStrains.find((s) => s.name.toLowerCase() === cleanedName)
    }

    private _buildLandraceNode(strainName: string, cleanedName: string): GenealogyNode {
        return {
            name: strainName.trim(),
            id: `landrace-${cleanedName.replace(/[^a-z0-9]/g, '-')}`,
            isLandrace: true,
            type: StrainType.Hybrid,
            thc: 0,
        }
    }

    private _buildCircularPlaceholderNode(strain: Strain): GenealogyNode {
        return {
            name: strain.name,
            id: strain.id,
            type: strain.type,
            thc: strain.thc,
            isLandrace: false,
            isPlaceholder: true,
        }
    }

    private _findDirectChildren(parentName: string, allStrains: Strain[]): Strain[] {
        const lowerParentName = this._getCanonicalName(parentName).toLowerCase()
        return allStrains.filter((s) => {
            if (!s.genetics) return false
            const parents = parseParentNames(s.genetics).map((p) =>
                this._getCanonicalName(p).toLowerCase(),
            )
            return parents.includes(lowerParentName)
        })
    }

    private findAndBuildNode(
        strainName: string,
        allStrains: Strain[],
        visited: Set<string>,
    ): GenealogyNode {
        const canonicalName = this._getCanonicalName(strainName)
        const cleanedName = cleanedCanonicalName(canonicalName)
        const strain = this._findStrainByName(strainName, allStrains)

        if (!strain) {
            return this._buildLandraceNode(strainName, cleanedName)
        }

        if (visited.has(strain.id)) {
            return this._buildCircularPlaceholderNode(strain)
        }

        const isLandrace = !strain.genetics || !strain.genetics.toLowerCase().includes(' x ')

        const node: GenealogyNode = {
            name: strain.name,
            id: strain.id,
            type: strain.type,
            thc: strain.thc,
            isLandrace: isLandrace,
        }

        const newVisited = new Set(visited)
        newVisited.add(strain.id)

        if (!isLandrace && strain.genetics) {
            const parentNames = parseParentNames(strain.genetics)

            if (parentNames.length > 0) {
                const childrenNodes = parentNames
                    .map((parentName) => this.findAndBuildNode(parentName, allStrains, newVisited))
                    .filter((childNode): childNode is GenealogyNode => !!childNode)

                if (childrenNodes.length > 0) {
                    node.children = childrenNodes
                }
            }
        }

        return node
    }

    public buildGenealogyTree(strainId: string, allStrains: Strain[]): GenealogyNode | null {
        const rootStrain = allStrains.find((s) => s.id === strainId)
        if (!rootStrain) return null

        const tree = this.findAndBuildNode(rootStrain.name, allStrains, new Set<string>())

        // Collapse nodes beyond depth 2 for initial view
        collapseNodes(tree, 0, 2)

        return tree
    }

    public calculateGeneticContribution(tree: GenealogyNode | null): GeneticContribution[] {
        if (!tree) return []
        const contributions = new Map<string, number>()
        function traverse(node: GenealogyNode, contribution: number) {
            const children = node.children || node._children
            if (!children || children.length === 0) {
                const previousContribution = contributions.get(node.name) ?? 0
                contributions.set(node.name, previousContribution + contribution)
                return
            }
            const childContribution = contribution / children.length
            for (const child of children) {
                traverse(child, childContribution)
            }
        }
        traverse(tree, 1.0)
        return Array.from(contributions.entries())
            .map(([name, contribution]) => ({ name, contribution: contribution * 100 }))
            .toSorted((a, b) => b.contribution - a.contribution)
    }

    public findDescendants(
        strainId: string,
        allStrains: Strain[],
    ): { children: Strain[]; grandchildren: Strain[] } {
        const rootStrain = allStrains.find((s) => s.id === strainId)
        if (!rootStrain) {
            return { children: [], grandchildren: [] }
        }

        const children = this._findDirectChildren(rootStrain.name, allStrains)
        const grandchildren = children.flatMap((child) =>
            this._findDirectChildren(child.name, allStrains),
        )
        const uniqueGrandchildren = uniqueById(grandchildren)

        return { children, grandchildren: uniqueGrandchildren }
    }

    public estimateOffspringProfile(
        parentA: Strain,
        parentB: Strain,
        phenotypes: {
            parentA: { vigor: number; resin: number; aroma: number; resistance: number }
            parentB: { vigor: number; resin: number; aroma: number; resistance: number }
        },
    ): {
        thc: number | null
        cbd: number | null
        floweringWeeks: number | null
        stabilityScore: number | null
        vigorScore: number
        resinScore: number
        aromaScore: number
        resistanceScore: number
    } {
        const vigorScore = averagePair(
            clampTen(phenotypes.parentA.vigor),
            clampTen(phenotypes.parentB.vigor),
        )
        const resinScore = averagePair(
            clampTen(phenotypes.parentA.resin),
            clampTen(phenotypes.parentB.resin),
        )
        const aromaScore = averagePair(
            clampTen(phenotypes.parentA.aroma),
            clampTen(phenotypes.parentB.aroma),
        )
        const resistanceScore = averagePair(
            clampTen(phenotypes.parentA.resistance),
            clampTen(phenotypes.parentB.resistance),
        )

        const thc = offsetMeasurement(
            averageKnownMeasurements(parentA.thc, parentB.thc),
            (resinScore - 5) * 0.35,
        )
        const cbd = flooredMeasurement(
            averageKnownMeasurements(parentA.cbd, parentB.cbd),
            (resistanceScore - 5) * 0.08,
            0,
        )
        const floweringWeeks = flooredMeasurement(
            averageKnownMeasurements(parentA.floweringTime, parentB.floweringTime),
            -(vigorScore - 5) * 0.15,
            6,
        )
        const stabilityScore = stabilityOrNull(
            finiteMeasurement(parentA.thc),
            finiteMeasurement(parentB.thc),
            finiteMeasurement(parentA.floweringTime),
            finiteMeasurement(parentB.floweringTime),
            resistanceScore,
        )

        return {
            thc,
            cbd,
            floweringWeeks,
            stabilityScore,
            vigorScore,
            resinScore,
            aromaScore,
            resistanceScore,
        }
    }
}

export const geneticsService = new GeneticsService()
