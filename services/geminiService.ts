import { GoogleGenAI, GenerateContentResponse, Type, FunctionDeclaration } from '@google/genai'
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
} from '@/types'
import { getT } from '@/i18n'

const formatPlantContextForPrompt = (
    plant: Plant,
    t: (key: string, options?: Record<string, any>) => string
): string => {
    const stageDetails = t(`plantStages.${plant.stage}`)
    const problems =
        plant.problems.length > 0
            ? plant.problems
                  .map((p) =>
                      t(
                          `problemMessages.${
                              p.type.charAt(0).toLowerCase() + p.type.slice(1)
                          }.message`
                      )
                  )
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

const createLocalizedPrompt = (basePrompt: string, lang: Language): string => {
    const languageInstruction =
        lang === 'de'
            ? 'WICHTIG: Deine gesamte Antwort muss ausschließlich auf Deutsch (de-DE) sein.'
            : 'IMPORTANT: Your entire response must be exclusively in English (en-US).'

    return `${languageInstruction}\n\n${basePrompt}`
}

class GeminiService {
    private ai: GoogleGenAI

    constructor() {
        if (!process.env.API_KEY) {
            throw new Error('API_KEY environment variable not set')
        }
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY })
    }

    private async generateText(prompt: string, lang: Language): Promise<string> {
        try {
            const localizedPrompt = createLocalizedPrompt(prompt, lang)
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
            })
            return response.text
        } catch (error) {
            console.error('Gemini API Error:', error)
            throw new Error('ai.error.generic')
        }
    }

    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        const t = getT()
        try {
            const systemInstruction = t('ai.prompts.equipmentSystemInstruction')
            const localizedSystemInstruction = createLocalizedPrompt(systemInstruction, lang)

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: localizedSystemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
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
                    },
                },
            })

            return JSON.parse(response.text.trim()) as Recommendation
        } catch (error) {
            console.error('Gemini getEquipmentRecommendation Error:', error)
            throw new Error('ai.error.equipment')
        }
    }

    async diagnosePlant(
        base64Image: string,
        mimeType: string,
        plant: Plant,
        userNotes: string,
        lang: Language
    ): Promise<PlantDiagnosisResponse> {
        const t = getT()
        const problems =
            plant.problems.length > 0
                ? plant.problems
                      .map((p) =>
                          t(
                              `problemMessages.${
                                  p.type.charAt(0).toLowerCase() + p.type.slice(1)
                              }.message`,
                              p.type
                          )
                      )
                      .join(', ')
                : t('common.none')

        const contextString = `
PLANT CONTEXT:
- Strain: ${plant.strain.name} (${plant.strain.type})
- Age: ${plant.age} days (Stage: ${t(`plantStages.${plant.stage}`)})
- Active Issues: ${problems}
- Medium Vitals: pH ${plant.medium.ph.toFixed(2)}, EC ${plant.medium.ec.toFixed(2)}
- Environment Vitals: Temp ${plant.environment.internalTemperature.toFixed(
            1
        )}°C, Humidity ${plant.environment.internalHumidity.toFixed(1)}%
- USER NOTES: "${userNotes || 'None provided'}"
        `.trim()

        const prompt = `
            Analyze the following image of a cannabis plant.
            ${contextString}
            Based on the image and the detailed context, provide a comprehensive diagnosis.
            Respond in JSON format only, adhering strictly to the provided schema. The schema is: { "title": "string", "confidence": "number (0.0-1.0)", "diagnosis": "string", "immediateActions": "string (markdown)", "longTermSolution": "string (markdown)", "prevention": "string (markdown)" }.
        `

        const localizedPrompt = createLocalizedPrompt(prompt, lang)

        try {
            const imagePart = { inlineData: { data: base64Image, mimeType } }
            const textPart = { text: localizedPrompt }

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
            })

            return JSON.parse(response.text.trim()) as PlantDiagnosisResponse
        } catch (error) {
            console.error('Gemini diagnosePlant Error:', error)
            throw new Error('ai.error.diagnostics')
        }
    }

    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        const t = getT()
        const plantContext = formatPlantContextForPrompt(plant, t)
        const prompt = t('ai.prompts.advisor', { plant: plantContext })
        const responseText = await this.generateText(prompt, lang)
        return { title: t('ai.advisor'), content: responseText }
    }

    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        const t = getT()
        const plantContext = formatPlantContextForPrompt(plant, t)
        const prompt = t('ai.prompts.proactiveDiagnosis', { plant: plantContext })
        const responseText = await this.generateText(prompt, lang)
        return { title: t('ai.proactiveDiagnosis'), content: responseText }
    }

    async getMentorResponse(
        plant: Plant,
        query: string,
        lang: Language
    ): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT()
        const plantContext = formatPlantContextForPrompt(plant, t)
        const prompt = t('ai.prompts.mentor.main', {
            context: plantContext,
            query: query,
        })

        try {
            const systemInstruction = t('ai.prompts.mentor.systemInstruction')
            const localizedSystemInstruction = createLocalizedPrompt(systemInstruction, lang)
            const localizedPrompt = createLocalizedPrompt(prompt, lang)
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
                config: {
                    systemInstruction: localizedSystemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            uiHighlights: {
                                type: Type.ARRAY,
                                nullable: true,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        elementId: { type: Type.STRING },
                                        plantId: { type: Type.STRING, nullable: true },
                                    },
                                    required: ['elementId'],
                                },
                            },
                        },
                        required: ['title', 'content'],
                    },
                },
            })

            return JSON.parse(response.text.trim()) as Omit<MentorMessage, 'role'>
        } catch (error) {
            console.error('Gemini getMentorResponse Error:', error)
            throw new Error('ai.error.generic')
        }
    }

    async getStrainTips(
        strain: Strain,
        context: { focus: string; stage: string; experience: string },
        lang: Language
    ): Promise<StructuredGrowTips> {
        const t = getT()
        const prompt = t('ai.prompts.strainTips', {
            strain: JSON.stringify(strain),
            focus: context.focus,
            stage: context.stage,
            experience: context.experience,
        })
        const localizedPrompt = createLocalizedPrompt(prompt, lang)
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            nutrientTip: { type: Type.STRING },
                            trainingTip: { type: Type.STRING },
                            environmentalTip: { type: Type.STRING },
                            proTip: { type: Type.STRING },
                        },
                        required: ['nutrientTip', 'trainingTip', 'environmentalTip', 'proTip'],
                    },
                },
            })

            return JSON.parse(response.text.trim()) as StructuredGrowTips
        } catch (e) {
            console.error('Gemini getStrainTips Error:', e)
            throw new Error('ai.error.tips')
        }
    }

    async generateStrainImage(strainName: string, lang: Language): Promise<string> {
        const t = getT()
        const prompt = t('ai.prompts.strainImage', { strainName })

        try {
            const response = await this.ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            })

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes: string = response.generatedImages[0].image.imageBytes
                return base64ImageBytes
            } else {
                throw new Error('No image was generated by the API.')
            }
        } catch (error) {
            console.error('Gemini generateStrainImage Error:', error)
            throw new Error('ai.error.generic')
        }
    }

    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        const t = getT()
        const prompt = t('ai.prompts.deepDive', {
            topic,
            plant: JSON.stringify(plant),
        })
        const localizedPrompt = createLocalizedPrompt(prompt, lang)
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
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
                    },
                },
            })

            return JSON.parse(response.text.trim()) as DeepDiveGuide
        } catch (e) {
            console.error('Gemini generateDeepDive Error:', e)
            throw new Error('ai.error.deepDive')
        }
    }

    getDynamicLoadingMessages({
        useCase,
        data,
    }: {
        useCase: string
        data?: Record<string, any>
    }): string[] {
        const t = getT()
        const messagesResult = t(`ai.loading.${useCase}`, {
            ...data,
            returnObjects: true,
        })

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
}

export const geminiService = new GeminiService()