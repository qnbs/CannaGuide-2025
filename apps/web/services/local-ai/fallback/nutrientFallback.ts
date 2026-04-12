// ---------------------------------------------------------------------------
// nutrientFallback.ts -- Heuristic nutrient recommendation builder
// ---------------------------------------------------------------------------
// Extracted from fallbackService.ts to isolate nutrient domain logic.
// ---------------------------------------------------------------------------

import type { Language } from '@/types'
import type { NutrientContext } from '@/types/aiProvider'
import { localizeStr } from './localeHelpers'

type NutrientRecommendationContext = NutrientContext

const mediumAdvice = (medium: string, lang: Language): string => {
    const normalized = medium.toLowerCase()
    if (normalized.includes('coco')) {
        return localizeStr(lang, {
            en: 'Coco reacts quickly. Small corrections and frequent checks make the most sense here.',
            de: 'Coco reagiert schnell. Kleine Korrekturen und engmaschige Kontrollen sind hier sinnvoll.',
            es: 'El coco reacciona rapido. Pequenas correcciones y controles frecuentes son lo mejor.',
            fr: 'Le coco reagit vite. Petites corrections et controles frequents sont les meilleurs ici.',
            nl: 'Kokos reageert snel. Kleine correcties en frequente controles zijn hier het beste.',
        })
    }
    if (normalized.includes('hydro')) {
        return localizeStr(lang, {
            en: 'Hydro needs the tightest control. Make changes in small steps and verify values daily.',
            de: 'Hydro ben\u00f6tigt die engste Kontrolle. \u00c4nderungen in kleinen Schritten vornehmen und die Werte t\u00e4glich pr\u00fcfen.',
            es: 'Hidro necesita el control mas estricto. Hacer cambios en pasos pequenos y verificar valores diariamente.',
            fr: "L'hydro necessite le controle le plus strict. Faire des changements par petits pas et verifier les valeurs quotidiennement.",
            nl: 'Hydro vereist de strengste controle. Breng wijzigingen in kleine stappen aan en controleer dagelijks.',
        })
    }
    return localizeStr(lang, {
        en: 'Soil is more forgiving. Gentle adjustments and slower corrections are usually the best choice.',
        de: 'Erde verzeiht etwas mehr. Sanfte Anpassungen und langsames Nachregeln sind meistens die beste Wahl.',
        es: 'La tierra es mas indulgente. Ajustes suaves y correcciones lentas suelen ser la mejor opcion.',
        fr: 'La terre est plus indulgente. Des ajustements doux et des corrections lentes sont generalement les meilleurs.',
        nl: 'Aarde is vergevingsgezinder. Zachte aanpassingen en langzame correcties zijn meestal de beste keuze.',
    })
}

const TREND_THRESHOLD = 0.15

const formatTrendChange = (nutrient: string, delta: number, lang: Language): string => {
    const label = Math.abs(delta).toFixed(2)
    const direction = localizeStr(lang, {
        en: delta > 0 ? 'risen' : 'fallen',
        de: delta > 0 ? 'steigt' : 'f\u00e4llt',
        es: delta > 0 ? 'subido' : 'bajado',
        fr: delta > 0 ? 'monte' : 'baisse',
        nl: delta > 0 ? 'gestegen' : 'gedaald',
    })
    return localizeStr(lang, {
        en: `${nutrient} has ${direction} by ${label} across the recent readings.`,
        de: `${nutrient} ${direction} \u00fcber die letzten Messungen um ${label}.`,
        es: `${nutrient} ha ${direction} ${label} en las lecturas recientes.`,
        fr: `${nutrient} a ${direction} de ${label} sur les dernieres mesures.`,
        nl: `${nutrient} is ${direction} met ${label} over de recente metingen.`,
    })
}

const summarizeTrend = (context: NutrientRecommendationContext, lang: Language): string | null => {
    if (context.readings.length < 2) {
        return null
    }

    const orderedReadings = context.readings.toSorted(
        (left, right) => left.timestamp - right.timestamp,
    )
    const firstReading = orderedReadings[0]
    const lastReading = orderedReadings[orderedReadings.length - 1]
    if (!firstReading || !lastReading) return null

    const checks: ReadonlyArray<{ nutrient: string; delta: number }> = [
        { nutrient: 'EC', delta: lastReading.ec - firstReading.ec },
        { nutrient: 'pH', delta: lastReading.ph - firstReading.ph },
    ]

    const changes = checks
        .filter(({ delta }) => Math.abs(delta) >= TREND_THRESHOLD)
        .map(({ nutrient, delta }) => formatTrendChange(nutrient, delta, lang))

    return changes.length > 0 ? changes.join(' ') : null
}

