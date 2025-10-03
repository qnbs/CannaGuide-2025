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

// FIX: Removed the CustomError interface. The explicit generic was causing type inference issues with the endpoint builder.
// The default error type, `SerializedError`, is structurally compatible with the errors returned in the `queryFn`.

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  // The `fakeBaseQuery` requires a generic type for the error shape.
  // Without it, the `builder` in `endpoints` is not correctly typed,
  // which causes "Untyped function calls may not accept type arguments" on `builder.mutation`.
  // FIX: Removed <CustomError> generic to allow RTK Query to correctly infer types using the default SerializedError.
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    getEquipmentRecommendation: builder.mutation<Recommendation, { prompt: string }>({
      queryFn: async ({ prompt }, api) => {
        const state = api.getState() as MinimalRootState;
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
        const state = api.getState() as MinimalRootState;
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
        const state = api.getState() as MinimalRootState;
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
        const state = api.getState() as MinimalRootState;
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
            const state = api.getState() as MinimalRootState;
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
            const state = api.getState() as MinimalRootState;
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
            const state = api.getState() as MinimalRootState;
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
            const state = api.getState() as MinimalRootState;
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