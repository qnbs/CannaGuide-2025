import { Strain } from '@/types';

export const strains: Strain[] = [
    {
        id: 'uk-cheese',
        name: 'UK Cheese',
        type: 'Hybrid',
        thc: 20,
        cbd: 1,
        thcRange: '18-23%',
        cbdRange: '<1%',
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        agronomic: {
            difficulty: 'Easy',
            yield: 'High',
            height: 'Tall',
        },
    },
    {
        id: 'unicorn-poop',
        name: 'Unicorn Poop',
        type: 'Hybrid',
        thc: 24,
        cbd: 1,
        floweringTime: 9,
        agronomic: {
            difficulty: 'Medium',
            yield: 'Medium',
            height: 'Medium',
        },
    }
];