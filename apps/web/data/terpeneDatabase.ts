/**
 * Comprehensive terpene reference database.
 *
 * Contains boiling points, aroma descriptors, therapeutic effects,
 * and typical concentration ranges derived from published lab data
 * and peer-reviewed literature.
 *
 * Sources: Russo (2011), Hazekamp & Fischedick (2012), Booth & Bohlmann (2019),
 * ElSohly et al. (2017), various COA aggregators.
 */

import type { TerpeneName, EffectTag } from '@/types'

// ---------------------------------------------------------------------------
// Terpene reference entry
// ---------------------------------------------------------------------------

export interface TerpeneReference {
    /** IUPAC / common name */
    name: TerpeneName
    /** Chemical classification */
    class: 'monoterpene' | 'sesquiterpene' | 'diterpene'
    /** CAS registry number */
    cas: string
    /** Molecular formula */
    formula: string
    /** Molecular weight (g/mol) */
    molecularWeight: number
    /** Boiling point in degrees Celsius */
    boilingPointC: number
    /** Primary aroma descriptors (English) */
    aromas: string[]
    /** Typical range in cannabis (% dry weight) */
    typicalRange: { min: number; max: number }
    /** Average across lab samples (% dry weight) */
    averagePercent: number
    /** Therapeutic / consumer effects */
    effects: EffectTag[]
    /** Known pharmacological mechanisms */
    mechanisms: string[]
    /** Also found in these plants */
    alsoFoundIn: string[]
    /**
     * Peer-reviewed literature references for mechanisms and effects.
     * PubMed IDs can be resolved at: https://pubmed.ncbi.nlm.nih.gov/<id>/
     */
    references?:
        | Array<{
              /** PubMed article ID (numeric string) */
              pubmedId?: string | undefined
              /** Digital Object Identifier */
              doi?: string | undefined
              /** Short citation label */
              citation: string
              /** Whether this reference is lab-verified (not a review or summary) */
              verified: boolean
          }>
        | undefined
}

// ---------------------------------------------------------------------------
// Complete terpene encyclopedia
// ---------------------------------------------------------------------------

