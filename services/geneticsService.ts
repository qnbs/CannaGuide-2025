import { Strain, GenealogyNode, StrainType, GeneticContribution } from '@/types';

class GeneticsService {
    private findAndBuildNode(
        strainName: string,
        allStrains: Strain[],
        visited: Set<string>
    ): GenealogyNode {
        const trimmedName = strainName.trim().toLowerCase();
        // Handle cases like "OG Kush (phenotype)"
        const cleanedName = trimmedName.replace(/\s*\(.*\)/, '').trim();
        const strain = allStrains.find(s => s.name.toLowerCase() === cleanedName);

        if (!strain) {
            // Assume it's a landrace if not found
            return {
                name: strainName.trim(),
                id: `landrace-${cleanedName.replace(/[^a-z0-9]/g, '-')}`,
                isLandrace: true,
                type: StrainType.Hybrid, // Default type
                thc: 0,
            };
        }
        
        // Circular dependency check
        if (visited.has(strain.id)) {
            return {
                name: strain.name,
                id: strain.id,
                type: strain.type,
                thc: strain.thc,
                isLandrace: false,
                isPlaceholder: true, // Mark as placeholder to prevent infinite recursion
            };
        }

        const isLandrace = !strain.genetics || !strain.genetics.toLowerCase().includes(' x ');

        const node: GenealogyNode = {
            name: strain.name,
            id: strain.id,
            type: strain.type,
            thc: strain.thc,
            isLandrace: isLandrace,
        };
        
        const newVisited = new Set(visited);
        newVisited.add(strain.id);

        if (!isLandrace && strain.genetics) {
            const parentNames = strain.genetics
                .split(/\s+x\s+/i)
                .map(p => p.replace(/[()]/g, '').trim())
                .filter(p => p.length > 0 && p.toLowerCase() !== 'unknown' && !p.toLowerCase().includes('phenotype'));

            if (parentNames.length > 0) {
                const childrenNodes = parentNames
                    .map(parentName => this.findAndBuildNode(parentName, allStrains, newVisited))
                    .filter((childNode): childNode is GenealogyNode => !!childNode);

                if (childrenNodes.length > 0) {
                    node.children = childrenNodes;
                }
            }
        }
        
        return node;
    }

    public buildGenealogyTree(strainId: string, allStrains: Strain[]): GenealogyNode | null {
        const rootStrain = allStrains.find(s => s.id === strainId);
        if (!rootStrain) return null;
        return this.findAndBuildNode(rootStrain.name, allStrains, new Set<string>());
    }
    
    public calculateGeneticContribution(tree: GenealogyNode | null): GeneticContribution[] {
        if (!tree) return [];
        const contributions: { [name: string]: number } = {};
        function traverse(node: GenealogyNode, contribution: number) {
            const children = node.children || node._children;
            if (!children || children.length === 0) {
                contributions[node.name] = (contributions[node.name] || 0) + contribution;
                return;
            }
            const childContribution = contribution / children.length;
            for (const child of children) {
                traverse(child, childContribution);
            }
        }
        traverse(tree, 1.0);
        return Object.entries(contributions)
            .map(([name, contribution]) => ({ name, contribution: contribution * 100 }))
            .sort((a, b) => b.contribution - a.contribution);
    }

    public findDescendants(strainId: string, allStrains: Strain[]): { children: Strain[], grandchildren: Strain[] } {
        const rootStrain = allStrains.find(s => s.id === strainId);
        if (!rootStrain) {
            return { children: [], grandchildren: [] };
        }
        const findDirectChildren = (parentName: string): Strain[] => {
            const lowerParentName = parentName.toLowerCase();
            return allStrains.filter(s =>
                s.genetics && s.genetics.toLowerCase().split(/\s+x\s+/i).map(p => p.trim().replace(/\s*\(.*\)/, '').trim()).includes(lowerParentName)
            );
        };
        const children = findDirectChildren(rootStrain.name);
        const grandchildren = children.flatMap(child => findDirectChildren(child.name));
        return { children, grandchildren: [...new Map(grandchildren.map(item => [item.id, item])).values()] };
    }
}

export const geneticsService = new GeneticsService();