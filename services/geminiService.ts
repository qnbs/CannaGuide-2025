import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, Plant, Language } from '../types';

// Initialize the Google Gemini AI client
// The API key is expected to be available as an environment variable
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

// Helper to safely parse JSON from AI response
function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    // The Gemini API for JSON mode often returns the JSON string wrapped in markdown backticks.
    const cleanedString = jsonString.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanedString) as T;
  } catch (e) {
    console.error("Failed to parse AI JSON response:", e);
    return fallback;
  }
}

// Define the response schema for AIResponse
const aiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    content: { type: Type.STRING },
  },
  required: ['title', 'content'],
};

// Define a generic error response. The UI will provide the translated message.
const errorResponse: AIResponse = {
  title: 'Error',
  content: 'The AI could not generate a response. Please try again later or rephrase your request.',
};

const recommendationItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The name of the recommended product or component." },
        price: { type: Type.NUMBER, description: "The estimated price in Euros." },
        rationale: { type: Type.STRING, description: "A short rationale (1-2 sentences) explaining why this item is suitable for the chosen setup." },
    },
    required: ['name', 'price', 'rationale'],
};

const recommendationSchema = {
    type: Type.OBJECT,
    properties: {
        tent: recommendationItemSchema,
        light: { 
            ...recommendationItemSchema, 
            properties: { 
                ...recommendationItemSchema.properties, 
                watts: {type: Type.NUMBER, description: "The wattage of the lamp."} 
            },
            required: [...recommendationItemSchema.required, 'watts'],
        },
        ventilation: recommendationItemSchema,
        pots: recommendationItemSchema,
        soil: recommendationItemSchema,
        nutrients: recommendationItemSchema,
        extra: recommendationItemSchema,
    },
    required: ['tent', 'light', 'ventilation', 'pots', 'soil', 'nutrients', 'extra'],
};

const getLanguageInstruction = (language: Language) => language === 'de' ? 'Antworte auf Deutsch.' : 'Respond in English.';

