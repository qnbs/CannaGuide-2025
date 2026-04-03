// ---------------------------------------------------------------------------
// knowledgeGraphService.test.ts -- Unit tests for Knowledge Graph
// ---------------------------------------------------------------------------

import { describe, it, expect, beforeEach } from 'vitest'
import { knowledgeGraph } from '@/services/knowledgeGraphService'
import { PlantStage } from '@/types'
import type { Plant } from '@/types'

describe('knowledgeGraphService', () => {
    beforeEach(() => {
        // Reset the graph by re-initializing
        knowledgeGraph.initialize()
    })

    it('should initialize with static data nodes', () => {
        knowledgeGraph.initialize()
        const stats = knowledgeGraph.getStats()
        // Should have disease, lexicon, learningPath, calculator, nutrient, stage nodes
        expect(stats.nodeCount).toBeGreaterThan(0)
        expect(stats.edgeCount).toBeGreaterThan(0)
    })

    it('should inject plants and create plant nodes', () => {
        const mockPlant: Plant = {
            id: 'test-plant-1',
            name: 'Test Plant',
            stage: PlantStage.Vegetative,
            age: 30,
            health: 85,
            environment: {
                internalTemperature: 24,
                internalHumidity: 55,
                vpd: 1.2,
                lightPpfd: 600,
                co2Ppm: 400,
            },
            medium: {
                ph: 6.2,
                ec: 1.5,
                moisture: 60,
                type: 'soil',
            },
            problems: [],
            tasks: [],
            journal: [],
            notes: [],
        } as unknown as Plant

        knowledgeGraph.injectPlants([mockPlant])
        const stats = knowledgeGraph.getStats()
        expect(stats.nodeCount).toBeGreaterThan(0)
    })

    it('should return related links for a stage context', () => {
        knowledgeGraph.initialize()
        const links = knowledgeGraph.getRelatedLinks({
            currentStage: PlantStage.Flowering,
            maxResults: 5,
        })
        expect(Array.isArray(links)).toBe(true)
    })

    it('should build AI context string', () => {
        knowledgeGraph.initialize()
        const context = knowledgeGraph.buildAiContext({
            currentStage: PlantStage.Seedling,
            maxResults: 3,
        })
        expect(typeof context).toBe('string')
    })

    it('should limit results to maxResults', () => {
        knowledgeGraph.initialize()
        const links = knowledgeGraph.getRelatedLinks({
            maxResults: 2,
        })
        expect(links.length).toBeLessThanOrEqual(2)
    })
})
