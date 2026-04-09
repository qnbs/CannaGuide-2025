/**
 * Nutrient Deficiency Decision Tree
 *
 * Interactive step-by-step visual diagnosis based on the
 * 'Visual Tissue Assessment' pattern. Pure rule logic -- no ML models.
 *
 * Tree structure:
 *   Root: "Older/lower leaves affected?"
 *     Yes -> mobile nutrients (N, P, K, Mg, Mo, Cl)
 *     No  -> immobile nutrients (Fe, Mn, Ca)
 *
 * Public API:
 *   - getStartNode()           -> DiagnosisNode
 *   - getNode(id)              -> DiagnosisNode | DeficiencyResult | undefined
 *   - isResult(node)           -> node is DeficiencyResult
 *   - getAllDeficiencyIds()     -> string[]
 *   - getMaxDepth()            -> number (for progress estimation)
 */

// ---------------------------------------------------------------------------
// Types (local -- only used by this service + wizard component)
// ---------------------------------------------------------------------------

export interface DiagnosisNode {
    readonly id: string
    /** i18n key under nutrientWizard.questions.* */
    readonly questionKey: string
    readonly yesNodeId: string
    readonly noNodeId: string
}

export interface DeficiencyResult {
    readonly id: string
    /** Maps to diseases.ts entry id */
    readonly deficiencyId: string
    readonly symptomKeys: readonly string[]
    readonly treatmentKeys: readonly string[]
    readonly severity: 'mild' | 'moderate' | 'severe'
}

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isResult(
    node: DiagnosisNode | DeficiencyResult | undefined,
): node is DeficiencyResult {
    return node !== undefined && 'deficiencyId' in node
}

// ---------------------------------------------------------------------------
// Decision tree data
// ---------------------------------------------------------------------------

const nodes = new Map<string, DiagnosisNode | DeficiencyResult>()

// ---- Decision nodes -------------------------------------------------------

const q: DiagnosisNode[] = [
    {
        id: 'root',
        questionKey: 'olderLeavesAffected',
        yesNodeId: 'mobile-general',
        noNodeId: 'immobile-chlorosis',
    },
    {
        id: 'mobile-general',
        questionKey: 'generalYellowing',
        yesNodeId: 'mobile-yellow-detail',
        noNodeId: 'mobile-no-yellow',
    },
    {
        id: 'mobile-yellow-detail',
        questionKey: 'darkGreenToViolet',
        yesNodeId: 'result-phosphorus',
        noNodeId: 'mobile-pale-green',
    },
    {
        id: 'mobile-pale-green',
        questionKey: 'paleGreenNoSpots',
        yesNodeId: 'result-nitrogen',
        noNodeId: 'result-molybdenum',
    },
    {
        id: 'mobile-no-yellow',
        questionKey: 'interveinalChlorosis',
        yesNodeId: 'result-magnesium',
        noNodeId: 'mobile-edge-burn',
    },
    {
        id: 'mobile-edge-burn',
        questionKey: 'leafEdgeBurn',
        yesNodeId: 'result-potassium',
        noNodeId: 'result-chlorine',
    },
    {
        id: 'immobile-chlorosis',
        questionKey: 'newLeafChlorosis',
        yesNodeId: 'immobile-iron-or-mn',
        noNodeId: 'result-calcium',
    },
    {
        id: 'immobile-iron-or-mn',
        questionKey: 'veinsStayGreen',
        yesNodeId: 'result-iron',
        noNodeId: 'result-manganese',
    },
]

// ---- Deficiency results ---------------------------------------------------

const r: DeficiencyResult[] = [
    {
        id: 'result-nitrogen',
        deficiencyId: 'nitrogen-deficiency',
        symptomKeys: ['nitrogen.s1', 'nitrogen.s2', 'nitrogen.s3'],
        treatmentKeys: ['nitrogen.t1', 'nitrogen.t2'],
        severity: 'moderate',
    },
    {
        id: 'result-phosphorus',
        deficiencyId: 'phosphorus-deficiency',
        symptomKeys: ['phosphorus.s1', 'phosphorus.s2', 'phosphorus.s3'],
        treatmentKeys: ['phosphorus.t1', 'phosphorus.t2'],
        severity: 'moderate',
    },
    {
        id: 'result-potassium',
        deficiencyId: 'potassium-deficiency',
        symptomKeys: ['potassium.s1', 'potassium.s2', 'potassium.s3'],
        treatmentKeys: ['potassium.t1', 'potassium.t2'],
        severity: 'moderate',
    },
    {
        id: 'result-magnesium',
        deficiencyId: 'magnesium-deficiency',
        symptomKeys: ['magnesium.s1', 'magnesium.s2'],
        treatmentKeys: ['magnesium.t1', 'magnesium.t2'],
        severity: 'mild',
    },
    {
        id: 'result-calcium',
        deficiencyId: 'calcium-deficiency',
        symptomKeys: ['calcium.s1', 'calcium.s2', 'calcium.s3'],
        treatmentKeys: ['calcium.t1', 'calcium.t2'],
        severity: 'moderate',
    },
    {
        id: 'result-iron',
        deficiencyId: 'iron-deficiency',
        symptomKeys: ['iron.s1', 'iron.s2'],
        treatmentKeys: ['iron.t1', 'iron.t2'],
        severity: 'moderate',
    },
    {
        id: 'result-manganese',
        deficiencyId: 'manganese-deficiency',
        symptomKeys: ['manganese.s1', 'manganese.s2'],
        treatmentKeys: ['manganese.t1', 'manganese.t2'],
        severity: 'mild',
    },
    {
        id: 'result-molybdenum',
        deficiencyId: 'molybdenum-deficiency',
        symptomKeys: ['molybdenum.s1', 'molybdenum.s2'],
        treatmentKeys: ['molybdenum.t1'],
        severity: 'mild',
    },
    {
        id: 'result-chlorine',
        deficiencyId: 'chlorine-deficiency',
        symptomKeys: ['chlorine.s1', 'chlorine.s2'],
        treatmentKeys: ['chlorine.t1'],
        severity: 'mild',
    },
]

// Populate map
for (const n of q) nodes.set(n.id, n)
for (const res of r) nodes.set(res.id, res)

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Return the root question node. */
export function getStartNode(): DiagnosisNode {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return nodes.get('root') as DiagnosisNode
}

/** Look up any node or result by id. */
export function getNode(id: string): DiagnosisNode | DeficiencyResult | undefined {
    return nodes.get(id)
}

/** List all deficiency result ids (useful for validation). */
export function getAllDeficiencyIds(): string[] {
    return r.map((res) => res.deficiencyId)
}

/** Maximum tree depth (for progress estimation in the wizard). */
export function getMaxDepth(): number {
    // Longest path: root -> mobile-general -> mobile-yellow-detail -> mobile-pale-green -> result = 4 steps
    return 4
}
