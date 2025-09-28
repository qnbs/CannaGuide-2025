import { useMemo } from 'react';
import { useAppSelector } from '@/stores/store';
import {
    selectActivePlants,
    selectGardenHealthMetrics,
    selectOpenTasksSummary,
    selectActiveProblemsSummary,
    selectSelectedPlantId,
    selectPlantById,
    selectHasAvailableSlots,
    selectPlantSlots
} from '@/stores/selectors';

/**
 * Custom hook to get the list of currently active plants from the simulation state.
 * @returns An array of active Plant objects.
 */
export const useActivePlants = () => useAppSelector(selectActivePlants);

/**
 * Custom hook for garden health metrics only.
 * @returns An object with garden health metrics.
 */
export const useGardenHealthMetrics = () => useAppSelector(selectGardenHealthMetrics);

/**
 * Custom hook that provides a comprehensive summary of the garden's status.
 * @returns An object containing health metrics, open tasks, and active problems.
 */
export const useGardenSummary = () => {
    const healthMetrics = useAppSelector(selectGardenHealthMetrics);
    const tasks = useAppSelector(selectOpenTasksSummary);
    const problems = useAppSelector(selectActiveProblemsSummary);
    return { ...healthMetrics, tasks, problems };
};

/**
 * Custom hook to retrieve the state of plant slots and their content.
 * @returns An object with an array of plant data for each slot (or null if empty) and a boolean indicating if slots are available.
 */
export const usePlantSlotsData = () => {
    const slots = useAppSelector(selectPlantSlots);
    const plants = useAppSelector(state => state.simulation.plants);
    const hasAvailable = useAppSelector(selectHasAvailableSlots);
    
    const slotsWithData = useMemo(() => slots.map(id => id ? plants[id] : null), [slots, plants]);
    
    return { slotsWithData, hasAvailable };
};

/**
 * Custom hook to get the currently selected plant object based on the global selectedPlantId.
 * @returns The selected Plant object or null if none is selected.
 */
export const useSelectedPlant = () => {
    const selectedId = useAppSelector(selectSelectedPlantId);
    return useAppSelector(selectPlantById(selectedId));
};

/**
 * Custom hook to retrieve a specific plant by its ID.
 * @param plantId The ID of the plant to retrieve.
 * @returns The Plant object or null if not found.
 */
export const usePlantById = (plantId: string | null) => {
    return useAppSelector(selectPlantById(plantId));
};

/**
 * Custom hook to check if the simulation is currently in a "catch-up" state.
 * @returns A boolean indicating the catch-up status.
 */
export const useIsSimulationCatchingUp = () => useAppSelector(state => state.simulation.isCatchingUp);
