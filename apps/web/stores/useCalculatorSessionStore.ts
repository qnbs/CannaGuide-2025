/**
 * useCalculatorSessionStore
 *
 * Transient (non-persisted) Zustand store for shared calculator session state.
 * Propagates room dimensions and light wattage across the Equipment Calculator Suite
 * so that the What-If Sandbox sliders instantly update all connected calculators.
 */

import { create } from 'zustand'

export interface RoomDimensions {
    /** Width in centimetres */
    width: number
    /** Depth in centimetres */
    depth: number
    /** Height in centimetres */
    height: number
}

interface CalculatorSessionState {
    roomDimensions: RoomDimensions
    sharedLightWattage: number
    setRoomDimensions: (dimensions: RoomDimensions) => void
    setSharedLightWattage: (wattage: number) => void
}

export const DEFAULT_ROOM_DIMENSIONS: RoomDimensions = { width: 120, depth: 120, height: 220 }
export const DEFAULT_SHARED_LIGHT_WATTAGE = 400

export const useCalculatorSessionStore = create<CalculatorSessionState>()((set) => ({
    roomDimensions: DEFAULT_ROOM_DIMENSIONS,
    sharedLightWattage: DEFAULT_SHARED_LIGHT_WATTAGE,
    setRoomDimensions: (dimensions) => set({ roomDimensions: dimensions }),
    setSharedLightWattage: (wattage) => set({ sharedLightWattage: wattage }),
}))
