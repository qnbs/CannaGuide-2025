import { Strain } from '@/types';

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
        },
    }
];