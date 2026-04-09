/**
 * Entourage Effect Simulator
 *
 * Scientific basis:
 *  - Russo (2019). "The Case for the Entourage Effect and Conventional Breeding
 *    of Clinical Cannabis: No 'Strain', No Gain." Front. Plant Sci. 9: 1969.
 *  - Ferber et al. (2020). "Modulation of the Endocannabinoid System by Terpenes
 *    ..." Cannabis Cannabinoid Res. 5(3): 197-203.
 *  - McPartland & Russo (2001). "Cannabis and Cannabis Extracts: Greater Than
 *    the Sum of Their Parts?" J. Cannabis Ther. 1(3-4): 103-132.
 *  - Cuttler et al. (2021). "Blunted stress reactivity in chronic cannabis users."
 *    Psychopharmacology 238: 2025-2034.
 *  - Batiha et al. (2021). "The Pharmacological Activity, Biochemical Properties,
 *    and Pharmacokinetics of the Major Natural Polyphenolic Flavonoid: Quercetin."
 *    Foods 9(3): 374.
 */

import type { TerpeneName, EffectTag } from '@/types'

// ---------------------------------------------------------------------------
// Terpene effect database (evidence-graded)
// ---------------------------------------------------------------------------

interface TerpeneEntry {
    /** Short pharmacological description for display */
    description: string
    /** Primary effect tags (high confidence from multiple studies) */
    primaryEffects: EffectTag[]
    /** Secondary / context-dependent effects */
    secondaryEffects: EffectTag[]
    /** Whether it acts on endocannabinoid receptors directly */
    cbReceptorActivity: 'none' | 'CB1' | 'CB2' | 'both'
    /** Notes for UI tooltip */
    notes: string
}

