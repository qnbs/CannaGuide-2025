
import React, { useEffect } from 'react';
import { useAppDispatch } from '@/stores/store';
import { setAppReady } from '@/stores/slices/uiSlice';
import { initializeSimulation } from '@/stores/slices/simulationSlice';
import { runDataMigrations } from './migrationService';
import { strainService } from './strainService';
import { ttsService } from './ttsService';

export const SimulationManager: React.FC = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initializeApp = async () => {
            dispatch(setAppReady(false));
            await strainService.init();
            
            dispatch(initializeSimulation());
            
            dispatch(runDataMigrations());
            ttsService.init();
            dispatch(setAppReady(true));
        };
        initializeApp();
    }, [dispatch]);

    return null;
};
