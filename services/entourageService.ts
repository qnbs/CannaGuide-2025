/**
 * Entourage Effect Simulator
 *
 * Scientific basis:
 *  - Russo (2019). "The Case for the Entourage Effect and Conventional Breeding
 *    of Clinical Cannabis: No 'Strain', No Gain." Front. Plant Sci. 9: 1969.
 *  - Ferber et al. (2020). "Modulation of the Endocannabinoid System by Terpenes
 *    …" Cannabis Cannabinoid Res. 5(3): 197-203.
 *  - McPartland & Russo (2001). "Cannabis and Cannabis Extracts: Greater Than
 *    the Sum of Their Parts?" J. Cannabis Ther. 1(3-4): 103-132.
 *  - Cuttler et al. (2021). "Blunted stress reactivity in chronic cannabis users."
 *    Psychopharmacology 238: 2025-2034.
 *  - Batiha et al. (2021). "The Pharmacological Activity, Biochemical Properties,
 *    and Pharmacokinetics of the Major Natural Polyphenolic Flavonoid: Quercetin."
 *    Foods 9(3): 374.
 */

import type { TerpeneName, EffectTag } from '@/types';

// ---------------------------------------------------------------------------
// Terpene effect database (evidence-graded)
// ---------------------------------------------------------------------------

interface TerpeneEntry {
    /** Short pharmacological description for display */
    description: string;
    /** Primary effect tags (high confidence from multiple studies) */
    primaryEffects: EffectTag[];
    /** Secondary / context-dependent effects */
    secondaryEffects: EffectTag[];
    /** Whether it acts on endocannabinoid receptors directly */
    cbReceptorActivity: 'none' | 'CB1' | 'CB2' | 'both';
    /** Notes for UI tooltip */
    notes: string;
}

