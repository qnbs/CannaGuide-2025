import type { FlavonoidDataPoint, TerpeneInteraction } from '@/services/strain-lookup/strainLookupTypes'

export type KnownFlavonoid =
    | 'Cannflavin A'
    | 'Cannflavin B'
    | 'Quercetin'
    | 'Apigenin'
    | 'Luteolin'
    | 'Kaempferol'

export const FLAVONOID_PROFILES: Record<
    KnownFlavonoid,
    { interactions: TerpeneInteraction[]; score: number }
> = {
    'Cannflavin A': {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Potent anti-inflammatory (30x stronger than aspirin)',
                strength: 'high',
            },
            { cannabinoid: 'THC', effect: 'Analgesic potentiation', strength: 'medium' },
        ],
        score: 8.5,
    },
    'Cannflavin B': {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Anti-inflammatory via COX-2 inhibition',
                strength: 'high',
            },
        ],
        score: 7.5,
    },
    Quercetin: {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Antioxidant + neuroprotective synergy',
                strength: 'medium',
            },
            { cannabinoid: 'CBG', effect: 'Anticancer + antibacterial', strength: 'medium' },
        ],
        score: 6.5,
    },
    Apigenin: {
        interactions: [
            { cannabinoid: 'CBD', effect: 'Anxiolytic + mild estrogenic', strength: 'medium' },
            { cannabinoid: 'THC', effect: 'Sedation enhancement', strength: 'low' },
        ],
        score: 6.0,
    },
    Luteolin: {
        interactions: [
            {
                cannabinoid: 'CBD',
                effect: 'Anti-inflammatory + cognitive support',
                strength: 'medium',
            },
        ],
        score: 5.5,
    },
    Kaempferol: {
        interactions: [
            { cannabinoid: 'THC', effect: 'Neuroprotective co-activity', strength: 'low' },
            { cannabinoid: 'CBD', effect: 'Antioxidant amplification', strength: 'low' },
        ],
        score: 5.0,
    },
}

// Typical flavonoid presence by strain type
export const TYPE_FLAVONOIDS: Record<string, FlavonoidDataPoint[]> = {
    Indica: [
        {
            name: 'Cannflavin A',
            role: 'dominant',
            entourageScore: 8.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Cannflavin A'].interactions,
        },
        {
            name: 'Quercetin',
            role: 'secondary',
            entourageScore: 6.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Quercetin'].interactions,
        },
        {
            name: 'Apigenin',
            role: 'trace',
            entourageScore: 6.0,
            cannabinoidInteractions: FLAVONOID_PROFILES['Apigenin'].interactions,
        },
    ],
    Sativa: [
        {
            name: 'Luteolin',
            role: 'dominant',
            entourageScore: 5.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Luteolin'].interactions,
        },
        {
            name: 'Apigenin',
            role: 'secondary',
            entourageScore: 6.0,
            cannabinoidInteractions: FLAVONOID_PROFILES['Apigenin'].interactions,
        },
        {
            name: 'Quercetin',
            role: 'trace',
            entourageScore: 6.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Quercetin'].interactions,
        },
    ],
    Hybrid: [
        {
            name: 'Cannflavin B',
            role: 'dominant',
            entourageScore: 7.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Cannflavin B'].interactions,
        },
        {
            name: 'Quercetin',
            role: 'secondary',
            entourageScore: 6.5,
            cannabinoidInteractions: FLAVONOID_PROFILES['Quercetin'].interactions,
        },
        {
            name: 'Kaempferol',
            role: 'trace',
            entourageScore: 5.0,
            cannabinoidInteractions: FLAVONOID_PROFILES['Kaempferol'].interactions,
        },
    ],
}
