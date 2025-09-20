import { Strain } from '../../types';

export const strains: Strain[] = [
    {
        id: 'xanadu',
        name: 'Xanadu',
        type: 'Hybrid',
        thc: 20,
        cbd: 1,
        floweringTime: 9,
        agronomic: {
            difficulty: 'Medium',
            yield: 'Medium',
            height: 'Tall',
            yieldDetails: { indoor: '400-500 g/m²', outdoor: '~550 g/Pflanze' },
            heightDetails: { indoor: 'Hoch', outdoor: 'Hoch (bis 2.5 m)' },
        },
    },
    {
        id: 'xeno',
        name: 'Xeno',
        type: 'Hybrid',
        thc: 23,
        cbd: 1,
        thcRange: '20-26%',
        cbdRange: '<1%',
        floweringTime: 9,
        agronomic: {
            difficulty: 'Medium',
            yield: 'High',
            height: 'Medium',
            yieldDetails: { indoor: '500-600 g/m²', outdoor: '~650 g/Pflanze' },
            heightDetails: { indoor: 'Mittel', outdoor: 'Mittel (bis 2m)' },
        },
    }
];
