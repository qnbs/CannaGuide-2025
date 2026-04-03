// ---------------------------------------------------------------------------
// unitConversion.ts -- Metric <-> Imperial conversion utilities
//
// All functions are pure, deterministic, and stateless.
// Round-trip precision: values rounded to sensible decimal places for display.
// ---------------------------------------------------------------------------

export type UnitSystem = 'metric' | 'imperial'

// ---------------------------------------------------------------------------
// Temperature
// ---------------------------------------------------------------------------

/** Celsius -> Fahrenheit */
export function celsiusToFahrenheit(c: number): number {
    return Math.round((c * 9) / 5 + 32)
}

/** Fahrenheit -> Celsius */
export function fahrenheitToCelsius(f: number): number {
    return Math.round(((f - 32) * 5) / 9)
}

// ---------------------------------------------------------------------------
// Length
// ---------------------------------------------------------------------------

/** Centimetres -> Inches (1 dp) */
export function cmToInches(cm: number): number {
    return Math.round((cm / 2.54) * 10) / 10
}

/** Inches -> Centimetres (1 dp) */
export function inchesToCm(inches: number): number {
    return Math.round(inches * 2.54 * 10) / 10
}

/** Metres -> Feet (2 dp) */
export function metresToFeet(m: number): number {
    return Math.round(m * 3.28084 * 100) / 100
}

/** Feet -> Metres (2 dp) */
export function feetToMetres(ft: number): number {
    return Math.round((ft / 3.28084) * 100) / 100
}

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

/** Cubic metres -> Cubic feet (2 dp) */
export function cubicMToCubicFt(m3: number): number {
    return Math.round(m3 * 35.3147 * 100) / 100
}

/** Cubic feet -> Cubic metres (3 dp) */
export function cubicFtToCubicM(ft3: number): number {
    return Math.round((ft3 / 35.3147) * 1000) / 1000
}

/** Litres -> US gallons (2 dp) */
export function litresToGallons(l: number): number {
    return Math.round((l / 3.78541) * 100) / 100
}

/** US gallons -> Litres (2 dp) */
export function gallonsToLitres(gal: number): number {
    return Math.round(gal * 3.78541 * 100) / 100
}

// ---------------------------------------------------------------------------
// Pressure
// ---------------------------------------------------------------------------

/** kPa -> PSI (3 dp) */
export function kpaToPsi(kpa: number): number {
    return Math.round((kpa / 6.89476) * 1000) / 1000
}

/** PSI -> kPa (2 dp) */
export function psiToKpa(psi: number): number {
    return Math.round(psi * 6.89476 * 100) / 100
}

// ---------------------------------------------------------------------------
// Illuminance
// ---------------------------------------------------------------------------

/** Lux -> Foot-candles (2 dp) */
export function luxToFootcandles(lux: number): number {
    return Math.round((lux / 10.7639) * 100) / 100
}

/** Foot-candles -> Lux (1 dp) */
export function footcandlesToLux(fc: number): number {
    return Math.round(fc * 10.7639 * 10) / 10
}

// ---------------------------------------------------------------------------
// Flow rate (ventilation)
// ---------------------------------------------------------------------------

/** m3/h -> CFM (cubic feet per minute) (1 dp) */
export function m3hToCfm(m3h: number): number {
    return Math.round((m3h / 1.69901) * 10) / 10
}

/** CFM -> m3/h (1 dp) */
export function cfmToM3h(cfm: number): number {
    return Math.round(cfm * 1.69901 * 10) / 10
}

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

/** Grams -> Ounces (2 dp) */
export function gramsToOunces(g: number): number {
    return Math.round((g / 28.3495) * 100) / 100
}

/** Ounces -> Grams (1 dp) */
export function ouncesToGrams(oz: number): number {
    return Math.round(oz * 28.3495 * 10) / 10
}
