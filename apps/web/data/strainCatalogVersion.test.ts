import { describe, expect, it } from 'vitest'
import { getCatalogVersion } from '@/data/strainCatalogVersion'

describe('strainCatalogVersion', () => {
    it('exposes manifest with expected schema and count', () => {
        const manifest = getCatalogVersion()
        expect(manifest.schema).toBe('strain-v2')
        expect(manifest.strainCount).toBe(776)
        expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/)
        expect(manifest.generatedAt).toBeTruthy()
    })
})

describe('strainService.getCatalogVersion re-export', () => {
    it('matches data module', async () => {
        const { getCatalogVersion: fromService } = await import('@/services/strainService')
        expect(fromService()).toEqual(getCatalogVersion())
    })
})
