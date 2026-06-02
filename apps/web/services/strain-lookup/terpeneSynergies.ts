import type { TerpeneInteraction } from '@/services/strain-lookup/strainLookupTypes'

export const TERPENE_SYNERGIES: Record<string, TerpeneInteraction[]> = {
    Myrcene: [
        { cannabinoid: 'THC', effect: 'Enhanced sedation + BBB permeability', strength: 'high' },
        { cannabinoid: 'CBD', effect: 'Amplified anti-inflammatory', strength: 'medium' },
    ],
    Limonene: [
        { cannabinoid: 'THC', effect: 'Anxiety reduction + mood elevation', strength: 'high' },
        { cannabinoid: 'CBD', effect: 'Improved oral bioavailability', strength: 'medium' },
    ],
    Caryophyllene: [
        { cannabinoid: 'CBD', effect: 'Synergistic anti-inflammatory via CB2', strength: 'high' },
        {
            cannabinoid: 'THC',
            effect: 'Reduced psychoactivity + neuroprotection',
            strength: 'medium',
        },
    ],
    Linalool: [
        { cannabinoid: 'THC', effect: 'Calming + enhanced analgesic effect', strength: 'high' },
        { cannabinoid: 'CBD', effect: 'Anti-anxiety amplification (GABA)', strength: 'high' },
    ],
    Pinene: [
        { cannabinoid: 'THC', effect: 'Memory retention (AChE inhibition)', strength: 'medium' },
        {
            cannabinoid: 'CBD',
            effect: 'Bronchodilation + synergistic anti-inflammatory',
            strength: 'low',
        },
    ],
    Terpinolene: [
        { cannabinoid: 'THC', effect: 'Uplifting + energy enhancement', strength: 'medium' },
        { cannabinoid: 'CBG', effect: 'Mild antibacterial synergy', strength: 'low' },
    ],
    Humulene: [
        {
            cannabinoid: 'CBD',
            effect: 'Appetite suppression + anti-inflammatory',
            strength: 'medium',
        },
        { cannabinoid: 'THC', effect: 'Anti-inflammatory (COX-1/2)', strength: 'medium' },
    ],
    Ocimene: [
        { cannabinoid: 'CBD', effect: 'Antifungal + antiviral synergy', strength: 'low' },
        { cannabinoid: 'THC', effect: 'Mood uplift + decongestant', strength: 'low' },
    ],
    Bisabolol: [
        { cannabinoid: 'CBD', effect: 'Skin permeability + soothing', strength: 'medium' },
        { cannabinoid: 'THC', effect: 'Analgesic potentiation', strength: 'low' },
    ],
    Nerolidol: [
        { cannabinoid: 'THC', effect: 'Sedation + antiparasitic', strength: 'medium' },
        { cannabinoid: 'CBD', effect: 'Antioxidant synergy', strength: 'low' },
    ],
    Valencene: [
        { cannabinoid: 'THC', effect: 'Anti-allergic + mood brightening', strength: 'low' },
        { cannabinoid: 'CBD', effect: 'Mild skin-protective synergy', strength: 'low' },
    ],
    Geraniol: [
        { cannabinoid: 'CBD', effect: 'Neuroprotective + antioxidant', strength: 'medium' },
        { cannabinoid: 'THC', effect: 'Mood-lifting + antifungal', strength: 'low' },
    ],
}
