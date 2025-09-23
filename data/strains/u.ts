import { Strain } from '@/types';

export const strains: Strain[] = [
    {
        id: 'unicorn-poop',
        name: 'Unicorn Poop',
        type: 'Hybrid',
        thc: 23,
        cbd: 1,
        thcRange: '21-25%',
        cbdRange: '<1%',
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        typeDetails: 'Hybrid 50% / 50%',
        genetics: 'GMO Cookies x Sophisticated Lady',
        agronomic: {
            difficulty: 'Medium',
            yield: 'Medium',
            height: 'Medium',
            yieldDetails: { indoor: '400-500 g/m²', outdoor: '~550 g/plant' },
            heightDetails: { indoor: '100-150 cm', outdoor: 'up to 1.8 m' },
        },
    },
    {
        id: 'uk-cheese',
        name: 'UK Cheese',
        type: 'Hybrid',
        thc: 20.5,
        cbd: 1,
        thcRange: '18-23%',
        cbdRange: '<1%',
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        typeDetails: 'Hybrid 50% / 50%',
        genetics: 'Skunk #1 Phenotype',
        agronomic: {
            difficulty: 'Easy',
            yield: 'High',
            height: 'Medium',
            yieldDetails: { indoor: '500-600 g/m²', outdoor: '~650 g/plant' },
            heightDetails: { indoor: 'Medium', outdoor: 'Medium' },
        },
    }
];