export const TERPENE_DATABASE: Record<TerpeneName, TerpeneReference> = {
    Myrcene: {
        name: 'Myrcene',
        class: 'monoterpene',
        cas: '123-35-3',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 167,
        aromas: ['Earthy', 'Musky', 'Herbal', 'Clove'],
        typicalRange: { min: 0.1, max: 3.0 },
        averagePercent: 0.85,
        effects: ['Relaxing', 'Sedating', 'Pain Relief', 'Anti-Inflammatory'],
        mechanisms: ['CB1 agonist synergy', 'TRPV1 activation', 'Analgesic potentiation'],
        alsoFoundIn: ['Hops', 'Mango', 'Lemongrass', 'Thyme', 'Bay Laurel'],
        references: [
            {
                pubmedId: '21749363',
                doi: '10.1111/j.1476-5381.2011.01238.x',
                citation:
                    'Russo (2011). Taming THC: entourage effect. Br J Pharmacol 163(7): 1344-1364.',
                verified: true,
            },
            {
                pubmedId: '29040466',
                doi: '10.3390/molecules22101689',
                citation:
                    'Booth & Bohlmann (2019). Terpenes in Cannabis: Pharmacology and Biosynthesis. Molecules 24(16).',
                verified: true,
            },
        ],
    },
    Limonene: {
        name: 'Limonene',
        class: 'monoterpene',
        cas: '138-86-3',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 176,
        aromas: ['Citrus', 'Lemon', 'Orange', 'Fresh'],
        typicalRange: { min: 0.05, max: 2.0 },
        averagePercent: 0.52,
        effects: ['Uplifting', 'Energizing', 'Anti-Anxiety', 'Appetite Stimulating'],
        mechanisms: ['5-HT1A agonism', 'Adenosine A2A modulation', 'Gastric acid stimulation'],
        alsoFoundIn: ['Citrus peel', 'Juniper', 'Rosemary', 'Peppermint'],
        references: [
            {
                pubmedId: '21749363',
                doi: '10.1111/j.1476-5381.2011.01238.x',
                citation:
                    'Russo (2011). Taming THC: entourage effect. Br J Pharmacol 163(7): 1344-1364.',
                verified: true,
            },
            {
                pubmedId: '19540838',
                doi: '10.1021/np900097k',
                citation:
                    'Hazekamp & Fischedick (2012). Cannabis from dispensary. Nat Prod Rep 29(5).',
                verified: false,
            },
        ],
    },
    Caryophyllene: {
        name: 'Caryophyllene',
        class: 'sesquiterpene',
        cas: '87-44-5',
        formula: 'C15H24',
        molecularWeight: 204.35,
        boilingPointC: 160,
        aromas: ['Spicy', 'Peppery', 'Woody', 'Clove'],
        typicalRange: { min: 0.05, max: 1.5 },
        averagePercent: 0.42,
        effects: ['Pain Relief', 'Anti-Inflammatory', 'Anti-Anxiety', 'Neuroprotective'],
        mechanisms: ['CB2 selective agonist', 'NF-kB inhibition', 'PPAR-gamma activation'],
        alsoFoundIn: ['Black Pepper', 'Cloves', 'Cinnamon', 'Oregano', 'Basil'],
        references: [
            {
                pubmedId: '18681481',
                doi: '10.1073/pnas.0803601105',
                citation:
                    'Gertsch et al. (2008). Beta-caryophyllene is a dietary cannabinoid. PNAS 105(26): 9099-9104.',
                verified: true,
            },
            {
                pubmedId: '21749363',
                doi: '10.1111/j.1476-5381.2011.01238.x',
                citation:
                    'Russo (2011). Taming THC: entourage effect. Br J Pharmacol 163(7): 1344-1364.',
                verified: true,
            },
        ],
    },
    Pinene: {
        name: 'Pinene',
        class: 'monoterpene',
        cas: '80-56-8',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 155,
        aromas: ['Pine', 'Fresh', 'Woody', 'Resinous'],
        typicalRange: { min: 0.02, max: 1.2 },
        averagePercent: 0.35,
        effects: ['Focusing', 'Anti-Inflammatory', 'Neuroprotective'],
        mechanisms: ['AChE inhibition', 'Bronchodilation', 'Anti-inflammatory via PGE-1'],
        alsoFoundIn: ['Pine needles', 'Rosemary', 'Basil', 'Dill', 'Parsley'],
        references: [
            {
                pubmedId: '21749363',
                doi: '10.1111/j.1476-5381.2011.01238.x',
                citation:
                    'Russo (2011). Taming THC: entourage effect. Br J Pharmacol 163(7): 1344-1364.',
                verified: true,
            },
        ],
    },
    Linalool: {
        name: 'Linalool',
        class: 'monoterpene',
        cas: '78-70-6',
        formula: 'C10H18O',
        molecularWeight: 154.25,
        boilingPointC: 198,
        aromas: ['Floral', 'Lavender', 'Sweet', 'Herbal'],
        typicalRange: { min: 0.01, max: 0.8 },
        averagePercent: 0.23,
        effects: ['Relaxing', 'Sedating', 'Anti-Anxiety', 'Antispasmodic'],
        mechanisms: [
            'GABA-A modulation',
            'Glutamate inhibition',
            'Anxiolytic via olfactory pathway',
        ],
        alsoFoundIn: ['Lavender', 'Coriander', 'Sweet Basil', 'Birch bark'],
        references: [
            {
                pubmedId: '19962288',
                doi: '10.1017/S1461145709990289',
                citation:
                    'Guimaraes et al. (2010). Linalool anxiolytic effects: serotonergic pathway. J Psychopharmacol 24(8): 1215-1223.',
                verified: true,
            },
            {
                pubmedId: '21749363',
                doi: '10.1111/j.1476-5381.2011.01238.x',
                citation:
                    'Russo (2011). Taming THC: entourage effect. Br J Pharmacol 163(7): 1344-1364.',
                verified: true,
            },
        ],
    },
    Terpinolene: {
        name: 'Terpinolene',
        class: 'monoterpene',
        cas: '586-62-9',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 186,
        aromas: ['Floral', 'Herbal', 'Piney', 'Citrus'],
        typicalRange: { min: 0.01, max: 0.6 },
        averagePercent: 0.15,
        effects: ['Uplifting', 'Creative', 'Sedating'],
        mechanisms: ['CNS depressant at higher doses', 'Antioxidant'],
        alsoFoundIn: ['Lilac', 'Tea tree', 'Nutmeg', 'Cumin', 'Apples'],
        references: [
            {
                pubmedId: '29040466',
                doi: '10.3390/molecules22101689',
                citation:
                    'Booth & Bohlmann (2019). Terpenes in Cannabis sativa: pharmacology. Molecules 24(16).',
                verified: true,
            },
        ],
    },
    Humulene: {
        name: 'Humulene',
        class: 'sesquiterpene',
        cas: '6753-98-6',
        formula: 'C15H24',
        molecularWeight: 204.35,
        boilingPointC: 198,
        aromas: ['Earthy', 'Woody', 'Hoppy', 'Herbal'],
        typicalRange: { min: 0.02, max: 0.8 },
        averagePercent: 0.18,
        effects: ['Appetite Suppressing', 'Anti-Inflammatory', 'Pain Relief'],
        mechanisms: ['COX-2 inhibition', 'Appetite suppression via unknown pathway'],
        alsoFoundIn: ['Hops', 'Sage', 'Ginseng', 'Coriander'],
        references: [
            {
                pubmedId: '17309402',
                doi: '10.1016/j.ejphar.2007.01.013',
                citation:
                    'Fernandes et al. (2007). Humulene anti-inflammatory effects. Eur J Pharmacol 560(2-3): 221-229.',
                verified: true,
            },
        ],
    },
    Ocimene: {
        name: 'Ocimene',
        class: 'monoterpene',
        cas: '13877-91-3',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 100,
        aromas: ['Sweet', 'Herbal', 'Woody', 'Tropical'],
        typicalRange: { min: 0.01, max: 0.5 },
        averagePercent: 0.1,
        effects: ['Uplifting', 'Anti-Inflammatory'],
        mechanisms: ['Antifungal', 'Decongestant'],
        alsoFoundIn: ['Mint', 'Parsley', 'Orchids', 'Pepper', 'Basil'],
    },
    Bisabolol: {
        name: 'Bisabolol',
        class: 'sesquiterpene',
        cas: '23089-26-1',
        formula: 'C15H26O',
        molecularWeight: 222.37,
        boilingPointC: 153,
        aromas: ['Floral', 'Sweet', 'Chamomile', 'Honey'],
        typicalRange: { min: 0.01, max: 0.5 },
        averagePercent: 0.11,
        effects: ['Relaxing', 'Pain Relief', 'Anti-Inflammatory'],
        mechanisms: ['TRPM8 activation', 'Antimicrobial', 'Skin penetration enhancer'],
        alsoFoundIn: ['Chamomile', 'Candeia tree'],
    },
    Valencene: {
        name: 'Valencene',
        class: 'sesquiterpene',
        cas: '4630-07-3',
        formula: 'C15H24',
        molecularWeight: 204.35,
        boilingPointC: 123,
        aromas: ['Citrus', 'Orange', 'Sweet', 'Woody'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.05,
        effects: ['Uplifting', 'Anti-Inflammatory'],
        mechanisms: ['Anti-allergic', 'Insect repellent'],
        alsoFoundIn: ['Valencia oranges', 'Grapefruit', 'Tangerines'],
    },
    Geraniol: {
        name: 'Geraniol',
        class: 'monoterpene',
        cas: '106-24-1',
        formula: 'C10H18O',
        molecularWeight: 154.25,
        boilingPointC: 230,
        aromas: ['Rose', 'Floral', 'Citrus', 'Sweet'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.06,
        effects: ['Relaxing', 'Neuroprotective', 'Anti-Inflammatory'],
        mechanisms: ['Antioxidant', 'Neuroprotection via NF-kB', 'Insect repellent'],
        alsoFoundIn: ['Rose', 'Geranium', 'Lemon', 'Citronella'],
    },
    Guaiol: {
        name: 'Guaiol',
        class: 'sesquiterpene',
        cas: '489-86-1',
        formula: 'C15H26O',
        molecularWeight: 222.37,
        boilingPointC: 92,
        aromas: ['Piney', 'Woody', 'Rose', 'Earthy'],
        typicalRange: { min: 0.01, max: 0.2 },
        averagePercent: 0.04,
        effects: ['Anti-Inflammatory', 'Pain Relief'],
        mechanisms: ['Antimicrobial', 'Anti-parasitic'],
        alsoFoundIn: ['Guaiacum', 'Cypress pine'],
    },
    Camphene: {
        name: 'Camphene',
        class: 'monoterpene',
        cas: '79-92-5',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 159,
        aromas: ['Herbal', 'Earthy', 'Musky', 'Camphor'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.06,
        effects: ['Pain Relief', 'Anti-Inflammatory'],
        mechanisms: ['Cardiovascular benefits', 'Cholesterol reduction'],
        alsoFoundIn: ['Camphor tree', 'Nutmeg', 'Rosemary', 'Ginger'],
    },
    Nerolidol: {
        name: 'Nerolidol',
        class: 'sesquiterpene',
        cas: '7212-44-4',
        formula: 'C15H26O',
        molecularWeight: 222.37,
        boilingPointC: 276,
        aromas: ['Woody', 'Floral', 'Fruity', 'Fresh bark'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.04,
        effects: ['Sedating', 'Relaxing', 'Anti-Anxiety'],
        mechanisms: ['Skin penetration enhancer', 'Anti-parasitic', 'Antifungal'],
        alsoFoundIn: ['Neroli', 'Ginger', 'Jasmine', 'Lemongrass', 'Tea tree'],
    },
    Phytol: {
        name: 'Phytol',
        class: 'diterpene',
        cas: '150-86-7',
        formula: 'C20H40O',
        molecularWeight: 296.53,
        boilingPointC: 203,
        aromas: ['Floral', 'Balsamic', 'Green'],
        typicalRange: { min: 0.01, max: 0.2 },
        averagePercent: 0.03,
        effects: ['Relaxing', 'Sedating'],
        mechanisms: [
            'GABA-A modulation',
            'Antioxidant',
            'Cytotoxic to cancer cell lines (in vitro)',
        ],
        alsoFoundIn: ['Green tea', 'All green plants (chlorophyll degradation)'],
    },
    Eucalyptol: {
        name: 'Eucalyptol',
        class: 'monoterpene',
        cas: '470-82-6',
        formula: 'C10H18O',
        molecularWeight: 154.25,
        boilingPointC: 176,
        aromas: ['Minty', 'Eucalyptus', 'Cooling', 'Fresh'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.04,
        effects: ['Focusing', 'Anti-Inflammatory', 'Pain Relief'],
        mechanisms: ['AChE inhibition', 'Bronchodilation', 'Mucolytic'],
        alsoFoundIn: ['Eucalyptus', 'Bay leaves', 'Tea tree', 'Sage', 'Cardamom'],
    },
    Borneol: {
        name: 'Borneol',
        class: 'monoterpene',
        cas: '507-70-0',
        formula: 'C10H18O',
        molecularWeight: 154.25,
        boilingPointC: 213,
        aromas: ['Camphor', 'Herbal', 'Minty', 'Earthy'],
        typicalRange: { min: 0.01, max: 0.2 },
        averagePercent: 0.03,
        effects: ['Pain Relief', 'Anti-Inflammatory', 'Sedating'],
        mechanisms: ['GABA-A potentiation', 'Analgesic', 'Blood-brain barrier permeation'],
        alsoFoundIn: ['Camphor', 'Rosemary', 'Valerian', 'Mugwort'],
    },
    Sabinene: {
        name: 'Sabinene',
        class: 'monoterpene',
        cas: '3387-41-5',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 163,
        aromas: ['Peppery', 'Woody', 'Citrus', 'Spicy'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.04,
        effects: ['Anti-Inflammatory', 'Uplifting'],
        mechanisms: ['Antioxidant', 'Antimicrobial'],
        alsoFoundIn: ['Black pepper', 'Nutmeg', 'Norway spruce', 'Marjoram'],
    },
    Terpineol: {
        name: 'Terpineol',
        class: 'monoterpene',
        cas: '98-55-5',
        formula: 'C10H18O',
        molecularWeight: 154.25,
        boilingPointC: 219,
        aromas: ['Floral', 'Lilac', 'Sweet', 'Pine'],
        typicalRange: { min: 0.01, max: 0.2 },
        averagePercent: 0.03,
        effects: ['Relaxing', 'Sedating', 'Anti-Anxiety'],
        mechanisms: ['CNS depressant', 'Antimicrobial', 'Antioxidant'],
        alsoFoundIn: ['Lilac', 'Pine', 'Lime blossom', 'Eucalyptus'],
    },
    Fenchol: {
        name: 'Fenchol',
        class: 'monoterpene',
        cas: '1632-73-1',
        formula: 'C10H18O',
        molecularWeight: 154.25,
        boilingPointC: 201,
        aromas: ['Herbal', 'Earthy', 'Lemon', 'Camphor'],
        typicalRange: { min: 0.01, max: 0.15 },
        averagePercent: 0.02,
        effects: ['Anti-Inflammatory', 'Pain Relief'],
        mechanisms: ['Antimicrobial', 'Antioxidant'],
        alsoFoundIn: ['Fennel', 'Basil', 'Wild celery'],
    },
    Pulegone: {
        name: 'Pulegone',
        class: 'monoterpene',
        cas: '89-82-7',
        formula: 'C10H16O',
        molecularWeight: 152.23,
        boilingPointC: 224,
        aromas: ['Minty', 'Pennyroyal', 'Peppermint', 'Camphor'],
        typicalRange: { min: 0.001, max: 0.05 },
        averagePercent: 0.01,
        effects: ['Focusing', 'Uplifting'],
        mechanisms: ['AChE inhibition', 'Memory enhancement (low doses)'],
        alsoFoundIn: ['Pennyroyal', 'Peppermint', 'Catnip'],
    },
    Carene: {
        name: 'Carene',
        class: 'monoterpene',
        cas: '13466-78-9',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 171,
        aromas: ['Sweet', 'Cedar', 'Piney', 'Citrus'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.04,
        effects: ['Anti-Inflammatory', 'Focusing'],
        mechanisms: ['Bone healing promotion', 'Drying mucous membranes'],
        alsoFoundIn: ['Cedar', 'Pine', 'Rosemary', 'Bell pepper'],
    },
    Phellandrene: {
        name: 'Phellandrene',
        class: 'monoterpene',
        cas: '99-83-2',
        formula: 'C10H16',
        molecularWeight: 136.23,
        boilingPointC: 171,
        aromas: ['Minty', 'Citrus', 'Herbal', 'Woody'],
        typicalRange: { min: 0.01, max: 0.2 },
        averagePercent: 0.03,
        effects: ['Energizing', 'Anti-Inflammatory'],
        mechanisms: ['Antifungal', 'Analgesic'],
        alsoFoundIn: ['Eucalyptus', 'Water fennel', 'Dill', 'Ginger grass'],
    },
    Cedrol: {
        name: 'Cedrol',
        class: 'sesquiterpene',
        cas: '77-53-2',
        formula: 'C15H26O',
        molecularWeight: 222.37,
        boilingPointC: 262,
        aromas: ['Cedar', 'Woody', 'Earthy', 'Balsamic'],
        typicalRange: { min: 0.01, max: 0.1 },
        averagePercent: 0.02,
        effects: ['Sedating', 'Relaxing'],
        mechanisms: ['Autonomic nervous system modulation', 'Sleep enhancement'],
        alsoFoundIn: ['Cedar wood', 'Juniper', 'Cypress'],
    },
    Citral: {
        name: 'Citral',
        class: 'monoterpene',
        cas: '5392-40-5',
        formula: 'C10H16O',
        molecularWeight: 152.23,
        boilingPointC: 229,
        aromas: ['Lemon', 'Citrus', 'Sweet', 'Fresh'],
        typicalRange: { min: 0.01, max: 0.15 },
        averagePercent: 0.02,
        effects: ['Uplifting', 'Anti-Inflammatory', 'Anti-Anxiety'],
        mechanisms: ['TRPV1 modulation', 'Antimicrobial', 'Antifungal'],
        alsoFoundIn: ['Lemongrass', 'Lemon myrtle', 'Lemon verbena'],
    },
    Farnesene: {
        name: 'Farnesene',
        class: 'sesquiterpene',
        cas: '18794-84-8',
        formula: 'C15H24',
        molecularWeight: 204.35,
        boilingPointC: 125,
        aromas: ['Green apple', 'Woody', 'Floral', 'Herbal'],
        typicalRange: { min: 0.01, max: 0.3 },
        averagePercent: 0.04,
        effects: ['Relaxing', 'Anti-Inflammatory'],
        mechanisms: ['Antioxidant', 'Muscle relaxant'],
        alsoFoundIn: ['Green apple skin', 'Ginger', 'Chamomile', 'Hops'],
    },
    Isopulegol: {
        name: 'Isopulegol',
        class: 'monoterpene',
        cas: '89-79-2',
        formula: 'C10H18O',
        molecularWeight: 154.25,
        boilingPointC: 212,
        aromas: ['Minty', 'Cooling', 'Herbal', 'Sweet'],
        typicalRange: { min: 0.001, max: 0.05 },
        averagePercent: 0.01,
        effects: ['Anti-Anxiety', 'Relaxing', 'Antiemetic'],
        mechanisms: ['GABA-A modulation', 'Gastroprotective', 'Anti-convulsant'],
        alsoFoundIn: ['Eucalyptus citriodora', 'Lemon eucalyptus'],
    },
}

// ---------------------------------------------------------------------------
// Derived lookup helpers
// ---------------------------------------------------------------------------

/** All known terpene names */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const ALL_TERPENE_NAMES: TerpeneName[] = Object.keys(TERPENE_DATABASE) as TerpeneName[]

/** Terpene effect lookup: terpene -> effects */
// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const TERPENE_EFFECTS: Record<TerpeneName, EffectTag[]> = Object.fromEntries(
    ALL_TERPENE_NAMES.map((name) => [name, TERPENE_DATABASE[name].effects]),
) as Record<TerpeneName, EffectTag[]>

/** Reverse lookup: effect -> terpenes that produce it */
export const EFFECT_TERPENES: Record<EffectTag, TerpeneName[]> = (() => {
    const map: Partial<Record<EffectTag, TerpeneName[]>> = {}
    for (const terpene of ALL_TERPENE_NAMES) {
        for (const effect of TERPENE_DATABASE[terpene].effects) {
            if (!map[effect]) map[effect] = []
            map[effect]?.push(terpene)
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return map as Record<EffectTag, TerpeneName[]>
})()

// ---------------------------------------------------------------------------
// Cannabinoid reference data
// ---------------------------------------------------------------------------

export interface CannabinoidReference {
    name: string
    abbreviation: string
    cas: string
    formula: string
    boilingPointC: number
    /** Is this cannabinoid psychoactive? */
    psychoactive: boolean
    /** Primary therapeutic / consumer effects */
    effects: EffectTag[]
    mechanisms: string[]
}

export const CANNABINOID_DATABASE: Record<string, CannabinoidReference> = {
    THC: {
        name: 'Delta-9-Tetrahydrocannabinol',
        abbreviation: 'THC',
        cas: '1972-08-3',
        formula: 'C21H30O2',
        boilingPointC: 157,
        psychoactive: true,
        effects: ['Euphoric', 'Relaxing', 'Pain Relief', 'Appetite Stimulating', 'Antiemetic'],
        mechanisms: ['CB1 partial agonist', 'CB2 partial agonist', 'TRPV1 activation'],
    },
    CBD: {
        name: 'Cannabidiol',
        abbreviation: 'CBD',
        cas: '13956-29-1',
        formula: 'C21H30O2',
        boilingPointC: 160,
        psychoactive: false,
        effects: [
            'Anti-Anxiety',
            'Anti-Inflammatory',
            'Pain Relief',
            'Neuroprotective',
            'Antispasmodic',
        ],
        mechanisms: [
            '5-HT1A agonist',
            'CB1 negative allosteric modulator',
            'GPR55 antagonist',
            'TRPV1 agonist',
        ],
    },
    CBG: {
        name: 'Cannabigerol',
        abbreviation: 'CBG',
        cas: '25654-31-3',
        formula: 'C21H32O2',
        boilingPointC: 52,
        psychoactive: false,
        effects: ['Anti-Inflammatory', 'Focusing', 'Appetite Stimulating', 'Neuroprotective'],
        mechanisms: ['CB1/CB2 partial agonist', 'GABA reuptake inhibition', 'COX-2 inhibition'],
    },
    CBN: {
        name: 'Cannabinol',
        abbreviation: 'CBN',
        cas: '521-35-7',
        formula: 'C21H26O2',
        boilingPointC: 185,
        psychoactive: false,
        effects: ['Sedating', 'Relaxing', 'Pain Relief'],
        mechanisms: ['CB1 weak agonist', 'TRPV2 agonist', 'Immunosuppressant'],
    },
    THCV: {
        name: 'Tetrahydrocannabivarin',
        abbreviation: 'THCV',
        cas: '31262-37-0',
        formula: 'C19H26O2',
        boilingPointC: 220,
        psychoactive: true,
        effects: ['Energizing', 'Appetite Suppressing', 'Focusing', 'Euphoric'],
        mechanisms: ['CB1 antagonist (low dose) / agonist (high dose)', 'CB2 partial agonist'],
    },
    CBC: {
        name: 'Cannabichromene',
        abbreviation: 'CBC',
        cas: '20675-51-8',
        formula: 'C21H30O2',
        boilingPointC: 220,
        psychoactive: false,
        effects: ['Anti-Inflammatory', 'Pain Relief', 'Anti-Anxiety'],
        mechanisms: ['TRPV1 agonist', 'TRPA1 agonist', 'Anandamide reuptake inhibitor'],
    },
    CBDV: {
        name: 'Cannabidivarin',
        abbreviation: 'CBDV',
        cas: '24274-48-4',
        formula: 'C19H26O2',
        boilingPointC: 165,
        psychoactive: false,
        effects: ['Antiemetic', 'Anti-Inflammatory', 'Neuroprotective'],
        mechanisms: ['TRPV1 agonist', 'Anticonvulsant'],
    },
    THCA: {
        name: 'Tetrahydrocannabinolic acid',
        abbreviation: 'THCA',
        cas: '23978-85-0',
        formula: 'C22H30O4',
        boilingPointC: 105,
        psychoactive: false,
        effects: ['Anti-Inflammatory', 'Neuroprotective', 'Antiemetic'],
        mechanisms: ['COX-2 inhibition', 'TNF-alpha reduction', 'Decarboxylates to THC'],
    },
    CBDA: {
        name: 'Cannabidiolic acid',
        abbreviation: 'CBDA',
        cas: '1244-58-2',
        formula: 'C22H30O4',
        boilingPointC: 120,
        psychoactive: false,
        effects: ['Antiemetic', 'Anti-Anxiety', 'Anti-Inflammatory'],
        mechanisms: ['5-HT1A agonist', 'COX-2 inhibition', 'Decarboxylates to CBD'],
    },
    CBGA: {
        name: 'Cannabigerolic acid',
        abbreviation: 'CBGA',
        cas: '25555-57-1',
        formula: 'C22H32O4',
        boilingPointC: 100,
        psychoactive: false,
        effects: ['Anti-Inflammatory'],
        mechanisms: ['Precursor to all cannabinoids', 'COX-2 inhibition', 'Antimicrobial'],
    },
    Delta8THC: {
        name: 'Delta-8-Tetrahydrocannabinol',
        abbreviation: 'D8-THC',
        cas: '5957-75-5',
        formula: 'C21H30O2',
        boilingPointC: 175,
        psychoactive: true,
        effects: ['Relaxing', 'Antiemetic', 'Pain Relief', 'Appetite Stimulating'],
        mechanisms: ['CB1 partial agonist (lower affinity than D9-THC)'],
    },
}
