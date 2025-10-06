
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { Plant, SandboxState, Experiment, Scenario } from '@/types';
import { getT } from '@/i18n';

const initialState: SandboxState = {
    savedExperiments: [],
    isLoading: false,
    error: null,
};

export const runComparisonScenario = createAsyncThunk<
    Omit<Experiment, 'id' | 'createdAt'>,
    { plantId: string; scenario: Scenario },
    { state: RootState }
>('sandbox/runScenario', async ({ plantId, scenario }, { getState, rejectWithValue }) => {
    const t = getT();
    const basePlant = getState().simulation.plants.entities[plantId];
    if (!basePlant) {
        return rejectWithValue('Plant not found');
    }

    const plantToSimulate = structuredClone(basePlant);

    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../../workers/scenario.worker.ts', import.meta.url), { type: 'module' });

        worker.onmessage = (e) => {
            const { originalHistory, modifiedHistory, originalFinalState, modifiedFinalState } = e.data;
            resolve({
                name: t('knowledgeView.sandbox.experimentOn', { name: basePlant.name }),
                basePlantId: plantId,
                basePlantName: basePlant.name,
                scenarioDescription: t('knowledgeView.sandbox.scenarioDescription', { actionA: scenario.plantAModifier.action, actionB: scenario.plantBModifier.action, duration: scenario.durationDays }),
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
        setSandboxState: (state, action: PayloadAction<SandboxState>) => {
            // Only hydrate persistent data
            state.savedExperiments = action.payload.savedExperiments || [];
        }
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

export const { setSandboxState } = sandboxSlice.actions;

export default sandboxSlice.reducer;
