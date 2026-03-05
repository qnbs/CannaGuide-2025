export type MediumType = 'soil' | 'coco' | 'hydro'
export type AirflowLevel = 'low' | 'medium' | 'high'
export type GrowthStage = 'seedling' | 'vegetative' | 'earlyFlower' | 'lateFlower'

export interface VPDInput {
  airTemp: number
  rh: number
  leafTempOffset?: number
  medium: MediumType
  airflow: AirflowLevel
  lightOn: boolean
  phase: GrowthStage
}

export type VPDStatus = 'optimal' | 'low' | 'high' | 'danger'

export interface SimulationPoint {
  hour: number
  airTemp: number
  rh: number
  leafTemp: number
  vpd: number
  targetVPD: number
  status: VPDStatus
  transpiration: number
}

export interface PlantState {
  id: string
  ageDays: number
  growthStage: GrowthStage
  biomass: number
  health: number
  projectedYield: number
  stressLevel: number
  vpdHistory: Array<{ date: string; vpd: number; status: VPDStatus }>
}

export interface RunDailyPayload {
  baseInput: Omit<VPDInput, 'airTemp' | 'rh' | 'lightOn'>
  tempProfile: number[]
  rhProfile: number[]
}

export interface RunGrowthPayload {
  plant: PlantState
  env: VPDInput
  days: number
}

export interface DailyResultMessage {
  type: 'DAILY_RESULT'
  data: SimulationPoint[]
}

export interface GrowthResultMessage {
  type: 'GROWTH_RESULT'
  plant: PlantState
}

export type VPDWorkerResponse = DailyResultMessage | GrowthResultMessage
