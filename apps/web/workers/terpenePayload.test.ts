import { describe, expect, it } from 'vitest'

import {
    readAnalyzeEntourage,
    readBatchChemovar,
    readBuildChemovar,
    readFindSimilar,
    readPredictBreeding,
    readScoreEffects,
} from './terpenePayload'

const named = {
    id: 's1',
    name: 'Named',
    terpeneProfile: { Myrcene: 0.4 },
}

describe('terpene worker payload readers', () => {
    it('rejects a null batch entry and a non-numeric profile value', () => {
        expect(readBatchChemovar({ strains: [null] })).toBeUndefined()
        expect(
            readBatchChemovar({
                strains: [{ id: 's1', name: 'Named', terpeneProfile: { Myrcene: 'high' } }],
            }),
        ).toBeUndefined()
        expect(readFindSimilar({ referenceProfile: [], strains: [named] })).toBeUndefined()
        expect(
            readFindSimilar({
                referenceProfile: { Myrcene: 0.2 },
                strains: [{ id: 's1', name: 'Named' }],
            }),
        ).toBeUndefined()
    })

    it('accepts a named cultivar with no reported chemistry', () => {
        const batch = readBatchChemovar({ strains: [{ id: 's1', name: 'Only a name' }] })
        expect(batch?.strains).toEqual([{ id: 's1', name: 'Only a name' }])
        const single = readBuildChemovar({ strain: { id: 's1', name: 'Only a name', thc: 0 } })
        expect(single?.strain.thc).toBe(0)
        expect(readBuildChemovar({ strain: { id: 1, name: 'Named' } })).toBeUndefined()
    })

    it('rejects a non-finite limit and an unknown effect tag', () => {
        expect(
            readFindSimilar({
                referenceProfile: { Myrcene: 0.2 },
                strains: [named],
                limit: Number.NaN,
            }),
        ).toBeUndefined()
        expect(
            readScoreEffects({
                strains: [named],
                desiredEffects: ['Not An Effect'],
            }),
        ).toBeUndefined()
        const scored = readScoreEffects({
            strains: [named],
            desiredEffects: ['Relaxing'],
            limit: 5,
        })
        expect(scored?.desiredEffects).toEqual(['Relaxing'])
        expect(scored?.limit).toBe(5)
    })

    it('requires both parent profiles and both entourage profiles', () => {
        expect(readPredictBreeding({ parentA: { Myrcene: 0.2 } })).toBeUndefined()
        expect(
            readPredictBreeding({
                parentA: { Myrcene: 0.2 },
                parentB: { Limonene: 0.1 },
                nameHash: 4,
            })?.nameHash,
        ).toBe(4)
        expect(readAnalyzeEntourage({ terpeneProfile: { Myrcene: 0.2 } })).toBeUndefined()
        expect(
            readAnalyzeEntourage({
                terpeneProfile: { Myrcene: 0.2 },
                cannabinoidProfile: { THC: 12 },
            })?.cannabinoidProfile.THC,
        ).toBe(12)
    })
})
