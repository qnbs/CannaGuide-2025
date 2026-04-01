import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from '@google/genai'
import DOMPurify from 'dompurify'
import {
    Plant,
    Recommendation,
    Strain,
    PlantDiagnosisResponse,
    AIResponse,
    StructuredGrowTips,
    DeepDiveGuide,
    MentorMessage,
    Language,
    JournalEntry,
} from '@/types'
import {
    PlantDiagnosisResponseSchema,
    StructuredGrowTipsSchema,
    DeepDiveGuideSchema,
    MentorMessageContentSchema,
    RecommendationSchema,
} from '@/types/schemas'
import { z } from 'zod'
import { getT } from '@/i18n'
import { apiKeyService } from '@/services/apiKeyService'
import { growLogRagService } from '@/services/growLogRagService'
import { aiRateLimiter } from '@/services/aiRateLimiter'
import { aiProviderService, type AiProvider } from '@/services/aiProviderService'
import { secureRandom } from '@/utils/random'

const formatPlantContextForPrompt = (
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

const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    de: 'German',
    es: 'Spanish',
    fr: 'French',
    nl: 'Dutch',
}

const createLocalizedPrompt = (basePrompt: string, lang: Language): string => {
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

// ---------------------------------------------------------------------------
// Prompt-injection protection (layered: allowlist + blocklist)
// ---------------------------------------------------------------------------

/**
 * Character-class allowlist for user-supplied text.
 * Only printable ASCII, basic punctuation, whitespace, and common
 * Latin/accented characters (for DE/FR/ES/NL i18n) are permitted.
 * Everything else is stripped before the blocklist pass runs.
 *
 * This makes the blocklist a defence-in-depth layer rather than the sole
 * protection, addressing the inherent incompleteness of regex blacklists.
 */
const ALLOWED_INPUT_CHARS = /[^a-zA-Z0-9\s.,;:!?'"()\-/@#%&*+=\n\u00C0-\u00FF\u0100-\u017F]/g

/**
 * Structural normalisation applied before any pattern matching.
 * Collapses obfuscation tricks (zero-width chars, excessive whitespace,
 * control characters) so the blocklist patterns can match reliably.
 */
const normalizeInputStructure = (input: string): string => {
    // NFC normalization: canonicalise combining characters before any matching
    let s = input.normalize('NFC')
    // Homoglyph normalization: map common Cyrillic/Greek/special look-alikes to ASCII
    s = normalizeHomoglyphs(s)
    // Strip zero-width and invisible Unicode (ZWJ, ZWNJ, ZWSP, BOM, soft-hyphen, etc.)
    s = s.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD\u180E]/g, '')
    // Collapse multiple whitespace / control chars to single space
    // eslint-disable-next-line no-control-regex
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/g, ' ')
    // Normalize excessive newlines (>3 consecutive) to 2
    s = s.replace(/\n{4,}/g, '\n\n')
    return s
}

/**
 * Map visually similar characters (homoglyphs) from Cyrillic, Greek, and
 * other scripts to their ASCII equivalents.  This defeats simple substitution
 * attacks that try to bypass the allowlist/blocklist by using look-alike chars.
 */
const HOMOGLYPH_MAP: Record<string, string> = {
    // Cyrillic -> ASCII
    '\u0410': 'A',
    '\u0430': 'a', // A
    '\u0412': 'B',
    '\u0432': 'b', // B (Ve)
    '\u0421': 'C',
    '\u0441': 'c', // C (Es)
    '\u0415': 'E',
    '\u0435': 'e', // E (Ye)
    '\u041D': 'H',
    '\u043D': 'h', // H (En)
    '\u041A': 'K',
    '\u043A': 'k', // K (Ka)
    '\u041C': 'M',
    '\u043C': 'm', // M (Em)
    '\u041E': 'O',
    '\u043E': 'o', // O
    '\u0420': 'P',
    '\u0440': 'p', // P (Er)
    '\u0422': 'T',
    '\u0442': 't', // T (Te)
    '\u0425': 'X',
    '\u0445': 'x', // X (Kha)
    '\u0423': 'Y',
    '\u0443': 'y', // Y (U)
    // Greek -> ASCII
    '\u0391': 'A',
    '\u03B1': 'a', // Alpha
    '\u0392': 'B',
    '\u03B2': 'b', // Beta
    '\u0395': 'E',
    '\u03B5': 'e', // Epsilon
    '\u0397': 'H',
    '\u03B7': 'h', // Eta
    '\u0399': 'I',
    '\u03B9': 'i', // Iota
    '\u039A': 'K',
    '\u03BA': 'k', // Kappa
    '\u039C': 'M',
    '\u03BC': 'm', // Mu
    '\u039D': 'N',
    '\u03BD': 'n', // Nu
    '\u039F': 'O',
    '\u03BF': 'o', // Omicron
    '\u03A1': 'P',
    '\u03C1': 'p', // Rho
    '\u03A4': 'T',
    '\u03C4': 't', // Tau
    '\u03A7': 'X',
    '\u03C7': 'x', // Chi
    // Special Unicode look-alikes
    '\uFF21': 'A',
    '\uFF41': 'a', // Fullwidth
    '\uFF25': 'E',
    '\uFF45': 'e',
    '\uFF29': 'I',
    '\uFF49': 'i',
    '\uFF2F': 'O',
    '\uFF4F': 'o',
    '\uFF35': 'U',
    '\uFF55': 'u',
    '\u2010': '-',
    '\u2011': '-',
    '\u2012': '-',
    '\u2013': '-',
    '\u2014': '-', // Dashes
    '\u2018': "'",
    '\u2019': "'",
    '\u201C': '"',
    '\u201D': '"', // Quotes
}

const HOMOGLYPH_REGEX = new RegExp('[' + Object.keys(HOMOGLYPH_MAP).join('') + ']', 'g')

const normalizeHomoglyphs = (input: string): string =>
    input.replace(HOMOGLYPH_REGEX, (ch) => HOMOGLYPH_MAP[ch] ?? ch)

