/**
 * Domain-specific prompt builders for GeminiService (diagnosis, mentor, nutrients, garden).
 */
import { isTopicRelevant, sanitizeForPrompt } from '@/services/ai/safetyPipeline'
import {
    createLocalizedPrompt,
    formatPlantContextForPrompt,
    summarizeJournalForPrompt,
} from '@/services/ai/geminiPromptUtils'
import { getEducationalUseOnlyInstruction } from '@/services/ai/geminiRuntime'
import type { Language, Plant, Strain } from '@/types'
import { getT } from '@/i18n'
import { growLogRagService } from '@/services/growLogRagService'

export type NutrientRecommendationInput = {
    medium: string
    stage: string
    currentEc: number
    currentPh: number
    optimalRange: { ecMin: number; ecMax: number; phMin: number; phMax: number }
    readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>
    plant?:
        | {
              name: string
              strain: { name: string }
              stage: string
              age: number
              health: number
              medium: { ph: number; ec: number }
          }
        | undefined
}

export const buildDiagnosePlantProblemsSummary = (
    plant: Plant,
    t: ReturnType<typeof getT>,
): string => {
    if (plant.problems.length === 0) {
        return t('common.none')
    }
    return plant.problems
        .map((problem) => {
            const problemKey = problem.type
                .toLowerCase()
                .replaceAll(/_(\w)/g, (_: string, c: string) => c.toUpperCase())
            return t(`problemMessages.${problemKey}.message`)
        })
        .join(', ')
}

export const buildDiagnosePlantContext = (
    plant: Plant,
    userNotes: string,
    t: ReturnType<typeof getT>,
    growName?: string,
): string => {
    const problems = buildDiagnosePlantProblemsSummary(plant, t)
    const growLine = growName ? `\n- Grow: "${growName}"` : ''
    return `
PLANT CONTEXT:${growLine}
- Strain: ${plant.strain.name} (${plant.strain.type})
- Age: ${plant.age} days (Stage: ${t(`plantStages.${plant.stage}`)})
- Active Issues: ${problems}
- Medium Vitals: pH ${plant.medium.ph.toFixed(2)}, EC ${plant.medium.ec.toFixed(2)}
- Environment Vitals: Temp ${plant.environment.internalTemperature.toFixed(1)}°C, Humidity ${plant.environment.internalHumidity.toFixed(1)}%
- USER NOTES: "${sanitizeForPrompt(userNotes || 'None provided', 400)}"
        `.trim()
}

const buildNutrientReadingsSummary = (
    readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>,
): string => {
    if (readings.length === 0) {
        return 'No recent readings.'
    }
    return readings
        .map(
            (reading) =>
                `EC=${reading.ec.toFixed(2)} pH=${reading.ph.toFixed(2)} (${reading.readingType})`,
        )
        .join('; ')
}

const buildNutrientPlantInfo = (context: {
    plant?: NutrientRecommendationInput['plant']
}): string => {
    if (!context.plant) {
        return 'No specific plant selected.'
    }
    return `Plant: ${context.plant.name} (${context.plant.strain.name}), Stage: ${context.plant.stage}, Age: ${context.plant.age}d, Health: ${context.plant.health.toFixed(0)}%, Live pH: ${context.plant.medium.ph.toFixed(2)}, Live EC: ${context.plant.medium.ec.toFixed(2)}`
}

export const buildNutrientPlannerPrompt = (
    context: NutrientRecommendationInput,
    t: ReturnType<typeof getT>,
): string => {
    const readingsSummary = buildNutrientReadingsSummary(context.readings)
    const plantInfo = buildNutrientPlantInfo(context)
    return `${t('ai.prompts.nutrientPlanner', {
        medium: context.medium,
        stage: context.stage,
        currentEc: context.currentEc.toFixed(2),
        currentPh: context.currentPh.toFixed(2),
        ecMin: context.optimalRange.ecMin.toFixed(2),
        ecMax: context.optimalRange.ecMax.toFixed(2),
        phMin: context.optimalRange.phMin.toFixed(2),
        phMax: context.optimalRange.phMax.toFixed(2),
        readings: readingsSummary,
        plant: plantInfo,
    })}`
}