export const TERPENE_DB: Record<TerpeneName, TerpeneEntry> = {
    Myrcene: {
        description: 'Most abundant cannabis terpene; earthy/musky/herbal aroma.',
        primaryEffects: ['Relaxing', 'Sedating', 'Pain Relief'],
        secondaryEffects: ['Appetite Stimulating', 'Anti-Inflammatory'],
        cbReceptorActivity: 'CB1',
        notes: 'Myrcene increases permeability of the blood-brain barrier, potentiating THC uptake (Russo 2019). Known as the "couch-lock" terpene above 0.5 % concentration.',
    },
    Limonene: {
        description: 'Citrus aroma; common in sativas and sativa-dominant hybrids.',
        primaryEffects: ['Uplifting', 'Euphoric', 'Anti-Anxiety'],
        secondaryEffects: ['Focusing', 'Anti-Inflammatory'],
        cbReceptorActivity: 'none',
        notes: 'Elevates mood via serotonin and dopamine modulation. Synergises with CBD to enhance oral bioavailability (Ferber 2020).',
    },
    Caryophyllene: {
        description: 'Peppery/spicy aroma. Only terpene that directly activates CB2 receptors.',
        primaryEffects: ['Pain Relief', 'Anti-Inflammatory', 'Anti-Anxiety'],
        secondaryEffects: ['Neuroprotective'],
        cbReceptorActivity: 'CB2',
        notes: 'Unique among terpenes: acts as a full CB2 agonist (Gertsch 2008). Particularly valuable in CBD-dominant and high-THC medical cultivars.',
    },
    Pinene: {
        description: 'Pine/fir forest aroma. α-Pinene is the most common terpene in nature.',
        primaryEffects: ['Focusing', 'Energizing', 'Uplifting'],
        secondaryEffects: ['Anti-Inflammatory', 'Neuroprotective'],
        cbReceptorActivity: 'none',
        notes: 'Acetylcholinesterase inhibitor — counteracts THC-induced short-term memory impairment (McPartland & Russo 2001). Bronchodilator effect supports respiratory delivery.',
    },
    Linalool: {
        description: 'Floral/lavender aroma; calming profile similar to aromatherapy lavender.',
        primaryEffects: ['Sedating', 'Anti-Anxiety', 'Antispasmodic'],
        secondaryEffects: ['Pain Relief', 'Antiemetic'],
        cbReceptorActivity: 'none',
        notes: 'GABA-A receptor modulation (Russo 2019). Strong synergy with CBD for anticonvulsant and anxiolytic effects.',
    },
    Terpinolene: {
        description: 'Complex floral/herbal/fresh aroma; dominated by sativa varieties.',
        primaryEffects: ['Uplifting', 'Energizing', 'Creative'],
        secondaryEffects: ['Anti-Anxiety'],
        cbReceptorActivity: 'none',
        notes: 'Produces the characteristic "head-high" sativa sensation. Acts as antioxidant and mild sedative at high concentrations in animal studies.',
    },
    Humulene: {
        description: 'Earthy/hoppy aroma (hops are high in humulene); found in many indicas.',
        primaryEffects: ['Appetite Suppressing', 'Anti-Inflammatory'],
        secondaryEffects: ['Pain Relief'],
        cbReceptorActivity: 'none',
        notes: 'Anti-obesity properties in rodent studies. Counteracts typical THC-induced appetite increase — relevant for medical patients monitoring weight.',
    },
    Ocimene: {
        description: 'Sweet/herbal/woody aroma; present in many tropical sativa genetics.',
        primaryEffects: ['Uplifting', 'Creative'],
        secondaryEffects: ['Antiemetic'],
        cbReceptorActivity: 'none',
        notes: 'Antiviral and antifungal properties in vitro. Emerging research only; clinical data limited.',
    },
    Bisabolol: {
        description: 'Subtle floral/chamomile aroma; skin-care terpene.',
        primaryEffects: ['Relaxing', 'Anti-Anxiety'],
        secondaryEffects: ['Anti-Inflammatory'],
        cbReceptorActivity: 'none',
        notes: 'Anti-inflammatory via prostaglandin inhibition. Enhances skin penetration of cannabinoids — relevant for topical preparations.',
    },
    Valencene: {
        description: 'Citrus/orange-peel aroma; found in Valencia oranges and some hybrids.',
        primaryEffects: ['Uplifting', 'Energizing'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Insect-repellent properties. Limited human pharmacology data; primarily characterises flavour.',
    },
    Geraniol: {
        description: 'Rose/citrus aroma; natural insect repellent.',
        primaryEffects: ['Relaxing', 'Anti-Inflammatory'],
        secondaryEffects: ['Neuroprotective'],
        cbReceptorActivity: 'none',
        notes: "Neuroprotective in Parkinson's disease models. Antioxidant and antibacterial.",
    },
    Guaiol: {
        description: 'Pine/rose aroma; rarer terpene found in high-altitude landrace genetics.',
        primaryEffects: ['Anti-Inflammatory', 'Antispasmodic'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Traditionally used as an expectorant. Research in cannabis context is limited.',
    },
    Camphene: {
        description: 'Damp woodlands / fir needles aroma; often accompanies Myrcene.',
        primaryEffects: ['Anti-Inflammatory', 'Antispasmodic'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Potent antioxidant via DPPH assay. May lower triglycerides and cholesterol (Vallianou 2011).',
    },
    Nerolidol: {
        description: 'Subtle woody/floral aroma; found in ginger, jasmine, and cannabis.',
        primaryEffects: ['Sedating', 'Relaxing'],
        secondaryEffects: ['Anti-Inflammatory', 'Antiemetic'],
        cbReceptorActivity: 'none',
        notes: 'Potent antifungal and antiparasitic. Enhances transdermal cannabinoid delivery.',
    },
    Phytol: {
        description: 'Grassy aroma; degradation product of chlorophyll.',
        primaryEffects: ['Relaxing', 'Sedating'],
        secondaryEffects: ['Anti-Anxiety'],
        cbReceptorActivity: 'none',
        notes: 'GABAergic activity — inhibitory neurotransmitter potentiation. Rare but present in some rich-chlorophyll harvest cannabis.',
    },
    Eucalyptol: {
        description: 'Minty/camphor aroma; dominant in eucalyptus and rosemary.',
        primaryEffects: ['Focusing', 'Energizing'],
        secondaryEffects: ['Anti-Inflammatory'],
        cbReceptorActivity: 'none',
        notes: 'Crosses blood-brain barrier rapidly. Anti-inflammatory via NF-kB pathway inhibition.',
    },
    Borneol: {
        description: 'Camphor/menthol aroma; traditional Chinese medicine ingredient.',
        primaryEffects: ['Relaxing', 'Pain Relief'],
        secondaryEffects: ['Anti-Inflammatory'],
        cbReceptorActivity: 'none',
        notes: 'Enhances blood-brain barrier permeability for co-administered compounds.',
    },
    Sabinene: {
        description: 'Spicy/woody aroma; found in black pepper and nutmeg.',
        primaryEffects: ['Anti-Inflammatory', 'Uplifting'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Antioxidant properties. Limited clinical data in cannabis context.',
    },
    Terpineol: {
        description: 'Lilac/floral aroma; common in lilac and pine oils.',
        primaryEffects: ['Relaxing', 'Sedating'],
        secondaryEffects: ['Anti-Anxiety'],
        cbReceptorActivity: 'none',
        notes: 'Often co-occurs with Pinene. Antibiotic and antioxidant in vitro.',
    },
    Fenchol: {
        description: 'Camphor/citrus aroma; found in basil and fennel.',
        primaryEffects: ['Anti-Inflammatory'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Antimicrobial activity. Research in cannabis pharmacology is emerging.',
    },
    Pulegone: {
        description: 'Minty/camphor aroma; found in pennyroyal and some cannabis cultivars.',
        primaryEffects: ['Focusing', 'Energizing'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Acetylcholinesterase inhibitor — may support memory. Present only in trace amounts.',
    },
    Carene: {
        description: 'Sweet/cedar aroma; found in cedar, pine, and rosemary.',
        primaryEffects: ['Focusing', 'Anti-Inflammatory'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Known for drying properties — may reduce excess fluids. Supports bone repair in animal studies.',
    },
    Phellandrene: {
        description: 'Minty/citrus aroma; found in eucalyptus and water fennel.',
        primaryEffects: ['Energizing', 'Uplifting'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Easily absorbed through skin. Used in traditional medicine for digestive issues.',
    },
    Cedrol: {
        description: 'Woody/cedar aroma; found in cedar wood oil.',
        primaryEffects: ['Sedating', 'Relaxing'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Shown to lower heart rate and blood pressure in inhalation studies.',
    },
    Citral: {
        description: 'Strong lemon aroma; found in lemongrass and lemon myrtle.',
        primaryEffects: ['Anti-Inflammatory', 'Relaxing'],
        secondaryEffects: ['Pain Relief'],
        cbReceptorActivity: 'none',
        notes: 'Potent antimicrobial. Mixture of geranial and neral isomers.',
    },
    Farnesene: {
        description: 'Green apple/woody aroma; found in apple skin and hops.',
        primaryEffects: ['Relaxing', 'Anti-Anxiety'],
        secondaryEffects: [],
        cbReceptorActivity: 'none',
        notes: 'Sesquiterpene with calming properties. Limited pharmacological data in cannabis.',
    },
    Isopulegol: {
        description: 'Minty/cooling aroma; precursor to menthol.',
        primaryEffects: ['Anti-Anxiety', 'Relaxing'],
        secondaryEffects: ['Antiemetic'],
        cbReceptorActivity: 'none',
        notes: 'Gastroprotective in animal models. Anxiolytic effects demonstrated in rodent studies.',
    },
}

// ---------------------------------------------------------------------------
// Typical terpene profiles derived from dominant-terpene data
// Used when a strain has no explicit terpeneProfile set
// ---------------------------------------------------------------------------

const TYPICAL_TERPENE_PERCENT: Record<TerpeneName, { solo: number; secondary: number }> = {
    Myrcene: { solo: 0.65, secondary: 0.2 },
    Limonene: { solo: 0.55, secondary: 0.15 },
    Caryophyllene: { solo: 0.4, secondary: 0.15 },
    Pinene: { solo: 0.25, secondary: 0.1 },
    Linalool: { solo: 0.35, secondary: 0.1 },
    Terpinolene: { solo: 0.45, secondary: 0.12 },
    Humulene: { solo: 0.25, secondary: 0.08 },
    Ocimene: { solo: 0.3, secondary: 0.08 },
    Bisabolol: { solo: 0.2, secondary: 0.06 },
    Valencene: { solo: 0.15, secondary: 0.05 },
    Geraniol: { solo: 0.1, secondary: 0.04 },
    Guaiol: { solo: 0.1, secondary: 0.03 },
    Camphene: { solo: 0.08, secondary: 0.03 },
    Nerolidol: { solo: 0.12, secondary: 0.04 },
    Phytol: { solo: 0.08, secondary: 0.02 },
    Eucalyptol: { solo: 0.15, secondary: 0.05 },
    Borneol: { solo: 0.1, secondary: 0.03 },
    Sabinene: { solo: 0.08, secondary: 0.03 },
    Terpineol: { solo: 0.12, secondary: 0.04 },
    Fenchol: { solo: 0.06, secondary: 0.02 },
    Pulegone: { solo: 0.05, secondary: 0.02 },
    Carene: { solo: 0.1, secondary: 0.03 },
    Phellandrene: { solo: 0.08, secondary: 0.03 },
    Cedrol: { solo: 0.06, secondary: 0.02 },
    Citral: { solo: 0.1, secondary: 0.04 },
    Farnesene: { solo: 0.08, secondary: 0.03 },
    Isopulegol: { solo: 0.06, secondary: 0.02 },
}

/**
 * Derives a quantitative terpene profile from a qualitative dominantTerpenes list.
 * The first terpene gets ~solo%, subsequent ones get ~secondary% each.
 * Returns null if the input list is empty.
 */
export function deriveTerpeneProfile(dominantTerpenes: string[]): Record<string, number> | null {
    if (!dominantTerpenes.length) return null
    const profile: Record<string, number> = {}
    dominantTerpenes.forEach((name, i) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const entry = TYPICAL_TERPENE_PERCENT[name as TerpeneName]
        if (entry) {
            profile[name] = i === 0 ? entry.solo : entry.secondary
        } else {
            // Unknown terpene — assign a conservative 0.15 %
            profile[name] = i === 0 ? 0.3 : 0.12
        }
    })
    return profile
}

// ---------------------------------------------------------------------------
// Entourage effect analysis
// ---------------------------------------------------------------------------

export interface EntourageInput {
    thc: number // % dry weight
    cbd: number // %
    cbg?: number // %
    terpeneProfile: Record<string, number>
}

export interface EntourageSynergy {
    terpene: string
    cannabinoid: string
    effect: string
    strength: 'strong' | 'moderate' | 'mild'
    citation: string
}

export interface EntourageResult {
    /** Top predicted effects, sorted by predicted intensity */
    predictedEffects: { tag: EffectTag; score: number }[]
    /** Notable terpene–cannabinoid synergies */
    synergies: EntourageSynergy[]
    /** Human-readable profile label */
    profileLabel: string
    /** Brief summary paragraph */
    summary: string
    /** Dominant terpene name and its description */
    dominantTerpene: { name: string; description: string } | null
    /** Total terpene content (%) */
    totalTerpenePercent: number
    /** Ratio THC:CBD */
    thcCbdRatio: string
}

type EffectScores = Partial<Record<EffectTag, number>>

const addEffectScore = (scores: EffectScores, tag: EffectTag, delta: number): void => {
    scores[tag] = (scores[tag] ?? 0) + delta
}

const deriveTerpeneScores = (
    terpeneProfile: Record<string, number>,
): {
    effectScores: EffectScores
    totalTerpenePercent: number
    dominantTerpene: { name: string; description: string } | null
} => {
    const effectScores: EffectScores = {}
    let totalTerpenePercent = 0
    let dominantTerpene: { name: string; description: string } | null = null
    let maxTerpenePercent = 0

    for (const [name, pct] of Object.entries(terpeneProfile)) {
        if (pct <= 0) continue
        totalTerpenePercent += pct
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const entry = TERPENE_DB[name as TerpeneName]
        if (!entry) continue

        if (pct > maxTerpenePercent) {
            maxTerpenePercent = pct
            dominantTerpene = { name, description: entry.description }
        }

        entry.primaryEffects.forEach((effect) => addEffectScore(effectScores, effect, pct * 2.0))
        entry.secondaryEffects.forEach((effect) => addEffectScore(effectScores, effect, pct * 0.6))
    }

    return { effectScores, totalTerpenePercent, dominantTerpene }
}

const applyCannabinoidContribution = (
    effectScores: EffectScores,
    thc: number,
    cbd: number,
    cbg: number,
): void => {
    if (thc >= 15) {
        addEffectScore(effectScores, 'Euphoric', thc * 0.15)
        addEffectScore(effectScores, 'Relaxing', thc * 0.08)
        addEffectScore(effectScores, 'Appetite Stimulating', thc * 0.05)
    }
    if (thc >= 20) {
        addEffectScore(effectScores, 'Sedating', thc * 0.05)
    }

    if (cbd >= 1) {
        addEffectScore(effectScores, 'Anti-Anxiety', cbd * 0.2)
        addEffectScore(effectScores, 'Pain Relief', cbd * 0.15)
        addEffectScore(effectScores, 'Anti-Inflammatory', cbd * 0.12)
    }

    if (cbg >= 0.5) {
        addEffectScore(effectScores, 'Focusing', cbg * 0.25)
        addEffectScore(effectScores, 'Neuroprotective', cbg * 0.2)
    }
}

const deriveSynergies = (
    terpeneProfile: Record<string, number>,
    thc: number,
    cbd: number,
): EntourageSynergy[] => {
    const synergies: EntourageSynergy[] = []

    if ((terpeneProfile['Myrcene'] ?? 0) > 0.3 && thc >= 15) {
        synergies.push({
            terpene: 'Myrcene',
            cannabinoid: 'THC',
            effect: 'Enhanced sedation via BBB permeability increase',
            strength: 'strong',
            citation: 'Russo (2019)',
        })
    }
    if ((terpeneProfile['Limonene'] ?? 0) > 0.2 && cbd >= 2) {
        synergies.push({
            terpene: 'Limonene',
            cannabinoid: 'CBD',
            effect: 'Improved CBD oral bioavailability + mood elevation',
            strength: 'moderate',
            citation: 'Ferber et al. (2020)',
        })
    }
    if ((terpeneProfile['Caryophyllene'] ?? 0) > 0.2) {
        synergies.push({
            terpene: 'Caryophyllene',
            cannabinoid: 'CBD',
            effect: 'CB2 agonism amplifies CBD anti-inflammatory pathway',
            strength: 'strong',
            citation: 'Gertsch et al. (2008)',
        })
    }
    if ((terpeneProfile['Pinene'] ?? 0) > 0.15 && thc >= 18) {
        synergies.push({
            terpene: 'Pinene',
            cannabinoid: 'THC',
            effect: 'Counteracts short-term memory impairment via AChE inhibition',
            strength: 'moderate',
            citation: 'McPartland & Russo (2001)',
        })
    }
    if ((terpeneProfile['Linalool'] ?? 0) > 0.2 && cbd >= 1) {
        synergies.push({
            terpene: 'Linalool',
            cannabinoid: 'CBD',
            effect: 'Synergistic GABAergic sedation; anticonvulsant potential',
            strength: 'strong',
            citation: 'Russo (2019)',
        })
    }

    return synergies
}

const getProfileLabel = (effectScores: EffectScores, topEffect: EffectTag | undefined): string => {
    if (topEffect === 'Sedating' || topEffect === 'Relaxing') return 'Indica-type sedating'
    if (topEffect === 'Energizing' || topEffect === 'Creative' || topEffect === 'Uplifting') {
        return 'Sativa-type energising'
    }
    if ((effectScores['Pain Relief'] ?? 0) > 2) return 'Analgesic / medical focus'
    if ((effectScores['Anti-Anxiety'] ?? 0) > 2) return 'Anxiolytic focus'
    return 'Balanced profile'
}

const buildSummary = (
    thcCbdRatio: string,
    dominantTerpene: { name: string; description: string } | null,
    sortedEffects: { tag: EffectTag; score: number }[],
    synergies: EntourageSynergy[],
): string => {
    const topEffectNames = sortedEffects
        .slice(0, 3)
        .map((effect) => effect.tag)
        .join(', ')
    const dominantTerpeneSummary = dominantTerpene
        ? `Dominant terpene: ${dominantTerpene.name} - ${dominantTerpene.description} `
        : ''
    const leadSynergySummary =
        synergies.length > 0 && synergies[0]
            ? `Key synergy: ${synergies[0].terpene}×${synergies[0].cannabinoid} - ${synergies[0].effect}.`
            : ''
    return (
        `THC:CBD ratio ${thcCbdRatio}. ` +
        dominantTerpeneSummary +
        `Top predicted effects: ${topEffectNames}. ` +
        leadSynergySummary
    )
}

class EntourageService {
    public analyse(input: EntourageInput): EntourageResult {
        const { thc, cbd, cbg = 0, terpeneProfile } = input

        const { effectScores, totalTerpenePercent, dominantTerpene } =
            deriveTerpeneScores(terpeneProfile)
        applyCannabinoidContribution(effectScores, thc, cbd, cbg)
        const synergies = deriveSynergies(terpeneProfile, thc, cbd)

        // --- Sort effects ----------------------------------------------------
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const sortedEffects = (Object.entries(effectScores) as [EffectTag, number][])
            .toSorted((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag, score]) => ({ tag, score }))

        // --- Profile label ---------------------------------------------------
        const top = sortedEffects[0]?.tag
        let thcCbdRatio = 'CBD:THC dominant'
        if (cbd > 0.1) {
            thcCbdRatio = `${(thc / cbd).toFixed(1)}:1`
        } else if (thc > 5) {
            thcCbdRatio = '∞:1 (CBD trace)'
        }
        const profileLabel = getProfileLabel(effectScores, top)
        const summary = buildSummary(thcCbdRatio, dominantTerpene, sortedEffects, synergies)

        return {
            predictedEffects: sortedEffects,
            synergies: synergies.slice(0, 3),
            profileLabel,
            summary,
            dominantTerpene,
            totalTerpenePercent,
            thcCbdRatio,
        }
    }
}

export const entourageService = new EntourageService()
