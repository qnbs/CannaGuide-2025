import { Strain } from '../../types';

export const strains: Strain[] = [
    {
        id: 'ya-hemi',
        name: 'Ya Hemi',
        type: 'Hybrid',
        thc: 28,
        cbd: 1,
        floweringTime: 9,
        agronomic: {
            difficulty: 'Medium',
            yield: 'High',
            height: 'Medium',
            yieldDetails: { indoor: '500-600 g/m²', outdoor: '~700 g/Pflanze' },
            heightDetails: { indoor: 'Mittel', outdoor: 'Mittel (bis 2 m)' },
        },
    },
    {
        id: 'yeti-og',
        name: 'Yeti OG',
        type: 'Hybrid',
        thc: 20,
        cbd: 1,
        floweringTime: 8,
        agronomic: {
            difficulty: 'Medium',
            yield: 'Low',
            height: 'Short',
            yieldDetails: { indoor: '~350 g/m²', outdoor: '~400 g/Pflanze' },
            heightDetails: { indoor: 'Kurz', outdoor: 'Mittel (bis 1.5 m)' },
        },
    }
];
