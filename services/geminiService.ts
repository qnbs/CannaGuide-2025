import {
    GoogleGenAI,
    GenerateContentResponse,
    Type,
    FunctionDeclaration,
} from '@google/genai';
import { Plant, Recommendation, Strain, PlantDiagnosisResponse, AIResponse, StructuredGrowTips, DeepDiveGuide, MentorMessage } from '../types';
import { getT } from '../i18n';

const formatPlantContextForPrompt = (plant: Plant, t: (key: string, options?: any) => string): string => {
    const stageDetails = t(`plantStages.${plant.stage}`, { returnObjects: true });
    const problems = plant.problems.length > 0
        ? plant.problems.map(p => t(`problemMessages.${p.type.charAt(0).toLowerCase() + p.type.slice(1)}.message`)).join(', ')
        : 'None';

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

SUBSTRATE & ROOTS
-----------------
pH: ${plant.substrate.ph.toFixed(2)}
EC: ${plant.substrate.ec.toFixed(2)}
Moisture: ${plant.substrate.moisture.toFixed(1)}%
Root Health: ${plant.rootSystem.health.toFixed(1)}%

ACTIVE ISSUES
-------------
${problems}
    `.trim();
};


class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    private async generateText(prompt: string): Promise<string> {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            return response.text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('ai.error.generic');
        }
    }

    async getEquipmentRecommendation(prompt: string): Promise<Recommendation> {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tent: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            light: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING }, watts: { type: Type.NUMBER } } },
                            ventilation: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            pots: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            soil: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            nutrients: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            extra: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                        }
                    }
                }
            });
            return JSON.parse(response.text);
        } catch (error) {
            console.error('Gemini getEquipmentRecommendation Error:', error);
            throw new Error('ai.error.equipment');
        }
    }
    
    async diagnosePlant(base64Image: string, mimeType: string, context: any): Promise<PlantDiagnosisResponse> {
        const t = getT();
        const prompt = `
            Analyze this image of a cannabis plant leaf/area.
            Context: ${JSON.stringify(context)}.
            Based on the image and context, provide a diagnosis.
            Respond in JSON format only.
        `;

        try {
            const imagePart = { inlineData: { data: base64Image, mimeType } };
            const textPart = { text: prompt };

            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: t('ai.schemas.diagnostics.title') },
                            confidence: { type: Type.NUMBER, description: t('ai.schemas.diagnostics.confidence') },
                            diagnosis: { type: Type.STRING, description: t('ai.schemas.diagnostics.diagnosis') },
                            immediateActions: { type: Type.STRING, description: t('ai.schemas.diagnostics.immediateActions') },
                            longTermSolution: { type: Type.STRING, description: t('ai.schemas.diagnostics.longTermSolution') },
                            prevention: { type: Type.STRING, description: t('ai.schemas.diagnostics.prevention') },
                        }
                    }
                }
            });
            return JSON.parse(response.text);
        } catch (error) {
            console.error('Gemini diagnosePlant Error:', error);
            throw new Error('ai.error.diagnostics');
        }
    }
    
    async getPlantAdvice(plant: Plant): Promise<AIResponse> {
        const t = getT();
        const prompt = t('ai.prompts.advisor', {
            plant: JSON.stringify({ name: plant.name, age: plant.age, stage: plant.stage, problems: plant.problems, vitals: plant.substrate })
        });
        const responseText = await this.generateText(prompt);
        return { title: t('ai.advisor'), content: responseText };
    }
    
    async getProactiveDiagnosis(plant: Plant): Promise<AIResponse> {
        const t = getT();
        const prompt = t('ai.prompts.proactiveDiagnosis', {
            plant: JSON.stringify(plant, null, 2)
        });
        const responseText = await this.generateText(prompt);
        return { title: t('ai.proactiveDiagnosis'), content: responseText };
    }

    async getMentorResponse(plant: Plant, query: string): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT();
        const plantContext = formatPlantContextForPrompt(plant, t);
        const prompt = t('ai.prompts.mentor.main', {
            context: plantContext,
            query: query
        });

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: t('ai.prompts.mentor.systemInstruction'),
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
                                        plantId: { type: Type.STRING },
                                    }
                                }
                            }
                        }
                    }
                }
            });
            return JSON.parse(response.text);
        } catch (error) {
            console.error('Gemini getMentorResponse Error:', error);
            throw new Error('ai.error.generic');
        }
    }

    async getStrainTips(strain: Strain, context: { focus: string, stage: string, experience: string }): Promise<StructuredGrowTips> {
        const t = getT();
        const prompt = t('ai.prompts.strainTips', {
            strain: JSON.stringify(strain),
            focus: context.focus,
            stage: context.stage,
            experience: context.experience
        });
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            nutrientTip: { type: Type.STRING },
                            trainingTip: { type: Type.STRING },
                            environmentalTip: { type: Type.STRING },
                            proTip: { type: Type.STRING },
                        }
                    }
                }
            });
            return JSON.parse(response.text);
        } catch(e) {
             console.error('Gemini getStrainTips Error:', e);
            throw new Error('ai.error.tips');
        }
    }
    
    async generateDeepDive(topic: string, plant: Plant): Promise<DeepDiveGuide> {
        const t = getT();
        const prompt = t('ai.prompts.deepDive', { topic, plant: JSON.stringify(plant) });
        try {
             const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            introduction: { type: Type.STRING },
                            stepByStep: { type: Type.ARRAY, items: { type: Type.STRING } },
                            prosAndCons: { type: Type.OBJECT, properties: { pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                            proTip: { type: Type.STRING },
                        }
                    }
                }
            });
            return JSON.parse(response.text);
        } catch(e) {
            console.error('Gemini generateDeepDive Error:', e);
            throw new Error('ai.error.deepDive');
        }
    }
    
    // FIX: Corrected function signature to accept a single object argument.
    getDynamicLoadingMessages({ useCase, data }: { useCase: string; data?: any }): string[] {
        const t = getT();
        // FIX: Ensure data is passed correctly to the translation function.
        const messages = t(`ai.loading.${useCase}`, { ...data, returnObjects: true });
        return Array.isArray(messages) ? messages : [String(messages)];
    }
}

export const geminiService = new GeminiService();
