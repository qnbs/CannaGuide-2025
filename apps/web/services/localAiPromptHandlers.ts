// ---------------------------------------------------------------------------
// localAiPromptHandlers.ts -- High-level prompt builders & response parsers
// ---------------------------------------------------------------------------
// Extracted from localAI.ts to keep the orchestrator lean.
// Every handler receives a `generateText` callback (DI) so the orchestrator
// remains the single owner of model pipeline management.
// ---------------------------------------------------------------------------

import DOMPurify from 'dompurify'
import type {
    AIResponse,
    DeepDiveGuide,
    Language,
    MentorMessage,
    Plant,
    Recommendation,
    Strain,
    StructuredGrowTips,
} from '@/types'
import type { ImageStyle } from '@/types/aiProvider'
import {
    AIResponseSchema,
    DeepDiveGuideSchema,
    MentorMessageContentSchema,
    RecommendationSchema,
    StructuredGrowTipsSchema,
} from '@/types/schemas'
import { localAiFallbackService } from '@/services/localAiFallbackService'
import { captureLocalAiError } from '@/services/sentryService'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

type GenerateText = (prompt: string) => Promise<string | null>

const isGerman = (lang: Language): boolean => lang === 'de'

const localized = (lang: Language, de: string, en: string): string => (isGerman(lang) ? de : en)

const sanitizeText = (value: string): string =>
    DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()

const summarizePlant = (plant: Plant): string =>
    `${sanitizeText(plant.name)} | ${sanitizeText(plant.strain.name)} | stage=${plant.stage} | health=${plant.health.toFixed(0)} | stress=${plant.stressLevel.toFixed(0)} | vpd=${plant.environment.vpd.toFixed(2)} | ph=${plant.medium.ph.toFixed(2)} | ec=${plant.medium.ec.toFixed(2)}`

const formatJsonPrompt = (sections: string[]): string => sections.join('\n\n')

