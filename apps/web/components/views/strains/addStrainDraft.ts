import { DifficultyLevel, HeightLevel, Strain, StrainType, YieldLevel } from '@/types'
import { createStrainObject } from '@/services/strainFactory'

export type StrainFormValues = {
    name: string
    type: string
    typeDetails: string
    genetics: string
    floweringType: string
    thc: number | ''
    cbd: number | ''
    thcRange: string
    cbdRange: string
    floweringTime: number | ''
    floweringTimeRange: string
    description: string
    aromasString: string
    terpenesString: string
    difficulty: string
    yield: string
    height: string
    yieldIndoor: string
    yieldOutdoor: string
    heightIndoor: string
    heightOutdoor: string
}

const orEmpty = (value: string | undefined): string => value ?? ''

const orBlank = (value: number | undefined): number | '' =>
    typeof value === 'number' && Number.isFinite(value) ? value : ''

const joinList = (values: string[] | undefined): string => (values ?? []).join(', ')

const identityFields = (strain: Partial<Strain>) => ({
    name: orEmpty(strain.name),
    type: orEmpty(strain.type),
    typeDetails: orEmpty(strain.typeDetails),
    genetics: orEmpty(strain.genetics),
    floweringType: orEmpty(strain.floweringType),
    description: orEmpty(strain.description),
})

const measurementFields = (strain: Partial<Strain>) => ({
    thc: orBlank(strain.thc),
    cbd: orBlank(strain.cbd),
    thcRange: orEmpty(strain.thcRange),
    cbdRange: orEmpty(strain.cbdRange),
    floweringTime: orBlank(strain.floweringTime),
    floweringTimeRange: orEmpty(strain.floweringTimeRange),
    aromasString: joinList(strain.aromas),
    terpenesString: joinList(strain.dominantTerpenes),
})

const detailText = (
    details: { indoor?: string | undefined; outdoor?: string | undefined } | undefined,
    key: 'indoor' | 'outdoor',
): string => {
    if (!details) return ''
    return orEmpty(details[key])
}

const levelText = (
    agronomic: Strain['agronomic'] | undefined,
    key: 'difficulty' | 'yield' | 'height',
): string => {
    if (!agronomic) return ''
    return orEmpty(agronomic[key])
}

const agronomicFields = (strain: Partial<Strain>) => {
    const agronomic = strain.agronomic
    const yieldDetails = agronomic ? agronomic.yieldDetails : undefined
    const heightDetails = agronomic ? agronomic.heightDetails : undefined
    return {
        difficulty: levelText(agronomic, 'difficulty'),
        yield: levelText(agronomic, 'yield'),
        height: levelText(agronomic, 'height'),
        yieldIndoor: detailText(yieldDetails, 'indoor'),
        yieldOutdoor: detailText(yieldDetails, 'outdoor'),
        heightIndoor: detailText(heightDetails, 'indoor'),
        heightOutdoor: detailText(heightDetails, 'outdoor'),
    }
}

export const strainToFormValues = (strain: Partial<Strain>): StrainFormValues => ({
    ...identityFields(strain),
    ...measurementFields(strain),
    ...agronomicFields(strain),
})

export const defaultStrainValues = strainToFormValues({})

export const strainTypeOf = (value: unknown): StrainType | undefined =>
    value === StrainType.Sativa || value === StrainType.Indica || value === StrainType.Hybrid
        ? value
        : undefined

export const parseCommaSeparatedTokens = (value: string): string[] =>
    value
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)

const optionalFinite = (value: number | ''): number | undefined => {
    if (value === '') return undefined
    return Number.isFinite(value) ? value : undefined
}

const asFlowering = (value: string): Strain['floweringType'] | undefined =>
    value === 'Autoflower' || value === 'Photoperiod' ? value : undefined

const asDifficulty = (value: string): DifficultyLevel | undefined =>
    value === 'Easy' || value === 'Medium' || value === 'Hard' ? value : undefined

const asYield = (value: string): YieldLevel | undefined =>
    value === 'Low' || value === 'Medium' || value === 'High' ? value : undefined

const asHeight = (value: string): HeightLevel | undefined =>
    value === 'Short' || value === 'Medium' || value === 'Tall' ? value : undefined

const detailPair = (indoor: string, outdoor: string) => {
    const details: { indoor?: string | undefined; outdoor?: string | undefined } = {}
    if (indoor.trim()) details.indoor = indoor
    if (outdoor.trim()) details.outdoor = outdoor
    if (!details.indoor && !details.outdoor) return undefined
    return details
}

