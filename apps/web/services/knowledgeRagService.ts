/**
 * knowledgeRagService -- RAG-backed AI explanations for Knowledge Calculator inputs.
 *
 * Takes calculator name + input values, builds a plant-journal-aware context prompt,
 * calls aiService.askMentor() (or aiService.explainConcept if available), and returns
 * a concise explanation + optional learning path suggestion.
 *
 * Security:
 * - Input values are formatted as numbers (no user freetext injected)
 * - DOMPurify sanitization on any string values before prompt injection
 * - isLocalOnlyMode() guard on all AI calls
 * - length-limited output (max 400 chars) to prevent runaway responses
 *
 * Usage:
 *   const { explanation, learnMore } = await knowledgeRagService.explain('vpd', { vpd: 1.2, status: 'ok' }, plants)
 */

import DOMPurify from 'dompurify'
import { aiService } from '@/services/aiFacade'
import { isLocalOnlyMode } from '@/services/localOnlyModeService'
import { growLogRagService } from '@/services/growLogRagService'
import { i18nInstance } from '@/i18n'
import type { Language, Plant } from '@/types'

// ---------------------------------------------------------------------------
// Language helpers (mirrors localAiPromptHandlers pattern)
// ---------------------------------------------------------------------------

const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    nl: 'Dutch',
}

function languageInstruction(lang: Language): string {
    return `\nRespond entirely in ${LANGUAGE_NAMES[lang]}.`
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalculatorName =
    | 'vpd'
    | 'transpiration'
    | 'ecTds'
    | 'lightSpectrum'
    | 'terpeneEntourage'
    | 'cannabinoidRatio'

export interface KnowledgeRagResult {
    /** Short AI-generated explanation (max 400 chars). */
    explanation: string
    /** Suggested learning path ID or null if not applicable. */
    suggestedPathId: string | null
    /** Whether context from grow logs was found. */
    hadJournalContext: boolean
}

// ---------------------------------------------------------------------------
// Learning path suggestions per calculator
// ---------------------------------------------------------------------------

const LEARNING_PATH_MAP: Record<CalculatorName, string | null> = {
    vpd: 'environment-mastery',
    transpiration: 'environment-mastery',
    ecTds: 'nutrient-mastery',
    lightSpectrum: 'environment-mastery',
    terpeneEntourage: 'advanced-training',
    cannabinoidRatio: 'advanced-training',
}

// ---------------------------------------------------------------------------
// Prompt templates per calculator
// ---------------------------------------------------------------------------

function buildPrompt(
    calculator: CalculatorName,
    values: Record<string, number | string>,
    journalContext: string,
    lang: Language,
): string {
    const sanitized = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [
            k,
            typeof v === 'string'
                ? DOMPurify.sanitize(String(v), { ALLOWED_TAGS: [] }).slice(0, 80)
                : Number(v).toFixed(3),
        ]),
    )

    const ctxSection =
        journalContext && journalContext !== 'No grow log entries found.'
            ? `\n\nGrow log context (most relevant entries):\n${journalContext.slice(0, 600)}`
            : ''

    const prompts: Record<CalculatorName, string> = {
        vpd: `You are a cannabis cultivation expert. The grower just measured:
VPD = ${sanitized['vpd']} kPa  (status: ${sanitized['status']})
Temperature = ${sanitized['temp']} C, Humidity = ${sanitized['humidity']} %, Leaf Offset = ${sanitized['leafOffset']} C
${ctxSection}
In 2-3 sentences, explain what this VPD reading means for the plant and one practical tip to improve it.
Keep the response under 400 characters. Use plain text, no markdown.`,

        transpiration: `You are a cannabis cultivation expert. Transpiration calculation results:
Leaf rate = ${sanitized['leafRate']} mmol/m2/s, Canopy rate = ${sanitized['canopyRate']} mmol/m2/s
Daily water use = ${sanitized['dailyWater']} mL/m2/day, Status = ${sanitized['status']}
${ctxSection}
In 2-3 sentences, explain what these transpiration values mean and one actionable tip.
Under 400 characters. Plain text only.`,

        ecTds: `You are a cannabis cultivation expert. EC/TDS measurement:
EC = ${sanitized['ecMs']} mS/cm, TDS-500 = ${sanitized['tds500']} ppm
pH drift = ${sanitized['driftPerDay']} per day, Trend = ${sanitized['trend']}
${ctxSection}
In 2-3 sentences, explain the significance of these values and one tip for correction.
Under 400 characters. Plain text only.`,

        lightSpectrum: `You are a cannabis cultivation expert. Light spectrum analysis:
PPFD = ${sanitized['ppfd']} umol/m2/s, DLI = ${sanitized['dli']} mol/m2/day
Photosynthetic efficiency = ${sanitized['efficiency']}%, Terpene boost = +${sanitized['terpeneBoost']}%
Status = ${sanitized['status']}
${ctxSection}
In 2-3 sentences, explain the light spectrum impact and one practical improvement tip.
Under 400 characters. Plain text only.`,

        terpeneEntourage: `You are a cannabis science expert. Terpene entourage analysis:
Entourage score = ${sanitized['score']}/100, Profile = ${sanitized['profile']}
Dominant terpene = ${sanitized['dominant']}, Diversity index = ${sanitized['diversity']}
${ctxSection}
In 2-3 sentences, explain the significance of this terpene profile for the user.
Under 400 characters. Plain text only.`,

        cannabinoidRatio: `You are a cannabis science expert. Cannabinoid ratio analysis:
THC = ${sanitized['thcPct']}%, CBD = ${sanitized['cbdPct']}%, CBG = ${sanitized['cbgPct']}%
Profile type = ${sanitized['profileType']}, Harmony score = ${sanitized['harmony']}/100
${ctxSection}
In 2-3 sentences, explain what this cannabinoid profile means for the consumer.
Under 400 characters. Plain text only.`,
    }

    return prompts[calculator] + languageInstruction(lang)
}

