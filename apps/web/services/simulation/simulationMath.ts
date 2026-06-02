/** Shared numeric guards for plant simulation (finite checks and clamping). */

export const simClamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value))

export const simIsFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value)

export const simFiniteOr = (value: unknown, fallback: number): number =>
    simIsFiniteNumber(value) ? value : fallback

export const simFiniteOrMin = (value: unknown, fallback: number, min: number): number =>
    Math.max(min, simFiniteOr(value, fallback))

export const simFiniteOrClamped = (
    value: unknown,
    fallback: number,
    min: number,
    max: number,
): number => simClamp(simFiniteOr(value, fallback), min, max)