export const buildPlantJournalContext = (plant: Plant, t: ReturnType<typeof getT>): string => {
    const translate = (key: string, options?: Record<string, unknown> | undefined): string =>
        t(key, options ?? {})
    return `${formatPlantContextForPrompt(plant, translate)}\n\nJOURNAL SUMMARY\n---------------\n${summarizeJournalForPrompt(plant.journal)}`
}

export const buildLocalizedEducationalPrompt = (prompt: string, lang: Language): string =>
    createLocalizedPrompt(`${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`, lang)

export const buildMentorPrompt = async (
    plant: Plant,
    query: string,
    t: ReturnType<typeof getT>,
    growId?: string,
    growName?: string,
): Promise<{ prompt: string; ragContext: string }> => {
    const plantContext = buildPlantJournalContext(plant, t)
    let ragContext: string
    try {
        if (growId) {
            ragContext = await growLogRagService.retrieveSemanticContextForGrow(
                [plant],
                query,
                growId,
            )
        } else {
            ragContext = await growLogRagService.retrieveSemanticContext([plant], query)
        }
    } catch {
        if (growId) {
            ragContext = growLogRagService.retrieveRelevantContextForGrow([plant], query, growId)
        } else {
            ragContext = growLogRagService.retrieveRelevantContext([plant], query)
        }
    }
    const sanitizedQuery = sanitizeForPrompt(query, 600)
    const topicGuard = isTopicRelevant(sanitizedQuery)
        ? ''
        : '\nIMPORTANT: The user query may be off-topic. Politely redirect them to cannabis cultivation topics.\n'
    const growContext = growName ? `\n\nGROW CONTEXT\n- Grow: "${growName}"` : ''
    const prompt = t('ai.prompts.mentor.main', {
        context: `${plantContext}${growContext}\n\nRELEVANT GROW LOG CONTEXT\n-------------------------\n${ragContext}${topicGuard}`,
        query: sanitizedQuery,
    })
    return { prompt, ragContext }
}

export const buildStrainTipsLocalizedPrompt = (
    strain: Strain,
    context: { focus: string; stage: string; experienceLevel: string },
    lang: Language,
    t: ReturnType<typeof getT>,
): string => {
    const prompt = t('ai.prompts.strainTips', {
        strain: JSON.stringify(strain),
        focus: context.focus,
        stage: context.stage,
        experienceLevel: context.experienceLevel,
    })
    return buildLocalizedEducationalPrompt(prompt, lang)
}

export const buildGardenPlantSummaries = (plants: Plant[], t: ReturnType<typeof getT>): string =>
    plants
        .map((plant) => {
            const problemsSummary =
                plant.problems.length > 0
                    ? plant.problems.map((problem) => problem.type).join(', ')
                    : 'None'
            return `- ${plant.name} (${t('plantsView.plantCard.day')} ${plant.age}, ${t(`plantStages.${plant.stage}`)}): Health ${plant.health.toFixed(0)}%, Stress ${plant.stressLevel.toFixed(0)}%. Problems: ${problemsSummary}`
        })
        .join('\n')

export const buildGrowLogRagPrompt = async (plants: Plant[], query: string): Promise<string> => {
    let ragContext: string
    try {
        ragContext = await growLogRagService.retrieveSemanticContext(plants, query)
    } catch {
        ragContext = growLogRagService.retrieveRelevantContext(plants, query)
    }
    const safeQuery = sanitizeForPrompt(query, 600)
    const topicGuard = isTopicRelevant(safeQuery)
        ? ''
        : '\nNote: The query may be off-topic for cannabis cultivation. Politely redirect.\n'
    return `Answer the question using only the provided grow-log context.\n\nQuestion:\n${safeQuery}\n\nGrow-log context:\n${ragContext}${topicGuard}\n\nIf information is uncertain, explicitly say so.`
}

export const mapDynamicLoadingMessages = (messagesResult: unknown): string[] => {
    if (
        typeof messagesResult === 'object' &&
        messagesResult !== null &&
        !Array.isArray(messagesResult)
    ) {
        return Object.values(messagesResult).map(String)
    }
    if (Array.isArray(messagesResult)) {
        return messagesResult.map(String)
    }
    return [String(messagesResult)]
}
