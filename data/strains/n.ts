import { Strain } from '@/types';

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
        },
    }
];