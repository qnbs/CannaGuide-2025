import { createApi, retry } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { geminiService } from '@/services/geminiService';
import { 
    Recommendation, 
    Plant, 
    PlantDiagnosisResponse, 
    AIResponse, 
    MentorMessage, 
    Strain, 
    StructuredGrowTips, 
    DeepDiveGuide,
    Language
} from '@/types';

// Define a minimal state interface to avoid circular dependency with the main store.
interface MinimalRootState {
    settings: {
        settings: {
            language: Language;
        };
    };
}

// Define an explicit error shape for the API calls.
interface ApiError {
  message: string;
}

// FIX: Replaced `performGeminiQuery` helper with a custom `baseQuery` to correctly handle type inference within RTK Query.
// This custom base query wraps all geminiService calls to inject the current language and handle errors consistently.
const geminiBaseQuery: BaseQueryFn<
  { serviceCall: (lang: Language) => Promise<any> }, // Args for the query
  // FIX: Changed from `unknown` to `any` to resolve the "Untyped function calls may not accept type arguments" error.
  // This allows RTK Query to correctly infer types for the endpoint builder.
  any, // Success return value
  ApiError  // Error return value
> = async ({ serviceCall }, { getState }) => {
  const { settings: { settings: { language } } } = getState() as MinimalRootState;
  try {
    const result = await serviceCall(language);
    return { data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: { message } };
  }
};


// Add automatic retries to the base query for enhanced resilience against transient network errors.
const baseQueryWithRetry = retry(geminiBaseQuery, {
    maxRetries: 2, // Retry failed requests up to 2 times
});

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({
    getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string }>({
      query: ({ prompt }) => ({ 
        serviceCall: (lang: Language) => geminiService.getEquipmentRecommendation(prompt, lang),
      }),
    }),
    diagnosePlant: builder.mutation<PlantDiagnosisResponse, { base64Image: string, mimeType: string, plant: Plant, userNotes: string }>({
      query: (args) => ({
        serviceCall: (lang: Language) => geminiService.diagnosePlant(args.base64Image, args.mimeType, args.plant, args.userNotes, lang),
      }),
    }),
    getPlantAdvice: builder.mutation<AIResponse, Plant>({
      query: (plant) => ({
        serviceCall: (lang: Language) => geminiService.getPlantAdvice(plant, lang),
      }),
    }),
    getProactiveDiagnosis: builder.mutation<AIResponse, Plant>({
       query: (plant) => ({
        serviceCall: (lang: Language) => geminiService.getProactiveDiagnosis(plant, lang),
      }),
    }),
    getMentorResponse: builder.mutation<Omit<MentorMessage, 'role'>, { plant: Plant, query: string }>({
        query: ({ plant, query }) => ({
            serviceCall: (lang: Language) => geminiService.getMentorResponse(plant, query, lang),
        }),
    }),
    getStrainTips: builder.mutation<StructuredGrowTips, { strain: Strain, context: { focus: string, stage: string, experience: string } }>({
        query: ({ strain, context }) => ({
            serviceCall: (lang: Language) => geminiService.getStrainTips(strain, context, lang),
        }),
    }),
    generateStrainImage: builder.mutation<string, Strain>({
        query: (strain) => ({
            serviceCall: (lang: Language) => geminiService.generateStrainImage(strain.name, lang),
        }),
    }),
    generateDeepDive: builder.mutation<DeepDiveGuide, { topic: string, plant: Plant }>({
        query: ({ topic, plant }) => ({
            serviceCall: (lang: Language) => geminiService.generateDeepDive(topic, plant, lang),
        }),
    }),
  }),
});

export const {
  useGetEquipmentRecommendationMutation,
  useDiagnosePlantMutation,
  useGetPlantAdviceMutation,
  useGetProactiveDiagnosisMutation,
  useGetMentorResponseMutation,
  useGetStrainTipsMutation,
  useGenerateStrainImageMutation,
  useGenerateDeepDiveMutation,
} = geminiApi;