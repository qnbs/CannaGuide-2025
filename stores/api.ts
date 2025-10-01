import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { geminiService } from '@/services/geminiService';
import { RootState } from './store';
import { 
    Recommendation, 
    Plant, 
    PlantDiagnosisResponse, 
    AIResponse, 
    MentorMessage, 
    Strain, 
    StructuredGrowTips, 
    DeepDiveGuide 
} from '@/types';

export const geminiApi = createApi({
  reducerPath: 'geminiApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    // FIX: Removed explicit generic types from `builder.mutation` to resolve "Untyped function calls" error.
    // Type safety is maintained by adding an explicit type to the `queryFn` argument, allowing RTK Query to infer the hook types.
    getEquipmentRecommendation: builder.mutation({
      queryFn: async ({ prompt }: { prompt: string }, { getState }) => {
        const lang = (getState() as RootState).settings.settings.language;
        try {
          const data = await geminiService.getEquipmentRecommendation(prompt, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    // FIX: Removed explicit generic types from `builder.mutation`.
    diagnosePlant: builder.mutation({
      queryFn: async (args: { base64Image: string, mimeType: string, plant: Plant, userNotes: string }, { getState }) => {
        const lang = (getState() as RootState).settings.settings.language;
        try {
          const data = await geminiService.diagnosePlant(args.base64Image, args.mimeType, args.plant, args.userNotes, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    // FIX: Removed explicit generic types from `builder.mutation`.
    getPlantAdvice: builder.mutation({
      queryFn: async (plant: Plant, { getState }) => {
        const lang = (getState() as RootState).settings.settings.language;
        try {
          const data = await geminiService.getPlantAdvice(plant, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    // FIX: Removed explicit generic types from `builder.mutation`.
    getProactiveDiagnosis: builder.mutation({
       queryFn: async (plant: Plant, { getState }) => {
        const lang = (getState() as RootState).settings.settings.language;
        try {
          const data = await geminiService.getProactiveDiagnosis(plant, lang);
          return { data };
        } catch (error) {
          return { error: { message: (error as Error).message } };
        }
      },
    }),
    // FIX: Removed explicit generic types from `builder.mutation`.
    getMentorResponse: builder.mutation({
        queryFn: async ({ plant, query }: { plant: Plant, query: string }, { getState }) => {
            const lang = (getState() as RootState).settings.settings.language;
            try {
                const data = await geminiService.getMentorResponse(plant, query, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    // FIX: Removed explicit generic types from `builder.mutation`.
    getStrainTips: builder.mutation({
        queryFn: async ({ strain, context }: { strain: Strain, context: { focus: string, stage: string, experience: string } }, { getState }) => {
            const lang = (getState() as RootState).settings.settings.language;
            try {
                const data = await geminiService.getStrainTips(strain, context, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    // FIX: Removed explicit generic types from `builder.mutation`.
    generateStrainImage: builder.mutation({
        queryFn: async (strain: Strain, { getState }) => {
            const lang = (getState() as RootState).settings.settings.language;
            try {
                const data = await geminiService.generateStrainImage(strain.name, lang);
                return { data };
            } catch (error) {
                return { error: { message: (error as Error).message } };
            }
        },
    }),
    // FIX: Removed explicit generic types from `builder.mutation`.
    generateDeepDive: builder.mutation({
        queryFn: async ({ topic, plant }: { topic: string, plant: Plant }, { getState }) => {
            const lang = (getState() as RootState).settings.settings.language;
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