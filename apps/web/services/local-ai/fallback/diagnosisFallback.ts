// ---------------------------------------------------------------------------
// diagnosisFallback.ts -- Heuristic plant diagnosis (VPD, pH, EC, temp, etc.)
// ---------------------------------------------------------------------------
// Extracted from fallbackService.ts to keep domain logic in focused modules.
// ---------------------------------------------------------------------------

import { PlantStage, type Plant, type Language } from '@/types'
import { localizeStr } from './localeHelpers'

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
        return localizeStr(lang, {
            en: `VPD too low (${vpd.toFixed(2)} kPa, target ${ideal.min}\u2013${ideal.max}). Lower humidity or increase temperature.`,
            de: `VPD zu niedrig (${vpd.toFixed(2)} kPa, Ziel ${ideal.min}\u2013${ideal.max}). Luftfeuchtigkeit senken oder Temperatur erh\u00f6hen.`,
            es: `VPD demasiado bajo (${vpd.toFixed(2)} kPa, objetivo ${ideal.min}\u2013${ideal.max}). Reducir humedad o aumentar temperatura.`,
            fr: `VPD trop bas (${vpd.toFixed(2)} kPa, cible ${ideal.min}\u2013${ideal.max}). Reduire l'humidite ou augmenter la temperature.`,
            nl: `VPD te laag (${vpd.toFixed(2)} kPa, doel ${ideal.min}\u2013${ideal.max}). Verlaag luchtvochtigheid of verhoog temperatuur.`,
        })
    }
    if (vpd > ideal.max) {
        return localizeStr(lang, {
            en: `VPD too high (${vpd.toFixed(2)} kPa, target ${ideal.min}\u2013${ideal.max}). Increase humidity or lower temperature.`,
            de: `VPD zu hoch (${vpd.toFixed(2)} kPa, Ziel ${ideal.min}\u2013${ideal.max}). Luftfeuchtigkeit erh\u00f6hen oder Temperatur senken.`,
            es: `VPD demasiado alto (${vpd.toFixed(2)} kPa, objetivo ${ideal.min}\u2013${ideal.max}). Aumentar humedad o reducir temperatura.`,
            fr: `VPD trop eleve (${vpd.toFixed(2)} kPa, cible ${ideal.min}\u2013${ideal.max}). Augmenter l'humidite ou baisser la temperature.`,
            nl: `VPD te hoog (${vpd.toFixed(2)} kPa, doel ${ideal.min}\u2013${ideal.max}). Verhoog luchtvochtigheid of verlaag temperatuur.`,
        })
    }
    return null
}

function analyzePh(ph: number, lang: Language): string | null {
    if (ph < 5.8)
        return localizeStr(lang, {
            en: `pH too low (${ph.toFixed(2)}). Target: 5.8\u20136.5. Use lime or pH-Up.`,
            de: `pH zu niedrig (${ph.toFixed(2)}). Ziel: 5.8\u20136.5. Kalk oder pH-Up nutzen.`,
            es: `pH demasiado bajo (${ph.toFixed(2)}). Objetivo: 5.8\u20136.5. Usar cal o pH-Up.`,
            fr: `pH trop bas (${ph.toFixed(2)}). Cible: 5.8\u20136.5. Utiliser chaux ou pH-Up.`,
            nl: `pH te laag (${ph.toFixed(2)}). Doel: 5.8\u20136.5. Gebruik kalk of pH-Up.`,
        })
    if (ph > 6.8)
        return localizeStr(lang, {
            en: `pH too high (${ph.toFixed(2)}). Target: 5.8\u20136.5. Use pH-Down.`,
            de: `pH zu hoch (${ph.toFixed(2)}). Ziel: 5.8\u20136.5. pH-Down oder Essig nutzen.`,
            es: `pH demasiado alto (${ph.toFixed(2)}). Objetivo: 5.8\u20136.5. Usar pH-Down.`,
            fr: `pH trop eleve (${ph.toFixed(2)}). Cible: 5.8\u20136.5. Utiliser pH-Down.`,
            nl: `pH te hoog (${ph.toFixed(2)}). Doel: 5.8\u20136.5. Gebruik pH-Down.`,
        })
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
        return localizeStr(lang, {
            en: `EC too low (${ec.toFixed(2)}, target ${target.min}\u2013${target.max}). Increase nutrients.`,
            de: `EC zu niedrig (${ec.toFixed(2)}, Ziel ${target.min}\u2013${target.max}). N\u00e4hrstoffe erh\u00f6hen.`,
            es: `EC demasiado bajo (${ec.toFixed(2)}, objetivo ${target.min}\u2013${target.max}). Aumentar nutrientes.`,
            fr: `EC trop bas (${ec.toFixed(2)}, cible ${target.min}\u2013${target.max}). Augmenter les nutriments.`,
            nl: `EC te laag (${ec.toFixed(2)}, doel ${target.min}\u2013${target.max}). Voeding verhogen.`,
        })
    if (ec > target.max)
        return localizeStr(lang, {
            en: `EC too high (${ec.toFixed(2)}, target ${target.min}\u2013${target.max}). Flush with plain water.`,
            de: `EC zu hoch (${ec.toFixed(2)}, Ziel ${target.min}\u2013${target.max}). Mit klarem Wasser sp\u00fclen.`,
            es: `EC demasiado alto (${ec.toFixed(2)}, objetivo ${target.min}\u2013${target.max}). Enjuagar con agua limpia.`,
            fr: `EC trop eleve (${ec.toFixed(2)}, cible ${target.min}\u2013${target.max}). Rincer a l'eau claire.`,
            nl: `EC te hoog (${ec.toFixed(2)}, doel ${target.min}\u2013${target.max}). Spoelen met schoon water.`,
        })
    return null
}