const resolveNutrientPlantLabel = (
    context: NutrientRecommendationContext,
    lang: Language,
): string => {
    if (context.plant) {
        return `${context.plant.name} (${context.plant.strain.name})`
    }

    return localizeStr(lang, {
        en: 'without a selected plant',
        de: 'ohne ausgew\u00e4hlte Pflanze',
        es: 'sin planta seleccionada',
        fr: 'sans plante selectionnee',
        nl: 'zonder geselecteerde plant',
    })
}

const appendEcRecommendationLine = (
    lines: string[],
    context: NutrientRecommendationContext,
    lang: Language,
    withinEc: boolean,
): void => {
    if (withinEc) {
        lines.push(
            localizeStr(lang, {
                en: 'EC is within target. Keep the feed strength steady for now.',
                de: 'EC liegt im Sollbereich. Die F\u00fctterung kann stabil bleiben.',
                es: 'EC dentro del objetivo. Mantener la fuerza de alimentacion estable.',
                fr: 'EC dans la cible. Maintenir la force de nutrition stable.',
                nl: 'EC binnen doel. Houd de voedingssterkte stabiel.',
            }),
        )
        return
    }

    if (context.currentEc < context.optimalRange.ecMin) {
        const stepLabel = localizeStr(lang, {
            en: context.medium.toLowerCase().includes('hydro') ? 'small' : 'moderate',
            de: context.medium.toLowerCase().includes('hydro') ? 'kleinen' : 'moderaten',
            es: context.medium.toLowerCase().includes('hydro') ? 'pequenos' : 'moderados',
            fr: context.medium.toLowerCase().includes('hydro') ? 'petits' : 'moderes',
            nl: context.medium.toLowerCase().includes('hydro') ? 'kleine' : 'matige',
        })

        lines.push(
            localizeStr(lang, {
                en: `EC is too low. Increase the next feed slightly and move back toward ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} in ${stepLabel} steps.`,
                de: `EC ist zu niedrig. Die n\u00e4chste Gabe leicht anheben und in ${stepLabel} Schritten auf ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} bringen.`,
                es: `EC demasiado bajo. Aumentar ligeramente y volver a ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} en pasos ${stepLabel}.`,
                fr: `EC trop bas. Augmenter legerement et revenir vers ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} par ${stepLabel} pas.`,
                nl: `EC te laag. Verhoog de volgende voeding lichtjes en beweeg terug naar ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} in ${stepLabel} stappen.`,
            }),
        )
        return
    }

    lines.push(
        localizeStr(lang, {
            en: 'EC is too high. Dilute the mix a bit or plan a plain-water irrigation.',
            de: 'EC ist zu hoch. Die Mischung etwas verd\u00fcnnen oder eine Bew\u00e4sserung mit klarem Wasser einplanen.',
            es: 'EC demasiado alto. Diluir la mezcla o planificar un riego con agua limpia.',
            fr: "EC trop eleve. Diluer le melange ou prevoir un arrosage a l'eau claire.",
            nl: 'EC te hoog. Verdun het mengsel of plan een bewatering met schoon water.',
        }),
    )
}

const appendPhRecommendationLine = (
    lines: string[],
    context: NutrientRecommendationContext,
    lang: Language,
    withinPh: boolean,
): void => {
    if (withinPh) {
        lines.push(
            localizeStr(lang, {
                en: 'pH is within the target range.',
                de: 'pH liegt im Zielbereich.',
                es: 'pH dentro del rango objetivo.',
                fr: 'pH dans la plage cible.',
                nl: 'pH binnen het doelbereik.',
            }),
        )
        return
    }

    if (context.currentPh < context.optimalRange.phMin) {
        lines.push(
            localizeStr(lang, {
                en: `pH is too low. Raise it gently so the root zone moves back into ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
                de: `pH ist zu niedrig. Leicht anheben, damit die Wurzelzone wieder in den Bereich ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)} kommt.`,
                es: `pH demasiado bajo. Subir suavemente para que la zona radicular vuelva a ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
                fr: `pH trop bas. L'augmenter doucement pour que la zone racinaire revienne dans ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
                nl: `pH te laag. Voorzichtig verhogen zodat de wortelzone terugkeert naar ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
            }),
        )
        return
    }

    lines.push(
        localizeStr(lang, {
            en: 'pH is too high. Lower it gently so nutrients become available again.',
            de: 'pH ist zu hoch. Sanft senken, damit N\u00e4hrstoffe wieder sauber verf\u00fcgbar werden.',
            es: 'pH demasiado alto. Bajar suavemente para que los nutrientes vuelvan a estar disponibles.',
            fr: 'pH trop eleve. Le baisser doucement pour que les nutriments redeviennent disponibles.',
            nl: 'pH te hoog. Voorzichtig verlagen zodat voedingsstoffen weer beschikbaar worden.',
        }),
    )
}

