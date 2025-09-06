import { Strain } from '../../types';

export const strains: Strain[] = [
    {
        id: 'ya-hemi',
        name: 'Ya Hemi',
        type: 'Hybrid',
        typeDetails: 'Hybrid 50% / 50%',
        genetics: 'Project 4516 x Melonatta',
        thc: 28,
        cbd: 1,
        floweringTime: 9,
        description: 'Eine potente Hybride mit einem komplexen, gasartigen und fruchtigen Aroma. Die Wirkung ist stark, ausgewogen und bietet sowohl zerebrale Euphorie als auch körperliche Entspannung.',
        aromas: ['Gasartig', 'Fruchtig'],
        dominantTerpenes: [],
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
        typeDetails: 'Indica 70% / Sativa 30%',
        genetics: 'OG Kush Phänotyp',
        thc: 20,
        cbd: 1,
        floweringTime: 8,
        description: 'Eine Indica-dominante Sorte mit einem erdigen, kiefernartigen Aroma. Die Wirkung ist stark, entspannend und ideal für den Abend oder bei Schmerzen.',
        aromas: ['Erdig', 'Kiefer'],
        dominantTerpenes: [],
        agronomic: {
            difficulty: 'Medium',
            yield: 'Low',
            height: 'Short',
            yieldDetails: { indoor: '~350 g/m²', outdoor: '~400 g/Pflanze' },
            heightDetails: { indoor: 'Kurz', outdoor: 'Mittel (bis 1.5 m)' },
        },
    }
];