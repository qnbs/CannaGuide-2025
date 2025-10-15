import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
// FIX: Add missing imports for ExperimentResult and SavedExperiment
import { ExperimentResult, SavedExperiment, Scenario, Plant, SandboxState } from '@/types';
import { RootState } from '../store';

const initialState: SandboxState = {
    currentExperiment: null,
    status: 'idle',
    savedExperiments: [],
};

export const runComparisonScenario = createAsyncThunk<ExperimentResult & { basePlantId: string, scenarioId: string }, { plantId: string, scenario: Scenario }, { state: RootState }>(
    'sandbox/runComparison',
    async ({ plantId, scenario }, { getState }) => {
        return new Promise((resolve, reject) => {
            const state = getState();
            const basePlant = state.simulation.plants.entities[plantId];

            if (!basePlant) {
                return reject(new Error('Base plant not found for scenario.'));
            }

            const worker = new Worker(new URL('/workers/scenario.worker.ts', import.meta.url), { type: 'module' });
            
            worker.onmessage = (e: MessageEvent<ExperimentResult>) => {
                resolve({ ...e.data, basePlantId: plantId, scenarioId: scenario.id });
                worker.terminate();
            };

            worker.onerror = (e) => {
                reject(e);
                worker.terminate();
            };

            worker.postMessage({ basePlant, scenario });
        });
    }
);


const sandboxSlice = createSlice({
    name: 'sandbox',
    initialState,
    reducers: {
        saveExperiment: (state, action: PayloadAction<{ scenario: Scenario, basePlantName: string }>) => {
            if (state.currentExperiment) {
                const newSavedExperiment: SavedExperiment = {
                    ...state.currentExperiment,
                    id: `exp-${Date.now()}`,
                    scenarioId: action.payload.scenario.id,
                    basePlantName: action.payload.basePlantName,
                    createdAt: Date.now(),
                };
                state.savedExperiments.unshift(newSavedExperiment); // Add to the top
                state.currentExperiment = null;
                state.status = 'idle';
            }
        },
        clearCurrentExperiment: (state) => {
            state.currentExperiment = null;
            state.status = 'idle';
        },
        deleteExperiment: (state, action: PayloadAction<string>) => {
            state.savedExperiments = state.savedExperiments.filter(exp => exp.id !== action.payload);
        },
        setSandboxState: (state, action: PayloadAction<SandboxState>) => {
            return action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(runComparisonScenario.pending, (state) => {
                state.status = 'running';
                state.currentExperiment = null;
            })
            .addCase(runComparisonScenario.fulfilled, (state, action: PayloadAction<ExperimentResult & { basePlantId: string; scenarioId: string; }>) => {
                state.status = 'succeeded';
                state.currentExperiment = action.payload;
            })
            .addCase(runComparisonScenario.rejected, (state) => {
                state.status = 'failed';
            });
    }
});

export const { saveExperiment, clearCurrentExperiment, deleteExperiment, setSandboxState } = sandboxSlice.actions;
export default sandboxSlice.reducer;