// ---------------------------------------------------------------------------
// diagnosisFallback.ts -- Heuristic plant diagnosis (VPD, pH, EC, temp, etc.)
// ---------------------------------------------------------------------------
// Extracted from fallbackService.ts to keep domain logic in focused modules.
// ---------------------------------------------------------------------------

import { PlantStage, type Plant, type Language } from '@/types'

const isGerman = (lang: Language): boolean => lang === 'de'

export interface PlantDiagnostic {
    issues: string[]
    topPriority: string
}

function analyzeVpd(vpd: number, stage: PlantStage, lang: Language): string | null {
    const ideal =
        stage === PlantStage.Seedling || stage === PlantStage.Germination
            ? { min: 0.4, max: 0.8 }
            : stage === PlantStage.Flowering
              ? { min: 1.0, max: 1.5 }
              : { min: 0.8, max: 1.2 }

    if (vpd < ideal.min) {
        return isGerman(lang)
            ? `VPD zu niedrig (${vpd.toFixed(2)} kPa, Ziel ${ideal.min}\u2013${ideal.max}). Luftfeuchtigkeit senken oder Temperatur erh\u00f6hen.`
            : `VPD too low (${vpd.toFixed(2)} kPa, target ${ideal.min}\u2013${ideal.max}). Lower humidity or increase temperature.`
    }
    if (vpd > ideal.max) {
        return isGerman(lang)
            ? `VPD zu hoch (${vpd.toFixed(2)} kPa, Ziel ${ideal.min}\u2013${ideal.max}). Luftfeuchtigkeit erh\u00f6hen oder Temperatur senken.`
            : `VPD too high (${vpd.toFixed(2)} kPa, target ${ideal.min}\u2013${ideal.max}). Increase humidity or lower temperature.`
    }
    return null
}

function analyzePh(ph: number, lang: Language): string | null {
    if (ph < 5.8)
        return isGerman(lang)
            ? `pH zu niedrig (${ph.toFixed(2)}). Ziel: 5.8\u20136.5. Kalk oder pH-Up nutzen.`
            : `pH too low (${ph.toFixed(2)}). Target: 5.8\u20136.5. Use lime or pH-Up.`
    if (ph > 6.8)
        return isGerman(lang)
            ? `pH zu hoch (${ph.toFixed(2)}). Ziel: 5.8\u20136.5. pH-Down oder Essig nutzen.`
            : `pH too high (${ph.toFixed(2)}). Target: 5.8\u20136.5. Use pH-Down.`
    return null
}

function analyzeEc(ec: number, stage: PlantStage, lang: Language): string | null {
    const target =
        stage === PlantStage.Seedling
            ? { min: 0.4, max: 0.8 }
            : stage === PlantStage.Vegetative
              ? { min: 1.0, max: 1.8 }
              : stage === PlantStage.Flowering
                ? { min: 1.2, max: 2.2 }
                : null
    if (!target) return null
    if (ec < target.min)
        return isGerman(lang)
            ? `EC zu niedrig (${ec.toFixed(2)}, Ziel ${target.min}\u2013${target.max}). N\u00e4hrstoffe erh\u00f6hen.`
            : `EC too low (${ec.toFixed(2)}, target ${target.min}\u2013${target.max}). Increase nutrients.`
    if (ec > target.max)
        return isGerman(lang)
            ? `EC zu hoch (${ec.toFixed(2)}, Ziel ${target.min}\u2013${target.max}). Mit klarem Wasser sp\u00fclen.`
            : `EC too high (${ec.toFixed(2)}, target ${target.min}\u2013${target.max}). Flush with plain water.`
    return null
}

const analyzeTemperature = (temperature: number, lang: Language): string | null => {
    if (temperature > 30) {
        return isGerman(lang)
            ? `Temperatur zu hoch (${temperature.toFixed(1)}\u00b0C). Unter 28\u00b0C halten.`
            : `Temperature too high (${temperature.toFixed(1)}\u00b0C). Keep below 28\u00b0C.`
    }

    if (temperature < 18) {
        return isGerman(lang)
            ? `Temperatur zu niedrig (${temperature.toFixed(1)}\u00b0C). \u00dcber 20\u00b0C halten.`
            : `Temperature too low (${temperature.toFixed(1)}\u00b0C). Keep above 20\u00b0C.`
    }

    return null
}

