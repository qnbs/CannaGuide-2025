import type {
  AirflowLevel,
  GrowthStage,
  MediumType,
  SimulationPoint,
  VPDInput,
  VPDStatus,
} from '@/types/simulation.types'

const MEDIUM_MULTIPLIER: Record<MediumType, number> = {
  hydro: 1.25,
  coco: 1.1,
  soil: 1,
}

const AIRFLOW_MULTIPLIER: Record<AirflowLevel, number> = {
  low: 0.85,
  medium: 1,
  high: 1.15,
}

export const calculateSVP = (tempC: number): number => {
  return 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3))
}

export const getDynamicLeafOffset = (airTemp: number, lightOn: boolean): number => {
  if (!lightOn) return -1.0
  if (airTemp > 28) return 1.8
  if (airTemp < 22) return 3.0
  return 2.3
}

export const getTargetVPD = (phase: GrowthStage): number => {
  const targets: Record<GrowthStage, number> = {
    seedling: 0.6,
    vegetative: 1.0,
    earlyFlower: 1.2,
    lateFlower: 1.45,
  }

  return targets[phase]
}

export const getVPDStatus = (vpd: number, target: number): VPDStatus => {
  const diff = vpd - target

  if (Math.abs(diff) < 0.15) return 'optimal'
  if (diff < -0.3 || vpd < 0.4 || vpd > 1.9) return 'danger'
  return diff < 0 ? 'low' : 'high'
}

export const estimateTranspiration = (vpd: number, medium: MediumType): number => {
  const base = vpd * 0.18
  return Number((base * MEDIUM_MULTIPLIER[medium]).toFixed(2))
}

export const calculateVPD = (input: VPDInput): number => {
  const offset = input.leafTempOffset ?? getDynamicLeafOffset(input.airTemp, input.lightOn)
  const leafTemp = input.airTemp + offset
  const svpAir = calculateSVP(input.airTemp)
  const svpLeaf = calculateSVP(leafTemp)
  const avp = svpAir * (input.rh / 100)

  let vpd = svpLeaf - avp
  vpd *= MEDIUM_MULTIPLIER[input.medium] * AIRFLOW_MULTIPLIER[input.airflow]

  return Number(vpd.toFixed(3))
}

export const runDailySimulation = (
  baseInput: Omit<VPDInput, 'airTemp' | 'rh' | 'lightOn'>,
  tempProfile: number[],
  rhProfile: number[],
): SimulationPoint[] => {
  const result: SimulationPoint[] = []

  for (let hour = 0; hour < 24; hour += 1) {
    const lightOn = hour >= 6 && hour < 18
    const input: VPDInput = {
      ...baseInput,
      airTemp: tempProfile[hour] ?? 25,
      rh: rhProfile[hour] ?? 55,
      lightOn,
    }

    const vpd = calculateVPD(input)
    const target = getTargetVPD(input.phase)
    const leafTempOffset = input.leafTempOffset ?? getDynamicLeafOffset(input.airTemp, lightOn)

    result.push({
      hour,
      airTemp: input.airTemp,
      rh: input.rh,
      leafTemp: Number((input.airTemp + leafTempOffset).toFixed(2)),
      vpd,
      targetVPD: target,
      status: getVPDStatus(vpd, target),
      transpiration: estimateTranspiration(vpd, input.medium),
    })
  }

  return result
}
