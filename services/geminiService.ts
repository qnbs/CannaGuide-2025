import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Plant, Recommendation, AIResponse, Strain, PlantDiagnosisResponse, StructuredGrowTips } from '@/types';

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
                    { key: 'ai.loading.advisor.vitals', params: { ph: plant.substrate.ph.toFixed(1), ec: plant.substrate.ec.toFixed(1) } },
                    { key: 'ai.loading.advisor.problems', params: { count: plant.problems.length } },
                    { key: 'ai.loading.advisor.formulating' },
                ];
             case 'growTips':
                return [
                    { key: 'ai.loading.growTips.analyzing', params: { name: data.strainName } },
                    { key: 'ai.loading.growTips.focusing', params: { focus: data.focus } },
                    { key: 'ai.loading.growTips.consulting' },
                    { key: 'ai.loading.growTips.formulating', params: { stage: data.stage } },
                ];
            default:
                return [{ key: `ai.generating` }];
        }
    };
    
    const messageConfigs = getMessageConfigs();
    return messageConfigs.map(config => t(config.key, config.params));
};


const getEquipmentRecommendation = async (promptDetails: string, t: TFunction): Promise<Recommendation> => {
    try {
        const ai = getAiClient();
        
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
            contents: promptDetails,
            config: {
                systemInstruction: t('ai.gemini.equipmentSystemInstruction'),
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonStr = response.text;
        if (!jsonStr || jsonStr.trim() === '') {
             console.error("AI returned an empty response for equipment:", response);
             throw new Error("ai.error.parsing");
        }
        const result = JSON.parse(jsonStr);
        return result as Recommendation;
    } catch (e) {
        console.error("Error getting equipment recommendation:", e);
        if (e instanceof Error && e.message.toLowerCase().includes('json')) {
            throw new Error("ai.error.parsing");
        }
        throw new Error("ai.error.api");
    }
};

const getAiMentorResponse = async (query: string, t: TFunction): Promise<AIResponse> => {
    try {
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
        
        const jsonStr = response.text;
        if (!jsonStr || jsonStr.trim() === '') {
             console.error("AI returned an empty response for mentor:", response);
             throw new Error("ai.error.parsing");
        }
        const result = JSON.parse(jsonStr);
        return result as AIResponse;
    } catch (e) {
        console.error("Error getting mentor response:", e);
        if (e instanceof Error && e.message.toLowerCase().includes('json')) {
            throw new Error("ai.error.parsing");
        }
        throw new Error("ai.error.api");
    }
};

const diagnosePlantProblem = async (base64Image: string, mimeType: string, context: { plant?: Plant, userNotes?: string }, t: TFunction): Promise<PlantDiagnosisResponse> => {
    try {
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
                substrate: context.plant.substrate,
                environment: context.plant.environment,
                lastJournalEntries: context.plant.journal.slice(-3).map(e => `${e.type}: ${e.notes}`),
            };
            plantContext = `${t('ai.gemini.diagnosePrompt.plantContextPrefix')}: ${JSON.stringify(relevantData)}`;
        }
        if (context.userNotes) {
            plantContext += `\n${t('ai.gemini.diagnosePrompt.userNotesPrefix')}: "${context.userNotes}"`;
        }

        const textPart = { text: plantContext };

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
                systemInstruction: t('ai.gemini.diagnoseSystemInstruction'),
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        const jsonStr = response.text;
        if (!jsonStr || jsonStr.trim() === '') {
             console.error("AI returned an empty response for diagnostics:", response);
             throw new Error("ai.error.parsing");
        }
        const result = JSON.parse(jsonStr);
        return result as PlantDiagnosisResponse;
    } catch (e) {
        console.error("Error diagnosing plant problem:", e);
        if (e instanceof Error && e.message.toLowerCase().includes('json')) {
            throw new Error("ai.error.parsing");
        }
        throw new Error("ai.error.api");
    }
};