const attachEnums = (bag: Record<string, unknown>, values: StrainFormValues) => {
    const difficulty = asDifficulty(values.difficulty)
    const yieldLevel = asYield(values.yield)
    const height = asHeight(values.height)
    if (difficulty) bag.difficulty = difficulty
    if (yieldLevel) bag.yield = yieldLevel
    if (height) bag.height = height
}

const attachDetails = (bag: Record<string, unknown>, values: StrainFormValues) => {
    const yieldDetails = detailPair(values.yieldIndoor, values.yieldOutdoor)
    const heightDetails = detailPair(values.heightIndoor, values.heightOutdoor)
    if (yieldDetails) bag.yieldDetails = yieldDetails
    if (heightDetails) bag.heightDetails = heightDetails
}

const reportedAgronomic = (values: StrainFormValues): Record<string, unknown> | undefined => {
    const bag: Record<string, unknown> = {}
    attachEnums(bag, values)
    attachDetails(bag, values)
    return Object.keys(bag).length > 0 ? bag : undefined
}

const dropFormOwned = (kept: Partial<Strain>): void => {
    Reflect.deleteProperty(kept, 'name')
    Reflect.deleteProperty(kept, 'type')
    Reflect.deleteProperty(kept, 'typeDetails')
    Reflect.deleteProperty(kept, 'genetics')
    Reflect.deleteProperty(kept, 'floweringType')
    Reflect.deleteProperty(kept, 'thc')
    Reflect.deleteProperty(kept, 'cbd')
    Reflect.deleteProperty(kept, 'thcRange')
    Reflect.deleteProperty(kept, 'cbdRange')
    Reflect.deleteProperty(kept, 'floweringTime')
    Reflect.deleteProperty(kept, 'floweringTimeRange')
    Reflect.deleteProperty(kept, 'description')
    Reflect.deleteProperty(kept, 'aromas')
    Reflect.deleteProperty(kept, 'dominantTerpenes')
    Reflect.deleteProperty(kept, 'agronomic')
}

const preservedStrainFields = (strain: Strain | null): Partial<Strain> => {
    if (!strain) return {}
    const kept: Partial<Strain> = { ...strain }
    dropFormOwned(kept)
    return kept
}

const attachMeasurements = (
    partial: Partial<Strain>,
    thc: number | undefined,
    cbd: number | undefined,
    floweringTime: number | undefined,
) => {
    if (thc !== undefined) partial.thc = thc
    if (cbd !== undefined) partial.cbd = cbd
    if (floweringTime !== undefined) partial.floweringTime = floweringTime
}

const attachClassification = (partial: Partial<Strain>, values: StrainFormValues) => {
    const safeType = strainTypeOf(values.type)
    const floweringType = asFlowering(values.floweringType)
    if (safeType) partial.type = safeType
    if (floweringType) partial.floweringType = floweringType
    const agronomic = reportedAgronomic(values)
    if (agronomic) Object.assign(partial, { agronomic })
}

const draftId = (name: string, editing: Strain | null): string => {
    if (editing) return editing.id
    return `${name.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`
}

/**
 * Builds the strain an add/edit form should store. An edit keeps fields the
 * form does not own, and a blank measurement is omitted so a full replace
 * can clear the previous value.
 */
export const buildStrainDraft = (values: StrainFormValues, editing: Strain | null): Strain => {
    const safeName = typeof values.name === 'string' ? values.name : ''
    const partial: Partial<Strain> = {
        ...preservedStrainFields(editing),
        id: draftId(safeName, editing),
        name: safeName,
        typeDetails: values.typeDetails,
        genetics: values.genetics,
        thcRange: values.thcRange,
        cbdRange: values.cbdRange,
        floweringTimeRange: values.floweringTimeRange,
        description: values.description,
        aromas: parseCommaSeparatedTokens(values.aromasString),
        dominantTerpenes: parseCommaSeparatedTokens(values.terpenesString),
    }
    attachMeasurements(
        partial,
        optionalFinite(values.thc),
        optionalFinite(values.cbd),
        optionalFinite(values.floweringTime),
    )
    attachClassification(partial, values)
    const draft = createStrainObject(partial)
    if (!asFlowering(values.floweringType)) {
        Reflect.deleteProperty(draft, 'floweringType')
    }
    return draft
}
