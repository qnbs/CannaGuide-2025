import { Strain } from '../../types';

export const strains: Strain[] = [
    {
        id: 'n13-kush',
        name: 'N13 Kush',
        type: 'Hybrid',
        thc: 24,
        cbd: 1,
        floweringTime: 8,
        agronomic: {
            difficulty: 'Medium',
            yield: 'High',
            height: 'Short',
            yieldDetails: { indoor: '550-600 g/m²', outdoor: '~700 g/Pflanze' },
            heightDetails: { indoor: '80-100 cm', outdoor: 'Kurz bis Mittel (bis 1.5m)' },
        },
    },
    {
        id: 'nebula',
        name: 'Nebula',
        type: 'Hybrid',
        thc: 22,
        cbd: 1,
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        agronomic: {
            difficulty: 'Easy',
            yield: 'Medium',
            height: 'Medium',
            yieldDetails: { indoor: '450-550 g/m²', outdoor: '~600 g/Pflanze' },
            heightDetails: { indoor: 'Mittel', outdoor: 'Mittel (bis 1.8 m)' },
        },
    }
];