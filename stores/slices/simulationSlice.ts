import { StoreSet, StoreGet } from '../useAppStore';

export interface SimulationSlice {
    isCatchingUp: boolean;
    isInitialized: boolean;
    lastActiveTimestamp: number | null;
    
    setIsCatchingUp: (isCatchingUp: boolean) => void;
    setIsInitialized: (isInitialized: boolean) => void;
    setLastActiveTimestamp: (timestamp: number | null) => void;
}

export const createSimulationSlice = (set: StoreSet, get: StoreGet): SimulationSlice => ({
    isCatchingUp: false,
    isInitialized: false,
    lastActiveTimestamp: null,

    setIsCatchingUp: (isCatchingUp: boolean) => set({ isCatchingUp }),
    setIsInitialized: (isInitialized: boolean) => set({ isInitialized }),
    setLastActiveTimestamp: (timestamp: number | null) => set({ lastActiveTimestamp: timestamp }),
});
