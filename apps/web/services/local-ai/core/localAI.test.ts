import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearInferenceCache, localAiService } from './localAI'
import { clearPipelineCache, detectOnnxBackend } from '../models/modelLoader'
import { PlantStage, type Plant, type Strain, StrainType } from '@/types'

/** Test-internal cast to reset pipeline caches on the singleton. */
interface SvcInternal {
    modelManager: { textPipelinePromise: unknown; visionPipelinePromise: unknown }
}

const pipelineMock = vi.fn()

vi.mock('@xenova/transformers', () => ({
    env: {},
    pipeline: (...args: unknown[]) => pipelineMock(...args),
}))

// Mock i18n -- return realistic translations for diagnosis keys
const MOCK_TRANSLATIONS: Record<string, string> = {
    'plantsView.diagnosis.localDiagnosisTitle': 'Local Diagnosis: {{name}}',
    'plantsView.diagnosis.preventionTrack': 'Track light, watering, VPD, and feeding over time.',
    'plantsView.diagnosis.preventionCheck': 'Check VPD, pH, EC, and substrate moisture regularly.',
    'plantsView.diagnosis.nitrogenDeficiency':
        'Possible nitrogen deficiency: older leaves may fade or yellow first.',
    'plantsView.diagnosis.rootRot':
        'Possible root rot: brown mushy roots and foul smell indicate anaerobic conditions.',
    'plantsView.diagnosis.botrytisBudRot':
        'Possible botrytis bud rot: grey fuzzy mold inside dense colas.',
    'plantsView.diagnosis.overwatering':
        'Possible overwatering: droopy growth and slow recovery often point to saturated media.',
    'plantsView.diagnosis.healthyPlant':
        'The plant appears generally healthy in the local model scan.',
}

vi.mock('@/i18n', () => ({
    getT: () => (key: string, opts?: Record<string, string>) => {
        let val = MOCK_TRANSLATIONS[key]
        if (!val) return key
        if (opts) {
            for (const [k, v] of Object.entries(opts)) {
                val = val.replace(`{{${k}}}`, v)
            }
        }
        return val
    },
}))

const buildPlant = (): Plant => ({
    id: 'plant-1',
    growId: 'default-grow',
    name: 'Alpha',
    strain: {
        id: 'strain-1',
        name: 'Beta',
        type: StrainType.Hybrid,
        floweringType: 'Photoperiod',
        thc: 18,
        cbd: 1,
        floweringTime: 9,
        agronomic: { difficulty: 'Medium', yield: 'Medium', height: 'Medium' },
        geneticModifiers: {
            pestResistance: 0.5,
            nutrientUptakeRate: 0.5,
            stressTolerance: 0.5,
            rue: 0.5,
            vpdTolerance: { min: 0.8, max: 1.2 },
            transpirationFactor: 0.5,
            stomataSensitivity: 0.5,
        },
    } as Strain,
    mediumType: 'Soil',
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    age: 42,
    stage: PlantStage.Vegetative,
    health: 74,
    stressLevel: 18,
    height: 50,
    biomass: { total: 1, stem: 0.2, leaves: 0.5, flowers: 0.3 },
    leafAreaIndex: 1.5,
    isTopped: false,
    lstApplied: 0,
    environment: {
        internalTemperature: 26,
        internalHumidity: 58,
        vpd: 1.1,
        co2Level: 600,
    },
    medium: {
        ph: 6.1,
        ec: 1.2,
        moisture: 46,
        microbeHealth: 82,
        substrateWater: 0.5,
        nutrientConcentration: { nitrogen: 0.5, phosphorus: 0.4, potassium: 0.4 },
    },
    nutrientPool: { nitrogen: 1, phosphorus: 1, potassium: 1 },
    rootSystem: { health: 83, rootMass: 0.7 },
    equipment: {
        light: { type: 'LED', wattage: 240, isOn: true, lightHours: 18 },
        exhaustFan: { power: 'medium', isOn: true },
        circulationFan: { isOn: true },
        potSize: 11,
        potType: 'Fabric',
    },
    problems: [],
    journal: [],
    tasks: [],
    harvestData: null,
    structuralModel: { branches: 4, nodes: 12 },
    history: [],
    cannabinoidProfile: { thc: 0, cbd: 0, cbn: 0 },
    terpeneProfile: {},
    stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
    simulationClock: { accumulatedDayMs: 0 },
})

