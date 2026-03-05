import type { GrowthStage, VPDStatus } from '@/types/simulation.types'

export const VPD_TARGET_BANDS: Record<GrowthStage, { min: number; max: number; label: string }> = {
  seedling: { min: 0.4, max: 0.8, label: 'Seedling/Clones' },
  vegetative: { min: 0.8, max: 1.2, label: 'Vegetative' },
  earlyFlower: { min: 1.0, max: 1.4, label: 'Early Flower' },
  lateFlower: { min: 1.2, max: 1.6, label: 'Late Flower' },
}

export const getVPDStatusAdvice = (status: VPDStatus): string => {
  if (status === 'optimal') return 'VPD is in target range. Keep climate stable.'
  if (status === 'low') return 'VPD too low: reduce RH or increase canopy temperature.'
  if (status === 'high') return 'VPD too high: increase RH or lower canopy temperature.'
  return 'VPD in danger zone: immediate correction recommended to avoid stress.'
}
