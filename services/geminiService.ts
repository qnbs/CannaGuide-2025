import { GoogleGenAI, GenerateContentResponse, Type, Modality } from '@google/genai'
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
                  .map((p) => {
                      const problemKey = p.type.toLowerCase().replace(/_(\w)/g, (_: string, c: string) => c.toUpperCase());
                      return t(`problemMessages.${problemKey}.message`);
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

const createLocalizedPrompt = (basePrompt: string, lang: Language): string => {
    const languageInstruction =
        lang === 'de'
            ? 'WICHTIG: Deine gesamte Antwort muss ausschließlich auf Deutsch (de-DE) sein.'
            : 'IMPORTANT: Your entire response must be exclusively in English (en-US).'

    return `${languageInstruction}\n\n${basePrompt}`
}

type ImageCriteria = { focus: string; composition: string; mood: string };
type ImageStyle = 'random' | 'fantasy' | 'botanical' | 'psychedelic' | 'macro' | 'cyberpunk';
const availableStyles: ImageStyle[] = ['fantasy', 'botanical', 'psychedelic', 'macro', 'cyberpunk'];


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
                      .map((p) => {
                          const problemKey = p.type.toLowerCase().replace(/_(\w)/g, (_: string, c: string) => c.toUpperCase());
                          return t(`problemMessages.${problemKey}.message`);
                      })
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
            Based on the image and the detailed context, provide a comprehensive diagnosis. Your response must be a JSON object with the following structure: { "title": "A short, clear title for the diagnosis (e.g., 'Early Nitrogen Deficiency').", "content": "The main diagnosis text, explaining what the issue appears to be based on the visual evidence and data provided.", "confidence": "A value from 0.0 to 1.0 indicating your confidence in the diagnosis.", "immediateActions": "Markdown formatted string of immediate, actionable steps the user should take within the next 24-48 hours.", "longTermSolution": "Markdown formatted string explaining the long-term solution or adjustments needed to fix the root cause.", "prevention": "Markdown formatted string with advice on how to prevent this issue in the future." }.
        `

        const localizedPrompt = createLocalizedPrompt(prompt, lang)

        try {
            const imagePart = { inlineData: { data: base64Image, mimeType } }
            const textPart = { text: localizedPrompt }

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
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
                        required: ['title', 'content', 'confidence', 'immediateActions', 'longTermSolution', 'prevention', 'diagnosis'],
                    }
                },
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
        context: { focus: string; stage: string; experienceLevel: string },
        lang: Language
    ): Promise<StructuredGrowTips> {
        const t = getT()
        const prompt = t('ai.prompts.strainTips', {
            strain: JSON.stringify(strain),
            focus: context.focus,
            stage: context.stage,
            experienceLevel: context.experienceLevel,
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

    async generateStrainImage(strain: Strain, style: ImageStyle, criteria: ImageCriteria): Promise<string> {
        const systemPrompt = `You are an advanced image generation AI. Your task is to produce a single, high-fidelity, visually stunning, and contextually accurate image based on the user's detailed prompt. Adhere strictly to all instructions, especially regarding style, subject, and mood. Interpret prompts artistically but precisely.`;
        
        let selectedStyle = style;
        if (selectedStyle === 'random') {
            selectedStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)];
        }
        
        const stylePrompts: Record<Exclude<ImageStyle, 'random'>, string> = {
            fantasy: `A stunning, artistic, and imaginative fantasy illustration representing the cannabis strain '${strain.name}'. The style should be vibrant and impressive, with ethereal, magical lighting.`,
            botanical: `A detailed vintage botanical illustration of the cannabis strain '${strain.name}'. The style should mimic a 19th-century scientific drawing with fine ink lines, delicate watercolor washes, and annotations on aged, parchment-like paper. Focus on realism and anatomical accuracy.`,
            psychedelic: `A vibrant, psychedelic art piece inspired by the cannabis strain '${strain.name}'. The style should be reminiscent of 1960s poster art, featuring swirling patterns, kaleidoscopic visuals, bold neon colors, and abstract, flowing shapes. Trippy and mesmerizing.`,
            macro: `An ultra-realistic, professional macro photograph of a perfect cannabis bud from the strain '${strain.name}'. Focus on the intricate details: glistening trichomes, vibrant pistils, and complex textures. Use dramatic studio lighting to create depth. The background should be clean and dark.`,
            cyberpunk: `A high-tech, cyberpunk-style hologram of the cannabis strain '${strain.name}'. The plant should be rendered as a glowing, neon-blue and purple wireframe or semi-translucent light form, projected into a dark, futuristic scene. Incorporate glitch effects and scan lines for a high-tech feel.`
        };

        const criteriaPrompts = {
            focus: {
                buds: 'The main focus is a close-up on the detailed structure of the flower buds.',
                plant: 'The composition features the entire plant, showcasing its overall shape and structure.',
                abstract: 'The image is an abstract representation of the strain\'s essence, not a literal plant.'
            },
            composition: {
                symmetrical: 'The composition is balanced and formally symmetrical.',
                dynamic: 'The composition is dynamic, using strong diagonal lines and a sense of movement.',
                minimalist: 'The composition is minimalist, with a single subject against a simple, clean background.'
            },
            mood: {
                mystical: 'The overall mood is mystical, dark, and enigmatic.',
                energetic: 'The overall mood is bright, energetic, and vibrant.',
                calm: 'The overall mood is calm, serene, and peaceful.'
            }
        };

        const strainSpecificPrompt = stylePrompts[selectedStyle as Exclude<ImageStyle, 'random'>];
        const criteriaString = `
            Artistic Direction:
            - Focus: ${criteriaPrompts.focus[criteria.focus as keyof typeof criteriaPrompts.focus]}
            - Composition: ${criteriaPrompts.composition[criteria.composition as keyof typeof criteriaPrompts.composition]}
            - Mood: ${criteriaPrompts.mood[criteria.mood as keyof typeof criteriaPrompts.mood]}
            - Integrate the strain's name '${strain.name}' creatively and elegantly into the artwork itself, for example as subtle typography, glowing runes, or part of a natural pattern.
        `;

        const prompt = `${systemPrompt}\n\n---\n\nEXECUTE THE FOLLOWING PROMPT:\n\n${strainSpecificPrompt}\n\n${criteriaString}`;


        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
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
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart && imagePart.inlineData) {
                return imagePart.inlineData.data;
            }
            
            throw new Error('No image was generated by the API.')
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
                model: 'gemini-2.5-pro',
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

    async getGardenStatusSummary(plants: Plant[], lang: Language): Promise<AIResponse> {
        const t = getT();
        const plantSummaries = plants.map(p => 
            `- ${p.name} (${t('plantsView.plantCard.day')} ${p.age}, ${t(`plantStages.${p.stage}`)}): Health ${p.health.toFixed(0)}%, Stress ${p.stressLevel.toFixed(0)}%. Problems: ${p.problems.length > 0 ? p.problems.map(prob => prob.type).join(', ') : 'None'}`
        ).join('\n');
        
        const prompt = t('ai.prompts.gardenStatus', { summaries: plantSummaries });

        const responseText = await this.generateText(prompt, lang);
        return { title: t('plantsView.gardenVitals.aiStatusTitle'), content: responseText };
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
