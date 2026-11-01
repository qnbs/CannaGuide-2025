import { Strain, StrainType } from '@/types'

const inferFloweringType = (
    typeDetailsText: string,
    floweringTimeRangeText: string,
): Strain['floweringType'] | undefined => {
    const hasAutoMarker =
        typeDetailsText.toLowerCase().includes('autoflower') ||
        floweringTimeRangeText.toLowerCase().includes('lifecycle')
    return hasAutoMarker ? 'Autoflower' : undefined
}

const fallbackId = (): string => {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID()
    }
    const bytes = crypto.getRandomValues(new Uint8Array(5))
    const suffix = Array.from(bytes, (value) => value.toString(36)).join('').slice(0, 8)
    return `unknown-${Date.now()}-${suffix}`
}

const finiteNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

const strainTypeOf = (value: unknown): StrainType | undefined =>
    value === StrainType.Sativa || value === StrainType.Indica || value === StrainType.Hybrid
        ? value
        : undefined

const keepFinite = (
    strain: Partial<Strain>,
    key: 'thc' | 'cbd' | 'floweringTime',
    value: unknown,
): void => {
    const number = finiteNumber(value)
    if (number === undefined) {
        delete strain[key]
        return
    }
    strain[key] = number
}

/**
 * Copies reported cultivar fields. Missing chemistry, flowering time, type,
 * agronomy and genetic coefficients stay absent. A real 0, a real 9-week
 * figure and an explicit Hybrid are preserved. Synthetic profiles live in
 * `simulateStrainProfile`.
 */
export const createStrainObject = (data: Partial<Strain>): Strain => {
    const nameText = typeof data.name === 'string' ? data.name.trim() : ''
    const typeDetailsText = typeof data.typeDetails === 'string' ? data.typeDetails : ''
    const floweringTimeRangeText =
        typeof data.floweringTimeRange === 'string' ? data.floweringTimeRange : ''
    const strain: Partial<Strain> = {
        ...data,
        id: typeof data.id === 'string' && data.id.length > 0 ? data.id : fallbackId(),
        name: nameText || 'Unknown Strain',
    }

    const reportedType = strainTypeOf(data.type)
    if (reportedType) strain.type = reportedType
    else delete strain.type

    keepFinite(strain, 'thc', data.thc)
    keepFinite(strain, 'cbd', data.cbd)
    keepFinite(strain, 'floweringTime', data.floweringTime)

    if (data.floweringType) {
        strain.floweringType = data.floweringType
    } else {
        const inferred = inferFloweringType(typeDetailsText, floweringTimeRangeText)
        if (inferred) strain.floweringType = inferred
        else delete strain.floweringType
    }

    if (!data.agronomic) delete strain.agronomic
    if (!data.geneticModifiers) delete strain.geneticModifiers

    // Catalog modules still type every record as Strain. Absent measurements
    // stay absent at runtime; widening that type is a separate consumer pass.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return strain as Strain
}
