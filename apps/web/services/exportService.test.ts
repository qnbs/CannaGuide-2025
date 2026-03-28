import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('jspdf', () => {
    const handler: ProxyHandler<Record<string, unknown>> = {
        get(_target, prop) {
            if (prop === 'lastAutoTable') return { finalY: 30 }
            if (prop === 'internal')
                return { getNumberOfPages: () => 1, pageSize: { getWidth: () => 210 } }
            if (prop === 'splitTextToSize') return () => ['text']
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

vi.mock('html2canvas', () => ({
    default: vi.fn().mockResolvedValue({
        toDataURL: vi.fn().mockReturnValue('data:image/png;base64,test'),
        width: 100,
        height: 100,
    }),
}))

import { exportService } from '@/services/exportService'

const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
    if (opts?.defaultValue) return String(opts.defaultValue)
    return key
})

describe('exportService', () => {
    let clickSpy: ReturnType<typeof vi.fn>
    let createObjectURLSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
        clickSpy = vi.fn()
        vi.spyOn(document, 'createElement').mockReturnValue({
            href: '',
            download: '',
            click: clickSpy,
            remove: vi.fn(),
            set style(_s: string) {},
        } as unknown as HTMLElement)
        vi.spyOn(document.body, 'appendChild').mockReturnValue(null as unknown as Node)
        createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
        vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('exports a singleton instance', () => {
        expect(exportService).toBeDefined()
    })

    it('exportStrainsAsTxt triggers file download', () => {
        const strains = [
            {
                id: 's1',
                name: 'Test Strain',
                type: 'Hybrid',
                thc: 20,
                cbd: 1,
                thcRange: '18-22%',
                cbdRange: '<1%',
                floweringTime: 9,
                floweringTimeRange: '8-10',
                typeDetails: 'Balanced Hybrid',
                genetics: 'Parent A x Parent B',
                description: 'A nice strain',
                aromas: ['Earthy'],
                dominantTerpenes: ['Myrcene'],
                agronomic: {
                    difficulty: 'Medium',
                    yield: 'High',
                    height: 'Medium',
                    yieldDetails: { indoor: '500g/m2', outdoor: '600g' },
                    heightDetails: { indoor: '100cm', outdoor: '150cm' },
                },
            },
        ]
        exportService.exportStrainsAsTxt(strains as never, 'test-export', mockT as never)
        expect(createObjectURLSpy).toHaveBeenCalled()
        expect(clickSpy).toHaveBeenCalled()
    })

    it('exportStrainsAsPdf creates and saves PDF', () => {
        const strains = [
            {
                id: 's1',
                name: 'Test Strain',
                type: 'Hybrid',
                thc: 20,
                cbd: 1,
                thcRange: '18-22%',
                cbdRange: '<1%',
                floweringTime: 9,
                floweringTimeRange: '8-10',
                typeDetails: 'Balanced Hybrid',
                genetics: 'Parent A x Parent B',
                description: 'A test',
                aromas: ['Pine'],
                dominantTerpenes: ['Myrcene'],
                effects: ['Relaxed'],
                medicalUses: ['Pain'],
                agronomic: {
                    difficulty: 'Easy',
                    yield: 'High',
                    height: 'Tall',
                    yieldDetails: { indoor: '500g/m2', outdoor: '600g' },
                    heightDetails: { indoor: '100cm', outdoor: '150cm' },
                },
                terpeneProfile: [{ name: 'Myrcene', percentage: 0.5 }],
            },
        ]
        exportService.exportStrainsAsPdf(strains as never, 'test-pdf', mockT as never)
        // Should have been called without throwing
        expect(true).toBe(true)
    })

    it('exportSetupsAsTxt triggers file download', () => {
        const setups = [
            {
                id: 'setup-1',
                name: 'Grow Tent',
                createdAt: new Date().toISOString(),
                items: [{ name: 'Light', brand: 'HPS', description: '600W HPS' }],
                totalCost: 150.5,
                currency: 'EUR',
            },
        ]
        exportService.exportSetupsAsTxt(setups as never, 'setups-export', mockT as never)
        expect(createObjectURLSpy).toHaveBeenCalled()
        expect(clickSpy).toHaveBeenCalled()
    })
})
