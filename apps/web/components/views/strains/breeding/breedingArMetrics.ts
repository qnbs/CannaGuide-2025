/** Preview resin from a reported THC percent. Missing and non-finite stay absent. 0 stays 0. */
export const resinFromReportedThc = (thc: number | null | undefined): number | undefined => {
    if (typeof thc !== 'number' || !Number.isFinite(thc) || thc < 0) return undefined
    return Math.max(0, Math.min(10, Math.round(thc / 2)))
}

export const clampPreviewStat = (value: number): number => {
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(10, value))
}

/** A non-finite resin stat is missing, not a reported zero. */
export const finitePreviewResin = (value: number | null | undefined): number | undefined => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
    return Math.max(0, Math.min(10, value))
}
