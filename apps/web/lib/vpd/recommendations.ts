import type { GrowthStage, VPDStatus } from '@/types/simulation.types'
import { getT } from '@/i18n'

export const VPD_TARGET_BANDS: Record<GrowthStage, { min: number; max: number; labelKey: string }> = {
  seedling: { min: 0.4, max: 0.8, labelKey: 'plantsView.vpd.bands.seedling' },
  vegetative: { min: 0.8, max: 1.2, labelKey: 'plantsView.vpd.bands.vegetative' },
  earlyFlower: { min: 1.0, max: 1.4, labelKey: 'plantsView.vpd.bands.earlyFlower' },
  lateFlower: { min: 1.2, max: 1.6, labelKey: 'plantsView.vpd.bands.lateFlower' },
}

export const getVPDStatusAdvice = (status: VPDStatus): string => {
  const t = getT()
  if (status === 'optimal') return t('plantsView.vpd.advice.optimal')
  if (status === 'low') return t('plantsView.vpd.advice.low')
  if (status === 'high') return t('plantsView.vpd.advice.high')
  return t('plantsView.vpd.advice.danger')
}
