import {
    GoogleGenAI,
    GenerateContentResponse,
    Type
} from "@google/genai";
import { Plant, Strain, Recommendation, AIResponse, PlantDiagnosisResponse, MentorMessage, StructuredGrowTips, DeepDiveGuide } from "@/types";

type TFunction = (key: string, params?: Record<string, any>) => any;

const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

const parseJsonResponse = <T>(text: string, t: TFunction): T => {
    try {
        // The response may be wrapped in markdown JSON block, so we strip it.
        const jsonString = text.replace(/^```json\n/, '').replace(/\n```$/, '');
        return JSON.parse(jsonString) as T;
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", text, e);
        throw new Error('ai.error.parsing');
    }
};

const getEquipmentRecommendation = async (userPrompt: string, t: TFunction): Promise<Recommendation> => {
    const fullPrompt = `${userPrompt}\n${t('ai.gemini.equipmentPromptSuffix')}`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: { responseMimeType: 'application/json' }
    });
    return parseJsonResponse<Recommendation>(response.text, t);
};

const diagnosePlant = async (base64Image: string, mimeType: string, context: any, t: TFunction): Promise<PlantDiagnosisResponse> => {
    const prompt = t('ai.gemini.diagnosePrompt', { context: JSON.stringify(context) });
    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Image,
        },
    };
    const textPart = { text: prompt };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    confidence: { type: Type.NUMBER },
                    diagnosis: { type: Type.STRING },
                    immediateActions: { type: Type.STRING },
                    longTermSolution: { type: Type.STRING },
                    prevention: { type: Type.STRING },
                },
                required: ['title', 'confidence', 'diagnosis', 'immediateActions', 'longTermSolution', 'prevention']
            }
        }
    });
    
    return parseJsonResponse<PlantDiagnosisResponse>(response.text, t);
};

const getPlantAdvice = async (plant: Plant, t: TFunction): Promise<AIResponse> => {
    const plantData = {
        age: plant.age,
        stage: plant.stage,
        height: plant.height,
        health: plant.health,
        stressLevel: plant.stressLevel,
        vitals: plant.vitals,
        environment: plant.environment,
        substrate: plant.substrate,
        problems: plant.problems,
        journal: plant.journal.slice(-5) // last 5 entries
    };

    const prompt = t('ai.gemini.advisorQuery', { data: JSON.stringify(plantData, null, 2) });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJsonResponse<AIResponse>(response.text, t);
};

const getMentorResponse = async (plant: Plant, query: string, t: TFunction): Promise<Omit<MentorMessage, 'role'>> => {
    const systemInstruction = t('ai.gemini.mentorSystemInstruction');
    const fullQuery = `Plant Context: ${plant.name}, Age: ${plant.age} days, Stage: ${plant.stage}. User Query: ${query}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullQuery,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json'
        }
    });

    return parseJsonResponse<Omit<MentorMessage, 'role'>>(response.text, t);
};

const getStrainTips = async (strain: Strain, context: { focus: string, stage: string, experience: string }, t: TFunction): Promise<StructuredGrowTips> => {
    const prompt = t('ai.gemini.strainTipsPrompt', {
        name: strain.name,
        type: strain.type,
        difficulty: strain.agronomic.difficulty,
        height: strain.agronomic.height,
        flowering: strain.floweringTime,
        ...context
    });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJsonResponse<StructuredGrowTips>(response.text, t);
};

const generateDeepDive = async (topic: string, plant: Plant, t: TFunction): Promise<DeepDiveGuide> => {
    const plantContext = JSON.stringify({ name: plant.name, stage: plant.stage, age: plant.age });
    const prompt = t('ai.gemini.deepDivePrompt', { topic, plantContext });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return parseJsonResponse<DeepDiveGuide>(response.text, t);
};

const getDynamicLoadingMessages = (context: { useCase: string, data?: any }, t: TFunction): string[] => {
    const { useCase, data } = context;
    switch(useCase) {
        case 'equipment': return [
            t('ai.loading.equipment.analyzing'),
            t('ai.loading.equipment.selecting'),
            t('ai.loading.equipment.finalizing')
        ];
        case 'diagnostics': return [
            t('ai.loading.diagnostics.receiving'),
            t('ai.loading.diagnostics.analyzing'),
            t('ai.loading.diagnostics.identifying'),
            t('ai.loading.diagnostics.formulating')
        ];
        case 'mentor': return [
            t('ai.loading.mentor.processing', { query: data.query }),
            t('ai.loading.mentor.searching'),
            t('ai.loading.mentor.compiling')
        ];
        case 'advisor': return [
            t('ai.loading.advisor.analyzing', { stage: t(`plantStages.${data.plant.stage}`) }),
            t('ai.loading.advisor.vitals', { ph: data.plant.substrate.ph.toFixed(1), ec: data.plant.substrate.ec.toFixed(1) }),
            t('ai.loading.advisor.problems', { count: data.plant.problems.filter((p: any) => p.status === 'active').length }),
            t('ai.loading.advisor.formulating')
        ];
        case 'growTips': return [
             t('ai.loading.growTips.analyzing', { name: data.strainName }),
             t('ai.loading.growTips.focusing', { focus: data.focus }),
             t('ai.loading.growTips.consulting'),
             t('ai.loading.growTips.formulating', { stage: data.stage })
        ];
        case 'deepDive': return [
            t('ai.loading.deepDive.analyzing', { topic: data.topic }),
            t('ai.loading.deepDive.context', { name: data.plantName }),
            t('ai.loading.deepDive.generating'),
            t('ai.loading.deepDive.compiling')
        ];
        default: return [t('ai.generating')];
    }
};

export const geminiService = {
    getEquipmentRecommendation,
    diagnosePlant,
    getPlantAdvice,
    getMentorResponse,
    getStrainTips,
    generateDeepDive,
    getDynamicLoadingMessages,
};
