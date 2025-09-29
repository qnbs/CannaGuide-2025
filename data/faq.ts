import { FAQItem, PlantStage } from '@/types';

export const faqData: FAQItem[] = [
  {
    id: 'faq-ph-value',
    questionKey: 'faq.phValue.question',
    answerKey: 'faq.phValue.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-yellow-leaves',
    questionKey: 'faq.yellowLeaves.question',
    answerKey: 'faq.yellowLeaves.answer',
    triggers: { plantStage: [PlantStage.Seedling, PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-when-to-harvest',
    questionKey: 'faq.whenToHarvest.question',
    answerKey: 'faq.whenToHarvest.answer',
    triggers: { plantStage: PlantStage.Flowering }
  },
  {
    id: 'faq-light-distance',
    questionKey: 'faq.lightDistance.question',
    answerKey: 'faq.lightDistance.answer',
    triggers: { plantStage: PlantStage.Seedling }
  }
];
