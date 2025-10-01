
import React from 'react'

/**
 * @deprecated This component is obsolete and should be removed.
 * The simulation loop is now handled on-demand by the `updatePlantToNow` thunk
 * in `stores/slices/simulationSlice.ts` and in the background via a web worker
 * triggered by the `tick` action.
 */
export const SimulationManager: React.FC = () => {
  return null
}
