import { Strain } from '../../types';

export const strains: Strain[] = [
    {
        id: 'n13-kush',
        name: 'N13 Kush',
        type: 'Hybrid',
        typeDetails: 'Indica 80% / Sativa 20%',
        genetics: 'Nicole Kush x Mr. Nice G13 x Hash Plant',
        thc: 24,
        cbd: 1,
        floweringTime: 8,
        description: 'Eine potente Indica-dominante Sorte, die für ihre starke entspannende Wirkung und ihr erdiges, kiefernartiges Aroma bekannt ist. Ideal für den Abendgebrauch und zur Linderung von Stress.',
        aromas: ['Erdig', 'Kiefer'],
        dominantTerpenes: [],
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
        typeDetails: 'Sativa 60% / Indica 40%',
        genetics: 'US Haze x Master Widow',
        thc: 22,
        cbd: 1,
        floweringTime: 8.5,
        floweringTimeRange: '8-9',
        description: 'Bekannt für ihr honigsüßes Aroma und ein psychedelisches, erhebendes High. Der Name \'Nebula\' stammt von ihrer sternenklaren Trichom-Bedeckung. Sie erzeugt einen glücklichen, kreativen und energetischen Rausch.',
        aromas: ['Honig', 'Süß'],
        dominantTerpenes: [],
        agronomic: {
            difficulty: 'Easy',
            yield: 'Medium',
            height: 'Medium',
            yieldDetails: { indoor: '450-550 g/m²', outdoor: '~600 g/Pflanze' },
            heightDetails: { indoor: 'Mittel', outdoor: 'Mittel (bis 1.8 m)' },
        },
    }
];