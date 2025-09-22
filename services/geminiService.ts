import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Plant, Recommendation, AIResponse, Strain, PlantDiagnosisResponse } from '@/types';

const getAiClient = (): GoogleGenAI => {
    // As per guidelines, the API key must come from environment variables.
    // The app should not prompt the user for it.
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        throw new Error("ai.error.apiKey");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

type TFunction = (key: string, params?: Record<string, any>) => string;

type LoadingMessageContext = {
    useCase: 'equipment' | 'diagnostics' | 'mentor' | 'advisor' | 'growTips';
    data?: any;
};

const getDynamicLoadingMessages = (context: LoadingMessageContext, t: TFunction): string[] => {
    const { useCase, data } = context;

    const getMessageConfigs = (): { key: string; params?: Record<string, any> }[] => {
        switch (useCase) {
            case 'equipment':
                return [
                    { key: 'ai.loading.equipment.analyzing' },
                    { key: 'ai.loading.equipment.custom', params: { config: data.configName } },
                    { key: 'ai.loading.equipment.selecting' },
                    { key: 'ai.loading.equipment.finalizing' },
                ];
            case 'diagnostics':
                return [
                    { key: 'ai.loading.diagnostics.receiving' },
                    { key: 'ai.loading.diagnostics.analyzing' },
                    { key: 'ai.loading.diagnostics.identifying' },
                    { key: 'ai.loading.diagnostics.formulating' },
                ];
            case 'mentor':
                 return [
                    { key: 'ai.loading.mentor.processing', params: { query: data.query } },
                    { key: 'ai.loading.mentor.searching' },
                    { key: 'ai.loading.mentor.compiling' },
                 ];
            case 'advisor':
                const { plant } = data;
                return [
                    { key: 'ai.loading.advisor.analyzing', params: { stage: t(`plantStages.${plant.stage}`) } },
                    { key: 'ai.loading.advisor.vitals', params: { ph: plant.vitals.ph.toFixed(1), ec: plant.vitals.ec.toFixed(1) } },
                    { key: 'ai.loading.advisor.problems', params: { count: plant.problems.length } },
                    { key: 'ai.loading.advisor.formulating' },
                ];
             case 'growTips':
                return [
                    { key: 'ai.loading.growTips.analyzing' },
                    { key: 'ai.loading.growTips.consulting' },
                    { key: 'ai.loading.growTips.formulating' },
                ];
            default:
                return [{ key: `ai.generating` }];
        }
    };
    
    const messageConfigs = getMessageConfigs();
    return messageConfigs.map(config => t(config.key, config.params));
};


const getEquipmentRecommendation = async (promptDetails: string, t: TFunction): Promise<Recommendation> => {
    const ai = getAiClient();
    const prompt = `${promptDetails} ${t('ai.gemini.equipmentPromptSuffix')}`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            tent: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            light: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING }, watts: { type: Type.NUMBER } }, required: ['name', 'price', 'rationale'] },
            ventilation: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            pots: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            soil: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            nutrients: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            extra: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
        },
        required: ['tent', 'light', 'ventilation', 'pots', 'soil', 'nutrients', 'extra']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    try {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly to get the JSON string.
        const jsonStr = response.text;
        const result = JSON.parse(jsonStr);
        return result as Recommendation;
    } catch (e) {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly.
        console.error("Failed to parse AI response for equipment:", e, response.text);
        throw new Error("ai.error.parsing");
    }
};

const getAiMentorResponse = async (query: string, t: TFunction): Promise<AIResponse> => {
    const ai = getAiClient();
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
        },
        required: ['title', 'content']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: {
            systemInstruction: t('ai.gemini.mentorSystemInstruction'),
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    
    try {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly to get the JSON string.
        const jsonStr = response.text;
        const result = JSON.parse(jsonStr);
        return result as AIResponse;
    } catch (e) {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly.
        console.error("Failed to parse AI response for mentor:", e, response.text);
        throw new Error("ai.error.parsing");
    }
};

