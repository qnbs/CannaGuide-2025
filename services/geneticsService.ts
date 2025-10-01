import { Strain, GenealogyNode } from '@/types';

class GeneticsService {

    private parseParents(genetics: string): string[] {
        // Remove content within parentheses that doesn't contain 'x' (like phenotype info)
        let cleanGenetics = genetics.replace(/\(([^)]*?)\)/g, (match) => {
            return match.toLowerCase().includes(' x ') ? match : '';
        });

        // Remove all parentheses
        cleanGenetics = cleanGenetics.replace(/[()]/g, '');

        // Split by 'x' and trim whitespace
        return cleanGenetics.split(/\s*x\s*/i)
            .map(p => p.trim())
            .filter(p => p && p.toLowerCase() !== 'unknown' && p.toLowerCase() !== 'clone-only' && p.toLowerCase() !== 'phenotype');
    }

    private findAndBuildNode(
        strainName: string,
        allStrains: Strain[],
        visited: Set<string>
    ): GenealogyNode | null {
        // Find the strain in the master list, case-insensitive
        const strain = allStrains.find(s => s.name.toLowerCase() === strainName.toLowerCase());

        // Base case 1: Strain not found in the database (e.g., landrace or unlisted parent)
        if (!strain) {
            return {
                name: strainName,
                id: strainName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            };
        }

        // Base case 2: Circular dependency detected
        if (visited.has(strain.id)) {
            return {
                name: `${strain.name} (Circular)`,
                id: strain.id,
            };
        }

        // Add current strain to the visited set for this path
        const newVisited = new Set(visited);
        newVisited.add(strain.id);

        // Create the node for the current strain
        const node: GenealogyNode = {
            name: strain.name,
            id: strain.id,
            type: strain.type,
        };

        // Recursive step: Parse genetics and find children
        if (strain.genetics) {
            const parentNames = this.parseParents(strain.genetics);

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