const parseJsonSafely = <T>(schema: z.ZodType<T>, value: string): T | null => {
    try {
        const parsed: unknown = JSON.parse(value)
        return schema.parse(parsed)
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// Equipment recommendation
// ---------------------------------------------------------------------------

export async function handleEquipmentRecommendation(
    prompt: string,
    lang: Language,
    generateText: GenerateText,
): Promise<Recommendation> {
    const sanitizedPrompt = sanitizeText(prompt)
    const instruction = localized(
        lang,
        'Erstelle eine strukturierte Ausruestungsempfehlung auf Deutsch.',
        'Create a structured equipment recommendation in English.',
    )
    const generated = await generateText(
        `${instruction}
Prompt: ${sanitizedPrompt}
Return ONLY valid JSON with this exact shape: {"tent":{"name":"...","price":0,"rationale":"..."},"light":{"name":"...","price":0,"rationale":"...","watts":0},"ventilation":{"name":"...","price":0,"rationale":"..."},"circulationFan":{"name":"...","price":0,"rationale":"..."},"pots":{"name":"...","price":0,"rationale":"..."},"soil":{"name":"...","price":0,"rationale":"..."},"nutrients":{"name":"...","price":0,"rationale":"..."},"extra":{"name":"...","price":0,"rationale":"..."},"proTip":"..."}`,
    )

    if (!generated) {
        return localAiFallbackService.getEquipmentRecommendation(sanitizedPrompt, lang)
    }

    const parsed = parseJsonSafely(RecommendationSchema, generated)
    if (!parsed) {
        return localAiFallbackService.getEquipmentRecommendation(sanitizedPrompt, lang)
    }

    return parsed
}

// ---------------------------------------------------------------------------
// Nutrient recommendation
// ---------------------------------------------------------------------------

export async function handleNutrientRecommendation(
    context: {
        medium: string
        stage: string
        currentEc: number
        currentPh: number
        optimalRange: { ecMin: number; ecMax: number; phMin: number; phMax: number }
        readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>
        plant?: {
            name: string
            strain: { name: string }
            stage: string
            age: number
            health: number
            medium: { ph: number; ec: number }
        }
    },
    lang: Language,
    generateText: GenerateText,
): Promise<string> {
    const instruction = localized(
        lang,
        'Erstelle eine kompakte Naehrstoff-Empfehlung auf Deutsch.',
        'Create a compact nutrient recommendation in English.',
    )
    const generated = await generateText(
        `${instruction}
Context: ${sanitizeText(JSON.stringify(context))}
Return a concise plain-text answer with practical next steps, EC/pH guidance, and one medium-specific note. Do not use HTML.`,
    )

    if (generated && generated.trim().length > 0) {
        return sanitizeText(generated)
    }

    return localAiFallbackService.getNutrientRecommendation(context, lang)
}

// ---------------------------------------------------------------------------
// Strain image generation
// ---------------------------------------------------------------------------

export async function handleStrainImageGeneration(
    strain: Strain,
    style: ImageStyle,
    criteria: { focus: string; composition: string; mood: string },
    lang: Language = 'en',
): Promise<string> {
    try {
        const { checkImageGenCapability, generateStrainImageLocal } =
            await import('./imageGenerationService')
        const capability = checkImageGenCapability()
        if (capability.supported) {
            const result = await generateStrainImageLocal({
                id: `strain-${strain.id}-${Date.now()}`,
                strain,
                style,
                criteria,
                lang: lang === 'de' ? 'de' : 'en',
            })
            return result.dataUrl
        }
    } catch (error) {
        captureLocalAiError(error, { model: 'sd-turbo', stage: 'image-generation-local' })
        console.debug('[LocalAI] SD-Turbo image generation failed, falling back to SVG.')
    }
    return localAiFallbackService.generateStrainImage(strain, style, criteria, lang)
}

// ---------------------------------------------------------------------------
// Mentor response
// ---------------------------------------------------------------------------

function buildMentorPrompt(
    plant: Plant,
    query: string,
    ragContext: string,
    lang: Language,
): string {
    const instruction = isGerman(lang)
        ? 'Antworte als CannaGuide AI auf Deutsch, sachlich, strukturiert und ohne HTML.'
        : 'Answer as CannaGuide AI in English, structured, factual, and without HTML.'

    return formatJsonPrompt([
        instruction,
        `Plant: ${summarizePlant(plant)}`,
        `Context: ${sanitizeText(ragContext)}`,
        `Question: ${sanitizeText(query)}`,
        'Return ONLY valid JSON with this exact shape:',
        '{"title":"...","content":"...","uiHighlights":[]}',
    ])
}

export async function handleMentorResponse(
    plant: Plant,
    query: string,
    lang: Language,
    ragContext: string,
    generateText: GenerateText,
): Promise<Omit<MentorMessage, 'role'>> {
    const prompt = buildMentorPrompt(plant, query, ragContext, lang)
    const generated = await generateText(prompt)
    const fallback = (): Omit<MentorMessage, 'role'> =>
        localAiFallbackService.getMentorResponse(plant, query, ragContext, lang)

    if (!generated) {
        return fallback()
    }

    const parsed = parseJsonSafely(MentorMessageContentSchema, generated)
    if (!parsed) {
        return fallback()
    }

    return parsed
}

// ---------------------------------------------------------------------------
// Plant advice / proactive diagnosis
// ---------------------------------------------------------------------------

export async function handlePlantAdvice(
    plant: Plant,
    lang: Language,
    generateText: GenerateText,
): Promise<AIResponse> {
    const instruction = localized(
        lang,
        'Fasse die Pflanzenlage knapp auf Deutsch zusammen.',
        'Summarize the plant status succinctly in English.',
    )
    const generated = await generateText(`${instruction}\n${summarizePlant(plant)}`)
    if (!generated) {
        return localAiFallbackService.getPlantAdvice(plant, lang)
    }
    const parsed = parseJsonSafely(AIResponseSchema, generated)
    if (!parsed) {
        return {
            title: isGerman(lang)
                ? `Lokale Beratung: ${plant.name}`
                : `Local Advice: ${plant.name}`,
            content: sanitizeText(generated),
        }
    }
    return parsed
}

// ---------------------------------------------------------------------------
// Garden status summary
// ---------------------------------------------------------------------------

export async function handleGardenStatusSummary(
    plants: Plant[],
    lang: Language,
    generateText: GenerateText,
): Promise<AIResponse> {
    const summary = plants.map((plant) => summarizePlant(plant)).join('\n')
    const instruction = localized(
        lang,
        'Erstelle eine kurze Zusammenfassung fuer den gesamten Garten.',
        'Create a short summary for the full grow.',
    )
    const generated = await generateText(`${instruction}\n${summary}`)
    if (!generated) {
        return localAiFallbackService.getGardenStatusSummary(plants, lang)
    }
    return {
        title: isGerman(lang) ? 'Lokaler Gartenstatus' : 'Local Garden Status',
        content: sanitizeText(generated),
    }
}

// ---------------------------------------------------------------------------
// Strain tips
// ---------------------------------------------------------------------------

export async function handleStrainTips(
    strain: Strain,
    context: { focus: string; stage: string; experienceLevel: string },
    lang: Language,
    generateText: GenerateText,
): Promise<StructuredGrowTips> {
    const instruction = localized(
        lang,
        'Gib kompakte Anbautipps auf Deutsch.',
        'Give concise grow tips in English.',
    )
    const generated = await generateText(
        `${instruction}\nStrain: ${JSON.stringify(strain)}\nContext: ${JSON.stringify(context)}`,
    )
    if (!generated) {
        return localAiFallbackService.getStrainTips(strain, lang)
    }
    const parsed = parseJsonSafely(StructuredGrowTipsSchema, generated)
    if (!parsed) {
        return localAiFallbackService.getStrainTips(strain, lang)
    }
    return parsed
}

// ---------------------------------------------------------------------------
// Grow-log RAG answer
// ---------------------------------------------------------------------------

export async function handleGrowLogRagAnswer(
    plants: Plant[],
    query: string,
    lang: Language,
    ragContext: string | undefined,
    generateText: GenerateText,
): Promise<AIResponse> {
    const plantSummary = ragContext || plants.map((plant) => summarizePlant(plant)).join('\n')
    const instruction = localized(
        lang,
        'Beantworte die Frage anhand des Grow-Log-Kontexts.',
        'Answer the question using the grow-log context.',
    )
    const generated = await generateText(
        `${instruction}\nQuestion: ${sanitizeText(query)}\nContext:\n${plantSummary}`,
    )
    if (!generated) {
        return localAiFallbackService.getGrowLogRagAnswer(query, plantSummary, lang)
    }
    return {
        title: isGerman(lang) ? 'RAG-Analyse (lokal)' : 'RAG Analysis (local)',
        content: sanitizeText(generated),
    }
}

// ---------------------------------------------------------------------------
// Deep-dive guide
// ---------------------------------------------------------------------------

export async function handleDeepDive(
    topic: string,
    plant: Plant,
    lang: Language,
    generateText: GenerateText,
): Promise<DeepDiveGuide> {
    const instruction = localized(
        lang,
        'Erstelle eine tiefe Analyse auf Deutsch.',
        'Create a deep dive guide in English.',
    )
    const generated = await generateText(
        `${instruction}\nTopic: ${sanitizeText(topic)}\nPlant: ${summarizePlant(plant)}\nReturn JSON with keys introduction, stepByStep, prosAndCons, proTip.`,
    )
    if (!generated) {
        return {
            introduction: localAiFallbackService.getPlantAdvice(plant, lang).content,
            stepByStep: [
                isGerman(lang)
                    ? 'Parameter pruefen und Notizen vergleichen.'
                    : 'Check parameters and compare notes.',
            ],
            prosAndCons: {
                pros: [isGerman(lang) ? 'Lokale Analyse verfuegbar.' : 'Local analysis available.'],
                cons: [
                    isGerman(lang)
                        ? 'LLM-Modell konnte nicht geladen werden.'
                        : 'LLM model could not be loaded.',
                ],
            },
            proTip: isGerman(lang)
                ? 'Einzelne Aenderungen getrennt testen.'
                : 'Test changes one at a time.',
        }
    }
    const parsed = parseJsonSafely(DeepDiveGuideSchema, generated)
    return (
        parsed ?? {
            introduction: sanitizeText(generated),
            stepByStep: [
                isGerman(lang)
                    ? 'Nutze lokale Diagnosewerte als Ausgangspunkt.'
                    : 'Use the local diagnosis values as a starting point.',
            ],
            prosAndCons: {
                pros: [
                    isGerman(lang)
                        ? 'Lokales Modell liefert sofortige Hilfe.'
                        : 'The local model provides immediate help.',
                ],
                cons: [
                    isGerman(lang)
                        ? 'Antwort ist eventuell knapper als ein Cloud-LLM.'
                        : 'The answer may be shorter than a cloud LLM response.',
                ],
            },
            proTip: sanitizeText(topic),
        }
    )
}