export const geminiService = {
  getKnowledgeArticle: async (topic: string, language: Language): Promise<AIResponse> => {
    try {
      const prompt = `Create a detailed, helpful article on the topic "${topic}" in the context of cannabis cultivation for beginners and advanced growers.
      The article should be well-structured and contain practical tips.
      Format the response as a JSON object with the keys "title" and "content".
      The "title" should be concise and related to the topic.
      The "content" should be the answer as well-formatted HTML. Use <h3> for subheadings, <ul> and <ol> for lists, and <p> for paragraphs to maximize readability.
      ${getLanguageInstruction(language)}`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: aiResponseSchema,
        },
      });

      return safeJsonParse(response.text, errorResponse);
    } catch (error) {
      console.error(`Error fetching knowledge article for ${topic}:`, error);
      return errorResponse;
    }
  },

  askAboutKnowledge: async (prompt: string, language: Language): Promise<AIResponse> => {
    try {
      const fullPrompt = `Answer the following question about cannabis cultivation: "${prompt}".
      Format the response as a JSON object with the keys "title" and "content".
      The "title" should be a short summary of the question.
      The "content" should be the answer as well-formatted HTML that answers the question clearly and helpfully.
      ${getLanguageInstruction(language)}`;
      
      const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: aiResponseSchema,
        },
      });

      return safeJsonParse(response.text, errorResponse);
    } catch (error) {
      console.error(`Error asking about knowledge with prompt "${prompt}":`, error);
      return errorResponse;
    }
  },

  diagnosePlantProblem: async (imageBase64Data: string, mimeType: string, language: Language): Promise<AIResponse> => {
    try {
        const prompt = `Analyze this image of a plant leaf. Identify any potential diseases, pests, or nutrient deficiencies.
        
        INSTRUCTIONS:
        1. Provide a title for your primary diagnosis (e.g., "Calcium Deficiency" or "Spider Mite Infestation").
        2. For the content, provide a detailed but easy-to-understand explanation of the issue.
        3. Include a list of concrete, actionable steps to resolve the problem.
        4. If the image is unclear or the plant appears healthy, state that clearly.
        5. Format the response as a JSON object with "title" and "content" keys. The content should be well-formatted HTML using <h3> for subheadings, <ul> and <ol> for lists, and <p> for paragraphs.
        ${getLanguageInstruction(language)}`;

        const imagePart = {
            inlineData: {
                data: imageBase64Data,
                mimeType: mimeType,
            },
        };

        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model,
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: "You are an expert cannabis cultivator and plant pathologist.",
                responseMimeType: "application/json",
                responseSchema: aiResponseSchema,
            },
        });

        return safeJsonParse(response.text, errorResponse);
    } catch (error) {
        console.error('Error diagnosing plant problem:', error);
        return errorResponse;
    }
  },

  getEquipmentInfo: async (language: Language) => {
    const fallback = { shops: [], gear: [] };
    try {
        const prompt = `Create a list of 3-4 recommended, reputable online grow shops that deliver to the EU, and a list of 5-6 essential pieces of equipment for indoor cannabis cultivation.
        Provide a short, helpful description for each shop and each piece of equipment.
        Format the response exclusively as a JSON object.
        ${getLanguageInstruction(language)}`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        shops: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    url: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                },
                            },
                        },
                        gear: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                },
                            },
                        },
                    },
                },
            },
        });

        return safeJsonParse(response.text, fallback);
    } catch (error) {
        console.error('Error fetching equipment info:', error);
        return fallback;
    }
  },
  
  askAboutEquipment: async (prompt: string, language: Language): Promise<AIResponse> => {
     try {
      const fullPrompt = `Answer the following question about equipment for cannabis cultivation: "${prompt}".
      Format the response as a JSON object with the keys "title" and "content".
      The "title" should be a short summary of the question (e.g., "AI Equipment Advisor").
      The "content" should be the answer as well-formatted HTML that answers the question clearly and helpfully.
      ${getLanguageInstruction(language)}`;
      
      const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: aiResponseSchema,
        },
      });

      return safeJsonParse(response.text, errorResponse);
    } catch (error) {
      console.error(`Error asking about equipment with prompt "${prompt}":`, error);
      return errorResponse;
    }
  },

  getSetupRecommendation: async (area: string, growStyle: string, budget: string, language: Language): Promise<Record<string, {name: string, price: number, rationale: string, watts?: number}> | null> => {
    const fallback = null;
    try {
        const prompt = `Create a detailed equipment recommendation for an indoor cannabis grow.
        The configuration should be based on the following user preferences:
        - Grow area: ${area} cm
        - Grow style: ${growStyle}
        - Budget: ${budget}

        For each of the following 7 categories, provide ONE specific product recommendation (e.g., "150W Dimmable LED" instead of just "LED Lamp"):
        1. tent
        2. light
        3. ventilation
        4. pots
        5. soil
        6. nutrients
        7. extra (Important accessories like timers, meters, etc.)

        For each item, provide:
        - "name": A specific product name or description.
        - "price": A realistic, estimated price in Euros (number only).
        - "rationale": A short, concise reason (1-2 sentences) why this item fits the chosen setup (area, style, budget).
        - "watts" (only for the "light" category): The wattage of the lamp (number only).

        Format the response exclusively as a JSON object that adheres to the provided schema.
        ${getLanguageInstruction(language)}`;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recommendationSchema,
            },
        });
        
        return safeJsonParse(response.text, fallback);
    } catch (error) {
        console.error('Error fetching setup recommendation:', error);
        return fallback;
    }
  },
  
  askAboutPlant: async (plant: Plant, prompt: string, titleTemplate: string, language: Language): Promise<AIResponse> => {
     try {
        const plantProblems = plant.problems.length > 0
            ? plant.problems.map(p => p.message).join(', ')
            : 'None';

        const plantSummary = `
            - Name: ${plant.name}
            - Strain: ${plant.strain.name} (${plant.strain.type})
            - Stage: ${plant.stage}
            - Age: ${plant.age} days
            - Height: ${plant.height.toFixed(1)} cm
            - Vitals: pH ${plant.vitals.ph.toFixed(1)}, EC ${plant.vitals.ec.toFixed(2)}, Substrate Moisture ${plant.vitals.substrateMoisture.toFixed(0)}%
            - Environment: ${plant.environment.temperature}°C, ${plant.environment.humidity}% humidity
            - Stress Level: ${plant.stressLevel.toFixed(0)}%
            - Current Problems: ${plantProblems}
        `;

        const fullPrompt = `Analyze the following plant data and answer the user's question.
        
        PLANT DATA:
        ${plantSummary}

        USER'S QUESTION:
        "${prompt}"

        INSTRUCTIONS:
        1. Provide a concise analysis and specific recommendations for action.
        2. Directly address the user's question and use the provided data to support your reasoning.
        3. Format the response as a JSON object with the keys "title" and "content".
        4. The "title" should be "${titleTemplate}".
        5. The "content" should be the answer as well-formatted HTML, using <strong> tags to highlight important values and terms.
        ${getLanguageInstruction(language)}`;

        const response = await ai.models.generateContent({
            model,
            contents: fullPrompt,
            config: {
                systemInstruction: "You are an experienced AI advisor for cannabis cultivation.",
                responseMimeType: "application/json",
                responseSchema: aiResponseSchema,
            },
        });
        
        return safeJsonParse(response.text, errorResponse);
    } catch (error) {
        console.error(`Error asking about plant ${plant.name}:`, error);
        return errorResponse;
    }
  },

  getProactiveTip: async (plant: Plant, title: string, contentFallback: string, language: Language): Promise<AIResponse> => {
    const specificErrorResponse: AIResponse = {
      title: title,
      content: contentFallback,
    };
    
    try {
        const plantProblems = plant.problems.length > 0
            ? plant.problems.map(p => p.message).join(', ')
            : 'None';

        const plantSummary = `
            - Stage: ${plant.stage}
            - Age: ${plant.age} days
            - Vitals: pH ${plant.vitals.ph.toFixed(1)}, EC ${plant.vitals.ec.toFixed(2)}, Substrate Moisture ${plant.vitals.substrateMoisture.toFixed(0)}%
            - Environment: ${plant.environment.temperature}°C, ${plant.environment.humidity}% humidity
            - Current Problems: ${plantProblems}
        `;

        const prompt = `Analyze the following data from a cannabis plant and provide ONE short, proactive care tip (1-2 sentences) tailored exactly to the current situation. The tip should be practical and easy to implement.

        PLANT DATA:
        ${plantSummary}

        Examples of good tips:
        - For high humidity in flowering: "Your humidity is a bit high for the flowering stage. Increase exhaust fan speed to prevent mold."
        - For low EC in vegetation: "The EC value is low. Consider slightly increasing the nutrient dose at the next feeding to promote growth."
        - If everything is good: "All values look optimal for this stage. Keep it up! Watch for the first signs of pre-flowering in the coming days."

        Format the response as a JSON object with the keys "title" and "content". The "title" should be "${title}". Provide only a concise recommendation for action, not long explanations.
        ${getLanguageInstruction(language)}`;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: "You are an experienced AI cultivation expert.",
                responseMimeType: "application/json",
                responseSchema: aiResponseSchema,
            },
        });
        
        return safeJsonParse(response.text, specificErrorResponse);
    } catch (error) {
      console.error(`Error fetching proactive tip for plant ${plant.name}:`, error);
      return specificErrorResponse;
    }
  },
};