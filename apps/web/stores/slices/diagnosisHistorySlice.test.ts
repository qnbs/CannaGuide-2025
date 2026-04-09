import { describe, it, expect } from 'vitest'
import diagnosisHistoryReducer, {
    addDiagnosisRecord,
    clearDiagnosisForPlant,
    clearAllDiagnosis,
    selectDiagnosisForPlant,
    selectLatestDiagnosis,
    selectDiagnosisTrend,
} from './diagnosisHistorySlice'
import type { DiagnosisHistoryState, DiagnosisRecord } from '@/types'

const initialState: DiagnosisHistoryState = { records: [] }

let recCounter = 0
const makeRecord = (overrides: Partial<DiagnosisRecord> = {}): DiagnosisRecord => ({
    id: `dr-${++recCounter}`,
    plantId: 'plant-1',
    timestamp: Date.now(),
    label: 'healthy',
    confidence: 0.95,
    severity: 'none',
    harvestScore: 0,
    ...overrides,
})

describe('diagnosisHistorySlice', () => {
    it('adds a record', () => {
        const record = makeRecord()
        const state = diagnosisHistoryReducer(initialState, addDiagnosisRecord(record))
        expect(state.records).toHaveLength(1)
        expect(state.records[0]?.label).toBe('healthy')
    })

    it('applies FIFO pruning per plant at 100 cap', () => {
        let state = initialState
        for (let i = 0; i < 105; i++) {
            state = diagnosisHistoryReducer(
                state,
                addDiagnosisRecord(
                    makeRecord({
                        plantId: 'plant-1',
                        timestamp: i,
                        label: `label-${i}`,
                    }),
                ),
            )
        }
        const p1Records = state.records.filter((r) => r.plantId === 'plant-1')
        expect(p1Records).toHaveLength(100)
        expect(p1Records[0]?.timestamp).toBe(5)
    })

    it('does not prune records of other plants', () => {
        let state = diagnosisHistoryReducer(
            initialState,
            addDiagnosisRecord(makeRecord({ plantId: 'plant-2' })),
        )
        for (let i = 0; i < 105; i++) {
            state = diagnosisHistoryReducer(
                state,
                addDiagnosisRecord(makeRecord({ plantId: 'plant-1', timestamp: i })),
            )
        }
        expect(state.records.filter((r) => r.plantId === 'plant-2')).toHaveLength(1)
    })

    it('clears records for a specific plant', () => {
        let state = diagnosisHistoryReducer(
            initialState,
            addDiagnosisRecord(makeRecord({ plantId: 'plant-1' })),
        )
        state = diagnosisHistoryReducer(
            state,
            addDiagnosisRecord(makeRecord({ plantId: 'plant-2' })),
        )
        state = diagnosisHistoryReducer(state, clearDiagnosisForPlant('plant-1'))
        expect(state.records).toHaveLength(1)
        expect(state.records[0]?.plantId).toBe('plant-2')
    })

    it('clears all records', () => {
        let state = diagnosisHistoryReducer(
            initialState,
            addDiagnosisRecord(makeRecord({ plantId: 'plant-1' })),
        )
        state = diagnosisHistoryReducer(
            state,
            addDiagnosisRecord(makeRecord({ plantId: 'plant-2' })),
        )
        state = diagnosisHistoryReducer(state, clearAllDiagnosis())
        expect(state.records).toHaveLength(0)
    })

    describe('selectors', () => {
        const rootState = {
            diagnosisHistory: {
                records: [
                    {
                        id: 'dr-a',
                        plantId: 'p1',
                        timestamp: 100,
                        label: 'healthy',
                        confidence: 0.9,
                        severity: 'none',
                        harvestScore: 0,
                    },
                    {
                        id: 'dr-b',
                        plantId: 'p1',
                        timestamp: 200,
                        label: 'nitrogen-deficiency',
                        confidence: 0.8,
                        severity: 'moderate',
                        harvestScore: 30,
                    },
                    {
                        id: 'dr-c',
                        plantId: 'p1',
                        timestamp: 300,
                        label: 'healthy',
                        confidence: 0.95,
                        severity: 'none',
                        harvestScore: 0,
                    },
                    {
                        id: 'dr-d',
                        plantId: 'p2',
                        timestamp: 150,
                        label: 'pest',
                        confidence: 0.7,
                        severity: 'severe',
                        harvestScore: 50,
                    },
                ] as DiagnosisRecord[],
            },
        } as never

        it('selectDiagnosisForPlant returns sorted records', () => {
            const result = selectDiagnosisForPlant('p1')(rootState)
            expect(result).toHaveLength(3)
            expect(result[0]?.timestamp).toBe(100)
        })

        it('selectLatestDiagnosis returns the newest record', () => {
            const result = selectLatestDiagnosis('p1')(rootState)
            expect(result?.timestamp).toBe(300)
            expect(result?.label).toBe('healthy')
        })

        it('selectDiagnosisTrend returns trend data over time', () => {
            const result = selectDiagnosisTrend('p1')(rootState)
            expect(result).toHaveLength(3)
            expect(result[0]?.severity).toBe('none')
            expect(result[1]?.severity).toBe('moderate')
            expect(result[2]?.severity).toBe('none')
        })

        it('selectLatestDiagnosis returns undefined for unknown plant', () => {
            const result = selectLatestDiagnosis('unknown')(rootState)
            expect(result).toBeUndefined()
        })
    })
})
