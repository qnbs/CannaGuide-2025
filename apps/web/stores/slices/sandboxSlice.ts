import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { ExperimentResult, SavedExperiment, Scenario, SandboxState } from '@/types'
import { RootState } from '../store'
import { workerBus } from '@/services/workerBus'

const SCENARIO_WORKER = 'scenario'

const initialState: SandboxState = {
    currentExperiment: null,
    status: 'idle',
    savedExperiments: [],
}

export const runComparisonScenario = createAsyncThunk<
    ExperimentResult & { basePlantId: string; scenarioId: string },
    { plantId: string; scenario: Scenario },
    { state: RootState }
>('sandbox/runComparison', async ({ plantId, scenario }, { getState }) => {
    const state = getState()
    const basePlant = state.simulation.plants.entities[plantId]
    const simulationSettings = state.settings.settings.simulation

    if (!basePlant) {
        throw new Error('Base plant not found for scenario.')
    }

    // W-06: WorkerPool auto-spawns the scenario worker on first dispatch

    const result = await workerBus.dispatch<ExperimentResult>(
        SCENARIO_WORKER,
        'RUN_SCENARIO',
        { basePlant, scenario, simulationSettings },
        { timeoutMs: 120_000, priority: 'normal' },
    )
    return { ...result, basePlantId: plantId, scenarioId: scenario.id }
})

const sandboxSlice = createSlice({
    name: 'sandbox',
    initialState,
    reducers: {
        saveExperiment: (
            state,
            action: PayloadAction<{ scenario: Scenario; basePlantName: string }>,
        ) => {
            if (state.currentExperiment) {
                const newSavedExperiment: SavedExperiment = {
                    ...state.currentExperiment,
                    id: `exp-${Date.now()}`,
                    scenarioId: action.payload.scenario.id,
                    basePlantName: action.payload.basePlantName,
                    createdAt: Date.now(),
                }
                state.savedExperiments.unshift(newSavedExperiment) // Add to the top
                state.currentExperiment = null
                state.status = 'idle'
            }
        },
        clearCurrentExperiment: (state) => {
            state.currentExperiment = null
            state.status = 'idle'
        },
        deleteExperiment: (state, action: PayloadAction<string>) => {
            state.savedExperiments = state.savedExperiments.filter(
                (exp) => exp.id !== action.payload,
            )
        },
        loadSavedExperiment: (state, action: PayloadAction<string>) => {
            const found = state.savedExperiments.find((exp) => exp.id === action.payload)
            if (found) {
                state.currentExperiment = {
                    originalHistory: found.originalHistory,
                    modifiedHistory: found.modifiedHistory,
                    originalFinalState: found.originalFinalState,
                    modifiedFinalState: found.modifiedFinalState,
                    scenarioId: found.scenarioId,
                }
                state.status = 'succeeded'
            }
        },
        setSandboxState: (_state, action: PayloadAction<SandboxState>) => {
            return action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(runComparisonScenario.pending, (state) => {
                state.status = 'running'
                state.currentExperiment = null
            })
            .addCase(
                runComparisonScenario.fulfilled,
                (
                    state,
                    action: PayloadAction<
                        ExperimentResult & { basePlantId: string; scenarioId: string }
                    >,
                ) => {
                    state.status = 'succeeded'
                    state.currentExperiment = action.payload
                },
            )
            .addCase(runComparisonScenario.rejected, (state) => {
                state.status = 'failed'
            })
    },
})

export const {
    saveExperiment,
    clearCurrentExperiment,
    deleteExperiment,
    loadSavedExperiment,
    setSandboxState,
} = sandboxSlice.actions
export default sandboxSlice.reducer
