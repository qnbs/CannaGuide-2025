import { Strain, GenealogyNode } from '@/types';

class GeneticsService {

    private findAndBuildNode(
        strainName: string,
        allStrains: Strain[],
        visited: Set<string>
    ): GenealogyNode {
        // Find the strain in the master list, case-insensitive and trimmed
        const strain = allStrains.find(s => s.name.toLowerCase() === strainName.trim().toLowerCase());

        // Base case 1: Strain not found in the database (e.g., landrace or unlisted parent)
        if (!strain) {
            const trimmedName = strainName.trim();
            return {
                name: trimmedName,
                id: trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            };
        }

        // Base case 2: Circular dependency detected
        if (visited.has(strain.id)) {
            return {
                name: `${strain.name} (Circular)`,
                id: strain.id,
            };
        }

        // Create the node for the current strain
        const node: GenealogyNode = {
            name: strain.name,
            id: strain.id,
        };

        // Add current strain to the visited set for this path
        const newVisited = new Set(visited);
        newVisited.add(strain.id);

        // Recursive step: Parse genetics and find children
        const genetics = strain.genetics;
        if (genetics && genetics.toLowerCase().includes(' x ')) {
            const parentNames = genetics
                .replace(/[()\[\]]/g, '') // Remove parentheses and brackets
                .split(/\s*x\s*/i)     // Split by 'x', case-insensitive with surrounding spaces
                .map(p => p.trim())
                .filter(p => p.length > 0 && p.toLowerCase() !== 'unknown' && !p.toLowerCase().includes('phenotype'));

            if (parentNames.length > 0) {
                node.children = parentNames
                    .map(parentName => this.findAndBuildNode(parentName, allStrains, newVisited))
                    .filter((childNode): childNode is GenealogyNode => !!childNode);
                
                if(node.children.length === 0) {
                    delete node.children;
                }
            }
        }
        
        return node;
    }

    /**
     * Builds a hierarchical genealogy tree for a given strain.
     * @param strainId The ID of the strain to start the tree from.
     * @param allStrains The complete list of all available strains.
     * @returns A root GenealogyNode or null if the initial strain is not found.
     */
    public buildGenealogyTree(
        strainId: string,
        allStrains: Strain[]
    ): GenealogyNode | null {
        const rootStrain = allStrains.find(s => s.id === strainId);
        if (!rootStrain) {
            return null;
        }

        return this.findAndBuildNode(rootStrain.name, allStrains, new Set<string>());
    }
}

export const geneticsService = new GeneticsService();