const analyzeTemperature = (temperature: number, lang: Language): string | null => {
    if (temperature > 30) {
        return localizeStr(lang, {
            en: `Temperature too high (${temperature.toFixed(1)}\u00b0C). Keep below 28\u00b0C.`,
            de: `Temperatur zu hoch (${temperature.toFixed(1)}\u00b0C). Unter 28\u00b0C halten.`,
            es: `Temperatura demasiado alta (${temperature.toFixed(1)}\u00b0C). Mantener por debajo de 28\u00b0C.`,
            fr: `Temperature trop elevee (${temperature.toFixed(1)}\u00b0C). Maintenir en dessous de 28\u00b0C.`,
            nl: `Temperatuur te hoog (${temperature.toFixed(1)}\u00b0C). Houd onder 28\u00b0C.`,
        })
    }

    if (temperature < 18) {
        return localizeStr(lang, {
            en: `Temperature too low (${temperature.toFixed(1)}\u00b0C). Keep above 20\u00b0C.`,
            de: `Temperatur zu niedrig (${temperature.toFixed(1)}\u00b0C). \u00dcber 20\u00b0C halten.`,
            es: `Temperatura demasiado baja (${temperature.toFixed(1)}\u00b0C). Mantener por encima de 20\u00b0C.`,
            fr: `Temperature trop basse (${temperature.toFixed(1)}\u00b0C). Maintenir au-dessus de 20\u00b0C.`,
            nl: `Temperatuur te laag (${temperature.toFixed(1)}\u00b0C). Houd boven 20\u00b0C.`,
        })
    }

    return null
}

const analyzeMoisture = (moisture: number, lang: Language): string | null => {
    if (moisture < 30) {
        return localizeStr(lang, {
            en: 'Medium too dry. Increase watering.',
            de: 'Substrat zu trocken. Bew\u00e4sserung erh\u00f6hen.',
            es: 'Sustrato demasiado seco. Aumentar el riego.',
            fr: "Substrat trop sec. Augmenter l'arrosage.",
            nl: 'Substraat te droog. Verhoog de bewatering.',
        })
    }

    if (moisture > 80) {
        return localizeStr(lang, {
            en: 'Medium too wet. Risk of overwatering.',
            de: 'Substrat zu feucht. \u00dcberw\u00e4sserungsgefahr.',
            es: 'Sustrato demasiado humedo. Riesgo de exceso de riego.',
            fr: 'Substrat trop humide. Risque de sur-arrosage.',
            nl: 'Substraat te nat. Risico op overbewatering.',
        })
    }

    return null
}

