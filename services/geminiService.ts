import {
    GoogleGenAI,
    GenerateContentResponse,
    Type,
    FunctionDeclaration,
} from '@google/genai';
// FIX: Corrected import path for types to use the '@/' alias.
import { Plant, Recommendation, Strain, PlantDiagnosisResponse, AIResponse, StructuredGrowTips, DeepDiveGuide, MentorMessage, Language } from '@/types';
import { getT } from '@/i18n';

const formatPlantContextForPrompt = (plant: Plant, t: (key: string, options?: any) => string): string => {
    const stageDetails = t(`plantStages.${plant.stage}`);
    const problems = plant.problems.length > 0
        ? plant.problems.map(p => t(`problemMessages.${p.type.charAt(0).toLowerCase() + p.type.slice(1)}.message`)).join(', ')
        : t('common.none');

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

const createLocalizedPrompt = (basePrompt: string, lang: Language): string => {
  const languageInstruction = lang === 'de'
    ? "WICHTIG: Deine gesamte Antwort muss ausschließlich auf Deutsch (de-DE) sein."
    : "IMPORTANT: Your entire response must be exclusively in English (en-US).";
  
  return `${languageInstruction}\n\n${basePrompt}`;
};


class GeminiService {
    private ai: GoogleGenAI;

    constructor() {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    private async generateText(prompt: string, lang: Language): Promise<string> {
        try {
            const localizedPrompt = createLocalizedPrompt(prompt, lang);
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
            });
            return response.text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error('ai.error.generic');
        }
    }

    async getEquipmentRecommendation(prompt: string, lang: Language): Promise<Recommendation> {
        const t = getT();
        try {
            const systemInstruction = t('ai.prompts.equipmentSystemInstruction');
            const localizedSystemInstruction = createLocalizedPrompt(systemInstruction, lang);
            const localizedPrompt = createLocalizedPrompt(prompt, lang);
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: localizedPrompt,
                config: {
                    systemInstruction: localizedSystemInstruction,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tent: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            light: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING }, watts: { type: Type.NUMBER } } },
                            ventilation: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            circulationFan: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            pots: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            soil: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            nutrients: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            extra: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } } },
                            proTip: { type: Type.STRING }
                        }
                    }
                }
            });
            return JSON.parse(response.text) as Recommendation;
        } catch (error) {
            console.error('Gemini getEquipmentRecommendation Error:', error);
            throw new Error('ai.error.equipment');
        }
    }
    
    async diagnosePlant(base64Image: string, mimeType: string, plant: Plant, userNotes: string, lang: Language): Promise<PlantDiagnosisResponse> {
        const t = getT();
        const problems = plant.problems.length > 0
            ? plant.problems.map(p => t(`problemMessages.${p.type.charAt(0).toLowerCase() + p.type.slice(1)}.message`, p.type)).join(', ')
            : t('common.none');

        const contextString = `
PLANT CONTEXT:
- Strain: ${plant.strain.name} (${plant.strain.type})
- Age: ${plant.age} days (Stage: ${t(`plantStages.${plant.stage}`)})
- Active Issues: ${problems}
- Substrate Vitals: pH ${plant.substrate.ph.toFixed(2)}, EC ${plant.substrate.ec.toFixed(2)}
- Environment Vitals: Temp ${plant.environment.internalTemperature.toFixed(1)}°C, Humidity ${plant.environment.internalHumidity.toFixed(1)}%
- USER NOTES: "${userNotes || 'None provided'}"
        `.trim();

        const prompt = `
            Analyze the following image of a cannabis plant.
            ${contextString}
            Based on the image and the detailed context, provide a comprehensive diagnosis.
            Respond in JSON format only, adhering strictly to the provided schema.
        `;
        
        const localizedPrompt = createLocalizedPrompt(prompt, lang);

        try {
            const imagePart = { inlineData: { data: base64Image, mimeType } };
            const textPart = { text: localizedPrompt };

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
                        },
                        required: ['title', 'confidence', 'diagnosis', 'immediateActions', 'longTermSolution', 'prevention']
                    }
                }
            });
            return JSON.parse(response.text) as PlantDiagnosisResponse;
        } catch (error) {
            console.error('Gemini diagnosePlant Error:', error);
            throw new Error('ai.error.diagnostics');
        }
    }
    
    async getPlantAdvice(plant: Plant, lang: Language): Promise<AIResponse> {
        const t = getT();
        // FIX: Pass a structured object for interpolation instead of a stringified object.
        const prompt = t('ai.prompts.advisor', {
            plant: { 
                name: plant.name, 
                age: plant.age, 
                stage: plant.stage, 
                problems: plant.problems, 
                vitals: plant.substrate 
            }
        });
        const responseText = await this.generateText(prompt, lang);
        return { title: t('ai.advisor'), content: responseText };
    }
    
    async getProactiveDiagnosis(plant: Plant, lang: Language): Promise<AIResponse> {
        const t = getT();
        const prompt = t('ai.prompts.proactiveDiagnosis', {
            plant: JSON.stringify(plant, null, 2)
        });
        const responseText = await this.generateText(prompt, lang);
        return { title: t('ai.proactiveDiagnosis'), content: responseText };
    }

    async getMentorResponse(plant: Plant, query: string, lang: Language): Promise<Omit<MentorMessage, 'role'>> {
        const t = getT();
        const plantContext = formatPlantContextForPrompt(plant, t);
        const prompt = t('ai.prompts.mentor.main', {
            context: plantContext,
            query: query
        });

        try {
            const systemInstruction = t('ai.prompts.mentor.systemInstruction');
            const localizedSystemInstruction = createLocalizedPrompt(systemInstruction, lang);
            const localizedPrompt = createLocalizedPrompt(prompt, lang);
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
                                        plantId: { type: Type.STRING },
                                    }
                                }
                            }
                        }
                    }
                }
            });
            return JSON.parse(response.text) as Omit<MentorMessage, 'role'>;
        } catch (error) {
            console.error('Gemini getMentorResponse Error:', error);
            throw new Error('ai.error.generic');
        }
    }

    async getStrainTips(strain: Strain, context: { focus: string, stage: string, experience: string }, lang: Language): Promise<StructuredGrowTips> {
        const t = getT();
        const prompt = t('ai.prompts.strainTips', {
            strain: JSON.stringify(strain),
            focus: context.focus,
            stage: context.stage,
            experience: context.experience
        });
        const localizedPrompt = createLocalizedPrompt(prompt, lang);
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
                        }
                    }
                }
            });
            return JSON.parse(response.text) as StructuredGrowTips;
        } catch(e) {
             console.error('Gemini getStrainTips Error:', e);
            throw new Error('ai.error.tips');
        }
    }
    
    async generateDeepDive(topic: string, plant: Plant, lang: Language): Promise<DeepDiveGuide> {
        const t = getT();
        const prompt = t('ai.prompts.deepDive', { topic, plant: JSON.stringify(plant) });
        const localizedPrompt = createLocalizedPrompt(prompt, lang);
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
                            prosAndCons: { type: Type.OBJECT, properties: { pros: { type: Type.ARRAY, items: { type: Type.STRING } }, cons: { type: Type.ARRAY, items: { type: Type.STRING } } } },
                            proTip: { type: Type.STRING },
                        }
                    }
                }
            });
            return JSON.parse(response.text) as DeepDiveGuide;
        } catch(e) {
            console.error('Gemini generateDeepDive Error:', e);
            throw new Error('ai.error.deepDive');
        }
    }
    
    getDynamicLoadingMessages({ useCase, data }: { useCase: string; data?: Record<string, any> }): string[] {
        const t = getT();
        const messages = t(`ai.loading.${useCase}`, { ...data, returnObjects: true });
        return Array.isArray(messages) ? messages : [String(messages)];
    }
}

export const geminiService = new GeminiService();