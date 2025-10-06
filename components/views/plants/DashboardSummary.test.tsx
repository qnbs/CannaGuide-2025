import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GardenVitals } from './DashboardSummary';
import * as reduxHooks from '@/stores/store';
import { waterAllPlants } from '@/stores/slices/simulationSlice';
import { RootState } from '@/stores/store';
import { Plant, PlantStage } from '@/types';
import { selectGardenHealthMetrics } from '@/stores/selectors';
import { Provider } from 'react-redux';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';
import simulationReducer from '@/stores/slices/simulationSlice';
import uiReducer from '@/stores/slices/uiSlice';
import { PlantsView } from '../PlantsView';
import { i18nInstance } from '@/i18n';
import { I18nextProvider } from 'react-i18next';


// Mock the hooks from the store
vi.mock('@/stores/store', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
  };
});

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/services/strainService', () => ({
    strainService: {
        getAllStrains: vi.fn().mockResolvedValue([
            { id: 'acdc', name: 'ACDC', type: 'Hybrid', thc: 1, cbd: 20, floweringTime: 9, agronomic: {}, geneticModifiers: {} },
        ]),
    },
}));

const mockDispatch = vi.fn();
const mockUseAppSelector = vi.spyOn(reduxHooks, 'useAppSelector');

describe('GardenVitals (DashboardSummary)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(mockDispatch);
    });
    
    it('renders stats correctly with active plants', () => {
        mockUseAppSelector.mockImplementation(selector => {
            if (selector.name === 'selectGardenHealthMetrics') {
                return { gardenHealth: 90, activePlantsCount: 1, avgTemp: 25, avgHumidity: 60 };
            }
            return undefined;
        });

        render(<GardenVitals openTasksCount={3} />);

        expect(screen.getByText('90%')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('25.0°')).toBeInTheDocument();
        expect(screen.getByText('60.0%')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'plantsView.summary.waterAll' })).not.toBeDisabled();
    });

    it('renders correctly with no active plants and disables button', () => {
        mockUseAppSelector.mockImplementation(selector => {
            if (selector.name === 'selectGardenHealthMetrics') {
                return { gardenHealth: 100, activePlantsCount: 0, avgTemp: 22, avgHumidity: 55 };
            }
            return undefined;
        });

        render(<GardenVitals openTasksCount={0} />);

        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'plantsView.summary.waterAll' })).toBeDisabled();
    });

    it('dispatches waterAllPlants action when button is clicked', () => {
         mockUseAppSelector.mockImplementation(selector => {
            if (selector.name === 'selectGardenHealthMetrics') {
                return { gardenHealth: 90, activePlantsCount: 1, avgTemp: 25, avgHumidity: 60 };
            }
            return undefined;
        });

        render(<GardenVitals openTasksCount={0} />);
        
        fireEvent.click(screen.getByRole('button', { name: 'plantsView.summary.waterAll' }));

        expect(mockDispatch).toHaveBeenCalledWith(waterAllPlants());
    });
});


// New test suite for Redux selectors
describe('Redux Selectors', () => {
    it('selectGardenHealthMetrics calculates correctly with multiple plants', () => {
        const mockPlant1: Plant = { health: 80, environment: { internalTemperature: 25, internalHumidity: 50 } } as Plant;
        const mockPlant2: Plant = { health: 100, environment: { internalTemperature: 23, internalHumidity: 60 } } as Plant;
        
        const mockState: Partial<RootState> = {
            simulation: {
                plantSlots: ['p1', 'p2', null],
                plants: {
                    ids: ['p1', 'p2'],
                    entities: { 'p1': mockPlant1, 'p2': mockPlant2 }
                }
            } as any
        };

        const result = selectGardenHealthMetrics(mockState as RootState);
        expect(result.gardenHealth).toBe(90);
        expect(result.activePlantsCount).toBe(2);
        expect(result.avgTemp).toBe(24);
        expect(result.avgHumidity).toBe(55);
    });

    it('selectGardenHealthMetrics returns defaults for no plants', () => {
         const mockState: Partial<RootState> = {
            simulation: {
                plantSlots: [null, null, null],
                plants: { ids: [], entities: {} }
            } as any
        };
        const result = selectGardenHealthMetrics(mockState as RootState);
        expect(result.gardenHealth).toBe(100);
        expect(result.activePlantsCount).toBe(0);
    });
});

// New integration test suite
describe('Start New Grow Integration Test', () => {
    let store: EnhancedStore;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                simulation: simulationReducer,
                ui: uiReducer,
            },
            // Define an initial state if needed
            preloadedState: {
                ui: {
                    activeView: 'plants',
                    newGrowFlow: { status: 'idle' }
                } as any,
                simulation: {
                    plantSlots: [null, null, null],
                    plants: { ids: [], entities: {} }
                } as any,
            }
        });
        vi.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(store.dispatch);
    });

    it('allows a user to start a new grow from an empty slot', async () => {
        mockUseAppSelector.mockImplementation(callback => callback(store.getState()));

        render(
            <Provider store={store}>
                <I18nextProvider i18n={i18nInstance}>
                    <PlantsView />
                </I18nextProvider>
            </Provider>
        );

        // 1. Click on an empty slot
        const emptySlots = screen.getAllByText('plantsView.emptySlot.title');
        fireEvent.click(emptySlots[0]);

        // 2. Inline strain selector should appear
        await waitFor(() => {
            expect(screen.getByPlaceholderText('strainsView.searchPlaceholder')).toBeInTheDocument();
        });

        // 3. Select a strain
        const strainButton = await screen.findByText('ACDC');
        fireEvent.click(strainButton);

        // 4. Grow setup modal should appear
        await waitFor(() => {
            expect(screen.getByText('plantsView.setupModal.title', { strainName: 'ACDC' })).toBeInTheDocument();
        });

        // 5. Confirm setup
        const confirmSetupButton = screen.getByText('plantsView.setupModal.confirm');
        fireEvent.click(confirmSetupButton);

        // 6. Final confirmation modal should appear
        await waitFor(() => {
            expect(screen.getByText('plantsView.confirmationModal.title')).toBeInTheDocument();
        });
        
        // 7. Click final confirmation
        const finalConfirmButton = screen.getByText('plantsView.confirmationModal.confirmButton');
        fireEvent.click(finalConfirmButton);
        
        // 8. Assert that the plant has been created in the store
        await waitFor(() => {
            const finalState = store.getState();
            expect(finalState.simulation.plantSlots[0]).not.toBeNull();
            expect(Object.keys(finalState.simulation.plants.entities).length).toBe(1);
        });
    });
});