export const TERPENE_DB: Record<TerpeneName, TerpeneEntry> = {
    Myrcene: {
        description: 'Most abundant cannabis terpene; earthy/musky/herbal aroma.',
        primaryEffects: ['Relaxing', 'Sedating', 'Pain Relief'],
        secondaryEffects: ['Appetite Stimulating', 'Anti-Inflammatory'],
        cbReceptorActivity: 'CB1',
        notes:
            'Myrcene increases permeability of the blood-brain barrier, potentiating THC uptake (Russo 2019). Known as the "couch-lock" terpene above 0.5 % concentration.',
    },
    Limonene: {
        description: 'Citrus aroma; common in sativas and sativa-dominant hybrids.',
        primaryEffects: ['Uplifting', 'Euphoric', 'Anti-Anxiety'],
        secondaryEffects: ['Focusing', 'Anti-Inflammatory'],
        cbReceptorActivity: 'none',
        notes:
            'Elevates mood via serotonin and dopamine modulation. Synergises with CBD to enhance oral bioavailability (Ferber 2020).',
    },
    Caryophyllene: {
        description: 'Peppery/spicy aroma. Only terpene that directly activates CB2 receptors.',
        primaryEffects: ['Pain Relief', 'Anti-Inflammatory', 'Anti-Anxiety'],
        secondaryEffects: ['Neuroprotective'],
        cbReceptorActivity: 'CB2',
        notes:
            'Unique among terpenes: acts as a full CB2 agonist (Gertsch 2008). Particularly valuable in CBD-dominant and high-THC medical cultivars.',
    },
    Pinene: {
        description: 'Pine/fir forest aroma. α-Pinene is the most common terpene in nature.',
        primaryEffects: ['Focusing', 'Energizing', 'Uplifting'],
        secondaryEffects: ['Anti-Inflammatory', 'Neuroprotective'],
        cbReceptorActivity: 'none',
        notes:
            'Acetylcholinesterase inhibitor — counteracts THC-induced short-term memory impairment (McPartland & Russo 2001). Bronchodilator effect supports respiratory delivery.',
    },
    Linalool: {
        description: 'Floral/lavender aroma; calming profile similar to aromatherapy lavender.',
        primaryEffects: ['Sedating', 'Anti-Anxiety', 'Antispasmodic'],
        secondaryEffects: ['Pain Relief', 'Antiemetic'],
        cbReceptorActivity: 'none',
        notes:
            'GABA-A receptor modulation (Russo 2019). Strong synergy with CBD for anticonvulsant and anxiolytic effects.',
    },
    Terpinolene: {
        description: 'Complex floral/herbal/fresh aroma; dominated by sativa varieties.',
        primaryEffects: ['Uplifting', 'Energizing', 'Creative'],
        secondaryEffects: ['Anti-Anxiety'],
        cbReceptorActivity: 'none',
        notes:
            'Produces the characteristic "head-high" sativa sensation. Acts as antioxidant and mild sedative at high concentrations in animal studies.',
    },
    Humulene: {
        description: 'Earthy/hoppy aroma (hops are high in humulene); found in many indicas.',
        primaryEffects: ['Appetite Suppressing', 'Anti-Inflammatory'],
        secondaryEffects: ['Pain Relief'],
        cbReceptorActivity: 'none',
        notes:
            'Anti-obesity properties in rodent studies. Counteracts typical THC-induced appetite increase — relevant for medical patients monitoring weight.',
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
        notes: 'Neuroprotective in Parkinson\'s disease models. Antioxidant and antibacterial.',
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
};

// ---------------------------------------------------------------------------
// Typical terpene profiles derived from dominant-terpene data
// Used when a strain has no explicit terpeneProfile set
// ---------------------------------------------------------------------------

const TYPICAL_TERPENE_PERCENT: Record<TerpeneName, { solo: number; secondary: number }> = {
    Myrcene:       { solo: 0.65, secondary: 0.20 },
    Limonene:      { solo: 0.55, secondary: 0.15 },
    Caryophyllene: { solo: 0.40, secondary: 0.15 },
    Pinene:        { solo: 0.25, secondary: 0.10 },
    Linalool:      { solo: 0.35, secondary: 0.10 },
    Terpinolene:   { solo: 0.45, secondary: 0.12 },
    Humulene:      { solo: 0.25, secondary: 0.08 },
    Ocimene:       { solo: 0.30, secondary: 0.08 },
    Bisabolol:     { solo: 0.20, secondary: 0.06 },
    Valencene:     { solo: 0.15, secondary: 0.05 },
    Geraniol:      { solo: 0.10, secondary: 0.04 },
    Guaiol:        { solo: 0.10, secondary: 0.03 },
    Camphene:      { solo: 0.08, secondary: 0.03 },
    Nerolidol:     { solo: 0.12, secondary: 0.04 },
    Phytol:        { solo: 0.08, secondary: 0.02 },
};

/**
 * Derives a quantitative terpene profile from a qualitative dominantTerpenes list.
 * The first terpene gets ~solo%, subsequent ones get ~secondary% each.
 * Returns null if the input list is empty.
 */
export function deriveTerpeneProfile(dominantTerpenes: string[]): Record<string, number> | null {
    if (!dominantTerpenes.length) return null;
    const profile: Record<string, number> = {};
    dominantTerpenes.forEach((name, i) => {
        const entry = TYPICAL_TERPENE_PERCENT[name as TerpeneName];
        if (entry) {
            profile[name] = i === 0 ? entry.solo : entry.secondary;
        } else {
            // Unknown terpene — assign a conservative 0.15 %
            profile[name] = i === 0 ? 0.30 : 0.12;
        }
    });
    return profile;
}

// ---------------------------------------------------------------------------
// Entourage effect analysis
// ---------------------------------------------------------------------------

export interface EntourageInput {
    thc: number;       // % dry weight
    cbd: number;       // %
    cbg?: number;      // %
    terpeneProfile: Record<string, number>;
}

export interface EntourageSynergy {
    terpene: string;
    cannabinoid: string;
    effect: string;
    strength: 'strong' | 'moderate' | 'mild';
    citation: string;
}

export interface EntourageResult {
    /** Top predicted effects, sorted by predicted intensity */
    predictedEffects: { tag: EffectTag; score: number }[];
    /** Notable terpene–cannabinoid synergies */
    synergies: EntourageSynergy[];
    /** Human-readable profile label */
    profileLabel: string;
    /** Brief summary paragraph */
    summary: string;
    /** Dominant terpene name and its description */
    dominantTerpene: { name: string; description: string } | null;
    /** Total terpene content (%) */
    totalTerpenePercent: number;
    /** Ratio THC:CBD */
    thcCbdRatio: string;
}

class EntourageService {
    public analyse(input: EntourageInput): EntourageResult {
        const { thc, cbd, cbg = 0, terpeneProfile } = input;

        // --- Terpene scores --------------------------------------------------
        const effectScores: Partial<Record<EffectTag, number>> = {};
        let totalTerpenePercent = 0;
        let dominantTerpene: { name: string; description: string } | null = null;
        let maxTerpenePercent = 0;

        for (const [name, pct] of Object.entries(terpeneProfile)) {
            if (pct <= 0) continue;
            totalTerpenePercent += pct;
            const entry = TERPENE_DB[name as TerpeneName];
            if (!entry) continue;

            if (pct > maxTerpenePercent) {
                maxTerpenePercent = pct;
                dominantTerpene = { name, description: entry.description };
            }

            // Weight primary effects heavily, secondary lightly
            entry.primaryEffects.forEach(e => {
                effectScores[e] = (effectScores[e] ?? 0) + pct * 2.0;
            });
            entry.secondaryEffects.forEach(e => {
                effectScores[e] = (effectScores[e] ?? 0) + pct * 0.6;
            });
        }

        // --- Cannabinoid contribution ----------------------------------------
        // THC → euphoria, appetite, relaxing
        if (thc >= 15) {
            effectScores['Euphoric'] = (effectScores['Euphoric'] ?? 0) + thc * 0.15;
            effectScores['Relaxing'] = (effectScores['Relaxing'] ?? 0) + thc * 0.08;
            effectScores['Appetite Stimulating'] = (effectScores['Appetite Stimulating'] ?? 0) + thc * 0.05;
        }
        if (thc >= 20) {
            // High-THC amplifies all terpene sedation effects
            effAdjust(effectScores, 'Sedating', thc * 0.05);
        }

        // CBD → anxiety relief, pain, anti-inflammatory
        if (cbd >= 1) {
            effectScores['Anti-Anxiety'] = (effectScores['Anti-Anxiety'] ?? 0) + cbd * 0.20;
            effectScores['Pain Relief'] = (effectScores['Pain Relief'] ?? 0) + cbd * 0.15;
            effectScores['Anti-Inflammatory'] = (effectScores['Anti-Inflammatory'] ?? 0) + cbd * 0.12;
        }

        // CBG → neuroprotective, focusing
        if (cbg >= 0.5) {
            effectScores['Focusing'] = (effectScores['Focusing'] ?? 0) + cbg * 0.25;
            effectScores['Neuroprotective'] = (effectScores['Neuroprotective'] ?? 0) + cbg * 0.20;
        }

        // --- Synergies -------------------------------------------------------
        const synergies: EntourageSynergy[] = [];
        const tp = terpeneProfile;

        if ((tp['Myrcene'] ?? 0) > 0.3 && thc >= 15) {
            synergies.push({
                terpene: 'Myrcene', cannabinoid: 'THC',
                effect: 'Enhanced sedation via BBB permeability increase',
                strength: 'strong', citation: 'Russo (2019)',
            });
        }
        if ((tp['Limonene'] ?? 0) > 0.2 && cbd >= 2) {
            synergies.push({
                terpene: 'Limonene', cannabinoid: 'CBD',
                effect: 'Improved CBD oral bioavailability + mood elevation',
                strength: 'moderate', citation: 'Ferber et al. (2020)',
            });
        }
        if ((tp['Caryophyllene'] ?? 0) > 0.2) {
            synergies.push({
                terpene: 'Caryophyllene', cannabinoid: 'CBD',
                effect: 'CB2 agonism amplifies CBD anti-inflammatory pathway',
                strength: 'strong', citation: 'Gertsch et al. (2008)',
            });
        }
        if ((tp['Pinene'] ?? 0) > 0.15 && thc >= 18) {
            synergies.push({
                terpene: 'Pinene', cannabinoid: 'THC',
                effect: 'Counteracts short-term memory impairment via AChE inhibition',
                strength: 'moderate', citation: 'McPartland & Russo (2001)',
            });
        }
        if ((tp['Linalool'] ?? 0) > 0.2 && cbd >= 1) {
            synergies.push({
                terpene: 'Linalool', cannabinoid: 'CBD',
                effect: 'Synergistic GABAergic sedation; anticonvulsant potential',
                strength: 'strong', citation: 'Russo (2019)',
            });
        }

        // --- Sort effects ----------------------------------------------------
        const sortedEffects = (Object.entries(effectScores) as [EffectTag, number][])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([tag, score]) => ({ tag, score }));

        // --- Profile label ---------------------------------------------------
        let profileLabel = 'Balanced profile';
        const top = sortedEffects[0]?.tag;
        const thcCbdRatio = cbd > 0.1
            ? `${(thc / cbd).toFixed(1)}:1`
            : thc > 5 ? '∞:1 (CBD trace)' : 'CBD:THC dominant';

        if (top === 'Sedating' || top === 'Relaxing') profileLabel = 'Indica-type sedating';
        else if (top === 'Energizing' || top === 'Creative' || top === 'Uplifting') profileLabel = 'Sativa-type energising';
        else if ((effectScores['Pain Relief'] ?? 0) > 2) profileLabel = 'Analgesic / medical focus';
        else if ((effectScores['Anti-Anxiety'] ?? 0) > 2) profileLabel = 'Anxiolytic focus';

        // --- Summary ---------------------------------------------------------
        const topEffectNames = sortedEffects.slice(0, 3).map(e => e.tag).join(', ');
        const summary =
            `THC:CBD ratio ${thcCbdRatio}. ` +
            (dominantTerpene ? `Dominant terpene: ${dominantTerpene.name} — ${dominantTerpene.description} ` : '') +
            `Top predicted effects: ${topEffectNames}. ` +
            (synergies.length > 0
                ? `Key synergy: ${synergies[0].terpene}×${synergies[0].cannabinoid} – ${synergies[0].effect}.`
                : '');

        return {
            predictedEffects: sortedEffects,
            synergies: synergies.slice(0, 3),
            profileLabel,
            summary,
            dominantTerpene,
            totalTerpenePercent,
            thcCbdRatio,
        };
    }
}

function effAdjust(
    scores: Partial<Record<EffectTag, number>>,
    tag: EffectTag,
    delta: number,
) {
    scores[tag] = (scores[tag] ?? 0) + delta;
}

export const entourageService = new EntourageService();
