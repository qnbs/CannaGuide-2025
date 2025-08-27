import { Strain } from '../../types';

export const strains: Strain[] = [
    {
        id: 'uk-cheese',
        name: 'UK Cheese',
        type: 'Hybrid',
        typeDetails: 'Hybrid 50% / 50%',
        genetics: 'Skunk #1 Phänotyp',
        thc: 20,
        cbd: 1,
        thcRange: '18-23%',
        cbdRange: '<1%',
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        description: 'Ein berühmter Phänotyp von Skunk #1, der in Großbritannien entstand. Bekannt für sein einzigartiges, scharfes und herzhaftes Käsearoma. Die Wirkung ist ausgewogen, erhebend, euphorisch und entspannend, ideal für den ganzen Tag.',
        aromas: ['Käse', 'Scharf', 'Skunk', 'Erdig'],
        dominantTerpenes: ['Caryophyllen', 'Myrcen', 'Limonen'],
        agronomic: {
            difficulty: 'Easy',
            yield: 'High',
            height: 'Tall',
            yieldDetails: { indoor: '500-600 g/m²', outdoor: 'bis 1000 g/Pflanze' },
            heightDetails: { indoor: 'Mittel', outdoor: 'Hoch (bis 2.5m)' },
        },
    },
    {
        id: 'unicorn-poop',
        name: 'Unicorn Poop',
        type: 'Hybrid',
        typeDetails: 'Hybrid 50% / 50%',
        genetics: 'GMO Cookies x Sophisticated Lady',
        thc: 24,
        cbd: 1,
        floweringTime: 9,
        description: 'Eine ausgewogene Hybride mit einem einzigartigen, süßen und fruchtigen Aroma. Die Wirkung ist erhebend, euphorisch und entspannend, ideal für kreative und gesellige Momente.',
        aromas: ['Süß', 'Fruchtig'],
        dominantTerpenes: [],
        agronomic: {
            difficulty: 'Medium',
            yield: 'Medium',
            height: 'Medium',
            yieldDetails: { indoor: '450-550 g/m²', outdoor: '~600 g/Pflanze' },
            heightDetails: { indoor: 'Mittel', outdoor: 'Mittel (bis 1.8 m)' },
        },
    }
];