const appendLatestReadingLine = (
    lines: string[],
    context: NutrientRecommendationContext,
    lang: Language,
): void => {
    if (context.readings.length === 0) {
        return
    }

    const latest = context.readings.toSorted((left, right) => right.timestamp - left.timestamp)[0]
    if (!latest) {
        return
    }

    lines.push(
        localizeStr(lang, {
            en: `Latest reading (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`,
            de: `Letzte Messung (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`,
            es: `Ultima lectura (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`,
            fr: `Derniere mesure (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`,
            nl: `Laatste meting (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`,
        }),
    )
}

const appendPlantStatusLine = (
    lines: string[],
    context: NutrientRecommendationContext,
    lang: Language,
): void => {
    if (!context.plant) {
        return
    }

    lines.push(
        localizeStr(lang, {
            en: `Plant: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} days old, health ${context.plant.health.toFixed(0)}%.`,
            de: `Pflanze: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} Tage, Gesundheit ${context.plant.health.toFixed(0)}%.`,
            es: `Planta: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} dias, salud ${context.plant.health.toFixed(0)}%.`,
            fr: `Plante: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} jours, sante ${context.plant.health.toFixed(0)}%.`,
            nl: `Plant: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} dagen, gezondheid ${context.plant.health.toFixed(0)}%.`,
        }),
    )
}

export const buildNutrientRecommendation = (
    context: NutrientRecommendationContext,
    lang: Language,
): string => {
    const withinEc =
        context.currentEc >= context.optimalRange.ecMin &&
        context.currentEc <= context.optimalRange.ecMax
    const withinPh =
        context.currentPh >= context.optimalRange.phMin &&
        context.currentPh <= context.optimalRange.phMax
    const plantLabel = resolveNutrientPlantLabel(context, lang)

    const lines: string[] = [
        localizeStr(lang, {
            en: `Local nutrient plan for ${plantLabel}.`,
            de: `Lokaler N\u00e4hrstoffplan f\u00fcr ${plantLabel}.`,
            es: `Plan de nutrientes local para ${plantLabel}.`,
            fr: `Plan nutritif local pour ${plantLabel}.`,
            nl: `Lokaal voedingsplan voor ${plantLabel}.`,
        }),
        localizeStr(lang, {
            en: `Current values: EC ${context.currentEc.toFixed(2)} against target ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} against target ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
            de: `Aktuell: EC ${context.currentEc.toFixed(2)} bei Ziel ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} bei Ziel ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
            es: `Valores actuales: EC ${context.currentEc.toFixed(2)} vs objetivo ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} vs objetivo ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
            fr: `Valeurs actuelles: EC ${context.currentEc.toFixed(2)} vs cible ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} vs cible ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
            nl: `Huidige waarden: EC ${context.currentEc.toFixed(2)} vs doel ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} vs doel ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
        }),
    ]

    appendEcRecommendationLine(lines, context, lang, withinEc)

    appendPhRecommendationLine(lines, context, lang, withinPh)

    const trend = summarizeTrend(context, lang)
    if (trend) {
        lines.push(trend)
    }

    appendLatestReadingLine(lines, context, lang)
    appendPlantStatusLine(lines, context, lang)

    lines.push(mediumAdvice(context.medium, lang))
    lines.push(
        localizeStr(lang, {
            en: 'Next step: change only one variable per round and record the plant response.',
            de: 'N\u00e4chster Schritt: nur eine Variable pro Runde \u00e4ndern und die Reaktion protokollieren.',
            es: 'Siguiente paso: cambiar solo una variable por ronda y registrar la respuesta de la planta.',
            fr: 'Prochaine etape: changer une seule variable par tour et enregistrer la reponse de la plante.',
            nl: 'Volgende stap: verander slechts een variabele per ronde en registreer de plantreactie.',
        }),
    )

    return lines.join('\n')
}
