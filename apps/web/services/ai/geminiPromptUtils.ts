/**
 * Gemini prompt building helpers (plant context, i18n, truncation).
 */
import type { JournalEntry, Language, Plant } from '@/types'
import { sanitizeForPrompt } from '@/services/ai/safetyPipeline'

export const MAX_PROMPT_CHARS = 12_000
export const MAX_OUTPUT_TOKENS_TEXT = 900
export const MAX_OUTPUT_TOKENS_JSON = 1400

const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    nl: 'Dutch',
}

export const formatPlantContextForPrompt = (
    plant: Plant,
    t: (key: string, options?: Record<string, unknown> | undefined) => string,
): string => {
    const stageDetails = t(`plantStages.${plant.stage}`)
    const problems =
        plant.problems.length > 0
            ? plant.problems
                  .map((p) => {
                      const problemKey = p.type
                          .toLowerCase()
                          .replaceAll(/_(\w)/g, (_: string, c: string) => c.toUpperCase())
                      return t(`problemMessages.${problemKey}.message`)
                  })
                  .join(', ')
            : t('common.none')

    return `
PLANT CONTEXT REPORT
====================
Name: ${plant.name} (${plant.strain.name})
Age: ${plant.age} days
Stage: ${stageDetails}
Health: ${plant.health.toFixed(1)}%
Stress Level: ${plant.stressLevel.toFixed(1)}%

ENVIRONMENT
-----------
Temperature: ${plant.environment.internalTemperature.toFixed(1)}°C
Humidity: ${plant.environment.internalHumidity.toFixed(1)}%
VPD: ${plant.environment.vpd.toFixed(2)} kPa
CO2 Level: ${plant.environment.co2Level.toFixed(0)} ppm

MEDIUM & ROOTS
-----------------
pH: ${plant.medium.ph.toFixed(2)}
EC: ${plant.medium.ec.toFixed(2)}
Moisture: ${plant.medium.moisture.toFixed(1)}%
Root Health: ${plant.rootSystem.health.toFixed(1)}%

ACTIVE ISSUES
-------------
${problems}
    `.trim()
}

export const createLocalizedPrompt = (basePrompt: string, lang: Language): string => {
    const languageInstruction: Record<Language, string> = {
        en: 'IMPORTANT: Your entire response must be exclusively in English (en-US).',
        de: 'WICHTIG: Deine gesamte Antwort muss ausschliesslich auf Deutsch (de-DE) sein.',
        es: 'IMPORTANTE: Toda tu respuesta debe ser exclusivamente en espanol (es-ES).',
        fr: 'IMPORTANT: Toute ta reponse doit etre exclusivement en francais (fr-FR).',
        nl: 'BELANGRIJK: Je volledige antwoord moet uitsluitend in het Nederlands (nl-NL) zijn.',
    }
    const constraint = `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}. Do not use any other language.`

    return `${languageInstruction[lang] ?? languageInstruction['en']}\n${constraint}\n\n${basePrompt}`
}

export const truncatePromptForModel = (prompt: string, maxChars = MAX_PROMPT_CHARS): string => {
    if (prompt.length <= maxChars) {
        return prompt
    }

    const head = prompt.slice(0, Math.floor(maxChars * 0.7))
    const tail = prompt.slice(-Math.floor(maxChars * 0.3))
    return `${head}\n\n[...context truncated to fit token window...]\n\n${tail}`
}

export const summarizeJournalForPrompt = (journal: JournalEntry[], maxRecent = 10): string => {
    if (!journal || journal.length === 0) {
        return 'No journal entries available.'
    }

    const byType = journal.reduce<Record<string, number>>((acc, entry) => {
        acc[entry.type] = (acc[entry.type] ?? 0) + 1
        return acc
    }, {})

    const typeSummary = Object.entries(byType)
        .map(([type, count]) => `${type}: ${count}`)
        .join(', ')

    const recentEntries = journal
        .slice(-maxRecent)
        .map(
            (entry) =>
                `- day=${new Date(entry.createdAt).toISOString()} type=${entry.type} notes=${sanitizeForPrompt(entry.notes, 140)}`,
        )
        .join('\n')

    return `Total entries: ${journal.length}\nBy type: ${typeSummary}\nRecent entries:\n${recentEntries}`
}

export const createCompactPlantSnapshot = (plant: Plant) => ({
    id: plant.id,
    name: plant.name,
    strain: {
        id: plant.strain.id,
        name: plant.strain.name,
        type: plant.strain.type,
        thc: plant.strain.thc,
        cbd: plant.strain.cbd,
    },
    stage: plant.stage,
    age: plant.age,
    health: plant.health,
    stressLevel: plant.stressLevel,
    mediumType: plant.mediumType,
    vitals: {
        temp: plant.environment.internalTemperature,
        humidity: plant.environment.internalHumidity,
        vpd: plant.environment.vpd,
        ph: plant.medium.ph,
        ec: plant.medium.ec,
        moisture: plant.medium.moisture,
        rootHealth: plant.rootSystem.health,
    },
    activeProblems: plant.problems
        .filter((p) => p.status === 'active')
        .map((p) => ({ type: p.type, severity: p.severity })),
    recentHistory: plant.history.slice(-20),
    journalSummary: summarizeJournalForPrompt(plant.journal, 8),
})
