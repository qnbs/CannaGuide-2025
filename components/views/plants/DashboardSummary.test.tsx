import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardSummary } from './DashboardSummary';
import * as reduxHooks from '@/stores/store';
import { waterAllPlants } from '@/stores/slices/simulationSlice';
import { RootState } from '@/stores/store';
import { Plant } from '@/types';
import { selectGardenHealthMetrics } from '@/stores/selectors';


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
vi.mock('react-i18next', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react-i18next')>();
    return {
        ...actual,
        useTranslation: () => ({ t: (key: string) => key }),
    };
});

vi.mock('@/stores/api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/stores/api')>();
    return {
        ...actual,
        useGetGardenStatusSummaryMutation: () => [
            vi.fn(),
            { data: null, isLoading: false, error: null, reset: vi.fn() },
        ],
    };
});

vi.mock('@/services/strainService', () => ({
    strainService: {
        getAllStrains: vi.fn().mockResolvedValue([
            { id: 'acdc', name: 'ACDC', type: 'Hybrid', thc: 1, cbd: 20, floweringTime: 9, agronomic: {}, geneticModifiers: {} },
        ]),
    },
}));

const mockDispatch = vi.fn();
const mockUseAppSelector = vi.spyOn(reduxHooks, 'useAppSelector');

const createMockState = (overrides?: Partial<RootState>): RootState => {
    const baseState = {
        simulation: {
            plantSlots: ['p1', null, null],
            plants: {
                ids: ['p1'],
                entities: {
                    p1: {
                        id: 'p1',
                        name: 'Plant 1',
                        health: 90,
                        environment: { internalTemperature: 25, internalHumidity: 60, vpd: 1.1 },
                    },
                },
            },
        },
        settings: {
            settings: {
                general: {
                    language: 'en',
                },
            },
        },
    } as unknown as RootState;

    return {
        ...baseState,
        ...overrides,
    };
};

describe('DashboardSummary', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(reduxHooks, 'useAppDispatch').mockReturnValue(mockDispatch);
    });
    
    it('renders stats correctly with active plants', () => {
                const state = createMockState();
                mockUseAppSelector.mockImplementation((selector: any) => selector(state));

        render(<DashboardSummary />);

        expect(screen.getByText('90%')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('25.0°')).toBeInTheDocument();
        expect(screen.getByText('60.0%')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'plantsView.summary.waterAll' })).not.toBeDisabled();
    });

    it('renders correctly with no active plants and disables button', () => {
                const state = createMockState({
                    simulation: {
                        plantSlots: [null, null, null],
                        plants: { ids: [], entities: {} },
                    } as any,
                });
                mockUseAppSelector.mockImplementation((selector: any) => selector(state));

        render(<DashboardSummary />);

        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'plantsView.summary.waterAll' })).toBeDisabled();
    });

    it('dispatches waterAllPlants action when button is clicked', () => {
        const state = createMockState();
        mockUseAppSelector.mockImplementation((selector: any) => selector(state));

        render(<DashboardSummary />);
        
        fireEvent.click(screen.getByRole('button', { name: 'plantsView.summary.waterAll' }));

        expect(mockDispatch).toHaveBeenCalledTimes(1);
        expect(typeof mockDispatch.mock.calls[0][0]).toBe('function');
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
