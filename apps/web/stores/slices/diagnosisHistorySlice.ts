import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { DiagnosisHistoryState, DiagnosisRecord } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RECORDS_PER_PLANT = 100

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: DiagnosisHistoryState = {
    records: [],
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const diagnosisHistorySlice = createSlice({
    name: 'diagnosisHistory',
    initialState,
    reducers: {
        addDiagnosisRecord(state, action: PayloadAction<DiagnosisRecord>) {
            state.records.push(action.payload)
            // FIFO cap per plant
            const byPlant = new Map<string, number>()
            for (const r of state.records) {
                byPlant.set(r.plantId, (byPlant.get(r.plantId) ?? 0) + 1)
            }
            for (const [plantId, count] of byPlant) {
                if (count > MAX_RECORDS_PER_PLANT) {
                    const excess = count - MAX_RECORDS_PER_PLANT
                    let removed = 0
                    state.records = state.records.filter((r) => {
                        if (r.plantId === plantId && removed < excess) {
                            removed++
                            return false
                        }
                        return true
                    })
                }
            }
        },
        clearDiagnosisForPlant(state, action: PayloadAction<string>) {
            state.records = state.records.filter((r) => r.plantId !== action.payload)
        },
        clearAllDiagnosis(state) {
            state.records = []
        },
    },
})

export const { addDiagnosisRecord, clearDiagnosisForPlant, clearAllDiagnosis } =
    diagnosisHistorySlice.actions

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectDiagnosisRecords = (state: RootState): DiagnosisRecord[] =>
    state.diagnosisHistory.records

export const selectDiagnosisForPlant = (
    plantId: string,
): ((state: RootState) => DiagnosisRecord[]) =>
    createSelector(
        (state: RootState) => state.diagnosisHistory.records,
        (records) => records.filter((r) => r.plantId === plantId),
    )

export const selectLatestDiagnosis = (
    plantId: string,
): ((state: RootState) => DiagnosisRecord | undefined) =>
    createSelector(
        (state: RootState) => state.diagnosisHistory.records,
        (records) => {
            const plantRecords = records.filter((r) => r.plantId === plantId)
            return plantRecords.length > 0 ? plantRecords[plantRecords.length - 1] : undefined
        },
    )

export const selectDiagnosisTrend = (
    plantId: string,
): ((state: RootState) => Array<{ timestamp: number; severity: string; confidence: number }>) =>
    createSelector(
        (state: RootState) => state.diagnosisHistory.records,
        (records) =>
            records
                .filter((r) => r.plantId === plantId)
                .map((r) => ({
                    timestamp: r.timestamp,
                    severity: r.severity,
                    confidence: r.confidence,
                })),
    )

export default diagnosisHistorySlice.reducer
