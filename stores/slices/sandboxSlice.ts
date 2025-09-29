import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { Plant, SandboxState, Experiment, Scenario } from '@/types';

const initialState: SandboxState = {
    savedExperiments: [],
    isLoading: false,
    error: null,
};

export const runComparisonScenario = createAsyncThunk<
    Omit<Experiment, 'id' | 'createdAt'>,
    { plantId: string; scenario: Scenario },
    { state: RootState }
>('sandbox/runScenario', async ({ plantId, scenario }, { getState }) => {
    const basePlant = getState().simulation.plants[plantId];
    if (!basePlant) {
        throw new Error('Plant not found');
    }

    // Deep copy using structuredClone as requested
    const plantToSimulate = structuredClone(basePlant);

    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../../workers/scenario.worker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
            const { originalHistory, modifiedHistory, originalFinalState, modifiedFinalState } = e.data;
            resolve({
                name: `Experiment on ${basePlant.name}`,
                basePlantId: plantId,
                basePlantName: basePlant.name,
                scenarioDescription: `Compared ${scenario.plantAModifier.action} vs ${scenario.plantBModifier.action} over ${scenario.durationDays} days.`,
                durationDays: scenario.durationDays,
                originalHistory,
                modifiedHistory,
                originalFinalState,
                modifiedFinalState,
            });
            worker.terminate();
        };

        worker.onerror = (e) => {
            reject(e.message);
            worker.terminate();
        };
        
        worker.postMessage({ basePlant: plantToSimulate, scenario });
    });
});

const sandboxSlice = createSlice({
    name: 'sandbox',
    initialState,
    reducers: {
        // Reducers for managing saved experiments can be added here if needed
    },
    extraReducers: (builder) => {
        builder
            .addCase(runComparisonScenario.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(runComparisonScenario.fulfilled, (state, action: PayloadAction<Omit<Experiment, 'id' | 'createdAt'>>) => {
                state.isLoading = false;
                const newExperiment: Experiment = {
                    ...action.payload,
                    id: `exp-${Date.now()}`,
                    createdAt: Date.now(),
                };
                state.savedExperiments.push(newExperiment);
            })
            .addCase(runComparisonScenario.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error.message || 'Scenario failed to run.';
            });
    },
});

export default sandboxSlice.reducer;
