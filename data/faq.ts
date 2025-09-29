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
    id: 'faq-light-distance-seedling',
    questionKey: 'faq.lightDistanceSeedling.question',
    answerKey: 'faq.lightDistanceSeedling.answer',
    triggers: { plantStage: PlantStage.Seedling }
  },
  {
    id: 'faq-when-to-feed',
    questionKey: 'faq.whenToFeed.question',
    answerKey: 'faq.whenToFeed.answer',
    triggers: { plantStage: PlantStage.Seedling }
  },
  {
    id: 'faq-npk-meaning',
    questionKey: 'faq.npkMeaning.question',
    answerKey: 'faq.npkMeaning.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-calmag-usage',
    questionKey: 'faq.calmagUsage.question',
    answerKey: 'faq.calmagUsage.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-flushing-plants',
    questionKey: 'faq.flushingPlants.question',
    answerKey: 'faq.flushingPlants.answer',
    triggers: { plantStage: PlantStage.Flowering }
  },
  {
    id: 'faq-vpd-importance',
    questionKey: 'faq.vpdImportance.question',
    answerKey: 'faq.vpdImportance.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-ideal-temp-humidity',
    questionKey: 'faq.idealTempHumidity.question',
    answerKey: 'faq.idealTempHumidity.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-air-circulation',
    questionKey: 'faq.airCirculation.question',
    answerKey: 'faq.airCirculation.answer',
    triggers: {}
  },
  {
    id: 'faq-nutrient-burn',
    questionKey: 'faq.nutrientBurn.question',
    answerKey: 'faq.nutrientBurn.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-spider-mites',
    questionKey: 'faq.spiderMites.question',
    answerKey: 'faq.spiderMites.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-stretching-causes',
    questionKey: 'faq.stretchingCauses.question',
    answerKey: 'faq.stretchingCauses.answer',
    triggers: { plantStage: [PlantStage.Seedling, PlantStage.Vegetative] }
  },
  {
    id: 'faq-topping-vs-fimming',
    questionKey: 'faq.toppingVsFimming.question',
    answerKey: 'faq.toppingVsFimming.answer',
    triggers: { plantStage: PlantStage.Vegetative }
  },
  {
    id: 'faq-what-is-scrog',
    questionKey: 'faq.whatIsScrog.question',
    answerKey: 'faq.whatIsScrog.answer',
    triggers: { plantStage: [PlantStage.Vegetative, PlantStage.Flowering] }
  },
  {
    id: 'faq-what-is-lollipopping',
    questionKey: 'faq.whatIsLollipopping.question',
    answerKey: 'faq.whatIsLollipopping.answer',
    triggers: { plantStage: PlantStage.Flowering }
  },
  {
    id: 'faq-drying-duration',
    questionKey: 'faq.dryingDuration.question',
    answerKey: 'faq.dryingDuration.answer',
    triggers: { plantStage: PlantStage.Drying }
  },
  {
    id: 'faq-curing-importance',
    questionKey: 'faq.curingImportance.question',
    answerKey: 'faq.curingImportance.answer',
    triggers: { plantStage: [PlantStage.Drying, PlantStage.Curing] }
  },
  {
    id: 'faq-storage-harvest',
    questionKey: 'faq.storageHarvest.question',
    answerKey: 'faq.storageHarvest.answer',
    triggers: { plantStage: PlantStage.Finished }
  },
  {
    id: 'faq-autoflower-vs-photoperiod',
    questionKey: 'faq.autoflowerVsPhotoperiod.question',
    answerKey: 'faq.autoflowerVsPhotoperiod.answer',
    triggers: {}
  },
  {
    id: 'faq-how-often-to-water',
    questionKey: 'faq.howOftenToWater.question',
    answerKey: 'faq.howOftenToWater.answer',
    triggers: {}
  },
  {
    id: 'faq-pot-size',
    questionKey: 'faq.potSize.question',
    answerKey: 'faq.potSize.answer',
    triggers: {}
  }
];