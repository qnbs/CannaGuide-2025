import {
    createSlice,
    createSelector,
    PayloadAction,
    createEntityAdapter,
} from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type { DiagnosisHistoryState, DiagnosisRecord } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RECORDS_PER_PLANT = 100

export const diagnosisRecordsAdapter = createEntityAdapter<DiagnosisRecord>()

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialState: DiagnosisHistoryState = {
    records: diagnosisRecordsAdapter.getInitialState(),
}

function trimRecordsPerPlant(state: DiagnosisHistoryState): void {
    const all = diagnosisRecordsAdapter
        .getSelectors()
        .selectAll(state.records)
    const byPlant = new Map<string, DiagnosisRecord[]>()
    for (const record of all) {
        const list = byPlant.get(record.plantId) ?? []
        list.push(record)
        byPlant.set(record.plantId, list)
    }

    const idsToRemove: string[] = []
    for (const records of byPlant.values()) {
        if (records.length <= MAX_RECORDS_PER_PLANT) {
            continue
        }
        const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp)
        const excess = sorted.slice(0, records.length - MAX_RECORDS_PER_PLANT)
        idsToRemove.push(...excess.map((r) => r.id))
    }

    if (idsToRemove.length > 0) {
        diagnosisRecordsAdapter.removeMany(state.records, idsToRemove)
    }
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const diagnosisHistorySlice = createSlice({
    name: 'diagnosisHistory',
    initialState,
    reducers: {
        addDiagnosisRecord(state, action: PayloadAction<DiagnosisRecord>) {
            diagnosisRecordsAdapter.addOne(state.records, action.payload)
            trimRecordsPerPlant(state)
        },
        clearDiagnosisForPlant(state, action: PayloadAction<string>) {
            const plantId = action.payload
            const idsToRemove = state.records.ids.filter(
                (id) => state.records.entities[id]?.plantId === plantId,
            )
            diagnosisRecordsAdapter.removeMany(state.records, idsToRemove)
        },
        clearAllDiagnosis(state) {
            diagnosisRecordsAdapter.removeAll(state.records)
        },
    },
})

export const { addDiagnosisRecord, clearDiagnosisForPlant, clearAllDiagnosis } =
    diagnosisHistorySlice.actions

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

const selectRecordsEntityState = (state: RootState) => state.diagnosisHistory.records

const recordSelectors = diagnosisRecordsAdapter.getSelectors(selectRecordsEntityState)

export const selectDiagnosisRecords = (state: RootState): DiagnosisRecord[] =>
    recordSelectors.selectAll(state)

export const selectDiagnosisForPlant = (
    plantId: string,
): ((state: RootState) => DiagnosisRecord[]) =>
    createSelector((state: RootState) => selectDiagnosisRecords(state), (records) =>
        records.filter((r) => r.plantId === plantId),
    )

export const selectLatestDiagnosis = (
    plantId: string,
): ((state: RootState) => DiagnosisRecord | undefined) =>
    createSelector((state: RootState) => selectDiagnosisRecords(state), (records) => {
        const plantRecords = records.filter((r) => r.plantId === plantId)
        return plantRecords.length > 0 ? plantRecords[plantRecords.length - 1] : undefined
    })

export const selectDiagnosisTrend = (
    plantId: string,
): ((state: RootState) => Array<{ timestamp: number; severity: string; confidence: number }>) =>
    createSelector((state: RootState) => selectDiagnosisRecords(state), (records) =>
        records
            .filter((r) => r.plantId === plantId)
            .map((r) => ({
                timestamp: r.timestamp,
                severity: r.severity,
                confidence: r.confidence,
            })),
    )

export default diagnosisHistorySlice.reducer
