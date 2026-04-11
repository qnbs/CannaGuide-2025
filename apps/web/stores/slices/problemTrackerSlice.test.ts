import { describe, it, expect } from 'vitest'
import reducer, {
    addIssue,
    updateIssue,
    removeIssue,
    setIssueStatus,
    addTreatment,
    removeTreatment,
    clearIssuesForPlant,
    clearResolvedIssues,
    selectAllIssues,
    selectIssuesForPlant,
    selectActiveIssuesForPlant,
    selectIssueById,
    selectIssueCountByStatus,
} from '@/stores/slices/problemTrackerSlice'
import type { PlantIssue, IssueTreatment, ProblemTrackerState } from '@/types'
import type { RootState } from '@/stores/store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeIssue(overrides: Partial<PlantIssue> = {}): PlantIssue {
    return {
        id: 'iss-1',
        plantId: 'plant-1',
        category: 'pest',
        status: 'detected',
        severity: 'moderate',
        title: 'Spider mites',
        detectedAt: 1000,
        treatments: [],
        ...overrides,
    }
}

function makeTreatment(overrides: Partial<IssueTreatment> = {}): IssueTreatment {
    return {
        id: 'treat-1',
        timestamp: 2000,
        action: 'Applied neem oil',
        ...overrides,
    }
}

function stateWith(issues: PlantIssue[]): ProblemTrackerState {
    return { issues }
}

function rootWith(issues: PlantIssue[]): Pick<RootState, 'problemTracker'> {
    return { problemTracker: { issues } } as Pick<RootState, 'problemTracker'>
}

// ---------------------------------------------------------------------------
// Reducer tests
// ---------------------------------------------------------------------------

describe('problemTrackerSlice', () => {
    it('returns initial state', () => {
        const state = reducer(undefined, { type: 'unknown' })
        expect(state).toEqual({ issues: [] })
    })

    // -- addIssue -----------------------------------------------------------

    describe('addIssue', () => {
        it('adds an issue', () => {
            const issue = makeIssue()
            const state = reducer(undefined, addIssue(issue))
            expect(state.issues).toHaveLength(1)
            expect(state.issues[0]).toEqual(issue)
        })

        it('enforces FIFO cap at 200', () => {
            const existing = Array.from({ length: 200 }, (_, i) => makeIssue({ id: `iss-${i}` }))
            const overflow = makeIssue({ id: 'iss-overflow' })
            const state = reducer(stateWith(existing), addIssue(overflow))
            expect(state.issues).toHaveLength(200)
            expect(state.issues[0]?.id).toBe('iss-1')
            expect(state.issues[199]?.id).toBe('iss-overflow')
        })
    })

    // -- updateIssue --------------------------------------------------------

    describe('updateIssue', () => {
        it('updates existing issue fields', () => {
            const issue = makeIssue()
            const state = reducer(
                stateWith([issue]),
                updateIssue({ issueId: 'iss-1', changes: { severity: 'severe', title: 'Bad' } }),
            )
            expect(state.issues[0]?.severity).toBe('severe')
            expect(state.issues[0]?.title).toBe('Bad')
        })

        it('ignores update for non-existent issue', () => {
            const state = reducer(
                stateWith([makeIssue()]),
                updateIssue({ issueId: 'nope', changes: { title: 'X' } }),
            )
            expect(state.issues[0]?.title).toBe('Spider mites')
        })
    })

    // -- removeIssue --------------------------------------------------------

    describe('removeIssue', () => {
        it('removes an issue by id', () => {
            const state = reducer(stateWith([makeIssue()]), removeIssue('iss-1'))
            expect(state.issues).toHaveLength(0)
        })

        it('does nothing for unknown id', () => {
            const state = reducer(stateWith([makeIssue()]), removeIssue('nope'))
            expect(state.issues).toHaveLength(1)
        })
    })

    // -- setIssueStatus -----------------------------------------------------

    describe('setIssueStatus', () => {
        it('transitions status', () => {
            const state = reducer(
                stateWith([makeIssue()]),
                setIssueStatus({ issueId: 'iss-1', status: 'treating' }),
            )
            expect(state.issues[0]?.status).toBe('treating')
        })

        it('sets resolvedAt on resolved transition', () => {
            const state = reducer(
                stateWith([makeIssue()]),
                setIssueStatus({ issueId: 'iss-1', status: 'resolved' }),
            )
            expect(state.issues[0]?.status).toBe('resolved')
            expect(state.issues[0]?.resolvedAt).toBeGreaterThan(0)
        })

        it('does not overwrite existing resolvedAt', () => {
            const issue = makeIssue({ resolvedAt: 999 })
            const state = reducer(
                stateWith([issue]),
                setIssueStatus({ issueId: 'iss-1', status: 'resolved' }),
            )
            expect(state.issues[0]?.resolvedAt).toBe(999)
        })

        it('ignores unknown issue id', () => {
            const state = reducer(
                stateWith([makeIssue()]),
                setIssueStatus({ issueId: 'nope', status: 'resolved' }),
            )
            expect(state.issues[0]?.status).toBe('detected')
        })
    })

    // -- addTreatment -------------------------------------------------------

    describe('addTreatment', () => {
        it('appends treatment to issue', () => {
            const state = reducer(
                stateWith([makeIssue()]),
                addTreatment({ issueId: 'iss-1', treatment: makeTreatment() }),
            )
            expect(state.issues[0]?.treatments).toHaveLength(1)
            expect(state.issues[0]?.treatments[0]?.action).toBe('Applied neem oil')
        })

        it('auto-transitions detected to treating', () => {
            const state = reducer(
                stateWith([makeIssue({ status: 'detected' })]),
                addTreatment({ issueId: 'iss-1', treatment: makeTreatment() }),
            )
            expect(state.issues[0]?.status).toBe('treating')
        })

        it('does not auto-transition if already resolved', () => {
            const state = reducer(
                stateWith([makeIssue({ status: 'resolved' })]),
                addTreatment({ issueId: 'iss-1', treatment: makeTreatment() }),
            )
            expect(state.issues[0]?.status).toBe('resolved')
        })

        it('enforces FIFO cap at 50 treatments', () => {
            const existing = Array.from({ length: 50 }, (_, i) => makeTreatment({ id: `t-${i}` }))
            const issue = makeIssue({ treatments: existing, status: 'treating' })
            const state = reducer(
                stateWith([issue]),
                addTreatment({ issueId: 'iss-1', treatment: makeTreatment({ id: 't-overflow' }) }),
            )
            expect(state.issues[0]?.treatments).toHaveLength(50)
            expect(state.issues[0]?.treatments[49]?.id).toBe('t-overflow')
        })

        it('ignores unknown issue id', () => {
            const state = reducer(
                stateWith([makeIssue()]),
                addTreatment({ issueId: 'nope', treatment: makeTreatment() }),
            )
            expect(state.issues[0]?.treatments).toHaveLength(0)
        })
    })

    // -- removeTreatment ----------------------------------------------------

    describe('removeTreatment', () => {
        it('removes treatment by id', () => {
            const issue = makeIssue({ treatments: [makeTreatment()] })
            const state = reducer(
                stateWith([issue]),
                removeTreatment({ issueId: 'iss-1', treatmentId: 'treat-1' }),
            )
            expect(state.issues[0]?.treatments).toHaveLength(0)
        })

        it('does nothing for unknown treatment id', () => {
            const issue = makeIssue({ treatments: [makeTreatment()] })
            const state = reducer(
                stateWith([issue]),
                removeTreatment({ issueId: 'iss-1', treatmentId: 'nope' }),
            )
            expect(state.issues[0]?.treatments).toHaveLength(1)
        })
    })

    // -- clearIssuesForPlant ------------------------------------------------

    describe('clearIssuesForPlant', () => {
        it('removes all issues for a given plant', () => {
            const issues = [
                makeIssue({ id: 'a', plantId: 'plant-1' }),
                makeIssue({ id: 'b', plantId: 'plant-2' }),
                makeIssue({ id: 'c', plantId: 'plant-1' }),
            ]
            const state = reducer(stateWith(issues), clearIssuesForPlant('plant-1'))
            expect(state.issues).toHaveLength(1)
            expect(state.issues[0]?.plantId).toBe('plant-2')
        })
    })

    // -- clearResolvedIssues ------------------------------------------------

    describe('clearResolvedIssues', () => {
        it('removes only resolved issues', () => {
            const issues = [
                makeIssue({ id: 'a', status: 'detected' }),
                makeIssue({ id: 'b', status: 'resolved' }),
                makeIssue({ id: 'c', status: 'treating' }),
            ]
            const state = reducer(stateWith(issues), clearResolvedIssues())
            expect(state.issues).toHaveLength(2)
            expect(state.issues.map((i) => i.id)).toEqual(['a', 'c'])
        })
    })
})

