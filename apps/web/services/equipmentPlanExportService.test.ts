import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Recommendation } from '@/types'

vi.mock('jspdf', () => {
    const handler: ProxyHandler<Record<string, unknown>> = {
        get(_target, prop) {
            if (prop === 'lastAutoTable') return { finalY: 30 }
            if (prop === 'internal')
                return {
                    getNumberOfPages: () => 1,
                    pageSize: { getWidth: () => 210 },
                }
            if (prop === 'splitTextToSize') return (_text: string) => ['text']
            if (prop === 'output') return (_type: string) => new Blob(['pdf'])
            return vi.fn().mockReturnThis()
        },
    }
    class MockJsPDF {
        constructor() {
            return new Proxy({}, handler) as unknown as MockJsPDF
        }
    }
    return { default: MockJsPDF }
})

vi.mock('jspdf-autotable', () => ({}))

import {
    exportEquipmentPlanPdf,
    type EquipmentPlanExportData,
} from '@/services/equipmentPlanExportService'

const mockRoomDimensions = { width: 120, depth: 120, height: 220 }

const mockRecommendation: Recommendation = {
    tent: { name: 'Budget Tent 120x120', price: 80, rationale: 'Good value' },
    light: { name: 'Spider Farmer SF2000', price: 250, rationale: 'Efficient LED', watts: 200 },
    ventilation: { name: 'RVK 100A1', price: 80, rationale: 'Reliable' },
    circulationFan: { name: 'Clip fan 16cm', price: 20, rationale: 'Simple' },
    pots: { name: '11L fabric pots x4', price: 25, rationale: 'Breathable' },
    soil: { name: 'Biobizz AllMix 50L', price: 30, rationale: 'Pre-fertilized' },
    nutrients: { name: 'Biobizz starter pack', price: 50, rationale: 'Complete kit' },
    extra: { name: 'pH meter + TDS meter', price: 30, rationale: 'Essential monitoring' },
    proTip: 'Keep VPD between 0.8-1.2 kPa during flower.',
}

describe('equipmentPlanExportService', () => {
    let clickSpy: ReturnType<typeof vi.fn>
    let appendChildSpy: ReturnType<typeof vi.spyOn>
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        clickSpy = vi.fn()
        appendChildSpy = vi
            .spyOn(document.body, 'appendChild')
            .mockReturnValue(null as unknown as Node)
        createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
        vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined)
        vi.spyOn(document, 'createElement').mockReturnValue({
            href: '',
            download: '',
            click: clickSpy,
            remove: vi.fn(),
        } as unknown as HTMLElement)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('calls createObjectURL and triggers download for minimal data', () => {
        const data: EquipmentPlanExportData = {
            roomDimensions: mockRoomDimensions,
            sharedLightWattage: 400,
        }
        exportEquipmentPlanPdf(data, 'en')
        expect(createObjectURLSpy).toHaveBeenCalled()
        expect(appendChildSpy).toHaveBeenCalled()
        expect(clickSpy).toHaveBeenCalled()
    })

    it('includes budget section when budgetItems provided', () => {
        const data: EquipmentPlanExportData = {
            roomDimensions: mockRoomDimensions,
            sharedLightWattage: 400,
            budgetItems: { tent: 80, light: 200 },
            budgetTotal: 280,
        }
        expect(() => exportEquipmentPlanPdf(data, 'en')).not.toThrow()
    })

    it('includes recommendation section when provided', () => {
        const data: EquipmentPlanExportData = {
            roomDimensions: mockRoomDimensions,
            sharedLightWattage: 400,
            recommendation: mockRecommendation,
        }
        expect(() => exportEquipmentPlanPdf(data, 'de')).not.toThrow()
    })

    it('generates PDF filename with date', () => {
        const data: EquipmentPlanExportData = {
            roomDimensions: mockRoomDimensions,
            sharedLightWattage: 200,
            ventilationM3h: 150,
            co2BoostL: 3.2,
            lightHeightCm: 45,
        }
        const elemSpy = vi.spyOn(document, 'createElement')
        exportEquipmentPlanPdf(data, 'en')
        const call = elemSpy.mock.calls.find(([tag]) => tag === 'a')
        expect(call).toBeDefined()
    })
})
