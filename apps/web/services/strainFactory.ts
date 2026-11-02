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
    const suffix = Array.from(bytes, (value) => value.toString(36))
        .join('')
        .slice(0, 8)
    return `unknown-${Date.now()}-${suffix}`
}

const finiteNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined

const strainTypeOf = (value: unknown): StrainType | undefined =>
    value === StrainType.Sativa || value === StrainType.Indica || value === StrainType.Hybrid
        ? value
        : undefined

const withoutControlledFields = (data: Partial<Strain>): Partial<Strain> => {
    const copy: Partial<Strain> = { ...data }
    delete copy.id
    delete copy.name
    delete copy.type
    delete copy.thc
    delete copy.cbd
    delete copy.floweringTime
    delete copy.floweringType
    delete copy.agronomic
    delete copy.geneticModifiers
    return copy
}

const reportedMeasurements = (data: Partial<Strain>): Partial<Strain> => {
    const measurements: Partial<Strain> = {}
    const thc = finiteNumber(data.thc)
    const cbd = finiteNumber(data.cbd)
    const floweringTime = finiteNumber(data.floweringTime)
    if (thc !== undefined) measurements.thc = thc
    if (cbd !== undefined) measurements.cbd = cbd
    if (floweringTime !== undefined) measurements.floweringTime = floweringTime
    return measurements
}

const reportedFloweringType = (data: Partial<Strain>): Strain['floweringType'] | undefined => {
    if (data.floweringType) return data.floweringType
    const typeDetailsText = typeof data.typeDetails === 'string' ? data.typeDetails : ''
    const floweringTimeRangeText =
        typeof data.floweringTimeRange === 'string' ? data.floweringTimeRange : ''
    return inferFloweringType(typeDetailsText, floweringTimeRangeText)
}

const reportedId = (id: unknown): string => {
    if (typeof id !== 'string' || id.length === 0) return fallbackId()
    return id
}

const reportedName = (name: unknown): string => {
    if (typeof name !== 'string') return 'Unknown Strain'
    const text = name.trim()
    return text.length > 0 ? text : 'Unknown Strain'
}

const withReportedType = (type: StrainType | undefined): Partial<Strain> =>
    type === undefined ? {} : { type }

const withFloweringType = (floweringType: Strain['floweringType'] | undefined): Partial<Strain> =>
    floweringType === undefined ? {} : { floweringType }

const withAgronomic = (agronomic: Strain['agronomic'] | undefined): Partial<Strain> =>
    agronomic === undefined ? {} : { agronomic }

const withGeneticModifiers = (
    geneticModifiers: Strain['geneticModifiers'] | undefined,
): Partial<Strain> => (geneticModifiers === undefined ? {} : { geneticModifiers })

/**
 * Copies reported cultivar fields. Missing chemistry, flowering time, type,
 * agronomy and genetic coefficients stay absent. A real 0, a real 9-week
 * figure and an explicit Hybrid are preserved. Synthetic profiles live in
 * `simulateStrainProfile`.
 */
export const createStrainObject = (data: Partial<Strain>): Strain => {
    const strain: Partial<Strain> = {
        ...withoutControlledFields(data),
        ...reportedMeasurements(data),
        id: reportedId(data.id),
        name: reportedName(data.name),
        ...withReportedType(strainTypeOf(data.type)),
        ...withFloweringType(reportedFloweringType(data)),
        ...withAgronomic(data.agronomic),
        ...withGeneticModifiers(data.geneticModifiers),
    }

    // Catalog modules still type every record as Strain. Absent measurements
    // stay absent at runtime; widening that type is a separate consumer pass.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return strain as Strain
}