// ---------------------------------------------------------------------------
// Selector tests
// ---------------------------------------------------------------------------

describe('problemTracker selectors', () => {
    const issues: PlantIssue[] = [
        makeIssue({ id: 'a', plantId: 'p1', status: 'detected' }),
        makeIssue({ id: 'b', plantId: 'p1', status: 'resolved' }),
        makeIssue({ id: 'c', plantId: 'p2', status: 'treating' }),
    ]

    it('selectAllIssues returns all issues', () => {
        const result = selectAllIssues(rootWith(issues) as RootState)
        expect(result).toHaveLength(3)
    })

    it('selectIssuesForPlant filters by plantId', () => {
        const selector = selectIssuesForPlant('p1')
        const result = selector(rootWith(issues) as RootState)
        expect(result).toHaveLength(2)
        expect(result.every((i) => i.plantId === 'p1')).toBe(true)
    })

    it('selectActiveIssuesForPlant excludes resolved', () => {
        const selector = selectActiveIssuesForPlant('p1')
        const result = selector(rootWith(issues) as RootState)
        expect(result).toHaveLength(1)
        expect(result[0]?.id).toBe('a')
    })

    it('selectIssueById finds by id', () => {
        const selector = selectIssueById('b')
        const result = selector(rootWith(issues) as RootState)
        expect(result?.id).toBe('b')
    })

    it('selectIssueById returns undefined for unknown id', () => {
        const selector = selectIssueById('nope')
        const result = selector(rootWith(issues) as RootState)
        expect(result).toBeUndefined()
    })

    it('selectIssueCountByStatus returns correct counts', () => {
        const result = selectIssueCountByStatus(rootWith(issues) as RootState)
        expect(result).toEqual({
            detected: 1,
            treating: 1,
            resolved: 1,
            total: 3,
        })
    })
})
