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

    setIsCatchingUp: (isCatchingUp: boolean) => set(state => { state.isCatchingUp = isCatchingUp; }),
    setIsInitialized: (isInitialized: boolean) => set(state => { state.isInitialized = isInitialized; }),
    setLastActiveTimestamp: (timestamp: number | null) => set(state => { state.lastActiveTimestamp = timestamp; }),
});