const analyzeMoisture = (moisture: number, lang: Language): string | null => {
    if (moisture < 30) {
        return isGerman(lang)
            ? 'Substrat zu trocken. Bew\u00e4sserung erh\u00f6hen.'
            : 'Medium too dry. Increase watering.'
    }

    if (moisture > 80) {
        return isGerman(lang)
            ? 'Substrat zu feucht. \u00dcberw\u00e4sserungsgefahr.'
            : 'Medium too wet. Risk of overwatering.'
    }

    return null
}

const analyzeRootHealth = (health: number, lang: Language): string | null => {
    if (health >= 60) {
        return null
    }

    return isGerman(lang)
        ? `Wurzelgesundheit niedrig (${health.toFixed(0)}%). Mykorrhiza und Drainage pr\u00fcfen.`
        : `Root health low (${health.toFixed(0)}%). Check mycorrhizae and drainage.`
}

const analyzeCo2 = (co2: number, lang: Language): string | null => {
    if (co2 < 300) {
        return isGerman(lang)
            ? `CO\u2082 sehr niedrig (${co2} ppm). Frischluft oder CO\u2082-Erg\u00e4nzung pr\u00fcfen.`
            : `CO\u2082 very low (${co2} ppm). Check ventilation or CO\u2082 supplementation.`
    }

    if (co2 > 1500) {
        return isGerman(lang)
            ? `CO\u2082 zu hoch (${co2} ppm). Auf unter 1500 ppm senken, um Pflanzenstress zu vermeiden.`
            : `CO\u2082 too high (${co2} ppm). Reduce below 1500 ppm to avoid plant stress.`
    }

    return null
}

const analyzeLightHours = (
    stage: PlantStage,
    lightHours: number,
    lang: Language,
): string | null => {
    if (stage === PlantStage.Flowering && lightHours > 14) {
        return isGerman(lang)
            ? `Lichtperiode zu lang f\u00fcr Bl\u00fcte (${lightHours}h). 12/12 empfohlen.`
            : `Light period too long for flowering (${lightHours}h). 12/12 recommended.`
    }

    if (stage === PlantStage.Vegetative && lightHours < 14) {
        return isGerman(lang)
            ? `Lichtperiode kurz f\u00fcr Vegetative (${lightHours}h). 18/6 empfohlen.`
            : `Light period short for vegetative (${lightHours}h). 18/6 recommended.`
    }

    return null
}

const pushIfPresent = (issues: string[], issue: string | null): void => {
    if (issue) {
        issues.push(issue)
    }
}

const defaultTopPriority = (lang: Language): string =>
    isGerman(lang) ? 'Alle Parameter im Normalbereich.' : 'All parameters within normal range.'

export function diagnosePlant(plant: Plant, lang: Language): PlantDiagnostic {
    const issues: string[] = []
    pushIfPresent(issues, analyzeVpd(plant.environment.vpd, plant.stage, lang))
    pushIfPresent(issues, analyzePh(plant.medium.ph, lang))
    pushIfPresent(issues, analyzeEc(plant.medium.ec, plant.stage, lang))
    pushIfPresent(issues, analyzeTemperature(plant.environment.internalTemperature, lang))
    pushIfPresent(issues, analyzeMoisture(plant.medium.moisture, lang))
    pushIfPresent(issues, analyzeRootHealth(plant.rootSystem.health, lang))
    pushIfPresent(issues, analyzeCo2(plant.environment.co2Level, lang))
    pushIfPresent(issues, analyzeLightHours(plant.stage, plant.equipment.light.lightHours, lang))

    const topPriority = issues[0] ?? defaultTopPriority(lang)

    return { issues, topPriority }
}