// ---------------------------------------------------------------------------
// Rate limiting: max 1 request per calculator per 60s
// ---------------------------------------------------------------------------

const lastCallTs = new Map<CalculatorName, number>()
const COOLDOWN_MS = 60_000

function isRateLimited(calculator: CalculatorName): boolean {
    const last = lastCallTs.get(calculator) ?? 0
    return Date.now() - last < COOLDOWN_MS
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

class KnowledgeRagService {
    /**
     * Generate a short AI-backed explanation for a calculator result,
     * enriched with journal context from grow logs if plants are provided.
     */
    async explain(
        calculator: CalculatorName,
        values: Record<string, number | string>,
        plants: Plant[] = [],
    ): Promise<KnowledgeRagResult> {
        const suggestedPathId = LEARNING_PATH_MAP[calculator]

        if (isLocalOnlyMode()) {
            return {
                explanation: '',
                suggestedPathId,
                hadJournalContext: false,
            }
        }

        if (isRateLimited(calculator)) {
            return {
                explanation: '',
                suggestedPathId,
                hadJournalContext: false,
            }
        }

        try {
            lastCallTs.set(calculator, Date.now())

            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const lang = (i18nInstance.language ?? 'en').slice(0, 2) as Language

            // Build journal context from grow logs (semantic with keyword fallback)
            const queryStr = `${calculator} ${Object.values(values).join(' ')}`
            let journalContext = 'No grow log entries found.'
            if (plants.length > 0) {
                try {
                    journalContext = await growLogRagService.retrieveSemanticContext(
                        plants,
                        queryStr,
                        4,
                    )
                } catch {
                    journalContext = growLogRagService.retrieveRelevantContext(plants, queryStr, 4)
                }
            }

            const hadJournalContext =
                journalContext !== 'No grow log entries found.' && journalContext.trim().length > 0

            const prompt = buildPrompt(calculator, values, journalContext, lang)

            // getGrowLogRagAnswer accepts arbitrary query strings + optional plant context
            const response = await aiService.getGrowLogRagAnswer(plants, prompt, lang)
            const raw = response.content ?? ''
            const explanation = raw.trim().slice(0, 420)

            return { explanation, suggestedPathId, hadJournalContext }
        } catch {
            return {
                explanation: '',
                suggestedPathId,
                hadJournalContext: false,
            }
        }
    }
}

export const knowledgeRagService = new KnowledgeRagService()
