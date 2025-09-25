import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { simulationService } from '@/services/plantSimulationService';
import { Plant, PlantStage } from '@/types';

export const SimulationManager: React.FC = () => {
    const activePlantIds = useAppStore(state => 
        Object.values(state.plants)
              .filter((p): p is Plant => !!p && (p as Plant).stage !== PlantStage.Finished)
              .map(p => p.id)
    );

    // Using join(',') creates a stable key for the dependency array,
    // ensuring the effect only runs when the list of active plants changes.
    const activePlantIdsKey = activePlantIds.join(',');
    
    // A ref to store the previous key, allowing comparison to find added/removed plants.
    const prevActivePlantIdsKeyRef = useRef<string>('');

    useEffect(() => {
        // FIX: Explicitly type the Set to <string> to ensure correct type inference for `id`.
        const prevIds = new Set<string>(prevActivePlantIdsKeyRef.current ? prevActivePlantIdsKeyRef.current.split(',').filter(id => id) : []);
        const currentIds = new Set<string>(activePlantIds);

        // Start simulations for any newly added plants
        for (const id of currentIds) {
            if (!prevIds.has(id)) {
                console.log(`[Simulation Lifecycle] Starting simulation for plant: ${id}`);
                simulationService.startSimulation(id);
            }
        }

        // Stop simulations for any removed or finished plants
        for (const id of prevIds) {
            if (!currentIds.has(id)) {
                console.log(`[Simulation Lifecycle] Stopping simulation for plant: ${id}`);
                simulationService.stopSimulation(id);
            }
        }

        // Update the ref with the current key for the next render's comparison
        prevActivePlantIdsKeyRef.current = activePlantIdsKey;

        // The main cleanup function for when the component unmounts.
        // Although this component is unlikely to unmount in this app,
        // this is a robust pattern for managing side effects.
        return () => {
            console.log(`[Simulation Lifecycle] Unmounting SimulationManager. Stopping all simulations.`);
            simulationService.stopAllSimulations();
        };
    }, [activePlantIdsKey, activePlantIds]); // Depend on both the key and the array for stability and access to the latest data

    return null; // This component does not render any UI
};