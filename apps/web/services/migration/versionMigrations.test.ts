import { describe, expect, it } from 'vitest'
import { APP_VERSION } from '@/constants'
import { StrainType } from '@/types'
import type { Strain } from '@/types'
import type { PersistedState } from '@/services/migration/migrationTypes'
import {
    applyVersionMigrations,
    mergeStrainCatalogForUpdate,
} from '@/services/migration/versionMigrations'

const makeStrain = (id: string, name: string, thc = 20): Strain =>
    ({
        id,
        name,
        type: StrainType.Hybrid,
        floweringType: 'Photoperiod',
        thc,
        cbd: 1,
        floweringTime: 60,
        agronomic: { difficulty: 'Easy', yield: 'High', height: 'Medium' },
        geneticModifiers: {
            pestResistance: 1,
            nutrientUptakeRate: 1,
            stressTolerance: 1,
            rue: 1,
            vpdTolerance: { min: 0.4, max: 1.6 },
            transpirationFactor: 1,
            stomataSensitivity: 1,
        },
    }) as Strain

describe('versionMigrations', () => {
    it('mergeStrainCatalogForUpdate keeps legacy-only strains and merges overlaps', () => {
        const legacy = [makeStrain('a', 'Legacy A', 15)]
        const bundled = [makeStrain('a', 'Bundled A', 22), makeStrain('b', 'Bundled B')]
        const merged = mergeStrainCatalogForUpdate(legacy, bundled)
        expect(merged).toHaveLength(2)
        const mergedA = merged.find((s) => s.id === 'a')
        expect(mergedA?.thc).toBe(22)
        expect(merged.find((s) => s.id === 'b')?.name).toBe('Bundled B')
    })

    it('mergeStrainCatalogForUpdate skips duplicate bundled ids', () => {
        const bundled = [makeStrain('dup', 'One'), makeStrain('dup', 'Two')]
        const merged = mergeStrainCatalogForUpdate([], bundled)
        expect(merged).toHaveLength(1)
        expect(merged[0]?.name).toBe('One')
    })

    it('applyVersionMigrations deep-merges settings when already at APP_VERSION', () => {
        const state = {
            settings: { settings: { general: { language: 'de' } } },
        } as unknown as PersistedState
        const result = applyVersionMigrations(state, APP_VERSION)
        expect(result.settings?.settings.general?.language).toBe('de')
        expect(result.settings?.settings.aiMode).toBeDefined()
    })

    it('applyVersionMigrations runs sequential migrations from v1', () => {
        const state = {
            settings: { settings: {} },
            simulation: {
                plants: {
                    entities: {
                        p1: { createdAt: 1 },
                    },
                },
            },
        } as unknown as PersistedState
        const result = applyVersionMigrations(state, 1)
        expect(result.settings?.settings).toBeDefined()
        expect(result._sliceVersions).toBeDefined()
    })
})
