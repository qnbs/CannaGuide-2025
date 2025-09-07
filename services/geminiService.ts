import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Plant, Recommendation } from '../types';
import { useTranslations } from '../hooks/useTranslations'; // Import hook to use translations

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// This is a helper, but since it uses a hook, it can't be a standalone function.
// We'll define the messages inside the components or pass 't' function.
// For this service, we will use placeholders and let the component translate them.
type LoadingMessageContext = {
    useCase: 'equipment' | 'diagnostics' | 'mentor' | 'advisor';
    data?: any;
};

export const getDynamicLoadingMessages = (context: LoadingMessageContext): string[] => {
    const { useCase, data } = context;
    switch (useCase) {
        case 'equipment':
            return [
                `ai.loading.equipment.analyzing`,
                `ai.loading.equipment.budget::{"budget":"${data.budget}"}`,
                `ai.loading.equipment.area::{"area":"${data.area}"}`,
                `ai.loading.equipment.style::{"style":"${data.growStyle}"}`,
                `ai.loading.equipment.selecting`,
                `ai.loading.equipment.finalizing`,
            ];
        case 'diagnostics':
            return [
                `ai.loading.diagnostics.receiving`,
                `ai.loading.diagnostics.analyzing`,
                `ai.loading.diagnostics.identifying`,
                `ai.loading.diagnostics.formulating`,
            ];
        case 'mentor':
             return [
                `ai.loading.mentor.processing::{"query":"${data.query}"}`,
                `ai.loading.mentor.searching`,
                `ai.loading.mentor.compiling`,
             ];
        case 'advisor':
            const { plant } = data;
            return [
                `ai.loading.advisor.analyzing::{"stage":"${plant.stage}"}`,
                `ai.loading.advisor.vitals::{"ph":"${plant.vitals.ph.toFixed(1)}","ec":"${plant.vitals.ec.toFixed(1)}"}`,
                `ai.loading.advisor.problems::{"count":${plant.problems.length}}`,
                `ai.loading.advisor.formulating`,
            ];
        default:
            return [`ai.generating`];
    }
};


const getEquipmentRecommendation = async (area: string, budget: string, growStyle: string): Promise<Recommendation> => {
    const prompt = `Generate a cannabis growing equipment recommendation for a ${area}cm area, with a ${budget} budget, focusing on a ${growStyle} grow style. Provide specific product types (e.g., 'Mars Hydro TS 1000' or 'Fabric Pot 5 Gallon') but avoid brand favoritism unless a specific model is iconic for that category. Prices should be realistic estimates in Euros. The rationale should be concise and explain why the item fits the user's needs. Categories to include are: tent, light, ventilation, pots, soil, nutrients, extra.`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            tent: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            light: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, watts: { type: Type.NUMBER }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            ventilation: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            pots: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            soil: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            nutrients: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
            extra: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.NUMBER }, rationale: { type: Type.STRING } }, required: ['name', 'price', 'rationale'] },
        },
        required: ['tent', 'light', 'ventilation', 'pots', 'soil', 'nutrients', 'extra']
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema }
    });

    // FIX: Access the .text property directly for the JSON string.
    return JSON.parse(response.text) as Recommendation;
};

const diagnosePlantProblem = async (base64Image: string, mimeType: string, plantContext: string): Promise<{ title: string, content: string }> => {
    const imagePart = { inlineData: { mimeType, data: base64Image } };
    const textPart = { text: `Analyze this image of a cannabis plant leaf/plant. The user is looking for a potential problem diagnosis. Plant context: ${plantContext}. Provide a concise diagnosis. Identify the most likely problem (e.g., 'Nitrogen Deficiency', 'Light Burn', 'Spider Mites'). Format the response as a JSON object with "title" and "content" keys. The "title" should be the name of the problem. The "content" should be a 2-3 sentence explanation of the problem and a suggested solution.` };
    const responseSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: { responseMimeType: "application/json", responseSchema }
    });
    // FIX: Access the .text property directly for the JSON string.
    return JSON.parse(response.text);
};

const getAiMentorResponse = async (query: string): Promise<{ title: string, content: string }> => {
    const systemInstruction = "You are an expert cannabis cultivation mentor. Your tone is helpful, encouraging, and scientific. Provide detailed, actionable advice. Format your response as a JSON object with 'title' and 'content' keys. The 'title' should be a concise summary of the answer. The 'content' should be the detailed explanation, using markdown for formatting (like lists or bold text).";
    const responseSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema }
    });
    // FIX: Access the .text property directly for the JSON string.
    return JSON.parse(response.text);
};

const getAiPlantAdvisorResponse = async (plant: Plant): Promise<{ title: string, content: string }> => {
    const plantData = JSON.stringify({ age: plant.age, stage: plant.stage, vitals: plant.vitals, environment: plant.environment, problems: plant.problems, journal: plant.journal.slice(-5) }, null, 2);
    const query = `Based on the following data for a cannabis plant, provide a concise analysis and one key recommendation for the grower. Plant Data: ${plantData}. Format the response as a JSON object with "title" and "content" keys. The "title" should be a very short summary of the advice (e.g., "Slightly high pH, suggest adjustment"). The "content" should be a 2-4 sentence explanation of your observation and a clear, actionable recommendation.`;
    const responseSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['title', 'content'] };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config: { responseMimeType: "application/json", responseSchema }
    });
    // FIX: Access the .text property directly for the JSON string.
    return JSON.parse(response.text);
};

export const geminiService = {
    getEquipmentRecommendation,
    diagnosePlantProblem,
    getAiMentorResponse,
    getAiPlantAdvisorResponse,
    getDynamicLoadingMessages,
};