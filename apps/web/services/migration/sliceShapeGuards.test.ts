import { describe, expect, it } from 'vitest'
import {
    ensureArchivesShape,
    ensureFavoritesShape,
    ensureGrowsShape,
    ensureNotesShape,
    ensureProblemTrackerShape,
    ensureSavedItemsShape,
    ensureUserStrainsShape,
    normalizeSavedStrainTipImages,
} from '@/services/migration/sliceShapeGuards'
import type { PersistedState } from '@/services/migration/migrationTypes'

describe('sliceShapeGuards', () => {
    it('ensureUserStrainsShape repairs corrupt adapter', () => {
        const state = { userStrains: { ids: 'bad' } } as unknown as PersistedState
        ensureUserStrainsShape(state)
        const strains = (state as Record<string, unknown>).userStrains as {
            ids: string[]
            entities: Record<string, unknown>
        }
        expect(strains.ids).toEqual([])
        expect(strains.entities).toEqual({})
    })

    it('ensureSavedItemsShape creates default saved item adapters', () => {
        const state = {} as PersistedState
        ensureSavedItemsShape(state)
        const items = (state as Record<string, unknown>).savedItems as Record<string, unknown>
        expect(items.savedSetups).toEqual({ ids: [], entities: {} })
        expect(items.savedStrainTips).toEqual({ ids: [], entities: {} })
    })

    it('normalizeSavedStrainTipImages drops empty imageUrl values', () => {
        const state = {
            savedItems: {
                savedStrainTips: {
                    ids: ['tip-1'],
                    entities: {
                        'tip-1': { imageUrl: '   ' },
                    },
                },
            },
        } as unknown as PersistedState
        normalizeSavedStrainTipImages(state)
        const tip = (
            (state as Record<string, unknown>).savedItems as Record<string, unknown>
        ).savedStrainTips as { entities: Record<string, Record<string, unknown>> }
        expect(tip.entities['tip-1']?.imageUrl).toBeUndefined()
    })

    it('ensureFavoritesShape ensures favoriteIds array', () => {
        const state = { favorites: {} } as PersistedState
        ensureFavoritesShape(state)
        expect((state as Record<string, unknown>).favorites).toEqual({ favoriteIds: [] })
    })

    it('ensureArchivesShape ensures archive collections', () => {
        const state = {} as PersistedState
        ensureArchivesShape(state)
        const archives = (state as Record<string, unknown>).archives as Record<string, unknown>
        expect(Array.isArray(archives.archivedMentorResponses)).toBe(true)
        expect(typeof archives.archivedAdvisorResponses).toBe('object')
    })

    it('ensureNotesShape creates strainNotes map when missing', () => {
        const state = {} as PersistedState
        ensureNotesShape(state)
        const notes = (state as Record<string, unknown>).notes as { strainNotes: Record<string, unknown> }
        expect(notes.strainNotes).toEqual({})
    })

    it('ensureGrowsShape seeds default grow when empty', () => {
        const state = {} as PersistedState
        ensureGrowsShape(state)
        const grows = (state as Record<string, unknown>).grows as {
            grows: { ids: string[]; entities: Record<string, unknown> }
            activeGrowId: string
        }
        expect(grows.grows.ids.length).toBeGreaterThan(0)
        expect(Object.keys(grows.grows.entities).length).toBeGreaterThan(0)
        expect(typeof grows.activeGrowId).toBe('string')
    })

    it('ensureProblemTrackerShape repairs issues adapter', () => {
        const state = { problemTracker: null } as unknown as PersistedState
        ensureProblemTrackerShape(state)
        const tracker = (state as Record<string, unknown>).problemTracker as {
            issues: { ids: string[]; entities: Record<string, unknown> }
        }
        expect(tracker.issues.ids).toEqual([])
        expect(tracker.issues.entities).toEqual({})
    })
})
