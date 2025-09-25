import { Strain } from '@/types';

export const strains: Strain[] = [
    {
        id: 'uk-cheese',
        name: 'UK Cheese',
        type: 'Hybrid',
        typeDetails: 'Hybrid - 50% Sativa / 50% Indica',
        genetics: 'Skunk #1 Phenotype',
        thc: 20.5,
        cbd: 1,
        thcRange: '18-23%',
        cbdRange: '<1%',
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        agronomic: {
            difficulty: 'Easy',
            yield: 'High',
            height: 'Medium',
            yieldDetails: { indoor: '500-600 g/m²', outdoor: '600-700 g/plant' },
            heightDetails: { indoor: '100-150 cm', outdoor: '120-180 cm' },
        },
        aromas: ['Cheese', 'Pungent', 'Skunk', 'Earthy'],
        dominantTerpenes: ['Caryophyllene', 'Myrcene', 'Limonene'],
    },
    {
        id: 'unicorn-poop',
        name: 'Unicorn Poop',
        type: 'Hybrid',
        typeDetails: 'Hybrid - 50% Sativa / 50% Indica',
        genetics: 'GMO Cookies x Sophisticated Lady',
        thc: 23,
        cbd: 1,
        thcRange: '21-25%',
        cbdRange: '<1%',
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        agronomic: {
            difficulty: 'Medium',
            yield: 'Medium',
            height: 'Medium',
            yieldDetails: { indoor: '400-500 g/m²', outdoor: '450-550 g/plant' },
            heightDetails: { indoor: '100-150 cm', outdoor: '120-180 cm' },
        },
        aromas: ['Sweet', 'Fruity', 'Earthy', 'Citrus'],
        dominantTerpenes: ['Limonene', 'Caryophyllene', 'Myrcene'],
    }
];