/**
 * Patterns that could be used to hijack or escape the LLM system prompt.
 * Applied to all user-supplied free-text before it is interpolated into prompts.
 * This is a defence-in-depth layer — the character allowlist above is the primary guard.
 */
const INJECTION_PATTERNS: RegExp[] = [
    // --- Instruction override ---
    /ignore\s+(previous|all\s+previous|prior)\s+(instructions?|prompts?|context)/gi,
    /disregard\s+(previous|all|the|your|prior)/gi,
    /forget\s+(everything|all|the\s+above|previous)/gi,
    /override\s+(all|your|the|previous)\s+(instructions?|rules?|guidelines?)/gi,
    /new\s+instructions?\s*:/gi,
    /you\s+are\s+now\s+(a|an|the)\s+/gi,
    /act\s+as\s+(if|though)\s+you\s+(have\s+)?no\s+(rules|restrictions|guidelines)/gi,
    /enter\s+(developer|debug|admin|god)\s+mode/gi,
    // --- LLM special-token sequences ---
    /<\|.*?\|>/g,
    /\[\/?INST\]/gi,
    /<<\/?SYS>>/gi,
    /<\/?(?:system|user|assistant|human|function|tool)>/gi,
    // --- Role-injection via raw labels ---
    /^(system|assistant|human|user)\s*:/gim,
    /^(###?\s*(system|assistant|human|user))\s*$/gim,
    // --- Prompt-leaking attempts ---
    /repeat\s+(the|your|all|above|previous)\s+(prompt|instructions?|system)/gi,
    /print\s+(the|your)\s+(system\s+)?prompt/gi,
    /show\s+(me\s+)?(the|your)\s+(system|hidden|internal)\s+(prompt|instructions?)/gi,
    /what\s+(are|were)\s+(your|the)\s+(system\s+)?(instructions?|prompt|rules)/gi,
    // --- Base64 / data-URI injection (bounded quantifiers to prevent ReDoS) ---
    /data:\s{0,10}[a-z]+\/[a-z0-9.+-]+\s{0,10};?\s{0,10}base64\s{0,10},/gi,
    // --- Unicode escape / obfuscation ---
    /\\u[0-9a-f]{4}/gi,
    /\\x[0-9a-f]{2}/gi,
    // --- CDATA / XML entity abuse ---
    /<!\[CDATA\[/gi,
    /&#x?[0-9a-f]+;/gi,
    // --- Markdown code-fence prompt escape ---
    /```\s*(system|prompt|instructions?|config)/gi,
]

/**
 * Sanitize a user-supplied string for safe interpolation inside an LLM prompt.
 * 1. Strips all HTML/XML markup (DOMPurify)
 * 2. Normalises invisible/control characters (structural allowlist)
 * 3. Strips characters outside the permitted character-class allowlist
 * 4. Removes known prompt-injection patterns (blocklist defence-in-depth)
 * 5. Truncates to `maxLength` characters
 */
const sanitizeForPrompt = (input: string, maxLength = 500): string => {
    // Layer 1: Strip HTML
    const stripped = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    // Layer 2: Structural normalisation (zero-width chars, control chars)
    const normalized = normalizeInputStructure(stripped)
    // Layer 3: Character-class allowlist -- drop anything not explicitly permitted
    let clean = normalized.replace(ALLOWED_INPUT_CHARS, '')
    // Layer 4: Blocklist patterns (defence-in-depth)
    for (const pattern of INJECTION_PATTERNS) {
        clean = clean.replace(pattern, '[redacted]')
    }
    return clean.slice(0, maxLength).trim()
}

const MAX_PROMPT_CHARS = 12000
const MAX_OUTPUT_TOKENS_TEXT = 900
const MAX_OUTPUT_TOKENS_JSON = 1400

const truncatePromptForModel = (prompt: string, maxChars = MAX_PROMPT_CHARS): string => {
    if (prompt.length <= maxChars) {
        return prompt
    }

    const head = prompt.slice(0, Math.floor(maxChars * 0.7))
    const tail = prompt.slice(-Math.floor(maxChars * 0.3))
    return `${head}\n\n[...context truncated to fit token window...]\n\n${tail}`
}

const summarizeJournalForPrompt = (journal: JournalEntry[], maxRecent = 10): string => {
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

const createCompactPlantSnapshot = (plant: Plant) => ({
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

export type { ImageStyle, ImageCriteria } from '@/types/aiProvider'
import type { BaseAIProvider, ImageStyle, ImageCriteria } from '@/types/aiProvider'
const availableStyles: Exclude<ImageStyle, 'random'>[] = [
    'fantasy',
    'botanical',
    'psychedelic',
    'macro',
    'cyberpunk',
]

const AI_ERROR_KEYS = new Set([
    'ai.error.missingApiKey',
    'ai.error.generic',
    'ai.error.equipment',
    'ai.error.diagnostics',
    'ai.error.tips',
    'ai.error.deepDive',
    'ai.error.unknown',
    'ai.error.rateLimited',
])

const GEMINI_SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
]

const getEducationalUseOnlyInstruction = (lang: Language): string => {
    const instructions: Record<Language, string> = {
        en: 'CONTEXT: This request is strictly for legal, educational horticulture use. Provide structured, factual, harm-minimizing guidance and do not infer illicit intent.',
        de: 'KONTEXT: Diese Anfrage dient ausschliesslich legalen, edukativen Gartenbauzwecken. Gib strukturierte, sachliche und risikominimierende Informationen. Unterstelle keinen illegalen Zweck.',
        es: 'CONTEXTO: Esta solicitud es estrictamente para uso horticola legal y educativo. Proporciona orientacion estructurada, factual y que minimice riesgos. No inferir intenciones ilicitas.',
        fr: "CONTEXTE: Cette demande est strictement destinee a un usage horticole legal et educatif. Fournis des conseils structures, factuels et minimisant les risques. Ne presume pas d'intention illicite.",
        nl: 'CONTEXT: Dit verzoek is strikt voor legaal, educatief tuinbouwgebruik. Geef gestructureerde, feitelijke en risicobeperkende informatie. Veronderstel geen illegale bedoeling.',
    }
    return instructions[lang] ?? instructions['en']
}

import { localAiPreloadService } from '@/services/localAiInfrastructureService'

const getLocalAiService = async () => {
    const module = await import('@/services/localAI')
    return module.localAiService
}

type LocalAiService = Awaited<ReturnType<typeof getLocalAiService>>

type NutrientRecommendationInput = {
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

class GeminiService implements BaseAIProvider {
    readonly id = 'gemini' as const

    private sanitizeValue<T>(value: T): T {
        if (typeof value === 'string') {
            // Strip all HTML tags from structured API data to prevent XSS
            // without corrupting angle-bracket content in plain-text fields.
            return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }) as T
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.sanitizeValue(item)) as T
        }
        if (value && typeof value === 'object') {
            const nextEntries = Object.entries(value as Record<string, unknown>).map(
                ([key, val]) => [key, this.sanitizeValue(val)],
            )
            return Object.fromEntries(nextEntries) as T
        }
        return value
    }

    private shouldUseLocalFallback(error: unknown): boolean {
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false
        if (offline) return true

        // Only fall back to local AI if models are actually pre-loaded
        if (!localAiPreloadService.isReady()) return false

        return (
            error instanceof Error &&
            (error.message === 'ai.error.missingApiKey' || error.message.includes('NetworkError'))
        )
    }

    /** Resolve the active provider. Returns 'gemini' or an alternative. */
    private getActiveProvider(): AiProvider {
        return aiProviderService.getActiveProviderId()
    }

    /** Check if we should route through a non-Gemini provider for text/JSON calls. */
    private isAlternateProvider(): boolean {
        return this.getActiveProvider() !== 'gemini'
    }

    /**
     * Generate text/JSON via the active non-Gemini provider.
     * Handles rate limiting and cost tracking.
     */
    private async generateViaAlternateProvider(
        endpoint: string,
        systemPrompt: string,
        userPrompt: string,
        jsonMode: boolean,
        maxTokens: number,
    ): Promise<string> {
        aiRateLimiter.acquireSlot(endpoint)
        const provider = this.getActiveProvider()
        return aiProviderService.generateTextWithProvider(
            provider,
            systemPrompt,
            userPrompt,
            jsonMode,
            maxTokens,
        )
    }

    private withGeminiSafety<T extends Record<string, unknown>>(
        config?: T,
    ): T & { safetySettings: typeof GEMINI_SAFETY_SETTINGS } {
        return {
            ...(config ?? ({} as T)),
            safetySettings: GEMINI_SAFETY_SETTINGS,
        }
    }

    private async generateWithFallback({
        ai,
        model,
        contents,
        config,
        fallbackModel,
    }: {
        ai: GoogleGenAI
        model: string
        contents:
            | string
            | {
                  parts: Array<{
                      text?: string
                      inlineData?: { data: string; mimeType: string }
                  }>
              }
        config?: Record<string, unknown> | undefined
        fallbackModel?: string | undefined
    }) {
        try {
            return await ai.models.generateContent({
                model,
                contents,
                config: this.withGeminiSafety(config),
            })
        } catch (primaryError) {
            if (!fallbackModel || fallbackModel === model) {
                throw primaryError
            }

            console.debug(
                `[Gemini] Primary model ${model} failed, retrying with ${fallbackModel}.`,
                primaryError,
            )

            return ai.models.generateContent({
                model: fallbackModel,
                contents,
                config: this.withGeminiSafety(config),
            })
        }
    }

    private async generateTextStreamed({
        ai,
        model,
        contents,
        config,
    }: {
        ai: GoogleGenAI
        model: string
        contents: string
        config?: Record<string, unknown>
    }): Promise<string> {
        type ModelsWithStream = typeof ai.models & {
            generateContentStream?: (options: Record<string, unknown>) => Promise<unknown>
        }
        const streamFn = (ai.models as ModelsWithStream).generateContentStream

        if (typeof streamFn !== 'function') {
            const response = await this.generateWithFallback({ ai, model, contents, config })
            return this.getResponseTextOrThrow(response, 'ai.error.generic')
        }

        type StreamResult = { [Symbol.asyncIterator](): AsyncIterator<{ text?: string }> }
        const streamResult = (await streamFn.call(ai.models, {
            model,
            contents,
            config: this.withGeminiSafety(config),
        })) as StreamResult

        let fullText = ''
        for await (const chunk of streamResult) {
            if (typeof chunk?.text === 'string') {
                fullText += chunk.text
            }
        }

        if (!fullText.trim()) {
            throw new Error('ai.error.generic')
        }

        return fullText
    }

    private rethrowKnownError(error: unknown, fallbackErrorKey: string): never {
        if (error instanceof Error) {
            if (AI_ERROR_KEYS.has(error.message)) throw error
            // Rate limit errors carry retry info: "ai.error.rateLimited:30"
            if (error.message.startsWith('ai.error.rateLimited')) throw error
        }

        throw new Error(fallbackErrorKey)
    }

    private getResponseTextOrThrow(
        response: { text?: string | undefined },
        errorKey: string,
    ): string {
        if (typeof response.text !== 'string' || response.text.trim().length === 0) {
            throw new Error(errorKey)
        }

        return this.sanitizeValue(response.text)
    }

    private parseJsonResponse<T>(
        response: { text?: string | undefined },
        errorKey: string,
        schema?: z.ZodSchema<T>,
    ): T {
        const text = this.getResponseTextOrThrow(response, errorKey)
        return this.parseJsonFromText(text, errorKey, schema)
    }

    /** Parse & validate JSON from raw text (used by alternate providers). */
    private parseJsonFromText<T>(text: string, errorKey: string, schema?: z.ZodSchema<T>): T {
        let parsed: T
        try {
            // Strip markdown code fences that some providers wrap JSON in
            const cleaned = text
                .trim()
                .replace(/^```(?:json)?\s*\n?/i, '')
                .replace(/\n?```\s*$/i, '')
                .trim()
            parsed = JSON.parse(cleaned) as T
        } catch {
            throw new Error(errorKey)
        }
        const sanitized = this.sanitizeValue(parsed)
        if (schema) {
            const result = schema.safeParse(sanitized)
            if (!result.success) {
                console.debug('[AI] Response schema validation failed:', result.error.format())
                throw new Error(errorKey)
            }
            return result.data
        }
        return sanitized
    }

    private async getAi(): Promise<GoogleGenAI> {
        const apiKey = await apiKeyService.getApiKey()
        if (!apiKey) {
            throw new Error('ai.error.missingApiKey')
        }

        return new GoogleGenAI({ apiKey })
    }

    private async generateText(
        prompt: string,
        lang: Language,
        endpoint = 'generateText',
    ): Promise<string> {
        // Route to alternate provider if configured
        if (this.isAlternateProvider()) {
            return this.generateViaAlternateProvider(
                endpoint,
                getEducationalUseOnlyInstruction(lang),
                prompt,
                false,
                MAX_OUTPUT_TOKENS_TEXT,
            )
        }

        try {
            aiRateLimiter.acquireSlot(endpoint)
            const ai = await this.getAi()
            const localizedPrompt = createLocalizedPrompt(
                `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
                lang,
            )
            const guardedPrompt = truncatePromptForModel(localizedPrompt)

            return await this.generateTextStreamed({
                ai,
                model: 'gemini-2.5-flash',
                contents: guardedPrompt,
                config: {
                    maxOutputTokens: MAX_OUTPUT_TOKENS_TEXT,
                },
            })
        } catch (error) {
            console.error('Gemini API Error:', error)
            this.rethrowKnownError(error, 'ai.error.generic')
        }
    }

    private buildEquipmentRecommendationResponseSchema(): Record<string, unknown> {
        return {
            type: Type.OBJECT,
            properties: {
                tent: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['name', 'price', 'rationale'],
                },
                light: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                        watts: { type: Type.NUMBER },
                    },
                    required: ['name', 'price', 'rationale', 'watts'],
                },
                ventilation: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['name', 'price', 'rationale'],
                },
                circulationFan: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['name', 'price', 'rationale'],
                },
                pots: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['name', 'price', 'rationale'],
                },
                soil: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['name', 'price', 'rationale'],
                },
                nutrients: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['name', 'price', 'rationale'],
                },
                extra: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        price: { type: Type.NUMBER },
                        rationale: { type: Type.STRING },
                    },
                    required: ['name', 'price', 'rationale'],
                },
                proTip: { type: Type.STRING },
            },
            required: [
                'tent',
                'light',
                'ventilation',
                'circulationFan',
                'pots',
                'soil',
                'nutrients',
                'extra',
                'proTip',
            ],
        }
    }

    private async getEquipmentRecommendationFromAlternateProvider(
        prompt: string,
        lang: Language,
    ): Promise<Recommendation> {
        const t = getT()
        const systemPrompt = `${getEducationalUseOnlyInstruction(lang)}\n\n${t('ai.prompts.equipmentSystemInstruction')}`
        const jsonInstruction =
            'Respond ONLY with valid JSON matching this exact structure: { "tent": {"name":"...","price":0,"rationale":"..."}, "light": {"name":"...","price":0,"rationale":"...","watts":0}, "ventilation": {"name":"...","price":0,"rationale":"..."}, "circulationFan": {"name":"...","price":0,"rationale":"..."}, "pots": {"name":"...","price":0,"rationale":"..."}, "soil": {"name":"...","price":0,"rationale":"..."}, "nutrients": {"name":"...","price":0,"rationale":"..."}, "extra": {"name":"...","price":0,"rationale":"..."}, "proTip": "..." }'

        const text = await this.generateViaAlternateProvider(
            'getEquipmentRecommendation',
            systemPrompt,
            `${createLocalizedPrompt(prompt, lang)}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )

        return this.parseJsonFromText<Recommendation>(
            text,
            'ai.error.equipment',
            RecommendationSchema,
        )
    }

    private async getEquipmentRecommendationFromGemini(
        prompt: string,
        lang: Language,
    ): Promise<Recommendation> {
        const t = getT()
        aiRateLimiter.acquireSlot('getEquipmentRecommendation')
        const ai = await this.getAi()
        const systemInstruction = t('ai.prompts.equipmentSystemInstruction')
        const localizedSystemInstruction = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${systemInstruction}`,
            lang,
        )

        const response = await this.generateWithFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: truncatePromptForModel(
                `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            ),
            config: {
                systemInstruction: localizedSystemInstruction,
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: this.buildEquipmentRecommendationResponseSchema(),
            },
        })

        return this.parseJsonResponse<Recommendation>(
            response,
            'ai.error.equipment',
            RecommendationSchema,
        )
    }

    private buildMentorResponseSchema(): Record<string, unknown> {
        return {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                uiHighlights: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            elementId: { type: Type.STRING },
                            plantId: { type: Type.STRING },
                        },
                        required: ['elementId'],
                    },
                },
            },
            required: ['title', 'content'],
        }
    }

    private async getMentorResponseFromAlternateProvider(
        prompt: string,
        lang: Language,
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        const systemPrompt = `${getEducationalUseOnlyInstruction(lang)}\n\n${t('ai.prompts.mentor.systemInstruction')}`
        const jsonInstruction =
            'Respond ONLY with valid JSON matching: { "title": "...", "content": "...", "uiHighlights": [] }'
        const text = await this.generateViaAlternateProvider(
            'getMentorResponse',
            systemPrompt,
            `${createLocalizedPrompt(`${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`, lang)}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )

        return this.parseJsonFromText<Omit<MentorMessage, 'role'>>(
            text,
            'ai.error.generic',
            MentorMessageContentSchema as z.ZodSchema<Omit<MentorMessage, 'role'>>,
        )
    }

    private async getMentorResponseFromGemini(
        prompt: string,
        lang: Language,
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        aiRateLimiter.acquireSlot('getMentorResponse')
        const ai = await this.getAi()
        const systemInstruction = t('ai.prompts.mentor.systemInstruction')
        const localizedSystemInstruction = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${systemInstruction}`,
            lang,
        )
        const localizedPrompt = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            lang,
        )
        const response = await this.generateWithFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: truncatePromptForModel(localizedPrompt),
            config: {
                systemInstruction: localizedSystemInstruction,
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: this.buildMentorResponseSchema(),
            },
        })

        return this.parseJsonResponse<Omit<MentorMessage, 'role'>>(
            response,
            'ai.error.generic',
            MentorMessageContentSchema as z.ZodSchema<Omit<MentorMessage, 'role'>>,
        )
    }

    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        try {
            if (this.isAlternateProvider()) {
                return await this.getEquipmentRecommendationFromAlternateProvider(prompt, lang)
            }

            return await this.getEquipmentRecommendationFromGemini(prompt, lang)
        } catch (error) {
            const isAlternateProviderError = this.isAlternateProvider()
            console.error('Gemini getEquipmentRecommendation Error:', error)
            if (isAlternateProviderError) {
                console.error('Alt-provider getEquipmentRecommendation Error:', error)
            }
            this.rethrowKnownError(error, 'ai.error.equipment')
        }
    }

    private buildDiagnosePlantProblemsSummary(plant: Plant, t: ReturnType<typeof getT>): string {
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

    private buildDiagnosePlantContext(
        plant: Plant,
        userNotes: string,
        t: ReturnType<typeof getT>,
    ): string {
        const problems = this.buildDiagnosePlantProblemsSummary(plant, t)

        return `
PLANT CONTEXT:
- Strain: ${plant.strain.name} (${plant.strain.type})
- Age: ${plant.age} days (Stage: ${t(`plantStages.${plant.stage}`)})
- Active Issues: ${problems}
- Medium Vitals: pH ${plant.medium.ph.toFixed(2)}, EC ${plant.medium.ec.toFixed(2)}
- Environment Vitals: Temp ${plant.environment.internalTemperature.toFixed(1)}°C, Humidity ${plant.environment.internalHumidity.toFixed(1)}%
- USER NOTES: "${sanitizeForPrompt(userNotes || 'None provided', 400)}"
        `.trim()
    }

    private buildDiagnosePlantResponseSchema(): Record<string, unknown> {
        return {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                immediateActions: { type: Type.STRING },
                longTermSolution: { type: Type.STRING },
                prevention: { type: Type.STRING },
                diagnosis: { type: Type.STRING },
            },
            required: [
                'title',
                'content',
                'confidence',
                'immediateActions',
                'longTermSolution',
                'prevention',
                'diagnosis',
            ],
        }
    }

    private async diagnosePlantViaGemini(
        base64Image: string,
        mimeType: string,
        localizedPrompt: string,
    ): Promise<PlantDiagnosisResponse> {
        aiRateLimiter.acquireSlot('diagnosePlant')
        const ai = await this.getAi()
        const imagePart = { inlineData: { data: base64Image, mimeType } }
        const textPart = { text: localizedPrompt }

        const response = await this.generateWithFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: this.buildDiagnosePlantResponseSchema(),
            },
        })

        return this.parseJsonResponse<PlantDiagnosisResponse>(
            response,
            'ai.error.diagnostics',
            PlantDiagnosisResponseSchema,
        )
    }

    private buildStrainTipsResponseSchema(): Record<string, unknown> {
        return {
            type: Type.OBJECT,
            properties: {
                nutrientTip: { type: Type.STRING },
                trainingTip: { type: Type.STRING },
                environmentalTip: { type: Type.STRING },
                proTip: { type: Type.STRING },
            },
            required: ['nutrientTip', 'trainingTip', 'environmentalTip', 'proTip'],
        }
    }

    private async getStrainTipsFromAlternateProvider(
        localizedPrompt: string,
        lang: Language,
    ): Promise<StructuredGrowTips> {
        const jsonInstruction =
            'Respond ONLY with valid JSON matching: { "nutrientTip": "...", "trainingTip": "...", "environmentalTip": "...", "proTip": "..." }'
        const text = await this.generateViaAlternateProvider(
            'getStrainTips',
            getEducationalUseOnlyInstruction(lang),
            `${localizedPrompt}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )
        return this.parseJsonFromText<StructuredGrowTips>(
            text,
            'ai.error.tips',
            StructuredGrowTipsSchema,
        )
    }

    private async getStrainTipsFromGemini(localizedPrompt: string): Promise<StructuredGrowTips> {
        aiRateLimiter.acquireSlot('getStrainTips')
        const ai = await this.getAi()
        const response = await this.generateWithFallback({
            ai,
            model: 'gemini-2.5-flash',
            contents: truncatePromptForModel(localizedPrompt),
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: this.buildStrainTipsResponseSchema(),
            },
        })

        return this.parseJsonResponse<StructuredGrowTips>(
            response,
            'ai.error.tips',
            StructuredGrowTipsSchema,
        )
    }

    private buildDeepDiveResponseSchema(): Record<string, unknown> {
        return {
            type: Type.OBJECT,
            properties: {
                introduction: { type: Type.STRING },
                stepByStep: { type: Type.ARRAY, items: { type: Type.STRING } },
                prosAndCons: {
                    type: Type.OBJECT,
                    properties: {
                        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                        cons: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['pros', 'cons'],
                },
                proTip: { type: Type.STRING },
            },
            required: ['introduction', 'stepByStep', 'prosAndCons', 'proTip'],
        }
    }

    private async generateDeepDiveFromAlternateProvider(
        localizedPrompt: string,
        lang: Language,
    ): Promise<DeepDiveGuide> {
        const jsonInstruction =
            'Respond ONLY with valid JSON matching: { "introduction": "...", "stepByStep": ["..."], "prosAndCons": { "pros": ["..."], "cons": ["..."] }, "proTip": "..." }'
        const text = await this.generateViaAlternateProvider(
            'generateDeepDive',
            getEducationalUseOnlyInstruction(lang),
            `${localizedPrompt}\n\n${jsonInstruction}`,
            true,
            MAX_OUTPUT_TOKENS_JSON,
        )
        return this.parseJsonFromText<DeepDiveGuide>(text, 'ai.error.deepDive', DeepDiveGuideSchema)
    }

    private async generateDeepDiveFromGemini(localizedPrompt: string): Promise<DeepDiveGuide> {
        aiRateLimiter.acquireSlot('generateDeepDive')
        const ai = await this.getAi()
        const response = await this.generateWithFallback({
            ai,
            model: 'gemini-2.5-pro',
            fallbackModel: 'gemini-2.5-flash',
            contents: truncatePromptForModel(localizedPrompt),
            config: {
                maxOutputTokens: MAX_OUTPUT_TOKENS_JSON,
                responseMimeType: 'application/json',
                responseSchema: this.buildDeepDiveResponseSchema(),
            },
        })

        return this.parseJsonResponse<DeepDiveGuide>(
            response,
            'ai.error.deepDive',
            DeepDiveGuideSchema,
        )
    }

    private resolveImageStyle(style: ImageStyle): Exclude<ImageStyle, 'random'> {
        if (style === 'random') {
            return (
                availableStyles[Math.floor(secureRandom() * availableStyles.length)] ?? 'botanical'
            )
        }

        return style as Exclude<ImageStyle, 'random'>
    }

    private getStrainImageStylePrompts(
        strainName: string,
    ): Record<Exclude<ImageStyle, 'random'>, string> {
        return {
            fantasy: `A stunning, artistic, and imaginative fantasy illustration representing the cannabis strain '${strainName}'. The style should be vibrant and impressive, with ethereal, magical lighting.`,
            botanical: `A detailed vintage botanical illustration of the cannabis strain '${strainName}'. The style should mimic a 19th-century scientific drawing with fine ink lines, delicate watercolor washes, and annotations on aged, parchment-like paper. Focus on realism and anatomical accuracy.`,
            psychedelic: `A vibrant, psychedelic art piece inspired by the cannabis strain '${strainName}'. The style should be reminiscent of 1960s poster art, featuring swirling patterns, kaleidoscopic visuals, bold neon colors, and abstract, flowing shapes. Trippy and mesmerizing.`,
            macro: `An ultra-realistic, professional macro photograph of a perfect cannabis bud from the strain '${strainName}'. Focus on the intricate details: glistening trichomes, vibrant pistils, and complex textures. Use dramatic studio lighting to create depth. The background should be clean and dark.`,
            cyberpunk: `A high-tech, cyberpunk-style hologram of the cannabis strain '${strainName}'. The plant should be rendered as a glowing, neon-blue and purple wireframe or semi-translucent light form, projected into a dark, futuristic scene. Incorporate glitch effects and scan lines for a high-tech feel.`,
        }
    }

    private getStrainImageCriteriaPrompts(): {
        focus: Record<string, string>
        composition: Record<string, string>
        mood: Record<string, string>
    } {
        return {
            focus: {
                buds: 'The main focus is a close-up on the detailed structure of the flower buds.',
                plant: 'The composition features the entire plant, showcasing its overall shape and structure.',
                abstract:
                    "The image is an abstract representation of the strain's essence, not a literal plant.",
            },
            composition: {
                symmetrical: 'The composition is balanced and formally symmetrical.',
                dynamic:
                    'The composition is dynamic, using strong diagonal lines and a sense of movement.',
                minimalist:
                    'The composition is minimalist, with a single subject against a simple, clean background.',
            },
            mood: {
                mystical: 'The overall mood is mystical, dark, and enigmatic.',
                energetic: 'The overall mood is bright, energetic, and vibrant.',
                calm: 'The overall mood is calm, serene, and peaceful.',
            },
        }
    }

    private buildStrainImagePrompt(
        strain: Strain,
        style: Exclude<ImageStyle, 'random'>,
        criteria: ImageCriteria,
    ): string {
        const systemPrompt =
            "You are an advanced image generation AI. Your task is to produce a single, high-fidelity, visually stunning, and contextually accurate image based on the user's detailed prompt. Adhere strictly to all instructions, especially regarding style, subject, and mood. Interpret prompts artistically but precisely."
        const stylePrompts = this.getStrainImageStylePrompts(strain.name)
        const criteriaPrompts = this.getStrainImageCriteriaPrompts()
        const strainSpecificPrompt = stylePrompts[style]
        const focusPrompt = criteriaPrompts.focus[criteria.focus] ?? criteriaPrompts.focus.plant
        const compositionPrompt =
            criteriaPrompts.composition[criteria.composition] ?? criteriaPrompts.composition.dynamic
        const moodPrompt = criteriaPrompts.mood[criteria.mood] ?? criteriaPrompts.mood.calm

        const criteriaString = `
            Artistic Direction:
            - Focus: ${focusPrompt}
            - Composition: ${compositionPrompt}
            - Mood: ${moodPrompt}
            - Integrate the strain's name '${strain.name}' creatively and elegantly into the artwork itself, for example as subtle typography, glowing runes, or part of a natural pattern.
        `

        return `${systemPrompt}\n\n---\n\nCONTEXT: The image request is for legal, educational horticulture visualization only.\n\nEXECUTE THE FOLLOWING PROMPT:\n\n${strainSpecificPrompt}\n\n${criteriaString}`
    }

    private extractGeneratedImageDataOrThrow(response: {
        candidates?: Array<{
            content?: {
                parts?: Array<{
                    inlineData?: { data?: string }
                }>
            }
        }>
    }): string {
        const imagePart = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)
        if (imagePart && imagePart.inlineData && typeof imagePart.inlineData.data === 'string') {
            return imagePart.inlineData.data
        }

        throw new Error(getT()('common.noImageGenerated'))
    }

    private buildNutrientReadingsSummary(
        readings: Array<{ ec: number; ph: number; readingType: string; timestamp: number }>,
    ): string {
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

    private buildNutrientPlantInfo(context: {
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
    }): string {
        if (!context.plant) {
            return 'No specific plant selected.'
        }

        return `Plant: ${context.plant.name} (${context.plant.strain.name}), Stage: ${context.plant.stage}, Age: ${context.plant.age}d, Health: ${context.plant.health.toFixed(0)}%, Live pH: ${context.plant.medium.ph.toFixed(2)}, Live EC: ${context.plant.medium.ec.toFixed(2)}`
    }

    private buildNutrientPlannerPrompt(
        context: NutrientRecommendationInput,
        t: ReturnType<typeof getT>,
    ): string {
        const readingsSummary = this.buildNutrientReadingsSummary(context.readings)
        const plantInfo = this.buildNutrientPlantInfo(context)

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

    private buildPlantJournalContext(plant: Plant, t: ReturnType<typeof getT>): string {
        const translate = (key: string, options?: Record<string, unknown> | undefined): string =>
            t(key, options ?? {})
        return `${formatPlantContextForPrompt(plant, translate)}\n\nJOURNAL SUMMARY\n---------------\n${summarizeJournalForPrompt(plant.journal)}`
    }

    private buildLocalizedEducationalPrompt(prompt: string, lang: Language): string {
        return createLocalizedPrompt(`${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`, lang)
    }

    private buildMentorPrompt(
        plant: Plant,
        query: string,
        t: ReturnType<typeof getT>,
    ): { prompt: string; ragContext: string } {
        const plantContext = this.buildPlantJournalContext(plant, t)
        const ragContext = growLogRagService.retrieveRelevantContext([plant], query)
        const sanitizedQuery = sanitizeForPrompt(query, 600)

        const prompt = t('ai.prompts.mentor.main', {
            context: `${plantContext}\n\nRELEVANT GROW LOG CONTEXT\n-------------------------\n${ragContext}`,
            query: sanitizedQuery,
        })

        return { prompt, ragContext }
    }

    private buildStrainTipsLocalizedPrompt(
        strain: Strain,
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language,
        t: ReturnType<typeof getT>,
    ): string {
        const prompt = t('ai.prompts.strainTips', {
            strain: JSON.stringify(strain),
            focus: context.focus,
            stage: context.stage,
            experienceLevel: context.experienceLevel,
        })

        return this.buildLocalizedEducationalPrompt(prompt, lang)
    }

    private async getPlantNarrativeWithFallback(
        plant: Plant,
        lang: Language,
        endpoint: 'getPlantAdvice' | 'getProactiveDiagnosis',
        promptBuilderKey: 'ai.prompts.advisor' | 'ai.prompts.proactiveDiagnosis',
        titleKey: 'ai.advisor' | 'ai.proactiveDiagnosis',
        fallbackGetter: (
            localAiService: LocalAiService,
            p: Plant,
            l: Language,
        ) => Promise<AIResponse>,
    ): Promise<AIResponse> {
        const t = getT()
        const plantContext = this.buildPlantJournalContext(plant, t)
        const prompt = t(promptBuilderKey, { plant: plantContext })

        return this.runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await this.generateText(prompt, lang, endpoint)
                return { title: t(titleKey), content: responseText }
            },
            async (localAiService) => fallbackGetter(localAiService, plant, lang),
        )
    }

    private async runWithLocalFallback<T>(
        task: () => Promise<T>,
        fallbackTask: (localAiService: LocalAiService) => Promise<T>,
    ): Promise<T> {
        try {
            return await task()
        } catch (error) {
            if (this.shouldUseLocalFallback(error)) {
                const localAiService = await getLocalAiService()
                return fallbackTask(localAiService)
            }
            throw error
        }
    }

    private buildGardenPlantSummaries(plants: Plant[], t: ReturnType<typeof getT>): string {
        return plants
            .map((plant) => {
                const problemsSummary =
                    plant.problems.length > 0
                        ? plant.problems.map((problem) => problem.type).join(', ')
                        : 'None'

                return `- ${plant.name} (${t('plantsView.plantCard.day')} ${plant.age}, ${t(`plantStages.${plant.stage}`)}): Health ${plant.health.toFixed(0)}%, Stress ${plant.stressLevel.toFixed(0)}%. Problems: ${problemsSummary}`
            })
            .join('\n')
    }

    private buildGrowLogRagPrompt(plants: Plant[], query: string): string {
        const ragContext = growLogRagService.retrieveRelevantContext(plants, query)
        const safeQuery = sanitizeForPrompt(query, 600)
        return `Answer the question using only the provided grow-log context.\n\nQuestion:\n${safeQuery}\n\nGrow-log context:\n${ragContext}\n\nIf information is uncertain, explicitly say so.`
    }

    private mapDynamicLoadingMessages(messagesResult: unknown): string[] {
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

    async diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language,
    ): Promise<PlantDiagnosisResponse> {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            const localAiService = await getLocalAiService()
            return localAiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
        }

        const t = getT()
        const contextString = this.buildDiagnosePlantContext(plant, userNotes, t)

        const prompt = `
            Analyze the following image of a cannabis plant.
            ${contextString}
            This is legal educational horticulture support. Do not provide illicit-use guidance.
            Based on the image and the detailed context, provide a comprehensive diagnosis.
            Return only valid JSON with this exact structure:
            { "title": "...", "content": "...", "confidence": 0.0, "immediateActions": "...", "longTermSolution": "...", "prevention": "...", "diagnosis": "..." }
        `

        const localizedPrompt = this.buildLocalizedEducationalPrompt(prompt, lang)

        try {
            return await this.diagnosePlantViaGemini(base64Image, mimeType, localizedPrompt)
        } catch (error) {
            console.error('Gemini diagnosePlant Error:', error)
            if (this.shouldUseLocalFallback(error)) {
                const localAiService = await getLocalAiService()
                return localAiService.diagnosePlant(base64Image, mimeType, plant, userNotes, lang)
            }
            this.rethrowKnownError(error, 'ai.error.diagnostics')
        }
    }

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        return this.getPlantNarrativeWithFallback(
            plant,
            lang,
            'getPlantAdvice',
            'ai.prompts.advisor',
            'ai.advisor',
            (localAiService, p, language) => localAiService.getPlantAdvice(p, language),
        )
    }

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        return this.getPlantNarrativeWithFallback(
            plant,
            lang,
            'getProactiveDiagnosis',
            'ai.prompts.proactiveDiagnosis',
            'ai.proactiveDiagnosis',
            (localAiService, p, language) => localAiService.getProactiveDiagnosis(p, language),
        )
    }

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language,
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        const { prompt, ragContext } = this.buildMentorPrompt(plant, query, t)

        try {
            if (this.isAlternateProvider()) {
                return await this.getMentorResponseFromAlternateProvider(prompt, lang)
            }

            return await this.getMentorResponseFromGemini(prompt, lang)
        } catch (error) {
            console.error('Gemini getMentorResponse Error:', error)
            if (this.shouldUseLocalFallback(error)) {
                const localAiService = await getLocalAiService()
                return localAiService.getMentorResponse(plant, query, lang, ragContext)
            }
            this.rethrowKnownError(error, 'ai.error.generic')
        }
    }

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language,
    ): Promise<StructuredGrowTips> {
        const t = getT()
        const localizedPrompt = this.buildStrainTipsLocalizedPrompt(strain, context, lang, t)
        try {
            if (this.isAlternateProvider()) {
                return await this.getStrainTipsFromAlternateProvider(localizedPrompt, lang)
            }

            return await this.getStrainTipsFromGemini(localizedPrompt)
        } catch (e) {
            console.error('Gemini getStrainTips Error:', e)
            if (this.shouldUseLocalFallback(e)) {
                const localAiService = await getLocalAiService()
                return localAiService.getStrainTips(strain, context, lang)
            }
            this.rethrowKnownError(e, 'ai.error.tips')
        }
    }

    async generateStrainImage(
        strain: Strain,
        style: ImageStyle,
        criteria: ImageCriteria,
    ): Promise<string> {
        const selectedStyle = this.resolveImageStyle(style)
        const prompt = this.buildStrainImagePrompt(strain, selectedStyle, criteria)

        try {
            aiRateLimiter.acquireSlot('generateStrainImage')
            const ai = await this.getAi()
            const response = await this.generateWithFallback({
                ai,
                model: 'gemini-2.0-flash-preview-image-generation',
                fallbackModel: 'gemini-2.0-flash-exp-image-generation',
                contents: {
                    parts: [
                        {
                            text: prompt,
                        },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            })

            return this.extractGeneratedImageDataOrThrow(response)
        } catch (error) {
            console.error('Gemini generateStrainImage Error:', error)
            this.rethrowKnownError(error, 'ai.error.generic')
        }
    }

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        const t = getT()
        const compactPlant = createCompactPlantSnapshot(plant)
        const prompt = t('ai.prompts.deepDive', {
            topic,
            plant: JSON.stringify(compactPlant),
        })
        const localizedPrompt = createLocalizedPrompt(
            `${getEducationalUseOnlyInstruction(lang)}\n\n${prompt}`,
            lang,
        )
        try {
            if (this.isAlternateProvider()) {
                return await this.generateDeepDiveFromAlternateProvider(localizedPrompt, lang)
            }

            return await this.generateDeepDiveFromGemini(localizedPrompt)
        } catch (e) {
            console.error('Gemini generateDeepDive Error:', e)
            if (this.shouldUseLocalFallback(e)) {
                const localAiService = await getLocalAiService()
                return localAiService.generateDeepDive(topic, plant, lang)
            }
            this.rethrowKnownError(e, 'ai.error.deepDive')
        }
    }

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        const t = getT()
        const plantSummaries = this.buildGardenPlantSummaries(plants, t)

        const prompt = t('ai.prompts.gardenStatus', { summaries: plantSummaries })

        return this.runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await this.generateText(prompt, lang, 'getGardenStatusSummary')
                return { title: t('plantsView.gardenVitals.aiStatusTitle'), content: responseText }
            },
            async (localAiService) => {
                return localAiService.getGardenStatusSummary(plants, lang)
            },
        )
    }

    async getGrowLogRagAnswer(plants: Plant[], query: string, lang: Language): Promise<AIResponse> {
        const prompt = this.buildGrowLogRagPrompt(plants, query)

        return this.runWithLocalFallback<AIResponse>(
            async () => {
                const responseText = await this.generateText(prompt, lang, 'getGrowLogRagAnswer')
                return {
                    title: lang === 'de' ? 'RAG Grow-Log Analyse' : 'RAG Grow Log Analysis',
                    content: responseText,
                }
            },
            async (localAiService) => {
                return localAiService.getGrowLogRagAnswer(plants, query, lang)
            },
        )
    }

    getDynamicLoadingMessages({
        useCase,
        data,
    }: {
        useCase: string
        data?: Record<string, unknown>
    }): string[] {
        const t = getT()
        const messagesResult = t(`ai.loading.${useCase}`, {
            ...data,
            returnObjects: true,
        })
        return this.mapDynamicLoadingMessages(messagesResult)
    }

    async getNutrientRecommendation(
        context: NutrientRecommendationInput,
        lang: Language,
    ): Promise<string> {
        const t = getT()
        const prompt = this.buildNutrientPlannerPrompt(context, t)

        return this.generateText(prompt, lang, 'getNutrientRecommendation')
    }
}

export const geminiService = new GeminiService()
