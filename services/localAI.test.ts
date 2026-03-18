import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { localAiService } from '@/services/localAI'
import { detectOnnxBackend } from '@/services/localAIModelLoader'
import { PlantStage, type Plant, type Strain, StrainType } from '@/types'

const pipelineMock = vi.fn()

vi.mock('@xenova/transformers', () => ({
    env: {},
    pipeline: (...args: unknown[]) => pipelineMock(...args),
}))

vi.mock('@/i18n', () => ({
    getT: () => (key: string) => key,
}))

const buildPlant = (): Plant => ({
    id: 'plant-1',
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
        vi.restoreAllMocks()
        vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['x'], { type: 'image/jpeg' }))))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('combines zero-shot labels with heuristic diagnosis', async () => {
        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'zero-shot-image-classification') {
                return vi.fn(async () => ([
                    { label: 'nitrogen deficiency', score: 0.93 },
                    { label: 'healthy plant', score: 0.07 },
                ]))
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const result = await localAiService.diagnosePlant('ZmFrZQ==', 'image/jpeg', buildPlant(), 'Lower leaves yellow', 'en')

        expect(result.title).toContain('Local Diagnosis')
        expect(result.confidence).toBeGreaterThan(0.9)
        expect(result.diagnosis.toLowerCase()).toContain('nitrogen')
        expect(result.content.toLowerCase()).toContain('nitrogen')
    })

    it('parses mentor JSON from the local text model', async () => {
        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'text-generation') {
                return vi.fn(async () => ([{ generated_text: '{"title":"Local Mentor","content":"Use less water.","uiHighlights":[]}' }]))
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const response = await localAiService.getMentorResponse(buildPlant(), 'What should I fix?', 'Recent log lines', 'en')

        expect(response.title).toBe('Local Mentor')
        expect(response.content).toBe('Use less water.')
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
        expect(steps[0]).toEqual([0, 2, 'text-model'])
    })

    it('preloadOfflineAssets counts failures when pipelines reject', async () => {
        // Clear cached pipeline promises from prior tests
        const svc = localAiService as unknown as Record<string, unknown>
        svc.textPipelinePromise = null
        svc.visionPipelinePromise = null
        svc.webLlmPromise = null

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
        const svc = localAiService as unknown as Record<string, unknown>
        svc.visionPipelinePromise = null

        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'zero-shot-image-classification') {
                return vi.fn(async () => ([
                    { label: 'root rot', score: 0.88 },
                    { label: 'overwatering', score: 0.08 },
                    { label: 'healthy plant', score: 0.04 },
                ]))
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const result = await localAiService.diagnosePlant('ZmFrZQ==', 'image/jpeg', buildPlant(), '', 'en')

        expect(result.diagnosis.toLowerCase()).toContain('root rot')
        expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('maps new German label for botrytis bud rot', async () => {
        const svc = localAiService as unknown as Record<string, unknown>
        svc.visionPipelinePromise = null

        pipelineMock.mockImplementation(async (task: string) => {
            if (task === 'zero-shot-image-classification') {
                return vi.fn(async () => ([
                    { label: 'botrytis bud rot', score: 0.91 },
                    { label: 'healthy plant', score: 0.09 },
                ]))
            }
            throw new Error(`Unexpected task ${task}`)
        })

        const result = await localAiService.diagnosePlant('ZmFrZQ==', 'image/jpeg', buildPlant(), '', 'de')

        expect(result.diagnosis.toLowerCase()).toContain('botrytis')
        expect(result.title).toContain('Lokale Diagnose')
    })
})