const analyzeRootHealth = (health: number, lang: Language): string | null => {
    if (health >= 60) {
        return null
    }

    return localizeStr(lang, {
        en: `Root health low (${health.toFixed(0)}%). Check mycorrhizae and drainage.`,
        de: `Wurzelgesundheit niedrig (${health.toFixed(0)}%). Mykorrhiza und Drainage pr\u00fcfen.`,
        es: `Salud de raices baja (${health.toFixed(0)}%). Revisar micorrizas y drenaje.`,
        fr: `Sante des racines faible (${health.toFixed(0)}%). Verifier mycorhizes et drainage.`,
        nl: `Wortelgezondheid laag (${health.toFixed(0)}%). Controleer mycorrhiza en drainage.`,
    })
}

const analyzeCo2 = (co2: number, lang: Language): string | null => {
    if (co2 < 300) {
        return localizeStr(lang, {
            en: `CO\u2082 very low (${co2} ppm). Check ventilation or CO\u2082 supplementation.`,
            de: `CO\u2082 sehr niedrig (${co2} ppm). Frischluft oder CO\u2082-Erg\u00e4nzung pr\u00fcfen.`,
            es: `CO\u2082 muy bajo (${co2} ppm). Verificar ventilacion o suplemento de CO\u2082.`,
            fr: `CO\u2082 tres bas (${co2} ppm). Verifier ventilation ou supplement de CO\u2082.`,
            nl: `CO\u2082 zeer laag (${co2} ppm). Controleer ventilatie of CO\u2082-suppletie.`,
        })
    }

    if (co2 > 1500) {
        return localizeStr(lang, {
            en: `CO\u2082 too high (${co2} ppm). Reduce below 1500 ppm to avoid plant stress.`,
            de: `CO\u2082 zu hoch (${co2} ppm). Auf unter 1500 ppm senken, um Pflanzenstress zu vermeiden.`,
            es: `CO\u2082 demasiado alto (${co2} ppm). Reducir por debajo de 1500 ppm para evitar estres.`,
            fr: `CO\u2082 trop eleve (${co2} ppm). Reduire en dessous de 1500 ppm pour eviter le stress.`,
            nl: `CO\u2082 te hoog (${co2} ppm). Verlaag onder 1500 ppm om plantstress te voorkomen.`,
        })
    }

    return null
}

const analyzeLightHours = (
    stage: PlantStage,
    lightHours: number,
    lang: Language,
): string | null => {
    if (stage === PlantStage.Flowering && lightHours > 14) {
        return localizeStr(lang, {
            en: `Light period too long for flowering (${lightHours}h). 12/12 recommended.`,
            de: `Lichtperiode zu lang f\u00fcr Bl\u00fcte (${lightHours}h). 12/12 empfohlen.`,
            es: `Periodo de luz demasiado largo para floracion (${lightHours}h). Se recomienda 12/12.`,
            fr: `Periode lumineuse trop longue pour la floraison (${lightHours}h). 12/12 recommande.`,
            nl: `Lichtperiode te lang voor bloei (${lightHours}h). 12/12 aanbevolen.`,
        })
    }

    if (stage === PlantStage.Vegetative && lightHours < 14) {
        return localizeStr(lang, {
            en: `Light period short for vegetative (${lightHours}h). 18/6 recommended.`,
            de: `Lichtperiode kurz f\u00fcr Vegetative (${lightHours}h). 18/6 empfohlen.`,
            es: `Periodo de luz corto para vegetativo (${lightHours}h). Se recomienda 18/6.`,
            fr: `Periode lumineuse courte pour vegetatif (${lightHours}h). 18/6 recommande.`,
            nl: `Lichtperiode kort voor vegetatief (${lightHours}h). 18/6 aanbevolen.`,
        })
    }

    return null
}

const pushIfPresent = (issues: string[], issue: string | null): void => {
    if (issue) {
        issues.push(issue)
    }
}

const defaultTopPriority = (lang: Language): string =>
    localizeStr(lang, {
        en: 'All parameters within normal range.',
        de: 'Alle Parameter im Normalbereich.',
        es: 'Todos los parametros dentro del rango normal.',
        fr: 'Tous les parametres dans la plage normale.',
        nl: 'Alle parameters binnen normaal bereik.',
    })

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