const getAiPlantAdvisorResponse = async (plant: Plant, t: TFunction): Promise<AIResponse> => {
    try {
        const ai = getAiClient();
        const plantData = JSON.stringify({
            age: plant.age,
            stage: plant.stage,
            substrate: plant.substrate,
            environment: plant.environment,
            problems: plant.problems,
            journal: plant.journal.slice(-5) // last 5 entries
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
            contents: plantData,
            config: {
                systemInstruction: t('ai.gemini.advisorSystemInstruction'),
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });

        const jsonStr = response.text;
        if (!jsonStr || jsonStr.trim() === '') {
             console.error("AI returned an empty response for advisor:", response);
             throw new Error("ai.error.parsing");
        }
        const result = JSON.parse(jsonStr);
        return result as AIResponse;
    } catch (e) {
        console.error("Error getting plant advisor response:", e);
        if (e instanceof Error && e.message.toLowerCase().includes('json')) {
            throw new Error("ai.error.parsing");
        }
        throw new Error("ai.error.api");
    }
};

const getStrainGrowTips = async (
    strain: Strain, 
    context: { focus: string; stage: string; experience: string },
    t: TFunction
): Promise<StructuredGrowTips> => {
    try {
        const ai = getAiClient();
        const promptData = {
            name: strain.name,
            difficulty: t(`strainsView.difficulty.${strain.agronomic.difficulty.toLowerCase()}`),
            height: t(`strainsView.addStrainModal.heights.${strain.agronomic.height.toLowerCase()}`),
            flowering: strain.floweringTime,
            type: strain.type,
            focus: context.focus,
            stage: context.stage,
            experience: context.experience,
        };
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                nutrientTip: { type: Type.STRING, description: "A specific tip related to nutrients, feeding, or soil." },
                trainingTip: { type: Type.STRING, description: "A specific tip related to plant training, pruning, or canopy management." },
                environmentalTip: { type: Type.STRING, description: "A specific tip related to climate control like temperature, humidity, or VPD." },
                proTip: { type: Type.STRING, description: "An advanced, unique tip combining multiple factors for expert growers." },
            },
            required: ['nutrientTip', 'trainingTip', 'environmentalTip', 'proTip']
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: JSON.stringify(promptData),
            config: {
                systemInstruction: t('ai.gemini.strainTipsSystemInstruction'),
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        
        const jsonStr = response.text;
        if (!jsonStr || jsonStr.trim() === '') {
             console.error("AI returned an empty response for grow tips:", response);
             throw new Error("ai.error.parsing");
        }
        const result = JSON.parse(jsonStr);
        return result as StructuredGrowTips;
    } catch (e) {
        console.error("Error getting strain grow tips:", e);
        if (e instanceof Error && e.message.toLowerCase().includes('json')) {
            throw new Error("ai.error.parsing");
        }
        throw new Error("ai.error.api");
    }
};

const getPersonalizedTip = async (plant: Plant, strain: Strain, t: TFunction): Promise<AIResponse> => {
    try {
        const ai = getAiClient();

        const strainContext = {
            name: strain.name,
            type: strain.type,
            difficulty: strain.agronomic.difficulty,
            height: strain.agronomic.height,
            floweringTime: strain.floweringTime,
            description: strain.description?.substring(0, 150) + '...'
        };
        
        const plantContext = {
            name: plant.name,
            age: plant.age,
            stage: plant.stage,
            health: plant.health,
            substrate: plant.substrate,
            problems: plant.problems.filter(p => p.status === 'active').map(p => p.type)
        };

        const promptData = {
            plantContext,
            strainContext
        };
        
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
            contents: JSON.stringify(promptData, null, 2),
            config: {
                systemInstruction: t('ai.gemini.personalizedTipSystemInstruction'),
                responseMimeType: "application/json",
                responseSchema
            }
        });

        const jsonStr = response.text;
        if (!jsonStr || jsonStr.trim() === '') {
             console.error("AI returned an empty response for personalized tip:", response);
             throw new Error("ai.error.parsing");
        }
        return JSON.parse(jsonStr) as AIResponse;
    } catch (e) {
        console.error("Error getting personalized tip:", e);
        if (e instanceof Error && e.message.toLowerCase().includes('json')) {
            throw new Error("ai.error.parsing");
        }
        throw new Error("ai.error.api");
    }
};

export const geminiService = {
    getDynamicLoadingMessages,
    getEquipmentRecommendation,
    getAiMentorResponse,
    diagnosePlantProblem,
    getAiPlantAdvisorResponse,
    getStrainGrowTips,
    getPersonalizedTip,
};
