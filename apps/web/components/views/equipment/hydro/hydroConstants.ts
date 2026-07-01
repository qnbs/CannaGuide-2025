import type { HydroSystemType } from '@/types'

export const SYSTEM_TYPES: HydroSystemType[] = [
    'DWC',
    'NFT',
    'DripSystem',
    'EbbFlow',
    'Aeroponics',
    'Kratky',
]

export const TIME_RANGES = ['24h', '48h', '7d'] as const
export type TimeRange = (typeof TIME_RANGES)[number]

export const TIME_RANGE_MS: Record<TimeRange, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '48h': 48 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
}

const VALID_SYSTEM_TYPES: readonly string[] = [
    'DWC',
    'NFT',
    'DripSystem',
    'EbbFlow',
    'Aeroponics',
    'Kratky',
]

export function isHydroSystemType(value: string): value is HydroSystemType {
    return VALID_SYSTEM_TYPES.includes(value)
}
