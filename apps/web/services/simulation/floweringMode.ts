import type { FloweringType, GrowSetup } from '@/types'

/** A flowering mode the cultivar reported, or the grower chose for one grow. */
export type FloweringMode = FloweringType

export const reportedFloweringMode = (value?: unknown): FloweringMode | undefined => {
    if (value === 'Photoperiod' || value === 'Autoflower') return value
    return undefined
}

/** A reported mode wins. A missing mode is autoflower only after an explicit choice. */
export const isAutoflowerGrow = (
    floweringType?: unknown,
    policy?: FloweringMode | undefined,
): boolean => {
    const reported = reportedFloweringMode(floweringType)
    if (reported === 'Autoflower') return true
    if (reported === 'Photoperiod') return false
    return policy === 'Autoflower'
}

export const holdsLongDayFlowerTransition = (
    floweringType: unknown,
    policy: FloweringMode | undefined,
    nextIsFlowering: boolean,
    lightHours: number,
): boolean => nextIsFlowering && !isAutoflowerGrow(floweringType, policy) && lightHours > 12

export const activeFloweringMode = (
    reported?: FloweringMode | undefined,
    chosen?: FloweringMode | undefined,
): FloweringMode | undefined => reported ?? chosen

/** 24/0 belongs to autoflower. Any other mode keeps a vegetative or flower cycle. */
export const lightHoursForMode = (hours: number, mode?: FloweringMode | undefined): number => {
    if (mode === 'Autoflower' || hours <= 18) return hours
    return 18
}

/** A reported mode needs no extra choice. A blank mode cannot start until one is chosen. */
export const setupForConfirm = (
    setup: GrowSetup,
    reported?: FloweringMode | undefined,
    chosen?: FloweringMode | undefined,
): GrowSetup | undefined => {
    if (reported !== undefined) return setup
    if (chosen === undefined) return undefined
    return { ...setup, floweringPolicy: chosen }
}

export const equipmentWithPolicy = <T extends object>(
    equipment: T,
    policy?: FloweringMode | undefined,
): T & { floweringPolicy?: FloweringMode | undefined } => {
    if (policy === undefined) return equipment
    return { ...equipment, floweringPolicy: policy }
}
