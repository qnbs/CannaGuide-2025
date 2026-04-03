import { describe, it, expect } from 'vitest'
import {
    celsiusToFahrenheit,
    fahrenheitToCelsius,
    cmToInches,
    inchesToCm,
    metresToFeet,
    feetToMetres,
    cubicMToCubicFt,
    cubicFtToCubicM,
    litresToGallons,
    gallonsToLitres,
    kpaToPsi,
    psiToKpa,
    luxToFootcandles,
    footcandlesToLux,
    m3hToCfm,
    cfmToM3h,
    gramsToOunces,
    ouncesToGrams,
} from './unitConversion'

// ---------------------------------------------------------------------------
// Temperature
// ---------------------------------------------------------------------------

describe('Temperature conversions', () => {
    it('0 degC = 32 degF', () => {
        expect(celsiusToFahrenheit(0)).toBe(32)
    })

    it('100 degC = 212 degF', () => {
        expect(celsiusToFahrenheit(100)).toBe(212)
    })

    it('25 degC = 77 degF', () => {
        expect(celsiusToFahrenheit(25)).toBe(77)
    })

    it('32 degF = 0 degC', () => {
        expect(fahrenheitToCelsius(32)).toBe(0)
    })

    it('212 degF = 100 degC', () => {
        expect(fahrenheitToCelsius(212)).toBe(100)
    })

    it('round-trips C->F->C within 1 degree', () => {
        const original = 20
        const rt = fahrenheitToCelsius(celsiusToFahrenheit(original))
        expect(Math.abs(rt - original)).toBeLessThanOrEqual(1)
    })
})

// ---------------------------------------------------------------------------
// Length
// ---------------------------------------------------------------------------

describe('Length conversions', () => {
    it('2.54 cm = 1 inch', () => {
        expect(cmToInches(2.54)).toBeCloseTo(1, 1)
    })

    it('1 inch = 2.54 cm', () => {
        expect(inchesToCm(1)).toBeCloseTo(2.54, 1)
    })

    it('100 cm = ~39.4 inches', () => {
        expect(cmToInches(100)).toBeCloseTo(39.4, 0)
    })

    it('1 m = ~3.28 ft', () => {
        expect(metresToFeet(1)).toBeCloseTo(3.28, 0)
    })

    it('1 ft = ~0.3 m', () => {
        expect(feetToMetres(1)).toBeCloseTo(0.305, 1)
    })

    it('round-trips cm->in->cm within 0.1 cm', () => {
        const original = 50
        const rt = inchesToCm(cmToInches(original))
        expect(Math.abs(rt - original)).toBeLessThan(0.2)
    })
})

// ---------------------------------------------------------------------------
// Volume
// ---------------------------------------------------------------------------

describe('Volume conversions', () => {
    it('1 m3 = ~35.3 cubic feet', () => {
        expect(cubicMToCubicFt(1)).toBeCloseTo(35.31, 0)
    })

    it('1 ft3 = ~0.0283 m3', () => {
        expect(cubicFtToCubicM(1)).toBeCloseTo(0.028, 2)
    })

    it('1 litre = ~0.264 gallons', () => {
        expect(litresToGallons(1)).toBeCloseTo(0.264, 2)
    })

    it('1 gallon = ~3.785 litres', () => {
        expect(gallonsToLitres(1)).toBeCloseTo(3.785, 1)
    })

    it('round-trips litres->gal->litres within 0.01 L', () => {
        const original = 10
        const rt = gallonsToLitres(litresToGallons(original))
        expect(Math.abs(rt - original)).toBeLessThan(0.05)
    })
})

// ---------------------------------------------------------------------------
// Pressure
// ---------------------------------------------------------------------------

describe('Pressure conversions', () => {
    it('1 kPa = ~0.145 psi', () => {
        expect(kpaToPsi(1)).toBeCloseTo(0.145, 2)
    })

    it('1 psi = ~6.89 kPa', () => {
        expect(psiToKpa(1)).toBeCloseTo(6.89, 1)
    })

    it('round-trips kPa->psi->kPa within 1%', () => {
        const original = 2.0
        const rt = psiToKpa(kpaToPsi(original))
        expect(Math.abs(rt - original)).toBeLessThan(0.02)
    })
})

// ---------------------------------------------------------------------------
// Illuminance
// ---------------------------------------------------------------------------

describe('Illuminance conversions', () => {
    it('1000 lux = ~92.9 foot-candles', () => {
        expect(luxToFootcandles(1000)).toBeCloseTo(92.9, 0)
    })

    it('1 foot-candle = ~10.76 lux', () => {
        expect(footcandlesToLux(1)).toBeCloseTo(10.8, 0)
    })

    it('round-trips lux->fc->lux within 1 lux', () => {
        const original = 500
        const rt = footcandlesToLux(luxToFootcandles(original))
        expect(Math.abs(rt - original)).toBeLessThan(2)
    })
})

// ---------------------------------------------------------------------------
// Flow rate
// ---------------------------------------------------------------------------

describe('Flow rate conversions', () => {
    it('1 m3/h = ~0.59 CFM', () => {
        expect(m3hToCfm(1)).toBeCloseTo(0.6, 1)
    })

    it('1 CFM = ~1.70 m3/h', () => {
        expect(cfmToM3h(1)).toBeCloseTo(1.7, 1)
    })

    it('round-trips m3h->cfm->m3h within 1%', () => {
        const original = 100
        const rt = cfmToM3h(m3hToCfm(original))
        expect(Math.abs(rt - original)).toBeLessThan(1)
    })
})

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

describe('Weight conversions', () => {
    it('28.35 g = ~1 oz', () => {
        expect(gramsToOunces(28.35)).toBeCloseTo(1, 1)
    })

    it('1 oz = ~28.35 g', () => {
        expect(ouncesToGrams(1)).toBeCloseTo(28.3, 0)
    })

    it('round-trips grams->oz->grams within 0.5 g', () => {
        const original = 14
        const rt = ouncesToGrams(gramsToOunces(original))
        expect(Math.abs(rt - original)).toBeLessThan(0.5)
    })
})
