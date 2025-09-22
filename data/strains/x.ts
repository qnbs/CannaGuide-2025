import { Strain } from '@/types';

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
        },
    }
];