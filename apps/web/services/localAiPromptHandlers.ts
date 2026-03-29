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

const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    nl: 'Dutch',
}

const languageConstraint = (lang: Language): string =>
    `CRITICAL: You MUST respond ENTIRELY in ${LANGUAGE_NAMES[lang]}. Do not use any other language.`

/** Build a localized one-line instruction for the given language. */
const localize = (lang: Language, instructions: Record<Language, string>): string =>
    instructions[lang] ?? instructions['en']

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
    const instruction = localize(lang, {
        en: 'Create a structured equipment recommendation in English.',
        de: 'Erstelle eine strukturierte Ausruestungsempfehlung auf Deutsch.',
        es: 'Crea una recomendacion estructurada de equipamiento en espanol.',
        fr: "Cree une recommandation structuree d'equipement en francais.",
        nl: 'Maak een gestructureerd uitrustingsadvies in het Nederlands.',
    })
    const generated = await generateText(
        `${instruction}\n${languageConstraint(lang)}
Prompt: ${sanitizedPrompt}
Return ONLY valid JSON with this exact shape (keep keys in English, write all string values in ${LANGUAGE_NAMES[lang]}): {"tent":{"name":"...","price":0,"rationale":"..."},"light":{"name":"...","price":0,"rationale":"...","watts":0},"ventilation":{"name":"...","price":0,"rationale":"..."},"circulationFan":{"name":"...","price":0,"rationale":"..."},"pots":{"name":"...","price":0,"rationale":"..."},"soil":{"name":"...","price":0,"rationale":"..."},"nutrients":{"name":"...","price":0,"rationale":"..."},"extra":{"name":"...","price":0,"rationale":"..."},"proTip":"..."}`,
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
    const instruction = localize(lang, {
        en: 'Create a compact nutrient recommendation in English.',
        de: 'Erstelle eine kompakte Naehrstoff-Empfehlung auf Deutsch.',
        es: 'Crea una recomendacion compacta de nutrientes en espanol.',
        fr: 'Cree une recommandation compacte de nutriments en francais.',
        nl: 'Maak een compact voedingsadvies in het Nederlands.',
    })
    const generated = await generateText(
        `${instruction}\n${languageConstraint(lang)}
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
    const instruction = localize(lang, {
        en: 'Answer as CannaGuide AI in English, structured, factual, and without HTML.',
        de: 'Antworte als CannaGuide AI auf Deutsch, sachlich, strukturiert und ohne HTML.',
        es: 'Responde como CannaGuide AI en espanol, estructurado, objetivo y sin HTML.',
        fr: 'Reponds en tant que CannaGuide AI en francais, structure, factuel et sans HTML.',
        nl: 'Antwoord als CannaGuide AI in het Nederlands, gestructureerd, feitelijk en zonder HTML.',
    })

    return formatJsonPrompt([
        instruction,
        languageConstraint(lang),
        `Plant: ${summarizePlant(plant)}`,
        `Context: ${sanitizeText(ragContext)}`,
        `Question: ${sanitizeText(query)}`,
        `Return ONLY valid JSON with this exact shape (keep keys in English, write all string values in ${LANGUAGE_NAMES[lang]}):`,
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
    const instruction = localize(lang, {
        en: 'Summarize the plant status succinctly in English.',
        de: 'Fasse die Pflanzenlage knapp auf Deutsch zusammen.',
        es: 'Resume el estado de la planta de forma breve en espanol.',
        fr: "Resume brievement l'etat de la plante en francais.",
        nl: 'Vat de plantstatus kort samen in het Nederlands.',
    })
    const generated = await generateText(
        `${instruction}\n${languageConstraint(lang)}\n${summarizePlant(plant)}`,
    )
    if (!generated) {
        return localAiFallbackService.getPlantAdvice(plant, lang)
    }
    const parsed = parseJsonSafely(AIResponseSchema, generated)
    if (!parsed) {
        return {
            title: localize(lang, {
                en: `Local Advice: ${plant.name}`,
                de: `Lokale Beratung: ${plant.name}`,
                es: `Consejo Local: ${plant.name}`,
                fr: `Conseil Local: ${plant.name}`,
                nl: `Lokaal Advies: ${plant.name}`,
            }),
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
    const instruction = localize(lang, {
        en: 'Create a short summary for the full grow.',
        de: 'Erstelle eine kurze Zusammenfassung fuer den gesamten Garten.',
        es: 'Crea un breve resumen de todo el cultivo.',
        fr: 'Cree un bref resume de toute la culture.',
        nl: 'Maak een korte samenvatting van de gehele kweek.',
    })
    const generated = await generateText(`${instruction}\n${languageConstraint(lang)}\n${summary}`)
    if (!generated) {
        return localAiFallbackService.getGardenStatusSummary(plants, lang)
    }
    return {
        title: localize(lang, {
            en: 'Local Garden Status',
            de: 'Lokaler Gartenstatus',
            es: 'Estado Local del Jardin',
            fr: 'Etat Local du Jardin',
            nl: 'Lokale Tuinstatus',
        }),
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
    const instruction = localize(lang, {
        en: 'Give concise grow tips in English.',
        de: 'Gib kompakte Anbautipps auf Deutsch.',
        es: 'Da consejos de cultivo concisos en espanol.',
        fr: 'Donne des conseils de culture concis en francais.',
        nl: 'Geef beknopte kweektips in het Nederlands.',
    })
    const generated = await generateText(
        `${instruction}\n${languageConstraint(lang)}\nStrain: ${JSON.stringify(strain)}\nContext: ${JSON.stringify(context)}`,
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
    const instruction = localize(lang, {
        en: 'Answer the question using the grow-log context.',
        de: 'Beantworte die Frage anhand des Grow-Log-Kontexts.',
        es: 'Responde la pregunta usando el contexto del registro de cultivo.',
        fr: 'Reponds a la question en utilisant le contexte du journal de culture.',
        nl: 'Beantwoord de vraag aan de hand van de kweeklog-context.',
    })
    const generated = await generateText(
        `${instruction}\n${languageConstraint(lang)}\nQuestion: ${sanitizeText(query)}\nContext:\n${plantSummary}`,
    )
    if (!generated) {
        return localAiFallbackService.getGrowLogRagAnswer(query, plantSummary, lang)
    }
    return {
        title: localize(lang, {
            en: 'RAG Analysis (local)',
            de: 'RAG-Analyse (lokal)',
            es: 'Analisis RAG (local)',
            fr: 'Analyse RAG (locale)',
            nl: 'RAG-Analyse (lokaal)',
        }),
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
    const instruction = localize(lang, {
        en: 'Create a deep dive guide in English.',
        de: 'Erstelle eine tiefe Analyse auf Deutsch.',
        es: 'Crea una guia de analisis profundo en espanol.',
        fr: "Cree un guide d'analyse approfondie en francais.",
        nl: 'Maak een diepgaande analyse in het Nederlands.',
    })
    const generated = await generateText(
        `${instruction}\n${languageConstraint(lang)}\nTopic: ${sanitizeText(topic)}\nPlant: ${summarizePlant(plant)}\nReturn JSON with keys introduction, stepByStep, prosAndCons, proTip. Keep keys in English, write all string values in ${LANGUAGE_NAMES[lang]}.`,
    )
    if (!generated) {
        return {
            introduction: localAiFallbackService.getPlantAdvice(plant, lang).content,
            stepByStep: [
                localize(lang, {
                    en: 'Check parameters and compare notes.',
                    de: 'Parameter pruefen und Notizen vergleichen.',
                    es: 'Verificar parametros y comparar notas.',
                    fr: 'Verifier les parametres et comparer les notes.',
                    nl: 'Parameters controleren en notities vergelijken.',
                }),
            ],
            prosAndCons: {
                pros: [
                    localize(lang, {
                        en: 'Local analysis available.',
                        de: 'Lokale Analyse verfuegbar.',
                        es: 'Analisis local disponible.',
                        fr: 'Analyse locale disponible.',
                        nl: 'Lokale analyse beschikbaar.',
                    }),
                ],
                cons: [
                    localize(lang, {
                        en: 'LLM model could not be loaded.',
                        de: 'LLM-Modell konnte nicht geladen werden.',
                        es: 'No se pudo cargar el modelo LLM.',
                        fr: "Le modele LLM n'a pas pu etre charge.",
                        nl: 'LLM-model kon niet worden geladen.',
                    }),
                ],
            },
            proTip: localize(lang, {
                en: 'Test changes one at a time.',
                de: 'Einzelne Aenderungen getrennt testen.',
                es: 'Probar los cambios uno a la vez.',
                fr: 'Tester les changements un par un.',
                nl: 'Test wijzigingen een voor een.',
            }),
        }
    }
    const parsed = parseJsonSafely(DeepDiveGuideSchema, generated)
    return (
        parsed ?? {
            introduction: sanitizeText(generated),
            stepByStep: [
                localize(lang, {
                    en: 'Use the local diagnosis values as a starting point.',
                    de: 'Nutze lokale Diagnosewerte als Ausgangspunkt.',
                    es: 'Usa los valores de diagnostico local como punto de partida.',
                    fr: 'Utilise les valeurs de diagnostic local comme point de depart.',
                    nl: 'Gebruik de lokale diagnosewaarden als startpunt.',
                }),
            ],
            prosAndCons: {
                pros: [
                    localize(lang, {
                        en: 'The local model provides immediate help.',
                        de: 'Lokales Modell liefert sofortige Hilfe.',
                        es: 'El modelo local proporciona ayuda inmediata.',
                        fr: 'Le modele local fournit une aide immediate.',
                        nl: 'Het lokale model biedt directe hulp.',
                    }),
                ],
                cons: [
                    localize(lang, {
                        en: 'The answer may be shorter than a cloud LLM response.',
                        de: 'Antwort ist eventuell knapper als ein Cloud-LLM.',
                        es: 'La respuesta puede ser mas breve que la de un LLM en la nube.',
                        fr: "La reponse peut etre plus courte qu'un LLM cloud.",
                        nl: 'Het antwoord kan korter zijn dan een cloud-LLM.',
                    }),
                ],
            },
            proTip: sanitizeText(topic),
        }
    )
}
