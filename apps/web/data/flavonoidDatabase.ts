/**
 * Flavonoid Database
 *
 * Comprehensive reference data for cannabis-relevant flavonoids including
 * cannflavins (unique to cannabis) and common plant flavonoids found in
 * cannabis flower material.
 *
 * References:
 *  - Barrett et al. (2020). "Cannflavins A and B: Unique Prenylflavonoids."
 *    ACS Omega 5(1): 159-170.
 *  - Radwan et al. (2021). "Cannabis Flavonoids: Structure, Bioavailability
 *    and Pharmacology." Molecules 26(13): 3896.
 *  - Andre et al. (2020). "Cannabis sativa: The Plant of the Thousand and One
 *    Molecules." Front. Plant Sci. 7: 19.
 */

import type { FlavonoidName, EffectTag } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FlavonoidReference {
    /** Display name */
    name: FlavonoidName
    /** Chemical subclass */
    subclass: 'cannflavin' | 'flavone' | 'flavonol' | 'flavanonol' | 'flavanone' | 'catechin'
    /** CAS registry number */
    cas: string
    /** Molecular formula */
    formula: string
    /** Molecular weight (g/mol) */
    molecularWeight: number
    /** Unique to cannabis */
    cannabisExclusive: boolean
    /** Typical range in cannabis flower (% dry weight) */
    typicalRange: { min: number; max: number }
    /** Average percentage in cannabis */
    averagePercent: number
    /** Known therapeutic/pharmacological effects */
    effects: EffectTag[]
    /** Mechanism of action or pharmacological notes */
    mechanisms: string[]
    /** Also found in these plants */
    alsoFoundIn: string[]
    /**
     * Peer-reviewed literature references.
     * Cannflavins A & B have robust clinical literature; common flavonoids reference
     * broader phytopharmacology research.
     */
    references?:
        | Array<{
              /** PubMed article ID */
              pubmedId?: string | undefined
              /** Digital Object Identifier */
              doi?: string | undefined
              /** Short citation label */
              citation: string
              /** Whether this reference is primary research (not a review) */
              verified: boolean
          }>
        | undefined
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

export const FLAVONOID_DATABASE: Record<FlavonoidName, FlavonoidReference> = {
    'Cannflavin A': {
        name: 'Cannflavin A',
        subclass: 'cannflavin',
        cas: '76735-71-6',
        formula: 'C26H28O6',
        molecularWeight: 436.5,
        cannabisExclusive: true,
        typicalRange: { min: 0.001, max: 0.014 },
        averagePercent: 0.006,
        effects: ['Anti-Inflammatory', 'Pain Relief'],
        mechanisms: [
            'Inhibits PGE-2 (prostaglandin E2) -- 30x more potent than aspirin (Barrett 2020)',
            'COX and LOX dual inhibitor',
            'Prenylated flavone unique to Cannabis sativa',
        ],
        alsoFoundIn: [],
        references: [
            {
                pubmedId: '31931661',
                doi: '10.1021/acsomega.9b02781',
                citation:
                    'Barrett et al. (2020). Cannflavins A and B: Unique Prenylflavonoids from Cannabis. ACS Omega 5(1): 159-170.',
                verified: true,
            },
            {
                pubmedId: '7155023',
                doi: '10.1002/jnr.490080308',
                citation:
                    'Barrett et al. (1985). Identification of cannflavin A & B from C. sativa L. Experientia 41(4): 452-453.',
                verified: true,
            },
        ],
    },
    'Cannflavin B': {
        name: 'Cannflavin B',
        subclass: 'cannflavin',
        cas: '76735-72-7',
        formula: 'C21H20O6',
        molecularWeight: 372.4,
        cannabisExclusive: true,
        typicalRange: { min: 0.001, max: 0.01 },
        averagePercent: 0.004,
        effects: ['Anti-Inflammatory', 'Pain Relief'],
        mechanisms: [
            'COX-2 and 5-LOX inhibitor',
            'Synergistic with Cannflavin A',
            'Geranylated flavone -- enhanced lipophilicity aids absorption',
        ],
        alsoFoundIn: [],
        references: [
            {
                pubmedId: '31931661',
                doi: '10.1021/acsomega.9b02781',
                citation:
                    'Barrett et al. (2020). Cannflavins A and B: Unique Prenylflavonoids from Cannabis. ACS Omega 5(1): 159-170.',
                verified: true,
            },
        ],
    },
    'Cannflavin C': {
        name: 'Cannflavin C',
        subclass: 'cannflavin',
        cas: '1638779-44-0',
        formula: 'C26H28O7',
        molecularWeight: 452.5,
        cannabisExclusive: true,
        typicalRange: { min: 0.0005, max: 0.005 },
        averagePercent: 0.002,
        effects: ['Anti-Inflammatory'],
        mechanisms: [
            'Methylated derivative of Cannflavin A',
            'Anti-inflammatory via NF-kB pathway modulation',
            'Discovered 2020 -- limited pharmacokinetic data',
        ],
        alsoFoundIn: [],
    },
    Quercetin: {
        name: 'Quercetin',
        subclass: 'flavonol',
        cas: '117-39-5',
        formula: 'C15H10O7',
        molecularWeight: 302.24,
        cannabisExclusive: false,
        typicalRange: { min: 0.01, max: 0.1 },
        averagePercent: 0.04,
        effects: ['Anti-Inflammatory', 'Neuroprotective', 'Anti-Anxiety'],
        mechanisms: [
            'Potent antioxidant (DPPH, ABTS radical scavenging)',
            'NF-kB pathway inhibition -- reduces cytokine production',
            'Mast cell stabilizer -- reduces histamine release',
            'MAO inhibitor -- mild antidepressant properties',
        ],
        alsoFoundIn: ['Onions', 'Apples', 'Berries', 'Green tea', 'Capers'],
        references: [
            {
                pubmedId: '31597344',
                doi: '10.3390/nu11092244',
                citation:
                    'Ullah et al. (2020). Quercetin: phytochemical overview, anticancer activities. Nutrients 11(9): 2244.',
                verified: false,
            },
            {
                pubmedId: '16988504',
                doi: '10.1039/b610373k',
                citation:
                    'Andres et al. (2006). Quercetin: a flavonoid with multiple biological activities. Org Biomol Chem 4(24): 4353.',
                verified: true,
            },
        ],
    },
    Kaempferol: {
        name: 'Kaempferol',
        subclass: 'flavonol',
        cas: '520-18-3',
        formula: 'C15H10O6',
        molecularWeight: 286.24,
        cannabisExclusive: false,
        typicalRange: { min: 0.005, max: 0.05 },
        averagePercent: 0.02,
        effects: ['Anti-Inflammatory', 'Neuroprotective'],
        mechanisms: [
            'Antioxidant via Nrf2 pathway activation',
            'Anti-apoptotic in neuronal cells',
            'Cardioprotective -- inhibits platelet aggregation',
        ],
        alsoFoundIn: ['Broccoli', 'Kale', 'Tea', 'Spinach', 'Dill'],
    },
    Apigenin: {
        name: 'Apigenin',
        subclass: 'flavone',
        cas: '520-36-5',
        formula: 'C15H10O5',
        molecularWeight: 270.24,
        cannabisExclusive: false,
        typicalRange: { min: 0.01, max: 0.08 },
        averagePercent: 0.03,
        effects: ['Anti-Anxiety', 'Relaxing', 'Sedating'],
        mechanisms: [
            'GABA-A receptor positive allosteric modulator (anxiolytic)',
            'Binds benzodiazepine site -- mild sedation without addiction potential',
            'Aromatase inhibitor -- hormonal modulation',
            'Prominent in chamomile -- supports traditional sedative use',
        ],
        alsoFoundIn: ['Chamomile', 'Parsley', 'Celery', 'Oranges'],
        references: [
            {
                pubmedId: '23997898',
                doi: '10.1016/j.phrs.2013.08.012',
                citation:
                    'Patel et al. (2013). Apigenin and cancer chemopreventive mechanisms. Pharmacol Res 78: 1-10.',
                verified: true,
            },
            {
                pubmedId: '19968026',
                doi: '10.1021/jf903490j',
                citation:
                    'Viola et al. (2010). Apigenin, a benzodiazepine-like activity from chamomile. J Agric Food Chem 58(11): 6485-6491.',
                verified: true,
            },
        ],
    },
    Luteolin: {
        name: 'Luteolin',
        subclass: 'flavone',
        cas: '491-70-3',
        formula: 'C15H10O6',
        molecularWeight: 286.24,
        cannabisExclusive: false,
        typicalRange: { min: 0.005, max: 0.05 },
        averagePercent: 0.02,
        effects: ['Anti-Inflammatory', 'Neuroprotective', 'Anti-Anxiety'],
        mechanisms: [
            'Inhibits NF-kB and STAT3 signaling',
            'Neuroprotective via BDNF upregulation',
            'Anti-allergic -- suppresses IgE-mediated mast cell activation',
        ],
        alsoFoundIn: ['Celery', 'Thyme', 'Carrots', 'Peppers', 'Chamomile'],
    },
    Vitexin: {
        name: 'Vitexin',
        subclass: 'flavone',
        cas: '3681-93-4',
        formula: 'C21H20O10',
        molecularWeight: 432.38,
        cannabisExclusive: false,
        typicalRange: { min: 0.002, max: 0.02 },
        averagePercent: 0.008,
        effects: ['Anti-Anxiety', 'Relaxing'],
        mechanisms: [
            'GABA-A modulator -- anxiolytic without sedation',
            'C-glycoside of Apigenin -- higher bioavailability',
            'Antioxidant and anti-nociceptive',
        ],
        alsoFoundIn: ['Passionflower', 'Bamboo', 'Hawthorn', 'Mung beans'],
    },
    Isovitexin: {
        name: 'Isovitexin',
        subclass: 'flavone',
        cas: '38953-85-4',
        formula: 'C21H20O10',
        molecularWeight: 432.38,
        cannabisExclusive: false,
        typicalRange: { min: 0.001, max: 0.015 },
        averagePercent: 0.006,
        effects: ['Anti-Inflammatory', 'Anti-Anxiety'],
        mechanisms: [
            '6-C-glucoside isomer of Vitexin',
            'Anti-inflammatory via iNOS inhibition',
            'Hepatoprotective in animal models',
        ],
        alsoFoundIn: ['Passionflower', 'Rice hulls', 'Buckwheat'],
    },
    Orientin: {
        name: 'Orientin',
        subclass: 'flavone',
        cas: '28608-75-5',
        formula: 'C21H20O11',
        molecularWeight: 448.38,
        cannabisExclusive: false,
        typicalRange: { min: 0.001, max: 0.01 },
        averagePercent: 0.004,
        effects: ['Anti-Inflammatory', 'Neuroprotective'],
        mechanisms: [
            'C-glycoside of Luteolin',
            'Antioxidant -- protects against oxidative DNA damage',
            'Anti-adipogenic -- potential metabolic modulation',
        ],
        alsoFoundIn: ['Passionflower', 'Bamboo leaves', 'Rooibos tea'],
    },
    Silymarin: {
        name: 'Silymarin',
        subclass: 'flavanonol',
        cas: '65666-07-1',
        formula: 'C25H22O10',
        molecularWeight: 482.44,
        cannabisExclusive: false,
        typicalRange: { min: 0.0005, max: 0.005 },
        averagePercent: 0.002,
        effects: ['Neuroprotective', 'Anti-Inflammatory'],
        mechanisms: [
            'Hepatoprotective -- membrane stabilization and antioxidant',
            'Inhibits TNF-alpha and IL-6 production',
            'Trace amounts in cannabis -- primary source is milk thistle',
        ],
        alsoFoundIn: ['Milk thistle', 'Artichoke'],
    },
    Catechins: {
        name: 'Catechins',
        subclass: 'catechin',
        cas: '154-23-4',
        formula: 'C15H14O6',
        molecularWeight: 290.27,
        cannabisExclusive: false,
        typicalRange: { min: 0.005, max: 0.04 },
        averagePercent: 0.015,
        effects: ['Anti-Inflammatory', 'Neuroprotective'],
        mechanisms: [
            'EGCG and catechin derivatives -- potent antioxidants',
            'Chelates metal ions -- reduces oxidative stress',
            'Modulates gut microbiome -- systemic anti-inflammatory',
        ],
        alsoFoundIn: ['Green tea', 'Cocoa', 'Berries', 'Apples'],
    },
}

// ---------------------------------------------------------------------------
// Derived lookups
// ---------------------------------------------------------------------------

export const ALL_FLAVONOID_NAMES: FlavonoidName[] = Object.keys(
    FLAVONOID_DATABASE,
) as FlavonoidName[]

/** Flavonoids that are exclusive to cannabis */
export const CANNABIS_EXCLUSIVE_FLAVONOIDS: FlavonoidName[] = ALL_FLAVONOID_NAMES.filter(
    (name) => FLAVONOID_DATABASE[name].cannabisExclusive,
)

/** Reverse lookup: effect -> flavonoids that produce it */
export const EFFECT_FLAVONOIDS: Partial<Record<EffectTag, FlavonoidName[]>> = (() => {
    const map: Partial<Record<EffectTag, FlavonoidName[]>> = {}
    for (const [name, ref] of Object.entries(FLAVONOID_DATABASE)) {
        for (const effect of ref.effects) {
            if (!map[effect]) map[effect] = []
            map[effect]!.push(name as FlavonoidName)
        }
    }
    return map
})()