const diagnosePlantProblem = async (base64Image: string, mimeType: string, context: { plant?: Plant, userNotes?: string }, t: TFunction): Promise<PlantDiagnosisResponse> => {
    const ai = getAiClient();
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };

    let plantContext = t('ai.gemini.diagnosePrompt.noPlantContext');
    if (context.plant) {
        const relevantData = {
            strain: context.plant.strain.name,
            age: context.plant.age,
            stage: context.plant.stage,
            vitals: context.plant.vitals,
            environment: context.plant.environment,
            lastJournalEntries: context.plant.journal.slice(-3).map(e => `${e.type}: ${e.notes}`),
        };
        plantContext = `${t('ai.gemini.diagnosePrompt.plantContextPrefix')}: ${JSON.stringify(relevantData)}`;
    }
    if (context.userNotes) {
        plantContext += `\n${t('ai.gemini.diagnosePrompt.userNotesPrefix')}: "${context.userNotes}"`;
    }

    const textPart = {
        text: `${t('ai.gemini.diagnosePrompt.base')} ${plantContext}`,
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            problemName: { type: Type.STRING, description: 'The specific name of the diagnosed plant problem.' },
            confidence: { type: Type.NUMBER, description: 'A confidence score from 0 to 100 for the diagnosis.'},
            diagnosis: { type: Type.STRING, description: 'Detailed diagnosis in Markdown format.' },
            immediateActions: { type: Type.STRING, description: 'Bulleted list of immediate actions in Markdown.' },
            longTermSolution: { type: Type.STRING, description: 'Long-term solutions in Markdown.' },
            prevention: { type: Type.STRING, description: 'Prevention tips in Markdown.' },
        },
        required: ['problemName', 'confidence', 'diagnosis', 'immediateActions', 'longTermSolution', 'prevention']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    try {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly to get the JSON string.
        const jsonStr = response.text;
        const result = JSON.parse(jsonStr);
        return result as PlantDiagnosisResponse;
    } catch (e) {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly.
        console.error("Failed to parse AI response for diagnostics:", e, response.text);
        throw new Error("ai.error.parsing");
    }
};

const getAiPlantAdvisorResponse = async (plant: Plant, t: TFunction): Promise<AIResponse> => {
    const ai = getAiClient();
    const plantData = JSON.stringify({
        age: plant.age,
        stage: plant.stage,
        vitals: plant.vitals,
        environment: plant.environment,
        problems: plant.problems,
        journal: plant.journal.slice(-5) // last 5 entries
    });
    const prompt = t('ai.gemini.advisorQuery', { data: plantData });
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
        },
        required: ['title', 'content']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    try {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly to get the JSON string.
        const jsonStr = response.text;
        const result = JSON.parse(jsonStr);
        return result as AIResponse;
    } catch (e) {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly.
        console.error("Failed to parse AI response for advisor:", e, response.text);
        throw new Error("ai.error.parsing");
    }
};

const getStrainGrowTips = async (strain: Strain, t: TFunction): Promise<AIResponse> => {
    const ai = getAiClient();
    const prompt = t('ai.gemini.strainTipsQuery', {
        name: strain.name,
        difficulty: t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`),
        height: t(`strainsView.addStrainModal.heights.${strain.agronomic.height.toLowerCase()}`),
        flowering: strain.floweringTime,
        type: strain.type
    });
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
        },
        required: ['title', 'content']
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: t('ai.gemini.strainTipsSystemInstruction', { name: strain.name }),
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });
    
    try {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly to get the JSON string.
        const jsonStr = response.text;
        const result = JSON.parse(jsonStr);
        return result as AIResponse;
    } catch (e) {
        // @google/genai-sdk: Per guidelines, access text output via the .text property directly.
        console.error("Failed to parse AI response for grow tips:", e, response.text);
        throw new Error("ai.error.parsing");
    }
};

export const geminiService = {
    getDynamicLoadingMessages,
    getEquipmentRecommendation,
    getAiMentorResponse,
    diagnosePlantProblem,
    getAiPlantAdvisorResponse,
    getStrainGrowTips,
};