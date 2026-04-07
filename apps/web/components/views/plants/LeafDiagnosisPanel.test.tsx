import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/tests/test-utils'
import { PlantStage, StrainType } from '@/types'
import type { Plant } from '@/types'
import { LeafDiagnosisPanel } from '@/components/views/plants/LeafDiagnosisPanel'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/services/plantDiseaseModelService', () => ({
    isModelCached: vi.fn().mockResolvedValue(false),
    getModelStatus: vi.fn(() => 'not-cached' as const),
    downloadModel: vi.fn().mockResolvedValue(false),
    ensureWorkerRegistered: vi.fn(),
}))

vi.mock('@/services/localAiDiagnosisService', () => ({
    classifyLeafImage: vi.fn().mockResolvedValue({
        label: 'spider_mites',
        confidence: 0.85,
        top5: [],
        severity: 'severe',
        recommendations: [],
        modelUsed: 'onnx-mobilenet',
        latencyMs: 100,
    }),
}))

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const buildPlant = (): Plant =>
    ({
        id: 'panel-test-1',
        growId: 'default-grow',
        name: 'PanelPlant',
        strain: {
            id: 's1',
            name: 'PanelStrain',
            type: StrainType.Indica,
            floweringType: 'Photoperiod',
            thc: 20,
            cbd: 0.5,
            floweringTime: 8,
            agronomic: { difficulty: 'Easy', yield: 'High', height: 'Short' },
            geneticModifiers: {
                pestResistance: 0.5,
                nutrientUptakeRate: 1,
                stressTolerance: 0.7,
                rue: 1.2,
                vpdTolerance: { min: 0.5, max: 1.5 },
                transpirationFactor: 1,
                stomataSensitivity: 0.5,
            },
        },
        mediumType: 'Soil',
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        age: 30,
        stage: PlantStage.Vegetative,
        health: 90,
        stressLevel: 10,
        height: 40,
        biomass: { total: 50, stem: 10, leaves: 30, flowers: 10 },
        leafAreaIndex: 2.5,
        isTopped: false,
        lstApplied: 0,
        environment: {
            internalTemperature: 24,
            internalHumidity: 55,
            vpd: 1.1,
            co2Level: 800,
        },
        medium: {
            ph: 6.2,
            ec: 1.4,
            moisture: 0.6,
            microbeHealth: 0.8,
            substrateWater: 0.5,
            nutrientConcentration: { nitrogen: 150, phosphorus: 50, potassium: 200 },
        },
        nutrientPool: { nitrogen: 80, phosphorus: 30, potassium: 120 },
        rootSystem: { health: 0.9, rootMass: 40 },
        equipment: {
            light: { type: 'LED', wattage: 300, isOn: true, lightHours: 18 },
            exhaustFan: { power: 'medium', isOn: true },
            circulationFan: { isOn: true },
            potSize: 11,
            potType: 'Fabric',
        },
        problems: [],
        journal: [],
        tasks: [],
        harvestData: null,
        structuralModel: { branches: 4, nodes: 8 },
        history: [],
        cannabinoidProfile: { thc: 18, cbd: 0.4, cbn: 0 },
        terpeneProfile: {},
        stressCounters: { vpd: 0, ph: 0, ec: 0, moisture: 0 },
        simulationClock: { accumulatedDayMs: 0 },
    }) as Plant

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LeafDiagnosisPanel', () => {
    it('renders the upload button for image selection', () => {
        renderWithProviders(<LeafDiagnosisPanel plant={buildPlant()} />)
        expect(screen.getByTestId('upload-button')).toBeInTheDocument()
    })

    it('shows the model-not-loaded warning in the initial state', () => {
        renderWithProviders(<LeafDiagnosisPanel plant={buildPlant()} />)
        // Initial useState value is 'not-cached', so the warning renders
        // before any async effect runs.
        expect(screen.getByTestId('model-not-loaded')).toBeInTheDocument()
    })

    it('renders the analyze button in a disabled state when no image is selected', () => {
        renderWithProviders(<LeafDiagnosisPanel plant={buildPlant()} />)
        // canAnalyze = isReady && imageData !== null && !loading
        // Initial modelStatus='not-cached' means isReady=false, so button is disabled.
        expect(screen.getByTestId('analyze-button')).toBeDisabled()
    })

    it('renders both diagnosis tab buttons', () => {
        renderWithProviders(<LeafDiagnosisPanel plant={buildPlant()} />)
        expect(screen.getByTestId('diagnosis-tabs')).toBeInTheDocument()
        expect(screen.getByTestId('tab-ai')).toBeInTheDocument()
        expect(screen.getByTestId('tab-manual')).toBeInTheDocument()
    })

    it('switches to manual tab and shows the wizard', async () => {
        renderWithProviders(<LeafDiagnosisPanel plant={buildPlant()} />)
        fireEvent.click(screen.getByTestId('tab-manual'))
        // Lazy-loaded wizard should appear
        const wizard = await screen.findByTestId('wizard-question')
        expect(wizard).toBeInTheDocument()
    })
})
