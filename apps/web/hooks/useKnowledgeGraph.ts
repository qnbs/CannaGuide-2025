// ---------------------------------------------------------------------------
// useKnowledgeGraph -- React hook for Knowledge Graph integration
//
// Initializes the graph with current plant data and provides
// cross-module links and AI context enrichment.
// ---------------------------------------------------------------------------

import { useMemo } from 'react'
import { useAppSelector } from '@/stores/store'
import { selectAllPlants } from '@/stores/selectors'
import {
    knowledgeGraph,
    type CrossModuleLink,
    type QueryContext,
} from '@/services/knowledgeGraphService'
import type { PlantStage } from '@/types'

interface KnowledgeGraphResult {
    /** Related cross-module links for the given context */
    readonly relatedLinks: CrossModuleLink[]
    /** Enriched AI context string */
    readonly aiContext: string
    /** Whether the graph has been initialized */
    readonly isReady: boolean
}

/**
 * Hook that provides knowledge graph queries for a given plant or stage context.
 *
 * @param plantId - Optional plant ID to scope the query
 * @param currentStage - Optional stage to prioritize stage-relevant knowledge
 * @param maxResults - Maximum number of related links (default: 8)
 */
export function useKnowledgeGraph(
    plantId?: string,
    currentStage?: PlantStage,
    maxResults = 8,
): KnowledgeGraphResult {
    const plants = useAppSelector(selectAllPlants)

    return useMemo(() => {
        knowledgeGraph.initialize()

        if (plants.length > 0) {
            knowledgeGraph.injectPlants(plants)
        }

        const context: QueryContext = {
            plantId,
            currentStage,
            maxResults,
        }

        const relatedLinks = knowledgeGraph.getRelatedLinks(context)
        const aiContext = knowledgeGraph.buildAiContext(context)

        return {
            relatedLinks,
            aiContext,
            isReady: true,
        }
    }, [plants, plantId, currentStage, maxResults])
}
