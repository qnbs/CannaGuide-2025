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

const cleanedCanonicalName = (canonicalName: string): string =>
    canonicalName
        .toLowerCase()
        .replace(/\s*\(.*\)/, '')
        .trim()

const parseParentNames = (genetics: string): string[] =>
    genetics
        .split(/\s+x\s+/i)
        .map((p) => p.replace(/[()]/g, '').trim())
        .filter(
            (p) =>
                p.length > 0 &&
                p.toLowerCase() !== 'unknown' &&
                !p.toLowerCase().includes('phenotype'),
        )

const uniqueById = <T extends { id: string }>(items: T[]): T[] => [
    ...new Map(items.map((item) => [item.id, item])).values(),
]

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
        thc: number
        cbd: number
        floweringWeeks: number
        stabilityScore: number
        vigorScore: number
        resinScore: number
        aromaScore: number
        resistanceScore: number
    } {
        const avg = (a: number, b: number) => (a + b) / 2
        const norm = (value: number) => Math.max(0, Math.min(10, value))

        const vigorScore = avg(norm(phenotypes.parentA.vigor), norm(phenotypes.parentB.vigor))
        const resinScore = avg(norm(phenotypes.parentA.resin), norm(phenotypes.parentB.resin))
        const aromaScore = avg(norm(phenotypes.parentA.aroma), norm(phenotypes.parentB.aroma))
        const resistanceScore = avg(
            norm(phenotypes.parentA.resistance),
            norm(phenotypes.parentB.resistance),
        )

        const thc = avg(parentA.thc, parentB.thc) + (resinScore - 5) * 0.35
        const cbd = Math.max(0, avg(parentA.cbd, parentB.cbd) + (resistanceScore - 5) * 0.08)
        const floweringWeeks = Math.max(
            6,
            avg(parentA.floweringTime, parentB.floweringTime) - (vigorScore - 5) * 0.15,
        )

        const stabilityScore = Math.max(
            0,
            Math.min(
                100,
                55 +
                    (10 - Math.abs(parentA.thc - parentB.thc)) * 2 +
                    (10 - Math.abs(parentA.floweringTime - parentB.floweringTime)) * 1.5 +
                    resistanceScore * 1.2,
            ),
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
