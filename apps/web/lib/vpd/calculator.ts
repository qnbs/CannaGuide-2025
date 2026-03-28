/**
 * Scientific VPD Calculator for Cannabis Cultivation
 *
 * References:
 *  Buck (1981). "New Equations for Computing Vapor Pressure and Enhancement Factor".
 *    J. Appl. Meteorol. 20(12): 1527-1532.
 *  WMO-No. 8 (2018). "Guide to Instruments and Methods of Observation".
 *    World Meteorological Organization.
 *  Barometric formula: ISO 2533:1975 Standard Atmosphere.
 *
 * Why altitude matters for growers:
 *  At higher altitude the total air pressure is lower, so the same absolute VPD
 *  creates a proportionally stronger transpiration pull on plant tissue. A 1 kPa
 *  VPD at 2 000 m is physiologically equivalent to ~1.26 kPa at sea level.
 *  Source: Körner et al. (2019), Plant Cell Environ. 42(9): 2778-2797.
 */

/**
 * Saturated Vapour Pressure using the Buck (1981) enhanced formula.
 * Significantly more accurate than simple Magnus formula, especially > 30 °C.
 *
 * @param tempC  Air or leaf temperature in °C
 * @returns SVP in kPa
 */
export function calculateSVP(tempC: number): number {
    // Over liquid water (valid for –20 °C to +50 °C)
    return 0.61121 * Math.exp((18.678 - tempC / 234.5) * (tempC / (257.14 + tempC)));
}

/**
 * Barometric pressure at altitude using the international standard atmosphere
 * hypsometric formula (ISO 2533).
 *
 * @param altitudeM  Elevation above sea level in metres
 * @returns Pressure in kPa
 */
export function barometricPressure(altitudeM: number): number {
    if (altitudeM <= 0) return 101.325;
    return 101.325 * Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588);
}

/**
 * Altitude correction factor.
 * Returns the multiplier to convert "VPD at actual altitude" to its
 * physiologically equivalent VPD at sea level.
 *
 * @param altitudeM  Elevation in metres
 */
export function altitudeCorrectionFactor(altitudeM: number): number {
    if (altitudeM <= 0) return 1;
    return 101.325 / barometricPressure(altitudeM);
}

/**
 * Core VPD calculator with leaf-temperature offset and altitude correction.
 *
 * VPD = SVP(leafTemp) × (1 – RH / 100)
 * VPD_physiological = VPD × (P_sea / P_altitude)
 *
 * @param airTempC        Air temperature in °C
 * @param rhPercent       Relative humidity in % (0–100)
 * @param leafTempOffsetC Leaf-to-air temperature offset in °C (usually −2 to +2 °C)
 * @param altitudeM       Elevation above sea level in metres (default 0)
 * @returns Physiologically adjusted VPD in kPa
 */
export function calculateVPD(
    airTempC: number,
    rhPercent: number,
    leafTempOffsetC = 0,
    altitudeM = 0,
): number {
    const leafTemp = airTempC + leafTempOffsetC;
    const svp = calculateSVP(leafTemp);
    const rh = Math.min(100, Math.max(0, rhPercent));
    const vpd = svp * (1 - rh / 100);
    return vpd * altitudeCorrectionFactor(altitudeM);
}

/**
 * Dew-point temperature (Buck 1981 inversion).
 * Useful for condensation-risk warnings.
 *
 * @param airTempC   Air temperature in °C
 * @param rhPercent  Relative humidity in %
 * @returns Dew-point in °C
 */
export function calculateDewPoint(airTempC: number, rhPercent: number): number {
    const rh = Math.min(100, Math.max(0.1, rhPercent));
    const A = 18.678;
    const B = 234.5;
    const C = 257.14;
    const gamma = Math.log((rh / 100) * Math.exp((A - airTempC / B) * (airTempC / (C + airTempC))));
    return (C * gamma) / (A - gamma);
}
