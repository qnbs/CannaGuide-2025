import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
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

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  // Provide the explicit error type to fakeBaseQuery. This is crucial for fixing the
  // type inference issue with the endpoint builder that caused errors on all mutations.
  baseQuery: fakeBaseQuery<ApiError>(),
  endpoints: (builder) => ({
    getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string }>({
      queryFn: async ({ prompt }, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.getEquipmentRecommendation(prompt, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    diagnosePlant: builder.mutation<PlantDiagnosisResponse, { base64Image: string, mimeType: string, plant: Plant, userNotes: string }>({
      queryFn: async (args, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.diagnosePlant(args.base64Image, args.mimeType, args.plant, args.userNotes, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getPlantAdvice: builder.mutation<AIResponse, Plant>({
      queryFn: async (plant, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.getPlantAdvice(plant, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getProactiveDiagnosis: builder.mutation<AIResponse, Plant>({
       queryFn: async (plant, api) => {
        // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
        const state = api.getState() as unknown as MinimalRootState;
        const lang = state.settings.settings.language;
        try {
          const data = await geminiService.getProactiveDiagnosis(plant, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    getMentorResponse: builder.mutation<Omit<MentorMessage, 'role'>, { plant: Plant, query: string }>({
        queryFn: async ({ plant, query }, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.getMentorResponse(plant, query, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    getStrainTips: builder.mutation<StructuredGrowTips, { strain: Strain, context: { focus: string, stage: string, experience: string } }>({
        queryFn: async ({ strain, context }, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.getStrainTips(strain, context, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    generateStrainImage: builder.mutation<string, Strain>({
        queryFn: async (strain, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.generateStrainImage(strain.name, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    generateDeepDive: builder.mutation<DeepDiveGuide, { topic: string, plant: Plant }>({
        queryFn: async ({ topic, plant }, api) => {
            // FIX: Use a more robust type assertion `as unknown as Type` to resolve potential TypeScript inference issues.
            const state = api.getState() as unknown as MinimalRootState;
            const lang = state.settings.settings.language;
            try {
                const data = await geminiService.generateDeepDive(topic, plant, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
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