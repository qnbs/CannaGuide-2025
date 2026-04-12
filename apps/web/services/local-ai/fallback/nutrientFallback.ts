// ---------------------------------------------------------------------------
// nutrientFallback.ts -- Heuristic nutrient recommendation builder
// ---------------------------------------------------------------------------
// Extracted from fallbackService.ts to isolate nutrient domain logic.
// ---------------------------------------------------------------------------

import type { Language } from '@/types'
import type { NutrientContext } from '@/types/aiProvider'

type NutrientRecommendationContext = NutrientContext

const isGerman = (lang: Language): boolean => lang === 'de'

const mediumAdvice = (medium: string, lang: Language): string => {
    const normalized = medium.toLowerCase()
    if (normalized.includes('coco')) {
        return isGerman(lang)
            ? 'Coco reagiert schnell. Kleine Korrekturen und engmaschige Kontrollen sind hier sinnvoll.'
            : 'Coco reacts quickly. Small corrections and frequent checks make the most sense here.'
    }
    if (normalized.includes('hydro')) {
        return isGerman(lang)
            ? 'Hydro ben\u00f6tigt die engste Kontrolle. \u00c4nderungen in kleinen Schritten vornehmen und die Werte t\u00e4glich pr\u00fcfen.'
            : 'Hydro needs the tightest control. Make changes in small steps and verify values daily.'
    }
    return isGerman(lang)
        ? 'Erde verzeiht etwas mehr. Sanfte Anpassungen und langsames Nachregeln sind meistens die beste Wahl.'
        : 'Soil is more forgiving. Gentle adjustments and slower corrections are usually the best choice.'
}

const TREND_THRESHOLD = 0.15

const formatTrendChange = (nutrient: string, delta: number, lang: Language): string => {
    const label = Math.abs(delta).toFixed(2)
    if (isGerman(lang)) {
        const direction = delta > 0 ? 'steigt' : 'f\u00e4llt'
        return `${nutrient} ${direction} \u00fcber die letzten Messungen um ${label}.`
    }
    const direction = delta > 0 ? 'risen' : 'fallen'
    return `${nutrient} has ${direction} by ${label} across the recent readings.`
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

    return isGerman(lang) ? 'ohne ausgew\u00e4hlte Pflanze' : 'without a selected plant'
}

const appendEcRecommendationLine = (
    lines: string[],
    context: NutrientRecommendationContext,
    lang: Language,
    withinEc: boolean,
): void => {
    if (withinEc) {
        lines.push(
            isGerman(lang)
                ? 'EC liegt im Sollbereich. Die F\u00fctterung kann stabil bleiben.'
                : 'EC is within target. Keep the feed strength steady for now.',
        )
        return
    }

    if (context.currentEc < context.optimalRange.ecMin) {
        const stepLabel = context.medium.toLowerCase().includes('hydro')
            ? isGerman(lang)
                ? 'kleinen'
                : 'small'
            : isGerman(lang)
              ? 'moderaten'
              : 'moderate'

        lines.push(
            isGerman(lang)
                ? `EC ist zu niedrig. Die n\u00e4chste Gabe leicht anheben und in ${stepLabel} Schritten auf ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} bringen.`
                : `EC is too low. Increase the next feed slightly and move back toward ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)} in ${stepLabel} steps.`,
        )
        return
    }

    lines.push(
        isGerman(lang)
            ? 'EC ist zu hoch. Die Mischung etwas verd\u00fcnnen oder eine Bew\u00e4sserung mit klarem Wasser einplanen.'
            : 'EC is too high. Dilute the mix a bit or plan a plain-water irrigation.',
    )
}

const appendPhRecommendationLine = (
    lines: string[],
    context: NutrientRecommendationContext,
    lang: Language,
    withinPh: boolean,
): void => {
    if (withinPh) {
        lines.push(isGerman(lang) ? 'pH liegt im Zielbereich.' : 'pH is within the target range.')
        return
    }

    if (context.currentPh < context.optimalRange.phMin) {
        lines.push(
            isGerman(lang)
                ? `pH ist zu niedrig. Leicht anheben, damit die Wurzelzone wieder in den Bereich ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)} kommt.`
                : `pH is too low. Raise it gently so the root zone moves back into ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
        )
        return
    }

    lines.push(
        isGerman(lang)
            ? 'pH ist zu hoch. Sanft senken, damit N\u00e4hrstoffe wieder sauber verf\u00fcgbar werden.'
            : 'pH is too high. Lower it gently so nutrients become available again.',
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
        isGerman(lang)
            ? `Letzte Messung (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`
            : `Latest reading (${latest.readingType}): EC ${latest.ec.toFixed(2)}, pH ${latest.ph.toFixed(2)}.`,
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
        isGerman(lang)
            ? `Pflanze: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} Tage, Gesundheit ${context.plant.health.toFixed(0)}%.`
            : `Plant: ${context.plant.name}, ${context.plant.stage}, ${context.plant.age} days old, health ${context.plant.health.toFixed(0)}%.`,
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
        isGerman(lang)
            ? `Lokaler N\u00e4hrstoffplan f\u00fcr ${plantLabel}.`
            : `Local nutrient plan for ${plantLabel}.`,
        isGerman(lang)
            ? `Aktuell: EC ${context.currentEc.toFixed(2)} bei Ziel ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} bei Ziel ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`
            : `Current values: EC ${context.currentEc.toFixed(2)} against target ${context.optimalRange.ecMin.toFixed(2)}-${context.optimalRange.ecMax.toFixed(2)}, pH ${context.currentPh.toFixed(2)} against target ${context.optimalRange.phMin.toFixed(2)}-${context.optimalRange.phMax.toFixed(2)}.`,
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
        isGerman(lang)
            ? 'N\u00e4chster Schritt: nur eine Variable pro Runde \u00e4ndern und die Reaktion protokollieren.'
            : 'Next step: change only one variable per round and record the plant response.',
    )

    return lines.join('\n')
}
