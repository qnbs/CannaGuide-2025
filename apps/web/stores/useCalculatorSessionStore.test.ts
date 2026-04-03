import { describe, it, expect, beforeEach } from 'vitest'
import {
    useCalculatorSessionStore,
    DEFAULT_ROOM_DIMENSIONS,
    DEFAULT_SHARED_LIGHT_WATTAGE,
} from './useCalculatorSessionStore'

describe('useCalculatorSessionStore', () => {
    beforeEach(() => {
        useCalculatorSessionStore.setState({
            roomDimensions: DEFAULT_ROOM_DIMENSIONS,
            sharedLightWattage: DEFAULT_SHARED_LIGHT_WATTAGE,
        })
    })

    it('has correct default values', () => {
        const state = useCalculatorSessionStore.getState()
        expect(state.roomDimensions).toEqual(DEFAULT_ROOM_DIMENSIONS)
        expect(state.sharedLightWattage).toBe(DEFAULT_SHARED_LIGHT_WATTAGE)
    })

    it('updates room dimensions', () => {
        const { setRoomDimensions } = useCalculatorSessionStore.getState()
        setRoomDimensions({ width: 200, depth: 150, height: 250 })
        const { roomDimensions } = useCalculatorSessionStore.getState()
        expect(roomDimensions.width).toBe(200)
        expect(roomDimensions.depth).toBe(150)
        expect(roomDimensions.height).toBe(250)
    })

    it('updates shared light wattage', () => {
        const { setSharedLightWattage } = useCalculatorSessionStore.getState()
        setSharedLightWattage(600)
        expect(useCalculatorSessionStore.getState().sharedLightWattage).toBe(600)
    })

    it('partial dimension update preserves other props', () => {
        const { setRoomDimensions } = useCalculatorSessionStore.getState()
        const original = useCalculatorSessionStore.getState().roomDimensions
        setRoomDimensions({ ...original, width: 300 })
        const { roomDimensions } = useCalculatorSessionStore.getState()
        expect(roomDimensions.width).toBe(300)
        expect(roomDimensions.depth).toBe(original.depth)
        expect(roomDimensions.height).toBe(original.height)
    })
})