describe('localAiService', () => {
    beforeEach(() => {
        pipelineMock.mockReset()
        clearPipelineCache()
        vi.restoreAllMocks()
        vi.stubGlobal(
            'fetch',
            vi.fn(async () => new Response(new Blob(['x'], { type: 'image/jpeg' }))),
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('combines zero-shot labels with heuristic diagnosis', async () => {
        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'zero-shot-image-classification') {
                return vi.fn(async () => [
                    { label: 'nitrogen deficiency', score: 0.93 },
                    { label: 'healthy plant', score: 0.07 },
                ])
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const result = await localAiService.diagnosePlant(
            'ZmFrZQ==',
            'image/jpeg',
            buildPlant(),
            'Lower leaves yellow',
            'en',
        )

        expect(result.title).toContain('Local Diagnosis')
        expect(result.confidence).toBeGreaterThan(0.9)
        expect(result.diagnosis.toLowerCase()).toContain('nitrogen')
        expect(result.content.toLowerCase()).toContain('nitrogen')
    })

    it('parses mentor JSON from the local text model', async () => {
        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'text-generation') {
                return vi.fn(async () => [
                    {
                        generated_text:
                            '{"title":"Local Mentor","content":"Use less water.","uiHighlights":[]}',
                    },
                ])
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const response = await localAiService.getMentorResponse(
            buildPlant(),
            'What should I fix?',
            'en',
            'Recent log lines',
        )

        expect(response.title).toBe('Local Mentor')
        expect(response.content).toBe('Use less water.')
    })

    it('builds equipment recommendations locally from the text model', async () => {
        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'text-generation') {
                return vi.fn(async () => [
                    {
                        generated_text:
                            '{"tent":{"name":"100x100x200 cm grow tent","price":180,"rationale":"Enough space."},"light":{"name":"300W LED","price":320,"rationale":"Efficient lighting.","watts":300},"ventilation":{"name":"Inline fan","price":120,"rationale":"Stable airflow."},"circulationFan":{"name":"Clip fan","price":25,"rationale":"Keeps air moving."},"pots":{"name":"11 L fabric pots","price":45,"rationale":"Root aeration."},"soil":{"name":"Living soil mix","price":55,"rationale":"Forgiving substrate."},"nutrients":{"name":"Balanced nutrient kit","price":70,"rationale":"Simple base feed."},"extra":{"name":"Thermo-hygrometer","price":35,"rationale":"Track climate."},"proTip":"Dial in climate first."}',
                    },
                ])
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const recommendation = await localAiService.getEquipmentRecommendation(
            'Need a compact beginner setup',
            'en',
        )

        expect(recommendation.light.watts).toBe(300)
        expect(recommendation.tent.name).toContain('grow tent')
        expect(recommendation.proTip).toContain('climate')
    })

    it('falls back to a local nutrient recommendation when text generation is unavailable', async () => {
        clearInferenceCache()
        const svc = localAiService as unknown as SvcInternal
        svc.modelManager.textPipelinePromise = null

        pipelineMock.mockRejectedValue(new Error('offline – model unavailable'))

        const recommendation = await localAiService.getNutrientRecommendation(
            {
                medium: 'Coco',
                stage: 'Vegetative',
                currentEc: 0.8,
                currentPh: 6.9,
                optimalRange: { ecMin: 1.0, ecMax: 1.8, phMin: 5.8, phMax: 6.2 },
                readings: [
                    { ec: 0.7, ph: 6.8, readingType: 'input', timestamp: 1 },
                    { ec: 0.8, ph: 6.9, readingType: 'runoff', timestamp: 2 },
                ],
                plant: {
                    name: 'Alpha',
                    strain: { name: 'Beta' },
                    stage: 'Vegetative',
                    age: 42,
                    health: 74,
                    medium: { ph: 6.9, ec: 0.8 },
                },
            },
            'en',
        )

        expect(recommendation).toContain('EC is too low')
        expect(recommendation).toContain('pH is too high')
        expect(recommendation).toContain('Coco reacts quickly')
    })

    it('generates a local strain image data url', async () => {
        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'text-generation') {
                return vi.fn(async () => [{ generated_text: 'botanical poster concept' }])
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const strain = buildPlant().strain
        const imageData = await localAiService.generateStrainImage(strain, 'botanical', {
            focus: 'dense trichomes',
            composition: 'macro portrait',
            mood: 'calm and luminous',
        })

        expect(imageData).toContain('data:image/svg+xml')
        expect(decodeURIComponent(imageData)).toContain('botanical')
        expect(decodeURIComponent(imageData)).toContain('macro portrait')
    })

    it('preloadOfflineAssets reports progress via callback', async () => {
        pipelineMock.mockImplementation(async () => vi.fn())

        const steps: Array<[number, number, string]> = []
        const report = await localAiService.preloadOfflineAssets(false, (loaded, total, label) => {
            steps.push([loaded, total, label])
        })

        expect(report.textModelReady).toBe(true)
        expect(report.visionModelReady).toBe(true)
        expect(report.errorCount).toBe(0)
        expect(steps.length).toBeGreaterThanOrEqual(3)
        expect(steps[0]).toEqual([0, 8, 'text-model'])
    })

    it('preloadOfflineAssets counts failures when pipelines reject', async () => {
        // Clear cached pipeline promises from prior tests
        const svc = localAiService as unknown as SvcInternal
        svc.modelManager.textPipelinePromise = null
        svc.modelManager.visionPipelinePromise = null

        pipelineMock.mockRejectedValue(new Error('offline – model unavailable'))

        const report = await localAiService.preloadOfflineAssets()

        expect(report.textModelReady).toBe(false)
        expect(report.visionModelReady).toBe(false)
        expect(report.webLlmReady).toBe(false)
        expect(report.errorCount).toBe(2)
    })

    it('detects ONNX backend as wasm when WebGPU is unavailable', () => {
        expect(detectOnnxBackend()).toBe('wasm')
    })

    it('classifies expanded cannabis labels including root rot', async () => {
        const svc = localAiService as unknown as SvcInternal
        svc.modelManager.visionPipelinePromise = null

        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'zero-shot-image-classification') {
                return vi.fn(async () => [
                    { label: 'root rot', score: 0.88 },
                    { label: 'overwatering', score: 0.08 },
                    { label: 'healthy plant', score: 0.04 },
                ])
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const result = await localAiService.diagnosePlant(
            'ZmFrZQ==',
            'image/jpeg',
            buildPlant(),
            '',
            'en',
        )

        expect(result.diagnosis.toLowerCase()).toContain('root rot')
        expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('maps new German label for botrytis bud rot', async () => {
        const svc = localAiService as unknown as SvcInternal
        svc.modelManager.visionPipelinePromise = null

        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'zero-shot-image-classification') {
                return vi.fn(async () => [
                    { label: 'botrytis bud rot', score: 0.91 },
                    { label: 'healthy plant', score: 0.09 },
                ])
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const result = await localAiService.diagnosePlant(
            'ZmFrZQ==',
            'image/jpeg',
            buildPlant(),
            '',
            'de',
        )

        expect(result.diagnosis.toLowerCase()).toContain('botrytis')
        expect(result.title).toContain('Local Diagnosis')
    })
})
