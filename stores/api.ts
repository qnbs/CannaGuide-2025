import { createApi, fakeBaseQuery, retry } from '@reduxjs/toolkit/query/react';
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

// Helper function to encapsulate language retrieval and error handling for all geminiService calls.
const performGeminiQuery = async <T>(
  queryFn: (lang: Language) => Promise<T>,
  getState: () => unknown
): Promise<{ data: T } | { error: ApiError }> => {
  const { settings: { settings: { language } } } = getState() as MinimalRootState;
  try {
    const data = await queryFn(language);
    return { data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { error: { message } };
  }
};

// Add automatic retries to the base query for enhanced resilience against transient network errors.
const baseQueryWithRetry = retry(fakeBaseQuery<ApiError>(), {
    maxRetries: 2, // Retry failed requests up to 2 times
});

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: baseQueryWithRetry,
  endpoints: (builder) => ({
    getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string }>({
      queryFn: ({ prompt }, { getState }) => 
        // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
        performGeminiQuery(
          (lang) => geminiService.getEquipmentRecommendation(prompt, lang),
          getState
        ),
    }),
    diagnosePlant: builder.mutation<PlantDiagnosisResponse, { base64Image: string, mimeType: string, plant: Plant, userNotes: string }>({
      queryFn: (args, { getState }) =>
        // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
        performGeminiQuery(
          (lang) => geminiService.diagnosePlant(args.base64Image, args.mimeType, args.plant, args.userNotes, lang),
          getState
        ),
    }),
    getPlantAdvice: builder.mutation<AIResponse, Plant>({
      queryFn: (plant, { getState }) =>
        // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
        performGeminiQuery(
          (lang) => geminiService.getPlantAdvice(plant, lang),
          getState
        ),
    }),
    getProactiveDiagnosis: builder.mutation<AIResponse, Plant>({
       queryFn: (plant, { getState }) =>
        // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
        performGeminiQuery(
          (lang) => geminiService.getProactiveDiagnosis(plant, lang),
          getState
        ),
    }),
    getMentorResponse: builder.mutation<Omit<MentorMessage, 'role'>, { plant: Plant, query: string }>({
        queryFn: ({ plant, query }, { getState }) =>
            // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
            performGeminiQuery(
                (lang) => geminiService.getMentorResponse(plant, query, lang),
                getState
            ),
    }),
    getStrainTips: builder.mutation<StructuredGrowTips, { strain: Strain, context: { focus: string, stage: string, experience: string } }>({
        queryFn: ({ strain, context }, { getState }) =>
            // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
            performGeminiQuery(
                (lang) => geminiService.getStrainTips(strain, context, lang),
                getState
            ),
    }),
    generateStrainImage: builder.mutation<string, Strain>({
        queryFn: (strain, { getState }) =>
            // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
            performGeminiQuery(
                (lang) => geminiService.generateStrainImage(strain.name, lang),
                getState
            ),
    }),
    generateDeepDive: builder.mutation<DeepDiveGuide, { topic: string, plant: Plant }>({
        queryFn: ({ topic, plant }, { getState }) =>
            // Fix: Removed explicit type argument from performGeminiQuery call to fix "Untyped function calls may not accept type arguments" error.
            performGeminiQuery(
                (lang) => geminiService.generateDeepDive(topic, plant, lang),
                getState
            ),
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